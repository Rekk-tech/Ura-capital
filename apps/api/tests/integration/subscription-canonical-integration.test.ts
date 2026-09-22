import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import request from "supertest";
import express, { type Express, type Response } from "express";
import { PrismaClient } from "@prisma/client";
import { HTTP_STATUS, ERROR_CODES } from "@aura/shared";

import {
  assertSafeTestDatabase,
  cleanAllTestTables,
} from "../helpers/test-db-guard.js";
import {
  createRepositoryContainer,
  type IRepositoryContainer,
} from "../../src/infrastructure/database/repository-factory.js";
import { PrismaTransactionRunner } from "../../src/infrastructure/database/transaction-runner.js";
import { errorHandlerMiddleware } from "../../src/middleware/error-handler.js";
import { createAuthenticateMiddleware } from "../../src/modules/auth/auth.middleware.js";
import { accessTokenService } from "../../src/modules/auth/access-token.service.js";

import { SubscriptionReadService } from "../../src/modules/subscription/subscription-read.service.js";
import { SubscriptionController } from "../../src/modules/subscription/subscription.controller.js";
import { createSubscriptionRouter } from "../../src/modules/subscription/subscription.routes.js";

import { SubscriptionEntitlementService } from "../../src/modules/subscription/subscription-entitlement.service.js";
import { requireEntitlement } from "../../src/modules/subscription/entitlement-authorization.middleware.js";
import type { EntitlementAuthorizedRequest } from "../../src/modules/subscription/entitlement-authorization.types.js";

import { MockSubscriptionProvider } from "../../src/modules/subscription/provider/mock-subscription-provider.js";
import { validateSubscriptionProviderEnvironment } from "../../src/modules/subscription/provider/subscription-provider.config.js";
import { SubscriptionEventProcessorService } from "../../src/modules/subscription/subscription-event-processor.service.js";
import { SubscriptionWebhookController } from "../../src/modules/subscription/subscription-webhook.controller.js";
import { createSubscriptionWebhookRouter } from "../../src/modules/subscription/subscription-webhook.routes.js";

import { SubscriptionLifecycleService } from "../../src/modules/subscription/subscription-lifecycle.service.js";
import { SubscriptionLifecycleController } from "../../src/modules/subscription/subscription-lifecycle.controller.js";
import { createSubscriptionLifecycleRouter } from "../../src/modules/subscription/subscription-lifecycle.routes.js";
import {
  type IRateLimitStore,
  RedisUnavailableError,
} from "../../src/modules/auth/rate-limit/rate-limit.store.js";

