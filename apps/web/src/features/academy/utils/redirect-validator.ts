/**
 * Redirect safety utilities to prevent open redirects (DEF-021-01).
 * Only internal, relative application paths are allowed.
 */

const TRUSTED_ORIGIN = "http://localhost.localdomain";
// eslint-disable-next-line no-control-regex
const CONTROL_CHARS_REGEX = /[\x00-\x1f\x7f]/;
const SCHEME_REGEX = /^[a-zA-Z][a-zA-Z0-9+.-]*:/;

const ENCODED_SLASH_OR_BACKSLASH_REGEX = /%(2f|5c)/i;
const ENCODED_CONTROL_CHAR_REGEX = /%(0[0-9a-f]|1[0-9a-f]|7f)/i;

/**
 * Checks intermediate string safety against control characters, backslashes,
 * protocol-relative paths, encoded slashes, and protocol schemes.
 */
function isSafePathString(val: string): boolean {
  if (CONTROL_CHARS_REGEX.test(val)) {
    return false;
  }
  if (val.includes("\\")) {
    return false;
  }
  if (val.includes("//")) {
    return false;
  }
  if (!val.startsWith("/")) {
    return false;
  }
  if (ENCODED_SLASH_OR_BACKSLASH_REGEX.test(val)) {
    return false;
  }
  if (ENCODED_CONTROL_CHAR_REGEX.test(val)) {
    return false;
  }
  // Disallow scheme patterns before query/fragment (e.g. /https://evil.com or /javascript:alert(1))
  const pathWithoutLeadingSlash = val.replace(/^\/+/, "");
  if (SCHEME_REGEX.test(pathWithoutLeadingSlash)) {
    return false;
  }
  return true;
}

/**
 * Validates that a string is a safe, internal, relative URL path.
 * Must begin with a single '/', cannot begin with '//' or '/\',
 * cannot contain backslashes, control characters, or protocol schemes.
 * Uses bounded decoding (max 2 rounds) and validates resolution against
 * a synthetic trusted internal origin.
 */
export function isValidInternalRedirect(path: string | null | undefined): boolean {
  if (!path || typeof path !== "string") {
    return false;
  }

  // Reject raw control characters immediately (including \t, \n, \r, \x00)
  if (CONTROL_CHARS_REGEX.test(path)) {
    return false;
  }

  const trimmed = path.trim();
  if (!trimmed) {
    return false;
  }

  // Initial safety check
  if (!isSafePathString(trimmed)) {
    return false;
  }

  // Bounded safe decoding: max 2 rounds
  let normalized = trimmed;
  for (let round = 0; round < 2; round++) {
    if (!normalized.includes("%")) {
      break;
    }

    let decoded: string;
    try {
      decoded = decodeURIComponent(normalized);
    } catch {
      // Malformed percent encoding -> reject immediately
      return false;
    }

    if (decoded === normalized) {
      break;
    }

    normalized = decoded.trim();

    // Re-run all safety checks after each decoding round
    if (!isSafePathString(normalized)) {
      return false;
    }
  }

  // Validate candidate relative to internal trusted origin
  try {
    const resolved = new URL(normalized, TRUSTED_ORIGIN);
    if (resolved.origin !== TRUSTED_ORIGIN) {
      return false;
    }
    // Must remain an application-relative path starting with '/'
    if (!resolved.pathname.startsWith("/")) {
      return false;
    }
  } catch {
    return false;
  }

  return true;
}

/**
 * Builds a secure login/register redirect URL with an encoded return parameter.
 * Falls back to '/academy' if the provided return path fails validation.
 * Validation occurs prior to encoding and URL construction.
 */
export function buildAuthRedirectUrl(authPath: "/login" | "/register", returnPath: string | null | undefined): string {
  const safeReturn = isValidInternalRedirect(returnPath) ? returnPath!.trim() : "/academy";
  return `${authPath}?redirect=${encodeURIComponent(safeReturn)}`;
}

