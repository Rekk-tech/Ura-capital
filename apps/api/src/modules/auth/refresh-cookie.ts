import type { Request, Response, CookieOptions } from "express";
import { getAuthConfig, type AuthConfig } from "../../infrastructure/config/auth.config.js";

/**
 * Builds the centralized, environment-aware cookie configuration for refresh tokens.
 * Compatible with exact clearing by FEAT-006 logout.
 */
export function getRefreshCookieOptions(config: AuthConfig = getAuthConfig()): CookieOptions {
  const maxAgeMs = config.refreshTokenTtlDays * 24 * 60 * 60 * 1000;
  return {
    httpOnly: true,
    secure: config.refreshCookie.secure,
    sameSite: config.refreshCookie.sameSite,
    path: "/",
    maxAge: maxAgeMs,
    expires: new Date(Date.now() + maxAgeMs),
  };
}

/**
 * Builds the centralized cookie configuration for clearing/expiring the refresh token cookie.
 * Matches exact identity attributes (name, Path=/, Domain, SameSite, Secure, HttpOnly) as issuance.
 */
export function getClearRefreshCookieOptions(config: AuthConfig = getAuthConfig()): CookieOptions {
  return {
    httpOnly: true,
    secure: config.refreshCookie.secure,
    sameSite: config.refreshCookie.sameSite,
    path: "/",
    maxAge: 0,
    expires: new Date(0),
  };
}

/**
 * Sets the HttpOnly refresh token cookie on the outgoing response.
 */
export function setRefreshCookie(
  res: Response,
  rawToken: string,
  config: AuthConfig = getAuthConfig(),
): void {
  const cookieName = config.refreshCookie.name;
  const options = getRefreshCookieOptions(config);
  res.cookie(cookieName, rawToken, options);
}

/**
 * Clears the HttpOnly refresh token cookie on the outgoing response using matching identity attributes.
 */
export function clearRefreshCookie(
  res: Response,
  config: AuthConfig = getAuthConfig(),
): void {
  const cookieName = config.refreshCookie.name;
  const options = getClearRefreshCookieOptions(config);
  res.clearCookie(cookieName, options);
}

/**
 * Safely extracts the raw refresh token from request cookies or raw Cookie header.
 */
export function extractRefreshToken(
  req: Request,
  config: AuthConfig = getAuthConfig(),
): string | undefined {
  const cookieName = config.refreshCookie.name;

  // 1. Read from parsed cookies (if cookie-parser is active)
  if (req.cookies && typeof req.cookies === "object" && typeof req.cookies[cookieName] === "string") {
    const val = req.cookies[cookieName].trim();
    return val.length > 0 ? val : undefined;
  }

  // 2. Fallback parse from raw Cookie header
  const rawCookieHeader = req.headers.cookie;
  if (!rawCookieHeader) {
    return undefined;
  }

  const cookies = rawCookieHeader.split(";");
  for (const cookie of cookies) {
    const [name, ...rest] = cookie.trim().split("=");
    if (name === cookieName) {
      const val = decodeURIComponent(rest.join("=")).trim();
      return val.length > 0 ? val : undefined;
    }
  }

  return undefined;
}
