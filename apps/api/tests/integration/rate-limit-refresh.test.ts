import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import request from "supertest";
import type { Express, Request, Response } from "express";
import { HTTP_STATUS, ERROR_CODES } from "@aura/shared";
import Redis from "ioredis";
import { sanitizeDiagnosticMessage } from "../helpers/test-db-guard.js";
import { refreshTokenService } from "../../src/modules/auth/refresh-token.service.js";
import { auditService } from "../../src/modules/auth/audit.service.js";
import { AppError } from "../../src/shared/errors/error-envelope.js";
import { createRefreshRateLimiter } from "../../src/modules/auth/rate-limit/rate-limit.middleware.js";
import { getRateLimitConfig } from "../../src/modules/auth/rate-limit/rate-limit.config.js";
import { resetEnvCache } from "../../src/infrastructure/config/env.js";
import { buildTestIsolatedRedisPrefix } from "../../src/infrastructure/redis/redis-keys.js";

/**
 * Integration tests for refresh rate limiting (FEAT-010A).
 * Tests deterministic source / malformed bucket throttling, 429 envelope, Retry-After,
 * alias shared quota, token privacy in keys, FEAT-005 replay semantics preservation, and fail-closed 503.
 */
describe("Rate Limit — Refresh Integration", () => {
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

    // Mock refreshTokenService to reject with 401 by default
    vi.spyOn(refreshTokenService, "refresh").mockImplementation(async () => {
      throw new AppError("Invalid refresh token", ERROR_CODES.UNAUTHENTICATED, HTTP_STATUS.UNAUTHORIZED);
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

  it("allows refresh attempts below threshold with 401 response from controller", async () => {
    const res = await request(app)
      .post("/auth/refresh")
      .set("Cookie", "aura_refresh_token=valid-looking-test-token");

    expect(res.status).toBe(HTTP_STATUS.UNAUTHORIZED);
    expect(res.body.error.code).toBe(ERROR_CODES.UNAUTHENTICATED);
  });

  it("strictly throttles excessive refresh attempts from same source with 429 after 20 attempts", async () => {
    // 20 validly formatted refresh attempts below limit
    for (let i = 0; i < 20; i++) {
      const res = await request(app)
        .post("/auth/refresh")
        .set("Cookie", `aura_refresh_token=token-sequence-${i}`);
      expect(res.status).toBe(HTTP_STATUS.UNAUTHORIZED);
    }

    // 21st attempt MUST receive exact 429
    const throttledRes = await request(app)
      .post("/auth/refresh")
      .set("Cookie", "aura_refresh_token=token-sequence-final");

    expect(throttledRes.status).toBe(HTTP_STATUS.TOO_MANY_REQUESTS);
    expect(throttledRes.body.error).toBeDefined();
    expect(throttledRes.body.error.code).toBe(ERROR_CODES.TOO_MANY_REQUESTS);
    expect(throttledRes.body.error.message).toBe("Too many requests. Please try again later.");
    expect(throttledRes.headers["retry-after"]).toBeDefined();
  });

  it("strictly throttles malformed/missing cookie attempts faster (after 5 attempts)", async () => {
    // 5 attempts without cookie
    for (let i = 0; i < 5; i++) {
      const res = await request(app).post("/auth/refresh");
      expect(res.status).toBe(HTTP_STATUS.UNAUTHORIZED);
    }

    // 6th attempt without cookie MUST receive exact 429
    const throttledRes = await request(app).post("/auth/refresh");
    expect(throttledRes.status).toBe(HTTP_STATUS.TOO_MANY_REQUESTS);
    expect(throttledRes.body.error.code).toBe(ERROR_CODES.TOO_MANY_REQUESTS);
  });

  it("proves canonical /auth/refresh and alias /api/auth/refresh share the same quota", async () => {
    // 3 attempts on canonical /auth/refresh without cookie
    for (let i = 0; i < 3; i++) {
      const res = await request(app).post("/auth/refresh");
      expect(res.status).toBe(HTTP_STATUS.UNAUTHORIZED);
    }

    // 2 attempts on alias /api/auth/refresh without cookie (total 5)
    for (let i = 0; i < 2; i++) {
      const res = await request(app).post("/api/auth/refresh");
      expect(res.status).toBe(HTTP_STATUS.UNAUTHORIZED);
    }

    // 6th attempt on alias route MUST receive exact 429
    const aliasThrottled = await request(app).post("/api/auth/refresh");
    expect(aliasThrottled.status).toBe(HTTP_STATUS.TOO_MANY_REQUESTS);
    expect(aliasThrottled.body.error.code).toBe(ERROR_CODES.TOO_MANY_REQUESTS);
  });

  it("does not use raw refresh token or secret data in Redis rate-limit keys", async () => {
    const sensitiveToken = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.sensitive-payload.signature-12345";

    await request(app)
      .post("/auth/refresh")
      .set("Cookie", `aura_refresh_token=${sensitiveToken}`);

    // Check all Redis keys — none should contain raw token, JWT payload, or cookie name
    const keys = await redis.keys(`${TEST_PREFIX}*`);
    expect(keys.length).toBeGreaterThan(0);

    for (const key of keys) {
      expect(key).not.toContain(sensitiveToken);
      expect(key).not.toContain("sensitive-payload");
      expect(key).not.toContain("signature-12345");
      expect(key).not.toContain("eyJ");
    }
  });

  it("preserves FEAT-005 replay revocation semantics when controller is reached below threshold", async () => {
    // FEAT-005's PostgreSQL family revocation is authoritative
    // Below threshold, requests reach refreshTokenService and execute business logic
    const res = await request(app)
      .post("/auth/refresh")
      .set("Cookie", "aura_refresh_token=replay-test-token");

    expect(res.status).toBe(HTTP_STATUS.UNAUTHORIZED);
    expect(res.body.error.code).toBe(ERROR_CODES.UNAUTHENTICATED);
  });

  it("verifies refresh 429 does NOT create durable audit records (zero audit amplification)", async () => {
    const auditSpy = vi.spyOn(auditService, "recordSecurityFirst");

    // Exhaust malformed bucket
    for (let i = 0; i < 5; i++) {
      await request(app).post("/auth/refresh");
    }

    auditSpy.mockClear();

    // 6th attempt (throttled at middleware)
    const throttledRes = await request(app).post("/auth/refresh");

    expect(throttledRes.status).toBe(HTTP_STATUS.TOO_MANY_REQUESTS);
    expect(auditSpy).not.toHaveBeenCalled();
  });

  it("returns safe 503 SERVICE_UNAVAILABLE when Redis is unavailable on refresh (fail-closed)", async () => {
    const config = getRateLimitConfig();
    const refreshLimiter = createRefreshRateLimiter(config);

    const req = {
      id: "test-refresh-fail-closed-req",
      socket: { remoteAddress: "127.0.0.1" },
      cookies: { aura_refresh_token: "token123" },
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

    const { disconnectRedis } = await import("../../src/infrastructure/redis/redis.js");
    await disconnectRedis();

    const originalRedisUrl = process.env.REDIS_URL;
    process.env.REDIS_URL = "redis://127.0.0.1:59997";
    resetEnvCache();

    try {
      await refreshLimiter(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(responseStatus).toBe(HTTP_STATUS.SERVICE_UNAVAILABLE);
      const errorObj = responseBody?.error as Record<string, unknown> | undefined;
      expect(errorObj?.code).toBe(ERROR_CODES.SERVICE_UNAVAILABLE);
      expect(errorObj?.message).toBe("Service temporarily unavailable. Please try again later.");
      expect(errorObj?.requestId).toBe("test-refresh-fail-closed-req");
    } finally {
      process.env.REDIS_URL = originalRedisUrl;
      resetEnvCache();
      await disconnectRedis();
    }
  });

  it("safe response does not expose cookie names, token content, or internal keys", async () => {
    const sensitiveToken = "sensitive-refresh-payload-data-99999";

    // Exhaust source threshold
    for (let i = 0; i < 20; i++) {
      await request(app)
        .post("/auth/refresh")
        .set("Cookie", `aura_refresh_token=tok-${i}`);
    }

    const res = await request(app)
      .post("/auth/refresh")
      .set("Cookie", `aura_refresh_token=${sensitiveToken}`);

    expect(res.status).toBe(HTTP_STATUS.TOO_MANY_REQUESTS);
    const body = JSON.stringify(res.body);
    expect(body).not.toContain(sensitiveToken);
    expect(body).not.toContain("aura_refresh_token");
    expect(body).not.toContain("rl:v1");
  });
});
