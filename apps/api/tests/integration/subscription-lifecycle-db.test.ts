import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { PrismaClient } from "@prisma/client";
import { assertSafeTestDatabase, sanitizeDiagnosticMessage, cleanAllTestTables } from "../helpers/test-db-guard.js";
import {
  createRepositoryContainer,
  type IRepositoryContainer,
} from "../../src/infrastructure/database/repository-factory.js";
import { PrismaTransactionRunner } from "../../src/infrastructure/database/transaction-runner.js";
import { SubscriptionLifecycleService } from "../../src/modules/subscription/subscription-lifecycle.service.js";
import { SubscriptionEventProcessorService } from "../../src/modules/subscription/subscription-event-processor.service.js";
import { MockSubscriptionProvider } from "../../src/modules/subscription/provider/mock-subscription-provider.js";
import { validateSubscriptionProviderEnvironment } from "../../src/modules/subscription/provider/subscription-provider.config.js";
import { SubscriptionEntitlementService } from "../../src/modules/subscription/subscription-entitlement.service.js";


describe("FEAT-053 Subscription Lifecycle Commands (Live PostgreSQL Integration)", () => {
  const testDbUrl =
    process.env.TEST_DATABASE_URL ||
    process.env.DATABASE_URL ||
    "postgresql://postgres:postgrespassword@localhost:5432/aura_capital_test_feat019_rework2_fresh";

  let prisma: PrismaClient;
  let repos: IRepositoryContainer;
  let runner: PrismaTransactionRunner;
  let mockProvider: MockSubscriptionProvider;
  let entitlementService: SubscriptionEntitlementService;
  let eventProcessor: SubscriptionEventProcessorService;
  let lifecycleService: SubscriptionLifecycleService;

  const mockSecret = "c".repeat(32);
  const safeConfig = validateSubscriptionProviderEnvironment({
    nodeEnv: "test",
    providerMode: "mock",
    isCi: false,
    databaseUrl: testDbUrl,
    runId: "run_life_db",
    workerId: "w_life_db",
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
      eventProcessor = new SubscriptionEventProcessorService(
        repos.subscriptionRepo,
        repos.subscriptionProviderEventRepo,
        repos.subscriptionTransitionRepo,
        runner,
        () => mockProvider,
      );
      lifecycleService = new SubscriptionLifecycleService(
        repos.subscriptionRepo,
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

  async function createTestUser(emailPrefix = "life_user") {
    return prisma.user.create({
      data: {
        email: `${emailPrefix}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}@example.com`,
        displayName: "Lifecycle User",
        status: "ACTIVE",
      },
    });
  }

  it("checkout intent creates session with ZERO database mutation or entitlement grant", async () => {
    const user = await createTestUser("checkout_zero");

    const result = await lifecycleService.createCheckoutIntent({
      userId: user.id,
      planKey: "PREMIUM",
      requestId: "req_chk_1",
    });

    expect(result.checkoutReference).toMatch(/^mock_/);
    expect(result.state).toBe("PENDING");

    // Verify ZERO records in PostgreSQL
    const subCount = await prisma.userSubscription.count({ where: { userId: user.id } });
    const transCount = await prisma.subscriptionTransitionRecord.count({ where: { userId: user.id } });
    expect(subCount).toBe(0);
    expect(transCount).toBe(0);

    // Verify entitlement resolver still resolves to FREE
    const entitlement = await entitlementService.resolveUserEntitlement(user.id);
    expect(entitlement.planKey).toBe("FREE");
    expect(entitlement.isEntitled).toBe(false);
    expect(entitlement.entitlements).toEqual([]);
  });

  it("end-to-end integration: checkout intent -> FEAT-052 activation -> FEAT-053 cancel -> FEAT-052 expiry", async () => {
    const user = await createTestUser("e2e_lifecycle");
    const externalSubId = `ext_${user.id}`;
    const start = new Date(Date.now() - 60000);
    const end = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    // 1. Checkout intent
    const checkoutResult = await lifecycleService.createCheckoutIntent({
      userId: user.id,
      planKey: "PREMIUM",
      requestId: "req_e2e_chk",
    });
    expect(checkoutResult.checkoutReference).toBeDefined();

    // 2. Verified webhook activation via FEAT-052 processor
    const activationPayload = {
      providerEventId: `evt_act_${Date.now()}`,
      eventType: "SUBSCRIPTION_ACTIVATED",
      occurredAt: new Date().toISOString(),
      subscription: {
        userId: user.id,
        externalSubscriptionId: externalSubId,
        planKey: "PREMIUM",
        status: "ACTIVE",
        currentPeriodStart: start.toISOString(),
        currentPeriodEnd: end.toISOString(),
        cancelAtPeriodEnd: false,
        providerSequence: "1",
      },
    };

    await eventProcessor.processWebhook({
      providerKey: "MOCK",
      signature: mockSecret,
      rawBody: JSON.stringify(activationPayload),
    });

    // Verify PostgreSQL state & FEAT-049 entitlement
    let currentSub = await repos.subscriptionRepo.findActiveByUserId(user.id);
    expect(currentSub).not.toBeNull();
    expect(currentSub?.status).toBe("ACTIVE");
    expect(currentSub?.planKey).toBe("PREMIUM");
    expect(currentSub?.cancelAtPeriodEnd).toBe(false);

    let entitlement = await entitlementService.resolveUserEntitlement(user.id);
    expect(entitlement.planKey).toBe("PREMIUM");
    expect(entitlement.isEntitled).toBe(true);
    expect(entitlement.entitlements).toContain("PREMIUM_ACCESS");

    // 3. Setup mock provider fixture for cancellation
    const activeProvider = new MockSubscriptionProvider({
      config: safeConfig,
      fixtures: [
        {
          userId: user.id,
          externalSubscriptionId: externalSubId,
          planKey: "PREMIUM",
          status: "ACTIVE",
          currentPeriodStart: start,
          currentPeriodEnd: end,
          cancelAtPeriodEnd: false,
          providerSequence: "1",
        },
      ],
    });

    const activeLifecycleService = new SubscriptionLifecycleService(
      repos.subscriptionRepo,
      repos.subscriptionTransitionRepo,
      runner,
      () => activeProvider,
    );

    // 4. Cancel active subscription via FEAT-053
    const cancelResult = await activeLifecycleService.cancelSubscription({
      userId: user.id,
      reason: "User cancelled at period end",
      requestId: "req_e2e_cancel",
    });

    expect(cancelResult.cancelAtPeriodEnd).toBe(true);
    expect(cancelResult.status).toBe("ACTIVE");

    // Verify D5 semantics: ACTIVE + cancelAtPeriodEnd=true remains entitled
    currentSub = await repos.subscriptionRepo.findActiveByUserId(user.id);
    expect(currentSub?.cancelAtPeriodEnd).toBe(true);
    expect(currentSub?.status).toBe("ACTIVE");

    entitlement = await entitlementService.resolveUserEntitlement(user.id);
    expect(entitlement.isEntitled).toBe(true); // Still entitled!

    // Verify transition audit row in PostgreSQL
    const transitions = await prisma.subscriptionTransitionRecord.findMany({
      where: { userId: user.id, source: "USER_ACTION" },
    });
    expect(transitions).toHaveLength(1);
    expect(transitions[0]?.transactionStrategy).toBe("STATE_FIRST");
    expect(transitions[0]?.fromStatus).toBe("ACTIVE");
    expect(transitions[0]?.toStatus).toBe("ACTIVE");

    // 5. Repeated cancel is idempotent: zero duplicate audit
    const repeatResult = await activeLifecycleService.cancelSubscription({
      userId: user.id,
      reason: "Repeat cancel attempt",
    });
    expect(repeatResult.cancelAtPeriodEnd).toBe(true);

    const transitionsAfterRepeat = await prisma.subscriptionTransitionRecord.findMany({
      where: { userId: user.id, source: "USER_ACTION" },
    });
    expect(transitionsAfterRepeat).toHaveLength(1); // ZERO duplicate transition audit

    // 6. Verified expiration event arrives via FEAT-052
    const expirationPayload = {
      providerEventId: `evt_exp_${Date.now()}`,
      eventType: "SUBSCRIPTION_EXPIRED",
      occurredAt: new Date().toISOString(),
      subscription: {
        userId: user.id,
        externalSubscriptionId: externalSubId,
        planKey: "PREMIUM",
        status: "EXPIRED",
        currentPeriodStart: start.toISOString(),
        currentPeriodEnd: end.toISOString(),
        cancelAtPeriodEnd: true,
        providerSequence: "2",
      },
    };

    await eventProcessor.processWebhook({
      providerKey: "MOCK",
      signature: mockSecret,
      rawBody: JSON.stringify(expirationPayload),
    });

    // 7. Verify entitlement revoked
    entitlement = await entitlementService.resolveUserEntitlement(user.id);
    expect(entitlement.planKey).toBe("FREE");
    expect(entitlement.isEntitled).toBe(false);

    // 8. Terminal state protection: cancel on EXPIRED subscription fails deterministically
    await expect(
      activeLifecycleService.cancelSubscription({
        userId: user.id,
      }),
    ).rejects.toThrow("Subscription is in a terminal state (EXPIRED)");
  });

  it("reconciliation detects changes and writes source: RECONCILIATION audit row", async () => {
    const user = await createTestUser("reconcile_db");
    const externalSubId = `ext_rec_${user.id}`;
    const start = new Date(Date.now() - 100000);
    const end = new Date(Date.now() + 100000);

    // Insert baseline subscription
    const sub = await repos.subscriptionRepo.create({
      userId: user.id,
      planKey: "PREMIUM",
      status: "ACTIVE",
      providerKey: "MOCK",
      externalSubscriptionId: externalSubId,
      currentPeriodStart: start,
      currentPeriodEnd: end,
      cancelAtPeriodEnd: false,
      providerSequence: "10",
    });

    // Setup mock provider with updated PAST_DUE state
    const reconcileProvider = new MockSubscriptionProvider({
      config: safeConfig,
      fixtures: [
        {
          userId: user.id,
          externalSubscriptionId: externalSubId,
          planKey: "PREMIUM",
          status: "PAST_DUE",
          currentPeriodStart: start,
          currentPeriodEnd: end,
          cancelAtPeriodEnd: false,
          providerSequence: "15",
        },
      ],
    });

    const reconcileLifecycleService = new SubscriptionLifecycleService(
      repos.subscriptionRepo,
      repos.subscriptionTransitionRepo,
      runner,
      () => reconcileProvider,
    );

    const result = await reconcileLifecycleService.reconcileSubscription({
      userId: user.id,
      externalSubscriptionId: externalSubId,
    });

    expect(result.reconciled).toBe(true);
    expect(result.status).toBe("PAST_DUE");

    const updatedSub = await repos.subscriptionRepo.findById(sub.id);
    expect(updatedSub?.status).toBe("PAST_DUE");

    const reconcileAudit = await prisma.subscriptionTransitionRecord.findMany({
      where: { userId: user.id, source: "RECONCILIATION" },
    });
    expect(reconcileAudit).toHaveLength(1);
    expect(reconcileAudit[0]?.fromStatus).toBe("ACTIVE");
    expect(reconcileAudit[0]?.toStatus).toBe("PAST_DUE");
  });
});
