import { describe, it, expect, vi } from "vitest";
import { Prisma, type PrismaClient } from "@prisma/client";
import {
  PrismaTransactionRunner,
} from "../../src/infrastructure/database/transaction-runner.js";
import {
  createRepositoryContainer,
  type IRepositoryContainer,
} from "../../src/infrastructure/database/repository-factory.js";
import {
  NestedTransactionError,
  mapDatabaseError,
} from "../../src/infrastructure/database/error-mapper.js";
import { AppError } from "../../src/shared/errors/error-envelope.js";
import { ERROR_CODES, HTTP_STATUS } from "@aura/shared";
import type { TransactionContext } from "../../src/infrastructure/database/transaction-context.js";

describe("FEAT-013 TransactionRunner & Unit of Work (Unit)", () => {
  describe("Root Transaction Execution & Atomicity", () => {
    it("executes operation callback within transaction and commits upon return", async () => {
      const mockTxClient = { mockType: "txClient" } as unknown as Prisma.TransactionClient;
      const mockPrisma = {
        $transaction: vi.fn().mockImplementation(async (cb: (tx: Prisma.TransactionClient) => Promise<unknown>) => {
          return cb(mockTxClient);
        }),
      } as unknown as PrismaClient;

      const runner = new PrismaTransactionRunner(mockPrisma);

      const result = await runner.run(async (ctx) => {
        expect(ctx.id).toBeDefined();
        expect(ctx.depth).toBe(1);
        expect(ctx.isCompleted).toBe(false);
        expect(ctx.tx).toBe(mockTxClient);
        expect(ctx.repositories).toBeDefined();
        return { success: true, count: 42 };
      });

      expect(result).toEqual({ success: true, count: 42 });
      expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);
    });

    it("propagates thrown errors and triggers transaction rollback without swallowing", async () => {
      const mockTxClient = { mockType: "txClient" } as unknown as Prisma.TransactionClient;
      const mockPrisma = {
        $transaction: vi.fn().mockImplementation(async (cb: (tx: Prisma.TransactionClient) => Promise<unknown>) => {
          return cb(mockTxClient);
        }),
      } as unknown as PrismaClient;

      const runner = new PrismaTransactionRunner(mockPrisma);

      const customError = new AppError("Business validation failed", ERROR_CODES.VALIDATION_ERROR, HTTP_STATUS.BAD_REQUEST);

      await expect(
        runner.run(async (_ctx) => {
          throw customError;
        }),
      ).rejects.toThrow("Business validation failed");
    });
  });

  describe("AsyncLocalStorage Lifecycle & Isolation", () => {
    it("active context exists only inside the transaction callback and is cleared after commit", async () => {
      const mockTxClient = { mockType: "txClient" } as unknown as Prisma.TransactionClient;
      const mockPrisma = {
        $transaction: vi.fn().mockImplementation(async (cb: (tx: Prisma.TransactionClient) => Promise<unknown>) => {
          return cb(mockTxClient);
        }),
      } as unknown as PrismaClient;

      const runner = new PrismaTransactionRunner(mockPrisma);

      expect(runner.getActiveContext()).toBeUndefined();
      expect(runner.isInTransaction()).toBe(false);

      let contextDuringRun: TransactionContext | undefined;
      await runner.run(async (ctx) => {
        contextDuringRun = runner.getActiveContext();
        expect(contextDuringRun).toBeDefined();
        expect(contextDuringRun?.id).toBe(ctx.id);
        expect(runner.isInTransaction()).toBe(true);
      });

      expect(contextDuringRun?.isCompleted).toBe(true);
      expect(runner.getActiveContext()).toBeUndefined();
      expect(runner.isInTransaction()).toBe(false);
    });

    it("active context is cleared after transaction rollback / error thrown", async () => {
      const mockTxClient = { mockType: "txClient" } as unknown as Prisma.TransactionClient;
      const mockPrisma = {
        $transaction: vi.fn().mockImplementation(async (cb: (tx: Prisma.TransactionClient) => Promise<unknown>) => {
          return cb(mockTxClient);
        }),
      } as unknown as PrismaClient;

      const runner = new PrismaTransactionRunner(mockPrisma);

      expect(runner.getActiveContext()).toBeUndefined();
      expect(runner.isInTransaction()).toBe(false);

      let contextDuringError: TransactionContext | undefined;
      await expect(
        runner.run(async (_ctx) => {
          contextDuringError = runner.getActiveContext();
          expect(runner.isInTransaction()).toBe(true);
          throw new Error("Simulated rollback error");
        }),
      ).rejects.toThrow();

      expect(contextDuringError?.isCompleted).toBe(true);
      expect(runner.getActiveContext()).toBeUndefined();
      expect(runner.isInTransaction()).toBe(false);
    });

    it("sequential transactions receive distinct unique context IDs", async () => {
      const mockTxClient = { mockType: "txClient" } as unknown as Prisma.TransactionClient;
      const mockPrisma = {
        $transaction: vi.fn().mockImplementation(async (cb: (tx: Prisma.TransactionClient) => Promise<unknown>) => {
          return cb(mockTxClient);
        }),
      } as unknown as PrismaClient;

      const runner = new PrismaTransactionRunner(mockPrisma);

      let id1 = "";
      let id2 = "";

      await runner.run(async (_ctx) => {
        id1 = _ctx.id;
      });

      await runner.run(async (_ctx) => {
        id2 = _ctx.id;
      });

      expect(id1).toBeTruthy();
      expect(id2).toBeTruthy();
      expect(id1).not.toBe(id2);
    });

    it("parallel transactions in separate async branches do not leak context into each other", async () => {
      const mockTxClient = { mockType: "txClient" } as unknown as Prisma.TransactionClient;
      const mockPrisma = {
        $transaction: vi.fn().mockImplementation(async (cb: (tx: Prisma.TransactionClient) => Promise<unknown>) => {
          return cb(mockTxClient);
        }),
      } as unknown as PrismaClient;

      const runner = new PrismaTransactionRunner(mockPrisma);

      const branch1 = runner.run(async (ctx) => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        const active = runner.getActiveContext();
        expect(active?.id).toBe(ctx.id);
        return ctx.id;
      });

      const branch2 = runner.run(async (ctx) => {
        await new Promise((resolve) => setTimeout(resolve, 5));
        const active = runner.getActiveContext();
        expect(active?.id).toBe(ctx.id);
        return ctx.id;
      });

      const [res1, res2] = await Promise.all([branch1, branch2]);
      expect(res1).toBeTruthy();
      expect(res2).toBeTruthy();
      expect(res1).not.toBe(res2);
    });

    it("tracks isCompleted flag on transaction context so completed context cannot be reused", async () => {
      const mockTxClient = { mockType: "txClient" } as unknown as Prisma.TransactionClient;
      const mockPrisma = {
        $transaction: vi.fn().mockImplementation(async (cb: (tx: Prisma.TransactionClient) => Promise<unknown>) => {
          return cb(mockTxClient);
        }),
      } as unknown as PrismaClient;

      const runner = new PrismaTransactionRunner(mockPrisma);

      let capturedCtx!: TransactionContext;
      await runner.run(async (ctx) => {
        capturedCtx = ctx;
        expect(ctx.isCompleted).toBe(false);
      });

      expect(capturedCtx.isCompleted).toBe(true);
    });
  });

  describe("Locked Nested Transaction Policy & Fail-Fast Rejection", () => {
    it("allows inner operations to reuse the active TransactionContext without opening nested boundaries", async () => {
      const mockTxClient = { mockType: "txClient" } as unknown as Prisma.TransactionClient;
      let transactionInvocations = 0;

      const mockPrisma = {
        $transaction: vi.fn().mockImplementation(async (cb: (tx: Prisma.TransactionClient) => Promise<unknown>) => {
          transactionInvocations++;
          return cb(mockTxClient);
        }),
      } as unknown as PrismaClient;

      const runner = new PrismaTransactionRunner(mockPrisma);

      // Composed helper simulating a shared sub-operation reusing active context
      async function subOperation(ctx = runner.getActiveContext()) {
        if (!ctx) throw new Error("No active transaction");
        return `subOp_executed_in_${ctx.id}`;
      }

      const result = await runner.run(async (ctx) => {
        expect(runner.isInTransaction()).toBe(true);
        const subResult = await subOperation(ctx);
        return { main: "ok", sub: subResult };
      });

      expect(result.main).toBe("ok");
      expect(result.sub).toMatch(/^subOp_executed_in_/);
      expect(transactionInvocations).toBe(1); // Strict single transaction boundary
      expect(runner.isInTransaction()).toBe(false); // Cleaned up after completion
    });

    it("FAILS FAST when accidental nested runner.run() is called within an active transaction, opening NO second $transaction", async () => {
      const mockTxClient = { mockType: "txClient" } as unknown as Prisma.TransactionClient;
      const transactionSpy = vi.fn().mockImplementation(async (cb: (tx: Prisma.TransactionClient) => Promise<unknown>) => {
        return cb(mockTxClient);
      });
      const mockPrisma = {
        $transaction: transactionSpy,
      } as unknown as PrismaClient;

      const runner = new PrismaTransactionRunner(mockPrisma);

      await expect(
        runner.run(async (_outerCtx) => {
          // Accidental nested invocation without context reuse
          return await runner.run(async (_innerCtx) => {
            return "nested_should_never_succeed";
          });
        }),
      ).rejects.toThrow(NestedTransactionError);

      // Exactly ONE $transaction call was opened (the root one); NO second $transaction call was made
      expect(transactionSpy).toHaveBeenCalledTimes(1);
    });

    it("NestedTransactionError contains explicit diagnostic message and safe error code", async () => {
      const mockTxClient = { mockType: "txClient" } as unknown as Prisma.TransactionClient;
      const mockPrisma = {
        $transaction: vi.fn().mockImplementation(async (cb: (tx: Prisma.TransactionClient) => Promise<unknown>) => {
          return cb(mockTxClient);
        }),
      } as unknown as PrismaClient;

      const runner = new PrismaTransactionRunner(mockPrisma);

      let caughtError: unknown;
      try {
        await runner.run(async () => {
          await runner.run(async () => {});
        });
      } catch (err) {
        caughtError = err;
      }

      expect(caughtError).toBeInstanceOf(NestedTransactionError);
      const nestedErr = caughtError as NestedTransactionError;
      expect(nestedErr.message).toContain("[NESTED_TRANSACTION_VIOLATION]");
      expect(nestedErr.code).toBe(ERROR_CODES.INTERNAL_ERROR);
      expect(nestedErr.statusCode).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
    });
  });

  describe("Repository Factory & Scoped Repositories", () => {
    it("instantiates all 5 domain repositories bound to the provided client", () => {
      const mockClient = {} as unknown as PrismaClient;
      const repos: IRepositoryContainer = createRepositoryContainer(mockClient);

      expect(repos.userRepo).toBeDefined();
      expect(repos.credentialRepo).toBeDefined();
      expect(repos.roleRepo).toBeDefined();
      expect(repos.refreshSessionRepo).toBeDefined();
      expect(repos.auditRepo).toBeDefined();
    });
  });

  describe("Database Error Mapping & Sanitization", () => {
    it("maps Prisma P2002 email unique constraint violation to AUTH_EMAIL_ALREADY_EXISTS (409)", () => {
      const prismaError = new (Prisma as unknown as { PrismaClientKnownRequestError: new (msg: string, opts: object) => Error }).PrismaClientKnownRequestError(
        "Unique constraint failed on the fields: (`email`)",
        { code: "P2002", clientVersion: "6.0.0", meta: { target: ["email"] } },
      );

      const mapped = mapDatabaseError(prismaError);
      expect(mapped).toBeInstanceOf(AppError);
      expect(mapped.code).toBe(ERROR_CODES.AUTH_EMAIL_ALREADY_EXISTS);
      expect(mapped.statusCode).toBe(HTTP_STATUS.CONFLICT);
      expect(mapped.message).toBe("An account with this email address already exists.");
    });

    it("maps generic database infrastructure error to safe 500 without leaking details", () => {
      const dbError = new Error("Connection lost to postgresql://admin:secretpassword@db.prod.internal:5432/aura_db");

      const mapped = mapDatabaseError(dbError, "Database operation failed");
      expect(mapped).toBeInstanceOf(AppError);
      expect(mapped.code).toBe(ERROR_CODES.INTERNAL_ERROR);
      expect(mapped.statusCode).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
      expect(mapped.message).toBe("Database operation failed");
      expect(mapped.message).not.toContain("secretpassword");
      expect(mapped.message).not.toContain("db.prod.internal");
      expect(mapped.message).not.toContain("postgresql");
    });
  });
});

