import { describe, it, expect } from "vitest";
import {
  AUDIT_EVENT_TYPES,
  AUDIT_OUTCOMES,
  AUDIT_REASON_CODES,
  OPERATION_SOURCES,
  isAuditEventType,
  isAuditOutcome,
} from "../../src/modules/auth/audit-event.constants.js";
import {
  sanitizeUserAgent,
  sanitizeRequestId,
  sanitizeAuditMetadata,
} from "../../src/modules/auth/audit-event.schema.js";

describe("FEAT-009 Audit Event Taxonomy & Constants (Unit)", () => {
  it("defines all required canonical event types and rejects non-canonical strings", () => {
    const requiredTypes = [
      "REGISTRATION_SUCCESS",
      "LOGIN_SUCCESS",
      "LOGIN_FAILURE",
      "REFRESH_SUCCESS",
      "REFRESH_FAILURE",
      "REFRESH_REPLAY_DETECTED",
      "LOGOUT_SUCCESS",
      "AUTHENTICATION_FAILURE",
      "AUTHORIZATION_DENIED",
      "ROLE_ASSIGNED",
      "ROLE_REMOVED",
    ];

    for (const eventType of requiredTypes) {
      expect(isAuditEventType(eventType)).toBe(true);
      expect(Object.values(AUDIT_EVENT_TYPES)).toContain(eventType);
    }

    expect(isAuditEventType("CUSTOM_EVENT")).toBe(false);
    expect(isAuditEventType("ADMIN_LOGIN")).toBe(false);
    expect(isAuditEventType("")).toBe(false);
    expect(isAuditEventType(null)).toBe(false);
  });

  it("defines all required canonical outcomes and rejects non-canonical strings", () => {
    const requiredOutcomes = ["SUCCESS", "FAILURE", "DENIED", "DETECTED"];

    for (const outcome of requiredOutcomes) {
      expect(isAuditOutcome(outcome)).toBe(true);
      expect(Object.values(AUDIT_OUTCOMES)).toContain(outcome);
    }

    expect(isAuditOutcome("ERROR")).toBe(false);
    expect(isAuditOutcome("BLOCKED")).toBe(false);
    expect(isAuditOutcome("")).toBe(false);
  });

  it("defines approved safe reason codes and operation sources", () => {
    expect(AUDIT_REASON_CODES.UNKNOWN_USER).toBe("UNKNOWN_USER");
    expect(AUDIT_REASON_CODES.BAD_PASSWORD).toBe("BAD_PASSWORD");
    expect(AUDIT_REASON_CODES.INACTIVE_USER).toBe("INACTIVE_USER");
    expect(AUDIT_REASON_CODES.MISSING_REFRESH_COOKIE).toBe("MISSING_REFRESH_COOKIE");
    expect(AUDIT_REASON_CODES.UNKNOWN_REFRESH_SESSION).toBe("UNKNOWN_REFRESH_SESSION");
    expect(AUDIT_REASON_CODES.EXPIRED_REFRESH_SESSION).toBe("EXPIRED_REFRESH_SESSION");
    expect(AUDIT_REASON_CODES.REVOKED_REFRESH_SESSION).toBe("REVOKED_REFRESH_SESSION");
    expect(AUDIT_REASON_CODES.INSUFFICIENT_ROLE).toBe("INSUFFICIENT_ROLE");

    expect(OPERATION_SOURCES.OPERATOR).toBe("OPERATOR");
    expect(OPERATION_SOURCES.SYSTEM).toBe("SYSTEM");
  });
});

describe("FEAT-009 User-Agent & RequestId Sanitization (Unit)", () => {
  it("sanitizes User-Agent: strips control characters and truncates to 256 characters", () => {
    expect(sanitizeUserAgent(null)).toBeNull();
    expect(sanitizeUserAgent("")).toBeNull();
    expect(sanitizeUserAgent("   ")).toBeNull();

    const normalUA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36";
    expect(sanitizeUserAgent(normalUA)).toBe(normalUA);

    const maliciousUA = "Mozilla/5.0\r\nInjected-Header: evil\x00\x1b[31m";
    const cleanedUA = sanitizeUserAgent(maliciousUA);
    expect(cleanedUA).not.toContain("\r");
    expect(cleanedUA).not.toContain("\n");
    expect(cleanedUA).not.toContain("\x00");
    expect(cleanedUA).toBe("Mozilla/5.0Injected-Header: evil[31m");

    const longUA = "A".repeat(300);
    const truncatedUA = sanitizeUserAgent(longUA);
    expect(truncatedUA).toHaveLength(256);
    expect(truncatedUA).toBe("A".repeat(256));
  });

  it("sanitizes RequestId: trims, strips control characters, and truncates to 128 characters", () => {
    expect(sanitizeRequestId(null)).toBeNull();
    expect(sanitizeRequestId("")).toBeNull();

    const validReqId = "req-12345-abcde";
    expect(sanitizeRequestId(validReqId)).toBe(validReqId);

    const maliciousReqId = "req-123\r\n\x00-evil";
    expect(sanitizeRequestId(maliciousReqId)).toBe("req-123-evil");

    const longReqId = "R".repeat(200);
    expect(sanitizeRequestId(longReqId)).toHaveLength(128);
  });
});

