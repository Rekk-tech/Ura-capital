import { describe, it, expect, vi, beforeEach } from "vitest";
import { AuditService } from "../../src/modules/auth/audit.service.js";
import type { IAuditRepository } from "../../src/modules/auth/audit.repository.js";
import {
  AUDIT_EVENT_TYPES,
  AUDIT_OUTCOMES,
  AUDIT_REASON_CODES,
  OPERATION_SOURCES,
} from "../../src/modules/auth/audit-event.constants.js";
import type { CreateAuditEventInput, AuditRecord } from "../../src/modules/auth/audit-event.types.js";

describe("FEAT-009 AuditService Behavior & Modes (Unit)", () => {
  let mockRepo: IAuditRepository;
  let auditService: AuditService;

  beforeEach(() => {
    mockRepo = {
      create: vi.fn().mockImplementation(async (data: CreateAuditEventInput): Promise<AuditRecord> => ({
        id: "audit-123",
        userId: data.subjectUserId || data.actorUserId || null,
        eventType: data.eventType,
        outcome: data.outcome,
        actorUserId: data.actorUserId || null,
        subjectUserId: data.subjectUserId || null,
        requestId: data.requestId || null,
        sessionId: data.sessionId || null,
        identityHash: data.identityHash || null,
        ipAddress: null,
        userAgent: data.userAgent || null,
        metadata: data.metadata || null,
        occurredAt: new Date(),
        createdAt: new Date(),
      })),
      findById: vi.fn(),
      findByEventType: vi.fn(),
      findByRequestId: vi.fn(),
      listForTest: vi.fn(),
    };
    auditService = new AuditService(mockRepo);
  });

  it("recordBestEffort catches repository errors, logs operational failure, and does NOT throw", async () => {
    vi.mocked(mockRepo.create).mockRejectedValueOnce(new Error("Database connection lost"));

    await expect(
      auditService.recordBestEffort({
        eventType: AUDIT_EVENT_TYPES.LOGIN_SUCCESS,
        outcome: AUDIT_OUTCOMES.SUCCESS,
        actorUserId: "user-123",
        subjectUserId: "user-123",
        requestId: "req-1",
      }),
    ).resolves.toBeUndefined();
  });

  it("recordCoupled throws repository errors so the database transaction can roll back", async () => {
    vi.mocked(mockRepo.create).mockRejectedValueOnce(new Error("Audit unique constraint or DB failure"));

    await expect(
      auditService.recordCoupled({
        eventType: AUDIT_EVENT_TYPES.REGISTRATION_SUCCESS,
        outcome: AUDIT_OUTCOMES.SUCCESS,
        actorUserId: "user-123",
        subjectUserId: "user-123",
      }),
    ).rejects.toThrow("Audit unique constraint or DB failure");
  });

  it("recordSecurityFirst catches repository errors, logs operational failure, and does NOT throw", async () => {
    vi.mocked(mockRepo.create).mockRejectedValueOnce(new Error("Database timeout on replay audit"));

    await expect(
      auditService.recordSecurityFirst({
        eventType: AUDIT_EVENT_TYPES.REFRESH_REPLAY_DETECTED,
        outcome: AUDIT_OUTCOMES.DETECTED,
        actorUserId: "user-123",
        subjectUserId: "user-123",
        sessionId: "sess-1",
        familyId: "fam-1",
      }),
    ).resolves.toBeUndefined();
  });

  it("recordRegistrationSuccess emits coupled REGISTRATION_SUCCESS with user as actor and subject", async () => {
    const record = await auditService.recordRegistrationSuccess({
      userId: "user-reg-1",
      requestId: "req-reg",
      userAgent: "TestAgent/1.0",
    });

    expect(record.eventType).toBe(AUDIT_EVENT_TYPES.REGISTRATION_SUCCESS);
    expect(record.outcome).toBe(AUDIT_OUTCOMES.SUCCESS);
    expect(record.actorUserId).toBe("user-reg-1");
    expect(record.subjectUserId).toBe("user-reg-1");
  });

  it("recordLoginFailure for unknown user sets actor and subject to null", async () => {
    await auditService.recordLoginFailure({
      reasonCode: AUDIT_REASON_CODES.UNKNOWN_USER,
      userId: null,
      requestId: "req-login-fail",
    });

    expect(mockRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: AUDIT_EVENT_TYPES.LOGIN_FAILURE,
        outcome: AUDIT_OUTCOMES.FAILURE,
        actorUserId: null,
        subjectUserId: null,
        metadata: { reasonCode: "UNKNOWN_USER" },
      }),
    );
  });

  it("recordRoleAssigned emits coupled ROLE_ASSIGNED with operator as actor and target as subject", async () => {
    const record = await auditService.recordRoleAssigned({
      targetUserId: "user-target-1",
      roleCode: "ADMIN",
      operatorUserId: "operator-1",
      operationSource: OPERATION_SOURCES.OPERATOR,
      requestId: "req-role-1",
    });

    expect(record.eventType).toBe(AUDIT_EVENT_TYPES.ROLE_ASSIGNED);
    expect(record.outcome).toBe(AUDIT_OUTCOMES.SUCCESS);
    expect(record.actorUserId).toBe("operator-1");
    expect(record.subjectUserId).toBe("user-target-1");
  });

  it("recordRoleRemoved emits security-first ROLE_REMOVED with operator as actor and target as subject", async () => {
    await auditService.recordRoleRemoved({
      targetUserId: "user-target-1",
      roleCode: "ADMIN",
      operatorUserId: "operator-1",
      operationSource: OPERATION_SOURCES.OPERATOR,
      requestId: "req-role-2",
    });

    expect(mockRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: AUDIT_EVENT_TYPES.ROLE_REMOVED,
        outcome: AUDIT_OUTCOMES.SUCCESS,
        actorUserId: "operator-1",
        subjectUserId: "user-target-1",
      }),
    );
  });

  it("recordAuthorizationDenied emits AUTHORIZATION_DENIED with denied user as actor and subject", async () => {
    await auditService.recordAuthorizationDenied({
      userId: "user-denied-1",
      route: "/admin/ping",
      requiredRole: "ADMIN",
      requestId: "req-authz-1",
    });

    expect(mockRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: AUDIT_EVENT_TYPES.AUTHORIZATION_DENIED,
        outcome: AUDIT_OUTCOMES.DENIED,
        actorUserId: "user-denied-1",
        subjectUserId: "user-denied-1",
        metadata: {
          route: "/admin/ping",
          requiredRole: "ADMIN",
        },
      }),
    );
  });
});
