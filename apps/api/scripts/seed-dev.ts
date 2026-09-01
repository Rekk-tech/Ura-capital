import { PrismaClient } from "@prisma/client";
import { assertSeedEnvironmentSafe, seedDevelopmentData } from "../src/infrastructure/seed/seed-service.js";
import { sanitizeDiagnosticMessage } from "../tests/helpers/test-db-guard.js";

async function main() {
  const devPassword = process.env.DEV_SEED_USER_PASSWORD;

  try {
    // 1. Validate environment BEFORE connecting or mutating
    assertSeedEnvironmentSafe("development", devPassword);

    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    });

    try {
      const result = await seedDevelopmentData(prisma, devPassword!);
      console.log(`[SEED_DEV] SUCCESS`);
      console.log(`[SEED_DEV] Seeded ${result.seededUsers} development user fixtures: [${result.fixtureLabels.join(", ")}]`);
      console.log(`[SEED_DEV] Roles ensured: [${result.rolesEnsured.join(", ")}]`);
      console.log(`[SEED_DEV] Duration: ${result.executionDurationMs}ms`);
      process.exit(0);
    } finally {
      await prisma.$disconnect();
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    const safeError = sanitizeDiagnosticMessage(errorMsg);
    console.error(`[SEED_DEV] FAILED`);
    console.error(safeError);
    process.exit(1);
  }
}

main();
