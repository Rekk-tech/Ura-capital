import type { PrismaClient } from "@prisma/client";
import { getPrismaClient } from "../../infrastructure/database/prisma.js";

/**
 * Health probe repository interface for persistence layer connectivity verification.
 * Follows strict architectural boundary: SQL execution and client handling are isolated
 * within repository layer.
 */
export interface IHealthRepository {
  pingDatabase(): Promise<boolean>;
}

export class PrismaHealthRepository implements IHealthRepository {
  private readonly client: PrismaClient;

  constructor(client?: PrismaClient) {
    this.client = client ?? getPrismaClient();
  }

  async pingDatabase(): Promise<boolean> {
    await this.client.$queryRawUnsafe("SELECT 1");
    return true;
  }
}
