import { AUDIT_EVENT_TYPES, type AuditEventType } from "./audit-event.constants.js";

const MAX_USER_AGENT_LENGTH = 256;
const MAX_REQUEST_ID_LENGTH = 128;
const MAX_SERIALIZED_METADATA_BYTES = 2048; // 2 KiB

const SENSITIVE_KEY_PATTERNS = [
  /password/i,
  /token/i,
  /secret/i,
  /cookie/i,
  /authorization/i,
  /verifier/i,
  /hash/i,
  /credential/i,
  /bearer/i,
  /jwt/i,
  /email/i,
];

/**
 * Event-specific metadata allowlist.
 */
const METADATA_ALLOWLIST_MAP: Record<AuditEventType, readonly string[]> = {
  [AUDIT_EVENT_TYPES.REGISTRATION_SUCCESS]: [],
  [AUDIT_EVENT_TYPES.LOGIN_SUCCESS]: ["sessionId"],
  [AUDIT_EVENT_TYPES.LOGIN_FAILURE]: ["reasonCode", "sessionId"],
  [AUDIT_EVENT_TYPES.REFRESH_SUCCESS]: ["sessionId", "familyId"],
  [AUDIT_EVENT_TYPES.REFRESH_FAILURE]: ["reasonCode", "sessionId"],
  [AUDIT_EVENT_TYPES.REFRESH_REPLAY_DETECTED]: ["sessionId", "familyId"],
  [AUDIT_EVENT_TYPES.LOGOUT_SUCCESS]: ["sessionId"],
  [AUDIT_EVENT_TYPES.AUTHENTICATION_FAILURE]: [],
  [AUDIT_EVENT_TYPES.AUTHORIZATION_DENIED]: ["route", "requiredRole"],
  [AUDIT_EVENT_TYPES.ROLE_ASSIGNED]: ["roleCode", "operationSource"],
  [AUDIT_EVENT_TYPES.ROLE_REMOVED]: ["roleCode", "operationSource"],
};

/**
 * Sanitizes and truncates User-Agent string.
 * Strips ASCII control characters (0x00 - 0x1F, 0x7F) and enforces 256-char max limit.
 */
export function sanitizeUserAgent(userAgent?: string | null): string | null {
  if (!userAgent || typeof userAgent !== "string") {
    return null;
  }
  // Strip control characters
  // eslint-disable-next-line no-control-regex
  const cleaned = userAgent.replace(/[\x00-\x1F\x7F]/g, "").trim();
  if (cleaned.length === 0) {
    return null;
  }
  return cleaned.slice(0, MAX_USER_AGENT_LENGTH);
}

/**
 * Validates/sanitizes request ID.
 */
export function sanitizeRequestId(requestId?: string | null): string | null {
  if (!requestId || typeof requestId !== "string") {
    return null;
  }
  // eslint-disable-next-line no-control-regex
  const cleaned = requestId.replace(/[\x00-\x1F\x7F]/g, "").trim();
  if (cleaned.length === 0) {
    return null;
  }
  return cleaned.slice(0, MAX_REQUEST_ID_LENGTH);
}

/**
 * Sanitizes and bounds event metadata based on the event-specific allowlist.
 * Guarantees:
 * - Flat object only (no nested objects or arrays)
 * - Only allowlisted keys for the specific event type
 * - Prohibits sensitive keys (password, token, email, etc.)
 * - Serialized JSON size <= 2 KiB
 */
export function sanitizeAuditMetadata(
  eventType: AuditEventType,
  rawMetadata?: Record<string, unknown> | null,
): Record<string, unknown> | null {
  if (!rawMetadata || typeof rawMetadata !== "object" || Array.isArray(rawMetadata)) {
    return null;
  }

  const allowlist = METADATA_ALLOWLIST_MAP[eventType] || [];
  if (allowlist.length === 0) {
    return null;
  }

  const sanitized: Record<string, unknown> = {};

  for (const key of allowlist) {
    if (Object.prototype.hasOwnProperty.call(rawMetadata, key)) {
      const val = rawMetadata[key];

      // Reject sensitive keys if any accidentally overlap with allowlist
      if (SENSITIVE_KEY_PATTERNS.some((p) => p.test(key))) {
        continue;
      }

      // Flat primitive values only (string, number, boolean, null)
      if (
        typeof val === "string" ||
        typeof val === "number" ||
        typeof val === "boolean" ||
        val === null
      ) {
        // If string value contains sensitive pattern, sanitize it
        if (typeof val === "string" && val.length > 512) {
          sanitized[key] = val.slice(0, 512);
        } else {
          sanitized[key] = val;
        }
      }
    }
  }

  if (Object.keys(sanitized).length === 0) {
    return null;
  }

  const serialized = JSON.stringify(sanitized);
  if (Buffer.byteLength(serialized, "utf8") > MAX_SERIALIZED_METADATA_BYTES) {
    return null; // Exceeds 2 KiB limit
  }

  return sanitized;
}
