import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import { assertSafeTestDatabase, sanitizeDiagnosticMessage, cleanAllTestTables } from "../helpers/test-db-guard.js";
import { RegistrationService } from "../../src/modules/auth/registration.service.js";
import { LoginService } from "../../src/modules/auth/login.service.js";
import { passwordHashingService } from "../../src/modules/auth/password-hashing.service.js";
import { accessTokenService } from "../../src/modules/auth/access-token.service.js";
import { AuditService } from "../../src/modules/auth/audit.service.js";
import { RefreshTokenService } from "../../src/modules/auth/refresh-token.service.js";
import { createRepositoryContainer } from "../../src/infrastructure/database/repository-factory.js";
import { PrismaTransactionRunner } from "../../src/infrastructure/database/transaction-runner.js";
import { AppError } from "../../src/shared/errors/error-envelope.js";
import { ERROR_CODES, HTTP_STATUS } from "@aura/shared";

describe("Login PostgreSQL Real Database Integration (Integration)", () => {
  const testDbUrl =
    process.env.TEST_DATABASE_URL ||
    process.env.DATABASE_URL ||
    "postgresql://postgres:postgrespassword@localhost:5432/aura_capital_test";

  let prisma: PrismaClient;
  let regService: RegistrationService;
  let loginService: LoginService;

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
      const refreshService = new RefreshTokenService(undefined, repos.sessionRepo, repos.userRepo, accessTokenService, auditService);

      regService = new RegistrationService(repos.userRepo, txRunner, passwordHashingService);
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

  it("authenticates existing user against real PostgreSQL database and returns verified access token", async () => {
    const email = "db.login.user@auracapital.local";
    const password = "valid-secure-password-12345";
    const displayName = "DB Login User";

    // 1. Seed user via registration service
    const registered = await regService.register({
      email,
      password,
      displayName,
    });

    // 2. Perform login
    const loginResult = await loginService.login({
      email,
      password,
    });

    expect(loginResult.accessToken).toBeDefined();
    expect(loginResult.tokenType).toBe("Bearer");
    expect(loginResult.expiresIn).toBe(15 * 60);
    expect(loginResult.user.id).toBe(registered.user.id);
    expect(loginResult.user.email).toBe(email);
    expect(loginResult.user.displayName).toBe(displayName);
    expect(loginResult.user.status).toBe("ACTIVE");

    // 3. Verify issued token using access token verifier
    const verifiedClaims = accessTokenService.verifyAccessToken(loginResult.accessToken);
    expect(verifiedClaims.sub).toBe(registered.user.id);
    expect(verifiedClaims.typ).toBe("access");
  });

  it("normalizes email on login and authenticates user registered with different casing", async () => {
    const password = "valid-secure-password-12345";

    // Attempt login with whitespace and uppercase
    const loginResult = await loginService.login({
      email: "  DB.LOGIN.USER@AuraCapital.Local  ",
      password,
    });

    expect(loginResult.accessToken).toBeDefined();
    expect(loginResult.user.email).toBe("db.login.user@auracapital.local");
  });

  it("rejects wrong password against real PostgreSQL credential with safe 401 error", async () => {
    try {
      await loginService.login({
        email: "db.login.user@auracapital.local",
        password: "incorrect-password-12345",
      });
      expect.unreachable("Login with incorrect password should have thrown");
    } catch (err: unknown) {
      expect(err).toBeInstanceOf(AppError);
      const appErr = err as AppError;
      expect(appErr.statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(appErr.code).toBe(ERROR_CODES.UNAUTHENTICATED);
      expect(appErr.message).toBe("Invalid email or password");
    }
  });

  it("rejects unknown user against real database with externally identical 401 error", async () => {
    try {
      await loginService.login({
        email: "nonexistent.user@auracapital.local",
        password: "any-password-value-12345",
      });
      expect.unreachable("Login for nonexistent user should have thrown");
    } catch (err: unknown) {
      expect(err).toBeInstanceOf(AppError);
      const appErr = err as AppError;
      expect(appErr.statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(appErr.code).toBe(ERROR_CODES.UNAUTHENTICATED);
      expect(appErr.message).toBe("Invalid email or password");
    }
  });
});
