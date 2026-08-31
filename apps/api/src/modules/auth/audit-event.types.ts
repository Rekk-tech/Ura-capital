import type { AuditEventType, AuditOutcome } from "./audit-event.constants.js";

/**
 * Domain input for creating a durable audit event.
 */
export interface CreateAuditEventInput {
  userId?: string | null;
  eventType: AuditEventType;
  outcome: AuditOutcome;
  actorUserId?: string | null;
  subjectUserId?: string | null;
  requestId?: string | null;
  sessionId?: string | null;
  identityHash?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown> | null;
  occurredAt?: Date;
}

/**
 * Durable audit event record representation.
 */
export interface AuditRecord {
  id: string;
  userId: string | null;
  eventType: string;
  outcome: string;
  actorUserId: string | null;
  subjectUserId: string | null;
  requestId: string | null;
  sessionId: string | null;
  identityHash: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  metadata: unknown;
  occurredAt: Date;
  createdAt: Date;
}
