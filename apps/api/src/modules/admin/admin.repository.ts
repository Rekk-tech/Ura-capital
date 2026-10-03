import type { PrismaClient } from "@prisma/client";
import { getPrismaClient } from "../../infrastructure/database/prisma.js";

export interface AdminUserRecord {
  id: string;
  email: string;
  displayName: string | null;
  status: "ACTIVE" | "SUSPENDED";
  role: "LEARNER" | "ADMIN";
  createdAt: Date;
  updatedAt: Date;
}

export interface IAdminRepository {
  findUserById(userId: string): Promise<AdminUserRecord | null>;
  updateUserStatus(userId: string, status: "ACTIVE" | "SUSPENDED"): Promise<AdminUserRecord>;
  findRoleByName(name: string): Promise<{ id: string; name: string } | null>;
  setUserRole(userId: string, roleId: string): Promise<void>;
  findSimulationSessionById(sessionId: string): Promise<{ id: string; status: string } | null>;
  cancelSimulationSession(sessionId: string): Promise<{ id: string }>;
  getOperationalMetrics(): Promise<{ totalUsers: number; activeSimulationSessions: number }>;
  listUsers(params: {
    search?: string;
    status?: string;
    role?: string;
    skip: number;
    take: number;
  }): Promise<{ users: AdminUserRecord[]; total: number }>;
}

export class PrismaAdminRepository implements IAdminRepository {
  constructor(private readonly prisma: PrismaClient = getPrismaClient()) {}

  async findUserById(userId: string): Promise<AdminUserRecord | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        userRoles: {
          include: { role: true },
        },
      },
    });

    if (!user) return null;

    const isAdmin = user.userRoles.some((ur) => ur.role?.name === "ADMIN");
    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      status: user.status as "ACTIVE" | "SUSPENDED",
      role: isAdmin ? "ADMIN" : "LEARNER",
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async updateUserStatus(userId: string, status: "ACTIVE" | "SUSPENDED"): Promise<AdminUserRecord> {
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { status },
      include: {
        userRoles: {
          include: { role: true },
        },
      },
    });

    const isAdmin = updated.userRoles.some((ur) => ur.role?.name === "ADMIN");
    return {
      id: updated.id,
      email: updated.email,
      displayName: updated.displayName,
      status: updated.status as "ACTIVE" | "SUSPENDED",
      role: isAdmin ? "ADMIN" : "LEARNER",
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
  }

  async findRoleByName(name: string): Promise<{ id: string; name: string } | null> {
    const role = await this.prisma.role.findUnique({
      where: { name },
    });
    return role ? { id: role.id, name: role.name } : null;
  }

  async setUserRole(userId: string, roleId: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.userRole.deleteMany({
        where: { userId },
      });
      await tx.userRole.create({
        data: {
          userId,
          roleId,
        },
      });
    });
  }

  async findSimulationSessionById(sessionId: string): Promise<{ id: string; status: string } | null> {
    const session = await this.prisma.simulationSession.findUnique({
      where: { id: sessionId },
    });
    return session ? { id: session.id, status: session.status } : null;
  }

  async cancelSimulationSession(sessionId: string): Promise<{ id: string }> {
    const updated = await this.prisma.simulationSession.update({
      where: { id: sessionId },
      data: {
        status: "CANCELLED",
        cancelledAt: new Date(),
      },
    });
    return { id: updated.id };
  }

  async getOperationalMetrics(): Promise<{ totalUsers: number; activeSimulationSessions: number }> {
    const [totalUsers, activeSimulationSessions] = await Promise.all([
      this.prisma.user.count().catch(() => 0),
      this.prisma.simulationSession.count({ where: { status: "ACTIVE" } }).catch(() => 0),
    ]);
    return { totalUsers, activeSimulationSessions };
  }

  async listUsers(params: {
    search?: string;
    status?: string;
    role?: string;
    skip: number;
    take: number;
  }): Promise<{ users: AdminUserRecord[]; total: number }> {
    const where: Record<string, unknown> = {};
    if (params.status && params.status !== "ALL") {
      where.status = params.status;
    }
    if (params.search) {
      where.OR = [
        { email: { contains: params.search, mode: "insensitive" } },
        { displayName: { contains: params.search, mode: "insensitive" } },
      ];
    }
    if (params.role && params.role !== "ALL") {
      where.userRoles = {
        some: {
          role: {
            name: params.role,
          },
        },
      };
    }

    const [rawUsers, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        include: {
          userRoles: {
            include: { role: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: params.skip,
        take: params.take,
      }),
      this.prisma.user.count({ where }),
    ]);

    const users: AdminUserRecord[] = rawUsers.map((u) => ({
      id: u.id,
      email: u.email,
      displayName: u.displayName,
      status: u.status as "ACTIVE" | "SUSPENDED",
      role: u.userRoles.some((ur) => ur.role?.name === "ADMIN") ? "ADMIN" : "LEARNER",
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
    }));

    return { users, total };
  }
}

export const adminRepository = new PrismaAdminRepository();
