import path from "node:path";
import {
  assertDeterministicMigrationOrdering,
  assertNoBlockingMigrationRisks,
  assertSafeMigrationDatabase,
  computeMigrationDigests,
} from "../tests/helpers/migration-guard.js";

const migrationsDir = path.resolve(process.cwd(), "prisma/migrations");

try {
  // 1. Validate active environment DATABASE_URL
  const databaseUrl = process.env.DATABASE_URL || process.env.TEST_DATABASE_URL;
  const nodeEnv = process.env.NODE_ENV ?? "test";
  assertSafeMigrationDatabase(databaseUrl, nodeEnv);

  // 2. Validate ordering, non-destructive SQL, and compute checksums
  const migrationNames = assertDeterministicMigrationOrdering(migrationsDir);
  const risks = assertNoBlockingMigrationRisks(migrationsDir);
  const digests = computeMigrationDigests(migrationsDir);
  const reviewRisks = risks.filter((risk) => risk.severity === "REVIEW");

  console.log("[MIGRATION_GUARD] PASS");
  console.log(`[MIGRATION_GUARD] migrations=${migrationNames.length}`);
  console.log(`[MIGRATION_GUARD] review_risks=${reviewRisks.length}`);
  console.log(`[MIGRATION_GUARD] digests=${digests.length}`);

  if (reviewRisks.length > 0) {
    console.log("[MIGRATION_GUARD] Review-only migration risks detected:");
    for (const risk of reviewRisks) {
      console.log(`  - [${risk.rule}] ${risk.migration}:${risk.line} - ${risk.reason}`);
    }
  }
} catch (err) {
  console.error((err as Error).message);
  process.exit(1);
}
