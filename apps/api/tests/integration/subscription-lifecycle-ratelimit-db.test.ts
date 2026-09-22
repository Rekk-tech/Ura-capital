import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import request from "supertest";
import Redis from "ioredis";
import { PrismaClient } from "@prisma/client";
import { HTTP_STATUS, ERROR_CODES } from "@aura/shared";
import {
  RateLimitStore,
  RedisUnavailableError,
  type IRateLimitStore,
} from "../../src/modules/auth/rate-limit/rate-limit.store.js";
import {
  buildSubscriptionRateLimitKey,
  computeSubscriptionIdentifierDigest,
} from "../../src/modules/subscription/subscription-lifecycle.rate-limit.js";
import { createMockSubscriptionLifecycleHarnessApp } from "../../src/modules/subscription/subscription-lifecycle.routes.js";
import { SubscriptionLifecycleService } from "../../src/modules/subscription/subscription-lifecycle.service.js";
import { MockSubscriptionProvider } from "../../src/modules/subscription/provider/mock-subscription-provider.js";
import { validateSubscriptionProviderEnvironment } from "../../src/modules/subscription/provider/subscription-provider.config.js";
import {
  createRepositoryContainer,
  type IRepositoryContainer,
} from "../../src/infrastructure/database/repository-factory.js";
import { PrismaTransactionRunner } from "../../src/infrastructure/database/transaction-runner.js";
import { assertSafeTestDatabase, cleanAllTestTables } from "../helpers/test-db-guard.js";
import { accessTokenService } from "../../src/modules/auth/access-token.service.js";
import { userRepository } from "../../src/modules/users/user.repository.js";

