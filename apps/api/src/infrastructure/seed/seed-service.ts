import type { PrismaClient } from "@prisma/client";
import {
  validateSeedEnvironment,
  buildTestSeedUserEmail,
  buildTestSeedAdminEmail,
  type SeedMode,
  type SeedEnvironmentValidationResult,
  MIN_DEV_SEED_PASSWORD_LENGTH,
} from "@aura/shared";
import { passwordHashingService } from "../../modules/auth/password-hashing.service.js";

export class SeedEnvironmentViolationError extends Error {
  constructor(public readonly errors: string[]) {
    super(`[SEED_ENVIRONMENT_GUARD_VIOLATION] Refusing to execute seed operations:\n${errors.map((e) => `  - ${e}`).join("\n")}`);
    this.name = "SeedEnvironmentViolationError";
  }
}

export interface SeedExecutionResult {
  mode: SeedMode;
  seededUsers: number;
  fixtureLabels: string[];
  rolesEnsured: string[];
  executionDurationMs: number;
}

export interface TestSeedOptions {
  includeTestAdmin?: boolean;
  workerId?: string;
  runId?: string;
  testPassword?: string;
}

export interface CleanupSeedOptions {
  runId?: string;
  workerId?: string;
}

export const DEV_FIXTURE_USERS = [
  {
    email: "dev.user1@aura.internal",
    displayName: "Dev User 1",
  },
  {
    email: "dev.user2@aura.internal",
    displayName: "Dev User 2",
  },
] as const;

export const DEV_FIXTURE_EMAILS = DEV_FIXTURE_USERS.map((u) => u.email);

export const TEST_FIXTURE_USER_BASENAMES = ["test.user1", "test.user2"] as const;

export const DEFAULT_TEST_FIXTURE_PASSWORD = "TestSeedPassword123!";

/**
 * Asserts that the current runtime environment is safe to execute seeds for the given mode.
 * Throws SeedEnvironmentViolationError if validation fails.
 */
export function assertSeedEnvironmentSafe(
  seedMode: SeedMode,
  devPassword?: string,
  envOverrides?: {
    nodeEnv?: string;
    isCi?: boolean;
    databaseUrl?: string;
  },
): SeedEnvironmentValidationResult {
  const nodeEnv = envOverrides?.nodeEnv ?? process.env.NODE_ENV;
  const isCi = envOverrides?.isCi ?? process.env.CI === "true";
  const databaseUrl = envOverrides?.databaseUrl ?? process.env.DATABASE_URL;

  const result = validateSeedEnvironment({
    nodeEnv,
    seedMode,
    isCi,
    databaseUrl,
    devSeedUserPassword: devPassword,
  });

  if (!result.valid) {
    throw new SeedEnvironmentViolationError(result.errors);
  }

  return result;
}

/**
 * Ensures canonical FEAT-007 roles (USER, ADMIN) exist in the database.
 */
export async function ensureCanonicalRoles(prisma: PrismaClient): Promise<{ userRoleId: string; adminRoleId: string }> {
  const userRole = await prisma.role.upsert({
    where: { name: "USER" },
    update: {},
    create: {
      name: "USER",
      description: "Standard registered user with default non-privileged access",
    },
  });

  const adminRole = await prisma.role.upsert({
    where: { name: "ADMIN" },
    update: {},
    create: {
      name: "ADMIN",
      description: "Administrative operator role for server-controlled governance operations",
    },
  });

  return {
    userRoleId: userRole.id,
    adminRoleId: adminRole.id,
  };
}

/**
 * Executes development seed in a single atomic transaction.
 * Requires environment-provided DEV_SEED_USER_PASSWORD (>= 12 chars).
 * Creates local non-real development fixtures with USER role (0 ADMINs).
 */
