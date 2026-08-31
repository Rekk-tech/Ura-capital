import type { PrismaClient, Prisma, Credential as PrismaCredential } from "@prisma/client";
import { getPrismaClient } from "../../infrastructure/database/prisma.js";

export interface CredentialEntity {
  id: string;
  userId: string;
  type: string;
  passwordHash: string;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCredentialInput {
  userId: string;
  passwordHash: string;
  type?: string;
  version?: number;
}

export interface ICredentialRepository {
  findByUserId(userId: string): Promise<CredentialEntity | null>;
  create(input: CreateCredentialInput): Promise<CredentialEntity>;
  updatePasswordHash(userId: string, passwordHash: string, version?: number): Promise<CredentialEntity>;
  deleteByUserId(userId: string): Promise<void>;
}

function toCredentialEntity(cred: PrismaCredential): CredentialEntity {
  return {
    id: cred.id,
    userId: cred.userId,
    type: cred.type,
    passwordHash: cred.passwordHash,
    version: cred.version,
    createdAt: cred.createdAt,
    updatedAt: cred.updatedAt,
  };
}

export class PrismaCredentialRepository implements ICredentialRepository {
  constructor(private readonly prisma: PrismaClient | Prisma.TransactionClient = getPrismaClient()) {}

  async findByUserId(userId: string): Promise<CredentialEntity | null> {
    const cred = await this.prisma.credential.findUnique({
      where: { userId },
    });
    return cred ? toCredentialEntity(cred) : null;
  }

  async create(input: CreateCredentialInput): Promise<CredentialEntity> {
    const cred = await this.prisma.credential.create({
      data: {
        userId: input.userId,
        passwordHash: input.passwordHash,
        type: input.type ?? "PASSWORD",
        version: input.version ?? 1,
      },
    });
    return toCredentialEntity(cred);
  }

  async updatePasswordHash(userId: string, passwordHash: string, version: number = 1): Promise<CredentialEntity> {
    const cred = await this.prisma.credential.update({
      where: { userId },
      data: {
        passwordHash,
        version,
      },
    });
    return toCredentialEntity(cred);
  }

  async deleteByUserId(userId: string): Promise<void> {
    await this.prisma.credential.delete({
      where: { userId },
    });
  }
}
