import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import { assertSafeTestDatabase, sanitizeDiagnosticMessage } from "../helpers/test-db-guard.js";
import { PrismaAuditRepository } from "../../src/modules/auth/audit.repository.js";
import {
  AUDIT_EVENT_TYPES,
  AUDIT_OUTCOMES,
  OPERATION_SOURCES,
} from "../../src/modules/auth/audit-event.constants.js";
import {
  assignRoleToExistingUser,
  removeRoleFromExistingUser,
} from "../../src/modules/auth/role.seed.js";
import { PrismaUserRepository } from "../../src/modules/users/user.repository.js";
import { PrismaCredentialRepository } from "../../src/modules/auth/credential.repository.js";
import { PrismaRoleRepository } from "../../src/modules/auth/role.repository.js";
import { PrismaRefreshSessionRepository } from "../../src/modules/auth/refresh-session.repository.js";
import { RegistrationService } from "../../src/modules/auth/registration.service.js";
import { RefreshTokenService } from "../../src/modules/auth/refresh-token.service.js";
import { LogoutService } from "../../src/modules/auth/logout.service.js";
import { AuditService } from "../../src/modules/auth/audit.service.js";
import { passwordHashingService } from "../../src/modules/auth/password-hashing.service.js";
import { accessTokenService } from "../../src/modules/auth/access-token.service.js";
import { ROLES } from "../../src/modules/auth/authorization.constants.js";
import { AppError } from "../../src/shared/errors/error-envelope.js";
import { ERROR_CODES, HTTP_STATUS } from "@aura/shared";
import { transactionRunner } from "../../src/infrastructure/database/transaction-runner.js";

const dbUrl =
  process.env.TEST_DATABASE_URL ||
  process.env.DATABASE_URL ||
  "postgresql://postgres:postgrespassword@localhost:5432/aura_capital_test_feat009";

