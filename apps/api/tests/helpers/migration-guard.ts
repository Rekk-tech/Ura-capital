import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import type { PrismaClient } from "@prisma/client";
import { sanitizeDatabaseUrl } from "./test-db-guard.js";

/**
 * Migration Risk Severity & Details.
 */
export type MigrationRiskSeverity = "BLOCKING" | "REVIEW";

export interface MigrationRisk {
  migration: string;
  migrationName?: string;
  line: number;
  snippet: string;
  rule: string;
  severity: MigrationRiskSeverity;
  reason: string;
}

export type MigrationRiskViolation = MigrationRisk;

export interface MigrationFileDigest {
  name?: string;
  migration: string;
  timestamp?: string;
  checksum: string;
}

export interface MigrationAnalysisResult {
  migrationCount: number;
  migrations: MigrationFileDigest[];
  violations: MigrationRiskViolation[];
  orderingValid: boolean;
  orderingErrors: string[];
}

const FORBIDDEN_DATABASE_MARKERS = [
  "aura_capital_dev",
  "aura_capital_development",
  "aura_capital_stage",
  "aura_capital_staging",
  "aura_capital_prod",
  "aura_capital_production",
  "production",
  "staging",
];

/**
 * Regex patterns for detecting destructive (BLOCKING) migration operations.
 */
const BLOCKING_PATTERNS: Array<{ rule: string; pattern: RegExp; reason: string }> = [
  {
    rule: "DROP_TABLE",
    pattern: /\bDROP\s+TABLE\b/i,
    reason: "DROP TABLE is a destructive operation that permanently deletes table data.",
  },
  {
    rule: "DROP_COLUMN",
    pattern: /\bALTER\s+TABLE\s+.*\bDROP\s+COLUMN\b|\bDROP\s+COLUMN\b/i,
    reason: "DROP COLUMN is a destructive operation that permanently deletes column data.",
  },
  {
    rule: "DROP_SCHEMA",
    pattern: /\bDROP\s+SCHEMA\b/i,
    reason: "DROP SCHEMA is a destructive operation that deletes entire schema namespaces.",
  },
  {
    rule: "DROP_TYPE",
    pattern: /\bDROP\s+TYPE\b/i,
    reason: "DROP TYPE removes database custom types / enums.",
  },
  {
    rule: "DROP_INDEX",
    pattern: /\bDROP\s+INDEX\b/i,
    reason: "DROP INDEX removes database indexes and may degrade query performance or integrity.",
  },
  {
    rule: "DESTRUCTIVE_TRUNCATE",
    pattern: /\bTRUNCATE\b/i,
    reason: "TRUNCATE deletes all rows from a table.",
  },
  {
    rule: "DESTRUCTIVE_ENUM_CHANGE",
    pattern: /\bALTER\s+TYPE\b[\s\S]*\bDROP\s+VALUE\b/i,
    reason: "Removing enum values can invalidate existing data and requires explicit Human approval.",
  },
];

/**
 * Regex patterns for detecting review-required (REVIEW) migration operations.
 */
