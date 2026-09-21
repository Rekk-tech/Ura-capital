import crypto from "node:crypto";
import type { Request } from "express";
import {
  buildStandardRedisKey,
  validateRedisKeySafety,
} from "../../infrastructure/redis/redis-keys.js";
import type { CommunityRateLimitOperation } from "./community-rate-limit.config.js";

const FEATURE_NAME = "community-rl";
const FEATURE_VERSION = "v1";

export type CommunityRateLimitScope = "user" | "source";

/**
 * Computes the HMAC-SHA256 digest of an identifier (userId or normalized IP).
 * Uses the dedicated COMMUNITY_RATE_LIMIT_KEY_SECRET.
 * Output is a 64-character hex digest — never raw identifier or PII.
 */
export function computeCommunityIdentifierDigest(
  rawIdentifier: string,
  secret: string,
): string {
  return crypto
    .createHmac("sha256", secret)
    .update(rawIdentifier.toLowerCase().trim())
    .digest("hex");
}

/**
 * Resolves the client source IP from the request.
 * - When trustProxy is false: uses direct remoteAddress (spoofed X-Forwarded-For ignored).
 * - When trustProxy is true: extracts rightmost IP from X-Forwarded-For (trusted reverse proxy entry),
 *   falling back to remoteAddress.
 */
export function resolveCommunitySource(req: Request, trustProxy: boolean): string {
  if (trustProxy) {
    const xff = req.headers["x-forwarded-for"];
    if (typeof xff === "string" && xff.length > 0) {
      const parts = xff.split(",").map((s) => s.trim()).filter(Boolean);
      const rightmost = parts[parts.length - 1];
      if (rightmost) {
        return rightmost;
      }
    }
  }

  return req.socket.remoteAddress ?? "127.0.0.1";
}

/**
 * Builds a canonical, versioned, namespaced Redis rate-limit key (AC-016, AC-017):
 * Pattern: aura:{env}:community-rl:v1:{operation}:{scope}:{hmacIdentifier}
 *
 * In test environments, automatically incorporates run/worker isolation (e.g. aura:test:run0:w0:...)
 */
export function buildCommunityRateLimitKey(params: {
  operation: CommunityRateLimitOperation;
  scope: CommunityRateLimitScope;
  rawIdentifier: string;
  secret: string;
  env?: string;
}): string {
  const hmacIdentifier = computeCommunityIdentifierDigest(params.rawIdentifier, params.secret);

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
