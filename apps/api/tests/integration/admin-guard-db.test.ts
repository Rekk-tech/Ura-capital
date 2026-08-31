import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { PrismaClient } from "@prisma/client";
import { assertSafeTestDatabase, sanitizeDiagnosticMessage } from "../helpers/test-db-guard.js";
import { createApp } from "../../src/server.js";
import { RegistrationService } from "../../src/modules/auth/registration.service.js";
import { LoginService } from "../../src/modules/auth/login.service.js";
import { PrismaRoleRepository } from "../../src/modules/auth/role.repository.js";
import { PrismaUserRepository } from "../../src/modules/users/user.repository.js";
import { seedCanonicalRoles, assignRoleToExistingUser } from "../../src/modules/auth/role.seed.js";
import { ROLES } from "../../src/modules/auth/authorization.constants.js";
import { HTTP_STATUS } from "@aura/shared";

describe("Admin Authorization Guard PostgreSQL Integration & Immediacy (Integration)", () => {
  const testDbUrl =
    process.env.TEST_DATABASE_URL ||
    process.env.DATABASE_URL ||
    "postgresql://postgres:postgrespassword@localhost:5432/aura_capital_test";

  let prisma: PrismaClient;
  let roleRepo: PrismaRoleRepository;
  let userRepo: PrismaUserRepository;
  let regService: RegistrationService;
  let loginService: LoginService;
  const app = createApp();

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
      regService = new RegistrationService(prisma);
      loginService = new LoginService(prisma);

      // Seed canonical roles
      await seedCanonicalRoles(roleRepo);
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

  it("reflects ADMIN role grant and removal immediately in GET /admin/ping with the same still-valid access token", async () => {
    const email = "db.admin.immediacy@auracapital.local";
    const password = "valid-secure-password-12345";

    // 1. Register & Login user
    const regResult = await regService.register({ email, password, displayName: "Immediacy Admin User" });
    const loginResult = await loginService.login({ email, password });
    const accessToken = loginResult.accessToken;

    // 2. Initial state: zero-role user requesting GET /admin/ping -> 403 FORBIDDEN
    const resInitial = await request(app)
      .get("/admin/ping")
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(HTTP_STATUS.FORBIDDEN);
    expect(resInitial.body.error.code).toBe("FORBIDDEN");

    // 3. Operational provisioning grants ADMIN in PostgreSQL
    await assignRoleToExistingUser({ userId: regResult.user.id, roleCode: ROLES.ADMIN }, userRepo, roleRepo);

    // 4. Using the EXACT SAME access token: GET /admin/ping -> 200 OK (no token refresh or re-login)
    const resAfterGrant = await request(app)
      .get("/admin/ping")
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(HTTP_STATUS.OK);
    expect(resAfterGrant.body).toEqual({
      status: "ok",
      scope: "admin",
    });

    // 5. Remove ADMIN role assignment from PostgreSQL
    const adminRole = await roleRepo.findByName(ROLES.ADMIN);
    await roleRepo.removeRoleFromUser(regResult.user.id, adminRole!.id);

    // 6. Using the EXACT SAME access token: GET /admin/ping -> 403 FORBIDDEN immediately
    const resAfterRemoval = await request(app)
      .get("/admin/ping")
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(HTTP_STATUS.FORBIDDEN);
    expect(resAfterRemoval.body.error.code).toBe("FORBIDDEN");
  });

  it("verifies role changes for one user do not affect unrelated users", async () => {
    const userAEmail = "db.admin.userA@auracapital.local";
    const userBEmail = "db.admin.userB@auracapital.local";
    const password = "valid-secure-password-12345";

    // Register User A and User B
    const userA = await regService.register({ email: userAEmail, password, displayName: "User A" });
    await regService.register({ email: userBEmail, password, displayName: "User B" });

    const loginA = await loginService.login({ email: userAEmail, password });
    const loginB = await loginService.login({ email: userBEmail, password });

    // Grant ADMIN to User A only
    await assignRoleToExistingUser({ userId: userA.user.id, roleCode: ROLES.ADMIN }, userRepo, roleRepo);

    // User A succeeds
    const resA = await request(app)
      .get("/admin/ping")
      .set("Authorization", `Bearer ${loginA.accessToken}`)
      .expect(HTTP_STATUS.OK);
    expect(resA.body.status).toBe("ok");

    // User B is still denied with 403
    const resB = await request(app)
      .get("/admin/ping")
      .set("Authorization", `Bearer ${loginB.accessToken}`)
      .expect(HTTP_STATUS.FORBIDDEN);
    expect(resB.body.error.code).toBe("FORBIDDEN");
  });

  it("verifies malformed persisted role records in PostgreSQL: ROOT gets 403, ROOT+ADMIN gets 200", async () => {
    const email = "db.admin.malformed@auracapital.local";
    const password = "valid-secure-password-12345";

    const user = await regService.register({ email, password, displayName: "Malformed Role User" });
    const login = await loginService.login({ email, password });

    // 1. Create a non-canonical role "ROOT" in PostgreSQL and assign to user
    const rootRole = await roleRepo.createRole("ROOT", "Superuser role");
    await roleRepo.assignRoleToUser(user.user.id, rootRole.id);

    // Request with only "ROOT" in DB -> canonicalizes to [] -> 403 FORBIDDEN
    const resRootOnly = await request(app)
      .get("/admin/ping")
      .set("Authorization", `Bearer ${login.accessToken}`)
      .expect(HTTP_STATUS.FORBIDDEN);
    expect(resRootOnly.body.error.code).toBe("FORBIDDEN");

    // 2. Also assign canonical ADMIN role to user (user now has ["ROOT", "ADMIN"])
    await assignRoleToExistingUser({ userId: user.user.id, roleCode: ROLES.ADMIN }, userRepo, roleRepo);

    // Request with ["ROOT", "ADMIN"] in DB -> canonicalizes to ["ADMIN"] -> 200 OK
    const resRootAndAdmin = await request(app)
      .get("/admin/ping")
      .set("Authorization", `Bearer ${login.accessToken}`)
      .expect(HTTP_STATUS.OK);
    expect(resRootAndAdmin.body).toEqual({
      status: "ok",
      scope: "admin",
    });
  });
});
