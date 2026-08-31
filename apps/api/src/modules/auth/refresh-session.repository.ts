import { PrismaClient, type Prisma } from "@prisma/client";
import crypto from "node:crypto";
import { getPrismaClient } from "../../infrastructure/database/prisma.js";

export interface RefreshSessionEntity {
  id: string;
  userId: string;
  tokenHash: string;
  familyId: string;
  replacedBySessionId: string | null;
  rotatedAt: Date | null;
  isRevoked: boolean;
  revokedAt: Date | null;
  revocationReason: string | null;
  reusedAt: Date | null;
  expiresAt: Date;
  userAgent: string | null;
  ipAddress: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export type RefreshSession = RefreshSessionEntity;

export interface CreateRefreshSessionInput {
  userId: string;
  tokenHash: string;
  familyId?: string;
  expiresAt: Date;
  userAgent?: string | null;
  ipAddress?: string | null;
}

export interface IRefreshSessionRepository {
  create(data: CreateRefreshSessionInput, tx?: Prisma.TransactionClient | unknown): Promise<RefreshSessionEntity>;
  findByTokenHash(tokenHash: string, tx?: Prisma.TransactionClient | unknown): Promise<RefreshSessionEntity | null>;
  findById(id: string, tx?: Prisma.TransactionClient | unknown): Promise<RefreshSessionEntity | null>;
  rotateSession(
    currentSessionId: string,
    newSessionInput: CreateRefreshSessionInput,
  ): Promise<{ oldSession: RefreshSessionEntity; newSession: RefreshSessionEntity }>;
  revokeFamily(familyId: string, reason: string, tx?: Prisma.TransactionClient | unknown): Promise<number>;
  revokeSession(sessionId: string, reason: string, tx?: Prisma.TransactionClient | unknown): Promise<RefreshSessionEntity>;
  revoke(sessionId: string, reason?: string, tx?: Prisma.TransactionClient | unknown): Promise<RefreshSessionEntity>;
  revokeAllForUser(userId: string, tx?: Prisma.TransactionClient | unknown): Promise<number>;
  deleteExpired(tx?: Prisma.TransactionClient | unknown): Promise<number>;
  deleteByUserId(userId: string, tx?: Prisma.TransactionClient | unknown): Promise<number>;
}

export class PrismaRefreshSessionRepository implements IRefreshSessionRepository {
  constructor(private readonly prisma: PrismaClient | Prisma.TransactionClient = getPrismaClient()) {}

  async create(data: CreateRefreshSessionInput, tx?: Prisma.TransactionClient): Promise<RefreshSession> {
    const client = tx ?? this.prisma;
    return client.refreshSession.create({
      data: {
        userId: data.userId,
        tokenHash: data.tokenHash,
        familyId: data.familyId ?? crypto.randomUUID(),
        expiresAt: data.expiresAt,
        userAgent: data.userAgent ?? null,
        ipAddress: data.ipAddress ?? null,
      },
    });
  }

  async findByTokenHash(tokenHash: string, tx?: Prisma.TransactionClient): Promise<RefreshSession | null> {
    const client = tx ?? this.prisma;
    return client.refreshSession.findUnique({
      where: { tokenHash },
    });
  }

  async findById(id: string, tx?: Prisma.TransactionClient): Promise<RefreshSession | null> {
    const client = tx ?? this.prisma;
    return client.refreshSession.findUnique({
      where: { id },
    });
  }

  /**
   * Executes atomic rotation of a refresh session inside a PostgreSQL transaction.
   * Uses conditional update to ensure the current session is unrotated, unrevoked, and unexpired.
   * If two concurrent requests race on the same token, only one succeeds and the other throws.
   */
  private async executeRotate(
    tx: PrismaClient | Prisma.TransactionClient,
    currentSessionId: string,
    newSessionInput: CreateRefreshSessionInput,
  ): Promise<{ oldSession: RefreshSession; newSession: RefreshSession }> {
    const now = new Date();

    // 1. Atomic conditional update on current session
    const updateResult = await tx.refreshSession.updateMany({
      where: {
        id: currentSessionId,
        isRevoked: false,
        rotatedAt: null,
        expiresAt: { gt: now },
      },
      data: {
        rotatedAt: now,
        isRevoked: true,
        revokedAt: now,
        revocationReason: "ROTATED",
      },
    });

    if (updateResult.count === 0) {
      throw new Error("CONCURRENT_OR_INVALID_ROTATION");
    }

    // 2. Create replacement session with same familyId
    const newSession = await tx.refreshSession.create({
      data: {
        userId: newSessionInput.userId,
        tokenHash: newSessionInput.tokenHash,
        familyId: newSessionInput.familyId ?? crypto.randomUUID(),
        expiresAt: newSessionInput.expiresAt,
        userAgent: newSessionInput.userAgent ?? null,
        ipAddress: newSessionInput.ipAddress ?? null,
      },
    });

    // 3. Link old session to replacement session
    const oldSession = await tx.refreshSession.update({
      where: { id: currentSessionId },
      data: { replacedBySessionId: newSession.id },
    });

    return { oldSession, newSession };
  }

  async rotateSession(
    currentSessionId: string,
    newSessionInput: CreateRefreshSessionInput,
  ): Promise<{ oldSession: RefreshSession; newSession: RefreshSession }> {
    if ("$transaction" in this.prisma && typeof (this.prisma as PrismaClient).$transaction === "function") {
      return (this.prisma as PrismaClient).$transaction(async (tx) => {
        return this.executeRotate(tx, currentSessionId, newSessionInput);
      });
    }
    return this.executeRotate(this.prisma, currentSessionId, newSessionInput);
  }

  async revokeFamily(familyId: string, reason: string, tx?: Prisma.TransactionClient): Promise<number> {
    const client = tx ?? this.prisma;
    const now = new Date();
    const result = await client.refreshSession.updateMany({
      where: { familyId },
      data: {
        isRevoked: true,
        revokedAt: now,
        revocationReason: reason,
        ...(reason === "REPLAY_DETECTED" ? { reusedAt: now } : {}),
      },
    });
    return result.count;
  }

  async revokeSession(sessionId: string, reason: string, tx?: Prisma.TransactionClient): Promise<RefreshSession> {
    const client = tx ?? this.prisma;
    const now = new Date();
    return client.refreshSession.update({
      where: { id: sessionId },
      data: {
        isRevoked: true,
        revokedAt: now,
        revocationReason: reason,
      },
    });
  }

  async revoke(sessionId: string, reason = "MANUAL", tx?: Prisma.TransactionClient): Promise<RefreshSession> {
    return this.revokeSession(sessionId, reason, tx);
  }

  async revokeAllForUser(userId: string, tx?: Prisma.TransactionClient): Promise<number> {
    const client = tx ?? this.prisma;
    const now = new Date();
    const result = await client.refreshSession.updateMany({
      where: { userId },
      data: {
        isRevoked: true,
        revokedAt: now,
        revocationReason: "USER_REVOKED_ALL",
      },
    });
    return result.count;
  }

  async deleteExpired(tx?: Prisma.TransactionClient): Promise<number> {
    const client = tx ?? this.prisma;
    const result = await client.refreshSession.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });
    return result.count;
  }

  async deleteByUserId(userId: string, tx?: Prisma.TransactionClient): Promise<number> {
    const client = tx ?? this.prisma;
    const result = await client.refreshSession.deleteMany({
      where: { userId },
    });
    return result.count;
  }
}
