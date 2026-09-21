import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { PrismaClient } from "@prisma/client";
import { assertSafeTestDatabase, sanitizeDiagnosticMessage, cleanAllTestTables } from "../helpers/test-db-guard.js";
import {
  createRepositoryContainer,
  type IRepositoryContainer,
} from "../../src/infrastructure/database/repository-factory.js";
import { PrismaTransactionRunner } from "../../src/infrastructure/database/transaction-runner.js";
import { AppError } from "../../src/shared/errors/error-envelope.js";

describe("FEAT-048 Subscription Domain Schema & Persistence Foundation (Integration)", () => {
  const testDbUrl =
    process.env.TEST_DATABASE_URL ||
    process.env.DATABASE_URL ||
    "postgresql://postgres:postgrespassword@localhost:5432/aura_capital_test_feat019_rework2_fresh";

  let prisma: PrismaClient;
  let repos: IRepositoryContainer;
  let runner: PrismaTransactionRunner;

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

  // Helper to create an active test user
  async function createTestUser(emailPrefix = "sub_user") {
    return prisma.user.create({
      data: {
        email: `${emailPrefix}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}@example.com`,
        displayName: "Subscription Learner",
        status: "ACTIVE",
      },
    });
  }

  // ============================================================================
  // AC-001..AC-004: Model Primitives & Server-Generated UUIDs
  // ============================================================================
  describe("AC-001..AC-004: Model Primitives & Server-Generated UUIDs", () => {
    it("creates a UserSubscription with server-generated UUID, server timestamps, and defaults", async () => {
      const user = await createTestUser();
      const start = new Date();
      const end = new Date(start.getTime() + 30 * 24 * 60 * 60 * 1000);

      const sub = await repos.subscriptionRepo.create({
        userId: user.id,
        planKey: "PREMIUM",
        status: "ACTIVE",
        providerKey: "MOCK_PROVIDER",
        externalSubscriptionId: "sub_ext_12345",
        currentPeriodStart: start,
        currentPeriodEnd: end,
        cancelAtPeriodEnd: false,
      });

      expect(sub.id).toBeDefined();
      expect(sub.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
      expect(sub.userId).toBe(user.id);
      expect(sub.planKey).toBe("PREMIUM");
      expect(sub.status).toBe("ACTIVE");
      expect(sub.providerKey).toBe("MOCK_PROVIDER");
      expect(sub.externalSubscriptionId).toBe("sub_ext_12345");
      expect(sub.currentPeriodStart).toBeInstanceOf(Date);
      expect(sub.currentPeriodEnd).toBeInstanceOf(Date);
      expect(sub.cancelAtPeriodEnd).toBe(false);
      expect(sub.createdAt).toBeInstanceOf(Date);
      expect(sub.updatedAt).toBeInstanceOf(Date);
    });

    it("creates a SubscriptionProviderEvent with server-generated UUID, event outcome, and metadata", async () => {
      const event = await repos.subscriptionProviderEventRepo.create({
        providerKey: "MOCK_PROVIDER",
        providerEventId: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        eventType: "customer.subscription.created",
        outcome: "RECEIVED",
        occurredAt: new Date(),
        metadata: { source: "test_harness", mockSignatureValid: true },
      });

      expect(event.id).toBeDefined();
      expect(event.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
      expect(event.providerKey).toBe("MOCK_PROVIDER");
      expect(event.eventType).toBe("customer.subscription.created");
      expect(event.outcome).toBe("RECEIVED");
      expect(event.occurredAt).toBeInstanceOf(Date);
      expect(event.receivedAt).toBeInstanceOf(Date);
      expect(event.processedAt).toBeNull();
      expect(event.createdAt).toBeInstanceOf(Date);
    });

    it("creates a SubscriptionTransitionRecord with server-generated UUID, source, and strategy", async () => {
      const user = await createTestUser();
      const start = new Date();
      const end = new Date(start.getTime() + 30 * 24 * 60 * 60 * 1000);

      const sub = await repos.subscriptionRepo.create({
        userId: user.id,
        planKey: "PREMIUM",
        status: "ACTIVE",
        currentPeriodStart: start,
        currentPeriodEnd: end,
      });

      const transition = await repos.subscriptionTransitionRepo.create({
        subscriptionId: sub.id,
        userId: user.id,
        fromStatus: null,
        toStatus: "ACTIVE",
        fromPlan: "FREE",
        toPlan: "PREMIUM",
        source: "USER_ACTION",
        transactionStrategy: "TRANSACTIONALLY_COUPLED",
        reason: "Initial premium upgrade",
        correlationId: "corr_initial_upgrade_123",
      });

      expect(transition.id).toBeDefined();
      expect(transition.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
      expect(transition.subscriptionId).toBe(sub.id);
      expect(transition.userId).toBe(user.id);
      expect(transition.fromStatus).toBeNull();
      expect(transition.toStatus).toBe("ACTIVE");
      expect(transition.fromPlan).toBe("FREE");
      expect(transition.toPlan).toBe("PREMIUM");
      expect(transition.source).toBe("USER_ACTION");
      expect(transition.transactionStrategy).toBe("TRANSACTIONALLY_COUPLED");
      expect(transition.reason).toBe("Initial premium upgrade");
      expect(transition.correlationId).toBe("corr_initial_upgrade_123");
      expect(transition.createdAt).toBeInstanceOf(Date);
    });
  });

  // ============================================================================
  // AC-002: Default User Semantics (No Row -> FREE)
  // ============================================================================
  describe("AC-002: Default User Semantics (No DB Row -> FREE)", () => {
    it("safely returns null when querying active subscription for a user without a subscription record without creating any rows", async () => {
      const user = await createTestUser("fresh_user");

      const activeSub = await repos.subscriptionRepo.findActiveByUserId(user.id);
      expect(activeSub).toBeNull();

      const allSubs = await repos.subscriptionRepo.findAllByUserId(user.id);
      expect(allSubs).toHaveLength(0);

      const dbRowCount = await prisma.userSubscription.count({
        where: { userId: user.id },
      });
      expect(dbRowCount).toBe(0);
    });
  });

  // ============================================================================
  // AC-003, AC-012: One Non-Terminal Subscription Per User Invariant
  // ============================================================================
  describe("AC-003, AC-012: One Non-Terminal Subscription Per User (Partial Unique Index)", () => {
    it("enforces PostgreSQL partial unique index rejecting a second simultaneous ACTIVE subscription", async () => {
      const user = await createTestUser("active_user");
      const start = new Date();
      const end = new Date(start.getTime() + 30 * 24 * 60 * 60 * 1000);

      // 1. Create first ACTIVE subscription -> succeeds
      await repos.subscriptionRepo.create({
        userId: user.id,
        planKey: "PREMIUM",
        status: "ACTIVE",
        currentPeriodStart: start,
        currentPeriodEnd: end,
      });

      // 2. Attempt to create second ACTIVE subscription -> rejected by PostgreSQL partial unique index
      await expect(
        repos.subscriptionRepo.create({
          userId: user.id,
          planKey: "PREMIUM",
          status: "ACTIVE",
          currentPeriodStart: start,
          currentPeriodEnd: end,
        }),
      ).rejects.toThrow();
    });

    it("enforces PostgreSQL partial unique index rejecting PAST_DUE when an ACTIVE subscription exists", async () => {
      const user = await createTestUser("conflict_user");
      const start = new Date();
      const end = new Date(start.getTime() + 30 * 24 * 60 * 60 * 1000);

      await repos.subscriptionRepo.create({
        userId: user.id,
        planKey: "PREMIUM",
        status: "ACTIVE",
        currentPeriodStart: start,
        currentPeriodEnd: end,
      });

      await expect(
        repos.subscriptionRepo.create({
          userId: user.id,
          planKey: "PREMIUM",
          status: "PAST_DUE",
          currentPeriodStart: start,
          currentPeriodEnd: end,
        }),
      ).rejects.toThrow();
    });

    it("permits multiple historical terminal subscriptions (CANCELLED, EXPIRED) alongside an ACTIVE subscription", async () => {
      const user = await createTestUser("multi_sub_user");
      const now = new Date();
      const pastStart1 = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
      const pastEnd1 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const pastStart2 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const pastEnd2 = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
      const currentEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      // 1. First subscription expired
      const sub1 = await repos.subscriptionRepo.create({
        userId: user.id,
        planKey: "PREMIUM",
        status: "EXPIRED",
        currentPeriodStart: pastStart1,
        currentPeriodEnd: pastEnd1,
      });

      // 2. Second subscription cancelled
      const sub2 = await repos.subscriptionRepo.create({
        userId: user.id,
        planKey: "PREMIUM",
        status: "CANCELLED",
        currentPeriodStart: pastStart2,
        currentPeriodEnd: pastEnd2,
      });

      // 3. Third subscription currently active
      const sub3 = await repos.subscriptionRepo.create({
        userId: user.id,
        planKey: "PREMIUM",
        status: "ACTIVE",
        currentPeriodStart: now,
        currentPeriodEnd: currentEnd,
      });

      expect(sub1.id).toBeDefined();
      expect(sub2.id).toBeDefined();
      expect(sub3.id).toBeDefined();

      const allSubs = await repos.subscriptionRepo.findAllByUserId(user.id);
      expect(allSubs).toHaveLength(3);

      const active = await repos.subscriptionRepo.findActiveByUserId(user.id);
      expect(active?.id).toBe(sub3.id);
      expect(active?.status).toBe("ACTIVE");
    });

    it("handles concurrent creation race converging to at most one non-terminal subscription", async () => {
      const user = await createTestUser("concurrency_user");
      const start = new Date();
      const end = new Date(start.getTime() + 30 * 24 * 60 * 60 * 1000);

      const attempts = 8;
      const results = await Promise.allSettled(
        Array.from({ length: attempts }).map(() =>
          repos.subscriptionRepo.create({
            userId: user.id,
            planKey: "PREMIUM",
            status: "ACTIVE",
            currentPeriodStart: start,
            currentPeriodEnd: end,
          }),
        ),
      );

      const fulfilled = results.filter((r) => r.status === "fulfilled");
      const rejected = results.filter((r) => r.status === "rejected");

      // Exactly 1 must win the race; the others must be rejected by PostgreSQL
      expect(fulfilled).toHaveLength(1);
      expect(rejected).toHaveLength(attempts - 1);

      const count = await prisma.userSubscription.count({
        where: { userId: user.id, status: "ACTIVE" },
      });
      expect(count).toBe(1);
    });
  });

  // ============================================================================
  // AC-010: Provider Event Idempotency
  // ============================================================================
  describe("AC-010: Provider Event Idempotency & Unique Identity", () => {
    it("rejects duplicate (providerKey, providerEventId) at PostgreSQL level", async () => {
      const providerKey = "MOCK_STRIPE";
      const providerEventId = `evt_dedup_${Date.now()}`;

      // First insertion succeeds
      const first = await repos.subscriptionProviderEventRepo.create({
        providerKey,
        providerEventId,
        eventType: "customer.subscription.updated",
        outcome: "RECEIVED",
        occurredAt: new Date(),
      });
      expect(first.id).toBeDefined();

      // Second insertion with same providerKey and providerEventId must be rejected
      await expect(
        repos.subscriptionProviderEventRepo.create({
          providerKey,
          providerEventId,
          eventType: "customer.subscription.updated",
          outcome: "RECEIVED",
          occurredAt: new Date(),
        }),
      ).rejects.toThrow();
    });

    it("converges to exactly one durable record under concurrent duplicate delivery", async () => {
      const providerKey = "MOCK_STRIPE";
      const providerEventId = `evt_concurrent_${Date.now()}`;

      const attempts = 8;
      const results = await Promise.allSettled(
        Array.from({ length: attempts }).map(() =>
          repos.subscriptionProviderEventRepo.create({
            providerKey,
            providerEventId,
            eventType: "invoice.paid",
            outcome: "RECEIVED",
            occurredAt: new Date(),
          }),
        ),
      );

      const fulfilled = results.filter((r) => r.status === "fulfilled");
      const rejected = results.filter((r) => r.status === "rejected");

      expect(fulfilled).toHaveLength(1);
      expect(rejected).toHaveLength(attempts - 1);

      const event = await repos.subscriptionProviderEventRepo.findByProviderEventId(
        providerKey,
        providerEventId,
      );
      expect(event).not.toBeNull();
      expect(event?.providerEventId).toBe(providerEventId);
    });
  });

  // ============================================================================
  // AC-011: External Subscription ID Uniqueness
  // ============================================================================
  describe("AC-011: External Subscription ID Uniqueness", () => {
    it("rejects duplicate externalSubscriptionId within the same providerKey", async () => {
      const user1 = await createTestUser("sub_ext_u1");
      const user2 = await createTestUser("sub_ext_u2");
      const start = new Date();
      const end = new Date(start.getTime() + 30 * 24 * 60 * 60 * 1000);
      const externalId = `sub_external_${Date.now()}`;

      await repos.subscriptionRepo.create({
        userId: user1.id,
        planKey: "PREMIUM",
        status: "ACTIVE",
        providerKey: "PROVIDER_PADDLE",
        externalSubscriptionId: externalId,
        currentPeriodStart: start,
        currentPeriodEnd: end,
      });

      await expect(
        repos.subscriptionRepo.create({
          userId: user2.id,
          planKey: "PREMIUM",
          status: "ACTIVE",
          providerKey: "PROVIDER_PADDLE",
          externalSubscriptionId: externalId,
          currentPeriodStart: start,
          currentPeriodEnd: end,
        }),
      ).rejects.toThrow();
    });

    it("permits multiple subscriptions with null externalSubscriptionId", async () => {
      const user1 = await createTestUser("sub_null_u1");
      const user2 = await createTestUser("sub_null_u2");
      const start = new Date();
      const end = new Date(start.getTime() + 30 * 24 * 60 * 60 * 1000);

      const sub1 = await repos.subscriptionRepo.create({
        userId: user1.id,
        planKey: "FREE",
        status: "EXPIRED",
        providerKey: "INTERNAL",
        externalSubscriptionId: null,
        currentPeriodStart: start,
        currentPeriodEnd: end,
      });

      const sub2 = await repos.subscriptionRepo.create({
        userId: user2.id,
        planKey: "FREE",
        status: "EXPIRED",
        providerKey: "INTERNAL",
        externalSubscriptionId: null,
        currentPeriodStart: start,
        currentPeriodEnd: end,
      });

      expect(sub1.id).toBeDefined();
      expect(sub2.id).toBeDefined();
    });
  });

  // ============================================================================
  // AC-007: Closed Values & Check Constraints
  // ============================================================================
  describe("AC-007: Closed Taxonomies & PostgreSQL CHECK Constraints", () => {
    it("rejects invalid status (e.g. TRIALING, PAUSED, UNKNOWN)", async () => {
      const user = await createTestUser("invalid_status_user");
      const start = new Date();
      const end = new Date(start.getTime() + 30 * 24 * 60 * 60 * 1000);

      await expect(
        prisma.$executeRaw`
          INSERT INTO "user_subscriptions" ("id", "user_id", "plan_key", "status", "provider_key", "current_period_start", "current_period_end", "updated_at")
          VALUES (gen_random_uuid(), ${user.id}, 'PREMIUM', 'TRIALING', 'INTERNAL', ${start}, ${end}, NOW());
        `,
      ).rejects.toThrow();
    });

    it("rejects invalid planKey (e.g. ENTERPRISE, PRO, VIP)", async () => {
      const user = await createTestUser("invalid_plan_user");
      const start = new Date();
      const end = new Date(start.getTime() + 30 * 24 * 60 * 60 * 1000);

      await expect(
        prisma.$executeRaw`
          INSERT INTO "user_subscriptions" ("id", "user_id", "plan_key", "status", "provider_key", "current_period_start", "current_period_end", "updated_at")
          VALUES (gen_random_uuid(), ${user.id}, 'ENTERPRISE', 'ACTIVE', 'INTERNAL', ${start}, ${end}, NOW());
        `,
      ).rejects.toThrow();
    });

    it("rejects date ordering inversion (currentPeriodEnd < currentPeriodStart)", async () => {
      const user = await createTestUser("invalid_dates_user");
      const start = new Date();
      const invalidEnd = new Date(start.getTime() - 1000); // 1 second before start

      await expect(
        repos.subscriptionRepo.create({
          userId: user.id,
          planKey: "PREMIUM",
          status: "ACTIVE",
          currentPeriodStart: start,
          currentPeriodEnd: invalidEnd,
        }),
      ).rejects.toThrow();
    });

    it("rejects invalid provider event outcome (e.g. PENDING, UNKNOWN)", async () => {
      await expect(
        prisma.$executeRaw`
          INSERT INTO "subscription_provider_events" ("id", "provider_key", "provider_event_id", "event_type", "outcome", "occurred_at", "updated_at")
          VALUES (gen_random_uuid(), 'MOCK', ${`evt_${Date.now()}`}, 'payment.success', 'PENDING', NOW(), NOW());
        `,
      ).rejects.toThrow();
    });

    it("rejects invalid transition source (e.g. HACKER, CLIENT_OVERRIDE)", async () => {
      const user = await createTestUser("invalid_trans_user");
      const start = new Date();
      const end = new Date(start.getTime() + 30 * 24 * 60 * 60 * 1000);

      const sub = await repos.subscriptionRepo.create({
        userId: user.id,
        planKey: "PREMIUM",
        status: "ACTIVE",
        currentPeriodStart: start,
        currentPeriodEnd: end,
      });

      await expect(
        prisma.$executeRaw`
          INSERT INTO "subscription_transition_records" ("id", "subscription_id", "user_id", "to_status", "to_plan", "source", "transaction_strategy")
          VALUES (gen_random_uuid(), ${sub.id}, ${user.id}, 'ACTIVE', 'PREMIUM', 'CLIENT_OVERRIDE', 'STATE_FIRST');
        `,
      ).rejects.toThrow();
    });

    it("rejects invalid transition strategy (e.g. NONE, LOOSE)", async () => {
      const user = await createTestUser("invalid_strategy_user");
      const start = new Date();
      const end = new Date(start.getTime() + 30 * 24 * 60 * 60 * 1000);

      const sub = await repos.subscriptionRepo.create({
        userId: user.id,
        planKey: "PREMIUM",
        status: "ACTIVE",
        currentPeriodStart: start,
        currentPeriodEnd: end,
      });

      await expect(
        prisma.$executeRaw`
          INSERT INTO "subscription_transition_records" ("id", "subscription_id", "user_id", "to_status", "to_plan", "source", "transaction_strategy")
          VALUES (gen_random_uuid(), ${sub.id}, ${user.id}, 'ACTIVE', 'PREMIUM', 'USER_ACTION', 'LOOSE');
        `,
      ).rejects.toThrow();
    });
  });

  // ============================================================================
  // AC-014: Foreign Key Restrict Policy
  // ============================================================================
  describe("AC-014: Foreign Key RESTRICT Policy On User Deletion", () => {
    it("restricts User deletion when UserSubscription rows exist", async () => {
      const user = await createTestUser("fk_restrict_sub_user");
      const start = new Date();
      const end = new Date(start.getTime() + 30 * 24 * 60 * 60 * 1000);

      await repos.subscriptionRepo.create({
        userId: user.id,
        planKey: "PREMIUM",
        status: "ACTIVE",
        currentPeriodStart: start,
        currentPeriodEnd: end,
      });

      // Attempting to delete user must fail with foreign key violation (RESTRICT)
      await expect(
        prisma.user.delete({
          where: { id: user.id },
        }),
      ).rejects.toThrow();
    });

    it("restricts User deletion when SubscriptionTransitionRecord rows exist", async () => {
      const user = await createTestUser("fk_restrict_trans_user");
      const start = new Date();
      const end = new Date(start.getTime() + 30 * 24 * 60 * 60 * 1000);

      const sub = await repos.subscriptionRepo.create({
        userId: user.id,
        planKey: "PREMIUM",
        status: "ACTIVE",
        currentPeriodStart: start,
        currentPeriodEnd: end,
      });

      await repos.subscriptionTransitionRepo.create({
        subscriptionId: sub.id,
        userId: user.id,
        toStatus: "ACTIVE",
        toPlan: "PREMIUM",
        source: "USER_ACTION",
        transactionStrategy: "TRANSACTIONALLY_COUPLED",
      });

      await expect(
        prisma.user.delete({
          where: { id: user.id },
        }),
      ).rejects.toThrow();
    });

    it("restricts UserSubscription deletion when SubscriptionTransitionRecord rows exist", async () => {
      const user = await createTestUser("fk_restrict_sub_del_user");
      const start = new Date();
      const end = new Date(start.getTime() + 30 * 24 * 60 * 60 * 1000);

      const sub = await repos.subscriptionRepo.create({
        userId: user.id,
        planKey: "PREMIUM",
        status: "ACTIVE",
        currentPeriodStart: start,
        currentPeriodEnd: end,
      });

      await repos.subscriptionTransitionRepo.create({
        subscriptionId: sub.id,
        userId: user.id,
        toStatus: "ACTIVE",
        toPlan: "PREMIUM",
        source: "USER_ACTION",
        transactionStrategy: "TRANSACTIONALLY_COUPLED",
      });

      await expect(
        prisma.userSubscription.delete({
          where: { id: sub.id },
        }),
      ).rejects.toThrow();
    });
  });

  // ============================================================================
  // AC-018: Transition Immutability Boundary
  // ============================================================================
  describe("AC-018: Transition Immutability (Append-Only Boundary)", () => {
    it("proves ISubscriptionTransitionRepository exposes only append and read operations", () => {
      const repo = repos.subscriptionTransitionRepo as unknown as Record<string, unknown>;

      expect(typeof repo.create).toBe("function");
      expect(typeof repo.findById).toBe("function");
      expect(typeof repo.findBySubscriptionId).toBe("function");
      expect(typeof repo.findByUserId).toBe("function");
      expect(typeof repo.findByCorrelationId).toBe("function");

      // Verify NO mutation/deletion methods exist
      expect(repo.update).toBeUndefined();
      expect(repo.updateTransitionRecord).toBeUndefined();
      expect(repo.updateMany).toBeUndefined();
      expect(repo.delete).toBeUndefined();
      expect(repo.deleteTransitionRecord).toBeUndefined();
      expect(repo.deleteMany).toBeUndefined();
    });

    it("maintains strict chronological ordering for transition records", async () => {
      const user = await createTestUser("chronological_user");
      const start = new Date();
      const end = new Date(start.getTime() + 30 * 24 * 60 * 60 * 1000);

      const sub = await repos.subscriptionRepo.create({
        userId: user.id,
        planKey: "PREMIUM",
        status: "ACTIVE",
        currentPeriodStart: start,
        currentPeriodEnd: end,
      });

      const t1 = await repos.subscriptionTransitionRepo.create({
        subscriptionId: sub.id,
        userId: user.id,
        fromStatus: null,
        toStatus: "ACTIVE",
        fromPlan: "FREE",
        toPlan: "PREMIUM",
        source: "USER_ACTION",
        transactionStrategy: "TRANSACTIONALLY_COUPLED",
        reason: "Step 1: activation",
      });

      const t2 = await repos.subscriptionTransitionRepo.create({
        subscriptionId: sub.id,
        userId: user.id,
        fromStatus: "ACTIVE",
        toStatus: "PAST_DUE",
        fromPlan: "PREMIUM",
        toPlan: "PREMIUM",
        source: "PROVIDER_WEBHOOK",
        transactionStrategy: "STATE_FIRST",
        reason: "Step 2: billing failure",
      });

      const t3 = await repos.subscriptionTransitionRepo.create({
        subscriptionId: sub.id,
        userId: user.id,
        fromStatus: "PAST_DUE",
        toStatus: "EXPIRED",
        fromPlan: "PREMIUM",
        toPlan: "FREE",
        source: "SYSTEM_JOB",
        transactionStrategy: "STATE_FIRST",
        reason: "Step 3: period ended",
      });

      const history = await repos.subscriptionTransitionRepo.findBySubscriptionId(sub.id);
      expect(history).toHaveLength(3);
      expect(history[0].id).toBe(t1.id);
      expect(history[1].id).toBe(t2.id);
      expect(history[2].id).toBe(t3.id);
    });
  });

  // ============================================================================
  // AC-016, AC-017: Unit of Work & Transaction Runner Integration
  // ============================================================================
  describe("AC-016, AC-017: Transaction Runner Compatibility & Atomicity", () => {
    it("commits event, subscription, and transition records together on successful transaction", async () => {
      const user = await createTestUser("uow_success_user");
      const providerKey = "TEST_PROVIDER";
      const providerEventId = `evt_uow_${Date.now()}`;
      const start = new Date();
      const end = new Date(start.getTime() + 30 * 24 * 60 * 60 * 1000);

      const result = await runner.run(async (ctx) => {
        // 1. Ingest provider event
        const evt = await ctx.repositories.subscriptionProviderEventRepo.create({
          providerKey,
          providerEventId,
          eventType: "subscription.activated",
          outcome: "PROCESSED",
          occurredAt: new Date(),
        });

        // 2. Create active subscription
        const sub = await ctx.repositories.subscriptionRepo.create({
          userId: user.id,
          planKey: "PREMIUM",
          status: "ACTIVE",
          providerKey,
          externalSubscriptionId: `ext_${providerEventId}`,
          currentPeriodStart: start,
          currentPeriodEnd: end,
        });

        // 3. Create transition record coupled to subscription and event
        const trans = await ctx.repositories.subscriptionTransitionRepo.create({
          subscriptionId: sub.id,
          userId: user.id,
          toStatus: "ACTIVE",
          toPlan: "PREMIUM",
          source: "PROVIDER_WEBHOOK",
          transactionStrategy: "TRANSACTIONALLY_COUPLED",
          providerEventId: evt.providerEventId,
          reason: "Initial activation via webhook",
        });

        return { evt, sub, trans };
      });

      expect(result.evt.id).toBeDefined();
      expect(result.sub.id).toBeDefined();
      expect(result.trans.id).toBeDefined();

      // Verify all 3 records exist in durable PostgreSQL
      const persistedEvt = await repos.subscriptionProviderEventRepo.findByProviderEventId(
        providerKey,
        providerEventId,
      );
      expect(persistedEvt).not.toBeNull();

      const persistedSub = await repos.subscriptionRepo.findById(result.sub.id);
      expect(persistedSub).not.toBeNull();
      expect(persistedSub?.status).toBe("ACTIVE");

      const persistedTrans = await repos.subscriptionTransitionRepo.findById(result.trans.id);
      expect(persistedTrans).not.toBeNull();
    });

    it("rolls back all event, subscription, and transition writes atomically on forced error", async () => {
      const user = await createTestUser("uow_rollback_user");
      const providerKey = "TEST_PROVIDER";
      const providerEventId = `evt_rollback_${Date.now()}`;
      const start = new Date();
      const end = new Date(start.getTime() + 30 * 24 * 60 * 60 * 1000);

      let capturedSubId: string | null = null;

      await expect(
        runner.run(async (ctx) => {
          // 1. Ingest provider event
          await ctx.repositories.subscriptionProviderEventRepo.create({
            providerKey,
            providerEventId,
            eventType: "subscription.activated",
            outcome: "RECEIVED",
            occurredAt: new Date(),
          });

          // 2. Create subscription
          const sub = await ctx.repositories.subscriptionRepo.create({
            userId: user.id,
            planKey: "PREMIUM",
            status: "ACTIVE",
            providerKey,
            currentPeriodStart: start,
            currentPeriodEnd: end,
          });
          capturedSubId = sub.id;

          // 3. Create transition record
          await ctx.repositories.subscriptionTransitionRepo.create({
            subscriptionId: sub.id,
            userId: user.id,
            toStatus: "ACTIVE",
            toPlan: "PREMIUM",
            source: "PROVIDER_WEBHOOK",
            transactionStrategy: "TRANSACTIONALLY_COUPLED",
          });

          // 4. Force failure
          throw new AppError("Simulated downstream failure inside Unit of Work callback", "UOW_FORCED_FAILURE", 400);
        }),
      ).rejects.toThrow("Simulated downstream failure inside Unit of Work callback");

      // Verify all 3 writes rolled back completely
      const eventAfterRollback = await repos.subscriptionProviderEventRepo.findByProviderEventId(
        providerKey,
        providerEventId,
      );
      expect(eventAfterRollback).toBeNull();

      if (capturedSubId) {
        const subAfterRollback = await repos.subscriptionRepo.findById(capturedSubId);
        expect(subAfterRollback).toBeNull();
      }

      const activeAfterRollback = await repos.subscriptionRepo.findActiveByUserId(user.id);
      expect(activeAfterRollback).toBeNull();

      const transCount = await prisma.subscriptionTransitionRecord.count({
        where: { userId: user.id },
      });
      expect(transCount).toBe(0);
    });
  });

  // ============================================================================
  // AC-020: Prohibited Payment / Raw Webhook / Secret Boundary Probe
  // ============================================================================
  describe("AC-020: Zero Payment Credential, Raw Webhook Payload, or Secret Storage", () => {
    it("proves PostgreSQL schema contains zero columns for credit card, PAN, CVV, or billing secrets", async () => {
      const columns = await prisma.$queryRaw<Array<{ table_name: string; column_name: string }>>`
        SELECT table_name, column_name
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name IN ('user_subscriptions', 'subscription_provider_events', 'subscription_transition_records');
      `;

      const sensitivePatterns = [
        /card_number/i,
        /pan/i,
        /cvv/i,
        /cvc/i,
        /secret/i,
        /password/i,
        /raw_payload/i,
        /webhook_payload/i,
        /token/i,
        /auth_header/i,
      ];

      for (const col of columns) {
        for (const pattern of sensitivePatterns) {
          expect(pattern.test(col.column_name)).toBe(false);
        }
      }
    });

    it("proves AuthSecurityAuditRecord schema and taxonomy are completely unchanged", async () => {
      const auditCols = await prisma.$queryRaw<Array<{ column_name: string }>>`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'auth_security_audit_records';
      `;

      const colNames = auditCols.map((c) => c.column_name);
      expect(colNames).toContain("event_type");
      expect(colNames).toContain("user_id");
      expect(colNames).not.toContain("subscription_id");
      expect(colNames).not.toContain("plan");
      expect(colNames).not.toContain("product_event_type");
    });
  });
});
