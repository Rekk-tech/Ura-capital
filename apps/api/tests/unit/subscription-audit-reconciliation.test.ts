import { describe, expect, it, vi } from "vitest";
import type {
  Prisma,
  SubscriptionProviderEvent,
  SubscriptionTransitionRecord,
  UserSubscription,
} from "@prisma/client";

import type { IRepositoryContainer } from "../../src/infrastructure/database/repository-factory.js";
import type {
  ITransactionRunner,
  TransactionOptions,
} from "../../src/infrastructure/database/transaction-runner.js";
import type { TransactionContext } from "../../src/infrastructure/database/transaction-context.js";
import {
  SUBSCRIPTION_AUDIT_EVENT_TYPES,
  createAuditPendingMetadata,
  deriveSubscriptionAuditEventType,
  parseAuditPendingMetadata,
  validateSubscriptionAuditMetadata,
} from "../../src/modules/subscription/subscription-audit.types.js";
import { SubscriptionAuditReconciliationService } from "../../src/modules/subscription/subscription-audit-reconciliation.service.js";
import type {
  CreateSubscriptionTransitionInput,
  ISubscriptionAuditProviderEventRepository,
  ISubscriptionAuditTransitionRepository,
  ISubscriptionProviderEventRepository,
  ISubscriptionRepository,
  ISubscriptionTransitionRepository,
} from "../../src/modules/subscription/subscription.types.js";

const USER_ID = "11111111-1111-4111-8111-111111111111";
const SUBSCRIPTION_ID = "22222222-2222-4222-8222-222222222222";
const EVENT_ID = "33333333-3333-4333-8333-333333333333";

function subscription(overrides: Partial<UserSubscription> = {}): UserSubscription {
  return {
    id: SUBSCRIPTION_ID,
    userId: USER_ID,
    planKey: "PREMIUM",
    status: "PAST_DUE",
    providerKey: "MOCK",
    externalSubscriptionId: "sub_audit_1",
    currentPeriodStart: new Date("2026-09-01T00:00:00.000Z"),
    currentPeriodEnd: new Date("2026-10-01T00:00:00.000Z"),
    cancelAtPeriodEnd: false,
    providerSequence: "2",
    createdAt: new Date("2026-09-01T00:00:00.000Z"),
    updatedAt: new Date("2026-09-02T00:00:00.000Z"),
    ...overrides,
  };
}

function pendingMetadata(): Prisma.JsonObject {
  return createAuditPendingMetadata({
    auditEventType: "SUBSCRIPTION_PAST_DUE",
    subscriptionId: SUBSCRIPTION_ID,
    userId: USER_ID,
    providerKey: "MOCK",
    providerEventId: "evt_audit_1",
    fromStatus: "ACTIVE",
    toStatus: "PAST_DUE",
    fromPlan: "PREMIUM",
    toPlan: "PREMIUM",
  });
}

function providerEvent(overrides: Partial<SubscriptionProviderEvent> = {}): SubscriptionProviderEvent {
  return {
    id: EVENT_ID,
    providerKey: "MOCK",
    providerEventId: "evt_audit_1",
    eventType: "SUBSCRIPTION_PAST_DUE",
    outcome: "PROCESSED",
    occurredAt: new Date("2026-09-02T00:00:00.000Z"),
    receivedAt: new Date("2026-09-02T00:00:01.000Z"),
    processedAt: new Date("2026-09-02T00:00:02.000Z"),
    payloadDigest: "a".repeat(64),
    metadata: pendingMetadata(),
    subscriptionId: SUBSCRIPTION_ID,
    createdAt: new Date("2026-09-02T00:00:01.000Z"),
    updatedAt: new Date("2026-09-02T00:00:02.000Z"),
    ...overrides,
  };
}

function transition(
  input: CreateSubscriptionTransitionInput,
  id = "44444444-4444-4444-8444-444444444444",
): SubscriptionTransitionRecord {
  return {
    id,
    subscriptionId: input.subscriptionId,
    userId: input.userId,
    fromStatus: input.fromStatus ?? null,
    toStatus: input.toStatus,
    fromPlan: input.fromPlan ?? null,
    toPlan: input.toPlan,
    source: input.source,
    transactionStrategy: input.transactionStrategy,
    reason: input.reason ?? null,
    providerEventId: input.providerEventId ?? null,
    actorId: input.actorId ?? null,
    subjectId: input.subjectId ?? null,
    requestId: input.requestId ?? null,
    correlationId: input.correlationId ?? null,
    metadata: input.metadata ?? null,
    createdAt: new Date(),
  };
}

