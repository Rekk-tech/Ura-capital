import { logger } from "../../infrastructure/logging/logger.js";
import {
  type ISubscriptionRepository,
  type ISubscriptionProviderEventRepository,
  type ISubscriptionTransitionRepository,
} from "./subscription.repository.js";
import {
  type ITransactionRunner,
  transactionRunner as defaultTransactionRunner,
} from "../../infrastructure/database/transaction-runner.js";
import {
  type ISubscriptionProvider,
  type NormalizedProviderEvent,
} from "./provider/subscription-provider.types.js";
import { createSubscriptionProvider } from "./provider/subscription-provider.factory.js";
import {
  type ProcessWebhookInput,
  type SubscriptionEventProcessingResult,
  MAX_WEBHOOK_PAYLOAD_BYTES,
} from "./subscription-event.types.js";
import {
  SubscriptionEventIdempotencyConflictError,
  SubscriptionEventPayloadTooLargeError,
  SubscriptionEventUnknownProviderError,
} from "./subscription-event.errors.js";
import {
  type SubscriptionPlan,
  type SubscriptionStatus,
  type SubscriptionTransactionStrategy,
} from "./subscription.types.js";
import {
  createAuditPendingMetadata,
  deriveSubscriptionAuditEventType,
} from "./subscription-audit.types.js";

export type ProviderResolver = (providerKey: string) => ISubscriptionProvider;

function isUniqueConstraintViolation(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const candidate = error as { code?: string; message?: string; cause?: unknown };
  if (candidate.code === "P2002") return true;
  if (
    candidate.code === "CONFLICT" &&
    candidate.message?.includes("unique identifiers already exists")
  ) {
    return true;
  }
  const cause = candidate.cause as { code?: string; message?: string } | undefined;
  if (cause?.code === "P2002") return true;
  const msg = `${candidate.message ?? ""} ${cause?.message ?? ""}`;
  return (
    msg.includes("Unique constraint") ||
    msg.includes("unique constraint") ||
    msg.includes("duplicate key value") ||
    msg.includes("unique identifiers already exists")
  );
}

function compareSequences(incoming: string, existing: string): number {
  const incNum = Number(incoming);
  const extNum = Number(existing);
  if (!Number.isNaN(incNum) && !Number.isNaN(extNum)) {
    return incNum - extNum;
  }
  return incoming.localeCompare(existing, undefined, { numeric: true });
}

export class SubscriptionEventProcessorService {
  constructor(
    private readonly subscriptionRepo: ISubscriptionRepository,
    private readonly providerEventRepo: ISubscriptionProviderEventRepository,
    private readonly transitionRepo: ISubscriptionTransitionRepository,
    private readonly txRunner: ITransactionRunner = defaultTransactionRunner,
    private readonly providerResolver: ProviderResolver = () => createSubscriptionProvider(),
  ) {}

