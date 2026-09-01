import { PrismaClient } from "@prisma/client";
import { assertSeedEnvironmentSafe, seedTestData } from "../src/infrastructure/seed/seed-service.js";
import { sanitizeDiagnosticMessage } from "../tests/helpers/test-db-guard.js";

async function main() {
  const isCi = process.env.CI === "true";
  const seedMode = isCi ? "ci" : "test";

  try {
    // 1. Validate environment BEFORE connecting or mutating
    assertSeedEnvironmentSafe(seedMode);

    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    });

    try {
      const result = await seedTestData(prisma, {
        includeTestAdmin: process.env.INCLUDE_TEST_ADMIN === "true",
      });
      console.log(`[SEED_TEST] SUCCESS`);
      console.log(`[SEED_TEST] Seeded ${result.seededUsers} test fixtures: [${result.fixtureLabels.join(", ")}]`);
      console.log(`[SEED_TEST] Roles ensured: [${result.rolesEnsured.join(", ")}]`);
      console.log(`[SEED_TEST] Duration: ${result.executionDurationMs}ms`);
      process.exit(0);
    } finally {
      await prisma.$disconnect();
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    const safeError = sanitizeDiagnosticMessage(errorMsg);
    console.error(`[SEED_TEST] FAILED`);
    console.error(safeError);
    process.exit(1);
  }
}

main();
