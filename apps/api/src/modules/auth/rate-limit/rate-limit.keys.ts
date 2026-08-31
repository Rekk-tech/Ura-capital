import crypto from "node:crypto";
import type { Request } from "express";
import { buildStandardRedisKey } from "../../../infrastructure/redis/redis-keys.js";

/**
 * Key namespace feature and version for FEAT-010A / FEAT-015.
 */
const FEATURE_NAME = "rl";
const FEATURE_VERSION = "v1";

/**
 * Rate-limit key scopes.
 */
export const KEY_SCOPES = {
  SOURCE: "source",
  IDENTITY_SOURCE: "id_src",
  COOLDOWN: "cd",
  ESCALATION: "esc",
  MALFORMED: "malformed",
} as const;

/**
 * Rate-limit endpoint categories.
 */
export const KEY_ENDPOINTS = {
  LOGIN: "login",
  REGISTER: "register",
  REFRESH: "refresh",
} as const;

/**
 * Build a rate-limit key matching approved FEAT-015 namespace:
 * Pattern: aura:{environment}:rl:v1:{endpoint}:{scope}:{identifier}
 *
 * @param endpoint - login, register, or refresh
 * @param scope - source, id_src, cd, esc, malformed
 * @param identifier - HMAC digest or source IP (never raw PII)
 * @param env - optional environment override (defaults to NODE_ENV || "development")
 */
export function buildRateLimitKey(
  endpoint: string,
  scope: string,
  identifier: string,
  env?: string,
): string {
  return buildStandardRedisKey({
    app: "aura",
    env,
    feature: FEATURE_NAME,
    version: FEATURE_VERSION,
    scope: `${endpoint}:${scope}`,
    identifier,
  });
}

/**
 * Compute HMAC-SHA256 digest of a normalized identity.
 * Uses a dedicated rate-limit secret (never JWT/auth secrets).
 * Output is a hex string — no raw email in the key.
 *
 * @param normalizedEmail - lowercased, trimmed email
 * @param secret - AUTH_RATE_LIMIT_KEY_SECRET
 */
export function computeIdentityDigest(normalizedEmail: string, secret: string): string {
  return crypto
    .createHmac("sha256", secret)
    .update(normalizedEmail.toLowerCase().trim())
    .digest("hex");
}

/**
 * Resolve the source IP from a request.
 *
 * Default (trustProxy=false): uses `req.socket.remoteAddress` directly.
 * Spoofed X-Forwarded-For headers are ignored.
 *
 * When trustProxy=true: uses the rightmost entry in X-Forwarded-For
 * (the one set by the closest trusted proxy), falling back to remoteAddress.
 *
 * @returns IP string for rate-limit key
 */
export function resolveSource(req: Request, trustProxy: boolean): string {
  if (trustProxy) {
    const xff = req.headers["x-forwarded-for"];
    if (typeof xff === "string" && xff.length > 0) {
      // Use rightmost IP — the one appended by the trusted reverse proxy
      const parts = xff.split(",").map((s) => s.trim()).filter(Boolean);
      const rightmost = parts[parts.length - 1];
      if (rightmost) {
        return rightmost;
      }
    }
  }

  // Default: direct connection remote address
  return req.socket.remoteAddress ?? "unknown";
}

/**
 * Combine source + identity digest for identity-aware keys.
 */
export function buildIdentitySourceKey(source: string, identityDigest: string): string {
  return `${source}:${identityDigest}`;
}
