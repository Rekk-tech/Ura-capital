import type { Request, Response, NextFunction } from "express";
import { ERROR_CODES, HTTP_STATUS } from "@aura/shared";
import { createErrorEnvelope } from "../../shared/errors/error-envelope.js";
import { logger } from "../../infrastructure/logging/logger.js";
import { getRedisClient } from "../../infrastructure/redis/redis.js";
import {
  RateLimitStore,
  type IRateLimitStore,
} from "../auth/rate-limit/rate-limit.store.js";
import { getEnv } from "../../infrastructure/config/env.js";
import type { AuthenticatedRequest } from "../auth/auth.types.js";
import {
  COMMUNITY_RATE_LIMIT_POLICIES,
  validateCommunityRateLimitSecret,
  type CommunityRateLimitOperation,
} from "./community-rate-limit.config.js";
import {
  buildCommunityRateLimitKey,
  resolveCommunitySource,
} from "./community-rate-limit.keys.js";

export interface CommunityRateLimitOptions {
  operation: CommunityRateLimitOperation;
  userMax?: number;
  sourceMax?: number;
  windowSec?: number;
  enabled?: boolean;
  trustProxy?: boolean;
  keySecret?: string;
  store?: IRateLimitStore;
}

/**
 * Sends a canonical 429 TOO_MANY_REQUESTS response with integer Retry-After header (AC-024).
 * Never leaks Redis keys, internal metrics, or secret material.
 */
function sendThrottledResponse(
  res: Response,
  requestId: string | undefined,
  retryAfterSec: number,
): void {
  const retryAfter = Math.max(1, Math.ceil(retryAfterSec));
  res.setHeader("Retry-After", retryAfter);
  res.status(HTTP_STATUS.TOO_MANY_REQUESTS).json(
    createErrorEnvelope(
      "Too many requests. Please try again later.",
      ERROR_CODES.TOO_MANY_REQUESTS,
      requestId,
    ),
  );
}

/**
 * Sends a canonical 503 SERVICE_UNAVAILABLE response when Redis is down or returns error (AC-025).
 * Enforces fail-closed protection for Community writes before any DB mutation.
 * Never leaks Redis URLs, hostnames, or credentials.
 */
function sendServiceUnavailableResponse(
  res: Response,
  requestId: string | undefined,
): void {
  res.status(HTTP_STATUS.SERVICE_UNAVAILABLE).json(
    createErrorEnvelope(
      "Service temporarily unavailable. Please try again later.",
      ERROR_CODES.SERVICE_UNAVAILABLE,
      requestId,
    ),
  );
}

/**
 * Factory creating rate-limiting middleware for Community write operations (FR-007..FR-015).
 *
 * Enforces:
 * - Independent user and source rate limits based on Human-approved policies.
 * - Atomic Redis transient counter increments.
 * - 429 TOO_MANY_REQUESTS with Retry-After on threshold violation.
 * - Zero PostgreSQL mutation on throttled requests (short-circuits before controller).
 * - Fail-closed 503 SERVICE_UNAVAILABLE if Redis is unreachable for write mutations.
 * - Zero audit amplification (no durable audit written on throttled or failed requests).
 */
export function createCommunityRateLimiter(options: CommunityRateLimitOptions) {
  const policy = COMMUNITY_RATE_LIMIT_POLICIES[options.operation];
  const userMax = options.userMax ?? policy.userMax;
  const sourceMax = options.sourceMax ?? policy.sourceMax;
  const windowSec = options.windowSec ?? policy.windowSec;

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // 1. Resolve enabled flag
    let isEnabled: boolean;
    if (options.enabled !== undefined) {
      isEnabled = options.enabled;
    } else {
      try {
        const env = getEnv();
        isEnabled = env.COMMUNITY_RATE_LIMIT_ENABLED ?? (env.NODE_ENV !== "test");
      } catch {
        isEnabled = process.env.NODE_ENV !== "test";
      }
    }

    if (!isEnabled) {
      next();
      return;
    }

    // 2. Resolve authenticated user
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user?.id;
    if (!userId) {
      // Unauthenticated requests pass through to downstream auth middleware / guard
      next();
      return;
    }

    const requestId = req.id;

    // 3. Resolve key secret & trustProxy setting
    let secret = options.keySecret;
    let trustProxy = options.trustProxy;
    try {
      const env = getEnv();
      if (!secret) {
        secret = env.COMMUNITY_RATE_LIMIT_KEY_SECRET;
      }
      if (trustProxy === undefined) {
        trustProxy = env.AUTH_RATE_LIMIT_TRUST_PROXY ?? false;
      }
    } catch {
      // If config unavailable, use provided secret or fail safely
      secret = secret || process.env.COMMUNITY_RATE_LIMIT_KEY_SECRET;
      if (trustProxy === undefined) {
        trustProxy = false;
      }
    }

    try {
      secret = validateCommunityRateLimitSecret(secret);
    } catch {
      logger.error("Community rate limiter secret validation failed", {
        requestId,
        operation: options.operation,
        category: "SECURITY_ALERT",
      });
      sendServiceUnavailableResponse(res, requestId);
      return;
    }

    // 4. Resolve source identifier and build Redis keys
    const sourceIp = resolveCommunitySource(req, trustProxy);
    const userKey = buildCommunityRateLimitKey({
      operation: options.operation,
      scope: "user",
      rawIdentifier: userId,
      secret,
    });
    const sourceKey = buildCommunityRateLimitKey({
      operation: options.operation,
      scope: "source",
      rawIdentifier: sourceIp,
      secret,
    });

    try {
      const store = options.store ?? new RateLimitStore(getRedisClient());

      // 5. Atomically increment both user and source counters in Redis
      const [userCount, sourceCount] = await Promise.all([
        store.increment(userKey, windowSec),
        store.increment(sourceKey, windowSec),
      ]);

      // 6. Check dual thresholds independently
      const userExceeded = userCount > userMax;
      const sourceExceeded = sourceCount > sourceMax;

      if (userExceeded || sourceExceeded) {
        const exceededKey = userExceeded ? userKey : sourceKey;
        let ttl = await store.getCooldownTTL(exceededKey);
        if (ttl <= 0) {
          ttl = windowSec;
        }

        logger.warn("Community write rate limit exceeded", {
          requestId,
          operation: options.operation,
          userExceeded,
          sourceExceeded,
          category: "RATE_LIMITED",
        });

        sendThrottledResponse(res, requestId, ttl);
        return;
      }

      // Passed both rate checks — proceed to business controller
      next();
    } catch {
      // Redis outage / error -> fail-closed on write operations
      logger.error("Redis unavailable for community write rate limiting — fail closed", {
        requestId,
        operation: options.operation,
        category: "REDIS_ERROR",
      });

      sendServiceUnavailableResponse(res, requestId);
    }
  };
}
