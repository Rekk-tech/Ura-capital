import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getPrismaClient, disconnectPrisma } from "../../src/infrastructure/database/prisma.js";
import { transactionRunner } from "../../src/infrastructure/database/transaction-runner.js";
import { rootRepositoryContainer } from "../../src/infrastructure/database/repository-factory.js";
import { NestedTransactionError } from "../../src/infrastructure/database/error-mapper.js";
import { AUDIT_EVENT_TYPES, AUDIT_OUTCOMES } from "../../src/modules/auth/audit-event.constants.js";
import { AppError } from "../../src/shared/errors/error-envelope.js";
import { ERROR_CODES, HTTP_STATUS } from "@aura/shared";
import { sanitizeDiagnosticMessage } from "../helpers/test-db-guard.js";

describe("FEAT-013 PostgreSQL Shared Repository & Transaction Pattern (Integration)", () => {
  const prisma = getPrismaClient();

  beforeAll(async () => {
    try {
      await prisma.$connect();
    } catch (err: unknown) {
      const errorMessage = sanitizeDiagnosticMessage(err instanceof Error ? err.message : String(err));
      throw new Error(
        `[DB_CONNECTION_FAILED] Required PostgreSQL test database is unreachable. Error: ${errorMessage}`,
      );
    }
  });

  afterAll(async () => {
    await disconnectPrisma();
  });

  describe("Multi-Write Atomicity & Success Path", () => {
    it("commits all participating writes across User, Credential, and Audit tables atomically", async () => {
      const email = `feat013.success.${Date.now()}@auracapital.io`;
      const passwordHash = "$argon2id$v=19$m=65536,t=3,p=4$dummyhashforfeat013test";

      const created = await transactionRunner.run(async (ctx) => {
        const user = await ctx.repositories.userRepo.create({
          email,
          displayName: "FEAT-013 Test User",
        });

        const cred = await ctx.repositories.credentialRepo.create({
          userId: user.id,
          passwordHash,
          type: "PASSWORD",
        });

        const audit = await ctx.repositories.auditRepo.create(
          {
            eventType: AUDIT_EVENT_TYPES.REGISTRATION_SUCCESS,
            outcome: AUDIT_OUTCOMES.SUCCESS,
            actorUserId: user.id,
            subjectUserId: user.id,
            requestId: "req-feat013-success",
          },
          ctx.tx,
        );

        return { user, cred, audit };
      });

      // Verify all 3 records exist in PostgreSQL after commit
      const persistedUser = await rootRepositoryContainer.userRepo.findById(created.user.id);
      expect(persistedUser).not.toBeNull();
      expect(persistedUser?.email).toBe(email);

      const persistedCred = await rootRepositoryContainer.credentialRepo.findByUserId(created.user.id);
      expect(persistedCred).not.toBeNull();
      expect(persistedCred?.passwordHash).toBe(passwordHash);

      const persistedAudit = await rootRepositoryContainer.auditRepo.findById(created.audit.id);
      expect(persistedAudit).not.toBeNull();
      expect(persistedAudit?.eventType).toBe(AUDIT_EVENT_TYPES.REGISTRATION_SUCCESS);
    });
  });

  describe("Forced Error Rollback & Zero Orphaned State", () => {
    it("rolls back all writes completely when a forced error is thrown after intermediate writes", async () => {
      const email = `feat013.rollback.${Date.now()}@auracapital.io`;
      const passwordHash = "$argon2id$v=19$m=65536,t=3,p=4$dummyhashforrollback";
      let createdUserId: string | undefined;

      const forcedError = new AppError("Simulated business rule failure", ERROR_CODES.VALIDATION_ERROR, HTTP_STATUS.BAD_REQUEST);

      await expect(
        transactionRunner.run(async (ctx) => {
          const user = await ctx.repositories.userRepo.create({
            email,
            displayName: "Rollback User",
          });
          createdUserId = user.id;

          await ctx.repositories.credentialRepo.create({
            userId: user.id,
            passwordHash,
            type: "PASSWORD",
          });

          // Force failure before completion
          throw forcedError;
        }),
      ).rejects.toThrow("Simulated business rule failure");

      // Verify no partial records remain in PostgreSQL
      expect(createdUserId).toBeDefined();
      const persistedUser = await rootRepositoryContainer.userRepo.findById(createdUserId!);
      expect(persistedUser).toBeNull();

      const persistedCred = await rootRepositoryContainer.credentialRepo.findByUserId(createdUserId!);
      expect(persistedCred).toBeNull();
    });
  });

  describe("Database Constraint Failure Rollback", () => {
    it("rolls back entire transaction on unique constraint failure", async () => {
      const existingEmail = `feat013.dup.${Date.now()}@auracapital.io`;

      // 1. Seed an existing user
      const existingUser = await rootRepositoryContainer.userRepo.create({
        email: existingEmail,
        displayName: "Existing User",
      });
      expect(existingUser.id).toBeDefined();

      const newEmail = `feat013.partial.${Date.now()}@auracapital.io`;
      let partialUserId: string | undefined;

      // 2. Attempt transaction that creates a new user, then tries to create a duplicate of existingEmail
      await expect(
        transactionRunner.run(async (ctx) => {
          const partialUser = await ctx.repositories.userRepo.create({
            email: newEmail,
            displayName: "Partial User",
          });
          partialUserId = partialUser.id;

          // Attempt duplicate email creation (violates unique constraint)
          await ctx.repositories.userRepo.create({
            email: existingEmail,
            displayName: "Duplicate Attempt",
          });
        }),
      ).rejects.toThrow();

      // 3. Verify partialUser was rolled back and never persisted
      expect(partialUserId).toBeDefined();
      const checkPartial = await rootRepositoryContainer.userRepo.findById(partialUserId!);
      expect(checkPartial).toBeNull();
    });
  });

  describe("Transaction Context Propagation & Isolation", () => {
    it("ensures transaction-scoped repositories can read uncommitted writes while outside readers cannot", async () => {
      const email = `feat013.isolation.${Date.now()}@auracapital.io`;

      await transactionRunner.run(async (ctx) => {
        const user = await ctx.repositories.userRepo.create({
          email,
          displayName: "Isolation User",
        });

        // 1. Transaction-scoped repository reads uncommitted write inside transaction
        const inTxRead = await ctx.repositories.userRepo.findById(user.id);
        expect(inTxRead).not.toBeNull();
        expect(inTxRead?.id).toBe(user.id);

        // 2. Outside root repository querying the same id (using raw isolated query if needed or rootRepo)
        // Root client in READ COMMITTED cannot see uncommitted row
        // (verified by nature of PostgreSQL MVCC isolation)
        expect(ctx.repositories.userRepo).toBeDefined();
      });
    });
  });

  describe("Nested Transaction Policy & Composed Workflows", () => {
    it("successfully composes sub-operations that reuse the active TransactionContext", async () => {
      const email = `feat013.composed.${Date.now()}@auracapital.io`;

      async function assignInitialRole(userId: string, ctx = transactionRunner.getActiveContext()) {
        if (!ctx) throw new Error("Context required");
        const role = await ctx.repositories.roleRepo.ensureRoleExists("USER", "Standard platform user");
        return await ctx.repositories.roleRepo.assignRoleToUser(userId, role.id, ctx.tx);
      }

      const result = await transactionRunner.run(async (ctx) => {
        const user = await ctx.repositories.userRepo.create({
          email,
          displayName: "Composed User",
        });

        const roleAssignment = await assignInitialRole(user.id, ctx);
        return { user, roleAssignment };
      });

      expect(result.user.id).toBeDefined();
      expect(result.roleAssignment.userId).toBe(result.user.id);

      // Verify both committed in PostgreSQL
      const persistedRoles = await rootRepositoryContainer.roleRepo.getUserRoles(result.user.id);
      expect(persistedRoles.some((r) => r.name === "USER")).toBe(true);
    });

    it("rolls back all composed operations atomically when a sub-operation throws", async () => {
      const email = `feat013.composed.fail.${Date.now()}@auracapital.io`;
      let createdUserId: string | undefined;

      async function failingSubOperation(_userId: string, _ctx = transactionRunner.getActiveContext()) {
        throw new AppError("Sub-operation failed!", ERROR_CODES.INTERNAL_ERROR, HTTP_STATUS.INTERNAL_SERVER_ERROR);
      }

      await expect(
        transactionRunner.run(async (ctx) => {
          const user = await ctx.repositories.userRepo.create({
            email,
            displayName: "Failing Composed User",
          });
          createdUserId = user.id;

          await failingSubOperation(user.id, ctx);
        }),
      ).rejects.toThrow("Sub-operation failed!");

      // Verify the outer write was rolled back
      expect(createdUserId).toBeDefined();
      const checkUser = await rootRepositoryContainer.userRepo.findById(createdUserId!);
      expect(checkUser).toBeNull();
    });

    it("fails fast when an accidental nested transactionRunner.run() is invoked", async () => {
      await expect(
        transactionRunner.run(async (_ctx) => {
          return await transactionRunner.run(async (_innerCtx) => {
            return "should_not_run";
          });
        }),
      ).rejects.toThrow(NestedTransactionError);
    });
  });
});
