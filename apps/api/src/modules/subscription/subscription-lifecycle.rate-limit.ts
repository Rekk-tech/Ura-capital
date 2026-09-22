import crypto from "node:crypto";
import type { Request, Response, NextFunction } from "express";
import { ERROR_CODES, HTTP_STATUS } from "@aura/shared";
import { createErrorEnvelope } from "../../shared/errors/error-envelope.js";
import { logger } from "../../infrastructure/logging/logger.js";
import { getRedisClient } from "../../infrastructure/redis/redis.js";
import {
  RateLimitStore,
  RedisUnavailableError,
  type IRateLimitStore,
} from "../auth/rate-limit/rate-limit.store.js";
import {
  buildStandardRedisKey,
  validateRedisKeySafety,
} from "../../infrastructure/redis/redis-keys.js";
import { getEnv } from "../../infrastructure/config/env.js";
import type { AuthenticatedRequest } from "../auth/auth.types.js";

export type SubscriptionLifecycleOperation = "checkout" | "cancel";
export type SubscriptionRateLimitScope = "user" | "source";

export interface SubscriptionRateLimitPolicy {
  userMax: number;
  sourceMax: number;
  windowSec: number;
}

export const SUBSCRIPTION_RATE_LIMIT_POLICIES: Record<
  SubscriptionLifecycleOperation,
  SubscriptionRateLimitPolicy
> = {
  checkout: {
    userMax: 10,
    sourceMax: 30,
    windowSec: 60,
  },
  cancel: {
    userMax: 10,
    sourceMax: 30,
    windowSec: 60,
  },
};

const FEATURE_NAME = "subscription-rl";
const FEATURE_VERSION = "v1";

/**
 * Computes an HMAC-SHA256 digest of raw identifiers (userId or IP).
 * Ensures raw identities and IPs never leak into Redis keys or logs.
 */
export function computeSubscriptionIdentifierDigest(
  rawIdentifier: string,
  secret: string,
): string {
  return crypto
    .createHmac("sha256", secret)
    .update(rawIdentifier.toLowerCase().trim())
    .digest("hex");
}

/**
 * Builds a canonical, namespaced, TTL-bound Redis key for subscription lifecycle rate limiting:
 * Pattern: aura:{env}:subscription-rl:v1:{operation}:{scope}:{hmacIdentifier}
 */
export function buildSubscriptionRateLimitKey(params: {
  operation: SubscriptionLifecycleOperation;
  scope: SubscriptionRateLimitScope;
  rawIdentifier: string;
  secret: string;
  env?: string;
}): string {
  const hmacIdentifier = computeSubscriptionIdentifierDigest(
    params.rawIdentifier,
    params.secret,
  );

  const key = buildStandardRedisKey({
    app: "aura",
    env: params.env,
    feature: FEATURE_NAME,
    version: FEATURE_VERSION,
    scope: `${params.operation}:${params.scope}`,
    identifier: hmacIdentifier,
  });

  const safety = validateRedisKeySafety(key);
  if (!safety.safe) {
    throw new Error(`[SECURITY_ALERT] Unsafe Redis key generated: ${safety.reason}`);
  }

  return key;
}

export interface SubscriptionRateLimitOptions {
  operation: SubscriptionLifecycleOperation;
  userMax?: number;
  sourceMax?: number;
  windowSec?: number;
  enabled?: boolean;
  trustProxy?: boolean;
  keySecret?: string;
  store?: IRateLimitStore;
}

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

function resolveClientSource(req: Request, trustProxy: boolean): string {
  if (trustProxy) {
    const xff = req.headers["x-forwarded-for"];
    if (typeof xff === "string" && xff.length > 0) {
      const parts = xff.split(",").map((s) => s.trim()).filter(Boolean);
      const rightmost = parts[parts.length - 1];
      if (rightmost) return rightmost;
    }
  }
  return req.socket?.remoteAddress ?? "127.0.0.1";
}

/**
 * Creates rate-limiting middleware for subscription lifecycle commands.
 * Enforces:
 * - Independent user and source rate limits.
 * - Atomic Redis transient counters.
 * - 429 TOO_MANY_REQUESTS with Retry-After header on threshold violation.
 * - Zero database mutation or provider invocation on 429.
 * - Fail-closed 503 SERVICE_UNAVAILABLE on Redis outage before DB mutation.
 */
export function createSubscriptionRateLimiter(options: SubscriptionRateLimitOptions) {
  const policy = SUBSCRIPTION_RATE_LIMIT_POLICIES[options.operation];
  const userMax = options.userMax ?? policy.userMax;
  const sourceMax = options.sourceMax ?? policy.sourceMax;
  const windowSec = options.windowSec ?? policy.windowSec;

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    let isEnabled: boolean;
    if (options.enabled !== undefined) {
      isEnabled = options.enabled;
    } else {
      try {
        const env = getEnv();
        isEnabled = env.AUTH_RATE_LIMIT_ENABLED ?? (env.NODE_ENV !== "test");
      } catch {
        isEnabled = process.env.NODE_ENV !== "test";
      }
    }

    if (!isEnabled) {
      next();
      return;
    }

    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user?.id;
    const requestId = req.id;
    const secret =
      options.keySecret ??
      process.env.AUTH_RATE_LIMIT_KEY_SECRET ??
      "subscription_default_rate_limit_secret_for_dev_test";
    const sourceIp = resolveClientSource(req, options.trustProxy ?? false);

    let store: IRateLimitStore;
    try {
      store = options.store ?? new RateLimitStore(getRedisClient());
    } catch {
      sendServiceUnavailableResponse(res, requestId);
      return;
    }

    try {
      // 1. Check user rate limit (if authenticated)
      if (userId) {
        const userKey = buildSubscriptionRateLimitKey({
          operation: options.operation,
          scope: "user",
          rawIdentifier: userId,
          secret,
        });

        const userCount = await store.increment(userKey, windowSec);
        if (userCount > userMax) {
          const ttl = await store.getCooldownTTL(userKey);
          logger.warn("Subscription rate limit exceeded for user", {
            requestId,
            operation: options.operation,
            scope: "user",
          });
          sendThrottledResponse(res, requestId, ttl > 0 ? ttl : windowSec);
          return;
        }
      }

      // 2. Check source rate limit
      const sourceKey = buildSubscriptionRateLimitKey({
        operation: options.operation,
        scope: "source",
        rawIdentifier: sourceIp,
        secret,
      });

      const sourceCount = await store.increment(sourceKey, windowSec);
      if (sourceCount > sourceMax) {
        const ttl = await store.getCooldownTTL(sourceKey);
        logger.warn("Subscription rate limit exceeded for source", {
          requestId,
          operation: options.operation,
          scope: "source",
        });
        sendThrottledResponse(res, requestId, ttl > 0 ? ttl : windowSec);
        return;
      }

      // Allowed — proceed to controller
      next();
    } catch (err: unknown) {
      if (
        err instanceof RedisUnavailableError ||
        (err as { name?: string })?.name === "RedisUnavailableError"
      ) {
        logger.error("Redis unavailable for subscription rate limiting — fail closed", {
          requestId,
          operation: options.operation,
        });
        sendServiceUnavailableResponse(res, requestId);
        return;
      }

      logger.error("Unexpected error in subscription rate limiter — fail closed", {
        requestId,
        operation: options.operation,
      });
      sendServiceUnavailableResponse(res, requestId);
    }
  };
}
