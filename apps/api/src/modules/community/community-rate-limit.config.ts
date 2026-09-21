import { getEnv } from "../../infrastructure/config/env.js";
import type { EnvConfig } from "@aura/shared";

export type CommunityRateLimitOperation =
  | "post_create"
  | "comment_create"
  | "post_delete"
  | "comment_delete"
  | "post_like_mutation";

export interface CommunityOperationLimit {
  userMax: number;
  sourceMax: number;
  windowSec: number;
}

/**
 * Human-Approved FEAT-045 Rate Limit Policy (AC-018..AC-022):
 * - Window: 10 minutes (600 seconds) for all operations.
 * - Post create: 10/user, 60/source
 * - Comment create: 30/user, 180/source
 * - Post delete: 30/user, 180/source
 * - Comment delete: 60/user, 300/source
 * - Like + unlike combined: 120/user, 600/source
 */
export const COMMUNITY_RATE_LIMIT_POLICIES: Readonly<
  Record<CommunityRateLimitOperation, CommunityOperationLimit>
> = {
  post_create: {
    userMax: 10,
    sourceMax: 60,
    windowSec: 600,
  },
  comment_create: {
    userMax: 30,
    sourceMax: 180,
    windowSec: 600,
  },
  post_delete: {
    userMax: 30,
    sourceMax: 180,
    windowSec: 600,
  },
  comment_delete: {
    userMax: 60,
    sourceMax: 300,
    windowSec: 600,
  },
  post_like_mutation: {
    userMax: 120,
    sourceMax: 600,
    windowSec: 600,
  },
};

/**
 * Validates the dedicated COMMUNITY_RATE_LIMIT_KEY_SECRET (AC-015):
 * - Must be defined and non-empty.
 * - Must be at least 32 characters in length.
 * - Must NOT reuse JWT_SECRET, AUTH_ACCESS_TOKEN_SECRET, AUTH_REFRESH_TOKEN_SECRET,
 *   or AUTH_RATE_LIMIT_KEY_SECRET.
 * - No fallback secret permitted.
 */
export function validateCommunityRateLimitSecret(
  secret?: string,
  env: Partial<EnvConfig> = getEnv(),
): string {
  if (!secret || secret.trim().length === 0) {
    throw new Error(
      "[CONFIG_ERROR] COMMUNITY_RATE_LIMIT_KEY_SECRET is required and must not be empty (no fallback allowed)",
    );
  }

  if (secret.length < 32) {
    throw new Error(
      `[CONFIG_ERROR] COMMUNITY_RATE_LIMIT_KEY_SECRET must be at least 32 characters long (received length ${secret.length})`,
    );
  }

  const forbiddenSecrets: (string | undefined)[] = [
    env.JWT_SECRET,
    env.AUTH_ACCESS_TOKEN_SECRET,
    env.AUTH_REFRESH_TOKEN_SECRET,
    env.AUTH_RATE_LIMIT_KEY_SECRET,
  ].filter(Boolean);

  if (forbiddenSecrets.includes(secret)) {
    throw new Error(
      "[CONFIG_ERROR] COMMUNITY_RATE_LIMIT_KEY_SECRET must not reuse JWT_SECRET, AUTH_ACCESS_TOKEN_SECRET, AUTH_REFRESH_TOKEN_SECRET, or AUTH_RATE_LIMIT_KEY_SECRET",
    );
  }

  return secret;
}

export interface CommunityRateLimitConfig {
  enabled: boolean;
  trustProxy: boolean;
  keySecret: string;
  policies: Record<CommunityRateLimitOperation, CommunityOperationLimit>;
}

export function getCommunityRateLimitConfig(
  env: EnvConfig = getEnv(),
): CommunityRateLimitConfig {
  const isEnabled = env.COMMUNITY_RATE_LIMIT_ENABLED ?? (env.NODE_ENV !== "test");
  const secret = env.COMMUNITY_RATE_LIMIT_KEY_SECRET;

  if (isEnabled) {
    validateCommunityRateLimitSecret(secret, env);
  }

  return {
    enabled: isEnabled,
    trustProxy: env.AUTH_RATE_LIMIT_TRUST_PROXY ?? false,
    keySecret: secret ?? "",
    policies: COMMUNITY_RATE_LIMIT_POLICIES,
  };
}
