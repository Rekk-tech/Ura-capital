import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import { assertSafeTestDatabase, sanitizeDiagnosticMessage, cleanAllTestTables } from "../helpers/test-db-guard.js";
import { RegistrationService } from "../../src/modules/auth/registration.service.js";
import { LoginService } from "../../src/modules/auth/login.service.js";
import { RefreshTokenService } from "../../src/modules/auth/refresh-token.service.js";
import { LogoutService } from "../../src/modules/auth/logout.service.js";
import { passwordHashingService } from "../../src/modules/auth/password-hashing.service.js";
import { accessTokenService } from "../../src/modules/auth/access-token.service.js";
import { AuditService } from "../../src/modules/auth/audit.service.js";
import { createRepositoryContainer } from "../../src/infrastructure/database/repository-factory.js";
import { PrismaTransactionRunner } from "../../src/infrastructure/database/transaction-runner.js";
import { PrismaRefreshSessionRepository } from "../../src/modules/auth/refresh-session.repository.js";
import { AppError } from "../../src/shared/errors/error-envelope.js";
import { ERROR_CODES, HTTP_STATUS } from "@aura/shared";

describe("Logout PostgreSQL Database Integration & Revocation (Integration)", () => {
  const testDbUrl =
    process.env.TEST_DATABASE_URL ||
    process.env.DATABASE_URL ||
    "postgresql://postgres:postgrespassword@localhost:5432/aura_capital_test";

  let prisma: PrismaClient;
  let regService: RegistrationService;
  let loginService: LoginService;
  let refreshService: RefreshTokenService;
  let logoutService: LogoutService;

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
      await cleanAllTestTables(prisma);

      const repos = createRepositoryContainer(prisma);
      const auditService = new AuditService(repos.auditRepo);
      const txRunner = new PrismaTransactionRunner(prisma);

      regService = new RegistrationService(repos.userRepo, txRunner, passwordHashingService);
      refreshService = new RefreshTokenService(undefined, repos.sessionRepo, repos.userRepo, accessTokenService, auditService);
      loginService = new LoginService(repos.userRepo, repos.credentialRepo, passwordHashingService, accessTokenService, refreshService, auditService);
      logoutService = new LogoutService(repos.sessionRepo, refreshService, auditService);
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

  it("durably revokes the current active session in PostgreSQL with revocationReason USER_LOGOUT", async () => {
    const email = "db.logout.active@auracapital.local";
    const password = "valid-secure-password-12345";
    const displayName = "DB Logout User";

    // 1. Register & Login
    const registered = await regService.register({ email, password, displayName });
    const loginResult = await loginService.login({ email, password });
    const rawToken = loginResult.rawRefreshToken!;

    // 2. Perform Logout
    const logoutResult = await logoutService.logout(rawToken);
    expect(logoutResult.revoked).toBe(true);

    // 3. Inspect PostgreSQL session state
    const tokenHash = refreshService.computeTokenHash(rawToken);
    const session = await prisma.refreshSession.findUnique({
      where: { tokenHash },
    });

    expect(session).toBeDefined();
    expect(session?.userId).toBe(registered.user.id);
    expect(session?.isRevoked).toBe(true);
    expect(session?.revokedAt).toBeInstanceOf(Date);
    expect(session?.revocationReason).toBe("USER_LOGOUT");
    expect(session?.reusedAt).toBeNull(); // Must NOT be marked as REPLAY_DETECTED
  });

  it("rejects refresh attempt after logout and mints no access token", async () => {
    const email = "db.logout.refresh.reject@auracapital.local";
    const password = "valid-secure-password-12345";

    await regService.register({ email, password, displayName: "Refresh Reject User" });
    const loginResult = await loginService.login({ email, password });
    const rawToken = loginResult.rawRefreshToken!;

    // Logout
    await logoutService.logout(rawToken);

    // Attempt refresh using logged-out token
    try {
      await refreshService.refresh(rawToken);
      expect.unreachable("Refresh using logged-out token must fail");
    } catch (err: unknown) {
      expect(err).toBeInstanceOf(AppError);
      const appErr = err as AppError;
      expect(appErr.statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(appErr.code).toBe(ERROR_CODES.UNAUTHENTICATED);
    }
  });

  it("is current-session-only: revoking one session leaves other sessions for same user and other users active", async () => {
    const emailA = "db.logout.userA@auracapital.local";
    const emailB = "db.logout.userB@auracapital.local";
    const password = "valid-secure-password-12345";

    // User A registers and creates 2 sessions (e.g. 2 devices/browsers)
    await regService.register({ email: emailA, password, displayName: "User A" });
    const loginA1 = await loginService.login({ email: emailA, password });
    const tokenA1 = loginA1.rawRefreshToken!;
    const loginA2 = await loginService.login({ email: emailA, password });
    const tokenA2 = loginA2.rawRefreshToken!;

    // User B registers and creates 1 session
    await regService.register({ email: emailB, password, displayName: "User B" });
    const loginB1 = await loginService.login({ email: emailB, password });
    const tokenB1 = loginB1.rawRefreshToken!;

    // Logout only session A1
    const logoutRes = await logoutService.logout(tokenA1);
    expect(logoutRes.revoked).toBe(true);

    // Verify session A1 is revoked
    const hashA1 = refreshService.computeTokenHash(tokenA1);
    const sessionA1 = await prisma.refreshSession.findUnique({ where: { tokenHash: hashA1 } });
    expect(sessionA1?.isRevoked).toBe(true);
    expect(sessionA1?.revocationReason).toBe("USER_LOGOUT");

    // Verify session A2 remains active and can refresh!
    const hashA2 = refreshService.computeTokenHash(tokenA2);
    const sessionA2 = await prisma.refreshSession.findUnique({ where: { tokenHash: hashA2 } });
    expect(sessionA2?.isRevoked).toBe(false);
    expect(sessionA2?.revocationReason).toBeNull();

    const refreshA2Result = await refreshService.refresh(tokenA2);
    expect(refreshA2Result.accessToken).toBeDefined();

    // Verify session B1 remains active
    const hashB1 = refreshService.computeTokenHash(tokenB1);
    const sessionB1 = await prisma.refreshSession.findUnique({ where: { tokenHash: hashB1 } });
    expect(sessionB1?.isRevoked).toBe(false);
  });

  it("handles concurrent logout and refresh races deterministically without leaving orphan active sessions", async () => {
    const email = "db.logout.concurrency@auracapital.local";
    const password = "valid-secure-password-12345";

    await regService.register({ email, password, displayName: "Concurrency Logout User" });
    const loginResult = await loginService.login({ email, password });
    const sharedToken = loginResult.rawRefreshToken!;

    // Launch simultaneous logout and refresh on the same token
    const [logoutRes, refreshRes] = await Promise.allSettled([
      logoutService.logout(sharedToken),
      refreshService.refresh(sharedToken),
    ]);

    // Outcome is safe:
    // If logout won: logoutRes fulfilled with revoked=true, refreshRes rejected with 401
    // If refresh won: refreshRes fulfilled with new tokens, logoutRes fulfilled with revoked=false (old session already rotated)
    expect(logoutRes.status).toBe("fulfilled");
    expect(["fulfilled", "rejected"]).toContain(refreshRes.status);

    // Database verification: verify token family has at most 1 active session
    const tokenHash = refreshService.computeTokenHash(sharedToken);
    const initialSession = await prisma.refreshSession.findUnique({ where: { tokenHash } });
    const familyId = initialSession!.familyId;

    const familySessions = await prisma.refreshSession.findMany({ where: { familyId } });
    const activeSessions = familySessions.filter((s) => !s.isRevoked && s.rotatedAt === null);

    expect(activeSessions.length).toBeLessThanOrEqual(1);
  });

  it("maintains transactional integrity and does not modify session if revocation fails (DB failure simulation)", async () => {
    const email = "db.logout.tx.rollback@auracapital.local";
    const password = "valid-secure-password-12345";

    await regService.register({ email, password, displayName: "Rollback Logout User" });
    const loginResult = await loginService.login({ email, password });
    const rawToken = loginResult.rawRefreshToken!;
    const tokenHash = refreshService.computeTokenHash(rawToken);

    // Initial state: active session
    const initialSession = await prisma.refreshSession.findUnique({ where: { tokenHash } });
    expect(initialSession?.isRevoked).toBe(false);

    // Failing repo simulating DB error during revokeSession
    const failingRepo = new (class extends PrismaRefreshSessionRepository {
      override async revokeSession() {
        throw new Error("Simulated Database I/O Failure During Logout Revocation");
      }
    })(prisma);

    const serviceWithFailingRepo = new LogoutService(failingRepo, refreshService);

    await expect(serviceWithFailingRepo.logout(rawToken)).rejects.toThrow(
      "Simulated Database I/O Failure During Logout Revocation",
    );

    // Session remains unrevoked in PostgreSQL
    const sessionAfterFail = await prisma.refreshSession.findUnique({ where: { tokenHash } });
    expect(sessionAfterFail?.isRevoked).toBe(false);
  });
});
