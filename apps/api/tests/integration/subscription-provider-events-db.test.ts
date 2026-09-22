import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { PrismaClient } from "@prisma/client";
import { assertSafeTestDatabase, sanitizeDiagnosticMessage, cleanAllTestTables } from "../helpers/test-db-guard.js";
import {
  createRepositoryContainer,
  type IRepositoryContainer,
} from "../../src/infrastructure/database/repository-factory.js";
import { PrismaTransactionRunner } from "../../src/infrastructure/database/transaction-runner.js";
import { SubscriptionEventProcessorService } from "../../src/modules/subscription/subscription-event-processor.service.js";
import { MockSubscriptionProvider } from "../../src/modules/subscription/provider/mock-subscription-provider.js";
import { validateSubscriptionProviderEnvironment } from "../../src/modules/subscription/provider/subscription-provider.config.js";
import { SubscriptionEntitlementService } from "../../src/modules/subscription/subscription-entitlement.service.js";
import { SubscriptionEventIdempotencyConflictError } from "../../src/modules/subscription/subscription-event.errors.js";

describe("FEAT-052 Verified Provider Events & Idempotent Processing (Live PostgreSQL Integration)", () => {
  const testDbUrl =
    process.env.TEST_DATABASE_URL ||
    process.env.DATABASE_URL ||
    "postgresql://postgres:postgrespassword@localhost:5432/aura_capital_test_feat019_rework2_fresh";

  let prisma: PrismaClient;
  let repos: IRepositoryContainer;
  let runner: PrismaTransactionRunner;
  let mockProvider: MockSubscriptionProvider;
  let entitlementService: SubscriptionEntitlementService;
  let processor: SubscriptionEventProcessorService;

  const mockSecret = "c".repeat(32);
  const safeConfig = validateSubscriptionProviderEnvironment({
    nodeEnv: "test",
    providerMode: "mock",
    isCi: false,
    databaseUrl: testDbUrl,
    runId: "run_db",
    workerId: "w_db",
    mockWebhookSecret: mockSecret,
  });

  beforeAll(async () => {
    assertSafeTestDatabase(testDbUrl, "test");
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: testDbUrl,
        },
      },
    });

    try {
      await prisma.$connect();
      repos = createRepositoryContainer(prisma);
      runner = new PrismaTransactionRunner(prisma, createRepositoryContainer);
      mockProvider = new MockSubscriptionProvider({ config: safeConfig });
      entitlementService = new SubscriptionEntitlementService(repos.subscriptionRepo);
      processor = new SubscriptionEventProcessorService(
        repos.subscriptionRepo,
        repos.subscriptionProviderEventRepo,
        repos.subscriptionTransitionRepo,
        runner,
        () => mockProvider,
      );
    } catch (err: unknown) {
      const errorMessage = sanitizeDiagnosticMessage(err instanceof Error ? err.message : String(err));
      throw new Error(`[DB_CONNECTION_FAILED] Required PostgreSQL test database unreachable: ${errorMessage}`);
    }
  });

  afterAll(async () => {
    if (prisma) {
      await cleanAllTestTables(prisma);
      await prisma.$disconnect();
    }
  });

  beforeEach(async () => {
    await cleanAllTestTables(prisma);
  });

  async function createTestUser(emailPrefix = "sub_event_user") {
    return prisma.user.create({
      data: {
        email: `${emailPrefix}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}@example.com`,
        displayName: "Subscriber",
        status: "ACTIVE",
      },
    });
  }

  function makePayload(
    userId: string,
    eventId: string,
    overrides: {
      eventType?: string;
      subscription?: Record<string, unknown>;
      [key: string]: unknown;
    } = {},
  ) {
    const { subscription: subOverrides, ...rootOverrides } = overrides;
    return {
      providerEventId: eventId,
      eventType: "SUBSCRIPTION_ACTIVATED",
      occurredAt: new Date().toISOString(),
      subscription: {
        userId,
        externalSubscriptionId: `sub_ext_${eventId}`,
        planKey: "PREMIUM",
        status: "ACTIVE",
        currentPeriodStart: new Date().toISOString(),
        currentPeriodEnd: new Date(Date.now() + 30 * 86400000).toISOString(),
        cancelAtPeriodEnd: false,
        providerSequence: "1",
        ...(subOverrides ?? {}),
      },
      ...rootOverrides,
    };
  }

  it("1. first verified event commits subscription, event, and transition record atomically", async () => {
    const user = await createTestUser();
    const payload = makePayload(user.id, "evt_first_1");

    const result = await processor.processWebhook({
      providerKey: "MOCK",
      signature: mockSecret,
      rawBody: JSON.stringify(payload),
    });

    expect(result.outcome).toBe("PROCESSED");
    expect(result.duplicate).toBe(false);
    expect(result.status).toBe("ACTIVE");
    expect(result.planKey).toBe("PREMIUM");

    // Verify PostgreSQL persistence
    const sub = await repos.subscriptionRepo.findActiveByUserId(user.id);
    expect(sub).not.toBeNull();
    expect(sub?.status).toBe("ACTIVE");
    expect(sub?.planKey).toBe("PREMIUM");

    const event = await repos.subscriptionProviderEventRepo.findByProviderEventId("MOCK", "evt_first_1");
    expect(event).not.toBeNull();
    expect(event?.outcome).toBe("PROCESSED");

    const transitions = await repos.subscriptionTransitionRepo.findByUserId(user.id);
    expect(transitions).toHaveLength(1);
    expect(transitions[0].transactionStrategy).toBe("TRANSACTIONALLY_COUPLED");
    expect(transitions[0].toStatus).toBe("ACTIVE");
    expect(transitions[0].toPlan).toBe("PREMIUM");

    // Entitlement derivation
    const entitlement = await entitlementService.resolveUserEntitlement(user.id);
    expect(entitlement.isEntitled).toBe(true);
    expect(entitlement.entitlements).toContain("PREMIUM_ACCESS");
  });

  it("2. sequential duplicate delivery produces zero second subscription mutation and zero duplicate transition", async () => {
    const user = await createTestUser();
    const payload = makePayload(user.id, "evt_seq_dup_1");

    const res1 = await processor.processWebhook({
      providerKey: "MOCK",
      signature: mockSecret,
      rawBody: JSON.stringify(payload),
    });
    expect(res1.outcome).toBe("PROCESSED");

    const res2 = await processor.processWebhook({
      providerKey: "MOCK",
      signature: mockSecret,
      rawBody: JSON.stringify(payload),
    });
    expect(res2.outcome).toBe("DUPLICATE");
    expect(res2.duplicate).toBe(true);

    const allSubs = await repos.subscriptionRepo.findAllByUserId(user.id);
    expect(allSubs).toHaveLength(1);

    const transitions = await repos.subscriptionTransitionRepo.findByUserId(user.id);
    expect(transitions).toHaveLength(1);
  });

  it("3. 5+ concurrent duplicates converge cleanly to exactly one durable event and one transition (AC-011)", async () => {
    const user = await createTestUser();
    const payload = makePayload(user.id, "evt_concurrent_1");
    const rawBody = JSON.stringify(payload);

    // Launch 7 concurrent submissions
    const promises = Array.from({ length: 7 }, () =>
      processor.processWebhook({
        providerKey: "MOCK",
        signature: mockSecret,
        rawBody,
      }),
    );

    const results = await Promise.all(promises);

    // All must succeed without uncaught unique constraint violation
    expect(results).toHaveLength(7);

    const processedCount = results.filter((r) => r.outcome === "PROCESSED").length;
    const duplicateCount = results.filter((r) => r.outcome === "DUPLICATE").length;

    expect(processedCount).toBe(1);
    expect(duplicateCount).toBe(6);

    // Verify DB integrity
    const allSubs = await repos.subscriptionRepo.findAllByUserId(user.id);
    expect(allSubs).toHaveLength(1);

    const event = await repos.subscriptionProviderEventRepo.findByProviderEventId("MOCK", "evt_concurrent_1");
    expect(event).not.toBeNull();

    const transitions = await repos.subscriptionTransitionRepo.findByUserId(user.id);
    expect(transitions).toHaveLength(1);
  });

  it("4. 10 consecutive iterations of concurrent duplicates stress test (Section 38)", async () => {
    const user = await createTestUser();

    for (let i = 1; i <= 10; i++) {
      const eventId = `evt_stress_${i}`;
      const payload = makePayload(user.id, eventId, {
        subscription: {
          externalSubscriptionId: `sub_ext_stress_${i}`,
          providerSequence: String(i),
        },
      });
      const rawBody = JSON.stringify(payload);

      const promises = Array.from({ length: 5 }, () =>
        processor.processWebhook({
          providerKey: "MOCK",
          signature: mockSecret,
          rawBody,
        }),
      );

      const results = await Promise.all(promises);
      expect(results).toHaveLength(5);

      const processed = results.filter((r) => r.outcome === "PROCESSED").length;
      const duplicate = results.filter((r) => r.outcome === "DUPLICATE").length;

      expect(processed).toBe(1);
      expect(duplicate).toBe(4);
    }
  });

  it("5. conflicting payload for the same providerEventId returns deterministic conflict without second transition", async () => {
    const userA = await createTestUser();
    const userB = await createTestUser();
    const payloadA = makePayload(userA.id, "evt_conflict_1");

    await processor.processWebhook({
      providerKey: "MOCK",
      signature: mockSecret,
      rawBody: JSON.stringify(payloadA),
    });

    const conflictingPayload = {
      ...payloadA,
      subscription: {
        ...payloadA.subscription,
        userId: userB.id,
      },
    };

    await expect(
      processor.processWebhook({
        providerKey: "MOCK",
        signature: mockSecret,
        rawBody: JSON.stringify(conflictingPayload),
      }),
    ).rejects.toThrow(SubscriptionEventIdempotencyConflictError);

    // User B was not given a subscription
    const userBSubs = await repos.subscriptionRepo.findAllByUserId(userB.id);
    expect(userBSubs).toHaveLength(0);
  });

  it("6. stale sequence does not silently overwrite newer authoritative state (AC-017)", async () => {
    const user = await createTestUser();

    // 1. First event with sequence 5
    const seq5Payload = makePayload(user.id, "evt_seq_5", {
      subscription: {
        externalSubscriptionId: "sub_seq_order",
        providerSequence: "5",
        status: "ACTIVE",
      },
    });
    await processor.processWebhook({
      providerKey: "MOCK",
      signature: mockSecret,
      rawBody: JSON.stringify(seq5Payload),
    });

    // 2. Incoming out-of-order event with sequence 4 attempting PAST_DUE
    const seq4Payload = makePayload(user.id, "evt_seq_4", {
      subscription: {
        externalSubscriptionId: "sub_seq_order",
        providerSequence: "4",
        status: "PAST_DUE",
      },
    });
    const result = await processor.processWebhook({
      providerKey: "MOCK",
      signature: mockSecret,
      rawBody: JSON.stringify(seq4Payload),
    });

    expect(result.outcome).toBe("IGNORED");
    expect(result.reason).toBe("STALE_SEQUENCE");

    // Subscription remains ACTIVE at sequence 5
    const sub = await repos.subscriptionRepo.findByExternalSubscriptionId("MOCK", "sub_seq_order");
    expect(sub?.status).toBe("ACTIVE");
    expect(sub?.providerSequence).toBe("5");
  });

  it("7. terminal state protection prevents reactivation of CANCELLED subscription (AC-018)", async () => {
    const user = await createTestUser();

    // 1. Initial activation
    await processor.processWebhook({
      providerKey: "MOCK",
      signature: mockSecret,
      rawBody: JSON.stringify(makePayload(user.id, "evt_act_term", {
        subscription: { externalSubscriptionId: "sub_terminal_test", providerSequence: "1" },
      })),
    });

    // 2. Cancellation
    await processor.processWebhook({
      providerKey: "MOCK",
      signature: mockSecret,
      rawBody: JSON.stringify(makePayload(user.id, "evt_canc_term", {
        eventType: "SUBSCRIPTION_CANCELLED",
        subscription: {
          externalSubscriptionId: "sub_terminal_test",
          status: "CANCELLED",
          providerSequence: "2",
        },
      })),
    });

    // 3. Stale/invalid event attempting to revive to ACTIVE
    const result = await processor.processWebhook({
      providerKey: "MOCK",
      signature: mockSecret,
      rawBody: JSON.stringify(makePayload(user.id, "evt_revive_term", {
        eventType: "SUBSCRIPTION_ACTIVATED",
        subscription: {
          externalSubscriptionId: "sub_terminal_test",
          status: "ACTIVE",
          providerSequence: "3",
        },
      })),
    });

    expect(result.outcome).toBe("IGNORED");
    expect(result.reason).toBe("IMPOSSIBLE_TERMINAL_REVIVAL");

    const sub = await repos.subscriptionRepo.findByExternalSubscriptionId("MOCK", "sub_terminal_test");
    expect(sub?.status).toBe("CANCELLED");
  });

  it("8. D6 state-first revocation: access reduction remains committed even if audit write fails (AC-015, AC-016)", async () => {
    const user = await createTestUser();

    // 1. Ingest active subscription
    await processor.processWebhook({
      providerKey: "MOCK",
      signature: mockSecret,
      rawBody: JSON.stringify(makePayload(user.id, "evt_active_rev_test", {
        subscription: { externalSubscriptionId: "sub_rev_test", providerSequence: "1" },
      })),
    });

    // 2. Instantiate processor with failing transition repository
    const failingTransitionRepo = {
      ...repos.subscriptionTransitionRepo,
      create: async () => {
        throw new Error("Simulated transition audit storage failure");
      },
    };

    const failingAuditProcessor = new SubscriptionEventProcessorService(
      repos.subscriptionRepo,
      repos.subscriptionProviderEventRepo,
      failingTransitionRepo,
      runner,
      () => mockProvider,
    );

    // 3. Ingest downgrade to PAST_DUE
    const downgradeResult = await failingAuditProcessor.processWebhook({
      providerKey: "MOCK",
      signature: mockSecret,
      rawBody: JSON.stringify(makePayload(user.id, "evt_downgrade_test", {
        eventType: "SUBSCRIPTION_PAST_DUE",
        subscription: {
          externalSubscriptionId: "sub_rev_test",
          status: "PAST_DUE",
          providerSequence: "2",
        },
      })),
    });

    expect(downgradeResult.outcome).toBe("PROCESSED");
    expect(downgradeResult.status).toBe("PAST_DUE");
    expect(downgradeResult.auditPending).toBe(true);

    // Access reduction is durably committed in PostgreSQL!
    const sub = await repos.subscriptionRepo.findByExternalSubscriptionId("MOCK", "sub_rev_test");
    expect(sub?.status).toBe("PAST_DUE");

    // Entitlement resolver denies access
    const entitlement = await entitlementService.resolveUserEntitlement(user.id);
    expect(entitlement.isEntitled).toBe(false);
    expect(entitlement.entitlements).toEqual([]);

    // Provider event records durable auditPending evidence
    const event = await repos.subscriptionProviderEventRepo.findByProviderEventId("MOCK", "evt_downgrade_test");
    expect(event).not.toBeNull();
    expect((event?.metadata as Record<string, unknown>)?.auditPending).toBe(true);
  });

  it("9. entitlement regression across full lifecycle transitions via FEAT-049 resolver", async () => {
    const user = await createTestUser();

    // ACTIVE -> PREMIUM_ACCESS
    await processor.processWebhook({
      providerKey: "MOCK",
      signature: mockSecret,
      rawBody: JSON.stringify(makePayload(user.id, "evt_life_1", {
        subscription: { externalSubscriptionId: "sub_life", status: "ACTIVE", providerSequence: "1" },
      })),
    });
    let ent = await entitlementService.resolveUserEntitlement(user.id);
    expect(ent.isEntitled).toBe(true);
    expect(ent.entitlements).toContain("PREMIUM_ACCESS");

    // PAST_DUE -> denied
    await processor.processWebhook({
      providerKey: "MOCK",
      signature: mockSecret,
      rawBody: JSON.stringify(makePayload(user.id, "evt_life_2", {
        eventType: "SUBSCRIPTION_PAST_DUE",
        subscription: { externalSubscriptionId: "sub_life", status: "PAST_DUE", providerSequence: "2" },
      })),
    });
    ent = await entitlementService.resolveUserEntitlement(user.id);
    expect(ent.isEntitled).toBe(false);
    expect(ent.entitlements).toEqual([]);

    // CANCELLED -> denied
    await processor.processWebhook({
      providerKey: "MOCK",
      signature: mockSecret,
      rawBody: JSON.stringify(makePayload(user.id, "evt_life_3", {
        eventType: "SUBSCRIPTION_CANCELLED",
        subscription: { externalSubscriptionId: "sub_life", status: "CANCELLED", providerSequence: "3" },
      })),
    });
    ent = await entitlementService.resolveUserEntitlement(user.id);
    expect(ent.isEntitled).toBe(false);
    expect(ent.entitlements).toEqual([]);
  });
});
