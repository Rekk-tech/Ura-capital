import { describe, it, expect, vi } from "vitest";
import {
  assertSeedEnvironmentSafe,
  seedDevelopmentData,
  seedTestData,
  cleanupSeedData,
  DEV_FIXTURE_USERS,
  DEV_FIXTURE_EMAILS,
  TEST_FIXTURE_USER_BASENAMES,
  getTestFixtureEmails,
  SeedEnvironmentViolationError,
} from "../../src/infrastructure/seed/seed-service.js";
import type { PrismaClient } from "@prisma/client";

describe("FEAT-017 Seed Service & Orchestration Unit Tests", () => {
  describe("Environment Assertion & Mutation Sentinel (DEF-001 & DEF-002)", () => {
    it("throws SeedEnvironmentViolationError when NODE_ENV is production and prevents any DB mutation", async () => {
      const mockPrisma = {
        $transaction: vi.fn(),
        user: { upsert: vi.fn() },
      } as unknown as PrismaClient;

      expect(() =>
        assertSeedEnvironmentSafe("development", "ValidPassword123!", {
          nodeEnv: "production",
          databaseUrl: "postgresql://postgres:postgrespassword@localhost:5432/aura_capital_dev",
        }),
      ).toThrow(SeedEnvironmentViolationError);

      await expect(
        seedDevelopmentData(mockPrisma, "ValidPassword123!", {
          nodeEnv: "production",
          databaseUrl: "postgresql://postgres:postgrespassword@localhost:5432/aura_capital_dev",
        }),
      ).rejects.toThrow(SeedEnvironmentViolationError);

      expect(mockPrisma.$transaction).not.toHaveBeenCalled();
    });

    it("throws before DB mutation when DEV_SEED_USER_PASSWORD is missing or < 12 characters (DEF-001)", async () => {
      const mockPrisma = {
        $transaction: vi.fn(),
      } as unknown as PrismaClient;

      // 1. Missing password
      await expect(
        seedDevelopmentData(mockPrisma, "", {
          nodeEnv: "development",
          databaseUrl: "postgresql://postgres:postgrespassword@localhost:5432/aura_capital_dev",
        }),
      ).rejects.toThrow(SeedEnvironmentViolationError);

      // 2. 8-char password
      await expect(
        seedDevelopmentData(mockPrisma, "12345678", {
          nodeEnv: "development",
          databaseUrl: "postgresql://postgres:postgrespassword@localhost:5432/aura_capital_dev",
        }),
      ).rejects.toThrow(SeedEnvironmentViolationError);

      // 3. 11-char password
      await expect(
        seedDevelopmentData(mockPrisma, "12345678901", {
          nodeEnv: "development",
          databaseUrl: "postgresql://postgres:postgrespassword@localhost:5432/aura_capital_dev",
        }),
      ).rejects.toThrow(SeedEnvironmentViolationError);

      expect(mockPrisma.$transaction).not.toHaveBeenCalled();
    });

    it("throws before DB mutation when database target contains prohibited markers in query params (DEF-002)", async () => {
      const mockPrisma = {
        $transaction: vi.fn(),
      } as unknown as PrismaClient;

      await expect(
        seedDevelopmentData(mockPrisma, "ValidPassword123!", {
          nodeEnv: "development",
          databaseUrl: "postgresql://postgres:postgrespassword@localhost:5432/aura_capital_dev?target=prod",
        }),
      ).rejects.toThrow(SeedEnvironmentViolationError);

      await expect(
        seedTestData(mockPrisma, undefined, {
          nodeEnv: "test",
          databaseUrl: "postgresql://postgres:postgrespassword@localhost:5432/aura_capital_test?target=shared",
        }),
      ).rejects.toThrow(SeedEnvironmentViolationError);

      await expect(
        seedTestData(mockPrisma, undefined, {
          nodeEnv: "test",
          databaseUrl: "postgresql://postgres:postgrespassword@localhost:5432/aura_capital_test?schema=production",
        }),
      ).rejects.toThrow(SeedEnvironmentViolationError);

      expect(mockPrisma.$transaction).not.toHaveBeenCalled();
    });

    it("throws SeedEnvironmentViolationError when isCi is true for development seed", async () => {
      const mockPrisma = {
        $transaction: vi.fn(),
      } as unknown as PrismaClient;

      expect(() =>
        assertSeedEnvironmentSafe("development", "ValidPassword123!", {
          nodeEnv: "development",
          isCi: true,
          databaseUrl: "postgresql://postgres:postgrespassword@localhost:5432/aura_capital_dev",
        }),
      ).toThrow(SeedEnvironmentViolationError);

      await expect(
        seedDevelopmentData(mockPrisma, "ValidPassword123!", {
          nodeEnv: "development",
          isCi: true,
          databaseUrl: "postgresql://postgres:postgrespassword@localhost:5432/aura_capital_dev",
        }),
      ).rejects.toThrow(SeedEnvironmentViolationError);

      expect(mockPrisma.$transaction).not.toHaveBeenCalled();
    });
  });

  describe("Development Seed Execution", () => {
    it("creates standard development users with USER role and zero ADMIN assignment", async () => {
      const upsertedUsers: Array<{ email: string; displayName?: string }> = [];
      const upsertedRoles: Array<{ userId: string; roleId: string }> = [];
      const upsertedCredentials: Array<{ userId: string; passwordHash: string }> = [];

      const mockTx = {
        role: {
          upsert: vi.fn().mockImplementation(({ where }) => {
            return Promise.resolve({ id: `role-${where.name}`, name: where.name });
          }),
        },
        user: {
          upsert: vi.fn().mockImplementation(({ where, create }) => {
            const user = { id: `usr-${where.email}`, email: where.email, displayName: create.displayName };
            upsertedUsers.push(user);
            return Promise.resolve(user);
          }),
        },
        credential: {
          upsert: vi.fn().mockImplementation(({ create }) => {
            upsertedCredentials.push(create);
            return Promise.resolve({ id: `cred-${create.userId}` });
          }),
        },
        userRole: {
          upsert: vi.fn().mockImplementation(({ create }) => {
            upsertedRoles.push(create);
            return Promise.resolve({ id: `ur-${create.userId}-${create.roleId}` });
          }),
        },
      };

      const mockPrisma = {
        $transaction: vi.fn().mockImplementation(async (callback) => {
          return await callback(mockTx);
        }),
      } as unknown as PrismaClient;

      const result = await seedDevelopmentData(mockPrisma, "MySecretDevPassword123!", {
        nodeEnv: "development",
        isCi: false,
        databaseUrl: "postgresql://postgres:postgrespassword@localhost:5432/aura_capital_dev",
      });

      expect(result.mode).toBe("development");
      expect(result.seededUsers).toBe(DEV_FIXTURE_USERS.length);
      expect(result.rolesEnsured).toContain("USER");
      expect(result.rolesEnsured).toContain("ADMIN");

      // Verify all dev users were seeded
      expect(upsertedUsers.map((u) => u.email)).toEqual(DEV_FIXTURE_EMAILS);

      // Verify credentials were created with Argon2id hash (never plaintext)
      for (const cred of upsertedCredentials) {
        expect(cred.passwordHash).toMatch(/^\$argon2id\$/);
        expect(cred.passwordHash).not.toBe("MySecretDevPassword123!");
      }

      // Verify only USER role was assigned (zero ADMIN assignment)
      for (const ur of upsertedRoles) {
        expect(ur.roleId).toBe("role-USER");
        expect(ur.roleId).not.toBe("role-ADMIN");
      }
    });
  });

  describe("Automated Test Seed Execution & Run/Worker Isolation (DEF-004)", () => {
    it("creates run/worker-scoped test fixtures with USER role and excludes ADMIN by default", async () => {
      const upsertedUsers: Array<{ email: string }> = [];
      const upsertedRoles: Array<{ userId: string; roleId: string }> = [];

      const mockTx = {
        role: {
          upsert: vi.fn().mockImplementation(({ where }) => {
            return Promise.resolve({ id: `role-${where.name}`, name: where.name });
          }),
        },
        user: {
          upsert: vi.fn().mockImplementation(({ where }) => {
            const user = { id: `usr-${where.email}`, email: where.email };
            upsertedUsers.push(user);
            return Promise.resolve(user);
          }),
        },
        credential: {
          upsert: vi.fn().mockResolvedValue({ id: "cred-1" }),
        },
        userRole: {
          upsert: vi.fn().mockImplementation(({ create }) => {
            upsertedRoles.push(create);
            return Promise.resolve({ id: `ur-1` });
          }),
        },
      };

      const mockPrisma = {
        $transaction: vi.fn().mockImplementation(async (callback) => {
          return await callback(mockTx);
        }),
      } as unknown as PrismaClient;

      const result = await seedTestData(
        mockPrisma,
        { runId: "run101", workerId: "worker2", includeTestAdmin: false },
        {
          nodeEnv: "test",
          isCi: false,
          databaseUrl: "postgresql://postgres:postgrespassword@localhost:5432/aura_capital_test_unit",
        },
      );

      const expectedEmails = TEST_FIXTURE_USER_BASENAMES.map((b) => `${b}+run101.worker2@aura.test`);
      expect(result.seededUsers).toBe(expectedEmails.length);
      expect(upsertedUsers.map((u) => u.email)).toEqual(expectedEmails);
      expect(upsertedRoles.every((ur) => ur.roleId === "role-USER")).toBe(true);
    });

    it("creates test ADMIN fixture ONLY when includeTestAdmin: true is explicitly requested", async () => {
      const upsertedUsers: Array<{ email: string }> = [];
      const upsertedRoles: Array<{ userId: string; roleId: string }> = [];

      const mockTx = {
        role: {
          upsert: vi.fn().mockImplementation(({ where }) => {
            return Promise.resolve({ id: `role-${where.name}`, name: where.name });
          }),
        },
        user: {
          upsert: vi.fn().mockImplementation(({ where }) => {
            const user = { id: `usr-${where.email}`, email: where.email };
            upsertedUsers.push(user);
            return Promise.resolve(user);
          }),
        },
        credential: {
          upsert: vi.fn().mockResolvedValue({ id: "cred-1" }),
        },
        userRole: {
          upsert: vi.fn().mockImplementation(({ create }) => {
            upsertedRoles.push(create);
            return Promise.resolve({ id: `ur-1` });
          }),
        },
      };

      const mockPrisma = {
        $transaction: vi.fn().mockImplementation(async (callback) => {
          return await callback(mockTx);
        }),
      } as unknown as PrismaClient;

      const result = await seedTestData(
        mockPrisma,
        { runId: "run202", workerId: "worker1", includeTestAdmin: true },
        {
          nodeEnv: "test",
          isCi: false,
          databaseUrl: "postgresql://postgres:postgrespassword@localhost:5432/aura_capital_test_unit",
        },
      );

      expect(result.seededUsers).toBe(TEST_FIXTURE_USER_BASENAMES.length + 1);
      expect(upsertedUsers.some((u) => u.email === "test.admin+run202.worker1@aura.test")).toBe(true);
      expect(upsertedRoles.some((ur) => ur.roleId === "role-ADMIN")).toBe(true);
    });
  });

  describe("Scoped Cleanup & Explicit Ownership (DEF-003 & DEF-004)", () => {
    it("deletes ONLY explicit FEAT-017 dev fixtures by email allowlist and does NOT delete unrelated users", async () => {
      let deletedWhereClause: { email?: { in?: readonly string[] | string[] } } | null = null;

      const mockPrisma = {
        user: {
          deleteMany: vi.fn().mockImplementation(({ where }: { where: { email?: { in?: string[] } } }) => {
            deletedWhereClause = where;
            return Promise.resolve({ count: DEV_FIXTURE_EMAILS.length });
          }),
        },
      } as unknown as PrismaClient;

      const devCleanup = await cleanupSeedData(mockPrisma, "dev");

      // Verify that deleteMany used exact 'in: DEV_FIXTURE_EMAILS' clause, NOT broad 'endsWith'
      expect(deletedWhereClause).toEqual({
        email: {
          in: DEV_FIXTURE_EMAILS,
        },
      });
      expect(devCleanup.deletedEmails).toEqual(DEV_FIXTURE_EMAILS);

      // Verify unrelated users would NOT be matched by this where clause:
      const targetEmails = deletedWhereClause?.email?.in ?? [];
      expect(targetEmails.includes("dev.user1@aura.internal")).toBe(true);
      expect(targetEmails.includes("dev.user2@aura.internal")).toBe(true);
      expect(targetEmails.includes("other.dev@aura.internal")).toBe(false);
      expect(targetEmails.includes("engineer@aura.internal")).toBe(false);
      expect(targetEmails.includes("regular.user@example.com")).toBe(false);
    });

    it("deletes ONLY run/worker-scoped test fixtures and preserves other runs and workers", async () => {
      let deletedWhereClause: { email?: { in?: readonly string[] | string[] } } | null = null;

      const mockPrisma = {
        user: {
          deleteMany: vi.fn().mockImplementation(({ where }: { where: { email?: { in?: string[] } } }) => {
            deletedWhereClause = where;
            return Promise.resolve({ count: 3 });
          }),
        },
      } as unknown as PrismaClient;

      const testCleanup = await cleanupSeedData(mockPrisma, "test", {
        runId: "runA",
        workerId: "worker1",
      });

      expect(testCleanup.deletedCount).toBe(3);

      const { userEmails, adminEmail } = getTestFixtureEmails({ runId: "runA", workerId: "worker1" });
      const expectedEmails = [...userEmails, adminEmail];

      expect(deletedWhereClause).toEqual({
        email: {
          in: expectedEmails,
        },
      });

      const targetEmails = deletedWhereClause?.email?.in ?? [];
      expect(targetEmails.includes("test.user1+runA.worker1@aura.test")).toBe(true);
      expect(targetEmails.includes("test.admin+runA.worker1@aura.test")).toBe(true);

      // Run B fixtures survive
      expect(targetEmails.includes("test.user1+runB.worker1@aura.test")).toBe(false);
      // Worker 2 fixtures survive
      expect(targetEmails.includes("test.user1+runA.worker2@aura.test")).toBe(false);
      // Unrelated test users survive
      expect(targetEmails.includes("qa.user@aura.test")).toBe(false);
    });
  });

  describe("Transaction Atomicity & Rollback", () => {
    it("rolls back completely on mid-transaction error without partial user creation", async () => {
      const mockTx = {
        role: {
          upsert: vi.fn().mockResolvedValue({ id: "role-USER" }),
        },
        user: {
          upsert: vi.fn().mockRejectedValue(new Error("Simulated DB connection failure during user insert")),
        },
        credential: {
          upsert: vi.fn(),
        },
        userRole: {
          upsert: vi.fn(),
        },
      };

      const mockPrisma = {
        $transaction: vi.fn().mockImplementation(async (callback) => {
          return await callback(mockTx);
        }),
      } as unknown as PrismaClient;

      await expect(
        seedDevelopmentData(mockPrisma, "ValidPassword123!", {
          nodeEnv: "development",
          isCi: false,
          databaseUrl: "postgresql://postgres:postgrespassword@localhost:5432/aura_capital_dev",
        }),
      ).rejects.toThrow("Simulated DB connection failure during user insert");

      expect(mockTx.credential.upsert).not.toHaveBeenCalled();
      expect(mockTx.userRole.upsert).not.toHaveBeenCalled();
    });
  });
});