describe("FEAT-009 Metadata Allowlist & Security Bounds (Unit)", () => {
  it("preserves allowlisted keys and strips non-allowlisted keys per event type", () => {
    // LOGIN_SUCCESS only allows sessionId
    const loginSuccessMeta = sanitizeAuditMetadata(AUDIT_EVENT_TYPES.LOGIN_SUCCESS, {
      sessionId: "sess-123",
      email: "user@example.com",
      password: "SecretPassword123!",
      token: "raw-access-token",
    });
    expect(loginSuccessMeta).toEqual({ sessionId: "sess-123" });
    expect(loginSuccessMeta).not.toHaveProperty("email");
    expect(loginSuccessMeta).not.toHaveProperty("password");
    expect(loginSuccessMeta).not.toHaveProperty("token");

    // LOGIN_FAILURE allows reasonCode and sessionId
    const loginFailureMeta = sanitizeAuditMetadata(AUDIT_EVENT_TYPES.LOGIN_FAILURE, {
      reasonCode: AUDIT_REASON_CODES.BAD_PASSWORD,
      sessionId: "sess-456",
      extraData: "arbitrary-payload",
    });
    expect(loginFailureMeta).toEqual({
      reasonCode: "BAD_PASSWORD",
      sessionId: "sess-456",
    });
    expect(loginFailureMeta).not.toHaveProperty("extraData");

    // REGISTRATION_SUCCESS has an empty allowlist
    const regSuccessMeta = sanitizeAuditMetadata(AUDIT_EVENT_TYPES.REGISTRATION_SUCCESS, {
      displayName: "Alice",
      email: "alice@example.com",
    });
    expect(regSuccessMeta).toBeNull();
  });

  it("enforces flat metadata and rejects nested objects or arrays", () => {
    const nestedMeta = sanitizeAuditMetadata(AUDIT_EVENT_TYPES.LOGIN_FAILURE, {
      reasonCode: "BAD_PASSWORD",
      sessionId: { nested: "object" } as unknown as string,
    });
    expect(nestedMeta).toEqual({ reasonCode: "BAD_PASSWORD" });
    expect(nestedMeta).not.toHaveProperty("sessionId");
  });

  it("bounds serialized metadata size to 2 KiB", () => {
    const hugeString = "X".repeat(3000);
    const oversizedMeta = sanitizeAuditMetadata(AUDIT_EVENT_TYPES.LOGIN_FAILURE, {
      reasonCode: hugeString,
    });
    // Truncates string value to <= 512 characters so it remains within bounds
    expect(oversizedMeta).toBeDefined();
    if (oversizedMeta) {
      expect((oversizedMeta.reasonCode as string).length).toBeLessThanOrEqual(512);
      expect(Buffer.byteLength(JSON.stringify(oversizedMeta), "utf8")).toBeLessThanOrEqual(2048);
    }
  });

  it("ROLE_ASSIGNED and ROLE_REMOVED allow roleCode and operationSource", () => {
    const roleAssignedMeta = sanitizeAuditMetadata(AUDIT_EVENT_TYPES.ROLE_ASSIGNED, {
      roleCode: "ADMIN",
      operationSource: "OPERATOR",
      clientSpoofedHeader: "ADMIN",
    });
    expect(roleAssignedMeta).toEqual({
      roleCode: "ADMIN",
      operationSource: "OPERATOR",
    });
    expect(roleAssignedMeta).not.toHaveProperty("clientSpoofedHeader");
  });

  it("AUTHORIZATION_DENIED allows route and requiredRole", () => {
    const authzDeniedMeta = sanitizeAuditMetadata(AUDIT_EVENT_TYPES.AUTHORIZATION_DENIED, {
      route: "/admin/ping",
      requiredRole: "ADMIN",
      queryParam: "admin=true",
    });
    expect(authzDeniedMeta).toEqual({
      route: "/admin/ping",
      requiredRole: "ADMIN",
    });
    expect(authzDeniedMeta).not.toHaveProperty("queryParam");
  });
});
