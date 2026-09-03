import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import { assertSafeTestDatabase, sanitizeDiagnosticMessage, cleanAllTestTables } from "../helpers/test-db-guard.js";
import { RegistrationService } from "../../src/modules/auth/registration.service.js";
import { LoginService } from "../../src/modules/auth/login.service.js";
import { RefreshTokenService } from "../../src/modules/auth/refresh-token.service.js";
import { passwordHashingService } from "../../src/modules/auth/password-hashing.service.js";
import { accessTokenService } from "../../src/modules/auth/access-token.service.js";
import { AuditService } from "../../src/modules/auth/audit.service.js";
import { createRepositoryContainer } from "../../src/infrastructure/database/repository-factory.js";
import { PrismaTransactionRunner } from "../../src/infrastructure/database/transaction-runner.js";
import { PrismaRefreshSessionRepository } from "../../src/modules/auth/refresh-session.repository.js";
import { AppError } from "../../src/shared/errors/error-envelope.js";
import { ERROR_CODES, HTTP_STATUS } from "@aura/shared";

describe("Refresh PostgreSQL Database Integration & Security (Integration)", () => {
  const testDbUrl =
    process.env.TEST_DATABASE_URL ||
    process.env.DATABASE_URL ||
    "postgresql://postgres:postgrespassword@localhost:5432/aura_capital_test";

  let prisma: PrismaClient;
  let regService: RegistrationService;
  let loginService: LoginService;
  let refreshService: RefreshTokenService;

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

  it("creates a durable refresh session in PostgreSQL on login without storing raw token", async () => {
    const email = "db.refresh.user@auracapital.local";
    const password = "valid-secure-password-12345";
    const displayName = "DB Refresh User";

    // 1. Register user
    const registered = await regService.register({ email, password, displayName });

    // 2. Login
    const loginResult = await loginService.login({ email, password });
    expect(loginResult.rawRefreshToken).toBeDefined();
    expect(loginResult.accessToken).toBeDefined();

    // 3. Inspect database for refresh session
    const sessions = await prisma.refreshSession.findMany({
      where: { userId: registered.user.id },
    });

    expect(sessions).toHaveLength(1);
    const session = sessions[0];
    expect(session.isRevoked).toBe(false);
    expect(session.familyId).toBeDefined();
    expect(session.tokenHash).toBeDefined();

    // Assert raw token is NEVER stored in database
    expect(session.tokenHash).not.toBe(loginResult.rawRefreshToken);
    expect(session.tokenHash).toBe(refreshService.computeTokenHash(loginResult.rawRefreshToken!));
  });

  it("rotates refresh token, invalidates old session, and mints verified access token", async () => {
    const email = "db.refresh.rotation@auracapital.local";
    const password = "valid-secure-password-12345";

    // 1. Register and login
    const registered = await regService.register({ email, password, displayName: "Rotation User" });
    const loginResult = await loginService.login({ email, password });
    const initialRawToken = loginResult.rawRefreshToken!;

    // 2. Execute refresh
    const refreshResult = await refreshService.refresh(initialRawToken);

    expect(refreshResult.accessToken).toBeDefined();
    expect(refreshResult.newRawToken).toBeDefined();
    expect(refreshResult.newRawToken).not.toBe(initialRawToken);
    expect(refreshResult.user.id).toBe(registered.user.id);

    // 3. Verify newly issued access token with AccessTokenService
    const verifiedClaims = accessTokenService.verifyAccessToken(refreshResult.accessToken);
    expect(verifiedClaims.sub).toBe(registered.user.id);
    expect(verifiedClaims.typ).toBe("access");

    // 4. Verify PostgreSQL session state transition
    const initialHash = refreshService.computeTokenHash(initialRawToken);
    const oldSession = await prisma.refreshSession.findUnique({
      where: { tokenHash: initialHash },
    });

    expect(oldSession).toBeDefined();
    expect(oldSession?.isRevoked).toBe(true);
    expect(oldSession?.rotatedAt).toBeInstanceOf(Date);
    expect(oldSession?.revocationReason).toBe("ROTATED");
    expect(oldSession?.replacedBySessionId).toBeDefined();

    const newHash = refreshService.computeTokenHash(refreshResult.newRawToken);
    const newSession = await prisma.refreshSession.findUnique({
      where: { tokenHash: newHash },
    });

    expect(newSession).toBeDefined();
    expect(newSession?.id).toBe(oldSession?.replacedBySessionId);
    expect(newSession?.familyId).toBe(oldSession?.familyId);
    expect(newSession?.isRevoked).toBe(false);
  });

  it("handles concurrent refresh attempts safely: exactly one winner succeeds, winner token remains usable, and family is NOT spuriously revoked (DEF-003)", async () => {
    const email = "db.refresh.concurrency.winner@auracapital.local";
    const password = "valid-secure-password-12345";

    // 1. Register and login
    await regService.register({ email, password, displayName: "Concurrency Winner User" });
    const loginResult = await loginService.login({ email, password });
    const sharedRawToken = loginResult.rawRefreshToken!;

    // 2. Launch 2 simultaneous refresh operations with the exact same token
    const results = await Promise.allSettled([
      refreshService.refresh(sharedRawToken),
      refreshService.refresh(sharedRawToken),
    ]);

    const fulfilled = results.filter(
      (r): r is PromiseFulfilledResult<import("../../src/modules/auth/refresh-token.service.js").RefreshResult> =>
        r.status === "fulfilled",
    );
    const rejected = results.filter((r): r is PromiseRejectedResult => r.status === "rejected");

    // Exactly 1 request succeeds and 1 fails
    expect(fulfilled.length).toBe(1);
    expect(rejected.length).toBe(1);

    const winnerResult = fulfilled[0].value;
    const loserReason = rejected[0].reason;

    // Loser receives safe 401 UNAUTHENTICATED
    expect(loserReason).toBeInstanceOf(AppError);
    expect((loserReason as AppError).statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
    expect((loserReason as AppError).code).toBe(ERROR_CODES.UNAUTHENTICATED);

    // 3. Database state inspection: exactly ONE active surviving descendant in the family
    const initialHash = refreshService.computeTokenHash(sharedRawToken);
    const initialSession = await prisma.refreshSession.findUnique({
      where: { tokenHash: initialHash },
    });
    const familyId = initialSession!.familyId;

    const familySessions = await prisma.refreshSession.findMany({
      where: { familyId },
    });

    // Initial session (consumed) + replacement session (active)
    expect(familySessions).toHaveLength(2);

    const activeSessions = familySessions.filter((s) => !s.isRevoked && s.rotatedAt === null);
    expect(activeSessions).toHaveLength(1);

    const replacementHash = refreshService.computeTokenHash(winnerResult.newRawToken);
    expect(activeSessions[0].tokenHash).toBe(replacementHash);
    expect(activeSessions[0].isRevoked).toBe(false);

    // 4. Critical assertion: verify the winner's new token remains valid and usable for subsequent refresh!
    const subsequentRefresh = await refreshService.refresh(winnerResult.newRawToken);
    expect(subsequentRefresh.accessToken).toBeDefined();
    expect(subsequentRefresh.newRawToken).toBeDefined();
  });

  it("detects post-rotation replay of consumed token, rejects refresh, and invalidates the entire token family", async () => {
    const email = "db.refresh.replay@auracapital.local";
    const password = "valid-secure-password-12345";

    // 1. Register and login
    await regService.register({ email, password, displayName: "Replay User" });
    const loginResult = await loginService.login({ email, password });
    const initialToken = loginResult.rawRefreshToken!;

    // 2. First refresh (valid rotation from initialToken to latestToken)
    const firstRefresh = await refreshService.refresh(initialToken);
    const latestToken = firstRefresh.newRawToken;

    // 3. Replay attempt using the OLD consumed token (post-rotation)
    try {
      await refreshService.refresh(initialToken);
      expect.unreachable("Replay of old refresh token must be rejected");
    } catch (err: unknown) {
      expect(err).toBeInstanceOf(AppError);
      const appErr = err as AppError;
      expect(appErr.statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(appErr.code).toBe(ERROR_CODES.UNAUTHENTICATED);
    }

    // 4. Verify token family was revoked in PostgreSQL with REPLAY_DETECTED
    const initialHash = refreshService.computeTokenHash(initialToken);
    const oldSession = await prisma.refreshSession.findUnique({
      where: { tokenHash: initialHash },
    });
    const familyId = oldSession!.familyId;

    const allFamilySessions = await prisma.refreshSession.findMany({
      where: { familyId },
    });

    for (const session of allFamilySessions) {
      expect(session.isRevoked).toBe(true);
    }

    // 5. Verify the latest token in the family is now also unusable
    try {
      await refreshService.refresh(latestToken);
      expect.unreachable("Latest token must be unusable after family compromise");
    } catch (err: unknown) {
      expect(err).toBeInstanceOf(AppError);
      const appErr = err as AppError;
      expect(appErr.statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(appErr.code).toBe(ERROR_CODES.UNAUTHENTICATED);
    }
  });

  it("maintains database transactional integrity and rollback upon simulated repository error during rotation (DEF-004)", async () => {
    const email = "db.refresh.tx.rollback@auracapital.local";
    const password = "valid-secure-password-12345";

    await regService.register({ email, password, displayName: "Rollback User" });
    const loginResult = await loginService.login({ email, password });
    const rawToken = loginResult.rawRefreshToken!;
    const tokenHash = refreshService.computeTokenHash(rawToken);

    // Initial state: 1 active session
    const initialSession = await prisma.refreshSession.findUnique({
      where: { tokenHash },
    });
    expect(initialSession?.isRevoked).toBe(false);
    expect(initialSession?.rotatedAt).toBeNull();

    // Mock prisma to throw an error inside transaction create
    const failingRepo = new (class extends PrismaRefreshSessionRepository {
      override async rotateSession(currentSessionId: string) {
        return prisma.$transaction(async (tx) => {
          // Update current session
          await tx.refreshSession.updateMany({
            where: { id: currentSessionId },
            data: { rotatedAt: new Date(), isRevoked: true, revocationReason: "ROTATED" },
          });

          // Simulate unrecoverable DB error before commit
          throw new Error("Simulated Database I/O Failure During Transaction");
        });
      }
    })(prisma);

    const serviceWithFailingRepo = new RefreshTokenService(
      undefined,
      failingRepo,
      undefined,
      accessTokenService,
    );

    await expect(serviceWithFailingRepo.refresh(rawToken)).rejects.toThrow(
      "Simulated Database I/O Failure During Transaction",
    );

    // Verify transaction rollback: initial session MUST still be intact and unrotated in PostgreSQL
    const sessionAfterRollback = await prisma.refreshSession.findUnique({
      where: { tokenHash },
    });
    expect(sessionAfterRollback?.isRevoked).toBe(false);
    expect(sessionAfterRollback?.rotatedAt).toBeNull();
  });
});
