import type { PrismaClient, Prisma, User as PrismaUser } from "@prisma/client";
import { getPrismaClient } from "../../infrastructure/database/prisma.js";

export interface UserEntity {
  id: string;
  email: string;
  displayName: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserInput {
  email: string;
  displayName?: string | null;
  status?: string;
}

export interface IUserRepository {
  findById(id: string): Promise<UserEntity | null>;
  findByEmail(email: string): Promise<UserEntity | null>;
  create(input: CreateUserInput): Promise<UserEntity>;
  update(id: string, input: Partial<CreateUserInput>): Promise<UserEntity>;
  delete(id: string): Promise<void>;
}

function toUserEntity(user: PrismaUser): UserEntity {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    status: user.status,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export class PrismaUserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaClient | Prisma.TransactionClient = getPrismaClient()) {}

  async findById(id: string): Promise<UserEntity | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });
    return user ? toUserEntity(user) : null;
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });
    return user ? toUserEntity(user) : null;
  }

  async create(input: CreateUserInput): Promise<UserEntity> {
    const normalizedEmail = input.email.trim().toLowerCase();
    const user = await this.prisma.user.create({
      data: {
        email: normalizedEmail,
        displayName: input.displayName ?? null,
        status: input.status ?? "ACTIVE",
      },
    });
    return toUserEntity(user);
  }

  async update(id: string, input: Partial<CreateUserInput>): Promise<UserEntity> {
    const data: { email?: string; displayName?: string | null; status?: string } = {};
    if (input.email !== undefined) {
      data.email = input.email.trim().toLowerCase();
    }
    if (input.displayName !== undefined) {
      data.displayName = input.displayName;
    }
    if (input.status !== undefined) {
      data.status = input.status;
    }

    const user = await this.prisma.user.update({
      where: { id },
      data,
    });
    return toUserEntity(user);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.user.delete({
      where: { id },
    });
  }
}

export const userRepository: IUserRepository = new PrismaUserRepository();
