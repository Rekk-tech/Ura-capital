import { logger } from "../../infrastructure/logging/logger.js";
import {
  AUDIT_EVENT_TYPES,
  AUDIT_OUTCOMES,
  type AuditReasonCode,
  type OperationSource,
  OPERATION_SOURCES,
} from "./audit-event.constants.js";
import type { AuditRecord, CreateAuditEventInput } from "./audit-event.types.js";
import { auditRepository, type IAuditRepository } from "./audit.repository.js";

export class AuditService {
  constructor(private readonly repository: IAuditRepository = auditRepository) {}

  /**
   * Best-effort audit write.
   * Catches any error, logs a sanitized operational message (no payload, no secrets),
   * and never throws or propagates errors to callers.
   */
  async recordBestEffort(input: CreateAuditEventInput): Promise<void> {
    try {
      await this.repository.create(input);
    } catch {
      logger.error("Best-effort audit record failed", {
        requestId: input.requestId || "unknown",
        eventType: input.eventType,
        failureCategory: "AUDIT_WRITE_FAILED",
      });
    }
  }

  /**
   * Transactionally coupled audit write.
   * Must be called within a database transaction client if available.
   * Throws if write fails so the parent transaction rolls back.
   */
  async recordCoupled(
    input: CreateAuditEventInput,
    tx?: unknown,
  ): Promise<AuditRecord> {
    return this.repository.create(input, tx);
  }

  /**
   * Security-state-first audit write.
   * Ensures security revocation/removal remains committed.
   * If audit persistence fails, logs sanitized operational error and does not throw.
   */
  async recordSecurityFirst(input: CreateAuditEventInput): Promise<void> {
    try {
      await this.repository.create(input);
    } catch {
      logger.error("Security-state-first audit record failed", {
        requestId: input.requestId || "unknown",
        eventType: input.eventType,
        failureCategory: "AUDIT_WRITE_FAILED",
      });
    }
  }

  // --- Specialized Event Helpers ---

  async recordRegistrationSuccess(
    params: {
      userId: string;
      requestId?: string | null;
      userAgent?: string | null;
    },
    tx?: unknown,
  ): Promise<AuditRecord> {
    return this.recordCoupled(
      {
        eventType: AUDIT_EVENT_TYPES.REGISTRATION_SUCCESS,
        outcome: AUDIT_OUTCOMES.SUCCESS,
        actorUserId: params.userId,
        subjectUserId: params.userId,
        requestId: params.requestId,
        userAgent: params.userAgent,
      },
      tx,
    );
  }

  async recordLoginSuccess(params: {
    userId: string;
    sessionId?: string;
    requestId?: string | null;
    userAgent?: string | null;
  }): Promise<void> {
    return this.recordBestEffort({
      eventType: AUDIT_EVENT_TYPES.LOGIN_SUCCESS,
      outcome: AUDIT_OUTCOMES.SUCCESS,
      actorUserId: params.userId,
      subjectUserId: params.userId,
      sessionId: params.sessionId,
      requestId: params.requestId,
      userAgent: params.userAgent,
      metadata: params.sessionId ? { sessionId: params.sessionId } : undefined,
    });
  }

  async recordLoginFailure(params: {
    reasonCode: AuditReasonCode;
    userId?: string | null;
    sessionId?: string;
    requestId?: string | null;
    userAgent?: string | null;
  }): Promise<void> {
    return this.recordBestEffort({
      eventType: AUDIT_EVENT_TYPES.LOGIN_FAILURE,
      outcome: AUDIT_OUTCOMES.FAILURE,
      actorUserId: params.userId || null,
      subjectUserId: params.userId || null,
      sessionId: params.sessionId,
      requestId: params.requestId,
      userAgent: params.userAgent,
      metadata: {
        reasonCode: params.reasonCode,
        ...(params.sessionId ? { sessionId: params.sessionId } : {}),
      },
    });
  }

  async recordRefreshSuccess(params: {
    userId: string;
    sessionId?: string;
    familyId?: string;
    requestId?: string | null;
    userAgent?: string | null;
  }): Promise<void> {
    return this.recordBestEffort({
      eventType: AUDIT_EVENT_TYPES.REFRESH_SUCCESS,
      outcome: AUDIT_OUTCOMES.SUCCESS,
      actorUserId: params.userId,
      subjectUserId: params.userId,
      sessionId: params.sessionId,
      requestId: params.requestId,
      userAgent: params.userAgent,
      metadata: {
        ...(params.sessionId ? { sessionId: params.sessionId } : {}),
        ...(params.familyId ? { familyId: params.familyId } : {}),
      },
    });
  }

