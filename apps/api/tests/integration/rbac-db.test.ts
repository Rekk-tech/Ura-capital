import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import { assertSafeTestDatabase, sanitizeDiagnosticMessage } from "../helpers/test-db-guard.js";
import { RegistrationService } from "../../src/modules/auth/registration.service.js";
import { LoginService } from "../../src/modules/auth/login.service.js";
import { AuthorizationService } from "../../src/modules/auth/authorization.service.js";
import { PrismaRoleRepository } from "../../src/modules/auth/role.repository.js";
import { PrismaUserRepository } from "../../src/modules/users/user.repository.js";
import { seedCanonicalRoles, assignRoleToExistingUser } from "../../src/modules/auth/role.seed.js";
import { ROLES } from "../../src/modules/auth/authorization.constants.js";

describe("RBAC PostgreSQL Database Integration & Persistence (Integration)", () => {
  const testDbUrl =
    process.env.TEST_DATABASE_URL ||
    process.env.DATABASE_URL ||
    "postgresql://postgres:postgrespassword@localhost:5432/aura_capital_test";

  let prisma: PrismaClient;
  let roleRepo: PrismaRoleRepository;
  let userRepo: PrismaUserRepository;
  let regService: RegistrationService;
  let loginService: LoginService;
  let authService: AuthorizationService;

  beforeAll(async () => {
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

      // Clean up previous test artifacts
      await prisma.userRole.deleteMany();
      await prisma.credential.deleteMany();
      await prisma.refreshSession.deleteMany();
      await prisma.authSecurityAuditRecord.deleteMany();
      await prisma.role.deleteMany();
      await prisma.user.deleteMany();

      roleRepo = new PrismaRoleRepository(prisma);
      userRepo = new PrismaUserRepository(prisma);
      regService = new RegistrationService();
      loginService = new LoginService();
      authService = new AuthorizationService(roleRepo);
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
        await prisma.userRole.deleteMany();
        await prisma.credential.deleteMany();
        await prisma.refreshSession.deleteMany();
        await prisma.authSecurityAuditRecord.deleteMany();
        await prisma.role.deleteMany();
        await prisma.user.deleteMany();
      } catch {
        // Ignore cleanup error on teardown
      } finally {
        await prisma.$disconnect();
      }
    }
  });

  it("idempotently seeds canonical USER and ADMIN roles in PostgreSQL without creating default users/credentials", async () => {
    // 1. Initial seed
    const res1 = await seedCanonicalRoles(roleRepo);
    expect(res1.roles).toHaveLength(2);

    const rolesInDb = await prisma.role.findMany();
    expect(rolesInDb).toHaveLength(2);
    expect(rolesInDb.map((r) => r.name).sort()).toEqual(["ADMIN", "USER"]);

    // 2. Second seed execution (assert idempotency)
    const res2 = await seedCanonicalRoles(roleRepo);
    expect(res2.roles).toHaveLength(2);

    const countAfter = await prisma.role.count();
    expect(countAfter).toBe(2);

    // 3. Verify ZERO users and ZERO credentials created by role seed
    const userCount = await prisma.user.count();
    const credentialCount = await prisma.credential.count();
    expect(userCount).toBe(0);
    expect(credentialCount).toBe(0);
  });

  it("verifies FEAT-003 registration creates a zero-role user in PostgreSQL (no automatic USER assignment)", async () => {
    const email = "db.rbac.zero.role@auracapital.local";
    const password = "valid-secure-password-12345";

    const regResult = await regService.register({ email, password, displayName: "Zero Role User" });

    // Assert user has ZERO role assignments in PostgreSQL
    const assignedRoles = await authService.getUserRoles(regResult.user.id);
    expect(assignedRoles).toEqual([]);

    const userRolesInDb = await prisma.userRole.findMany({ where: { userId: regResult.user.id } });
    expect(userRolesInDb).toHaveLength(0);
  });

  it("assigns canonical role via operational provisioning and enforces DB unique constraint against duplicates", async () => {
    const email = "db.rbac.provisioning@auracapital.local";
    const password = "valid-secure-password-12345";

    const regResult = await regService.register({ email, password, displayName: "Provisioning User" });

    // 1. Assign USER role
    await assignRoleToExistingUser({ userId: regResult.user.id, roleCode: ROLES.USER }, userRepo, roleRepo);

    const roles1 = await authService.getUserRoles(regResult.user.id);
    expect(roles1).toEqual(["USER"]);

    // 2. Operational provisioning repeated (idempotent helper)
    await assignRoleToExistingUser({ userId: regResult.user.id, roleCode: ROLES.USER }, userRepo, roleRepo);
    const roles2 = await authService.getUserRoles(regResult.user.id);
    expect(roles2).toEqual(["USER"]);

    // 3. Direct DB unique constraint test: attempting raw duplicate UserRole insertion throws P2002
    const userRole = await prisma.userRole.findFirst({ where: { userId: regResult.user.id } });
    await expect(
      prisma.userRole.create({
        data: {
          userId: regResult.user.id,
          roleId: userRole!.roleId,
        },
      }),
    ).rejects.toThrow();
  });

  it("supports multi-role users with deterministic lexical ascending role order in PostgreSQL", async () => {
    const email = "db.rbac.multirole@auracapital.local";
    const password = "valid-secure-password-12345";

    const regResult = await regService.register({ email, password, displayName: "Multi Role User" });

    // Assign USER first, then ADMIN
    await assignRoleToExistingUser({ userId: regResult.user.id, roleCode: ROLES.USER }, userRepo, roleRepo);
    await assignRoleToExistingUser({ userId: regResult.user.id, roleCode: ROLES.ADMIN }, userRepo, roleRepo);

    const roles = await authService.getUserRoles(regResult.user.id);
    expect(roles).toEqual(["ADMIN", "USER"]); // Lexical ascending order
  });

  it("reflects PostgreSQL role changes immediately during authorization without requiring a new access token", async () => {
    const email = "db.rbac.immediacy@auracapital.local";
    const password = "valid-secure-password-12345";

    // 1. Register & Login
    const regResult = await regService.register({ email, password, displayName: "Immediacy User" });
    const loginResult = await loginService.login({ email, password });
    const originalToken = loginResult.accessToken;

    // 2. Initially user has NO roles -> build context
    const context1 = await authService.buildAuthorizationContext({
      id: regResult.user.id,
      email: regResult.user.email,
      displayName: regResult.user.displayName,
      status: "ACTIVE",
      createdAt: new Date().toISOString(),
    });
    expect(authService.hasRole(context1, ROLES.ADMIN)).toBe(false);

    // 3. Dynamically assign ADMIN role in PostgreSQL
    await assignRoleToExistingUser({ userId: regResult.user.id, roleCode: ROLES.ADMIN }, userRepo, roleRepo);

    // 4. Using the exact same user identity (simulating next request with same valid token)
    const context2 = await authService.buildAuthorizationContext({
      id: regResult.user.id,
      email: regResult.user.email,
      displayName: regResult.user.displayName,
      status: "ACTIVE",
      createdAt: new Date().toISOString(),
    });
    expect(authService.hasRole(context2, ROLES.ADMIN)).toBe(true);
    expect(originalToken).toBeDefined(); // Token was not refreshed
  });
});
