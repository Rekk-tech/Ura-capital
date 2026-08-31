import { Prisma, type PrismaClient } from "@prisma/client";
import { getPrismaClient } from "../../infrastructure/database/prisma.js";
import type { AuditRecord, CreateAuditEventInput } from "./audit-event.types.js";
import { sanitizeAuditMetadata, sanitizeRequestId, sanitizeUserAgent } from "./audit-event.schema.js";

export interface IAuditRepository {
  create(data: CreateAuditEventInput, tx?: Prisma.TransactionClient | unknown): Promise<AuditRecord>;
  findById(id: string): Promise<AuditRecord | null>;
  findByUserId(userId: string): Promise<AuditRecord[]>;
  findByEventType(eventType: string): Promise<AuditRecord[]>;
  findByRequestId(requestId: string): Promise<AuditRecord[]>;
  listForTest(limit?: number): Promise<AuditRecord[]>;
}

export class PrismaAuditRepository implements IAuditRepository {
  constructor(private readonly prismaClient: PrismaClient | Prisma.TransactionClient = getPrismaClient()) {}

  async create(data: CreateAuditEventInput, tx?: Prisma.TransactionClient | unknown): Promise<AuditRecord> {
    const client = (tx as Prisma.TransactionClient) || this.prismaClient;

    const sanitizedUA = sanitizeUserAgent(data.userAgent);
    const sanitizedReqId = sanitizeRequestId(data.requestId);
    const sanitizedMeta = sanitizeAuditMetadata(data.eventType, data.metadata);

    // Map explicit userId, subject, or actor to userId for foreign key column
    const fallbackUserId = data.userId || data.subjectUserId || data.actorUserId || null;

    const record = await client.authSecurityAuditRecord.create({
      data: {
        eventType: data.eventType,
        outcome: data.outcome,
        actorUserId: data.actorUserId || null,
        subjectUserId: data.subjectUserId || null,
        userId: fallbackUserId,
        requestId: sanitizedReqId,
        sessionId: data.sessionId || null,
        identityHash: data.identityHash || null,
        userAgent: sanitizedUA,
        metadata: sanitizedMeta ? (sanitizedMeta as Prisma.InputJsonValue) : Prisma.JsonNull,
        occurredAt: data.occurredAt || new Date(),
      },
    });

    return {
      id: record.id,
      userId: record.userId,
      eventType: record.eventType,
      outcome: record.outcome,
      actorUserId: record.actorUserId,
      subjectUserId: record.subjectUserId,
      requestId: record.requestId,
      sessionId: record.sessionId,
      identityHash: record.identityHash,
      ipAddress: record.ipAddress,
      userAgent: record.userAgent,
      metadata: record.metadata,
      occurredAt: record.occurredAt,
      createdAt: record.createdAt,
    };
  }

  async findById(id: string): Promise<AuditRecord | null> {
    const record = await this.prismaClient.authSecurityAuditRecord.findUnique({
      where: { id },
    });
    if (!record) return null;
    return {
      id: record.id,
      userId: record.userId,
      eventType: record.eventType,
      outcome: record.outcome,
      actorUserId: record.actorUserId,
      subjectUserId: record.subjectUserId,
      requestId: record.requestId,
      sessionId: record.sessionId,
      identityHash: record.identityHash,
      ipAddress: record.ipAddress,
      userAgent: record.userAgent,
      metadata: record.metadata,
      occurredAt: record.occurredAt,
      createdAt: record.createdAt,
    };
  }

  async findByUserId(userId: string): Promise<AuditRecord[]> {
    const records = await this.prismaClient.authSecurityAuditRecord.findMany({
      where: {
        OR: [
          { userId },
          { actorUserId: userId },
          { subjectUserId: userId },
        ],
      },
      orderBy: { occurredAt: "desc" },
    });
    return records.map((record) => ({
      id: record.id,
      userId: record.userId,
      eventType: record.eventType,
      outcome: record.outcome,
      actorUserId: record.actorUserId,
      subjectUserId: record.subjectUserId,
      requestId: record.requestId,
      sessionId: record.sessionId,
      identityHash: record.identityHash,
      ipAddress: record.ipAddress,
      userAgent: record.userAgent,
      metadata: record.metadata,
      occurredAt: record.occurredAt,
      createdAt: record.createdAt,
    }));
  }

  async findByEventType(eventType: string): Promise<AuditRecord[]> {
    const records = await this.prismaClient.authSecurityAuditRecord.findMany({
      where: { eventType },
      orderBy: { occurredAt: "desc" },
    });
    return records.map((record) => ({
      id: record.id,
      userId: record.userId,
      eventType: record.eventType,
      outcome: record.outcome,
      actorUserId: record.actorUserId,
      subjectUserId: record.subjectUserId,
      requestId: record.requestId,
      sessionId: record.sessionId,
      identityHash: record.identityHash,
      ipAddress: record.ipAddress,
      userAgent: record.userAgent,
      metadata: record.metadata,
      occurredAt: record.occurredAt,
      createdAt: record.createdAt,
    }));
  }

  async findByRequestId(requestId: string): Promise<AuditRecord[]> {
    const records = await this.prismaClient.authSecurityAuditRecord.findMany({
      where: { requestId },
      orderBy: { occurredAt: "desc" },
    });
    return records.map((record) => ({
      id: record.id,
      userId: record.userId,
      eventType: record.eventType,
      outcome: record.outcome,
      actorUserId: record.actorUserId,
      subjectUserId: record.subjectUserId,
      requestId: record.requestId,
      sessionId: record.sessionId,
      identityHash: record.identityHash,
      ipAddress: record.ipAddress,
      userAgent: record.userAgent,
      metadata: record.metadata,
      occurredAt: record.occurredAt,
      createdAt: record.createdAt,
    }));
  }

  async listForTest(limit = 100): Promise<AuditRecord[]> {
    const records = await this.prismaClient.authSecurityAuditRecord.findMany({
      take: limit,
      orderBy: { occurredAt: "desc" },
    });
    return records.map((record) => ({
      id: record.id,
      userId: record.userId,
      eventType: record.eventType,
      outcome: record.outcome,
      actorUserId: record.actorUserId,
      subjectUserId: record.subjectUserId,
      requestId: record.requestId,
      sessionId: record.sessionId,
      identityHash: record.identityHash,
      ipAddress: record.ipAddress,
      userAgent: record.userAgent,
      metadata: record.metadata,
      occurredAt: record.occurredAt,
      createdAt: record.createdAt,
    }));
  }
}

export const auditRepository = new PrismaAuditRepository();
