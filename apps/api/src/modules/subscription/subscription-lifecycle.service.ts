import { ERROR_CODES, HTTP_STATUS } from "@aura/shared";
import { AppError } from "../../shared/errors/error-envelope.js";
import { logger } from "../../infrastructure/logging/logger.js";
import {
  type ISubscriptionRepository,
  type ISubscriptionTransitionRepository,
} from "./subscription.repository.js";
import {
  type ITransactionRunner,
  transactionRunner as defaultTransactionRunner,
} from "../../infrastructure/database/transaction-runner.js";
import {
  type ISubscriptionProvider,
  type ProviderSubscriptionSnapshot,
} from "./provider/subscription-provider.types.js";
import { createSubscriptionProvider } from "./provider/subscription-provider.factory.js";
import {
  type SubscriptionPlan,
  type SubscriptionStatus,
  type SubscriptionTransactionStrategy,
  TERMINAL_STATUSES,
} from "./subscription.types.js";
import type {
  CancelSubscriptionResponseDto,
  CheckoutSessionResponseDto,
} from "./subscription-lifecycle.dto.js";

export type ProviderResolver = (providerKey: string) => ISubscriptionProvider;

function compareSequences(incoming: string, existing: string): number {
  const incNum = Number(incoming);
  const extNum = Number(existing);
  if (!Number.isNaN(incNum) && !Number.isNaN(extNum)) {
    return incNum - extNum;
  }
  return incoming.localeCompare(existing, undefined, { numeric: true });
}

export class SubscriptionLifecycleService {
  constructor(
    private readonly subscriptionRepo: ISubscriptionRepository,
    private readonly transitionRepo: ISubscriptionTransitionRepository,
    private readonly txRunner: ITransactionRunner = defaultTransactionRunner,
    private readonly providerResolver: ProviderResolver = () => createSubscriptionProvider(),
  ) {}

  public get transitionRepository(): ISubscriptionTransitionRepository {
    return this.transitionRepo;
  }

