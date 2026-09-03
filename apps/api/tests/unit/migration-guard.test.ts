import { describe, it, expect } from "vitest";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  scanMigrationDirectory,
  assertNoBlockingMigrationRisks,
  analyzeMigrationSql,
  verifyMigrationOrdering,
  assertSafeMigrationDatabase,
  computeMigrationDigests,
} from "../helpers/migration-guard.js";
import { sanitizeDatabaseUrl } from "../helpers/test-db-guard.js";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const migrationsDir = path.resolve(currentDir, "../../prisma/migrations");

describe("FEAT-012 Migration Reproducibility & Schema Governance Guard (Unit)", () => {
  describe("Active Workspace Migration History Validation", () => {
    it("validates that all active Prisma migrations are safe, non-destructive, and governed", () => {
      const violations = assertNoBlockingMigrationRisks(migrationsDir);
      const blocking = violations.filter((v) => v.severity === "BLOCKING");
      expect(blocking).toEqual([]);
    });

    it("verifies exact migration count and deterministic ordering of approved Phase 2 / FEAT-011 migrations", () => {
      const digests = computeMigrationDigests(migrationsDir);
      expect(digests.length).toBe(4);

      const migrationNames = digests.map((m) => m.migration);
      expect(migrationNames).toEqual([
        "20260825000000_init_identity",
        "20260825000001_feat005_refresh_session_rotation",
        "20260827000000_feat009_audit_events",
        "20260903000000_feat019_academy_foundation",
      ]);

      // Every migration must have a non-empty 64-char SHA256 checksum
      for (const m of digests) {
        expect(m.checksum).toHaveLength(64);
        expect(m.timestamp).toMatch(/^\d{14}$/);
      }
    });

    it("confirms no destructive DROP or TRUNCATE operations exist in current migration files", () => {
      const risks = scanMigrationDirectory(migrationsDir);
      const blockingViolations = risks.filter((v) => v.severity === "BLOCKING");
      expect(blockingViolations).toEqual([]);
    });
  });

  describe("Blocking Destructive Risk Detection (Self-Testing)", () => {
    it("detects and flags DROP TABLE statements as BLOCKING", () => {
      const sql = `DROP TABLE "users" CASCADE;`;
      const violations = analyzeMigrationSql(sql, "test_migration");
      expect(violations.some((v) => v.rule === "DROP_TABLE" && v.severity === "BLOCKING")).toBe(true);
    });

    it("detects and flags DROP COLUMN statements as BLOCKING", () => {
      const sql = `ALTER TABLE "users" DROP COLUMN "email";`;
      const violations = analyzeMigrationSql(sql, "test_migration");
      expect(violations.some((v) => v.rule === "DROP_COLUMN" && v.severity === "BLOCKING")).toBe(true);
    });

    it("detects and flags DROP SCHEMA statements as BLOCKING", () => {
      const sql = `DROP SCHEMA "public";`;
      const violations = analyzeMigrationSql(sql, "test_migration");
      expect(violations.some((v) => v.rule === "DROP_SCHEMA" && v.severity === "BLOCKING")).toBe(true);
    });

    it("detects and flags DROP TYPE statements as BLOCKING", () => {
      const sql = `DROP TYPE "RoleName";`;
      const violations = analyzeMigrationSql(sql, "test_migration");
      expect(violations.some((v) => v.rule === "DROP_TYPE" && v.severity === "BLOCKING")).toBe(true);
    });

    it("detects and flags DROP INDEX statements as BLOCKING", () => {
      const sql = `DROP INDEX "users_email_key";`;
      const violations = analyzeMigrationSql(sql, "test_migration");
      expect(violations.some((v) => v.rule === "DROP_INDEX" && v.severity === "BLOCKING")).toBe(true);
    });

    it("detects and flags TRUNCATE statements as BLOCKING", () => {
      const sql = `TRUNCATE TABLE "users";`;
      const violations = analyzeMigrationSql(sql, "test_migration");
      expect(violations.some((v) => v.rule === "DESTRUCTIVE_TRUNCATE" && v.severity === "BLOCKING")).toBe(true);
    });

    it("detects and flags ALTER TYPE DROP VALUE statements as BLOCKING", () => {
      const sql = `ALTER TYPE "Status" DROP VALUE 'DEPRECATED';`;
      const violations = analyzeMigrationSql(sql, "test_migration");
      expect(violations.some((v) => v.rule === "DESTRUCTIVE_ENUM_CHANGE" && v.severity === "BLOCKING")).toBe(true);
    });
  });

  describe("Review Risk Detection (DEF-002 Self-Testing)", () => {
    it("detects and flags RENAME COLUMN statements as REVIEW", () => {
      const sql = `ALTER TABLE "users" RENAME COLUMN "display_name" TO "full_name";`;
      const violations = analyzeMigrationSql(sql, "test_migration");
      expect(violations.some((v) => v.rule === "RENAME_OPERATION" && v.severity === "REVIEW")).toBe(true);
    });

    it("detects and flags RENAME TO statements as REVIEW", () => {
      const sql = `ALTER TABLE "users" RENAME TO "accounts";`;
      const violations = analyzeMigrationSql(sql, "test_migration");
      expect(violations.some((v) => v.rule === "RENAME_OPERATION" && v.severity === "REVIEW")).toBe(true);
    });

    it("detects and flags adding NOT NULL column without DEFAULT as REVIEW", () => {
      const sql = `ALTER TABLE "users" ADD COLUMN "role" TEXT NOT NULL;`;
      const violations = analyzeMigrationSql(sql, "test_migration");
      expect(violations.some((v) => v.rule === "RISKY_NOT_NULL_ADD_NO_DEFAULT" && v.severity === "REVIEW")).toBe(true);
    });

    it("allows adding NOT NULL column WITH a DEFAULT value without triggering NOT_NULL warning", () => {
      const sql = `ALTER TABLE "users" ADD COLUMN "role" TEXT NOT NULL DEFAULT 'USER';`;
      const violations = analyzeMigrationSql(sql, "test_migration");
      expect(violations.some((v) => v.rule === "RISKY_NOT_NULL_ADD_NO_DEFAULT")).toBe(false);
    });

    it("detects and flags ALTER COLUMN SET NOT NULL as REVIEW", () => {
      const sql = `ALTER TABLE "users" ALTER COLUMN "email" SET NOT NULL;`;
      const violations = analyzeMigrationSql(sql, "test_migration");
      expect(violations.some((v) => v.rule === "RISKY_ALTER_SET_NOT_NULL" && v.severity === "REVIEW")).toBe(true);
    });

    it("detects and flags CREATE UNIQUE INDEX as REVIEW", () => {
      const sql = `CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");`;
      const violations = analyzeMigrationSql(sql, "test_migration");
      expect(violations.some((v) => v.rule === "UNIQUE_CONSTRAINT_RISK" && v.severity === "REVIEW")).toBe(true);
    });

    it("detects and flags data backfill / mutation SQL (INSERT, UPDATE, DELETE) as REVIEW", () => {
      const sqlInsert = `INSERT INTO "roles" ("id", "name") VALUES ('1', 'SUPERADMIN');`;
      const sqlUpdate = `UPDATE "users" SET "status" = 'ACTIVE' WHERE "status" IS NULL;`;
      const sqlDelete = `DELETE FROM "refresh_sessions" WHERE "expires_at" < NOW();`;

      expect(analyzeMigrationSql(sqlInsert, "test_migration").some((v) => v.rule === "DATA_MUTATION_OR_BACKFILL")).toBe(true);
      expect(analyzeMigrationSql(sqlUpdate, "test_migration").some((v) => v.rule === "DATA_MUTATION_OR_BACKFILL")).toBe(true);
      expect(analyzeMigrationSql(sqlDelete, "test_migration").some((v) => v.rule === "DATA_MUTATION_OR_BACKFILL")).toBe(true);
    });

    it("allows non-destructive DROP DEFAULT statements without false positive", () => {
      const sql = `ALTER TABLE "refresh_sessions" ALTER COLUMN "family_id" DROP DEFAULT;`;
      const violations = analyzeMigrationSql(sql, "test_migration");
      expect(violations.filter((v) => v.rule === "DESTRUCTIVE_DROP_COLUMN")).toHaveLength(0);
    });
  });

  describe("Deterministic Migration Ordering Verification", () => {
    it("validates strictly increasing timestamp ordering", () => {
      const valid = [
        "20260825000000_init",
        "20260825000001_feat2",
        "20260827000000_feat3",
      ];
      const result = verifyMigrationOrdering(valid);
      expect(result.isOrdered).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it("flags out-of-order or duplicate timestamps", () => {
      const invalid = [
        "20260827000000_feat3",
        "20260825000000_init",
      ];
      const result = verifyMigrationOrdering(invalid);
      expect(result.isOrdered).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain("Migration order violation");
    });

    it("flags invalid timestamp naming format", () => {
      const invalid = ["init_identity", "20260825_short"];
      const result = verifyMigrationOrdering(invalid);
      expect(result.isOrdered).toBe(false);
      expect(result.errors[0]).toContain("does not conform to timestamp pattern");
    });
  });

  describe("Active Database Target Isolation Guard (DEF-001 Fail-Closed)", () => {
    it("fails closed when DATABASE_URL is missing or empty", () => {
      expect(() => assertSafeMigrationDatabase(undefined, "test")).toThrow(
        /DATABASE_URL is required for migration validation/,
      );
      expect(() => assertSafeMigrationDatabase("", "test")).toThrow(
        /DATABASE_URL is required for migration validation/,
      );
      expect(() => assertSafeMigrationDatabase("   ", "test")).toThrow(
        /DATABASE_URL is required for migration validation/,
      );
    });

    it("fails closed when target database is development", () => {
      expect(() =>
        assertSafeMigrationDatabase("postgresql://postgres:secret@localhost:5432/aura_capital_dev", "test"),
      ).toThrow(/Refusing unsafe migration database target/);
      expect(() =>
        assertSafeMigrationDatabase("postgresql://postgres:secret@localhost:5432/aura_capital_development", "test"),
      ).toThrow(/Refusing unsafe migration database target/);
    });

    it("fails closed when target database is staging", () => {
      expect(() =>
        assertSafeMigrationDatabase("postgresql://postgres:secret@localhost:5432/aura_capital_staging", "test"),
      ).toThrow(/Refusing unsafe migration database target/);
      expect(() =>
        assertSafeMigrationDatabase("postgresql://postgres:secret@staging.aura.internal:5432/aura_capital_stage", "test"),
      ).toThrow(/Refusing unsafe migration database target/);
    });

    it("fails closed when target database is production", () => {
      expect(() =>
        assertSafeMigrationDatabase("postgresql://postgres:secret@localhost:5432/aura_capital_prod", "test"),
      ).toThrow(/Refusing unsafe migration database target/);
      expect(() =>
        assertSafeMigrationDatabase("postgresql://postgres:secret@prod-db.auracapital.com:5432/aura_capital_production", "test"),
      ).toThrow(/Refusing unsafe migration database target/);
    });

    it("fails closed when target database name is ambiguous without explicit test marker", () => {
      expect(() =>
        assertSafeMigrationDatabase("postgresql://postgres:secret@localhost:5432/app", "test"),
      ).toThrow(/Refusing ambiguous migration database target/);
      expect(() =>
        assertSafeMigrationDatabase("postgresql://postgres:secret@localhost:5432/postgres", "test"),
      ).toThrow(/Refusing ambiguous migration database target/);
      expect(() =>
        assertSafeMigrationDatabase("postgresql://postgres:secret@localhost:5432/aura_capital", "test"),
      ).toThrow(/Migration validation target must include an explicit test\/ci marker/);
    });

    it("fails closed when NODE_ENV is not test or ci", () => {
      expect(() =>
        assertSafeMigrationDatabase("postgresql://postgres:secret@localhost:5432/aura_capital_test", "development"),
      ).toThrow(/Migration validation requires NODE_ENV='test' or NODE_ENV='ci'/);
      expect(() =>
        assertSafeMigrationDatabase("postgresql://postgres:secret@localhost:5432/aura_capital_test", "production"),
      ).toThrow(/Migration validation requires NODE_ENV='test' or NODE_ENV='ci'/);
    });

    it("accepts safe isolated test database targets with NODE_ENV=test", () => {
      expect(() =>
        assertSafeMigrationDatabase("postgresql://postgres:secret@localhost:5432/aura_capital_test_feat012_fresh", "test"),
      ).not.toThrow();
      expect(() =>
        assertSafeMigrationDatabase("postgresql://postgres:secret@localhost:5432/aura_capital_test_feat012_upgrade", "test"),
      ).not.toThrow();
      expect(() =>
        assertSafeMigrationDatabase("postgresql://postgres:secret@localhost:5432/aura_capital_ci_123", "ci"),
      ).not.toThrow();
    });

    it("sanitizes database URLs to prevent credential leakage in logs and errors", () => {
      const rawUrl = "postgresql://postgres:SuperSecretPassword123@localhost:5432/aura_capital_dev";
      let errorThrown: Error | null = null;
      try {
        assertSafeMigrationDatabase(rawUrl, "test");
      } catch (err) {
        errorThrown = err as Error;
      }
      expect(errorThrown).not.toBeNull();
      expect(errorThrown?.message).not.toContain("SuperSecretPassword123");
      expect(errorThrown?.message).toContain("[REDACTED_DB_URL]");

      const sanitized = sanitizeDatabaseUrl(rawUrl);
      expect(sanitized).not.toContain("SuperSecretPassword123");
      expect(sanitized).toBe("[REDACTED_DB_URL]");
    });
  });
});
