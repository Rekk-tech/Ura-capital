import crypto from "node:crypto";
import { getEnv } from "../config/env.js";

/**
 * Standard Redis Key parameters according to FEAT-015:
 * Pattern: {app}:{env}:{feature}:{version}:{scope}:{identifier}
 */
export interface RedisKeyParams {
  app?: string;
  env?: string;
  feature: string;
  version: string;
  scope: string;
  identifier?: string;
}

/**
 * Builds a standardized, versioned, namespaced Redis key.
 * Pattern: {app}:{env}:{feature}:{version}:{scope}:{digest-or-id}
 *
 * In test environment, automatically incorporates worker/run isolation if configured.
 *
 * @example
 * buildStandardRedisKey({ feature: "rl", version: "v1", scope: "login:source", identifier: "127.0.0.1" })
 * // => "aura:development:rl:v1:login:source:127.0.0.1"
 */
export function buildStandardRedisKey(params: RedisKeyParams): string {
  let env = params.env;
  if (!env) {
    try {
      env = getEnv().NODE_ENV;
    } catch {
      env = process.env.NODE_ENV || "development";
    }

    if (env === "test" && (process.env.TEST_RUN_ID || process.env.VITEST_POOL_ID || process.env.TEST_REDIS_NAMESPACE)) {
      const runId = process.env.TEST_RUN_ID || "run0";
      const workerId = process.env.VITEST_POOL_ID || String(process.pid) || "w0";
      env = process.env.TEST_REDIS_NAMESPACE || `test:${runId}:${workerId}`;
    }
  }

  const app = params.app || "aura";
  const segments = [app, env, params.feature, params.version, params.scope];
  if (params.identifier !== undefined && params.identifier !== "") {
    segments.push(params.identifier);
  }

  return segments.join(":");
}

/**
 * Builds an isolated prefix for tests / CI workers.
 * Pattern: aura:test:{runId}:{workerId}:{feature}:{version}:
 */
export function buildTestIsolatedRedisPrefix(options: {
  runId?: string;
  workerId?: string;
  feature?: string;
  version?: string;
} = {}): string {
  const runId = options.runId || process.env.TEST_RUN_ID || "run0";
  const workerId = options.workerId || process.env.VITEST_POOL_ID || String(process.pid) || "w0";
  const feature = options.feature || "rl";
  const version = options.version || "v1";

  return `aura:test:${runId}:${workerId}:${feature}:${version}:`;
}

/**
 * Sensitive patterns that MUST NOT appear in Redis keys.
 */
const SENSITIVE_KEY_PATTERNS = [
  /@/i, // Raw email address
  /bearer\s+/i, // Authorization header
  /eyj[a-z0-9_-]+\.[a-z0-9_-]+/i, // JWT token
  /postgres(?:ql)?:\/\//i, // PostgreSQL URL
  /redis:\/\//i, // Redis URL
  /password/i, // Password text
  /secret/i, // Secrets
  /cookie=/i, // Cookie strings
  /aura_refresh_token=/i, // Raw refresh cookie value
  /[a-z]:\\[^\s]+/i, // Windows absolute path
  /(?:\/home|\/Users|\/var|\/tmp)\/[^\s]+/i, // POSIX absolute paths
];

/**
 * Validates that a Redis key does not contain raw sensitive information (PII, tokens, secrets, URLs, paths).
 */
export function validateRedisKeySafety(key: string): { safe: boolean; reason?: string } {
  for (const pattern of SENSITIVE_KEY_PATTERNS) {
    if (pattern.test(key)) {
      return {
        safe: false,
        reason: `Redis key contains prohibited sensitive pattern: ${pattern.toString()}`,
      };
    }
  }

  return { safe: true };
}

/**
 * Computes a keyed HMAC-SHA256 digest for an identity identifier (e.g. email).
 * Never stores raw emails or credentials in keys.
 */
export function computeKeyDigest(rawInput: string, secret: string): string {
  return crypto
    .createHmac("sha256", secret)
    .update(rawInput.toLowerCase().trim())
    .digest("hex");
}