describe("FEAT-053 Subscription Lifecycle Rate Limiting & Abuse (Live Redis + PostgreSQL)", () => {
  const testDbUrl =
    process.env.TEST_DATABASE_URL ||
    process.env.DATABASE_URL ||
    "postgresql://postgres:postgrespassword@localhost:5432/aura_capital_test_feat019_rework2_fresh";

  let prisma: PrismaClient;
  let redis: Redis;
  let store: RateLimitStore;
  let repos: IRepositoryContainer;
  let runner: PrismaTransactionRunner;
  let service: SubscriptionLifecycleService;
  let mockProvider: MockSubscriptionProvider;

  const mockSecret = "m".repeat(32);
  const safeConfig = validateSubscriptionProviderEnvironment({
    nodeEnv: "test",
    providerMode: "mock",
    isCi: false,
    databaseUrl: testDbUrl,
    runId: "run_rl",
    workerId: "w_rl",
    mockWebhookSecret: mockSecret,
  });

  const USER_A = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
  const USER_B = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
  let tokenA: string;
  let tokenB: string;

  beforeAll(async () => {
    assertSafeTestDatabase(testDbUrl, "test");
    prisma = new PrismaClient({ datasources: { db: { url: testDbUrl } } });
    await prisma.$connect();

    const redisUrl = process.env.REDIS_URL || "redis://127.0.0.1:6379";
    redis = new Redis(redisUrl, {
      connectTimeout: 1000,
      maxRetriesPerRequest: 1,
      retryStrategy: () => null,
      lazyConnect: false,
    });
    await redis.ping();

    store = new RateLimitStore(redis);
    repos = createRepositoryContainer(prisma);
    runner = new PrismaTransactionRunner(prisma, createRepositoryContainer);
    mockProvider = new MockSubscriptionProvider({ config: safeConfig });
    service = new SubscriptionLifecycleService(
      repos.subscriptionRepo,
      repos.subscriptionTransitionRepo,
      runner,
      () => mockProvider,
    );
  });

  afterAll(async () => {
    if (redis && redis.status === "ready") {
      const keys = await redis.keys("aura:*:subscription-rl:*");
      if (keys.length > 0) await redis.del(...keys);
      await redis.quit();
    }
    if (prisma) {
      await cleanAllTestTables(prisma);
      await prisma.$disconnect();
    }
  });

  beforeEach(async () => {
    await cleanAllTestTables(prisma);
    const keys = await redis.keys("aura:*:subscription-rl:*");
    if (keys.length > 0) await redis.del(...keys);

    // Mock userRepository for authentication middleware
    vi.spyOn(userRepository, "findById").mockImplementation(async (id: string) => {
      if (id === USER_A || id === USER_B) {
        return {
          id,
          email: `${id}@example.com`,
          displayName: `User ${id}`,
          status: "ACTIVE",
          createdAt: new Date(),
          updatedAt: new Date(),
        } as unknown as import("@prisma/client").User;
      }
      return null;
    });

    tokenA = accessTokenService.issueAccessToken(USER_A).accessToken;
    tokenB = accessTokenService.issueAccessToken(USER_B).accessToken;
  });

  it("builds canonical HMAC-SHA256 Redis keys without leaking raw identity (AC-014)", () => {
    const key = buildSubscriptionRateLimitKey({
      operation: "checkout",
      scope: "user",
      rawIdentifier: USER_A,
      secret: "test_secret_123",
      env: "test",
    });

    expect(key).toContain("aura:test:subscription-rl:v1:checkout:user:");
    expect(key).not.toContain(USER_A);

    const digest = computeSubscriptionIdentifierDigest(USER_A, "test_secret_123");
    expect(key).toContain(digest);
    expect(digest).toMatch(/^[a-f0-9]{64}$/);
  });

  it("enforces user rate limit: allows below threshold, returns 429 with Retry-After on violation, zero DB mutation (AC-013, AC-015)", async () => {
    const app = createMockSubscriptionLifecycleHarnessApp(service, {
      checkout: {
        enabled: true,
        userMax: 3,
        windowSec: 60,
        store,
      },
    });

    // Requests 1..3 succeed
    for (let i = 0; i < 3; i++) {
      const res = await request(app)
        .post("/api/subscriptions/checkout")
        .set("Authorization", `Bearer ${tokenA}`)
        .send({ plan: "PREMIUM" });
      expect(res.status).toBe(HTTP_STATUS.OK);
    }

    // Request 4 is throttled
    const throttledRes = await request(app)
      .post("/api/subscriptions/checkout")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ plan: "PREMIUM" });

    expect(throttledRes.status).toBe(HTTP_STATUS.TOO_MANY_REQUESTS);
    expect(throttledRes.body.error.code).toBe(ERROR_CODES.TOO_MANY_REQUESTS);
    expect(throttledRes.headers["retry-after"]).toBeDefined();
    expect(Number(throttledRes.headers["retry-after"])).toBeGreaterThan(0);

    // Verify ZERO mutation in PostgreSQL on 429
    const subCount = await prisma.userSubscription.count({ where: { userId: USER_A } });
    const transCount = await prisma.subscriptionTransitionRecord.count({ where: { userId: USER_A } });
    expect(subCount).toBe(0);
    expect(transCount).toBe(0);

    // Second user USER_B has independent rate limit budget and succeeds
    const userBRes = await request(app)
      .post("/api/subscriptions/checkout")
      .set("Authorization", `Bearer ${tokenB}`)
      .send({ plan: "PREMIUM" });
    expect(userBRes.status).toBe(HTTP_STATUS.OK);
  });

  it("fails closed with 503 SERVICE_UNAVAILABLE when Redis is unavailable, with zero DB mutation (AC-015)", async () => {
    // Mock a broken Redis store that throws RedisUnavailableError
    const brokenStore: IRateLimitStore = {
      increment: vi.fn(async () => {
        throw new RedisUnavailableError("Simulated Redis connection drop");
      }),
      getCount: vi.fn(async () => 0),
      setCooldown: vi.fn(async () => {}),
      getCooldownTTL: vi.fn(async () => 0),
      delete: vi.fn(async () => {}),
      deleteByPrefix: vi.fn(async () => {}),
    };

    const app = createMockSubscriptionLifecycleHarnessApp(service, {
      checkout: {
        enabled: true,
        store: brokenStore,
      },
    });

    const res = await request(app)
      .post("/api/subscriptions/checkout")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ plan: "PREMIUM" });

    expect(res.status).toBe(HTTP_STATUS.SERVICE_UNAVAILABLE);
    expect(res.body.error.code).toBe(ERROR_CODES.SERVICE_UNAVAILABLE);
    expect(res.body.error.message).toContain("Service temporarily unavailable");

    // ZERO DB mutation on 503
    const subCount = await prisma.userSubscription.count({ where: { userId: USER_A } });
    expect(subCount).toBe(0);
  });
});