  async recordRefreshFailure(params: {
    reasonCode: AuditReasonCode;
    userId?: string | null;
    sessionId?: string;
    requestId?: string | null;
    userAgent?: string | null;
  }): Promise<void> {
    return this.recordBestEffort({
      eventType: AUDIT_EVENT_TYPES.REFRESH_FAILURE,
      outcome: AUDIT_OUTCOMES.FAILURE,
      actorUserId: params.userId || null,
      subjectUserId: params.userId || null,
      sessionId: params.sessionId,
      requestId: params.requestId,
      userAgent: params.userAgent,
      metadata: {
        reasonCode: params.reasonCode,
        ...(params.sessionId ? { sessionId: params.sessionId } : {}),
      },
    });
  }

  async recordRefreshReplayDetected(params: {
    userId?: string | null;
    sessionId?: string;
    familyId?: string;
    requestId?: string | null;
    userAgent?: string | null;
  }): Promise<void> {
    return this.recordSecurityFirst({
      eventType: AUDIT_EVENT_TYPES.REFRESH_REPLAY_DETECTED,
      outcome: AUDIT_OUTCOMES.DETECTED,
      actorUserId: params.userId || null,
      subjectUserId: params.userId || null,
      sessionId: params.sessionId,
      requestId: params.requestId,
      userAgent: params.userAgent,
      metadata: {
        ...(params.sessionId ? { sessionId: params.sessionId } : {}),
        ...(params.familyId ? { familyId: params.familyId } : {}),
      },
    });
  }

  async recordLogoutSuccess(params: {
    userId: string;
    sessionId?: string;
    requestId?: string | null;
    userAgent?: string | null;
  }): Promise<void> {
    return this.recordSecurityFirst({
      eventType: AUDIT_EVENT_TYPES.LOGOUT_SUCCESS,
      outcome: AUDIT_OUTCOMES.SUCCESS,
      actorUserId: params.userId,
      subjectUserId: params.userId,
      sessionId: params.sessionId,
      requestId: params.requestId,
      userAgent: params.userAgent,
      metadata: params.sessionId ? { sessionId: params.sessionId } : undefined,
    });
  }

  async recordAuthorizationDenied(params: {
    userId: string;
    route: string;
    requiredRole: string;
    requestId?: string | null;
    userAgent?: string | null;
  }): Promise<void> {
    return this.recordBestEffort({
      eventType: AUDIT_EVENT_TYPES.AUTHORIZATION_DENIED,
      outcome: AUDIT_OUTCOMES.DENIED,
      actorUserId: params.userId,
      subjectUserId: params.userId,
      requestId: params.requestId,
      userAgent: params.userAgent,
      metadata: {
        route: params.route,
        requiredRole: params.requiredRole,
      },
    });
  }

  async recordRoleAssigned(
    params: {
      targetUserId: string;
      roleCode: string;
      operatorUserId?: string | null;
      operationSource?: OperationSource;
      requestId?: string | null;
      userAgent?: string | null;
    },
    tx?: unknown,
  ): Promise<AuditRecord> {
    return this.recordCoupled(
      {
        eventType: AUDIT_EVENT_TYPES.ROLE_ASSIGNED,
        outcome: AUDIT_OUTCOMES.SUCCESS,
        actorUserId: params.operatorUserId || null,
        subjectUserId: params.targetUserId,
        requestId: params.requestId,
        userAgent: params.userAgent,
        metadata: {
          roleCode: params.roleCode,
          operationSource: params.operationSource || OPERATION_SOURCES.SYSTEM,
        },
      },
      tx,
    );
  }

  async recordRoleRemoved(params: {
    targetUserId: string;
    roleCode: string;
    operatorUserId?: string | null;
    operationSource?: OperationSource;
    requestId?: string | null;
    userAgent?: string | null;
  }): Promise<void> {
    return this.recordSecurityFirst({
      eventType: AUDIT_EVENT_TYPES.ROLE_REMOVED,
      outcome: AUDIT_OUTCOMES.SUCCESS,
      actorUserId: params.operatorUserId || null,
      subjectUserId: params.targetUserId,
      requestId: params.requestId,
      userAgent: params.userAgent,
      metadata: {
        roleCode: params.roleCode,
        operationSource: params.operationSource || OPERATION_SOURCES.SYSTEM,
      },
    });
  }
}

export const auditService = new AuditService();