function createHarness() {
  let event = providerEvent();
  const currentSubscription = subscription();
  const transitions: SubscriptionTransitionRecord[] = [];

  const subscriptionRepo: ISubscriptionRepository = {
    findById: vi.fn(async (id) => (id === currentSubscription.id ? currentSubscription : null)),
    findActiveByUserId: vi.fn(async () => currentSubscription),
    findAllByUserId: vi.fn(async () => [currentSubscription]),
    findByExternalSubscriptionId: vi.fn(async () => currentSubscription),
    create: vi.fn(async () => currentSubscription),
    update: vi.fn(async () => {
      throw new Error("Reconciliation must not mutate subscription state");
    }),
  };

  const providerEventRepo: ISubscriptionProviderEventRepository &
    ISubscriptionAuditProviderEventRepository = {
    create: vi.fn(),
    findById: vi.fn(async (id) => (id === event.id ? event : null)),
    findByProviderEventId: vi.fn(async (_providerKey, providerEventId) =>
      providerEventId === event.providerEventId ? event : null,
    ),
    updateOutcome: vi.fn(async (id, outcome, metadata, processedAt) => {
      if (id !== event.id) throw new Error("Event not found");
      event = {
        ...event,
        outcome,
        metadata: metadata ?? null,
        processedAt: processedAt ?? event.processedAt,
        updatedAt: new Date(),
      };
      return event;
    }),
    findAuditPending: vi.fn(async () =>
      (event.metadata as Record<string, unknown>)?.auditPending === true ? [event] : [],
    ),
    lockById: vi.fn(async (id) => (id === event.id ? event : null)),
  };

  const transitionRepo: ISubscriptionTransitionRepository &
    ISubscriptionAuditTransitionRepository = {
    create: vi.fn(async (input) => {
      const record = transition(input, `transition-${transitions.length + 1}`);
      transitions.push(record);
      return record;
    }),
    findById: vi.fn(async (id) => transitions.find((item) => item.id === id) ?? null),
    findBySubscriptionId: vi.fn(async (id) =>
      transitions.filter((item) => item.subscriptionId === id),
    ),
    findByUserId: vi.fn(async (id) => transitions.filter((item) => item.userId === id)),
    findByCorrelationId: vi.fn(async (id) =>
      transitions.filter((item) => item.correlationId === id),
    ),
    findReconciliationByProviderEventId: vi.fn(async (id) =>
      transitions.find(
        (item) =>
          item.providerEventId === id &&
          item.source === "RECONCILIATION" &&
          item.reason === "SUBSCRIPTION_RECONCILED",
      ) ?? null,
    ),
  };

  const txRunner: ITransactionRunner = {
    run: vi.fn(async <T>(
      operation: (ctx: TransactionContext) => Promise<T>,
      _options?: TransactionOptions,
    ) => {
      const eventSnapshot = structuredClone(event);
      const transitionCount = transitions.length;
      try {
        return await operation({
          id: "tx-audit-test",
          tx: {} as Prisma.TransactionClient,
          repositories: {
            subscriptionRepo,
            subscriptionProviderEventRepo: providerEventRepo,
            subscriptionTransitionRepo: transitionRepo,
          } as IRepositoryContainer,
          depth: 1,
          isCompleted: false,
        });
      } catch (error) {
        event = eventSnapshot;
        transitions.splice(transitionCount);
        throw error;
      }
    }),
    getActiveContext: vi.fn(() => undefined),
    isInTransaction: vi.fn(() => false),
  };

  return {
    service: new SubscriptionAuditReconciliationService(providerEventRepo, txRunner),
    providerEventRepo,
    subscriptionRepo,
    transitionRepo,
    transitions,
    getEvent: () => event,
  };
}

