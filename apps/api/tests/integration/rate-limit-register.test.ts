import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import request from "supertest";
import type { Express, Request, Response } from "express";
import { HTTP_STATUS, ERROR_CODES } from "@aura/shared";
import Redis from "ioredis";
import { sanitizeDiagnosticMessage } from "../helpers/test-db-guard.js";
import { registrationService } from "../../src/modules/auth/registration.service.js";
import { auditService } from "../../src/modules/auth/audit.service.js";
import { createRegisterRateLimiter } from "../../src/modules/auth/rate-limit/rate-limit.middleware.js";
import { getRateLimitConfig } from "../../src/modules/auth/rate-limit/rate-limit.config.js";
import { resetEnvCache } from "../../src/infrastructure/config/env.js";
import { buildTestIsolatedRedisPrefix } from "../../src/infrastructure/redis/redis-keys.js";

/**
 * Integration tests for registration rate limiting (FEAT-010A).
 * Tests deterministic source/identity throttling, 429 envelope, Retry-After,
 * alias shared quota, spoof resistance, fail-closed 503, and privacy.
 */
describe("Rate Limit — Register Integration", () => {
  let app: Express;
  let redis: Redis;
  const TEST_PREFIX = buildTestIsolatedRedisPrefix({ feature: "rl", version: "v1" });

  beforeAll(async () => {
    process.env.NODE_ENV = "test";
    process.env.AUTH_RATE_LIMIT_ENABLED = "true";
    process.env.AUTH_RATE_LIMIT_KEY_SECRET = "test-rate-limit-hmac-secret-at-least-32-chars-long";
    process.env.AUTH_RATE_LIMIT_TRUST_PROXY = "false";
    process.env.REDIS_URL = process.env.REDIS_URL || "redis://127.0.0.1:6379";
    resetEnvCache();

    // Fast-fail Redis ping check (1s timeout)
    redis = new Redis(process.env.REDIS_URL, {
      connectTimeout: 1000,
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
        `[REDIS_TEST_SETUP_FAILED] Redis is not reachable. Ensure Docker container 'aura-redis' is running. Error: ${safeError}`,
      );
    }

    // Mock registrationService by default
    vi.spyOn(registrationService, "register").mockResolvedValue({
      user: {
        id: "11111111-2222-3333-4444-555555555555",
        email: "test@example.com",
        displayName: null,
        status: "ACTIVE",
        createdAt: new Date().toISOString(),
      },
    });

    const { createApp } = await import("../../src/server.js");
    app = createApp();
  });

  afterAll(async () => {
    delete process.env.AUTH_RATE_LIMIT_ENABLED;
    resetEnvCache();
    if (redis && redis.status === "ready") {
      try {
        const keys = await redis.keys(`${TEST_PREFIX}*`);
        if (keys.length > 0) await redis.del(...keys);
        await redis.quit();
      } catch {
        // Ignore teardown errors
      }
    }
  });

  beforeEach(async () => {
    const keys = await redis.keys(`${TEST_PREFIX}*`);
    if (keys.length > 0) await redis.del(...keys);
  });

  it("allows first registration attempt with 201 Created", async () => {
    const res = await request(app)
      .post("/auth/register")
      .send({
        email: "first-reg@example.com",
        password: "SecureP@ssword123",
      });

    expect(res.status).toBe(HTTP_STATUS.CREATED);
    expect(res.body.user).toBeDefined();
  });

  it("strictly throttles excessive registration attempts from same source with 429 after 5 attempts", async () => {
    // 5 allowed attempts
    for (let i = 0; i < 5; i++) {
      const res = await request(app)
        .post("/auth/register")
        .send({
          email: `reg-source-${i}@example.com`,
          password: "SecureP@ssword123",
        });
      expect(res.status).toBe(HTTP_STATUS.CREATED);
    }

    // 6th attempt from same source MUST receive exact 429
    const throttledRes = await request(app)
      .post("/auth/register")
      .send({
        email: "reg-source-final@example.com",
        password: "SecureP@ssword123",
      });

    expect(throttledRes.status).toBe(HTTP_STATUS.TOO_MANY_REQUESTS);
    expect(throttledRes.body.error).toBeDefined();
    expect(throttledRes.body.error.code).toBe(ERROR_CODES.TOO_MANY_REQUESTS);
    expect(throttledRes.body.error.message).toBe("Too many requests. Please try again later.");
    expect(throttledRes.body.error.requestId).toBeDefined();

    // Verify Retry-After header
    const retryAfter = throttledRes.headers["retry-after"];
    expect(retryAfter).toBeDefined();
    expect(parseInt(retryAfter, 10)).toBeGreaterThan(0);
  });

  it("strictly throttles repeated registration attempts for the same identity after 3 attempts", async () => {
    const email = "targeted-identity@example.com";

    // First 3 registration attempts for this identity
    for (let i = 0; i < 3; i++) {
      const res = await request(app)
        .post("/auth/register")
        .send({ email, password: "SecureP@ssword123" });
      expect(res.status).toBe(HTTP_STATUS.CREATED);
    }

    // 4th registration attempt for the same identity MUST receive exact 429
    const throttledRes = await request(app)
      .post("/auth/register")
      .send({ email, password: "SecureP@ssword123" });

    expect(throttledRes.status).toBe(HTTP_STATUS.TOO_MANY_REQUESTS);
    expect(throttledRes.body.error.code).toBe(ERROR_CODES.TOO_MANY_REQUESTS);
  });

  it("proves canonical /auth/register and alias /api/auth/register share the same quota", async () => {
    // 3 attempts on canonical /auth/register
    for (let i = 0; i < 3; i++) {
      const res = await request(app)
        .post("/auth/register")
        .send({ email: `alias-shared-${i}@example.com`, password: "SecureP@ssword123" });
      expect(res.status).toBe(HTTP_STATUS.CREATED);
    }

    // 2 attempts on alias /api/auth/register (total 5)
    for (let i = 3; i < 5; i++) {
      const res = await request(app)
        .post("/api/auth/register")
        .send({ email: `alias-shared-${i}@example.com`, password: "SecureP@ssword123" });
      expect(res.status).toBe(HTTP_STATUS.CREATED);
    }

    // 6th attempt on alias route MUST receive exact 429
    const aliasThrottled = await request(app)
      .post("/api/auth/register")
      .send({ email: "alias-shared-6@example.com", password: "SecureP@ssword123" });

    expect(aliasThrottled.status).toBe(HTTP_STATUS.TOO_MANY_REQUESTS);
    expect(aliasThrottled.body.error.code).toBe(ERROR_CODES.TOO_MANY_REQUESTS);

    // 7th attempt on canonical route MUST ALSO receive exact 429
    const canonicalThrottled = await request(app)
      .post("/auth/register")
      .send({ email: "alias-shared-7@example.com", password: "SecureP@ssword123" });

    expect(canonicalThrottled.status).toBe(HTTP_STATUS.TOO_MANY_REQUESTS);
    expect(canonicalThrottled.body.error.code).toBe(ERROR_CODES.TOO_MANY_REQUESTS);
  });

  it("proves spoofed X-Forwarded-For cannot bypass registration limit (trustProxy=false)", async () => {
    for (let i = 0; i < 5; i++) {
      const res = await request(app)
        .post("/auth/register")
        .set("X-Forwarded-For", `10.0.0.${i + 1}`)
        .send({ email: `spoof-reg-${i}@example.com`, password: "SecureP@ssword123" });
      expect(res.status).toBe(HTTP_STATUS.CREATED);
    }

    // 6th attempt with different spoofed IP MUST receive exact 429
    const res = await request(app)
      .post("/auth/register")
      .set("X-Forwarded-For", "10.0.0.99")
      .send({ email: "spoof-reg-final@example.com", password: "SecureP@ssword123" });

    expect(res.status).toBe(HTTP_STATUS.TOO_MANY_REQUESTS);
    expect(res.body.error.code).toBe(ERROR_CODES.TOO_MANY_REQUESTS);
  });

  it("verifies registration 429 does NOT create durable audit records (zero audit amplification)", async () => {
    const auditSpy = vi.spyOn(auditService, "recordBestEffort");

    // Exhaust quota
    for (let i = 0; i < 5; i++) {
      await request(app)
        .post("/auth/register")
        .send({ email: `audit-check-${i}@example.com`, password: "SecureP@ssword123" });
    }

    auditSpy.mockClear();

    // Throttled request
    const throttledRes = await request(app)
      .post("/auth/register")
      .send({ email: "audit-check-final@example.com", password: "SecureP@ssword123" });

    expect(throttledRes.status).toBe(HTTP_STATUS.TOO_MANY_REQUESTS);
    expect(auditSpy).not.toHaveBeenCalled();
  });

  it("returns safe 503 SERVICE_UNAVAILABLE when Redis is unavailable on register (fail-closed)", async () => {
    const config = getRateLimitConfig();
    const registerLimiter = createRegisterRateLimiter(config);

    const req = {
      id: "test-reg-fail-closed-req",
      socket: { remoteAddress: "127.0.0.1" },
      body: { email: "failclosed-reg@example.com", password: "SecureP@ssword123" },
      headers: {},
    } as unknown as Request;

    let responseStatus: number | undefined;
    let responseBody: Record<string, unknown> | undefined;

    const res = {
      status(s: number) {
        responseStatus = s;
        return this;
      },
      json(b: Record<string, unknown>) {
        responseBody = b;
        return this;
      },
    } as unknown as Response;

    const next = vi.fn();

    // Temporarily point getRedisClient to a disconnected client
    const { disconnectRedis } = await import("../../src/infrastructure/redis/redis.js");
    await disconnectRedis();

    // Disconnect Redis to trigger RedisUnavailableError
    const originalRedisUrl = process.env.REDIS_URL;
    process.env.REDIS_URL = "redis://127.0.0.1:59998";
    resetEnvCache();

    try {
      await registerLimiter(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(responseStatus).toBe(HTTP_STATUS.SERVICE_UNAVAILABLE);
      const errorObj = responseBody?.error as Record<string, unknown> | undefined;
      expect(errorObj?.code).toBe(ERROR_CODES.SERVICE_UNAVAILABLE);
      expect(errorObj?.message).toBe("Service temporarily unavailable. Please try again later.");
      expect(errorObj?.requestId).toBe("test-reg-fail-closed-req");
    } finally {
      process.env.REDIS_URL = originalRedisUrl;
      resetEnvCache();
      await disconnectRedis();
    }
  });

  it("safe response does not contain sensitive email or password", async () => {
    const sensitiveEmail = "sensitive-client@private-domain.com";
    const sensitivePassword = "SuperSecretPassword999!";

    for (let i = 0; i < 5; i++) {
      await request(app)
        .post("/auth/register")
        .send({ email: `fill-${i}@example.com`, password: "SecureP@ssword123" });
    }

    const res = await request(app)
      .post("/auth/register")
      .send({ email: sensitiveEmail, password: sensitivePassword });

    expect(res.status).toBe(HTTP_STATUS.TOO_MANY_REQUESTS);
    const body = JSON.stringify(res.body);
    expect(body).not.toContain(sensitiveEmail);
    expect(body).not.toContain(sensitivePassword);
    expect(body).not.toContain("private-domain.com");
  });
});