describe("FEAT-009 Database-Backed Audit Persistence & Failure Injection (PostgreSQL)", () => {
  let prisma: PrismaClient;
  let auditRepo: PrismaAuditRepository;
  let userRepo: PrismaUserRepository;
  let roleRepo: PrismaRoleRepository;
  let sessionRepo: PrismaRefreshSessionRepository;
  let auditService: AuditService;

  beforeAll(async () => {
    assertSafeTestDatabase(dbUrl);
    prisma = new PrismaClient({ datasources: { db: { url: dbUrl } } });

    try {
      await prisma.$connect();
    } catch (err: unknown) {
      const msg = sanitizeDiagnosticMessage(err instanceof Error ? err.message : String(err));
      throw new Error(`[DB_CONNECTION_FAILED] Required PostgreSQL test database is unreachable. Error: ${msg}`);
    }

    auditRepo = new PrismaAuditRepository(prisma);
    userRepo = new PrismaUserRepository(prisma);
    roleRepo = new PrismaRoleRepository(prisma);
    sessionRepo = new PrismaRefreshSessionRepository(prisma);
    auditService = new AuditService(auditRepo);
  });

  afterAll(async () => {
    if (prisma) {
      await prisma.$disconnect();
    }
  });

  it("persists all approved canonical audit event fields durably with indexes in PostgreSQL", async () => {
    const user = await userRepo.create({
      email: `audit_db_${Date.now()}@example.com`,
      displayName: "DB Audit User",
    });

    const record = await auditRepo.create({
      eventType: AUDIT_EVENT_TYPES.LOGIN_SUCCESS,
      outcome: AUDIT_OUTCOMES.SUCCESS,
      actorUserId: user.id,
      subjectUserId: user.id,
      requestId: "req-db-test-1",
      sessionId: "sess-db-test-1",
      userAgent: "TestAgent/1.0",
      metadata: { sessionId: "sess-db-test-1" },
    });

    expect(record.id).toBeDefined();
    expect(record.eventType).toBe("LOGIN_SUCCESS");
    expect(record.outcome).toBe("SUCCESS");
    expect(record.actorUserId).toBe(user.id);
    expect(record.subjectUserId).toBe(user.id);
    expect(record.requestId).toBe("req-db-test-1");
    expect(record.sessionId).toBe("sess-db-test-1");
    expect(record.userAgent).toBe("TestAgent/1.0");

    const fetched = await auditRepo.findById(record.id);
    expect(fetched).not.toBeNull();
    expect(fetched?.id).toBe(record.id);

    const userEvents = await auditRepo.findByUserId(user.id);
    expect(userEvents.some((e) => e.id === record.id)).toBe(true);
  });

  it("failure injection: coupled ROLE_ASSIGNED failure inside transaction rolls back role assignment in PostgreSQL", async () => {
    const user = await userRepo.create({
      email: `role_tx_fail_${Date.now()}@example.com`,
      displayName: "Role TX Fail User",
    });

    const adminRole = await roleRepo.ensureRoleExists(ROLES.ADMIN, "Admin role");

    // Force audit insert to fail inside the transaction
    const failingRepoFactory = (txClient: PrismaClient | Parameters<typeof prisma.$transaction>[0]) => ({
      roleRepo: new PrismaRoleRepository(txClient as PrismaClient),
      auditRepo: {
        create: async () => {
          throw new AppError(
            "[SIMULATED_DB_ERROR] Audit table write failure inside transaction",
            ERROR_CODES.INTERNAL_ERROR,
            HTTP_STATUS.INTERNAL_SERVER_ERROR,
          );
        },
        findById: async () => null,
        findByUserId: async () => [],
        findByEventType: async () => [],
        findByRequestId: async () => [],
        listForTest: async () => [],
      },
    });

    await expect(
      assignRoleToExistingUser(
        {
          userId: user.id,
          roleCode: ROLES.ADMIN,
          operationSource: OPERATION_SOURCES.OPERATOR,
          requestId: "req-role-fail-1",
        },
        userRepo,
        roleRepo,
        transactionRunner,
        failingRepoFactory as never,
      ),
    ).rejects.toThrow("[SIMULATED_DB_ERROR] Audit table write failure inside transaction");

    // Verify UserRole row was NOT committed in PostgreSQL (atomic transaction rollback)
    const userRoles = await roleRepo.getUserRoles(user.id);
    expect(userRoles.find((r) => r.id === adminRole.id)).toBeUndefined();

    // Verify no ROLE_ASSIGNED audit row was committed
    const auditRows = await auditRepo.findByUserId(user.id);
    expect(auditRows.find((r) => r.eventType === AUDIT_EVENT_TYPES.ROLE_ASSIGNED)).toBeUndefined();
  });

  it("failure injection: coupled REGISTRATION_SUCCESS failure inside transaction rolls back User and Credential in PostgreSQL", async () => {
    const regEmail = `reg_tx_fail_${Date.now()}@example.com`;

    const failingRepoFactory = (txClient: PrismaClient | Parameters<typeof prisma.$transaction>[0]) => ({
      userRepo: new PrismaUserRepository(txClient as PrismaClient),
      credRepo: new PrismaCredentialRepository(txClient as PrismaClient),
      auditRepo: {
        create: async () => {
          throw new Error("[SIMULATED_DB_ERROR] Registration audit write failure inside transaction");
        },
        findById: async () => null,
        findByUserId: async () => [],
        findByEventType: async () => [],
        findByRequestId: async () => [],
        listForTest: async () => [],
      },
    });

    const regService = new RegistrationService(
      prisma,
      failingRepoFactory as never,
      passwordHashingService,
    );

    await expect(
      regService.register(
        {
          email: regEmail,
          password: "ValidSecurePassword123!",
          displayName: "Rollback Registration User",
        },
        { requestId: "req-reg-fail-1" },
      ),
    ).rejects.toThrow();

    // Verify NO User record exists in PostgreSQL
    const foundUser = await userRepo.findByEmail(regEmail);
    expect(foundUser).toBeNull();

    // Verify NO Credential record exists for this email
    const allCreds = await prisma.credential.findMany({
      where: { user: { email: regEmail } },
    });
    expect(allCreds).toHaveLength(0);
  });

  it("failure injection: security-state-first ROLE_REMOVED commits role removal in PostgreSQL even if audit write throws", async () => {
    const user = await userRepo.create({
      email: `role_rem_throw_${Date.now()}@example.com`,
      displayName: "Role Rem Throw User",
    });

    const adminRole = await roleRepo.ensureRoleExists(ROLES.ADMIN, "Admin role");
    await roleRepo.assignRoleToUser(user.id, adminRole.id);

    // Verify role is initially assigned
    const initialRoles = await roleRepo.getUserRoles(user.id);
    expect(initialRoles.some((r) => r.id === adminRole.id)).toBe(true);

    const failingAuditService = new AuditService({
      create: async () => {
        throw new Error("[SIMULATED_AUDIT_ERROR] Audit insert threw error");
      },
      findById: async () => null,
      findByUserId: async () => [],
      findByEventType: async () => [],
      findByRequestId: async () => [],
      listForTest: async () => [],
    });

    // Invoke role removal with throwing audit service
    const result = await removeRoleFromExistingUser(
      {
        userId: user.id,
        roleCode: ROLES.ADMIN,
        operationSource: OPERATION_SOURCES.OPERATOR,
        requestId: "req-role-rem-throw-1",
      },
      userRepo,
      roleRepo,
      failingAuditService,
    );

    expect(result.removed).toBe(true);

    // Target user role MUST remain removed in PostgreSQL (security-state-first)
    const finalRoles = await roleRepo.getUserRoles(user.id);
    expect(finalRoles.find((r) => r.id === adminRole.id)).toBeUndefined();
  });

  it("failure injection: security-state-first REFRESH_REPLAY_DETECTED revokes token family in PostgreSQL even if audit write throws", async () => {
    const user = await userRepo.create({
      email: `replay_service_fail_${Date.now()}@example.com`,
      displayName: "Replay Service Fail User",
    });

    const failingAuditService = new AuditService({
      create: async () => {
        throw new Error("[SIMULATED_AUDIT_ERROR] Replay audit write threw error");
      },
      findById: async () => null,
      findByUserId: async () => [],
      findByEventType: async () => [],
      findByRequestId: async () => [],
      listForTest: async () => [],
    });

    const refreshService = new RefreshTokenService(
      undefined,
      sessionRepo,
      userRepo,
      accessTokenService,
      failingAuditService,
    );

    // 1. Issue initial refresh session
    const { rawToken: rawToken1, session: initialSession } = await refreshService.createLoginSession(user.id);

    // 2. Perform first legitimate rotation
    const rotation1 = await refreshService.refresh(rawToken1);
    expect(rotation1.newRawToken).toBeDefined();

    // 3. Replay old consumed rawToken1 through actual refresh service path
    await expect(
      refreshService.refresh(rawToken1, { requestId: "req-replay-1" }),
    ).rejects.toThrow("Invalid or expired refresh session");

    // 4. Verify in PostgreSQL that the ENTIRE token family is durably revoked
    const familySessions = await prisma.refreshSession.findMany({
      where: { familyId: initialSession.familyId },
    });
    expect(familySessions.length).toBeGreaterThanOrEqual(2);
    for (const sess of familySessions) {
      expect(sess.isRevoked).toBe(true);
      expect(sess.revocationReason).toBe("REPLAY_DETECTED");
    }

    // 5. Successor token is now unusable
    await expect(
      refreshService.refresh(rotation1.newRawToken),
    ).rejects.toThrow("Invalid or expired refresh session");
  });

  it("failure injection: security-state-first LOGOUT_SUCCESS revokes session in PostgreSQL even if audit write throws", async () => {
    const user = await userRepo.create({
      email: `logout_fail_${Date.now()}@example.com`,
      displayName: "Logout Fail User",
    });

    const failingAuditService = new AuditService({
      create: async () => {
        throw new Error("[SIMULATED_AUDIT_ERROR] Logout audit write threw error");
      },
      findById: async () => null,
      findByUserId: async () => [],
      findByEventType: async () => [],
      findByRequestId: async () => [],
      listForTest: async () => [],
    });

    const refreshService = new RefreshTokenService(undefined, sessionRepo, userRepo, accessTokenService, auditService);
    const logoutSvc = new LogoutService(sessionRepo, refreshService, failingAuditService);

    const { rawToken, session: createdSession } = await refreshService.createLoginSession(user.id);

    // Invoke logout with failing audit service
    const result = await logoutSvc.logout(rawToken, { requestId: "req-logout-throw-1" });
    expect(result.revoked).toBe(true);
    expect(result.sessionId).toBe(createdSession.id);

    // Verify session in PostgreSQL is durably revoked with USER_LOGOUT
    const sessionInDb = await sessionRepo.findById(createdSession.id);
    expect(sessionInDb?.isRevoked).toBe(true);
    expect(sessionInDb?.revocationReason).toBe("USER_LOGOUT");

    // Subsequent refresh with that token must fail
    await expect(refreshService.refresh(rawToken)).rejects.toThrow();
  });

  it("strictly prohibits persisting sensitive credentials, tokens, secrets, or raw emails in audit rows (sentinel verification)", async () => {
    const sentinelEmail = `sentinel_email_${Date.now()}@domain.test`;
    const sentinelPassword = "SENTINEL_SECRET_PASSWORD_99999!";
    const sentinelRawToken = "SENTINEL_RAW_REFRESH_TOKEN_ABCDEFGHIJKLMN_123456789";
    const sentinelJwt = "SENTINEL_RAW_JWT_BEARER_TOKEN_HEADER_XYZ";

    const regService = new RegistrationService(prisma, undefined, passwordHashingService);
    const regResult = await regService.register({
      email: sentinelEmail,
      password: sentinelPassword,
      displayName: "Sentinel User",
    });

    const refreshService = new RefreshTokenService(undefined, sessionRepo, userRepo, accessTokenService, auditService);
    await refreshService.createLoginSession(regResult.user.id);

    // Query all persisted audit records in PostgreSQL
    const allRecords = await auditRepo.listForTest(100);
    const forbiddenSentinels = [
      sentinelEmail,
      sentinelPassword,
      sentinelRawToken,
      sentinelJwt,
      "Bearer",
      "passwordHash",
    ];

    for (const rec of allRecords) {
      const serialized = JSON.stringify(rec);
      for (const sentinel of forbiddenSentinels) {
        expect(serialized).not.toContain(sentinel);
      }
      if (rec.metadata && typeof rec.metadata === "object") {
        expect(rec.metadata).not.toHaveProperty("password");
        expect(rec.metadata).not.toHaveProperty("token");
        expect(rec.metadata).not.toHaveProperty("email");
        expect(rec.metadata).not.toHaveProperty("rawToken");
        expect(rec.metadata).not.toHaveProperty("passwordHash");
      }
    }
  });
});
