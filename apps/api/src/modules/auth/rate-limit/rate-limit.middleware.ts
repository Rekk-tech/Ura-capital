import type { Request, Response, NextFunction } from "express";
import { ERROR_CODES, HTTP_STATUS } from "@aura/shared";
import { createErrorEnvelope } from "../../../shared/errors/error-envelope.js";
import { logger } from "../../../infrastructure/logging/logger.js";
import { getRedisClient } from "../../../infrastructure/redis/redis.js";
import { RateLimitStore, RedisUnavailableError } from "./rate-limit.store.js";
import { getRateLimitConfig, type RateLimitConfig } from "./rate-limit.config.js";
import {
  resolveSource,
  computeIdentityDigest,
} from "./rate-limit.keys.js";
import {
  evaluateLoginPolicy,
  incrementLoginFailure,
  clearLoginFailureCounters,
  evaluateRegisterPolicy,
  evaluateRefreshPolicy,
} from "./rate-limit.policy.js";

/**
 * Send a safe 429 TOO_MANY_REQUESTS response.
 * Never exposes identity, counter values, raw IP, policy internals, tokens, cookies, or secrets.
 */
function sendThrottledResponse(res: Response, requestId: string | undefined, retryAfterSec?: number): void {
  if (retryAfterSec && retryAfterSec > 0) {
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
 * Send a safe 503 SERVICE_UNAVAILABLE response for Redis failures (fail closed).
 * Never exposes Redis URL, key material, or infrastructure details.
 */
function sendServiceUnavailable(res: Response, requestId: string | undefined): void {
  res.status(HTTP_STATUS.SERVICE_UNAVAILABLE).json(
    createErrorEnvelope(
      "Service temporarily unavailable. Please try again later.",
      ERROR_CODES.SERVICE_UNAVAILABLE,
      requestId,
    ),
  );
}

/**
 * Extract normalized email from request body for identity digest.
 * Returns null if body is not parseable or email is not present.
 */
function extractNormalizedEmail(req: Request): string | null {
  if (req.body && typeof req.body === "object" && typeof req.body.email === "string") {
    const email = req.body.email.trim().toLowerCase();
    return email.length > 0 ? email : null;
  }
  return null;
}

/**
 * Creates login rate-limit middleware.
 *
 * Evaluates rate-limit policy BEFORE the login controller executes.
 * On success (200), clears identity failure counters.
 * On failure (401), increments failure counters.
 * On Redis unavailable: fail closed (503).
 */
export function createLoginRateLimiter(configOverride?: RateLimitConfig, storeOverride?: RateLimitStore) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const config = configOverride ?? getRateLimitConfig();

    if (!config.enabled && !configOverride?.enabled) {
      next();
      return;
    }

    const requestId = req.id;
    const source = resolveSource(req, config.trustProxy);
    const email = extractNormalizedEmail(req);
    const identityDigest = email && config.keySecret
      ? computeIdentityDigest(email, config.keySecret)
      : null;

    try {
      const store = storeOverride ?? new RateLimitStore(getRedisClient());
      const result = await evaluateLoginPolicy(source, identityDigest, store, config.login);

      if (!result.allowed) {
        logger.warn("Rate limit exceeded for login", {
          requestId,
          endpoint: "login",
          category: "RATE_LIMITED",
        });
        sendThrottledResponse(res, requestId, result.retryAfterSec);
        return;
      }

      // Listen for response to increment/clear counters based on outcome
      res.on("finish", () => {
        // Best-effort counter management — errors are swallowed
        (async () => {
          try {
            if (res.statusCode === HTTP_STATUS.OK && identityDigest) {
              // Successful login — clear failure counters
              await clearLoginFailureCounters(source, identityDigest, store);
            } else if (res.statusCode === HTTP_STATUS.UNAUTHORIZED) {
              // Failed login — increment failure counters
              await incrementLoginFailure(source, identityDigest, store, config.login);
            }
          } catch {
            // Best-effort — do not propagate counter errors
          }
        })();
      });

      next();
    } catch (err) {
      if (err instanceof RedisUnavailableError) {
        logger.error("Redis unavailable for login rate limiting — fail closed", {
          requestId,
          category: "REDIS_ERROR",
        });
        sendServiceUnavailable(res, requestId);
        return;
      }
      next(err);
    }
  };
}

/**
 * Creates registration rate-limit middleware.
 *
 * Evaluates rate-limit policy BEFORE the registration controller executes.
 * Counters are incremented as part of evaluation (pre-check).
 * On Redis unavailable: fail closed (503).
 */
export function createRegisterRateLimiter(configOverride?: RateLimitConfig, storeOverride?: RateLimitStore) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const config = configOverride ?? getRateLimitConfig();

    if (!config.enabled && !configOverride?.enabled) {
      next();
      return;
    }

    const requestId = req.id;
    const source = resolveSource(req, config.trustProxy);
    const email = extractNormalizedEmail(req);
    const identityDigest = email && config.keySecret
      ? computeIdentityDigest(email, config.keySecret)
      : null;

    try {
      const store = storeOverride ?? new RateLimitStore(getRedisClient());
      const result = await evaluateRegisterPolicy(source, identityDigest, store, config.register);

      if (!result.allowed) {
        logger.warn("Rate limit exceeded for registration", {
          requestId,
          endpoint: "register",
          category: "RATE_LIMITED",
        });
        sendThrottledResponse(res, requestId, result.retryAfterSec);
        return;
      }

      next();
    } catch (err) {
      if (err instanceof RedisUnavailableError) {
        logger.error("Redis unavailable for registration rate limiting — fail closed", {
          requestId,
          category: "REDIS_ERROR",
        });
        sendServiceUnavailable(res, requestId);
        return;
      }
      next(err);
    }
  };
}

/**
 * Creates refresh rate-limit middleware.
 *
 * Evaluates rate-limit policy BEFORE the refresh controller executes.
 * Uses cookie presence bucket (not raw token content) in key.
 * On Redis unavailable: fail closed (503).
 */
export function createRefreshRateLimiter(configOverride?: RateLimitConfig, storeOverride?: RateLimitStore) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const config = configOverride ?? getRateLimitConfig();

    if (!config.enabled && !configOverride?.enabled) {
      next();
      return;
    }

    const requestId = req.id;
    const source = resolveSource(req, config.trustProxy);

    // Check cookie presence without extracting or using the raw token value
    const cookieName = "aura_refresh_token"; // Default cookie name from FEAT-005
    const hasCookie = !!(
      (req.cookies && typeof req.cookies[cookieName] === "string" && req.cookies[cookieName].trim().length > 0) ||
      (req.headers.cookie && req.headers.cookie.includes(cookieName))
    );

    try {
      const store = storeOverride ?? new RateLimitStore(getRedisClient());
      const result = await evaluateRefreshPolicy(source, hasCookie, store, config.refresh);

      if (!result.allowed) {
        logger.warn("Rate limit exceeded for refresh", {
          requestId,
          endpoint: "refresh",
          category: "RATE_LIMITED",
        });
        sendThrottledResponse(res, requestId, result.retryAfterSec);
        return;
      }

      next();
    } catch (err) {
      if (err instanceof RedisUnavailableError) {
        logger.error("Redis unavailable for refresh rate limiting — fail closed", {
          requestId,
          category: "REDIS_ERROR",
        });
        sendServiceUnavailable(res, requestId);
        return;
      }
      next(err);
    }
  };
}
