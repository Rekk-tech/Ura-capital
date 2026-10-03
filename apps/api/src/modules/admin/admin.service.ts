import type { PrismaClient } from "@prisma/client";
import { getPrismaClient } from "../../infrastructure/database/prisma.js";
import { AppError } from "../../shared/errors/error-envelope.js";
import { HTTP_STATUS, ERROR_CODES, type ErrorCode } from "@aura/shared";

export class AdminService {
  private readonly client?: PrismaClient;

  constructor(prisma?: PrismaClient) {
    this.client = prisma;
  }

  private get prisma(): PrismaClient {
    return this.client ?? getPrismaClient();
  }

  /**
   * Updates user status (ACTIVE / SUSPENDED)
   * Dual-layer Self-Protection Guard: Rejects any attempt where actorId === targetUserId
   * with error CANNOT_SUSPEND_SELF.
   */
  async updateUserStatus(
    actorId: string,
    targetUserId: string,
    status: "ACTIVE" | "SUSPENDED",
    reason?: string,
  ) {
    if (status === "SUSPENDED" && actorId === targetUserId) {
      throw new AppError(
        "Administrators cannot suspend their own account.",
        "CANNOT_SUSPEND_SELF" as unknown as ErrorCode,
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!existingUser) {
      throw new AppError(
        "Target user not found.",
        ERROR_CODES.NOT_FOUND,
        HTTP_STATUS.NOT_FOUND,
      );
    }

    const updated = await this.prisma.user.update({
      where: { id: targetUserId },
      data: { status },
    });

    return {
      success: true,
      user: {
        id: updated.id,
        email: updated.email,
        displayName: updated.displayName,
        status: updated.status,
        createdAt: updated.createdAt.toISOString(),
      },
      reason,
    };
  }

  /**
   * Updates user role between LEARNER and ADMIN.
   * Dual-layer Self-Demotion Guard: Rejects any attempt where actorId === targetUserId
   * from removing their own ADMIN role.
   */
  async updateUserRole(
    actorId: string,
    targetUserId: string,
    roleName: "LEARNER" | "ADMIN",
  ) {
    if (roleName !== "ADMIN" && actorId === targetUserId) {
      throw new AppError(
        "Administrators cannot revoke their own administrator role.",
        "CANNOT_DEMOTE_SELF" as unknown as ErrorCode,
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!existingUser) {
      throw new AppError(
        "Target user not found.",
        ERROR_CODES.NOT_FOUND,
        HTTP_STATUS.NOT_FOUND,
      );
    }

    const targetRole = await this.prisma.role.findUnique({
      where: { name: roleName },
    });

    if (!targetRole) {
      throw new AppError(
        `Role '${roleName}' does not exist.`,
        ERROR_CODES.NOT_FOUND,
        HTTP_STATUS.NOT_FOUND,
      );
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.userRole.deleteMany({
        where: { userId: targetUserId },
      });
      await tx.userRole.create({
        data: {
          userId: targetUserId,
          roleId: targetRole.id,
        },
      });
    });

    return {
      success: true,
      userId: targetUserId,
      role: roleName,
    };
  }

  /**
   * Resets a stalled / broken simulation session.
   */
  async resetSimulationSession(actorId: string, sessionId: string) {
    const session = await this.prisma.simulationSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new AppError(
        "Simulation session not found.",
        ERROR_CODES.NOT_FOUND,
        HTTP_STATUS.NOT_FOUND,
      );
    }

    const updated = await this.prisma.simulationSession.update({
      where: { id: sessionId },
      data: {
        status: "CANCELLED",
        cancelledAt: new Date(),
      },
    });

    return {
      success: true,
      message: `Session ${sessionId} has been reset successfully.`,
      sessionId: updated.id,
      resetBy: actorId,
    };
  }
}

export const adminService = new AdminService();
