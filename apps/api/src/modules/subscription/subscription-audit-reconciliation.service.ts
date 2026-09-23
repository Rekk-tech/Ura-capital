import type {
  ISubscriptionAuditProviderEventRepository,
  ISubscriptionAuditTransitionRepository,
  ISubscriptionProviderEventRepository,
  ISubscriptionTransitionRepository,
} from "./subscription.types.js";
import type {
  ITransactionRunner,
} from "../../infrastructure/database/transaction-runner.js";
import {
  markAuditPendingResolved,
  parseAuditPendingMetadata,
  validateSubscriptionAuditMetadata,
} from "./subscription-audit.types.js";

type AuditProviderEventRepository = ISubscriptionProviderEventRepository &
  ISubscriptionAuditProviderEventRepository;
type AuditTransitionRepository = ISubscriptionTransitionRepository &
  ISubscriptionAuditTransitionRepository;

export type SubscriptionAuditReconciliationOutcome =
  | "REPAIRED"
  | "ALREADY_RECONCILED"
  | "NOT_PENDING"
  | "NOT_FOUND"
  | "INVALID_PENDING_EVIDENCE";

export interface SubscriptionAuditReconciliationResult {
  providerEventRecordId: string;
  outcome: SubscriptionAuditReconciliationOutcome;
  transitionRecordId?: string;
}

export interface SubscriptionAuditReconciliationSummary {
  scanned: number;
  repaired: number;
  alreadyReconciled: number;
  failed: number;
}

/**
 * Internal deterministic reconciliation worker for state-first subscription
 * audit gaps. It has no HTTP surface and never mutates subscription authority.
 */
export class SubscriptionAuditReconciliationService {
  constructor(
    private readonly discoveryRepo: AuditProviderEventRepository,
    private readonly txRunner: ITransactionRunner,
  ) {}

  async reconcilePending(options: { limit?: number } = {}): Promise<SubscriptionAuditReconciliationSummary> {
    const limit = Math.max(1, Math.min(options.limit ?? 50, 100));
    const pending = await this.discoveryRepo.findAuditPending(limit);
    const summary: SubscriptionAuditReconciliationSummary = {
      scanned: pending.length,
      repaired: 0,
      alreadyReconciled: 0,
      failed: 0,
    };

    for (const event of pending) {
      try {
        const result = await this.reconcileProviderEvent(event.id);
        if (result.outcome === "REPAIRED") summary.repaired += 1;
        else if (result.outcome === "ALREADY_RECONCILED") {
          summary.alreadyReconciled += 1;
        } else {
          summary.failed += 1;
        }
      } catch {
        summary.failed += 1;
      }
    }

    return summary;
  }

  async reconcileProviderEvent(
    providerEventRecordId: string,
  ): Promise<SubscriptionAuditReconciliationResult> {
    return this.txRunner.run(async (ctx) => {
      const eventRepo = ctx.repositories
        .subscriptionProviderEventRepo as AuditProviderEventRepository;
      const transitionRepo = ctx.repositories
        .subscriptionTransitionRepo as AuditTransitionRepository;

      const event = await eventRepo.lockById(providerEventRecordId);
      if (!event) return { providerEventRecordId, outcome: "NOT_FOUND" };

      const existing = await transitionRepo.findReconciliationByProviderEventId(
        event.providerEventId,
      );
      const metadata = event.metadata as Record<string, unknown> | null;

      if (metadata?.auditPending !== true) {
        return {
          providerEventRecordId,
          outcome: existing ? "ALREADY_RECONCILED" : "NOT_PENDING",
          ...(existing ? { transitionRecordId: existing.id } : {}),
        };
      }

      const evidence = parseAuditPendingMetadata(metadata);
      if (
        !evidence ||
        event.outcome !== "PROCESSED" ||
        event.subscriptionId !== evidence.subscriptionId ||
        event.providerKey !== evidence.providerKey ||
        event.providerEventId !== evidence.providerEventId
      ) {
        return { providerEventRecordId, outcome: "INVALID_PENDING_EVIDENCE" };
      }

      const subscription = await ctx.repositories.subscriptionRepo.findById(
        evidence.subscriptionId,
      );
      if (!subscription || subscription.userId !== evidence.userId) {
        return { providerEventRecordId, outcome: "INVALID_PENDING_EVIDENCE" };
      }

      if (existing) {
        await eventRepo.updateOutcome(
          event.id,
          "PROCESSED",
          markAuditPendingResolved(metadata, new Date()),
          event.processedAt,
        );
        return {
          providerEventRecordId,
          outcome: "ALREADY_RECONCILED",
          transitionRecordId: existing.id,
        };
      }

      const transitionMetadata = {
        reconciliationReasonCode: "AUDIT_PENDING_RECOVERY",
        originEventType: evidence.auditEventType,
        originSource: evidence.originSource,
        originTransactionStrategy: evidence.transactionStrategy,
        providerKey: evidence.providerKey,
      } as const;
      const metadataValidation = validateSubscriptionAuditMetadata(transitionMetadata);
      if (!metadataValidation.valid) {
        return { providerEventRecordId, outcome: "INVALID_PENDING_EVIDENCE" };
      }

      const transition = await transitionRepo.create({
        subscriptionId: evidence.subscriptionId,
        userId: evidence.userId,
        fromStatus: evidence.fromStatus,
        toStatus: evidence.toStatus,
        fromPlan: evidence.fromPlan,
        toPlan: evidence.toPlan,
        source: "RECONCILIATION",
        transactionStrategy: "BEST_EFFORT",
        reason: "SUBSCRIPTION_RECONCILED",
        providerEventId: evidence.providerEventId,
        actorId: null,
        subjectId: evidence.subscriptionId,
        correlationId: `subscription-audit:${evidence.providerEventId}`,
        metadata: transitionMetadata,
      });

      await eventRepo.updateOutcome(
        event.id,
        "PROCESSED",
        markAuditPendingResolved(metadata, new Date()),
        event.processedAt,
      );

      return {
        providerEventRecordId,
        outcome: "REPAIRED",
        transitionRecordId: transition.id,
      };
    });
  }
}