describe("FEAT-055 subscription audit contract", () => {
  it("freezes the approved seven-event taxonomy", () => {
    expect(SUBSCRIPTION_AUDIT_EVENT_TYPES).toEqual([
      "SUBSCRIPTION_ACTIVATED",
      "SUBSCRIPTION_PLAN_CHANGED",
      "SUBSCRIPTION_PAST_DUE",
      "SUBSCRIPTION_CANCELLATION_REQUESTED",
      "SUBSCRIPTION_CANCELLED",
      "SUBSCRIPTION_EXPIRED",
      "SUBSCRIPTION_RECONCILED",
    ]);
  });

  it("derives transition taxonomy from server-side state facts", () => {
    expect(
      deriveSubscriptionAuditEventType({
        providerEventType: "SUBSCRIPTION_ACTIVATED",
        fromStatus: null,
        toStatus: "ACTIVE",
        fromPlan: null,
        toPlan: "PREMIUM",
        previousCancelAtPeriodEnd: false,
        cancelAtPeriodEnd: false,
      }),
    ).toBe("SUBSCRIPTION_ACTIVATED");

    expect(
      deriveSubscriptionAuditEventType({
        providerEventType: "SUBSCRIPTION_UPDATED",
        fromStatus: "ACTIVE",
        toStatus: "ACTIVE",
        fromPlan: "FREE",
        toPlan: "PREMIUM",
        previousCancelAtPeriodEnd: false,
        cancelAtPeriodEnd: false,
      }),
    ).toBe("SUBSCRIPTION_PLAN_CHANGED");

    expect(
      deriveSubscriptionAuditEventType({
        providerEventType: "SUBSCRIPTION_UPDATED",
        fromStatus: "ACTIVE",
        toStatus: "ACTIVE",
        fromPlan: "PREMIUM",
        toPlan: "PREMIUM",
        previousCancelAtPeriodEnd: false,
        cancelAtPeriodEnd: true,
      }),
    ).toBe("SUBSCRIPTION_CANCELLATION_REQUESTED");
  });

  it("accepts only flat allowlisted metadata within 2 KiB", () => {
    expect(
      validateSubscriptionAuditMetadata({
        reconciliationReasonCode: "AUDIT_PENDING_RECOVERY",
        originEventType: "SUBSCRIPTION_PAST_DUE",
        originSource: "PROVIDER_WEBHOOK",
        originTransactionStrategy: "STATE_FIRST",
        providerKey: "MOCK",
      }).valid,
    ).toBe(true);

    expect(validateSubscriptionAuditMetadata({ nested: { token: "secret" } }).valid).toBe(false);
    expect(validateSubscriptionAuditMetadata({ password: "secret" }).valid).toBe(false);
    expect(validateSubscriptionAuditMetadata({ note: "x".repeat(2050) }).valid).toBe(false);
  });

  it("rejects sensitive metadata aliases without truncation", () => {
    const prohibited = [
      "password",
      "password_hash",
      "accessToken",
      "refresh_token",
      "cookie",
      "authorization",
      "api_key",
      "databaseUrl",
      "redis_url",
      "rawPayload",
      "paymentMethod",
      "email",
      "clientRole",
      "is_admin",
      "secret",
      "url",
    ];

    for (const key of prohibited) {
      const result = validateSubscriptionAuditMetadata({ [key]: "sensitive-value" });
      expect(result.valid, key).toBe(false);
    }
  });

  it("accepts only complete server-generated pending evidence", () => {
    expect(parseAuditPendingMetadata(pendingMetadata())).not.toBeNull();

    const incomplete = pendingMetadata();
    delete incomplete.auditUserId;
    expect(parseAuditPendingMetadata(incomplete)).toBeNull();

    const conflicting = pendingMetadata();
    conflicting.auditTransactionStrategy = "TRANSACTIONALLY_COUPLED";
    expect(parseAuditPendingMetadata(conflicting)).toBeNull();
  });
});

describe("SubscriptionAuditReconciliationService", () => {
  it("repairs auditPending evidence without changing subscription authority", async () => {
    const harness = createHarness();

    const result = await harness.service.reconcileProviderEvent(EVENT_ID);

    expect(result.outcome).toBe("REPAIRED");
    expect(harness.transitions).toHaveLength(1);
    expect(harness.transitions[0]).toMatchObject({
      reason: "SUBSCRIPTION_RECONCILED",
      source: "RECONCILIATION",
      transactionStrategy: "BEST_EFFORT",
      providerEventId: "evt_audit_1",
      fromStatus: "ACTIVE",
      toStatus: "PAST_DUE",
      fromPlan: "PREMIUM",
      toPlan: "PREMIUM",
    });
    expect(harness.subscriptionRepo.update).not.toHaveBeenCalled();
    expect(harness.getEvent().metadata).toMatchObject({
      auditPending: false,
      auditReconciled: true,
    });
  });

  it("is idempotent and does not append duplicate transition evidence", async () => {
    const harness = createHarness();

    await harness.service.reconcileProviderEvent(EVENT_ID);
    const second = await harness.service.reconcileProviderEvent(EVENT_ID);

    expect(second.outcome).toBe("ALREADY_RECONCILED");
    expect(harness.transitions).toHaveLength(1);
  });

  it("fails safely on mismatched provider linkage and never grants premium", async () => {
    const harness = createHarness();
    const metadata = pendingMetadata();
    metadata.auditProviderEventId = "different-event";
    harness.getEvent().metadata = metadata;

    const result = await harness.service.reconcileProviderEvent(EVENT_ID);

    expect(result.outcome).toBe("INVALID_PENDING_EVIDENCE");
    expect(harness.transitions).toHaveLength(0);
    expect(harness.subscriptionRepo.update).not.toHaveBeenCalled();
  });

  it("rolls back event resolution when transition persistence fails", async () => {
    const harness = createHarness();
    vi.mocked(harness.transitionRepo.create).mockRejectedValueOnce(new Error("database unavailable"));

    await expect(harness.service.reconcileProviderEvent(EVENT_ID)).rejects.toThrow();

    expect(harness.transitions).toHaveLength(0);
    expect(harness.getEvent().metadata).toMatchObject({ auditPending: true });
  });

  it("discovers pending events through a bounded internal service call", async () => {
    const harness = createHarness();

    const summary = await harness.service.reconcilePending({ limit: 10 });

    expect(harness.providerEventRepo.findAuditPending).toHaveBeenCalledWith(10);
    expect(summary).toEqual({ scanned: 1, repaired: 1, alreadyReconciled: 0, failed: 0 });
  });
});