export async function seedDevelopmentData(
  prisma: PrismaClient,
  devPassword: string,
  envOverrides?: { nodeEnv?: string; isCi?: boolean; databaseUrl?: string },
): Promise<SeedExecutionResult> {
  const startTime = Date.now();

  // 1. Guard check BEFORE any database query or mutation
  assertSeedEnvironmentSafe("development", devPassword, envOverrides);

  if (!devPassword || devPassword.trim().length < MIN_DEV_SEED_PASSWORD_LENGTH) {
    throw new SeedEnvironmentViolationError([
      `DEV_SEED_USER_PASSWORD must be at least ${MIN_DEV_SEED_PASSWORD_LENGTH} characters long.`,
    ]);
  }

  // 2. Hash password with approved Argon2id hashing pipeline
  const passwordHash = await passwordHashingService.hashPassword(devPassword);

  const fixtureLabels: string[] = [];

  // 3. Execute in atomic transaction
  await prisma.$transaction(async (tx) => {
    // A. Ensure roles exist
    const userRole = await tx.role.upsert({
      where: { name: "USER" },
      update: {},
      create: {
        name: "USER",
        description: "Standard registered user with default non-privileged access",
      },
    });

    await tx.role.upsert({
      where: { name: "ADMIN" },
      update: {},
      create: {
        name: "ADMIN",
        description: "Administrative operator role for server-controlled governance operations",
      },
    });

    // B. Seed development fixture users (USER role only)
    for (const fixture of DEV_FIXTURE_USERS) {
      const user = await tx.user.upsert({
        where: { email: fixture.email },
        update: {
          displayName: fixture.displayName,
          status: "ACTIVE",
        },
        create: {
          email: fixture.email,
          displayName: fixture.displayName,
          status: "ACTIVE",
        },
      });

      // Upsert credential
      await tx.credential.upsert({
        where: { userId: user.id },
        update: {
          passwordHash,
          version: 1,
        },
        create: {
          userId: user.id,
          type: "PASSWORD",
          passwordHash,
          version: 1,
        },
      });

      // Assign USER role
      await tx.userRole.upsert({
        where: {
          userId_roleId: {
            userId: user.id,
            roleId: userRole.id,
          },
        },
        update: {},
        create: {
          userId: user.id,
          roleId: userRole.id,
        },
      });

      fixtureLabels.push(fixture.email);
    }
  });

  return {
    mode: "development",
    seededUsers: DEV_FIXTURE_USERS.length,
    fixtureLabels,
    rolesEnsured: ["USER", "ADMIN"],
    executionDurationMs: Date.now() - startTime,
  };
}

/**
 * Computes deterministic test fixture emails scoped by runId and workerId.
 */
export function getTestFixtureEmails(options?: TestSeedOptions): {
  userEmails: string[];
  adminEmail: string;
} {
  const runId = options?.runId || "default";
  const workerId = options?.workerId || "0";

  const userEmails = TEST_FIXTURE_USER_BASENAMES.map((base) => buildTestSeedUserEmail(base, runId, workerId));
  const adminEmail = buildTestSeedAdminEmail(runId, workerId);

  return { userEmails, adminEmail };
}

/**
 * Executes automated test seed in a single atomic transaction.
 * Creates deterministic test fixtures scoped by runId and workerId in isolated test databases.
 */
