import { AsyncLocalStorage } from "node:async_hooks";
import crypto from "node:crypto";
import { type PrismaClient, type Prisma } from "@prisma/client";
import { getPrismaClient } from "./prisma.js";
import { type IRepositoryContainer, createRepositoryContainer } from "./repository-factory.js";
import type { TransactionContext } from "./transaction-context.js";
import { NestedTransactionError, mapDatabaseError } from "./error-mapper.js";
import { AppError } from "../../shared/errors/error-envelope.js";

export interface TransactionOptions {
  maxWait?: number;
  timeout?: number;
  isolationLevel?: Prisma.TransactionIsolationLevel;
}

export interface ITransactionRunner {
  run<T>(
    operation: (ctx: TransactionContext) => Promise<T>,
    options?: TransactionOptions,
  ): Promise<T>;
  getActiveContext(): TransactionContext | undefined;
  isInTransaction(): boolean;
}

export type RepositoryFactory = (client: PrismaClient | Prisma.TransactionClient) => IRepositoryContainer;

export class PrismaTransactionRunner implements ITransactionRunner {
  private readonly asyncLocalStorage = new AsyncLocalStorage<TransactionContext>();

  constructor(
    private readonly prisma: PrismaClient = getPrismaClient(),
    private readonly repoFactory: RepositoryFactory = createRepositoryContainer,
  ) {}

  /**
   * Returns the currently active TransactionContext in this async execution stack, or undefined.
   */
  getActiveContext(): TransactionContext | undefined {
    return this.asyncLocalStorage.getStore();
  }

  /**
   * Returns true if currently executing within an active UnitOfWork / TransactionRunner boundary.
   */
  isInTransaction(): boolean {
    return this.getActiveContext() !== undefined;
  }

  /**
   * Executes a business transaction.
   * - Enforces the locked nested transaction policy:
   *   If called when an active TransactionContext already exists, fails fast deterministically.
   * - Opens a single root PostgreSQL/Prisma transaction.
   * - Provides transaction-scoped repositories and context to the callback.
   * - Commits only when the callback completes successfully.
   * - Rolls back automatically when any error is thrown.
   */
  async run<T>(
    operation: (ctx: TransactionContext) => Promise<T>,
    options?: TransactionOptions,
  ): Promise<T> {
    const existingContext = this.getActiveContext();
    if (existingContext && !existingContext.isCompleted) {
      throw new NestedTransactionError(
        `[NESTED_TRANSACTION_VIOLATION] Accidental nested transaction runner execution detected (active tx id: ${existingContext.id}). Operations executed inside an active transaction must reuse the existing TransactionContext instead of calling TransactionRunner.run() again.`,
      );
    }

    try {
      return await this.prisma.$transaction(async (tx) => {
        const txContext: TransactionContext = {
          id: crypto.randomUUID(),
          tx,
          repositories: this.repoFactory(tx),
          depth: 1,
          isCompleted: false,
        };

        return await this.asyncLocalStorage.run(txContext, async () => {
          try {
            return await operation(txContext);
          } finally {
            txContext.isCompleted = true;
          }
        });
      }, options);
    } catch (err: unknown) {
      if (err instanceof AppError) {
        throw err;
      }
      throw mapDatabaseError(err);
    }
  }
}

/**
 * Default singleton instance of the PrismaTransactionRunner.
 */
export const transactionRunner: ITransactionRunner = new PrismaTransactionRunner();
