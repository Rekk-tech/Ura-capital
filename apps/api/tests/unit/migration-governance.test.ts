import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  assertDeterministicMigrationOrdering,
  assertNoBlockingMigrationRisks,
  assertSafeMigrationDatabase,
  computeMigrationDigests,
  getDatabaseName,
  scanMigrationDirectory,
  scanMigrationSql,
} from "../helpers/migration-governance.js";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const migrationsDir = path.resolve(currentDir, "../../prisma/migrations");

function withTempMigration(sql: string): string {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "aura-migration-governance-"));
  const migrationDir = path.join(tempDir, "20260829000000_test_migration");
  fs.mkdirSync(migrationDir, { recursive: true });
  fs.writeFileSync(path.join(migrationDir, "migration.sql"), sql);
  return tempDir;
}

describe("FEAT-012 Migration Reproducibility & Schema Governance", () => {
  it("accepts explicit isolated test and CI migration database targets", () => {
    expect(() =>
      assertSafeMigrationDatabase("postgresql://postgres:postgrespassword@localhost:5432/aura_capital_test_feat012", "test"),
    ).not.toThrow();
    expect(() =>
      assertSafeMigrationDatabase("postgresql://postgres:postgrespassword@localhost:5432/aura_capital_ci_feat012", "ci"),
    ).not.toThrow();
  });

  it("rejects missing or ambiguous migration database targets before mutation", () => {
    expect(() => assertSafeMigrationDatabase(undefined, "test")).toThrow("[MIGRATION_DB_GUARD_VIOLATION]");
    expect(() => assertSafeMigrationDatabase("postgresql://localhost:5432/db", "test")).toThrow(
      "[MIGRATION_DB_GUARD_VIOLATION]",
    );
  });

  it("rejects dev, staging, production, and production-like migration database targets", () => {
    const unsafeUrls = [
      "postgresql://postgres:postgrespassword@localhost:5432/aura_capital_dev",
      "postgresql://postgres:postgrespassword@localhost:5432/aura_capital_staging",
      "postgresql://postgres:postgrespassword@localhost:5432/aura_capital_prod",
      "postgresql://admin:secret@production-db.internal:5432/aura_capital",
      "postgresql://admin:secret@staging-db.internal:5432/aura_capital_test",
    ];

    for (const unsafeUrl of unsafeUrls) {
      expect(() => assertSafeMigrationDatabase(unsafeUrl, "test")).toThrow("[MIGRATION_DB_GUARD_VIOLATION]");
    }
  });

  it("rejects migration validation outside test or CI context", () => {
    const safeUrl = "postgresql://postgres:postgrespassword@localhost:5432/aura_capital_test_feat012";

    expect(() => assertSafeMigrationDatabase(safeUrl, "development")).toThrow("[MIGRATION_DB_GUARD_VIOLATION]");
    expect(() => assertSafeMigrationDatabase(safeUrl, "production")).toThrow("[MIGRATION_DB_GUARD_VIOLATION]");
    expect(() => assertSafeMigrationDatabase(safeUrl, "")).toThrow("[MIGRATION_DB_GUARD_VIOLATION]");
  });

  it("sanitizes migration guard errors without exposing database credentials", () => {
    const secret = "super_secret_db_password_123";
    const unsafeUrl = `postgresql://admin:${secret}@production-db.internal:5432/aura_capital_production`;

    try {
      assertSafeMigrationDatabase(unsafeUrl, "test");
      expect.unreachable("Expected migration guard to reject unsafe target");
    } catch (err) {
      const message = (err as Error).message;
      expect(message).toContain("[MIGRATION_DB_GUARD_VIOLATION]");
      expect(message).not.toContain(secret);
      expect(message).toContain("[REDACTED_DB_URL]");
    }
  });

  it("extracts database names for migration target classification", () => {
    expect(getDatabaseName("postgresql://user:pass@localhost:5432/aura_capital_test")).toBe("aura_capital_test");
    expect(getDatabaseName("postgresql://user:pass@localhost:5432/aura_capital?schema=test")).toBe("aura_capital");
  });

  it("detects destructive migration risks as blocking", () => {
    const sql = `
      DROP TABLE "users";
      ALTER TABLE "credentials" DROP COLUMN "password_hash";
      DROP INDEX "roles_name_key";
    `;

    const risks = scanMigrationSql("20260829000000_bad", sql);

    expect(risks.filter((risk) => risk.severity === "BLOCKING")).toHaveLength(3);
    expect(risks.map((risk) => risk.rule)).toEqual(expect.arrayContaining(["DROP_TABLE", "DROP_COLUMN", "DROP_INDEX"]));
  });

  it("flags rename, nullable-to-required, uniqueness, and backfill risks for review", () => {
    const sql = `
      ALTER TABLE "users" RENAME COLUMN "email" TO "normalized_email";
      ALTER TABLE "users" ALTER COLUMN "display_name" SET NOT NULL;
      CREATE UNIQUE INDEX "users_display_name_key" ON "users"("display_name");
      UPDATE "users" SET "display_name" = 'unknown' WHERE "display_name" IS NULL;
    `;

    const risks = scanMigrationSql("20260829000000_review", sql);
    const reviewRules = risks.filter((risk) => risk.severity === "REVIEW").map((risk) => risk.rule);

    expect(reviewRules).toEqual(
      expect.arrayContaining([
        "RENAME_OPERATION",
        "NULLABLE_TO_REQUIRED",
        "UNIQUE_CONSTRAINT_RISK",
        "DATA_MUTATION_OR_BACKFILL",
      ]),
    );
  });

  it("fails the migration guard when blocking risks exist in a migration directory", () => {
    const tempDir = withTempMigration('DROP TABLE "users";');

    expect(() => assertNoBlockingMigrationRisks(tempDir)).toThrow("[MIGRATION_RISK_GUARD_VIOLATION]");
  });

  it("allows existing approved migrations while surfacing review-only risks", () => {
    const risks = assertNoBlockingMigrationRisks(migrationsDir);

    expect(risks.every((risk) => risk.severity !== "BLOCKING")).toBe(true);
    expect(risks.some((risk) => risk.rule === "UNIQUE_CONSTRAINT_RISK")).toBe(true);
  });

  it("confirms migration ordering is deterministic and reviewable", () => {
    const migrations = assertDeterministicMigrationOrdering(migrationsDir);

    expect(migrations).toEqual([...migrations].sort((a, b) => a.localeCompare(b)));
    expect(migrations.length).toBeGreaterThan(0);
  });

  it("computes stable migration file digests for immutable applied-migration review", () => {
    const digests = computeMigrationDigests(migrationsDir);

    expect(digests.length).toBeGreaterThan(0);
    for (const digest of digests) {
      expect(digest.migration).toMatch(/^\d{14}_[a-z0-9_]+$/);
      expect(digest.checksum).toMatch(/^[a-f0-9]{64}$/);
    }
  });

  it("detects edited migration content through checksum changes", () => {
    const tempDir = withTempMigration('CREATE TABLE "example" ("id" TEXT NOT NULL);');
    const before = computeMigrationDigests(tempDir)[0].checksum;
    const migrationFile = path.join(tempDir, "20260829000000_test_migration", "migration.sql");

    fs.appendFileSync(migrationFile, '\nCREATE UNIQUE INDEX "example_id_key" ON "example"("id");\n');

    const after = computeMigrationDigests(tempDir)[0].checksum;
    expect(after).not.toBe(before);
  });

  it("does not find blocking destructive risks in the current approved migration directory", () => {
    const risks = scanMigrationDirectory(migrationsDir);

    expect(risks.filter((risk) => risk.severity === "BLOCKING")).toEqual([]);
  });
});
