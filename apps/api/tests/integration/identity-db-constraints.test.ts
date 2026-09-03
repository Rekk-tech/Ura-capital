import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaClient, Prisma } from "@prisma/client";
import { assertSafeTestDatabase, sanitizeDiagnosticMessage, cleanAllTestTables } from "../helpers/test-db-guard.js";
import { PrismaUserRepository } from "../../src/modules/users/user.repository.js";
import { PrismaCredentialRepository } from "../../src/modules/auth/credential.repository.js";
import { PrismaRoleRepository } from "../../src/modules/auth/role.repository.js";
import { PrismaRefreshSessionRepository } from "../../src/modules/auth/refresh-session.repository.js";
import { PrismaAuditRepository } from "../../src/modules/auth/audit.repository.js";

describe("PostgreSQL Real Database Constraints (Integration)", () => {
  const testDbUrl =
    process.env.TEST_DATABASE_URL ||
    process.env.DATABASE_URL ||
    "postgresql://postgres:postgrespassword@localhost:5432/aura_capital_test";

  let prisma: PrismaClient;

  beforeAll(async () => {
    // 1. Enforce test database isolation guard
    assertSafeTestDatabase(testDbUrl, "test");

    prisma = new PrismaClient({
      datasources: {
        db: {
          url: testDbUrl,
        },
      },
    });

    try {
      await prisma.$connect();

      // Clean up previous test artifacts before test suite begins
      await cleanAllTestTables(prisma);
    } catch (err: unknown) {
      const errorMessage = sanitizeDiagnosticMessage(err instanceof Error ? err.message : String(err));
      throw new Error(
        `[DB_CONNECTION_FAILED] Required PostgreSQL test database is unreachable. Error: ${errorMessage}`,
      );
    }
  });

  afterAll(async () => {
    if (prisma) {
      try {
        await cleanAllTestTables(prisma);
      } catch {
        // Ignore cleanup error on teardown
      } finally {
        await prisma.$disconnect();
      }
    }
  });

  it("enforces database uniqueness constraint on normalized user email", async () => {
    const userRepo = new PrismaUserRepository(prisma);

    // 1. Create first user
    const user1 = await userRepo.create({
      email: "UNIQUE.USER@AURA.LOCAL",
      displayName: "Unique User 1",
    });

    expect(user1.id).toBeDefined();
    expect(user1.email).toBe("unique.user@aura.local");

    // 2. Attempt to create duplicate user with matching normalized email
    await expect(
      userRepo.create({
        email: "unique.user@aura.local",
        displayName: "Duplicate User",
      }),
    ).rejects.toThrowError(Prisma.PrismaClientKnownRequestError);

    // Verify error code is P2002 (Unique constraint failed)
    try {
      await userRepo.create({
        email: "UNIQUE.USER@aura.local",
        displayName: "Duplicate User 2",
      });
      expect.unreachable("Duplicate insert should have been rejected by database");
    } catch (err: unknown) {
      expect((err as Prisma.PrismaClientKnownRequestError).code).toBe("P2002");
    }
  });

  it("enforces database foreign key constraint rejection on orphaned Credential records", async () => {
    const nonExistentUserId = "00000000-0000-0000-0000-000000000000";
    const credRepo = new PrismaCredentialRepository(prisma);

    try {
      await credRepo.create({
        userId: nonExistentUserId,
        passwordHash: "$argon2id$v=19$m=65536,t=3,p=4$dummyhash",
      });
      expect.unreachable("Orphaned credential record should have been rejected by database");
    } catch (err: unknown) {
      expect((err as Prisma.PrismaClientKnownRequestError).code).toBe("P2003"); // Foreign key violation
    }
  });

  it("enforces database foreign key constraint rejection on orphaned UserRole assignments", async () => {
    const userRepo = new PrismaUserRepository(prisma);
    const roleRepo = new PrismaRoleRepository(prisma);

    const user = await userRepo.create({
      email: "role.test@aura.local",
      displayName: "Role Test User",
    });

    const nonExistentRoleId = "00000000-0000-0000-0000-000000000000";

    try {
      await roleRepo.assignRoleToUser(user.id, nonExistentRoleId);
      expect.unreachable("Orphaned user role record should have been rejected by database");
    } catch (err: unknown) {
      expect((err as Prisma.PrismaClientKnownRequestError).code).toBe("P2003"); // Foreign key violation
    }
  });

  it("enforces database foreign key constraint rejection on orphaned RefreshSession records", async () => {
    const nonExistentUserId = "00000000-0000-0000-0000-000000000000";
    const sessionRepo = new PrismaRefreshSessionRepository(prisma);

    try {
      await sessionRepo.create({
        userId: nonExistentUserId,
        tokenHash: "dummy-token-hash-1234567890",
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });
      expect.unreachable("Orphaned refresh session record should have been rejected by database");
    } catch (err: unknown) {
      expect((err as Prisma.PrismaClientKnownRequestError).code).toBe("P2003"); // Foreign key violation
    }
  });

  it("persists AuthSecurityAuditRecord with valid userId and nullable userId", async () => {
    const userRepo = new PrismaUserRepository(prisma);
    const auditRepo = new PrismaAuditRepository(prisma);

    const user = await userRepo.create({
      email: "audit.test@aura.local",
      displayName: "Audit Test User",
    });

    // Valid user audit record
    const audit1 = await auditRepo.create({
      userId: user.id,
      eventType: "AUTH_LOGIN_SUCCESS",
      ipAddress: "127.0.0.1",
      metadata: { action: "test" },
    });
    expect(audit1.id).toBeDefined();
    expect(audit1.userId).toBe(user.id);

    // Null user audit record (e.g. unauthenticated request)
    const audit2 = await auditRepo.create({
      userId: null,
      eventType: "AUTH_ANONYMOUS_ACCESS",
      ipAddress: "127.0.0.1",
    });
    expect(audit2.id).toBeDefined();
    expect(audit2.userId).toBeNull();
  });

  it("verifies cascade deletion of dependent identity records and SetNull on audit records", async () => {
    const userRepo = new PrismaUserRepository(prisma);
    const credRepo = new PrismaCredentialRepository(prisma);
    const roleRepo = new PrismaRoleRepository(prisma);
    const sessionRepo = new PrismaRefreshSessionRepository(prisma);
    const auditRepo = new PrismaAuditRepository(prisma);

    // Create user and dependent records
    const user = await userRepo.create({
      email: "cascade.test@aura.local",
      displayName: "Cascade Test User",
    });

    const role = await roleRepo.createRole("TEST_MEMBER_ROLE", "Test Member Role");
    await roleRepo.assignRoleToUser(user.id, role.id);

    await credRepo.create({
      userId: user.id,
      passwordHash: "$argon2id$v=19$m=65536,t=3,p=4$cascadehash",
    });

    const session = await sessionRepo.create({
      userId: user.id,
      tokenHash: "cascade-session-token-hash-12345",
      expiresAt: new Date(Date.now() + 86400000),
    });

    const audit = await auditRepo.create({
      userId: user.id,
      eventType: "AUTH_USER_CREATED",
    });

    // Delete user
    await userRepo.delete(user.id);

    // Verify user is deleted
    expect(await userRepo.findById(user.id)).toBeNull();

    // Verify credential, userRole, refreshSession were cascaded (deleted)
    expect(await credRepo.findByUserId(user.id)).toBeNull();
    expect(await sessionRepo.findByTokenHash(session.tokenHash)).toBeNull();
    expect(await roleRepo.getUserRoles(user.id)).toEqual([]);

    // Verify audit record was preserved with userId set to null
    const auditRecords = await prisma.authSecurityAuditRecord.findUnique({
      where: { id: audit.id },
    });
    expect(auditRecords).not.toBeNull();
    expect(auditRecords?.userId).toBeNull();
  });
});
