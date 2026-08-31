import type { Prisma } from "@prisma/client";
import type { IRepositoryContainer } from "./repository-factory.js";

/**
 * Encapsulates the active transaction context provided to transactional callbacks.
 */
export interface TransactionContext {
  /**
   * Unique identifier for this transaction execution.
   */
  readonly id: string;

  /**
   * Scoped Prisma transaction client for direct low-level persistence operations.
   */
  readonly tx: Prisma.TransactionClient;

  /**
   * Container of repository instances bound strictly to this transaction client.
   * All writes made via these repositories will commit or roll back atomically.
   */
  readonly repositories: IRepositoryContainer;

  /**
   * Transaction depth level (1 for root transaction).
   */
  readonly depth: number;

  /**
   * Indicates whether the transaction has finished execution.
   */
  isCompleted: boolean;
}
