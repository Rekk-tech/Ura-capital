import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import {
  seedDevelopmentData,
  seedTestData,
  cleanupSeedData,
  DEV_FIXTURE_EMAILS,
  getTestFixtureEmails,
} from "../../src/infrastructure/seed/seed-service.js";
import { sanitizeDiagnosticMessage } from "../helpers/test-db-guard.js";

const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL || "postgresql://postgres:postgrespassword@localhost:5432/aura_capital_test_feat017_rework1";

describe("FEAT-017 Live Seed Integration & PostgreSQL Authority", () => {
  let prisma: PrismaClient;

  beforeAll(async () => {
    try {
      prisma = new PrismaClient({
        datasources: {
          db: {
            url: TEST_DATABASE_URL,
          },
        },
      });
      // Connectivity probe
      await prisma.$queryRaw`SELECT 1`;
    } catch (err: unknown) {
      const safeError = sanitizeDiagnosticMessage(err instanceof Error ? err.message : String(err));
      throw new Error(`[POSTGRES_TEST_SETUP_FAILED] PostgreSQL is not reachable: ${safeError}`);
    }
  });

  afterAll(async () => {
    if (prisma) {
      // Clean up test fixtures created during the suite
      await cleanupSeedData(prisma, "test", { runId: "liveTestRun", workerId: "w1" }).catch(() => {});
      await cleanupSeedData(prisma, "dev").catch(() => {});
      await prisma.$disconnect();
    }
  });

  it("proves dev seed execution is idempotent and rerun is duplicate-safe", async () => {
    // 1. Initial dev seed run
    const result1 = await seedDevelopmentData(prisma, "ValidDevPassword123!", {
      nodeEnv: "development",
      databaseUrl: "postgresql://postgres:postgrespassword@localhost:5432/aura_capital_dev",
    });
    expect(result1.seededUsers).toBe(2);

    // 2. Immediate rerun (must not create duplicate users or throw unique constraint error)
    const result2 = await seedDevelopmentData(prisma, "ValidDevPassword123!", {
      nodeEnv: "development",
      databaseUrl: "postgresql://postgres:postgrespassword@localhost:5432/aura_capital_dev",
    });
    expect(result2.seededUsers).toBe(2);

    // 3. Verify exactly 2 dev users exist in DB
    const devUsers = await prisma.user.findMany({
      where: { email: { in: DEV_FIXTURE_EMAILS } },
      include: { userRoles: { include: { role: true } } },
    });
    expect(devUsers).toHaveLength(2);

    // 4. Verify dev users have USER role and zero ADMIN role
    for (const u of devUsers) {
      const roleNames = u.userRoles.map((ur) => ur.role.name);
      expect(roleNames).toContain("USER");
      expect(roleNames).not.toContain("ADMIN");
    }
  });

  it("proves cleanup deletes ONLY explicit dev fixtures and unrelated @aura.internal users survive", async () => {
    // 1. Create an unrelated user with @aura.internal domain
    const unrelatedEmail = "unrelated.dev@aura.internal";
    const unrelatedUser = await prisma.user.upsert({
      where: { email: unrelatedEmail },
      update: {},
      create: {
        email: unrelatedEmail,
        displayName: "Unrelated Dev",
        status: "ACTIVE",
      },
    });

    // 2. Perform dev seed cleanup
    const cleanupResult = await cleanupSeedData(prisma, "dev");
    expect(cleanupResult.deletedCount).toBe(2);

    // 3. Verify FEAT-017 dev fixtures are deleted
    const remainingDevFixtures = await prisma.user.findMany({
      where: { email: { in: DEV_FIXTURE_EMAILS } },
    });
    expect(remainingDevFixtures).toHaveLength(0);

    // 4. Critical assertion: Unrelated @aura.internal user SURVIVES
    const survivingUser = await prisma.user.findUnique({
      where: { id: unrelatedUser.id },
    });
    expect(survivingUser).not.toBeNull();
    expect(survivingUser?.email).toBe(unrelatedEmail);

    // Clean up the unrelated test user
    await prisma.user.delete({ where: { id: unrelatedUser.id } }).catch(() => {});
  });

  it("proves test seed creates run/worker isolated identities and cleanup preserves other runs/workers", async () => {
    // 1. Seed Run A Worker 1
    const runA = await seedTestData(prisma, {
      runId: "runA",
      workerId: "w1",
      includeTestAdmin: false,
    }, {
      nodeEnv: "test",
      databaseUrl: TEST_DATABASE_URL,
    });
    expect(runA.seededUsers).toBe(2);

    // 2. Seed Run B Worker 1
    const runB = await seedTestData(prisma, {
      runId: "runB",
      workerId: "w1",
      includeTestAdmin: true,
    }, {
      nodeEnv: "test",
      databaseUrl: TEST_DATABASE_URL,
    });
    expect(runB.seededUsers).toBe(3); // 2 users + 1 admin

    // 3. Verify Run A and Run B identities in DB
    const { userEmails: emailsA } = getTestFixtureEmails({ runId: "runA", workerId: "w1" });
    const { userEmails: emailsB, adminEmail: adminB } = getTestFixtureEmails({ runId: "runB", workerId: "w1" });

    const usersA = await prisma.user.findMany({ where: { email: { in: emailsA } } });
    const usersB = await prisma.user.findMany({ where: { email: { in: [...emailsB, adminB] } } });

    expect(usersA).toHaveLength(2);
    expect(usersB).toHaveLength(3);

    // 4. Clean up ONLY Run A Worker 1
    const cleanupA = await cleanupSeedData(prisma, "test", { runId: "runA", workerId: "w1" });
    expect(cleanupA.deletedCount).toBe(2);

    // 5. Assert Run A is deleted but Run B completely SURVIVES
    const remainingA = await prisma.user.findMany({ where: { email: { in: emailsA } } });
    expect(remainingA).toHaveLength(0);

    const remainingB = await prisma.user.findMany({ where: { email: { in: [...emailsB, adminB] } } });
    expect(remainingB).toHaveLength(3);

    // Clean up Run B
    await cleanupSeedData(prisma, "test", { runId: "runB", workerId: "w1" });
  });

  it("proves test ADMIN fixture is created with ADMIN and USER roles only when requested", async () => {
    const runId = "adminTestRun";
    const workerId = "w1";

    // 1. Seed without admin
    await seedTestData(prisma, {
      runId,
      workerId,
      includeTestAdmin: false,
    }, {
      nodeEnv: "test",
      databaseUrl: TEST_DATABASE_URL,
    });

    const { adminEmail } = getTestFixtureEmails({ runId, workerId });
    const adminCheck1 = await prisma.user.findUnique({ where: { email: adminEmail } });
    expect(adminCheck1).toBeNull();

    // 2. Seed with admin
    await seedTestData(prisma, {
      runId,
      workerId,
      includeTestAdmin: true,
    }, {
      nodeEnv: "test",
      databaseUrl: TEST_DATABASE_URL,
    });

    const adminCheck2 = await prisma.user.findUnique({
      where: { email: adminEmail },
      include: { userRoles: { include: { role: true } } },
    });
    expect(adminCheck2).not.toBeNull();
    const adminRoles = adminCheck2?.userRoles.map((ur) => ur.role.name);
    expect(adminRoles).toContain("ADMIN");
    expect(adminRoles).toContain("USER");

    // Clean up
    await cleanupSeedData(prisma, "test", { runId, workerId });
  });
});