  /**
   * Canonical provider webhook event processing pipeline:
   * 1. Bounded raw bytes verification
   * 2. Provider verification & normalization
   * 3. Durable PostgreSQL idempotency check
   * 4. Sequence & staleness validation
   * 5. Transactional execution with D6 audit coupling
   * 6. Concurrent duplicate race convergence
   */
  async processWebhook(input: ProcessWebhookInput): Promise<SubscriptionEventProcessingResult> {
    // Step 1: Bounded raw request check
    const rawBuffer = Buffer.isBuffer(input.rawBody)
      ? input.rawBody
      : Buffer.from(input.rawBody, "utf8");

    if (rawBuffer.length > MAX_WEBHOOK_PAYLOAD_BYTES) {
      throw new SubscriptionEventPayloadTooLargeError();
    }

    // Step 2: Resolve provider
    let provider: ISubscriptionProvider;
    try {
      provider = this.providerResolver(input.providerKey);
    } catch {
      throw new SubscriptionEventUnknownProviderError(input.providerKey);
    }

    if (provider.providerKey !== input.providerKey) {
      throw new SubscriptionEventUnknownProviderError(input.providerKey);
    }

    // Step 3: Raw body signature verification & parsing
    let parsedBody: unknown;
    try {
      parsedBody = JSON.parse(rawBuffer.toString("utf8"));
    } catch {
      // Malformed JSON is treated as verification failure with zero mutation
      parsedBody = {};
    }

    const verifiedWebhook = await provider.verifyWebhook({
      signature: input.signature,
      body: parsedBody,
    });

    const normalized = provider.normalizeEvent(verifiedWebhook);

    // Step 4: Durable Idempotency Check (Sequential Duplicate Pre-check)
    const existingEvent = await this.providerEventRepo.findByProviderEventId(
      provider.providerKey,
      normalized.providerEventId,
    );

    if (existingEvent) {
      if (
        existingEvent.payloadDigest &&
        existingEvent.payloadDigest !== normalized.payloadDigest
      ) {
        throw new SubscriptionEventIdempotencyConflictError();
      }

      return {
        outcome: "DUPLICATE",
        duplicate: true,
        providerEventId: existingEvent.providerEventId,
        subscriptionId: existingEvent.subscriptionId,
        status: normalized.subscription.status,
        planKey: normalized.subscription.planKey,
        reason: "EVENT_ALREADY_PROCESSED",
      };
    }

    // Step 5: Execute Ingestion with Race Handling
    try {
      return await this.executeEventIngestion(provider, normalized);
    } catch (err: unknown) {
      // Step 6: Concurrent Duplicate Convergence (AC-011)
      if (isUniqueConstraintViolation(err)) {
        const committedEvent = await this.providerEventRepo.findByProviderEventId(
          provider.providerKey,
          normalized.providerEventId,
        );

        if (committedEvent) {
          if (
            committedEvent.payloadDigest &&
            committedEvent.payloadDigest !== normalized.payloadDigest
          ) {
            throw new SubscriptionEventIdempotencyConflictError();
          }

          return {
            outcome: "DUPLICATE",
            duplicate: true,
            providerEventId: committedEvent.providerEventId,
            subscriptionId: committedEvent.subscriptionId,
            status: normalized.subscription.status,
            planKey: normalized.subscription.planKey,
            reason: "CONCURRENT_DUPLICATE_CONVERGED",
          };
        }
      }

      throw err;
    }
  }