export async function seedTestData(
  prisma: PrismaClient,
  options?: TestSeedOptions,
  envOverrides?: { nodeEnv?: string; isCi?: boolean; databaseUrl?: string },
): Promise<SeedExecutionResult> {
  const startTime = Date.now();

  const isCi = envOverrides?.isCi ?? process.env.CI === "true";
  const seedMode: SeedMode = isCi ? "ci" : "test";

  // 1. Guard check BEFORE any mutation
  assertSeedEnvironmentSafe(seedMode, undefined, envOverrides);

  // 2. Hash test password
  const testPassword = options?.testPassword ?? DEFAULT_TEST_FIXTURE_PASSWORD;
  const passwordHash = await passwordHashingService.hashPassword(testPassword);

  const fixtureLabels: string[] = [];
  let userCount = 0;

  const { userEmails, adminEmail } = getTestFixtureEmails(options);

  // 3. Execute in atomic transaction
  await prisma.$transaction(async (tx) => {
    // Ensure roles
    const userRole = await tx.role.upsert({
      where: { name: "USER" },
      update: {},
      create: {
        name: "USER",
        description: "Standard registered user with default non-privileged access",
      },
    });

    const adminRole = await tx.role.upsert({
      where: { name: "ADMIN" },
      update: {},
      create: {
        name: "ADMIN",
        description: "Administrative operator role for server-controlled governance operations",
      },
    });

    // Seed standard test users
    for (const [index, email] of userEmails.entries()) {
      const displayName = `Test User ${index + 1}`;

      const user = await tx.user.upsert({
        where: { email },
        update: {
          displayName,
          status: "ACTIVE",
        },
        create: {
          email,
          displayName,
          status: "ACTIVE",
        },
      });

      await tx.credential.upsert({
        where: { userId: user.id },
        update: {
          passwordHash,
          version: 1,
        },
        create: {
          userId: user.id,
          type: "PASSWORD",
          passwordHash,
          version: 1,
        },
      });

      await tx.userRole.upsert({
        where: {
          userId_roleId: {
            userId: user.id,
            roleId: userRole.id,
          },
        },
        update: {},
        create: {
          userId: user.id,
          roleId: userRole.id,
        },
      });

      fixtureLabels.push(email);
      userCount++;
    }

    // Seed test ADMIN fixture ONLY if explicitly requested by test runner
    if (options?.includeTestAdmin) {
      const adminUser = await tx.user.upsert({
        where: { email: adminEmail },
        update: {
          displayName: "Test Admin",
          status: "ACTIVE",
        },
        create: {
          email: adminEmail,
          displayName: "Test Admin",
          status: "ACTIVE",
        },
      });

      await tx.credential.upsert({
        where: { userId: adminUser.id },
        update: {
          passwordHash,
          version: 1,
        },
        create: {
          userId: adminUser.id,
          type: "PASSWORD",
          passwordHash,
          version: 1,
        },
      });

      // Assign ADMIN and USER roles to test admin fixture
      await tx.userRole.upsert({
        where: {
          userId_roleId: {
            userId: adminUser.id,
            roleId: adminRole.id,
          },
        },
        update: {},
        create: {
          userId: adminUser.id,
          roleId: adminRole.id,
        },
      });

      await tx.userRole.upsert({
        where: {
          userId_roleId: {
            userId: adminUser.id,
            roleId: userRole.id,
          },
        },
        update: {},
        create: {
          userId: adminUser.id,
          roleId: userRole.id,
        },
      });

      fixtureLabels.push(adminEmail);
      userCount++;
    }
  });

  return {
    mode: seedMode,
    seededUsers: userCount,
    fixtureLabels,
    rolesEnsured: ["USER", "ADMIN"],
    executionDurationMs: Date.now() - startTime,
  };
}

/**
 * Scoped cleanup function: removes ONLY explicit FEAT-017-owned seed fixtures.
 * Does NOT delete unrelated users in @aura.internal, @aura.test, or other domains.
 */
export async function cleanupSeedData(
  prisma: PrismaClient,
  targetScope: "dev" | "test",
  options?: CleanupSeedOptions,
): Promise<{ deletedCount: number; deletedEmails: string[] }> {
  let targetEmails: string[] = [];

  if (targetScope === "dev") {
    // Exact canonical dev fixture allowlist
    targetEmails = [...DEV_FIXTURE_EMAILS];
  } else {
    // Exact runId + workerId scoped test fixture identities
    const { userEmails, adminEmail } = getTestFixtureEmails(options);
    targetEmails = [...userEmails, adminEmail];
  }

  // Delete matching seed users (cascades to credentials, user_roles, refresh_sessions)
  const result = await prisma.user.deleteMany({
    where: {
      email: {
        in: targetEmails,
      },
    },
  });

  return {
    deletedCount: result.count,
    deletedEmails: targetEmails,
  };
}
