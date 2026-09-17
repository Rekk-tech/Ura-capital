import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import request from "supertest";
import { PrismaClient, Prisma } from "@prisma/client";
import Redis from "ioredis";
import express, { type Express } from "express";
import { createApp } from "../../src/server.js";
import { createSimulationRouter } from "../../src/modules/simulation/simulation.routes.js";
import { createSimulationOrderRateLimiter } from "../../src/modules/simulation/simulation-order.rate-limit.js";
import { RateLimitStore, RedisUnavailableError } from "../../src/modules/auth/rate-limit/rate-limit.store.js";
import { accessTokenService } from "../../src/modules/auth/access-token.service.js";
import { assertSafeTestDatabase, cleanAllTestTables, sanitizeDiagnosticMessage } from "../helpers/test-db-guard.js";
import { ERROR_CODES, HTTP_STATUS } from "@aura/shared";
import { buildTestIsolatedRedisPrefix } from "../../src/infrastructure/redis/redis-keys.js";

const testDbUrl =
  process.env.TEST_DATABASE_URL ||
  process.env.DATABASE_URL ||
  "postgresql://postgres:postgrespassword@localhost:5432/aura_capital_test_feat019_rework2_fresh";

describe("FEAT-039: Simulation Security, Abuse Protection, Rate Limiting & Audit Deferral (Live PostgreSQL + Redis)", () => {
  let prisma: PrismaClient;
  let redis: Redis;
  const standardApp = createApp();

  let userA: { id: string; email: string };
  let userB: { id: string; email: string };
  let adminUser: { id: string; email: string };
  let scenario: { id: string; key: string };
  let assetAura: { id: string; symbol: string };

  let sessionA: { id: string };
  let sessionB: { id: string };

  const tokenUserA = "Bearer token-user-a";
  const tokenUserB = "Bearer token-user-b";
  const tokenAdmin = "Bearer token-admin";

  const TEST_PREFIX = buildTestIsolatedRedisPrefix({ feature: "rl", version: "v1" });

  beforeAll(async () => {
    assertSafeTestDatabase(testDbUrl, "test");
    prisma = new PrismaClient({ datasources: { db: { url: testDbUrl } } });
    await prisma.$connect();

    const redisUrl = process.env.REDIS_URL || "redis://127.0.0.1:6379";
    redis = new Redis(redisUrl, {
      connectTimeout: 1500,
      maxRetriesPerRequest: 1,
      retryStrategy: () => null,
      lazyConnect: false,
    });

    try {
      const pong = await redis.ping();
      expect(pong).toBe("PONG");
    } catch (err: unknown) {
      const safeError = sanitizeDiagnosticMessage(err instanceof Error ? err.message : String(err));
      throw new Error(
        `[REDIS_TEST_SETUP_FAILED] Redis is not reachable. Ensure container 'aura-redis' is active. Error: ${safeError}`,
      );
    }
  });

  afterAll(async () => {
    if (redis) {
      const keys = await redis.keys(`${TEST_PREFIX}*`);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
      await redis.quit();
    }
    if (prisma) {
      await cleanAllTestTables(prisma);
      await prisma.$disconnect();
    }
  });

  beforeEach(async () => {
    vi.restoreAllMocks();
    await cleanAllTestTables(prisma);

    // Clean test Redis keys
    const keys = await redis.keys(`${TEST_PREFIX}*`);
    if (keys.length > 0) {
      await redis.del(...keys);
    }

    // 1. Create test users
    userA = await prisma.user.create({
      data: {
        email: "usera-feat039@test.com",
        displayName: "User A",
        status: "ACTIVE",
      },
    });

    userB = await prisma.user.create({
      data: {
        email: "userb-feat039@test.com",
        displayName: "User B",
        status: "ACTIVE",
      },
    });

    adminUser = await prisma.user.create({
      data: {
        email: "admin-feat039@test.com",
        displayName: "Admin User",
        status: "ACTIVE",
      },
    });

    // Mock auth middleware for tokens
    vi.spyOn(accessTokenService, "verifyAccessToken").mockImplementation((token: string) => {
      if (token === "token-user-a") {
        return {
          sub: userA.id,
          iss: "aura-capital",
          aud: "aura-client",
          exp: Math.floor(Date.now() / 1000) + 900,
          iat: Math.floor(Date.now() / 1000),
        };
      }
      if (token === "token-user-b") {
        return {
          sub: userB.id,
          iss: "aura-capital",
          aud: "aura-client",
          exp: Math.floor(Date.now() / 1000) + 900,
          iat: Math.floor(Date.now() / 1000),
        };
      }
      if (token === "token-admin") {
        return {
          sub: adminUser.id,
          iss: "aura-capital",
          aud: "aura-client",
          exp: Math.floor(Date.now() / 1000) + 900,
          iat: Math.floor(Date.now() / 1000),
        };
      }
      throw new Error("Invalid or malformed access token");
    });

    // 2. Create canonical scenario, assets, and snapshots
    scenario = await prisma.simulationScenario.create({
      data: {
        key: "DEFAULT",
        name: "MVP Scenario",
        status: "ACTIVE",
      },
    });

    assetAura = await prisma.simulationAsset.create({
      data: {
        symbol: "AURA",
        name: "Aura Network",
        status: "ACTIVE",
      },
    });

    await prisma.simulationMarketSnapshot.create({
      data: {
        scenarioId: scenario.id,
        assetId: assetAura.id,
        cycle: 1,
        price: new Prisma.Decimal("100.0000"),
        occurredAt: new Date(),
      },
    });

    // 3. User A active session with initial starting cash 100000.0000
    sessionA = await prisma.simulationSession.create({
      data: {
        userId: userA.id,
        scenarioId: scenario.id,
        status: "ACTIVE",
        startingCash: new Prisma.Decimal("100000.0000"),
        currentCycle: 1,
      },
    });

    await prisma.simulationPortfolio.create({
      data: {
        sessionId: sessionA.id,
        cashBalance: new Prisma.Decimal("100000.0000"),
        realizedPnl: new Prisma.Decimal("0.0000"),
      },
    });

    // 4. User B active session
    sessionB = await prisma.simulationSession.create({
      data: {
        userId: userB.id,
        scenarioId: scenario.id,
        status: "ACTIVE",
        startingCash: new Prisma.Decimal("100000.0000"),
        currentCycle: 1,
      },
    });

    await prisma.simulationPortfolio.create({
      data: {
        sessionId: sessionB.id,
        cashBalance: new Prisma.Decimal("100000.0000"),
        realizedPnl: new Prisma.Decimal("0.0000"),
      },
    });
  });

  describe("1. Full IDOR Matrix & Anti-Enumeration (FR-001, FR-002, AC-001, AC-002, AC-003)", () => {
    it("rejects User B attempting to read User A's session with 404 NOT_FOUND", async () => {
      const res = await request(standardApp)
        .get(`/api/simulation/sessions/${sessionA.id}`)
        .set("Authorization", tokenUserB);

      expect(res.status).toBe(HTTP_STATUS.NOT_FOUND);
      expect(res.body.error.code).toBe(ERROR_CODES.NOT_FOUND);
      expect(res.body.error.message).toBe("Simulation session not found");
    });

    it("rejects User B attempting to start User A's session with 404 NOT_FOUND", async () => {
      const res = await request(standardApp)
        .post(`/api/simulation/sessions/${sessionA.id}/start`)
        .set("Authorization", tokenUserB);

      expect(res.status).toBe(HTTP_STATUS.NOT_FOUND);
      expect(res.body.error.code).toBe(ERROR_CODES.NOT_FOUND);
    });

    it("rejects User B attempting to complete User A's session with 404 NOT_FOUND", async () => {
      const res = await request(standardApp)
        .post(`/api/simulation/sessions/${sessionA.id}/complete`)
        .set("Authorization", tokenUserB);

      expect(res.status).toBe(HTTP_STATUS.NOT_FOUND);
      expect(res.body.error.code).toBe(ERROR_CODES.NOT_FOUND);
    });

    it("rejects User B attempting to cancel User A's session with 404 NOT_FOUND", async () => {
      const res = await request(standardApp)
        .post(`/api/simulation/sessions/${sessionA.id}/cancel`)
        .set("Authorization", tokenUserB);

      expect(res.status).toBe(HTTP_STATUS.NOT_FOUND);
      expect(res.body.error.code).toBe(ERROR_CODES.NOT_FOUND);
    });

    it("rejects User B attempting to reset User A's session with 404 NOT_FOUND", async () => {
      const res = await request(standardApp)
        .post(`/api/simulation/sessions/${sessionA.id}/reset`)
        .set("Authorization", tokenUserB);

      expect(res.status).toBe(HTTP_STATUS.NOT_FOUND);
      expect(res.body.error.code).toBe(ERROR_CODES.NOT_FOUND);
    });

    it("rejects User B attempting to read User A's portfolio with 404 NOT_FOUND", async () => {
      const res = await request(standardApp)
        .get(`/api/simulation/sessions/${sessionA.id}/portfolio`)
        .set("Authorization", tokenUserB);

      expect(res.status).toBe(HTTP_STATUS.NOT_FOUND);
      expect(res.body.error.code).toBe(ERROR_CODES.NOT_FOUND);
    });

    it("rejects User B attempting to read User A's orders with 404 NOT_FOUND", async () => {
      const res = await request(standardApp)
        .get(`/api/simulation/sessions/${sessionA.id}/orders`)
        .set("Authorization", tokenUserB);

      expect(res.status).toBe(HTTP_STATUS.NOT_FOUND);
      expect(res.body.error.code).toBe(ERROR_CODES.NOT_FOUND);
    });

    it("rejects User B attempting to read User A's trades with 404 NOT_FOUND", async () => {
      const res = await request(standardApp)
        .get(`/api/simulation/sessions/${sessionA.id}/trades`)
        .set("Authorization", tokenUserB);

      expect(res.status).toBe(HTTP_STATUS.NOT_FOUND);
      expect(res.body.error.code).toBe(ERROR_CODES.NOT_FOUND);
    });

    it("rejects User B attempting to submit an order against User A's session with 404 NOT_FOUND", async () => {
      const res = await request(standardApp)
        .post(`/api/simulation/sessions/${sessionA.id}/orders`)
        .set("Authorization", tokenUserB)
        .send({
          side: "BUY",
          type: "MARKET",
          assetSymbol: "AURA",
          quantity: 10,
          idempotencyKey: "idor-attempt-key-1",
        });

      expect(res.status).toBe(HTTP_STATUS.NOT_FOUND);
      expect(res.body.error.code).toBe(ERROR_CODES.NOT_FOUND);
      expect(res.body.error.message).toBe("Simulation session not found");

      // Verify zero orders were created
      const count = await prisma.simulationOrder.count({ where: { sessionId: sessionA.id } });
      expect(count).toBe(0);
    });

    it("preserves anti-enumeration: returns identical 404 for unknown session UUID and foreign session UUID", async () => {
      const unknownUuid = "99999999-8888-7777-6666-555555555555";
      const resUnknown = await request(standardApp)
        .get(`/api/simulation/sessions/${unknownUuid}`)
        .set("Authorization", tokenUserA);

      const resForeign = await request(standardApp)
        .get(`/api/simulation/sessions/${sessionB.id}`)
        .set("Authorization", tokenUserA);

      expect(resUnknown.status).toBe(HTTP_STATUS.NOT_FOUND);
      expect(resForeign.status).toBe(HTTP_STATUS.NOT_FOUND);
      expect(resUnknown.body.error.message).toBe(resForeign.body.error.message);
      expect(resUnknown.body.error.code).toBe(resForeign.body.error.code);
    });
  });

  describe("2. Client Authority Tampering Defenses & Zero Mutation (FR-003, AC-004)", () => {
    const forbiddenFields = [
      { executionPrice: "10.0000" },
      { price: "10.0000" },
      { cashAfter: "999999999.0000" },
      { positionAfter: 500 },
      { averageCost: "5.0000" },
      { realizedPnl: "100000.0000" },
      { unrealizedPnl: "50000.0000" },
      { status: "FILLED" },
      { filledAt: new Date().toISOString() },
      { cycle: 5 },
      { scenario: "CUSTOM" },
      { userId: "11111111-2222-3333-4444-555555555555" },
      { tradeId: "00000000-0000-0000-0000-000000000000" },
      { fee: "0.00" },
      { slippage: "0.00" },
    ];

    for (const field of forbiddenFields) {
      const [keyName] = Object.keys(field);
      it(`rejects order submission containing client authority field '${keyName}' with 400 and ZERO mutation`, async () => {
        const payload = {
          side: "BUY",
          type: "MARKET",
          assetSymbol: "AURA",
          quantity: 10,
          idempotencyKey: `tamper-${keyName}-key`,
          ...field,
        };

        const res = await request(standardApp)
          .post(`/api/simulation/sessions/${sessionA.id}/orders`)
          .set("Authorization", tokenUserA)
          .send(payload);

        expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST);
        expect(res.body.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
        expect(res.body.error.message).toContain(keyName);

        // Verify zero DB rows were created
        const orders = await prisma.simulationOrder.count({ where: { sessionId: sessionA.id } });
        expect(orders).toBe(0);

        // Verify cash balance was not mutated
        const portfolio = await prisma.simulationPortfolio.findUnique({ where: { sessionId: sessionA.id } });
        expect(portfolio?.cashBalance.toFixed(4)).toBe("100000.0000");
      });
    }
  });

  describe("3. Numeric Abuse & Invalid Input Defenses (FR-004, AC-005)", () => {
    const abuseCases = [
      { name: "zero quantity", payload: { quantity: 0 } },
      { name: "negative quantity", payload: { quantity: -10 } },
      { name: "fractional quantity (1.5)", payload: { quantity: 1.5 } },
      { name: "fractional small quantity (0.001)", payload: { quantity: 0.001 } },
      { name: "NaN quantity", payload: { quantity: NaN } },
      { name: "oversized integer (> MAX_POSTGRES_INT)", payload: { quantity: 2147483648 } },
      { name: "precision overflow (Number.MAX_SAFE_INTEGER)", payload: { quantity: Number.MAX_SAFE_INTEGER } },
      { name: "empty assetSymbol", payload: { assetSymbol: "" } },
      { name: "whitespace assetSymbol", payload: { assetSymbol: "   " } },
      { name: "unsupported order type (LIMIT)", payload: { type: "LIMIT" } },
      { name: "invalid side (HOLD)", payload: { side: "HOLD" } },
      { name: "empty idempotencyKey", payload: { idempotencyKey: "" } },
      { name: "whitespace idempotencyKey", payload: { idempotencyKey: "   " } },
    ];

    for (const testCase of abuseCases) {
      it(`rejects numeric abuse: ${testCase.name} with 400 VALIDATION_ERROR and zero DB mutation`, async () => {
        const payload = {
          side: "BUY",
          type: "MARKET",
          assetSymbol: "AURA",
          quantity: 10,
          idempotencyKey: `abuse-key-${Math.random()}`,
          ...testCase.payload,
        };

        const res = await request(standardApp)
          .post(`/api/simulation/sessions/${sessionA.id}/orders`)
          .set("Authorization", tokenUserA)
          .send(payload);

        expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST);
        expect(res.body.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);

        // Verify zero order or trade mutation
        const orderCount = await prisma.simulationOrder.count({ where: { sessionId: sessionA.id } });
        expect(orderCount).toBe(0);
      });
    }

    it("rejects malformed session UUID with 400 VALIDATION_ERROR", async () => {
      const res = await request(standardApp)
        .post("/api/simulation/sessions/not-a-valid-uuid/orders")
        .set("Authorization", tokenUserA)
        .send({
          side: "BUY",
          type: "MARKET",
          assetSymbol: "AURA",
          quantity: 10,
          idempotencyKey: "valid-key-1",
        });

      expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(res.body.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    });
  });

  describe("4. JWT Authority & Role Boundary (Section 4)", () => {
    it("does not allow forged role or admin claim to bypass learner session ownership", async () => {
      // Even if adminUser has an authenticated token, they cannot access User A's private simulation data
      const res = await request(standardApp)
        .get(`/api/simulation/sessions/${sessionA.id}`)
        .set("Authorization", tokenAdmin);

      expect(res.status).toBe(HTTP_STATUS.NOT_FOUND);
      expect(res.body.error.code).toBe(ERROR_CODES.NOT_FOUND);
    });

    it("does not allow forged role to place orders in User A's session", async () => {
      const res = await request(standardApp)
        .post(`/api/simulation/sessions/${sessionA.id}/orders`)
        .set("Authorization", tokenAdmin)
        .send({
          side: "BUY",
          type: "MARKET",
          assetSymbol: "AURA",
          quantity: 10,
          idempotencyKey: "admin-bypass-key",
        });

      expect(res.status).toBe(HTTP_STATUS.NOT_FOUND);
      expect(res.body.error.code).toBe(ERROR_CODES.NOT_FOUND);

      const count = await prisma.simulationOrder.count({ where: { sessionId: sessionA.id } });
      expect(count).toBe(0);
    });
  });

  describe("5. Order Rate Limiting & Zero Mutation on 429 (FR-006, FR-007, FR-008, AC-007, AC-008, AC-009)", () => {
    it("enforces order rate limit and proves zero database mutation on 429", async () => {
      // Create dedicated router with threshold = 3 for fast, deterministic integration test
      const testThreshold = 3;
      const rateLimiter = createSimulationOrderRateLimiter({
        maxAttempts: testThreshold,
        windowSec: 600,
        enabled: true,
        store: new RateLimitStore(redis),
      });

      const rateLimitedRouter = createSimulationRouter(
        undefined,
        undefined,
        undefined,
        undefined,
        rateLimiter,
      );

      const testApp: Express = express();
      testApp.use(express.json());
      testApp.use(rateLimitedRouter);

      // Attempts 1..3 must succeed
      for (let i = 1; i <= testThreshold; i++) {
        const res = await request(testApp)
          .post(`/api/simulation/sessions/${sessionA.id}/orders`)
          .set("Authorization", tokenUserA)
          .send({
            side: "BUY",
            type: "MARKET",
            assetSymbol: "AURA",
            quantity: 5,
            idempotencyKey: `rl-success-key-${i}`,
          });

        expect(res.status).toBe(HTTP_STATUS.CREATED);
      }

      // Check DB: exactly 3 orders created
      let orderCount = await prisma.simulationOrder.count({ where: { sessionId: sessionA.id } });
      expect(orderCount).toBe(testThreshold);

      // Attempt 4 must be throttled with 429 and Retry-After header
      const throttledRes = await request(testApp)
        .post(`/api/simulation/sessions/${sessionA.id}/orders`)
        .set("Authorization", tokenUserA)
        .send({
          side: "BUY",
          type: "MARKET",
          assetSymbol: "AURA",
          quantity: 5,
          idempotencyKey: `rl-throttled-key-4`,
        });

      expect(throttledRes.status).toBe(HTTP_STATUS.TOO_MANY_REQUESTS);
      expect(throttledRes.body.error.code).toBe(ERROR_CODES.TOO_MANY_REQUESTS);
      expect(throttledRes.headers["retry-after"]).toBeDefined();
      expect(Number(throttledRes.headers["retry-after"])).toBeGreaterThan(0);

      // CRITICAL HARD GATE (AC-009): Verify ZERO database mutation on 429
      orderCount = await prisma.simulationOrder.count({ where: { sessionId: sessionA.id } });
      expect(orderCount).toBe(testThreshold); // Still exactly 3, not 4!

      const tradesCount = await prisma.simulationTrade.count();
      expect(tradesCount).toBe(testThreshold); // Still exactly 3 trades

      // User B quota is isolated and unaffected
      const userBRes = await request(testApp)
        .post(`/api/simulation/sessions/${sessionB.id}/orders`)
        .set("Authorization", tokenUserB)
        .send({
          side: "BUY",
          type: "MARKET",
          assetSymbol: "AURA",
          quantity: 5,
          idempotencyKey: `user-b-key-1`,
        });

      expect(userBRes.status).toBe(HTTP_STATUS.CREATED);
    });
  });

  describe("6. Redis Failure Resilience: Fail Closed (Section 11, AC-019)", () => {
    it("fails closed with safe 503 SERVICE_UNAVAILABLE and ZERO DB mutation when Redis is unavailable", async () => {
      // Mock store that throws RedisUnavailableError
      const failingStore: RateLimitStore = {
        increment: vi.fn().mockRejectedValue(new RedisUnavailableError("Connection to Redis refused")),
        getCount: vi.fn().mockRejectedValue(new RedisUnavailableError()),
        setCooldown: vi.fn().mockRejectedValue(new RedisUnavailableError()),
        getCooldownTTL: vi.fn().mockRejectedValue(new RedisUnavailableError()),
        delete: vi.fn().mockRejectedValue(new RedisUnavailableError()),
        deleteByPrefix: vi.fn().mockRejectedValue(new RedisUnavailableError()),
      } as unknown as RateLimitStore;

      const rateLimiter = createSimulationOrderRateLimiter({
        enabled: true,
        store: failingStore,
      });

      const testApp: Express = express();
      testApp.use(express.json());
      testApp.use(createSimulationRouter(undefined, undefined, undefined, undefined, rateLimiter));

      const res = await request(testApp)
        .post(`/api/simulation/sessions/${sessionA.id}/orders`)
        .set("Authorization", tokenUserA)
        .send({
          side: "BUY",
          type: "MARKET",
          assetSymbol: "AURA",
          quantity: 10,
          idempotencyKey: "fail-closed-key-1",
        });

      expect(res.status).toBe(HTTP_STATUS.SERVICE_UNAVAILABLE);
      expect(res.body.error.code).toBe(ERROR_CODES.SERVICE_UNAVAILABLE);
      expect(res.body.error.message).toBe("Service temporarily unavailable. Please try again later.");

      // Verify zero DB rows were created
      const count = await prisma.simulationOrder.count({ where: { sessionId: sessionA.id } });
      expect(count).toBe(0);
    });
  });

  describe("7. Idempotency & Concurrency Regression (AC-006)", () => {
    it("preserves identical replay behavior (returns 200 OK with isReplay: true)", async () => {
      const idempotencyKey = "replay-key-001";
      const payload = {
        side: "BUY",
        type: "MARKET",
        assetSymbol: "AURA",
        quantity: 10,
        idempotencyKey,
      };

      const first = await request(standardApp)
        .post(`/api/simulation/sessions/${sessionA.id}/orders`)
        .set("Authorization", tokenUserA)
        .send(payload);

      expect(first.status).toBe(HTTP_STATUS.CREATED);
      expect(first.body.data.isReplay).toBeFalsy();

      // Replay identical
      const replay = await request(standardApp)
        .post(`/api/simulation/sessions/${sessionA.id}/orders`)
        .set("Authorization", tokenUserA)
        .send(payload);

      expect(replay.status).toBe(HTTP_STATUS.OK);
      expect(replay.body.data.isReplay).toBe(true);
      expect(replay.body.data.orderId).toBe(first.body.data.orderId);

      // Verify only 1 order created in DB
      const orderCount = await prisma.simulationOrder.count({ where: { sessionId: sessionA.id } });
      expect(orderCount).toBe(1);
    });

    it("rejects same idempotencyKey with conflicting payload (returns 409 IDEMPOTENCY_CONFLICT)", async () => {
      const idempotencyKey = "conflict-key-002";

      const first = await request(standardApp)
        .post(`/api/simulation/sessions/${sessionA.id}/orders`)
        .set("Authorization", tokenUserA)
        .send({
          side: "BUY",
          type: "MARKET",
          assetSymbol: "AURA",
          quantity: 10,
          idempotencyKey,
        });

      expect(first.status).toBe(HTTP_STATUS.CREATED);

      // Conflicting quantity
      const conflict = await request(standardApp)
        .post(`/api/simulation/sessions/${sessionA.id}/orders`)
        .set("Authorization", tokenUserA)
        .send({
          side: "BUY",
          type: "MARKET",
          assetSymbol: "AURA",
          quantity: 20, // Different!
          idempotencyKey,
        });

      expect(conflict.status).toBe(HTTP_STATUS.CONFLICT);
      expect(conflict.body.error.code).toBe(ERROR_CODES.IDEMPOTENCY_CONFLICT);
    });

    it("prevents BUY overspending under concurrent contention", async () => {
      // Set cash balance to exactly 1500 (can only afford one 10-share order @ 100/share = 1000, not two)
      await prisma.simulationPortfolio.update({
        where: { sessionId: sessionA.id },
        data: { cashBalance: new Prisma.Decimal("1500.0000") },
      });

      const [res1, res2] = await Promise.all([
        request(standardApp)
          .post(`/api/simulation/sessions/${sessionA.id}/orders`)
          .set("Authorization", tokenUserA)
          .send({
            side: "BUY",
            type: "MARKET",
            assetSymbol: "AURA",
            quantity: 10,
            idempotencyKey: "concurrent-buy-1",
          }),
        request(standardApp)
          .post(`/api/simulation/sessions/${sessionA.id}/orders`)
          .set("Authorization", tokenUserA)
          .send({
            side: "BUY",
            type: "MARKET",
            assetSymbol: "AURA",
            quantity: 10,
            idempotencyKey: "concurrent-buy-2",
          }),
      ]);

      const statuses = [res1.status, res2.status].sort();
      expect(statuses).toEqual([HTTP_STATUS.CREATED, HTTP_STATUS.CONFLICT]);

      const failedRes = res1.status === HTTP_STATUS.CONFLICT ? res1 : res2;
      expect(failedRes.body.error.code).toBe(ERROR_CODES.INSUFFICIENT_CASH);

      // Cash balance remains non-negative (1500 - 1000 = 500)
      const portfolio = await prisma.simulationPortfolio.findUnique({ where: { sessionId: sessionA.id } });
      expect(portfolio?.cashBalance.toFixed(4)).toBe("500.0000");
    });
  });

  describe("8. Product Audit & Admin Deferral Negative Checks (AC-011..AC-016)", () => {
    it("proves AuthSecurityAuditRecord is not modified or used by simulation operations", async () => {
      const initialAuditCount = await prisma.authSecurityAuditRecord.count();

      await request(standardApp)
        .post(`/api/simulation/sessions/${sessionA.id}/orders`)
        .set("Authorization", tokenUserA)
        .send({
          side: "BUY",
          type: "MARKET",
          assetSymbol: "AURA",
          quantity: 10,
          idempotencyKey: "audit-check-key",
        });

      const postAuditCount = await prisma.authSecurityAuditRecord.count();
      expect(postAuditCount).toBe(initialAuditCount); // Zero audit amplification / zero reuse
    });

    it("verifies no admin/support simulation API routes exist (AC-016)", async () => {
      const endpoints = [
        "/api/simulation/admin",
        "/api/simulation/admin/sessions",
        "/admin/simulation",
        "/admin/simulation/orders",
      ];

      for (const endpoint of endpoints) {
        const res = await request(standardApp)
          .get(endpoint)
          .set("Authorization", tokenAdmin);

        expect(res.status).toBe(HTTP_STATUS.NOT_FOUND);
      }
    });

    it("verifies all responses enforce simulation copy / disclosure boundary (AC-018)", async () => {
      const res = await request(standardApp)
        .get(`/api/simulation/sessions/${sessionA.id}/portfolio`)
        .set("Authorization", tokenUserA);

      expect(res.status).toBe(HTTP_STATUS.OK);
      expect(res.body.data.simulated).toBe(true);
    });
  });
});
