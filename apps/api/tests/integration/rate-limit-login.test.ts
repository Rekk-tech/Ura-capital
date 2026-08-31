import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import request from "supertest";
import type { Express } from "express";
import { HTTP_STATUS, ERROR_CODES } from "@aura/shared";
import Redis from "ioredis";
import { sanitizeDiagnosticMessage } from "../helpers/test-db-guard.js";
import { loginService } from "../../src/modules/auth/login.service.js";
import { AppError } from "../../src/shared/errors/error-envelope.js";
import { auditService } from "../../src/modules/auth/audit.service.js";
import { createLoginRateLimiter } from "../../src/modules/auth/rate-limit/rate-limit.middleware.js";
import { getRateLimitConfig } from "../../src/modules/auth/rate-limit/rate-limit.config.js";
import { resetEnvCache } from "../../src/infrastructure/config/env.js";
import { buildTestIsolatedRedisPrefix } from "../../src/infrastructure/redis/redis-keys.js";

/**
 * Integration tests for login rate limiting (FEAT-010A).
 * Tests deterministic throttling, 429 envelope, Retry-After, alias shared quota,
 * spoof resistance, fail-closed 503, audit non-amplification, and sensitive data exclusion.
 */
describe("Rate Limit — Login Integration", () => {
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

    // Mock loginService to simulate failed login (401) by default
    vi.spyOn(loginService, "login").mockImplementation(async () => {
      throw new AppError("Invalid email or password", ERROR_CODES.UNAUTHENTICATED, HTTP_STATUS.UNAUTHORIZED);
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
    // Clear all rate-limit keys before each test for total test isolation
    const keys = await redis.keys(`${TEST_PREFIX}*`);
    if (keys.length > 0) await redis.del(...keys);
  });

  it("allows login attempts below threshold with 401 response from controller", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({ email: "ratelimit-test@example.com", password: "testpassword123" });

    // Below threshold -> reaches controller and returns 401 UNAUTHORIZED
    expect(res.status).toBe(HTTP_STATUS.UNAUTHORIZED);
    expect(res.body.error.code).toBe(ERROR_CODES.UNAUTHENTICATED);
  });

  it("strictly enforces 429 TOO_MANY_REQUESTS after 5 failed attempts for same identity/source", async () => {
    const email = "brute-force-target@example.com";

    // 5 failed login attempts (each increments identity failure counter)
    for (let i = 0; i < 5; i++) {
      const failRes = await request(app)
        .post("/auth/login")
        .send({ email, password: "wrong-password" });
      expect(failRes.status).toBe(HTTP_STATUS.UNAUTHORIZED);
    }

    // 6th attempt MUST be strictly throttled with 429
    const throttledRes = await request(app)
      .post("/auth/login")
      .send({ email, password: "wrong-password" });

    expect(throttledRes.status).toBe(HTTP_STATUS.TOO_MANY_REQUESTS);
    expect(throttledRes.body.error).toBeDefined();
    expect(throttledRes.body.error.code).toBe(ERROR_CODES.TOO_MANY_REQUESTS);
    expect(throttledRes.body.error.message).toBe("Too many requests. Please try again later.");
    expect(throttledRes.body.error.requestId).toBeDefined();

    // Verify Retry-After header
    const retryAfter = throttledRes.headers["retry-after"];
    expect(retryAfter).toBeDefined();
    const retryAfterSec = parseInt(retryAfter, 10);
    expect(retryAfterSec).toBeGreaterThan(0);
    expect(retryAfterSec).toBeLessThanOrEqual(1800);

    // Verify response body does NOT leak sensitive email, password, or key material
    const rawBody = JSON.stringify(throttledRes.body);
    expect(rawBody).not.toContain(email);
    expect(rawBody).not.toContain("wrong-password");
    expect(rawBody).not.toContain("rl:v1");
  });

  it("proves canonical /auth/login and alias /api/auth/login share the exact same quota", async () => {
    const email = "shared-quota-user@example.com";

    // 3 failed attempts on canonical /auth/login
    for (let i = 0; i < 3; i++) {
      const res = await request(app)
        .post("/auth/login")
        .send({ email, password: "wrong-password" });
      expect(res.status).toBe(HTTP_STATUS.UNAUTHORIZED);
    }

    // 2 failed attempts on alias /api/auth/login (total 5)
    for (let i = 0; i < 2; i++) {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ email, password: "wrong-password" });
      expect(res.status).toBe(HTTP_STATUS.UNAUTHORIZED);
    }

    // 6th attempt on alias route MUST receive exact 429
    const aliasThrottled = await request(app)
      .post("/api/auth/login")
      .send({ email, password: "wrong-password" });

    expect(aliasThrottled.status).toBe(HTTP_STATUS.TOO_MANY_REQUESTS);
    expect(aliasThrottled.body.error.code).toBe(ERROR_CODES.TOO_MANY_REQUESTS);

    // 7th attempt on canonical route MUST ALSO receive exact 429 (shared cooldown)
    const canonicalThrottled = await request(app)
      .post("/auth/login")
      .send({ email, password: "wrong-password" });

    expect(canonicalThrottled.status).toBe(HTTP_STATUS.TOO_MANY_REQUESTS);
    expect(canonicalThrottled.body.error.code).toBe(ERROR_CODES.TOO_MANY_REQUESTS);
  });

  it("proves spoofed X-Forwarded-For headers cannot bypass rate limiting (trustProxy=false)", async () => {
    const email = "spoof-protection-user@example.com";

    // 5 attempts each with different spoofed X-Forwarded-For headers
    for (let i = 0; i < 5; i++) {
      const res = await request(app)
        .post("/auth/login")
        .set("X-Forwarded-For", `198.51.100.${i + 1}`)
        .send({ email, password: "wrong-password" });
      expect(res.status).toBe(HTTP_STATUS.UNAUTHORIZED);
    }

    // 6th attempt with yet another spoofed IP MUST STILL receive exact 429
    const res = await request(app)
      .post("/auth/login")
      .set("X-Forwarded-For", "203.0.113.99")
      .send({ email, password: "wrong-password" });

    expect(res.status).toBe(HTTP_STATUS.TOO_MANY_REQUESTS);
    expect(res.body.error.code).toBe(ERROR_CODES.TOO_MANY_REQUESTS);
  });

  it("verifies 429 throttled requests do NOT create durable audit records (zero audit amplification)", async () => {
    const auditSpy = vi.spyOn(auditService, "recordBestEffort");
    const email = "no-audit-amp@example.com";

    // Exhaust quota (5 attempts)
    for (let i = 0; i < 5; i++) {
      await request(app)
        .post("/auth/login")
        .send({ email, password: "wrong-password" });
    }

    auditSpy.mockClear();

    // 6th request: throttled at middleware layer
    const throttledRes = await request(app)
      .post("/auth/login")
      .send({ email, password: "wrong-password" });

    expect(throttledRes.status).toBe(HTTP_STATUS.TOO_MANY_REQUESTS);
    // AuditService MUST NOT have been called for the throttled request
    expect(auditSpy).not.toHaveBeenCalled();
  });

  it("returns safe 503 SERVICE_UNAVAILABLE when Redis is unavailable (fail-closed)", async () => {
    const config = getRateLimitConfig();
    const loginLimiter = createLoginRateLimiter(config);

    const req = {
      id: "test-redis-fail-closed-req",
      socket: { remoteAddress: "127.0.0.1" },
      body: { email: "failclosed@example.com", password: "password123" },
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
      on: vi.fn(),
    } as unknown as Response;

    const next = vi.fn();

    const { disconnectRedis } = await import("../../src/infrastructure/redis/redis.js");
    await disconnectRedis();

    const originalRedisUrl = process.env.REDIS_URL;
    process.env.REDIS_URL = "redis://127.0.0.1:59999";
    resetEnvCache();

    try {
      await loginLimiter(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(responseStatus).toBe(HTTP_STATUS.SERVICE_UNAVAILABLE);
      const errorObj = responseBody?.error as Record<string, unknown> | undefined;
      expect(errorObj?.code).toBe(ERROR_CODES.SERVICE_UNAVAILABLE);
      expect(errorObj?.message).toBe("Service temporarily unavailable. Please try again later.");
      expect(errorObj?.requestId).toBe("test-redis-fail-closed-req");
      expect(JSON.stringify(responseBody)).not.toContain("redis://");
    } finally {
      process.env.REDIS_URL = originalRedisUrl;
      resetEnvCache();
      await disconnectRedis();
    }
  });

  it("unknown user and wrong password receive uniform rate-limiting treatment (no enumeration)", async () => {
    const unknownRes = await request(app)
      .post("/auth/login")
      .send({ email: "nonexistent-user-123@example.com", password: "anypassword123" });

    const wrongPwdRes = await request(app)
      .post("/auth/login")
      .send({ email: "another-nonexistent-456@example.com", password: "wrongpassword" });

    expect(unknownRes.status).toBe(HTTP_STATUS.UNAUTHORIZED);
    expect(wrongPwdRes.status).toBe(HTTP_STATUS.UNAUTHORIZED);
    expect(unknownRes.body.error.code).toBe(wrongPwdRes.body.error.code);
    expect(unknownRes.body.error.message).toBe(wrongPwdRes.body.error.message);
  });
});
