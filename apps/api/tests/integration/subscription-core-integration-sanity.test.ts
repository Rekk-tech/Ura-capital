import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { PrismaClient } from "@prisma/client";
import {
  assertSafeTestDatabase,
  sanitizeDiagnosticMessage,
  cleanAllTestTables,
} from "../helpers/test-db-guard.js";
import {
  createRepositoryContainer,
  type IRepositoryContainer,
} from "../../src/infrastructure/database/repository-factory.js";
import {
  SERVER_PLAN_CATALOG,
  validatePlanCatalog,
  getPublicPlans,
} from "../../src/modules/subscription/plan-catalog.js";
import { SubscriptionEntitlementService } from "../../src/modules/subscription/subscription-entitlement.service.js";
import { createSubscriptionProvider } from "../../src/modules/subscription/provider/subscription-provider.factory.js";
import { MockSubscriptionProvider } from "../../src/modules/subscription/provider/mock-subscription-provider.js";
import { SubscriptionProviderConfigurationError } from "../../src/modules/subscription/provider/subscription-provider.errors.js";

describe("Phase 7 Core Integration Sanity Gate (FEAT-049 + FEAT-051)", () => {
  const testDbUrl =
    process.env.TEST_DATABASE_URL ||
    process.env.DATABASE_URL ||
    "postgresql://postgres:postgrespassword@localhost:5432/aura_capital_test_feat019_rework2_fresh";

  const validTestEnv = {
    nodeEnv: "test",
    providerMode: "mock",
    databaseUrl: testDbUrl,
    mockWebhookSecret: "super-secret-mock-webhook-token-32-chars-long",
    runId: "integration-run",
    workerId: "worker-1",
  };

  let prisma: PrismaClient;
  let repos: IRepositoryContainer;

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
    } catch (err: unknown) {
      const errorMessage = sanitizeDiagnosticMessage(
        err instanceof Error ? err.message : String(err),
      );
      throw new Error(
        `[DB_CONNECTION_FAILED] Required PostgreSQL test database unreachable: ${errorMessage}`,
      );
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

  it("1. plan catalog loads and satisfies D2/AC-003 invariants", () => {
    expect(() => validatePlanCatalog(SERVER_PLAN_CATALOG)).not.toThrow();
    const publicPlans = getPublicPlans();
    expect(publicPlans.map((p) => p.planKey)).toEqual(["FREE", "PREMIUM"]);
    expect(publicPlans.find((p) => p.planKey === "FREE")?.entitlements).toEqual([]);
    expect(publicPlans.find((p) => p.planKey === "PREMIUM")?.entitlements).toEqual([
      "PREMIUM_ACCESS",
    ]);
  });

  it("2. mock provider factory loads in approved test/CI environment", () => {
    const provider = createSubscriptionProvider({
      environment: validTestEnv,
    });

    expect(provider).toBeInstanceOf(MockSubscriptionProvider);
    expect(provider.providerKey).toBe("MOCK");
  });

  it("3. entitlement resolver works authoritatively with FEAT-048 PostgreSQL repository", async () => {
    const user = await prisma.user.create({
      data: {
        email: `sanity_entitlement_${Date.now()}@example.com`,
        displayName: "Sanity Learner",
        status: "ACTIVE",
      },
    });

    const entitlementService = new SubscriptionEntitlementService(repos.subscriptionRepo);

    // Initial state: no subscription record -> resolves to FREE with 0 entitlements
    const freeResult = await entitlementService.resolveUserEntitlement(user.id);
    expect(freeResult.planKey).toBe("FREE");
    expect(freeResult.status).toBe("NONE");
    expect(freeResult.isEntitled).toBe(false);
    expect(freeResult.entitlements).toEqual([]);

    // Create active subscription in PostgreSQL
    const now = new Date();
    const periodStart = new Date(now.getTime() - 1000 * 60 * 60);
    const periodEnd = new Date(now.getTime() + 1000 * 60 * 60 * 24 * 30);

    await repos.subscriptionRepo.create({
      userId: user.id,
      planKey: "PREMIUM",
      status: "ACTIVE",
      providerKey: "mock",
      externalSubscriptionId: "sub_ext_sanity_1",
      currentPeriodStart: periodStart,
      currentPeriodEnd: periodEnd,
      cancelAtPeriodEnd: false,
    });

    // Entitled state: ACTIVE PREMIUM -> resolves to PREMIUM with PREMIUM_ACCESS
    const premResult = await entitlementService.resolveUserEntitlement(user.id);
    expect(premResult.planKey).toBe("PREMIUM");
    expect(premResult.status).toBe("ACTIVE");
    expect(premResult.isEntitled).toBe(true);
    expect(premResult.entitlements).toEqual(["PREMIUM_ACCESS"]);
  });

  it("4. provider abstraction and entitlement resolver coexist without circular dependency", () => {
    const provider = createSubscriptionProvider({
      environment: validTestEnv,
    });
    const entitlementService = new SubscriptionEntitlementService(repos.subscriptionRepo);

    expect(provider).toBeDefined();
    expect(entitlementService).toBeDefined();
    expect(provider.providerKey).toBe("MOCK");
  });

  it("5. provider mock cannot directly grant PREMIUM_ACCESS", async () => {
    const user = await prisma.user.create({
      data: {
        email: `sanity_mock_grant_${Date.now()}@example.com`,
        displayName: "Mock Grant Learner",
        status: "ACTIVE",
      },
    });

    const provider = createSubscriptionProvider({
      environment: validTestEnv,
    });

    // Create checkout session in mock provider
    const checkout = await provider.createCheckoutSession({
      requestId: "req-sanity-1",
      userId: user.id,
      planKey: "PREMIUM",
      idempotencyKey: "idem-sanity-1",
    });
    expect(checkout.state).toBe("PENDING");

    // Provider has in-memory state, but user in PostgreSQL has no subscription
    const entitlementService = new SubscriptionEntitlementService(repos.subscriptionRepo);
    const result = await entitlementService.resolveUserEntitlement(user.id);

    // Must resolve to FREE with zero entitlement - provider mock cannot grant entitlement!
    expect(result.planKey).toBe("FREE");
    expect(result.isEntitled).toBe(false);
    expect(result.entitlements).toEqual([]);
  });

  it("6. provider result does not bypass PostgreSQL subscription authority", async () => {
    const user = await prisma.user.create({
      data: {
        email: `sanity_authority_${Date.now()}@example.com`,
        displayName: "Authority Learner",
        status: "ACTIVE",
      },
    });

    // Seed mock provider with fixture at factory creation
    const provider = createSubscriptionProvider({
      environment: validTestEnv,
      fixtures: [
        {
          userId: user.id,
          externalSubscriptionId: "sub_ext_mock_only",
          planKey: "PREMIUM",
          status: "ACTIVE",
          currentPeriodStart: new Date("2026-09-01T00:00:00Z"),
          currentPeriodEnd: new Date("2026-10-01T00:00:00Z"),
          cancelAtPeriodEnd: false,
          providerSequence: "seq_1",
        },
      ],
    });

    // Mock has user subscription fixture in memory
    const fetched = await provider.fetchSubscription({
      userId: user.id,
      externalSubscriptionId: "sub_ext_mock_only",
    });
    expect(fetched.planKey).toBe("PREMIUM");
    expect(fetched.status).toBe("ACTIVE");

    // Entitlement resolver checks PostgreSQL, NOT provider memory
    const entitlementService = new SubscriptionEntitlementService(repos.subscriptionRepo);
    const result = await entitlementService.resolveUserEntitlement(user.id);

    expect(result.planKey).toBe("FREE");
    expect(result.isEntitled).toBe(false);
  });

  it("7. production mock is rejected with configuration error", () => {
    expect(() =>
      createSubscriptionProvider({
        environment: {
          nodeEnv: "production",
          providerMode: "mock",
          databaseUrl: "postgresql://postgres:password@prod-db.internal:5432/aura_capital_prod",
          mockWebhookSecret: "super-secret-mock-webhook-token-32-chars-long",
          runId: "prod-run",
          workerId: "worker-1",
        },
      }),
    ).toThrow(SubscriptionProviderConfigurationError);
  });

  it("8. unknown or staging environment is rejected with configuration error", () => {
    expect(() =>
      createSubscriptionProvider({
        environment: {
          nodeEnv: "staging",
          providerMode: "mock",
          databaseUrl: "postgresql://postgres:password@staging-db.internal:5432/aura_capital_staging",
          mockWebhookSecret: "super-secret-mock-webhook-token-32-chars-long",
          runId: "staging-run",
          workerId: "worker-1",
        },
      }),
    ).toThrow(SubscriptionProviderConfigurationError);

    expect(() =>
      createSubscriptionProvider({
        environment: {
          nodeEnv: "test",
          providerMode: "unknown_mode",
          databaseUrl: testDbUrl,
          mockWebhookSecret: "super-secret-mock-webhook-token-32-chars-long",
          runId: "test-run",
          workerId: "worker-1",
        },
      }),
    ).toThrow(SubscriptionProviderConfigurationError);
  });
});
