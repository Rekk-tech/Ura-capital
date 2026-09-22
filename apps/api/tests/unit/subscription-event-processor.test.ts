import { describe, it, expect, beforeEach, vi } from "vitest";
import { SubscriptionEventProcessorService } from "../../src/modules/subscription/subscription-event-processor.service.js";
import { MockSubscriptionProvider } from "../../src/modules/subscription/provider/mock-subscription-provider.js";
import { validateSubscriptionProviderEnvironment } from "../../src/modules/subscription/provider/subscription-provider.config.js";
import {
  SubscriptionEventIdempotencyConflictError,
  SubscriptionEventPayloadTooLargeError,
  SubscriptionEventUnknownProviderError,
} from "../../src/modules/subscription/subscription-event.errors.js";
import { SubscriptionProviderVerificationError } from "../../src/modules/subscription/provider/subscription-provider.errors.js";
import type {
  ISubscriptionRepository,
  ISubscriptionProviderEventRepository,
  ISubscriptionTransitionRepository,
  CreateUserSubscriptionInput,
  UpdateUserSubscriptionInput,
  CreateSubscriptionProviderEventInput,
  CreateSubscriptionTransitionInput,
} from "../../src/modules/subscription/subscription.repository.js";
import type {
  UserSubscription,
  SubscriptionProviderEvent,
  SubscriptionTransitionRecord,
  Prisma,
} from "@prisma/client";
import type { ITransactionRunner, TransactionOptions } from "../../src/infrastructure/database/transaction-runner.js";
import type { TransactionContext } from "../../src/infrastructure/database/transaction-context.js";
import type { IRepositoryContainer } from "../../src/infrastructure/database/repository-factory.js";

