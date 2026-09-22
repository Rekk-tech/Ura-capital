import { AppError } from "../../shared/errors/error-envelope.js";
import { ERROR_CODES, HTTP_STATUS } from "@aura/shared";
import {
  SUBSCRIPTION_PLANS,
  SUBSCRIPTION_STATUSES,
  type ISubscriptionRepository,
  type SubscriptionPlan,
  type SubscriptionStatus,
} from "./subscription.types.js";
import {
  getEntitlementsForPlan,
} from "./plan-catalog.js";
import {
  systemClock,
  type Clock,
  type EffectiveSubscriptionStatus,
  type EntitlementContext,
  type IEntitlementResolver,
} from "./subscription-entitlement.types.js";
import type { EntitlementKey } from "./plan-catalog.types.js";

export class SubscriptionEntitlementService implements IEntitlementResolver {
  private readonly subscriptionRepo: ISubscriptionRepository;
  private readonly clock: Clock;

  constructor(
    subscriptionRepo: ISubscriptionRepository,
    clock: Clock = systemClock,
  ) {
    this.subscriptionRepo = subscriptionRepo;
    this.clock = clock;
  }

  /**
   * Resolves the user's effective entitlement context using PostgreSQL state,
   * server-owned plan catalog, and server-controlled clock.
   *
   * Enforces D2..D5, D9, FR-004..FR-009, and AC-005..AC-014.
   */
  async resolveUserEntitlement(userId: string): Promise<EntitlementContext> {
    if (!userId || typeof userId !== "string" || userId.trim() === "") {
      throw new AppError(
        "Invalid user identifier for entitlement resolution",
        ERROR_CODES.VALIDATION_ERROR,
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    const now = this.clock.now();

    // 1. Retrieve non-terminal subscription facts from PostgreSQL
    let subscription;
    try {
      subscription = await this.subscriptionRepo.findActiveByUserId(userId);
    } catch (error) {
      // Fail closed on repository or infrastructure error (FR-009, AC-013)
      const sanitizedMessage =
        error instanceof Error ? error.message : "Unknown repository failure";
      console.error("[EntitlementService] Repository failure during resolution", {
        userId,
        error: sanitizedMessage,
      });
      throw new AppError(
        "Failed to resolve subscription entitlement due to persistence error",
        ERROR_CODES.INTERNAL_ERROR,
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
      );
    }

    // 2. Missing subscription record semantics -> FREE with zero entitlements (FR-004, AC-006)
    if (!subscription) {
      return Object.freeze({
        userId,
        planKey: "FREE" as SubscriptionPlan,
        status: "NONE" as EffectiveSubscriptionStatus,
        entitlements: Object.freeze([]) as readonly EntitlementKey[],
        isEntitled: false,
        currentPeriodStart: null,
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
        evaluatedAt: now,
      });
    }

    // 3. Durable state integrity validation (FR-009, AC-014)
    const rawPlan = subscription.planKey;
    const rawStatus = subscription.status;
    const periodStart = subscription.currentPeriodStart;
    const periodEnd = subscription.currentPeriodEnd;

    const isPlanApproved = SUBSCRIPTION_PLANS.includes(rawPlan as SubscriptionPlan);
    const isStatusApproved = SUBSCRIPTION_STATUSES.includes(rawStatus as SubscriptionStatus);
    const isPeriodStartValid = periodStart instanceof Date && !isNaN(periodStart.getTime());
    const isPeriodEndValid = periodEnd instanceof Date && !isNaN(periodEnd.getTime());
    const isPeriodBoundsValid =
      isPeriodStartValid && isPeriodEndValid && periodStart.getTime() <= periodEnd.getTime();

    if (!isPlanApproved || !isStatusApproved || !isPeriodBoundsValid) {
      // Treat as data integrity violation, log sanitized diagnostics (zero secrets/provider IDs), and fail closed
      console.error("[EntitlementService] Invalid subscription durable state detected", {
        userId,
        subscriptionId: subscription.id,
        isPlanApproved,
        isStatusApproved,
        isPeriodBoundsValid,
      });
      throw new AppError(
        "Invalid subscription durable state: failed integrity validation",
        ERROR_CODES.INTERNAL_ERROR,
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
      );
    }

    const planKey = rawPlan as SubscriptionPlan;
    const storedStatus = rawStatus as SubscriptionStatus;
    const cancelAtPeriodEnd = subscription.cancelAtPeriodEnd ?? false;

    // 4. Terminal State Handling (D5, AC-011)
    if (storedStatus === "CANCELLED") {
      return Object.freeze({
        userId,
        planKey,
        status: "CANCELLED" as EffectiveSubscriptionStatus,
        entitlements: Object.freeze([]) as readonly EntitlementKey[],
        isEntitled: false,
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
        cancelAtPeriodEnd,
        evaluatedAt: now,
      });
    }

    if (storedStatus === "EXPIRED") {
      return Object.freeze({
        userId,
        planKey,
        status: "EXPIRED" as EffectiveSubscriptionStatus,
        entitlements: Object.freeze([]) as readonly EntitlementKey[],
        isEntitled: false,
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
        cancelAtPeriodEnd,
        evaluatedAt: now,
      });
    }

    // 5. PAST_DUE Policy (D3 Locked: no premium access, no grace period, AC-009)
    if (storedStatus === "PAST_DUE") {
      return Object.freeze({
        userId,
        planKey,
        status: "PAST_DUE" as EffectiveSubscriptionStatus,
        entitlements: Object.freeze([]) as readonly EntitlementKey[],
        isEntitled: false,
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
        cancelAtPeriodEnd,
        evaluatedAt: now,
      });
    }

    // 6. Period Bounds Evaluation (AC-008, AC-011)
    // If current time is after or exactly at currentPeriodEnd: period has ended -> EXPIRED
    if (now.getTime() >= periodEnd.getTime()) {
      return Object.freeze({
        userId,
        planKey,
        status: "EXPIRED" as EffectiveSubscriptionStatus,
        entitlements: Object.freeze([]) as readonly EntitlementKey[],
        isEntitled: false,
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
        cancelAtPeriodEnd,
        evaluatedAt: now,
      });
    }

    // If current time is strictly before currentPeriodStart: not yet effective -> no entitlement
    if (now.getTime() < periodStart.getTime()) {
      return Object.freeze({
        userId,
        planKey,
        status: "ACTIVE" as EffectiveSubscriptionStatus,
        entitlements: Object.freeze([]) as readonly EntitlementKey[],
        isEntitled: false,
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
        cancelAtPeriodEnd,
        evaluatedAt: now,
      });
    }

    // 7. ACTIVE within valid period (D4, AC-007, AC-011)
    // If cancelAtPeriodEnd is true, it remains entitled until currentPeriodEnd (which was checked above)
    const mappedEntitlements = getEntitlementsForPlan(planKey);
    const isEntitled = mappedEntitlements.includes("PREMIUM_ACCESS");

    return Object.freeze({
      userId,
      planKey,
      status: "ACTIVE" as EffectiveSubscriptionStatus,
      entitlements: Object.freeze([...mappedEntitlements]),
      isEntitled,
      currentPeriodStart: periodStart,
      currentPeriodEnd: periodEnd,
      cancelAtPeriodEnd,
      evaluatedAt: now,
    });
  }
}
