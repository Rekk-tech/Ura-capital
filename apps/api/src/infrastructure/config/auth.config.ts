import { getEnv } from "./env.js";
import type { EnvConfig } from "@aura/shared";

export interface AuthConfig {
  accessTokenSecret: string;
  refreshTokenSecret: string;
  accessTokenTtlMinutes: number;
  accessTokenIssuer: string;
  accessTokenAudience: string;
  refreshTokenTtlDays: number;
  refreshCookie: {
    name: string;
    secure: boolean;
    sameSite: "lax" | "strict" | "none";
    httpOnly: true;
  };
  rateLimit: {
    windowMs: number;
    maxRequests: number;
  };
}

export function getAuthConfig(env: EnvConfig = getEnv()): AuthConfig {
  return {
    accessTokenSecret: env.AUTH_ACCESS_TOKEN_SECRET,
    refreshTokenSecret: env.AUTH_REFRESH_TOKEN_SECRET,
    accessTokenTtlMinutes: env.AUTH_ACCESS_TOKEN_TTL_MINUTES,
    accessTokenIssuer: env.AUTH_ACCESS_TOKEN_ISSUER,
    accessTokenAudience: env.AUTH_ACCESS_TOKEN_AUDIENCE,
    refreshTokenTtlDays: env.AUTH_REFRESH_TOKEN_TTL_DAYS,
    refreshCookie: {
      name: env.AUTH_REFRESH_COOKIE_NAME,
      secure: env.AUTH_REFRESH_COOKIE_SECURE,
      sameSite: env.AUTH_REFRESH_COOKIE_SAME_SITE,
      httpOnly: true, // Always true for server-enforced cookie security
    },
    rateLimit: {
      windowMs: env.AUTH_RATE_LIMIT_WINDOW_MS,
      maxRequests: env.AUTH_RATE_LIMIT_MAX_REQUESTS,
    },
  };
}
