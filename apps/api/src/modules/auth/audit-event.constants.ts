/**
 * Canonical Audit Event Types for Aura Capital (FEAT-009).
 * Locked by approved spec; no free-form event strings permitted.
 */
export const AUDIT_EVENT_TYPES = {
  REGISTRATION_SUCCESS: "REGISTRATION_SUCCESS",
  LOGIN_SUCCESS: "LOGIN_SUCCESS",
  LOGIN_FAILURE: "LOGIN_FAILURE",
  REFRESH_SUCCESS: "REFRESH_SUCCESS",
  REFRESH_FAILURE: "REFRESH_FAILURE",
  REFRESH_REPLAY_DETECTED: "REFRESH_REPLAY_DETECTED",
  LOGOUT_SUCCESS: "LOGOUT_SUCCESS",
  AUTHENTICATION_FAILURE: "AUTHENTICATION_FAILURE", // Reserved / deferred in FEAT-009
  AUTHORIZATION_DENIED: "AUTHORIZATION_DENIED",
  ROLE_ASSIGNED: "ROLE_ASSIGNED",
  ROLE_REMOVED: "ROLE_REMOVED",
} as const;

export type AuditEventType = (typeof AUDIT_EVENT_TYPES)[keyof typeof AUDIT_EVENT_TYPES];

export const CANONICAL_AUDIT_EVENT_TYPES = Object.values(AUDIT_EVENT_TYPES) as readonly AuditEventType[];

export function isAuditEventType(value: unknown): value is AuditEventType {
  return typeof value === "string" && CANONICAL_AUDIT_EVENT_TYPES.includes(value as AuditEventType);
}

/**
 * Canonical Audit Outcomes.
 */
export const AUDIT_OUTCOMES = {
  SUCCESS: "SUCCESS",
  FAILURE: "FAILURE",
  DENIED: "DENIED",
  DETECTED: "DETECTED",
} as const;

export type AuditOutcome = (typeof AUDIT_OUTCOMES)[keyof typeof AUDIT_OUTCOMES];

export const CANONICAL_AUDIT_OUTCOMES = Object.values(AUDIT_OUTCOMES) as readonly AuditOutcome[];

export function isAuditOutcome(value: unknown): value is AuditOutcome {
  return typeof value === "string" && CANONICAL_AUDIT_OUTCOMES.includes(value as AuditOutcome);
}

/**
 * Approved Safe Reason Codes for Audit Metadata.
 */
export const AUDIT_REASON_CODES = {
  UNKNOWN_USER: "UNKNOWN_USER",
  BAD_PASSWORD: "BAD_PASSWORD",
  INACTIVE_USER: "INACTIVE_USER",
  MISSING_REFRESH_COOKIE: "MISSING_REFRESH_COOKIE",
  UNKNOWN_REFRESH_SESSION: "UNKNOWN_REFRESH_SESSION",
  EXPIRED_REFRESH_SESSION: "EXPIRED_REFRESH_SESSION",
  REVOKED_REFRESH_SESSION: "REVOKED_REFRESH_SESSION",
  INSUFFICIENT_ROLE: "INSUFFICIENT_ROLE",
} as const;

export type AuditReasonCode = (typeof AUDIT_REASON_CODES)[keyof typeof AUDIT_REASON_CODES];

/**
 * Approved Canonical Operation Sources (Server-Controlled).
 */
export const OPERATION_SOURCES = {
  OPERATOR: "OPERATOR",
  SYSTEM: "SYSTEM",
} as const;

export type OperationSource = (typeof OPERATION_SOURCES)[keyof typeof OPERATION_SOURCES];
