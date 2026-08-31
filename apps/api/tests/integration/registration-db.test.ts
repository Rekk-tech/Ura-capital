import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import { assertSafeTestDatabase, sanitizeDiagnosticMessage } from "../helpers/test-db-guard.js";
import {
  RegistrationService,
} from "../../src/modules/auth/registration.service.js";
import {
  passwordHashingService,
} from "../../src/modules/auth/password-hashing.service.js";
import {
  PrismaUserRepository,
  type IUserRepository,
} from "../../src/modules/users/user.repository.js";
import {
  PrismaCredentialRepository,
  type ICredentialRepository,
} from "../../src/modules/auth/credential.repository.js";
import { AppError } from "../../src/shared/errors/error-envelope.js";
import { ERROR_CODES, HTTP_STATUS } from "@aura/shared";

describe("Registration PostgreSQL Database Constraints & Persistence (Integration)", () => {
  const testDbUrl =
    process.env.TEST_DATABASE_URL ||
    process.env.DATABASE_URL ||
    "postgresql://postgres:postgrespassword@localhost:5432/aura_capital_test";

  let prisma: PrismaClient;
  let service: RegistrationService;

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

      // Clean up previous test artifacts
      await prisma.userRole.deleteMany();
      await prisma.credential.deleteMany();
      await prisma.refreshSession.deleteMany();
      await prisma.authSecurityAuditRecord.deleteMany();
      await prisma.role.deleteMany();
      await prisma.user.deleteMany();

      service = new RegistrationService();
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
        // Ignore cleanup errors during teardown
      } finally {
        await prisma.$disconnect();
      }
    }
  });

  it("atomically creates User and Credential in real PostgreSQL with Argon2id hash", async () => {
    const rawEmail = "  RealUser@AuraCapital.Local  ";
    const password = "valid-secure-password-12345";
    const displayName = "Real User";

    const response = await service.register({
      email: rawEmail,
      password,
      displayName,
    });

    // 1. Verify response shape
    expect(response.user.id).toBeDefined();
    expect(response.user.email).toBe("realuser@auracapital.local"); // Normalized
    expect(response.user.displayName).toBe("Real User");
    expect(response.user.status).toBe("ACTIVE");

    // 2. Verify durable User record in database
    const dbUser = await prisma.user.findUnique({
      where: { id: response.user.id },
    });
    expect(dbUser).not.toBeNull();
    expect(dbUser?.email).toBe("realuser@auracapital.local");

    // 3. Verify durable Credential record in database
    const dbCred = await prisma.credential.findUnique({
      where: { userId: response.user.id },
    });
    expect(dbCred).not.toBeNull();
    expect(dbCred?.type).toBe("PASSWORD");

    // 4. Verify password hash is Argon2id and NOT plaintext
    expect(dbCred?.passwordHash.startsWith("$argon2id$v=19$m=19456,t=2,p=1$")).toBe(true);
    expect(dbCred?.passwordHash).not.toEqual(password);

    // 5. Verify stored hash verifies against original password
    const isVerified = await passwordHashingService.verifyPassword(dbCred!.passwordHash, password);
    expect(isVerified).toBe(true);
  });

  it("persists distinct Argon2id hashes for identical passwords due to unique salts", async () => {
    const password = "shared-password-value-12345";

    const user1Res = await service.register({
      email: "user_one@auracapital.local",
      password,
    });

    const user2Res = await service.register({
      email: "user_two@auracapital.local",
      password,
    });

    const cred1 = await prisma.credential.findUnique({ where: { userId: user1Res.user.id } });
    const cred2 = await prisma.credential.findUnique({ where: { userId: user2Res.user.id } });

    expect(cred1).not.toBeNull();
    expect(cred2).not.toBeNull();
    expect(cred1?.passwordHash).not.toEqual(cred2?.passwordHash);

    // Both distinct hashes must still verify the password
    expect(await passwordHashingService.verifyPassword(cred1!.passwordHash, password)).toBe(true);
    expect(await passwordHashingService.verifyPassword(cred2!.passwordHash, password)).toBe(true);
  });

  it("rejects duplicate normalized email and preserves single user/credential integrity", async () => {
    const email = "duplicate.test@auracapital.local";
    const password = "secure-password-12345";

    // 1. Initial registration
    await service.register({ email, password });

    // 2. Attempt registration with matching normalized email in different casing
    try {
      await service.register({
        email: "DUPLICATE.TEST@auracapital.local",
        password: "different-password-12345",
      });
      expect.unreachable("Duplicate registration should have been rejected");
    } catch (err: unknown) {
      expect(err).toBeInstanceOf(AppError);
      const appErr = err as AppError;
      expect(appErr.statusCode).toBe(HTTP_STATUS.CONFLICT);
      expect(appErr.code).toBe(ERROR_CODES.AUTH_EMAIL_ALREADY_EXISTS);
    }

    // 3. Verify exactly one user and one credential exist
    const users = await prisma.user.findMany({ where: { email } });
    expect(users.length).toBe(1);

    const creds = await prisma.credential.findMany({ where: { userId: users[0].id } });
    expect(creds.length).toBe(1);
  });

  it("verifies atomic rollback: leaves zero partial user or credential records when credential persistence fails", async () => {
    const rollbackEmail = "rollback.atomic.test@auracapital.local";
    const password = "secure-password-12345";

    // Custom repository factory where credential creation fails inside transaction
    const failingCredRepoFactory = (client: PrismaClient) => {
      const realUserRepo = new PrismaUserRepository(client);
      const realCredRepo = new PrismaCredentialRepository(client);

      const failingCredRepo: ICredentialRepository = {
        findByUserId: (userId) => realCredRepo.findByUserId(userId),
        create: async () => {
          throw new Error("Simulated database failure during credential creation");
        },
        updatePasswordHash: (userId, hash, v) => realCredRepo.updatePasswordHash(userId, hash, v),
        deleteByUserId: (userId) => realCredRepo.deleteByUserId(userId),
      };

      return {
        userRepo: realUserRepo,
        credRepo: failingCredRepo,
      };
    };

    const failingService = new RegistrationService(prisma, failingCredRepoFactory);

    // Attempt registration which will fail at step 2 of transaction
    await expect(
      failingService.register({
        email: rollbackEmail,
        password,
        displayName: "Rollback User",
      }),
    ).rejects.toThrow(/Failed to register account/);

    // Assert that step 1 (User creation) was fully rolled back in PostgreSQL
    const userInDb = await prisma.user.findUnique({
      where: { email: rollbackEmail },
    });
    expect(userInDb).toBeNull();

    const credsInDb = await prisma.credential.findMany();
    expect(credsInDb.some((c) => c.passwordHash.includes("rollback"))).toBe(false);
  });

  it("verifies database unique constraint race mapping (P2002) at registration service level", async () => {
    const raceEmail = "race.duplicate.test@auracapital.local";
    const password = "secure-password-12345";

    // 1. Create first user normally
    await service.register({ email: raceEmail, password });

    // 2. Custom repository factory simulating pre-check race where findByEmail returns null (bypassing pre-check),
    // but txUserRepo.create hits PostgreSQL's unique constraint (P2002)
    const racingRepoFactory = (client: PrismaClient) => {
      const realUserRepo = new PrismaUserRepository(client);
      const realCredRepo = new PrismaCredentialRepository(client);

      const racingUserRepo: IUserRepository = {
        findById: (id) => realUserRepo.findById(id),
        findByEmail: async () => null, // simulates concurrent race window where pre-check saw no user
        create: (input) => realUserRepo.create(input),
        update: (id, input) => realUserRepo.update(id, input),
        delete: (id) => realUserRepo.delete(id),
      };

      return {
        userRepo: racingUserRepo,
        credRepo: realCredRepo,
      };
    };

    const racingService = new RegistrationService(prisma, racingRepoFactory);

    try {
      await racingService.register({ email: raceEmail, password: "another-password-123" });
      expect.unreachable("Database unique constraint race should have been mapped to conflict");
    } catch (err: unknown) {
      expect(err).toBeInstanceOf(AppError);
      const appErr = err as AppError;
      expect(appErr.statusCode).toBe(HTTP_STATUS.CONFLICT);
      expect(appErr.code).toBe(ERROR_CODES.AUTH_EMAIL_ALREADY_EXISTS);
      expect(appErr.message).toBe("An account with this email address already exists.");
    }

    // Verify DB integrity: still only 1 user exists
    const users = await prisma.user.findMany({ where: { email: raceEmail } });
    expect(users.length).toBe(1);
  });
});