  /**
   * Creates a provider-neutral checkout intent session in mock/dev/test environments.
   *
   * STRICT GUARANTEES:
   * - ZERO PostgreSQL database mutation.
   * - ZERO active subscription creation.
   * - ZERO entitlement grant before verified provider event processing.
   * - Provider outage returns a sanitized retryable 503 error.
   */
  async createCheckoutIntent(input: {
    userId: string;
    planKey?: string;
    requestId?: string;
    idempotencyKey?: string;
  }): Promise<CheckoutSessionResponseDto> {
    const requestedPlan = input.planKey ?? "PREMIUM";
    if (requestedPlan !== "PREMIUM") {
      throw new AppError(
        `Invalid subscription plan '${requestedPlan}'. Only 'PREMIUM' is available.`,
        ERROR_CODES.VALIDATION_ERROR,
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    let provider: ISubscriptionProvider;
    try {
      provider = this.providerResolver("MOCK");
    } catch {
      throw new AppError(
        "Subscription provider is unavailable",
        ERROR_CODES.SERVICE_UNAVAILABLE,
        HTTP_STATUS.SERVICE_UNAVAILABLE,
      );
    }

    const idempotencyKey =
      input.idempotencyKey ??
      `checkout_${input.userId}_${requestedPlan}_${input.requestId ?? "req"}`;

    try {
      const session = await provider.createCheckoutSession({
        requestId: input.requestId ?? "req_checkout",
        userId: input.userId,
        planKey: "PREMIUM",
        idempotencyKey,
      });

      return {
        checkoutReference: session.checkoutReference,
        state: session.state,
        expiresAt: session.expiresAt.toISOString(),
      };
    } catch (err: unknown) {
      if (err instanceof AppError) {
        throw err;
      }
      logger.error("Subscription provider error during checkout intent creation", {
        requestId: input.requestId,
        userId: input.userId,
        error: err instanceof Error ? err.message : String(err),
      });
      throw new AppError(
        "Subscription provider is temporarily unavailable. Please try again later.",
        ERROR_CODES.SERVICE_UNAVAILABLE,
        HTTP_STATUS.SERVICE_UNAVAILABLE,
      );
    }
  }

  /**
   * Requests cancellation of the authenticated user's current subscription.
   *
   * D5 SEMANTICS:
   * - Requests cancel-at-period-end with provider.
   * - Subscription remains ACTIVE and entitled until currentPeriodEnd.
   * - CANCELLED is reserved for provider-confirmed immediate cancellation.
   * - Terminal subscriptions (CANCELLED, EXPIRED) cannot be cancelled or revived.
   * - Repeated requests are idempotent and safely replay current state.
   * - Provider failure returns sanitized 503 with ZERO local database mutation.
   */
  async cancelSubscription(input: {
    userId: string;
    reason?: string;
    requestId?: string;
    idempotencyKey?: string;
  }): Promise<CancelSubscriptionResponseDto> {
    const activeSub = await this.subscriptionRepo.findActiveByUserId(input.userId);

    if (!activeSub) {
      const allSubs = await this.subscriptionRepo.findAllByUserId(input.userId);
      const terminalSub = allSubs.find((s) => TERMINAL_STATUSES.includes(s.status as SubscriptionStatus));
      if (terminalSub) {
        throw new AppError(
          `Subscription is in a terminal state (${terminalSub.status}) and cannot be cancelled`,
          ERROR_CODES.CONFLICT,
          HTTP_STATUS.CONFLICT,
        );
      }

      throw new AppError(
        "Active subscription not found for current user",
        ERROR_CODES.NOT_FOUND,
        HTTP_STATUS.NOT_FOUND,
      );
    }

    // Idempotency: If already marked for cancel at period end, return current state safely
    if (activeSub.cancelAtPeriodEnd) {
      return {
        subscriptionId: activeSub.id,
        status: activeSub.status as SubscriptionStatus,
        planKey: activeSub.planKey as SubscriptionPlan,
        cancelAtPeriodEnd: true,
        currentPeriodEnd: activeSub.currentPeriodEnd.toISOString(),
      };
    }

    let provider: ISubscriptionProvider;
    try {
      provider = this.providerResolver(activeSub.providerKey);
    } catch {
      throw new AppError(
        "Subscription provider is unavailable",
        ERROR_CODES.SERVICE_UNAVAILABLE,
        HTTP_STATUS.SERVICE_UNAVAILABLE,
      );
    }

    const externalSubscriptionId =
      activeSub.externalSubscriptionId ?? `ext_${activeSub.id}`;
    const idempotencyKey =
      input.idempotencyKey ??
      `cancel_${activeSub.id}_${activeSub.updatedAt.getTime()}`;

    let providerSnapshot: ProviderSubscriptionSnapshot;
    try {
      providerSnapshot = await provider.cancelSubscription({
        requestId: input.requestId ?? "req_cancel",
        userId: input.userId,
        externalSubscriptionId,
        cancelAtPeriodEnd: true,
        idempotencyKey,
      });
    } catch (err: unknown) {
      if (err instanceof AppError) {
        throw err;
      }
      logger.error("Subscription provider error during cancellation", {
        requestId: input.requestId,
        subscriptionId: activeSub.id,
        error: err instanceof Error ? err.message : String(err),
      });
      throw new AppError(
        "Subscription provider is temporarily unavailable. Please try again later.",
        ERROR_CODES.SERVICE_UNAVAILABLE,
        HTTP_STATUS.SERVICE_UNAVAILABLE,
      );
    }

    const nextStatus = providerSnapshot.status;
    const nextCancelAtPeriodEnd = providerSnapshot.cancelAtPeriodEnd;

    // Apply mutation transactionally using Unit of Work (D6 STATE_FIRST)
    await this.txRunner.run(async (ctx) => {
      await ctx.repositories.subscriptionRepo.update(activeSub.id, {
        status: nextStatus,
        cancelAtPeriodEnd: nextCancelAtPeriodEnd,
      });

      await ctx.repositories.subscriptionTransitionRepo.create({
        subscriptionId: activeSub.id,
        userId: input.userId,
        fromStatus: activeSub.status as SubscriptionStatus,
        toStatus: nextStatus,
        fromPlan: activeSub.planKey as SubscriptionPlan,
        toPlan: activeSub.planKey as SubscriptionPlan,
        source: "USER_ACTION",
        transactionStrategy: "STATE_FIRST",
        actorId: input.userId,
        subjectId: activeSub.id,
        requestId: input.requestId,
        reason: input.reason ?? "User requested cancellation at period end",
        metadata: {
          cancelAtPeriodEnd: nextCancelAtPeriodEnd,
        },
      });
    });

    return {
      subscriptionId: activeSub.id,
      status: nextStatus,
      planKey: activeSub.planKey as SubscriptionPlan,
      cancelAtPeriodEnd: nextCancelAtPeriodEnd,
      currentPeriodEnd: activeSub.currentPeriodEnd.toISOString(),
    };
  }

  /**
   * Internal server-controlled canonical provider reconciliation.
   * Compares PostgreSQL state against canonical provider snapshot.
   * Applies non-stale verified transitions with D6 Unit of Work.
   * Protects terminal states and prevents stale overwrites.
   */
  async reconcileSubscription(input: {
    userId: string;
    externalSubscriptionId?: string;
    requestId?: string;
  }): Promise<{
    reconciled: boolean;
    reason: string;
    status?: SubscriptionStatus;
    planKey?: SubscriptionPlan;
  }> {
    const existingSub =
      (await this.subscriptionRepo.findActiveByUserId(input.userId)) ??
      (input.externalSubscriptionId
        ? await this.subscriptionRepo.findByExternalSubscriptionId("MOCK", input.externalSubscriptionId)
        : null);

    if (!existingSub) {
      return { reconciled: false, reason: "SUBSCRIPTION_NOT_FOUND" };
    }

    const externalId = existingSub.externalSubscriptionId ?? input.externalSubscriptionId;
    if (!externalId) {
      return { reconciled: false, reason: "EXTERNAL_ID_MISSING" };
    }

    const provider = this.providerResolver(existingSub.providerKey);
    let snapshot: ProviderSubscriptionSnapshot;
    try {
      snapshot = await provider.fetchSubscription({
        userId: input.userId,
        externalSubscriptionId: externalId,
      });
    } catch {
      return { reconciled: false, reason: "PROVIDER_FETCH_FAILED" };
    }

    // Sequence check: do not overwrite newer state with stale sequence
    if (existingSub.providerSequence && snapshot.providerSequence) {
      const cmp = compareSequences(snapshot.providerSequence, existingSub.providerSequence);
      if (cmp <= 0) {
        return { reconciled: false, reason: "STALE_SEQUENCE" };
      }
    }

    // Terminal state protection: CANCELLED / EXPIRED cannot be revived
    if (
      TERMINAL_STATUSES.includes(existingSub.status as SubscriptionStatus) &&
      !TERMINAL_STATUSES.includes(snapshot.status)
    ) {
      return { reconciled: false, reason: "IMPOSSIBLE_TERMINAL_REVIVAL" };
    }

    // Check if state actually changed
    const statusChanged = existingSub.status !== snapshot.status;
    const planChanged = existingSub.planKey !== snapshot.planKey;
    const cancelChanged = existingSub.cancelAtPeriodEnd !== snapshot.cancelAtPeriodEnd;

    if (!statusChanged && !planChanged && !cancelChanged) {
      return {
        reconciled: false,
        reason: "STATE_ALREADY_SYNCHRONIZED",
        status: existingSub.status as SubscriptionStatus,
        planKey: existingSub.planKey as SubscriptionPlan,
      };
    }

    const fromStatus = existingSub.status as SubscriptionStatus;
    const toStatus = snapshot.status;
    const fromPlan = existingSub.planKey as SubscriptionPlan;
    const toPlan = snapshot.planKey;

    const isRevocation =
      toStatus === "CANCELLED" ||
      toStatus === "EXPIRED" ||
      toStatus === "PAST_DUE" ||
      (fromPlan === "PREMIUM" && toPlan === "FREE");

    const strategy: SubscriptionTransactionStrategy = isRevocation
      ? "STATE_FIRST"
      : "TRANSACTIONALLY_COUPLED";

    await this.txRunner.run(async (ctx) => {
      await ctx.repositories.subscriptionRepo.update(existingSub.id, {
        status: toStatus,
        planKey: toPlan,
        cancelAtPeriodEnd: snapshot.cancelAtPeriodEnd,
        providerSequence: snapshot.providerSequence,
        currentPeriodStart: snapshot.currentPeriodStart,
        currentPeriodEnd: snapshot.currentPeriodEnd,
      });

      await ctx.repositories.subscriptionTransitionRepo.create({
        subscriptionId: existingSub.id,
        userId: input.userId,
        fromStatus,
        toStatus,
        fromPlan,
        toPlan,
        source: "RECONCILIATION",
        transactionStrategy: strategy,
        actorId: null, // internal server-controlled reconciliation
        subjectId: existingSub.id,
        requestId: input.requestId,
        reason: "Canonical provider reconciliation",
        metadata: {
          strategy,
          reconciled: true,
        },
      });
    });

    return {
      reconciled: true,
      reason: "RECONCILED",
      status: toStatus,
      planKey: toPlan,
    };
  }
}
