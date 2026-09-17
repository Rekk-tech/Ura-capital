import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Request, Response, NextFunction } from "express";
import { HTTP_STATUS, ERROR_CODES } from "@aura/shared";
import {
  createSimulationOrderRateLimiter,
  buildSimulationOrderRateLimitKey,
  SIMULATION_ORDER_RATE_LIMIT_DEFAULTS,
} from "../../src/modules/simulation/simulation-order.rate-limit.js";
import { RedisUnavailableError, type IRateLimitStore } from "../../src/modules/auth/rate-limit/rate-limit.store.js";
import type { AuthenticatedRequest } from "../../src/modules/auth/auth.types.js";

describe("Simulation Order Rate Limiter (FEAT-039 Unit Tests)", () => {
  let mockStore: IRateLimitStore;
  let mockReq: Partial<AuthenticatedRequest>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;
  let resStatusSpy: ReturnType<typeof vi.fn>;
  let resJsonSpy: ReturnType<typeof vi.fn>;
  let resSetHeaderSpy: ReturnType<typeof vi.fn>;

  const testUserId = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";
  const testRequestId = "test-req-12345";

  beforeEach(() => {
    resJsonSpy = vi.fn();
    resStatusSpy = vi.fn().mockReturnValue({ json: resJsonSpy });
    resSetHeaderSpy = vi.fn();

    mockStore = {
      increment: vi.fn().mockResolvedValue(1),
      getCount: vi.fn().mockResolvedValue(1),
      setCooldown: vi.fn().mockResolvedValue(undefined),
      getCooldownTTL: vi.fn().mockResolvedValue(550),
      delete: vi.fn().mockResolvedValue(undefined),
      deleteByPrefix: vi.fn().mockResolvedValue(undefined),
    };

    mockReq = {
      id: testRequestId,
      user: { id: testUserId, email: "learner@example.com" },
    };

    mockRes = {
      status: resStatusSpy as unknown as Response["status"],
      setHeader: resSetHeaderSpy as unknown as Response["setHeader"],
    };

    mockNext = vi.fn();
  });

  describe("1. Policy Thresholds & Key Derivation (AC-007, AC-010)", () => {
    it("uses canonical default of 60 attempts per 600 seconds (10 minutes)", () => {
      expect(SIMULATION_ORDER_RATE_LIMIT_DEFAULTS.MAX_ATTEMPTS).toBe(60);
      expect(SIMULATION_ORDER_RATE_LIMIT_DEFAULTS.WINDOW_SEC).toBe(600);
    });

    it("builds compliant standard Redis key without leaking sensitive data", () => {
      const key = buildSimulationOrderRateLimitKey(testUserId, "test");
      expect(key).toBe(`aura:test:rl:v1:simulation:orders:${testUserId}`);
      expect(key).not.toContain("@");
      expect(key).not.toContain("password");
      expect(key).not.toContain("secret");
    });
  });

  describe("2. Allowed Request Flow (Within 60 attempts)", () => {
    it("allows request when count is below or equal to 60", async () => {
      (mockStore.increment as ReturnType<typeof vi.fn>).mockResolvedValue(1);

      const limiter = createSimulationOrderRateLimiter({
        enabled: true,
        store: mockStore,
      });

      await limiter(mockReq as Request, mockRes as Response, mockNext);

      const expectedKey = buildSimulationOrderRateLimitKey(testUserId);
      expect(mockStore.increment).toHaveBeenCalledWith(
        expectedKey,
        600,
      );
      expect(mockNext).toHaveBeenCalled();
      expect(resStatusSpy).not.toHaveBeenCalled();
    });

    it("allows the exactly 60th attempt", async () => {
      (mockStore.increment as ReturnType<typeof vi.fn>).mockResolvedValue(60);

      const limiter = createSimulationOrderRateLimiter({
        enabled: true,
        store: mockStore,
      });

      await limiter(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(resStatusSpy).not.toHaveBeenCalled();
    });
  });

  describe("3. Throttled Request Flow (61st attempt onwards) (AC-008, AC-009)", () => {
    it("returns 429 TOO_MANY_REQUESTS with Retry-After header when count exceeds 60", async () => {
      (mockStore.increment as ReturnType<typeof vi.fn>).mockResolvedValue(61);
      (mockStore.getCooldownTTL as ReturnType<typeof vi.fn>).mockResolvedValue(480);

      const limiter = createSimulationOrderRateLimiter({
        enabled: true,
        store: mockStore,
      });

      await limiter(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(resSetHeaderSpy).toHaveBeenCalledWith("Retry-After", 480);
      expect(resStatusSpy).toHaveBeenCalledWith(HTTP_STATUS.TOO_MANY_REQUESTS);
      expect(resJsonSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            code: ERROR_CODES.TOO_MANY_REQUESTS,
            message: "Too many requests. Please try again later.",
            requestId: testRequestId,
          }),
        }),
      );
    });

    it("falls back to windowSec for Retry-After if TTL is zero or negative", async () => {
      (mockStore.increment as ReturnType<typeof vi.fn>).mockResolvedValue(62);
      (mockStore.getCooldownTTL as ReturnType<typeof vi.fn>).mockResolvedValue(-1);

      const limiter = createSimulationOrderRateLimiter({
        enabled: true,
        store: mockStore,
      });

      await limiter(mockReq as Request, mockRes as Response, mockNext);

      expect(resSetHeaderSpy).toHaveBeenCalledWith("Retry-After", 600);
      expect(resStatusSpy).toHaveBeenCalledWith(HTTP_STATUS.TOO_MANY_REQUESTS);
    });
  });

  describe("4. Fail-Closed Resilience on Redis Outage (Section 11, AC-019)", () => {
    it("returns safe 503 SERVICE_UNAVAILABLE when Redis throws RedisUnavailableError", async () => {
      (mockStore.increment as ReturnType<typeof vi.fn>).mockRejectedValue(
        new RedisUnavailableError("Connection refused"),
      );

      const limiter = createSimulationOrderRateLimiter({
        enabled: true,
        store: mockStore,
      });

      await limiter(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(resStatusSpy).toHaveBeenCalledWith(HTTP_STATUS.SERVICE_UNAVAILABLE);
      expect(resJsonSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            code: ERROR_CODES.SERVICE_UNAVAILABLE,
            message: "Service temporarily unavailable. Please try again later.",
            requestId: testRequestId,
          }),
        }),
      );
    });
  });

  describe("5. Configuration & Edge Cases", () => {
    it("passes through immediately when rate limiting is disabled", async () => {
      const limiter = createSimulationOrderRateLimiter({
        enabled: false,
        store: mockStore,
      });

      await limiter(mockReq as Request, mockRes as Response, mockNext);

      expect(mockStore.increment).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalled();
    });

    it("passes through when req has no authenticated user (defers to 401 guard)", async () => {
      const unauthReq: Partial<AuthenticatedRequest> = {
        id: testRequestId,
        user: undefined,
      };

      const limiter = createSimulationOrderRateLimiter({
        enabled: true,
        store: mockStore,
      });

      await limiter(unauthReq as Request, mockRes as Response, mockNext);

      expect(mockStore.increment).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalled();
    });
  });
});
