/**
 * FEAT-071: Safe Internal Return Destination Validator (FR-006, AC-006)
 *
 * Validates post-authentication redirect destinations to prevent open redirect vulnerabilities.
 * Strictly permits only same-application relative paths (starting with a single "/").
 * Rejects:
 * - External URLs with protocols (http:, https:, ftp:, etc.)
 * - Protocol-relative URLs (//evil.com)
 * - Dangerous pseudo-protocols (javascript:, data:, vbscript:)
 * - Backslash-based bypasses (\evil.com, /\evil.com)
 * - Control characters, whitespace, newlines (CRLF injection)
 */

export function getSafeReturnUrl(
  returnTo: string | null | undefined,
  defaultUrl = "/"
): string {
  if (!returnTo || typeof returnTo !== "string") {
    return defaultUrl;
  }

  const trimmed = returnTo.trim();

  // Reject empty string
  if (trimmed.length === 0) {
    return defaultUrl;
  }

  // Reject control characters or newlines
  if (/[\r\n\t\0]/.test(trimmed)) {
    return defaultUrl;
  }

  // Must start with exactly one forward slash, not two
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) {
    return defaultUrl;
  }

  // Reject backslashes anywhere in path (some browsers treat \ as /)
  if (trimmed.includes("\\")) {
    return defaultUrl;
  }

  // Reject dangerous schemes if present before slash (e.g., javascript:/...)
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed)) {
    return defaultUrl;
  }

  // Ensure it's a valid relative URI
  try {
    const parsed = new URL(trimmed, "http://localhost");
    // Path must start with single slash and host must remain localhost
    if (parsed.host !== "localhost") {
      return defaultUrl;
    }
    // Return the safe pathname + search + hash
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return defaultUrl;
  }
}