describe("SubscriptionEventProcessorService", () => {
  const mockSecret = "a".repeat(32);
  const safeConfig = validateSubscriptionProviderEnvironment({
    nodeEnv: "test",
    providerMode: "mock",
    isCi: false,
    databaseUrl: "postgresql://postgres:postgres@localhost:5432/aura_test?schema=test",
    runId: "run1",
    workerId: "w1",
    mockWebhookSecret: mockSecret,
  });

  let mockProvider: MockSubscriptionProvider;
  let mockSubRepo: ISubscriptionRepository;
  let mockEventRepo: ISubscriptionProviderEventRepository;
  let mockTransitionRepo: ISubscriptionTransitionRepository;
  let mockTxRunner: ITransactionRunner;
  let service: SubscriptionEventProcessorService;

  // In-memory stores
  let subscriptions: UserSubscription[];
  let providerEvents: SubscriptionProviderEvent[];
  let transitions: SubscriptionTransitionRecord[];

  beforeEach(() => {
    mockProvider = new MockSubscriptionProvider({ config: safeConfig });

    subscriptions = [];
    providerEvents = [];
    transitions = [];

    mockSubRepo = {
      findById: vi.fn(async (id: string) => subscriptions.find((s) => s.id === id) ?? null),
      findActiveByUserId: vi.fn(async (userId: string) =>
        subscriptions.find((s) => s.userId === userId && ["ACTIVE", "PAST_DUE"].includes(s.status)) ?? null,
      ),
      findAllByUserId: vi.fn(async (userId: string) => subscriptions.filter((s) => s.userId === userId)),
      findByExternalSubscriptionId: vi.fn(async (providerKey: string, extId: string) =>
        subscriptions.find((s) => s.providerKey === providerKey && s.externalSubscriptionId === extId) ?? null,
      ),
      create: vi.fn(async (data: CreateUserSubscriptionInput) => {
        const record: UserSubscription = {
          id: `sub_${subscriptions.length + 1}`,
          userId: data.userId,
          planKey: data.planKey ?? "FREE",
          status: data.status ?? "ACTIVE",
          providerKey: data.providerKey ?? "INTERNAL",
          externalSubscriptionId: data.externalSubscriptionId ?? null,
          currentPeriodStart: data.currentPeriodStart,
          currentPeriodEnd: data.currentPeriodEnd,
          cancelAtPeriodEnd: data.cancelAtPeriodEnd ?? false,
          providerSequence: data.providerSequence ?? null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        subscriptions.push(record);
        return record;
      }),
      update: vi.fn(async (id: string, data: UpdateUserSubscriptionInput) => {
        const idx = subscriptions.findIndex((s) => s.id === id);
        if (idx === -1) throw new Error("Subscription not found");
        const existing = subscriptions[idx];
        const updated: UserSubscription = {
          ...existing,
          ...(data.planKey !== undefined ? { planKey: data.planKey } : {}),
          ...(data.status !== undefined ? { status: data.status } : {}),
          ...(data.providerKey !== undefined ? { providerKey: data.providerKey } : {}),
          ...(data.externalSubscriptionId !== undefined ? { externalSubscriptionId: data.externalSubscriptionId } : {}),
          ...(data.currentPeriodStart !== undefined ? { currentPeriodStart: data.currentPeriodStart } : {}),
          ...(data.currentPeriodEnd !== undefined ? { currentPeriodEnd: data.currentPeriodEnd } : {}),
          ...(data.cancelAtPeriodEnd !== undefined ? { cancelAtPeriodEnd: data.cancelAtPeriodEnd } : {}),
          ...(data.providerSequence !== undefined ? { providerSequence: data.providerSequence } : {}),
          updatedAt: new Date(),
        };
        subscriptions[idx] = updated;
        return updated;
      }),
    };

    mockEventRepo = {
      create: vi.fn(async (data: CreateSubscriptionProviderEventInput) => {
        const record: SubscriptionProviderEvent = {
          id: `evt_${providerEvents.length + 1}`,
          providerKey: data.providerKey,
          providerEventId: data.providerEventId,
          eventType: data.eventType,
          outcome: data.outcome ?? "RECEIVED",
          occurredAt: data.occurredAt,
          receivedAt: data.receivedAt ?? new Date(),
          processedAt: data.processedAt ?? null,
          payloadDigest: data.payloadDigest ?? null,
          metadata: data.metadata ?? null,
          subscriptionId: data.subscriptionId ?? null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        providerEvents.push(record);
        return record;
      }),
      findById: vi.fn(async (id: string) => providerEvents.find((e) => e.id === id) ?? null),
      findByProviderEventId: vi.fn(async (providerKey: string, providerEventId: string) =>
        providerEvents.find((e) => e.providerKey === providerKey && e.providerEventId === providerEventId) ?? null,
      ),
      updateOutcome: vi.fn(async (id: string, outcome, metadata, processedAt) => {
        const record = providerEvents.find((e) => e.id === id);
        if (!record) throw new Error("Event not found");
        record.outcome = outcome;
        if (metadata !== undefined) record.metadata = metadata ?? null;
        if (processedAt !== undefined) record.processedAt = processedAt ?? null;
        return record;
      }),
    };

    mockTransitionRepo = {
      create: vi.fn(async (data: CreateSubscriptionTransitionInput) => {
        const record: SubscriptionTransitionRecord = {
          id: `tr_${transitions.length + 1}`,
          subscriptionId: data.subscriptionId,
          userId: data.userId,
          fromStatus: data.fromStatus ?? null,
          toStatus: data.toStatus,
          fromPlan: data.fromPlan ?? null,
          toPlan: data.toPlan,
          source: data.source,
          transactionStrategy: data.transactionStrategy,
          reason: data.reason ?? null,
          providerEventId: data.providerEventId ?? null,
          actorId: data.actorId ?? null,
          subjectId: data.subjectId ?? null,
          requestId: data.requestId ?? null,
          correlationId: data.correlationId ?? null,
          metadata: data.metadata ?? null,
          createdAt: new Date(),
        };
        transitions.push(record);
        return record;
      }),
      findById: vi.fn(async (id: string) => transitions.find((t) => t.id === id) ?? null),
      findBySubscriptionId: vi.fn(async (subscriptionId: string) =>
        transitions.filter((t) => t.subscriptionId === subscriptionId),
      ),
      findByUserId: vi.fn(async (userId: string) => transitions.filter((t) => t.userId === userId)),
      findByCorrelationId: vi.fn(async (correlationId: string) =>
        transitions.filter((t) => t.correlationId === correlationId),
      ),
    };

    mockTxRunner = {
      run: vi.fn(async <T>(op: (ctx: TransactionContext) => Promise<T>, _opts?: TransactionOptions): Promise<T> => {
        const ctx: TransactionContext = {
          id: "test-tx",
          tx: {} as unknown as Prisma.TransactionClient,
          repositories: {
            subscriptionRepo: mockSubRepo,
            subscriptionProviderEventRepo: mockEventRepo,
            subscriptionTransitionRepo: mockTransitionRepo,
          } as unknown as IRepositoryContainer,
          depth: 1,
          isCompleted: false,
        };
        return await op(ctx);
      }),
      getActiveContext: vi.fn(() => undefined),
      isInTransaction: vi.fn(() => false),
    };

    service = new SubscriptionEventProcessorService(
      mockSubRepo,
      mockEventRepo,
      mockTransitionRepo,
      mockTxRunner,
      (key) => (key === "MOCK" ? mockProvider : (() => { throw new Error("Unknown"); })()),
    );
  });

  const validPayload = {
    providerEventId: "evt_test_100",
    eventType: "SUBSCRIPTION_ACTIVATED",
    occurredAt: "2026-09-22T10:00:00.000Z",
    subscription: {
      userId: "123e4567-e89b-12d3-a456-426614174000",
      externalSubscriptionId: "sub_ext_100",
      planKey: "PREMIUM",
      status: "ACTIVE",
      currentPeriodStart: "2026-09-22T10:00:00.000Z",
      currentPeriodEnd: "2026-10-22T10:00:00.000Z",
      cancelAtPeriodEnd: false,
      providerSequence: "1",
    },
  };

  it("processes a valid verified activation event and commits all records (TRANSACTIONALLY_COUPLED)", async () => {
    const result = await service.processWebhook({
      providerKey: "MOCK",
      signature: mockSecret,
      rawBody: JSON.stringify(validPayload),
    });

    expect(result.outcome).toBe("PROCESSED");
    expect(result.duplicate).toBe(false);
    expect(result.planKey).toBe("PREMIUM");
    expect(result.status).toBe("ACTIVE");

    expect(subscriptions).toHaveLength(1);
    expect(subscriptions[0].planKey).toBe("PREMIUM");
    expect(subscriptions[0].status).toBe("ACTIVE");

    expect(providerEvents).toHaveLength(1);
    expect(providerEvents[0].providerEventId).toBe("evt_test_100");
    expect(providerEvents[0].outcome).toBe("PROCESSED");

    expect(transitions).toHaveLength(1);
    expect(transitions[0].transactionStrategy).toBe("TRANSACTIONALLY_COUPLED");
    expect(transitions[0].toPlan).toBe("PREMIUM");
    expect(transitions[0].toStatus).toBe("ACTIVE");
  });

  it("rejects an invalid signature with zero mutation", async () => {
    await expect(
      service.processWebhook({
        providerKey: "MOCK",
        signature: "invalid-signature",
        rawBody: JSON.stringify(validPayload),
      }),
    ).rejects.toThrow(SubscriptionProviderVerificationError);

    expect(subscriptions).toHaveLength(0);
    expect(providerEvents).toHaveLength(0);
    expect(transitions).toHaveLength(0);
  });

  it("rejects an unknown provider with zero mutation", async () => {
    await expect(
      service.processWebhook({
        providerKey: "UNKNOWN_PROVIDER",
        signature: mockSecret,
        rawBody: JSON.stringify(validPayload),
      }),
    ).rejects.toThrow(SubscriptionEventUnknownProviderError);

    expect(subscriptions).toHaveLength(0);
    expect(providerEvents).toHaveLength(0);
  });

  it("rejects oversized payloads with zero mutation", async () => {
    const hugeBody = "x".repeat(65537);
    await expect(
      service.processWebhook({
        providerKey: "MOCK",
        signature: mockSecret,
        rawBody: hugeBody,
      }),
    ).rejects.toThrow(SubscriptionEventPayloadTooLargeError);

    expect(subscriptions).toHaveLength(0);
    expect(providerEvents).toHaveLength(0);
  });

  it("handles sequential duplicate replay safely without second transition or duplicate audit (AC-010, AC-020)", async () => {
    // First ingestion
    const firstResult = await service.processWebhook({
      providerKey: "MOCK",
      signature: mockSecret,
      rawBody: JSON.stringify(validPayload),
    });
    expect(firstResult.outcome).toBe("PROCESSED");
    expect(subscriptions).toHaveLength(1);
    expect(transitions).toHaveLength(1);

    // Duplicate ingestion with exact same payload
    const secondResult = await service.processWebhook({
      providerKey: "MOCK",
      signature: mockSecret,
      rawBody: JSON.stringify(validPayload),
    });

    expect(secondResult.outcome).toBe("DUPLICATE");
    expect(secondResult.duplicate).toBe(true);
    expect(secondResult.reason).toBe("EVENT_ALREADY_PROCESSED");

    // Zero second subscription mutation, zero second transition record
    expect(subscriptions).toHaveLength(1);
    expect(providerEvents).toHaveLength(1);
    expect(transitions).toHaveLength(1);
  });

  it("rejects conflicting payload for the same providerEventId with deterministic conflict (Section 11)", async () => {
    await service.processWebhook({
      providerKey: "MOCK",
      signature: mockSecret,
      rawBody: JSON.stringify(validPayload),
    });

    // Same event ID, but different user / dates / payload
    const conflictingPayload = {
      ...validPayload,
      subscription: {
        ...validPayload.subscription,
        userId: "999e4567-e89b-12d3-a456-426614174999",
      },
    };

    await expect(
      service.processWebhook({
        providerKey: "MOCK",
        signature: mockSecret,
        rawBody: JSON.stringify(conflictingPayload),
      }),
    ).rejects.toThrow(SubscriptionEventIdempotencyConflictError);

    // No changes applied from conflicting payload
    expect(subscriptions).toHaveLength(1);
    expect(subscriptions[0].userId).toBe("123e4567-e89b-12d3-a456-426614174000");
  });

  it("prevents stale sequence from overwriting newer state (AC-017)", async () => {
    // Ingest event with sequence "2"
    const newerPayload = {
      ...validPayload,
      providerEventId: "evt_seq_2",
      subscription: {
        ...validPayload.subscription,
        providerSequence: "2",
      },
    };
    await service.processWebhook({
      providerKey: "MOCK",
      signature: mockSecret,
      rawBody: JSON.stringify(newerPayload),
    });
    expect(subscriptions[0].providerSequence).toBe("2");

    // Attempt to ingest older event with sequence "1"
    const olderPayload = {
      ...validPayload,
      providerEventId: "evt_seq_1",
      subscription: {
        ...validPayload.subscription,
        status: "PAST_DUE",
        providerSequence: "1",
      },
    };
    const staleResult = await service.processWebhook({
      providerKey: "MOCK",
      signature: mockSecret,
      rawBody: JSON.stringify(olderPayload),
    });

    expect(staleResult.outcome).toBe("IGNORED");
    expect(staleResult.reason).toBe("STALE_SEQUENCE");

    // Subscription remains ACTIVE at sequence 2, not overwritten to PAST_DUE
    expect(subscriptions[0].status).toBe("ACTIVE");
    expect(subscriptions[0].providerSequence).toBe("2");
    // Provider event recorded as IGNORED
    const ignoredEvent = providerEvents.find((e) => e.providerEventId === "evt_seq_1");
    expect(ignoredEvent?.outcome).toBe("IGNORED");
  });

  it("enforces terminal state protection preventing reactivation of CANCELLED subscription (AC-018)", async () => {
    // 1. Ingest cancellation
    const cancelPayload = {
      ...validPayload,
      providerEventId: "evt_cancel_1",
      eventType: "SUBSCRIPTION_CANCELLED",
      subscription: {
        ...validPayload.subscription,
        status: "CANCELLED",
        providerSequence: "2",
      },
    };
    await service.processWebhook({
      providerKey: "MOCK",
      signature: mockSecret,
      rawBody: JSON.stringify(cancelPayload),
    });
    expect(subscriptions[0].status).toBe("CANCELLED");

    // 2. Attempt to reactivate the same subscription to ACTIVE
    const reactivatePayload = {
      ...validPayload,
      providerEventId: "evt_reactivate_1",
      subscription: {
        ...validPayload.subscription,
        status: "ACTIVE",
        providerSequence: "3",
      },
    };
    const result = await service.processWebhook({
      providerKey: "MOCK",
      signature: mockSecret,
      rawBody: JSON.stringify(reactivatePayload),
    });

    expect(result.outcome).toBe("IGNORED");
    expect(result.reason).toBe("IMPOSSIBLE_TERMINAL_REVIVAL");
    expect(subscriptions[0].status).toBe("CANCELLED");
  });

  it("rolls back activation grant when transition audit write fails (D6 TRANSACTIONALLY_COUPLED, AC-014)", async () => {
    // Make transition create fail
    mockTransitionRepo.create = vi.fn().mockRejectedValue(new Error("Audit DB disk full"));

    // Make txRunner simulate rollback by clearing mutations created during op
    mockTxRunner.run = vi.fn(async (op) => {
      const snapSubs = [...subscriptions];
      const snapEvts = [...providerEvents];
      try {
        const ctx = {
          id: "rollback-tx",
          tx: {} as unknown as Prisma.TransactionClient,
          repositories: {
            subscriptionRepo: mockSubRepo,
            subscriptionProviderEventRepo: mockEventRepo,
            subscriptionTransitionRepo: mockTransitionRepo,
          } as unknown as IRepositoryContainer,
          depth: 1,
          isCompleted: false,
        };
        return await op(ctx);
      } catch (err) {
        subscriptions = snapSubs;
        providerEvents = snapEvts;
        throw err;
      }
    });

    await expect(
      service.processWebhook({
        providerKey: "MOCK",
        signature: mockSecret,
        rawBody: JSON.stringify(validPayload),
      }),
    ).rejects.toThrow("Audit DB disk full");

    // Activation rolled back completely
    expect(subscriptions).toHaveLength(0);
    expect(providerEvents).toHaveLength(0);
  });

  it("preserves access reduction when audit persistence fails during revocation (D6 STATE_FIRST, AC-015, AC-016)", async () => {
    // 1. Initial active subscription
    await service.processWebhook({
      providerKey: "MOCK",
      signature: mockSecret,
      rawBody: JSON.stringify(validPayload),
    });
    expect(subscriptions[0].status).toBe("ACTIVE");

    // 2. Fail transitionRepo.create
    mockTransitionRepo.create = vi.fn().mockRejectedValue(new Error("Audit DB unreachable"));

    // 3. Ingest revocation (PAST_DUE)
    const downgradePayload = {
      ...validPayload,
      providerEventId: "evt_downgrade_1",
      eventType: "SUBSCRIPTION_PAST_DUE",
      subscription: {
        ...validPayload.subscription,
        status: "PAST_DUE",
        providerSequence: "2",
      },
    };

    const result = await service.processWebhook({
      providerKey: "MOCK",
      signature: mockSecret,
      rawBody: JSON.stringify(downgradePayload),
    });

    // Access reduction committed! Status is PAST_DUE
    expect(result.outcome).toBe("PROCESSED");
    expect(result.status).toBe("PAST_DUE");
    expect(result.auditPending).toBe(true);
    expect(subscriptions[0].status).toBe("PAST_DUE");

    // Durable audit-pending evidence recorded in provider event
    const event = providerEvents.find((e) => e.providerEventId === "evt_downgrade_1");
    expect(event).toBeDefined();
    expect((event?.metadata as Record<string, unknown> | null)?.auditPending).toBe(true);
  });
});