const REVIEW_PATTERNS: Array<{ rule: string; pattern: RegExp; reason: string }> = [
  {
    rule: "RENAME_OPERATION",
    pattern: /\bALTER\s+TABLE\s+.*\bRENAME\s+(?:COLUMN|TO)\b|\bRENAME\s+(?:COLUMN|TO)\b/i,
    reason: "Renames need review because Prisma may represent them as drop/add changes causing data loss.",
  },
  {
    rule: "NULLABLE_TO_REQUIRED",
    pattern: /\bALTER\s+COLUMN\s+["`\w]+\s+SET\s+NOT\s+NULL\b|\bSET\s+NOT\s+NULL\b|\bADD\s+COLUMN\s+["`\w]+\s+[^;]+NOT\s+NULL(?!\s+DEFAULT\b)[^;]*/i,
    reason: "Nullable-to-required changes or adding NOT NULL columns without DEFAULT need backfill review.",
  },
  {
    rule: "RISKY_NOT_NULL_ADD_NO_DEFAULT",
    pattern: /\bADD\s+COLUMN\s+["`\w]+\s+[^;]+NOT\s+NULL(?!\s+DEFAULT\b)[^;]*/i,
    reason: "Adding a NOT NULL column without a DEFAULT will fail on tables with existing rows.",
  },
  {
    rule: "RISKY_ALTER_SET_NOT_NULL",
    pattern: /\bALTER\s+COLUMN\s+["`\w]+\s+SET\s+NOT\s+NULL\b|\bSET\s+NOT\s+NULL\b/i,
    reason: "Setting column to NOT NULL requires prior backfill of existing NULL values.",
  },
  {
    rule: "UNIQUE_CONSTRAINT_RISK",
    pattern: /\bCREATE\s+UNIQUE\s+INDEX\b|\bADD\s+CONSTRAINT\b[\s\S]*\bUNIQUE\b/i,
    reason: "New uniqueness constraints need existing-data duplicate review before applying.",
  },
  {
    rule: "DATA_MUTATION_OR_BACKFILL",
    pattern: /^\s*(?:INSERT\s+INTO|UPDATE|DELETE\s+FROM)\b/i,
    reason: "Data migrations/backfills need review for idempotency and data safety.",
  },
];

const MIGRATION_NAME_PATTERN = /^(\d{14})_([a-z0-9_]+)$/;

export function getDatabaseName(databaseUrl: string): string {
  try {
    const parsed = new URL(databaseUrl);
    return (parsed.pathname || "").replace(/^\//, "").toLowerCase();
  } catch {
    const normalized = databaseUrl.toLowerCase().split("?")[0];
    return normalized.split("/").filter(Boolean).at(-1) ?? "";
  }
}

/**
 * Validates the target database URL and environment for migration operations.
 * Fails closed if the target is missing, ambiguous, dev, staging, or production.
 */
export function assertSafeMigrationDatabase(
  databaseUrl: string | undefined,
  nodeEnv: string = process.env.NODE_ENV ?? "test",
): void {
  if (!databaseUrl || typeof databaseUrl !== "string" || !databaseUrl.trim()) {
    throw new Error("[MIGRATION_DB_GUARD_VIOLATION] DATABASE_URL is required for migration validation.");
  }

  const trimmed = databaseUrl.trim();
  const dbName = getDatabaseName(trimmed);
  const normalizedUrl = trimmed.toLowerCase();
  const normalizedEnv = (nodeEnv || "").toLowerCase().trim();

  if (normalizedEnv !== "test" && normalizedEnv !== "ci") {
    throw new Error(
      `[MIGRATION_DB_GUARD_VIOLATION] Migration validation requires NODE_ENV='test' or NODE_ENV='ci'. Current NODE_ENV: '${nodeEnv || "unset"}'.`,
    );
  }

  // Reject ambiguous / default names
  if (!dbName || dbName.length < 4 || dbName === "app" || dbName === "postgres" || dbName === "database") {
    throw new Error(
      `[MIGRATION_DB_GUARD_VIOLATION] Refusing ambiguous migration database target: ${sanitizeDatabaseUrl(trimmed)}. Explicit test database name is required.`,
    );
  }

  // Reject forbidden development, staging, or production database names
  for (const forbidden of FORBIDDEN_DATABASE_MARKERS) {
    if (dbName === forbidden || dbName.includes(forbidden) || normalizedUrl.includes(forbidden)) {
      throw new Error(
        `[MIGRATION_DB_GUARD_VIOLATION] Refusing unsafe migration database target: ${sanitizeDatabaseUrl(trimmed)}. Target contains '${forbidden}'.`,
      );
    }
  }

  // Must contain an explicit test or ci marker
  const hasTestMarker = dbName.includes("test") || dbName.includes("ci") || normalizedUrl.includes("schema=test");
  if (!hasTestMarker) {
    throw new Error(
      `[MIGRATION_DB_GUARD_VIOLATION] Migration validation target must include an explicit test/ci marker: ${sanitizeDatabaseUrl(trimmed)}.`,
    );
  }
}

/**
 * Computes Prisma-compatible SHA256 checksum of SQL migration content.
 * Normalizes CRLF line endings to LF before hashing.
 */
export function computePrismaMigrationChecksum(sqlContent: string): string {
  const normalized = sqlContent.replace(/\r\n/g, "\n");
  return crypto.createHash("sha256").update(normalized).digest("hex");
}

/**
 * Analyzes SQL content for destructive and risky migration operations.
 */
export function analyzeMigrationSql(
  sqlContent: string,
  migrationName: string,
): MigrationRisk[] {
  const violations: MigrationRisk[] = [];
  const lines = sqlContent.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();
    const lineNum = i + 1;

    // Skip SQL comments and blank lines
    if (!trimmed || trimmed.startsWith("--") || trimmed.startsWith("/*")) {
      continue;
    }

    // Check blocking destructive patterns
    for (const check of BLOCKING_PATTERNS) {
      if (check.pattern.test(rawLine)) {
        // Special case: DROP DEFAULT is non-destructive
        if (check.rule === "DROP_COLUMN" && /\bDROP\s+DEFAULT\b/i.test(rawLine)) {
          continue;
        }

        violations.push({
          migration: migrationName,
          migrationName,
          line: lineNum,
          snippet: trimmed,
          rule: check.rule,
          severity: "BLOCKING",
          reason: check.reason,
        });
      }
    }

    // Check review-required patterns
    for (const check of REVIEW_PATTERNS) {
      if (check.pattern.test(rawLine)) {
        // Exclude if it has DEFAULT in the same statement for NOT NULL add
        if (check.rule === "RISKY_NOT_NULL_ADD_NO_DEFAULT" && /\bDEFAULT\b/i.test(rawLine)) {
          continue;
        }

        // Avoid adding duplicate NULLABLE_TO_REQUIRED if already matched
        if (
          violations.some(
            (v) => v.line === lineNum && (v.rule === check.rule || (v.rule.includes("NOT_NULL") && check.rule.includes("NOT_NULL"))),
          )
        ) {
          continue;
        }

        violations.push({
          migration: migrationName,
          migrationName,
          line: lineNum,
          snippet: trimmed,
          rule: check.rule,
          severity: "REVIEW",
          reason: check.reason,
        });
      }
    }
  }

  return violations;
}

export const scanMigrationSql = (migrationName: string, sql: string): MigrationRisk[] =>
  analyzeMigrationSql(sql, migrationName);

export function collectMigrationSqlFiles(migrationsDir: string): string[] {
  if (!fs.existsSync(migrationsDir)) {
    return [];
  }

  return fs
    .readdirSync(migrationsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(migrationsDir, entry.name, "migration.sql"))
    .filter((filePath) => fs.existsSync(filePath))
    .sort((a, b) => path.basename(path.dirname(a)).localeCompare(path.basename(path.dirname(b))));
}

export function computeMigrationDigests(migrationsDir: string): MigrationFileDigest[] {
  return collectMigrationSqlFiles(migrationsDir).map((filePath) => {
    const migrationName = path.basename(path.dirname(filePath));
    const sqlContent = fs.readFileSync(filePath, "utf-8");
    return {
      migration: migrationName,
      name: migrationName,
      timestamp: migrationName.substring(0, 14),
      checksum: computePrismaMigrationChecksum(sqlContent),
    };
  });
}

/**
 * Validates deterministic migration ordering based on timestamp prefixes.
 */
export function verifyMigrationOrdering(migrationNames: string[]): {
  isOrdered: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  for (let i = 0; i < migrationNames.length; i++) {
    const name = migrationNames[i];
    const match = name.match(MIGRATION_NAME_PATTERN);

    if (!match) {
      errors.push(`Migration directory '${name}' does not conform to timestamp pattern 'YYYYMMDDHHMMSS_name'.`);
      continue;
    }

    if (i > 0) {
      const prevName = migrationNames[i - 1];
      const prevTimestamp = prevName.substring(0, 14);
      const currentTimestamp = name.substring(0, 14);

      if (currentTimestamp <= prevTimestamp) {
        errors.push(
          `Migration order violation: '${name}' (${currentTimestamp}) is not strictly newer than '${prevName}' (${prevTimestamp}).`,
        );
      }
    }
  }

  return {
    isOrdered: errors.length === 0,
    errors,
  };
}

export function assertDeterministicMigrationOrdering(migrationsDir: string): string[] {
  const migrationNames = collectMigrationSqlFiles(migrationsDir).map((filePath) => path.basename(path.dirname(filePath)));
  const sorted = [...migrationNames].sort((a, b) => a.localeCompare(b));

  if (migrationNames.join("\n") !== sorted.join("\n")) {
    throw new Error("[MIGRATION_ORDER_GUARD_VIOLATION] Migration directories are not in deterministic order.");
  }

  return migrationNames;
}

/**
 * Scans all migration SQL files in directory and returns array of risks.
 */
export function scanMigrationDirectory(migrationsDir: string): MigrationRisk[] {
  return collectMigrationSqlFiles(migrationsDir).flatMap((filePath) => {
    const migrationName = path.basename(path.dirname(filePath));
    return analyzeMigrationSql(fs.readFileSync(filePath, "utf-8"), migrationName);
  });
}

export function scanMigrationDirectoryFull(migrationsDir: string): MigrationAnalysisResult {
  if (!fs.existsSync(migrationsDir)) {
    throw new Error(`Migrations directory not found: ${migrationsDir}`);
  }

  const entries = fs.readdirSync(migrationsDir, { withFileTypes: true });
  const migrationDirs = entries
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort();

  const ordering = verifyMigrationOrdering(migrationDirs);
  const allViolations: MigrationRisk[] = [];
  const migrationMeta: MigrationFileDigest[] = [];

  for (const dirName of migrationDirs) {
    const sqlPath = path.join(migrationsDir, dirName, "migration.sql");
    if (!fs.existsSync(sqlPath)) {
      allViolations.push({
        migration: dirName,
        migrationName: dirName,
        line: 1,
        snippet: "migration.sql missing",
        rule: "MISSING_MIGRATION_SQL",
        severity: "BLOCKING",
        reason: `Migration folder '${dirName}' is missing required migration.sql file.`,
      });
      continue;
    }

    const sqlContent = fs.readFileSync(sqlPath, "utf-8");
    const checksum = computePrismaMigrationChecksum(sqlContent);
    const timestamp = dirName.substring(0, 14);

    migrationMeta.push({
      migration: dirName,
      name: dirName,
      timestamp,
      checksum,
    });

    const fileViolations = analyzeMigrationSql(sqlContent, dirName);
    allViolations.push(...fileViolations);
  }

  return {
    migrationCount: migrationDirs.length,
    migrations: migrationMeta,
    violations: allViolations,
    orderingValid: ordering.isOrdered,
    orderingErrors: ordering.errors,
  };
}

/**
 * Asserts that all migrations in the directory are safe, non-destructive, and deterministically ordered.
 */
export function assertNoBlockingMigrationRisks(migrationsDir: string): MigrationRisk[] {
  const risks = scanMigrationDirectory(migrationsDir);
  const blocking = risks.filter((r) => r.severity === "BLOCKING");

  if (blocking.length > 0) {
    const details = blocking
      .map((r) => `  - [${r.rule}] in ${r.migration}:${r.line} — ${r.reason}\n    Snippet: ${r.snippet}`)
      .join("\n");

    throw new Error(
      `[MIGRATION_RISK_GUARD_VIOLATION] Discovered ${blocking.length} blocking destructive migration pattern(s):\n${details}`,
    );
  }

  return risks;
}

/**
 * Verifies that applied migrations in the PostgreSQL database match local migration files in checksum and ordering.
 * Fails if any applied migration has drifted, has been modified, or is missing from disk.
 */
export async function verifyAppliedMigrationIntegrity(
  prisma: PrismaClient,
  migrationsDir: string,
): Promise<{
  appliedCount: number;
  verifiedCount: number;
  integrityPass: boolean;
}> {
  const appliedRows = await prisma.$queryRaw<
    Array<{
      migration_name: string;
      checksum: string;
      finished_at: Date | null;
      applied_steps_count: number;
    }>
  >`SELECT migration_name, checksum, finished_at, applied_steps_count FROM _prisma_migrations ORDER BY migration_name ASC;`;

  if (appliedRows.length === 0) {
    throw new Error("[MIGRATION_DRIFT_DETECTED] No applied migrations found in _prisma_migrations table.");
  }

  for (const row of appliedRows) {
    const sqlPath = path.join(migrationsDir, row.migration_name, "migration.sql");
    if (!fs.existsSync(sqlPath)) {
      throw new Error(
        `[MIGRATION_DRIFT_DETECTED] Applied migration '${row.migration_name}' exists in database but is missing from disk at '${sqlPath}'.`,
      );
    }

    const sqlContent = fs.readFileSync(sqlPath, "utf-8");
    const localChecksum = computePrismaMigrationChecksum(sqlContent);

    if (localChecksum !== row.checksum) {
      throw new Error(
        `[MIGRATION_DRIFT_DETECTED] Checksum mismatch for applied migration '${row.migration_name}'. Database has '${row.checksum}', but disk has '${localChecksum}'. Applied migrations are immutable and must not be edited.`,
      );
    }
  }

  return {
    appliedCount: appliedRows.length,
    verifiedCount: appliedRows.length,
    integrityPass: true,
  };
}
