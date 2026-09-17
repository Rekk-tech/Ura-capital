import type { Request, Response, NextFunction } from "express";
import { ERROR_CODES, HTTP_STATUS } from "@aura/shared";
import { createErrorEnvelope } from "../../shared/errors/error-envelope.js";
import { logger } from "../../infrastructure/logging/logger.js";
import { getRedisClient } from "../../infrastructure/redis/redis.js";
import { buildStandardRedisKey, validateRedisKeySafety } from "../../infrastructure/redis/redis-keys.js";
import { RateLimitStore, RedisUnavailableError, type IRateLimitStore } from "../auth/rate-limit/rate-limit.store.js";
import { getEnv } from "../../infrastructure/config/env.js";
import type { AuthenticatedRequest } from "../auth/auth.types.js";

export interface SimulationOrderRateLimitOptions {
  /** Maximum order submissions allowed per window. Canonical default: 60 (FR-006, AC-007) */
  maxAttempts?: number;
  /** Window duration in seconds. Canonical default: 600 (10 minutes) */
  windowSec?: number;
  /** Force-enable or force-disable rate limiting (e.g. in test suites) */
  enabled?: boolean;
  /** Custom rate limit storage engine */
  store?: IRateLimitStore;
}

/** Canonical defaults defined in FEAT-039 specification */
export const SIMULATION_ORDER_RATE_LIMIT_DEFAULTS = {
  MAX_ATTEMPTS: 60,
  WINDOW_SEC: 600, // 10 minutes
} as const;

/**
 * Builds the standard Redis key for simulation order rate limiting:
 * Pattern: aura:{env}:rl:v1:simulation:orders:{userId}
 */
export function buildSimulationOrderRateLimitKey(userId: string, env?: string): string {
  const key = buildStandardRedisKey({
    app: "aura",
    env,
    feature: "rl",
    version: "v1",
    scope: "simulation:orders",
    identifier: userId,
  });

  const safetyCheck = validateRedisKeySafety(key);
  if (!safetyCheck.safe) {
    throw new Error(`[SECURITY_ALERT] Unsafe Redis key generated: ${safetyCheck.reason}`);
  }

  return key;
}

/**
 * Send safe 429 TOO_MANY_REQUESTS response with standard envelope and Retry-After header.
 * Zero leaks of Redis keys, secret materials, or connection details.
 */
function sendThrottledResponse(res: Response, requestId: string | undefined, retryAfterSec: number): void {
  if (retryAfterSec > 0) {
    res.setHeader("Retry-After", Math.ceil(retryAfterSec));
  }
  res.status(HTTP_STATUS.TOO_MANY_REQUESTS).json(
    createErrorEnvelope(
      "Too many requests. Please try again later.",
      ERROR_CODES.TOO_MANY_REQUESTS,
      requestId,
    ),
  );
}

/**
 * Send safe 503 SERVICE_UNAVAILABLE response when Redis is down/unavailable (fail closed).
 * Zero leaks of Redis URLs, key material, or infrastructure topology.
 */
function sendServiceUnavailableResponse(res: Response, requestId: string | undefined): void {
  res.status(HTTP_STATUS.SERVICE_UNAVAILABLE).json(
    createErrorEnvelope(
      "Service temporarily unavailable. Please try again later.",
      ERROR_CODES.SERVICE_UNAVAILABLE,
      requestId,
    ),
  );
}

/**
 * Creates rate-limiting middleware for simulation order submission (POST /api/simulation/sessions/:id/orders).
 *
 * Enforces:
 * - 60 submissions / 10 minutes per authenticated user.
 * - Transient Redis counter storage only (never business authority).
 * - Safe 429 response with Retry-After header when threshold exceeded.
 * - Zero DB mutation on 429 (terminates before controller/transaction).
 * - Fail-closed 503 response if Redis is unavailable, matching project auth standards.
 */
export function createSimulationOrderRateLimiter(options: SimulationOrderRateLimitOptions = {}) {
  const maxAttempts = options.maxAttempts ?? SIMULATION_ORDER_RATE_LIMIT_DEFAULTS.MAX_ATTEMPTS;
  const windowSec = options.windowSec ?? SIMULATION_ORDER_RATE_LIMIT_DEFAULTS.WINDOW_SEC;

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // 1. Resolve enabled flag
    let isEnabled: boolean;
    if (options.enabled !== undefined) {
      isEnabled = options.enabled;
    } else {
      try {
        isEnabled = getEnv().AUTH_RATE_LIMIT_ENABLED;
      } catch {
        isEnabled = process.env.NODE_ENV !== "test";
      }
    }

    if (!isEnabled) {
      next();
      return;
    }

    // 2. Resolve authenticated user identity
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user?.id;
    if (!userId) {
      // If unauthenticated, pass through to let downstream controller/guard handle 401
      next();
      return;
    }

    const requestId = req.id;
    const key = buildSimulationOrderRateLimitKey(userId);

    try {
      const store = options.store ?? new RateLimitStore(getRedisClient());

      // 3. Atomically increment counter in Redis
      const currentCount = await store.increment(key, windowSec);

      // 4. Threshold check
      if (currentCount > maxAttempts) {
        // Fetch remaining TTL for Retry-After header
        let ttl = await store.getCooldownTTL(key);
        if (ttl <= 0) {
          ttl = windowSec;
        }

        logger.warn("Rate limit exceeded for simulation order submission", {
          requestId,
          endpoint: "simulation:orders",
          category: "RATE_LIMITED",
        });

        sendThrottledResponse(res, requestId, ttl);
        return;
      }

      // Allowed — proceed to order controller
      next();
    } catch (err: unknown) {
      if (err instanceof RedisUnavailableError || (err as { name?: string })?.name === "RedisUnavailableError") {
        logger.error("Redis unavailable for simulation order rate limiting — fail closed", {
          requestId,
          category: "REDIS_ERROR",
        });
        sendServiceUnavailableResponse(res, requestId);
        return;
      }

      logger.error("Unexpected error in simulation order rate limiter — fail closed", {
        requestId,
        category: "REDIS_ERROR",
      });
      sendServiceUnavailableResponse(res, requestId);
    }
  };
}