describe("Phase 7 Canonical Subscription Integration Suite (FEAT-050 + FEAT-052 + FEAT-053 + FEAT-054)", () => {
  const testDbUrl =
    process.env.TEST_DATABASE_URL ||
    process.env.DATABASE_URL ||
    "postgresql://postgres:postgrespassword@localhost:5432/aura_capital_test_feat019_rework2_fresh";

  let prisma: PrismaClient;
  let repos: IRepositoryContainer;
  let runner: PrismaTransactionRunner;
  let entitlementService: SubscriptionEntitlementService;
  let eventProcessor: SubscriptionEventProcessorService;
  let lifecycleService: SubscriptionLifecycleService;
  let readService: SubscriptionReadService;
  let mockProvider: MockSubscriptionProvider;

  const mockSecret = "s".repeat(32);
  const safeConfig = validateSubscriptionProviderEnvironment({
    nodeEnv: "test",
    providerMode: "mock",
    isCi: false,
    databaseUrl: testDbUrl,
    runId: "run_canonical_int",
    workerId: "w_canonical_int",
    mockWebhookSecret: mockSecret,
  });

  const TEST_USER = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
  let validToken: string;

  beforeAll(async () => {
    assertSafeTestDatabase(testDbUrl, "test");
    prisma = new PrismaClient({ datasources: { db: { url: testDbUrl } } });
    await prisma.$connect();

    repos = createRepositoryContainer(prisma);
    runner = new PrismaTransactionRunner(prisma, createRepositoryContainer);
    initServices();

    validToken = accessTokenService.issueAccessToken(TEST_USER).accessToken;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await cleanAllTestTables(prisma);
    initServices();

    await prisma.user.create({
      data: {
        id: TEST_USER,
        email: "canonical.learner@aura.local",
        displayName: "Canonical Integration Learner",
        status: "ACTIVE",
      },
    });
  });

  function initServices(fixtures: any[] = []) {
    mockProvider = new MockSubscriptionProvider({
      config: safeConfig,
      fixtures: [
        {
          userId: TEST_USER,
          externalSubscriptionId: "sub_mock_canon_1",
          planKey: "PREMIUM",
          status: "ACTIVE",
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 86400000),
          cancelAtPeriodEnd: false,
          providerSequence: null,
        },
        {
          userId: TEST_USER,
          externalSubscriptionId: "sub_mock_canon_2",
          planKey: "PREMIUM",
          status: "ACTIVE",
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 86400000),
          cancelAtPeriodEnd: false,
          providerSequence: null,
        },
        {
          userId: TEST_USER,
          externalSubscriptionId: "sub_cancel_read_test",
          planKey: "PREMIUM",
          status: "ACTIVE",
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 15 * 86400000),
          cancelAtPeriodEnd: false,
          providerSequence: null,
        },
        ...fixtures,
      ],
    });
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
    readService = new SubscriptionReadService(entitlementService);
  }

  function buildUnifiedApp(): Express {
    const app = express();
    app.use(express.json());

    const testRateLimitStore: IRateLimitStore = {
      increment: vi.fn(async () => ({ totalCount: 1, resetSeconds: 60 })),
      getCount: vi.fn(async () => 1),
      setCooldown: vi.fn(async () => {}),
      getCooldownTTL: vi.fn(async () => 0),
      delete: vi.fn(async () => {}),
      deleteByPrefix: vi.fn(async () => {}),
    };

    // 1. Read routes (FEAT-050)
    const readCtrl = new SubscriptionController(readService);
    app.use(createSubscriptionRouter(readCtrl, readService));

    // 2. Lifecycle routes (FEAT-053)
    const lifeCtrl = new SubscriptionLifecycleController(lifecycleService);
    app.use(
      createSubscriptionLifecycleRouter({
        controller: lifeCtrl,
        rateLimitOverrides: {
          checkout: { store: testRateLimitStore, enabled: true },
          cancel: { store: testRateLimitStore, enabled: true },
        },
      }),
    );

    // 3. Webhook routes (FEAT-052)
    const hookCtrl = new SubscriptionWebhookController(eventProcessor);
    app.use(createSubscriptionWebhookRouter(hookCtrl));

    // 4. Protected Premium Gated Route (FEAT-054)
    app.get(
      "/api/protected/premium-feature",
      createAuthenticateMiddleware({ userRepo: repos.userRepo }),
      requireEntitlement("PREMIUM_ACCESS", { resolver: entitlementService }),
      (req: EntitlementAuthorizedRequest, res: Response) => {
        res.status(HTTP_STATUS.OK).json({
          data: {
            message: "Premium access granted",
            entitlementKey: req.entitlement?.entitlementKey,
          },
        });
      },
    );

    app.use(errorHandlerMiddleware);
    return app;
  }

  // ==========================================================================
  // 1. Read API + Entitlement Resolver
  // ==========================================================================
  it("read API + entitlement resolver: returns FREE with zero entitlements when no subscription exists", async () => {
    const app = buildUnifiedApp();

    const plansRes = await request(app).get("/api/subscriptions/plans");
    expect(plansRes.status).toBe(HTTP_STATUS.OK);
    expect(plansRes.body.data).toHaveLength(2);

    const meRes = await request(app)
      .get("/api/subscriptions/me")
      .set("Authorization", `Bearer ${validToken}`);

    expect(meRes.status).toBe(HTTP_STATUS.OK);
    expect(meRes.body.data).toMatchObject({
      plan: "FREE",
      planKey: "FREE",
      status: "NONE",
      isEntitled: false,
      entitlements: [],
    });
  });

  // ==========================================================================
  // 2. Lifecycle Command + Provider Event
  // ==========================================================================
  it("lifecycle command + provider event: checkout intent creates zero mutation; verified provider event creates active subscription", async () => {
    const app = buildUnifiedApp();

    // 1. Checkout intent creates intent only (ZERO DB mutation)
    const checkoutRes = await request(app)
      .post("/api/subscriptions/checkout")
      .set("Authorization", `Bearer ${validToken}`)
      .send({ plan: "PREMIUM" });

    expect(checkoutRes.status).toBe(HTTP_STATUS.OK);
    expect(checkoutRes.body.data.checkoutReference).toBeDefined();
    expect(checkoutRes.body.data.state).toBe("PENDING");

    const subCountBefore = await prisma.userSubscription.count({ where: { userId: TEST_USER } });
    expect(subCountBefore).toBe(0);

    // 2. Provider event arrives with valid signature -> activates subscription
    const eventPayload = {
      providerEventId: "evt_canon_001",
      eventType: "SUBSCRIPTION_ACTIVATED",
      occurredAt: new Date().toISOString(),
      subscription: {
        userId: TEST_USER,
        externalSubscriptionId: "sub_mock_canon_1",
        planKey: "PREMIUM",
        status: "ACTIVE",
        currentPeriodStart: new Date().toISOString(),
        currentPeriodEnd: new Date(Date.now() + 30 * 86400000).toISOString(),
        cancelAtPeriodEnd: false,
        providerSequence: "1",
      },
    };

    const webhookRes = await request(app)
      .post("/api/subscriptions/providers/mock/events")
      .set("x-mock-signature", mockSecret)
      .send(eventPayload);

    expect(webhookRes.status).toBe(HTTP_STATUS.OK);
    expect(webhookRes.body.data.outcome).toBe("PROCESSED");

    // DB now contains ACTIVE subscription
    const sub = await prisma.userSubscription.findFirst({ where: { userId: TEST_USER } });
    expect(sub).not.toBeNull();
    expect(sub?.status).toBe("ACTIVE");
    expect(sub?.planKey).toBe("PREMIUM");
  });

  // ==========================================================================
  // 3. Provider Event + Subscription State + Transition Audit
  // ==========================================================================
  it("provider event + subscription state: payment failure event updates status to PAST_DUE with dedicated audit record", async () => {
    const app = buildUnifiedApp();

    const nowIso = new Date().toISOString();
    const periodEndIso = new Date(Date.now() + 30 * 86400000).toISOString();

    // Create active subscription first
    const createPayload = {
      providerEventId: "evt_canon_002",
      eventType: "SUBSCRIPTION_ACTIVATED",
      occurredAt: nowIso,
      subscription: {
        userId: TEST_USER,
        externalSubscriptionId: "sub_mock_canon_2",
        planKey: "PREMIUM",
        status: "ACTIVE",
        currentPeriodStart: nowIso,
        currentPeriodEnd: periodEndIso,
        cancelAtPeriodEnd: false,
        providerSequence: "1",
      },
    };
    await request(app)
      .post("/api/subscriptions/providers/mock/events")
      .set("x-mock-signature", mockSecret)
      .send(createPayload);

    // Now simulate payment failure event
    const failPayload = {
      providerEventId: "evt_canon_003",
      eventType: "SUBSCRIPTION_PAST_DUE",
      occurredAt: new Date().toISOString(),
      subscription: {
        userId: TEST_USER,
        externalSubscriptionId: "sub_mock_canon_2",
        planKey: "PREMIUM",
        status: "PAST_DUE",
        currentPeriodStart: nowIso,
        currentPeriodEnd: periodEndIso,
        cancelAtPeriodEnd: false,
        providerSequence: "2",
      },
    };

    const failRes = await request(app)
      .post("/api/subscriptions/providers/mock/events")
      .set("x-mock-signature", mockSecret)
      .send(failPayload);

    expect(failRes.status).toBe(HTTP_STATUS.OK);
    expect(failRes.body.data.outcome).toBe("PROCESSED");

    // Subscription status mutated to PAST_DUE
    const sub = await prisma.userSubscription.findFirst({ where: { userId: TEST_USER } });
    expect(sub?.status).toBe("PAST_DUE");

    // Transition audit record verified
    const transitions = await prisma.subscriptionTransitionRecord.findMany({
      where: { subscriptionId: sub?.id },
      orderBy: { createdAt: "asc" },
    });
    expect(transitions.length).toBe(2);
    expect(transitions[1].toStatus).toBe("PAST_DUE");
    expect(transitions[1].toPlan).toBe("PREMIUM");
  });

  // ==========================================================================
  // 4. Subscription State + Entitlement Resolver
  // ==========================================================================
  it("subscription state + entitlement resolver: PAST_DUE grants 0 entitlements and denies access", async () => {
    // Seed PAST_DUE subscription directly
    await prisma.userSubscription.create({
      data: {
        userId: TEST_USER,
        planKey: "PREMIUM",
        status: "PAST_DUE",
        providerKey: "MOCK",
        externalSubscriptionId: "sub_past_due_direct",
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 86400000),
        cancelAtPeriodEnd: false,
      },
    });

    const context = await entitlementService.resolveUserEntitlement(TEST_USER);
    expect(context.status).toBe("PAST_DUE");
    expect(context.isEntitled).toBe(false);
    expect(context.entitlements).toEqual([]);
  });

  // ==========================================================================
  // 5. Entitlement Resolver + FEAT-054 Guard
  // ==========================================================================
  it("entitlement resolver + FEAT-054 guard: allows ACTIVE PREMIUM, denies PAST_DUE/FREE", async () => {
    const app = buildUnifiedApp();

    // 1. FREE user (no subscription) -> 403 FORBIDDEN
    const freeRes = await request(app)
      .get("/api/protected/premium-feature")
      .set("Authorization", `Bearer ${validToken}`);

    expect(freeRes.status).toBe(HTTP_STATUS.FORBIDDEN);
    expect(freeRes.body.error.code).toBe(ERROR_CODES.ENTITLEMENT_REQUIRED);

    // 2. Insert ACTIVE PREMIUM subscription
    const sub = await prisma.userSubscription.create({
      data: {
        userId: TEST_USER,
        planKey: "PREMIUM",
        status: "ACTIVE",
        providerKey: "MOCK",
        externalSubscriptionId: "sub_guard_test_active",
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 86400000),
        cancelAtPeriodEnd: false,
      },
    });

    // 3. User is now allowed
    const activeRes = await request(app)
      .get("/api/protected/premium-feature")
      .set("Authorization", `Bearer ${validToken}`);

    expect(activeRes.status).toBe(HTTP_STATUS.OK);
    expect(activeRes.body.data.entitlementKey).toBe("PREMIUM_ACCESS");

    // 4. Update status to PAST_DUE
    await prisma.userSubscription.update({
      where: { id: sub.id },
      data: { status: "PAST_DUE" },
    });

    // 5. Same user immediately denied
    const pastDueRes = await request(app)
      .get("/api/protected/premium-feature")
      .set("Authorization", `Bearer ${validToken}`);

    expect(pastDueRes.status).toBe(HTTP_STATUS.FORBIDDEN);
    expect(pastDueRes.body.error.code).toBe(ERROR_CODES.ENTITLEMENT_REQUIRED);
  });

  // ==========================================================================
  // 6. Cancel State + Read API
  // ==========================================================================
  it("cancel state + read API: cancellation sets cancelAtPeriodEnd=true, remains entitled until period end", async () => {
    const app = buildUnifiedApp();

    const periodEnd = new Date(Date.now() + 15 * 86400000);
    await prisma.userSubscription.create({
      data: {
        userId: TEST_USER,
        planKey: "PREMIUM",
        status: "ACTIVE",
        providerKey: "MOCK",
        externalSubscriptionId: "sub_cancel_read_test",
        currentPeriodStart: new Date(),
        currentPeriodEnd: periodEnd,
        cancelAtPeriodEnd: false,
      },
    });

    // Cancel subscription via lifecycle API
    const cancelRes = await request(app)
      .post("/api/subscriptions/cancel")
      .set("Authorization", `Bearer ${validToken}`)
      .send({});

    expect(cancelRes.status).toBe(HTTP_STATUS.OK);
    expect(cancelRes.body.data.status).toBe("ACTIVE");
    expect(cancelRes.body.data.cancelAtPeriodEnd).toBe(true);

    // Read API reflects cancelAtPeriodEnd: true, status: ACTIVE, isEntitled: true
    const meRes = await request(app)
      .get("/api/subscriptions/me")
      .set("Authorization", `Bearer ${validToken}`);

    expect(meRes.status).toBe(HTTP_STATUS.OK);
    expect(meRes.body.data.status).toBe("ACTIVE");
    expect(meRes.body.data.cancelAtPeriodEnd).toBe(true);
    expect(meRes.body.data.isEntitled).toBe(true);
    expect(meRes.body.data.entitlements).toContain("PREMIUM_ACCESS");
  });

  // ==========================================================================
  // 7. Revocation + Same-Token Guard Immediacy
  // ==========================================================================
  it("revocation + same-token guard behavior: active token immediately denied without token refresh upon revocation", async () => {
    const app = buildUnifiedApp();

    const sub = await prisma.userSubscription.create({
      data: {
        userId: TEST_USER,
        planKey: "PREMIUM",
        status: "ACTIVE",
        providerKey: "MOCK",
        externalSubscriptionId: "sub_same_token_test",
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 86400000),
        cancelAtPeriodEnd: false,
      },
    });

    // Request 1 with token: ALLOWED
    const res1 = await request(app)
      .get("/api/protected/premium-feature")
      .set("Authorization", `Bearer ${validToken}`);
    expect(res1.status).toBe(HTTP_STATUS.OK);

    // Backend revocation: event/admin marks subscription EXPIRED
    await prisma.userSubscription.update({
      where: { id: sub.id },
      data: { status: "EXPIRED" },
    });

    // Request 2 with EXACT SAME token: IMMEDIATELY DENIED (zero token refresh required)
    const res2 = await request(app)
      .get("/api/protected/premium-feature")
      .set("Authorization", `Bearer ${validToken}`);
    expect(res2.status).toBe(HTTP_STATUS.FORBIDDEN);
    expect(res2.body.error.code).toBe(ERROR_CODES.ENTITLEMENT_REQUIRED);
  });

  // ==========================================================================
  // 8. Provider Failure + Zero Premium Grant
  // ==========================================================================
  it("provider failure + zero premium grant: invalid webhook signature results in 0 DB mutation and 0 premium grant", async () => {
    const app = buildUnifiedApp();

    const forgePayload = {
      providerEventId: "evt_forged_999",
      eventType: "SUBSCRIPTION_ACTIVATED",
      occurredAt: new Date().toISOString(),
      subscription: {
        userId: TEST_USER,
        externalSubscriptionId: "sub_forged_1",
        planKey: "PREMIUM",
        status: "ACTIVE",
        currentPeriodStart: new Date().toISOString(),
        currentPeriodEnd: new Date(Date.now() + 30 * 86400000).toISOString(),
        cancelAtPeriodEnd: false,
        providerSequence: "1",
      },
    };

    const res = await request(app)
      .post("/api/subscriptions/providers/mock/events")
      .set("x-mock-signature", "invalid_forged_signature_value")
      .send(forgePayload);

    // Webhook rejects with 401 Unauthorized
    expect(res.status).toBe(HTTP_STATUS.UNAUTHORIZED);

    // ZERO database mutation
    const count = await prisma.userSubscription.count({ where: { userId: TEST_USER } });
    expect(count).toBe(0);

    // User is NOT entitled
    const meRes = await request(app)
      .get("/api/subscriptions/me")
      .set("Authorization", `Bearer ${validToken}`);
    expect(meRes.body.data.isEntitled).toBe(false);
  });

  // ==========================================================================
  // 9. Redis Failure + Write Safety
  // ==========================================================================
  it("Redis failure + write safety: lifecycle commands fail-closed with 503 and zero DB mutation when Redis is down", async () => {
    const brokenStore: IRateLimitStore = {
      increment: vi.fn(async () => {
        throw new RedisUnavailableError("Simulated Redis outage");
      }),
      getCount: vi.fn(async () => 0),
      setCooldown: vi.fn(async () => {}),
      getCooldownTTL: vi.fn(async () => 0),
      delete: vi.fn(async () => {}),
      deleteByPrefix: vi.fn(async () => {}),
    };

    const app = express();
    app.use(express.json());
    const lifeCtrl = new SubscriptionLifecycleController(lifecycleService);
    app.use(
      createSubscriptionLifecycleRouter({
        controller: lifeCtrl,
        rateLimitOverrides: {
          checkout: { store: brokenStore, enabled: true },
          cancel: { store: brokenStore, enabled: true },
        },
      }),
    );
    app.use(errorHandlerMiddleware);

    const res = await request(app)
      .post("/api/subscriptions/checkout")
      .set("Authorization", `Bearer ${validToken}`)
      .send({ plan: "PREMIUM" });

    expect(res.status).toBe(HTTP_STATUS.SERVICE_UNAVAILABLE);
    expect(res.body.error.code).toBe(ERROR_CODES.SERVICE_UNAVAILABLE);

    // ZERO DB mutation
    const count = await prisma.userSubscription.count({ where: { userId: TEST_USER } });
    expect(count).toBe(0);
  });
});