  private async executeEventIngestion(
    provider: ISubscriptionProvider,
    normalized: NormalizedProviderEvent,
  ): Promise<SubscriptionEventProcessingResult> {
    const { subscription: snapshot, providerEventId, eventType, occurredAt, payloadDigest } = normalized;

    // Check existing subscription
    const existingByExternal = await this.subscriptionRepo.findByExternalSubscriptionId(
      provider.providerKey,
      snapshot.externalSubscriptionId,
    );

    const activeByUser = await this.subscriptionRepo.findActiveByUserId(snapshot.userId);
    const existingSub = existingByExternal ?? activeByUser;

    // Ordering / Staleness Validation
    if (existingSub) {
      // Sequence check
      if (existingSub.providerSequence && snapshot.providerSequence) {
        const cmp = compareSequences(snapshot.providerSequence, existingSub.providerSequence);
        if (cmp <= 0) {
          // Stale lower/equal sequence: record IGNORED event, zero subscription mutation
          await this.providerEventRepo.create({
            providerKey: provider.providerKey,
            providerEventId,
            eventType,
            outcome: "IGNORED",
            occurredAt,
            payloadDigest,
            subscriptionId: existingSub.id,
            metadata: {
              ignored: true,
              reason: "STALE_SEQUENCE",
              incomingSequence: snapshot.providerSequence,
              existingSequence: existingSub.providerSequence,
            },
          });

          return {
            outcome: "IGNORED",
            duplicate: false,
            providerEventId,
            subscriptionId: existingSub.id,
            reason: "STALE_SEQUENCE",
          };
        }
      }

      // Terminal state protection: CANCELLED / EXPIRED cannot be revived to ACTIVE/PAST_DUE
      if (
        (existingSub.status === "CANCELLED" || existingSub.status === "EXPIRED") &&
        (snapshot.status === "ACTIVE" || snapshot.status === "PAST_DUE") &&
        existingSub.externalSubscriptionId === snapshot.externalSubscriptionId
      ) {
        await this.providerEventRepo.create({
          providerKey: provider.providerKey,
          providerEventId,
          eventType,
          outcome: "IGNORED",
          occurredAt,
          payloadDigest,
          subscriptionId: existingSub.id,
          metadata: {
            ignored: true,
            reason: "IMPOSSIBLE_TERMINAL_REVIVAL",
            existingStatus: existingSub.status,
            incomingStatus: snapshot.status,
          },
        });

        return {
          outcome: "IGNORED",
          duplicate: false,
          providerEventId,
          subscriptionId: existingSub.id,
          reason: "IMPOSSIBLE_TERMINAL_REVIVAL",
        };
      }
    }

    // Determine transition facts
    const fromStatus = (existingSub?.status as SubscriptionStatus) ?? null;
    const toStatus = snapshot.status;
    const fromPlan = (existingSub?.planKey as SubscriptionPlan) ?? null;
    const toPlan = snapshot.planKey;
    const auditEventType = deriveSubscriptionAuditEventType({
      providerEventType: eventType,
      fromStatus,
      toStatus,
      fromPlan,
      toPlan,
      previousCancelAtPeriodEnd: existingSub?.cancelAtPeriodEnd ?? false,
      cancelAtPeriodEnd: snapshot.cancelAtPeriodEnd,
    });

    const isActivationOrUpgrade =
      (fromPlan !== "PREMIUM" && toPlan === "PREMIUM") ||
      (fromStatus !== "ACTIVE" && toStatus === "ACTIVE" && toPlan === "PREMIUM") ||
      (!existingSub && toPlan === "PREMIUM" && toStatus === "ACTIVE");

    const isRevocationOrDowngrade =
      toStatus === "CANCELLED" ||
      toStatus === "EXPIRED" ||
      toStatus === "PAST_DUE" ||
      (fromPlan === "PREMIUM" && toPlan === "FREE");

    const strategy: SubscriptionTransactionStrategy = isRevocationOrDowngrade
      ? "STATE_FIRST"
      : isActivationOrUpgrade
        ? "TRANSACTIONALLY_COUPLED"
        : "TRANSACTIONALLY_COUPLED";

    if (strategy === "STATE_FIRST") {
      // D6 State-First: Access reduction commits first; separate transition record write
      // cannot revert or roll back subscription reduction if audit write fails.
      let committedSubId: string;
      let committedEventId: string;

      await this.txRunner.run(async (ctx) => {
        const subRecord = existingSub
          ? await ctx.repositories.subscriptionRepo.update(existingSub.id, {
              status: toStatus,
              planKey: toPlan,
              providerKey: provider.providerKey,
              externalSubscriptionId: snapshot.externalSubscriptionId,
              currentPeriodStart: snapshot.currentPeriodStart,
              currentPeriodEnd: snapshot.currentPeriodEnd,
              cancelAtPeriodEnd: snapshot.cancelAtPeriodEnd,
              providerSequence: snapshot.providerSequence,
            })
          : await ctx.repositories.subscriptionRepo.create({
              userId: snapshot.userId,
              status: toStatus,
              planKey: toPlan,
              providerKey: provider.providerKey,
              externalSubscriptionId: snapshot.externalSubscriptionId,
              currentPeriodStart: snapshot.currentPeriodStart,
              currentPeriodEnd: snapshot.currentPeriodEnd,
              cancelAtPeriodEnd: snapshot.cancelAtPeriodEnd,
              providerSequence: snapshot.providerSequence,
            });

        committedSubId = subRecord.id;

        const eventRecord = await ctx.repositories.subscriptionProviderEventRepo.create({
          providerKey: provider.providerKey,
          providerEventId,
          eventType,
          outcome: "PROCESSED",
          occurredAt,
          payloadDigest,
          subscriptionId: subRecord.id,
          processedAt: new Date(),
          metadata: {
            strategy: "STATE_FIRST",
            toStatus,
            toPlan,
          },
        });

        committedEventId = eventRecord.id;
      });

      // Attempt transition audit record write outside or secondary
      let auditPending = false;
      try {
        if (!auditEventType) {
          return {
            outcome: "PROCESSED",
            duplicate: false,
            providerEventId,
            subscriptionId: committedSubId!,
            status: toStatus,
            planKey: toPlan,
            auditPending: false,
          };
        }
        await this.transitionRepo.create({
          subscriptionId: committedSubId!,
          userId: snapshot.userId,
          fromStatus,
          toStatus,
          fromPlan,
          toPlan,
          source: "PROVIDER_WEBHOOK",
          transactionStrategy: "STATE_FIRST",
          providerEventId,
          reason: auditEventType,
        });
      } catch {
        // Revocation remains committed! Record durable audit-pending evidence (AC-015, AC-016)
        auditPending = true;
        logger.warn(
          "[SUBSCRIPTION_REVOCATION_AUDIT_PENDING] Revocation transition audit write failed; access reduction remains committed",
          {
            eventId: committedEventId!,
            subscriptionId: committedSubId!,
          },
        );

        await this.providerEventRepo.updateOutcome(
          committedEventId!,
          "PROCESSED",
          createAuditPendingMetadata({
            auditEventType: auditEventType!,
            subscriptionId: committedSubId!,
            userId: snapshot.userId,
            providerKey: provider.providerKey,
            providerEventId,
            fromStatus,
            toStatus,
            fromPlan,
            toPlan,
          }),
          new Date(),
        );
      }

      return {
        outcome: "PROCESSED",
        duplicate: false,
        providerEventId,
        subscriptionId: committedSubId!,
        status: toStatus,
        planKey: toPlan,
        auditPending,
      };
    }

    // D6 Transactionally Coupled: Activation/Upgrade grant and required transition record
    // are atomically coupled in one transaction. Failure to write audit rolls back the grant.
    return await this.txRunner.run(async (ctx) => {
      const subRecord = existingSub
        ? await ctx.repositories.subscriptionRepo.update(existingSub.id, {
            status: toStatus,
            planKey: toPlan,
            providerKey: provider.providerKey,
            externalSubscriptionId: snapshot.externalSubscriptionId,
            currentPeriodStart: snapshot.currentPeriodStart,
            currentPeriodEnd: snapshot.currentPeriodEnd,
            cancelAtPeriodEnd: snapshot.cancelAtPeriodEnd,
            providerSequence: snapshot.providerSequence,
          })
        : await ctx.repositories.subscriptionRepo.create({
            userId: snapshot.userId,
            status: toStatus,
            planKey: toPlan,
            providerKey: provider.providerKey,
            externalSubscriptionId: snapshot.externalSubscriptionId,
            currentPeriodStart: snapshot.currentPeriodStart,
            currentPeriodEnd: snapshot.currentPeriodEnd,
            cancelAtPeriodEnd: snapshot.cancelAtPeriodEnd,
            providerSequence: snapshot.providerSequence,
          });

      await ctx.repositories.subscriptionProviderEventRepo.create({
        providerKey: provider.providerKey,
        providerEventId,
        eventType,
        outcome: "PROCESSED",
        occurredAt,
        payloadDigest,
        subscriptionId: subRecord.id,
        processedAt: new Date(),
        metadata: {
          strategy: "TRANSACTIONALLY_COUPLED",
          toStatus,
          toPlan,
        },
      });

      if (auditEventType) {
        await ctx.repositories.subscriptionTransitionRepo.create({
          subscriptionId: subRecord.id,
          userId: snapshot.userId,
          fromStatus,
          toStatus,
          fromPlan,
          toPlan,
          source: "PROVIDER_WEBHOOK",
          transactionStrategy: "TRANSACTIONALLY_COUPLED",
          providerEventId,
          reason: auditEventType,
        });
      }

      return {
        outcome: "PROCESSED",
        duplicate: false,
        providerEventId,
        subscriptionId: subRecord.id,
        status: toStatus,
        planKey: toPlan,
      };
    });
  }
}
