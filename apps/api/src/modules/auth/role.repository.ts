import { Prisma, type PrismaClient, type Role as PrismaRole, type UserRole as PrismaUserRole } from "@prisma/client";
import { getPrismaClient } from "../../infrastructure/database/prisma.js";

export interface RoleEntity {
  id: string;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserRoleEntity {
  id: string;
  userId: string;
  roleId: string;
  createdAt: Date;
}

export interface IRoleRepository {
  findByName(name: string): Promise<RoleEntity | null>;
  createRole(name: string, description?: string | null): Promise<RoleEntity>;
  ensureRoleExists(name: string, description?: string | null): Promise<RoleEntity>;
  assignRoleToUser(userId: string, roleId: string, tx?: Prisma.TransactionClient): Promise<UserRoleEntity>;
  getUserRoles(userId: string): Promise<RoleEntity[]>;
  getUserRoleCodes(userId: string): Promise<string[]>;
  removeRoleFromUser(userId: string, roleId: string, tx?: Prisma.TransactionClient): Promise<void>;
  countRoles(): Promise<number>;
  countUserRoles(): Promise<number>;
}

function toRoleEntity(role: PrismaRole): RoleEntity {
  return {
    id: role.id,
    name: role.name,
    description: role.description,
    createdAt: role.createdAt,
    updatedAt: role.updatedAt,
  };
}

function toUserRoleEntity(ur: PrismaUserRole): UserRoleEntity {
  return {
    id: ur.id,
    userId: ur.userId,
    roleId: ur.roleId,
    createdAt: ur.createdAt,
  };
}

export class PrismaRoleRepository implements IRoleRepository {
  constructor(private readonly prisma: PrismaClient | Prisma.TransactionClient = getPrismaClient()) {}

  async findByName(name: string): Promise<RoleEntity | null> {
    const role = await this.prisma.role.findUnique({
      where: { name },
    });
    return role ? toRoleEntity(role) : null;
  }

  async createRole(name: string, description?: string | null): Promise<RoleEntity> {
    const role = await this.prisma.role.create({
      data: {
        name,
        description: description ?? null,
      },
    });
    return toRoleEntity(role);
  }

  async ensureRoleExists(name: string, description?: string | null): Promise<RoleEntity> {
    const existing = await this.findByName(name);
    if (existing) {
      return existing;
    }
    return this.createRole(name, description);
  }

  async assignRoleToUser(userId: string, roleId: string, tx?: Prisma.TransactionClient): Promise<UserRoleEntity> {
    const client = tx || this.prisma;
    const userRole = await client.userRole.create({
      data: {
        userId,
        roleId,
      },
    });
    return toUserRoleEntity(userRole);
  }

  async getUserRoles(userId: string): Promise<RoleEntity[]> {
    const userRoles = await this.prisma.userRole.findMany({
      where: { userId },
      include: { role: true },
    });
    return userRoles.map((ur) => toRoleEntity(ur.role));
  }

  async getUserRoleCodes(userId: string): Promise<string[]> {
    const userRoles = await this.prisma.userRole.findMany({
      where: { userId },
      include: {
        role: {
          select: { name: true },
        },
      },
    });
    return userRoles.map((ur) => ur.role.name);
  }

  async removeRoleFromUser(userId: string, roleId: string, tx?: Prisma.TransactionClient): Promise<void> {
    const client = tx || this.prisma;
    await client.userRole.delete({
      where: {
        userId_roleId: {
          userId,
          roleId,
        },
      },
    });
  }

  async countRoles(): Promise<number> {
    return this.prisma.role.count();
  }

  async countUserRoles(): Promise<number> {
    return this.prisma.userRole.count();
  }
}

export const roleRepository: IRoleRepository = new PrismaRoleRepository();
