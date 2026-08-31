import fs from "node:fs";
import path from "node:path";

/**
 * Persistence Boundary Violation.
 */
export interface PersistenceViolation {
  filePath: string;
  line: number;
  snippet: string;
  rule: string;
  reason: string;
}

/**
 * Explicit allowlist of runtime files permitted to use specific file-system checks
 * for non-persistence purposes (e.g. environment variable configuration loader).
 */
export const RUNTIME_FS_ALLOWLIST: Record<string, { allowedOperations: string[]; reason: string }> = {
  "apps/api/src/infrastructure/config/env.ts": {
    allowedOperations: ["existsSync"],
    reason: "Environment file loader checking .env file existence for dotenv initialization.",
  },
};

/**
 * Runtime source directories subject to strict persistence boundary enforcement.
 */
export const RUNTIME_SOURCE_DIRS = [
  "apps/api/src",
  "apps/web/src",
  "packages/shared/src",
];

const PROHIBITED_DB_JSON_REGEX = /\bdb\.json\b/i;
const PROHIBITED_FILE_DB_MODULES = /\b(lowdb|diskdb|flat-file-db|stormdb)\b/i;
const PROHIBITED_WRITE_OPS = /\b(writeFile|writeFileSync|createWriteStream|appendFile|appendFileSync|truncate|truncateSync)\b/;

/**
 * Matches any static import, dynamic import, or require of node filesystem modules:
 * - Dynamic: import("fs"), import("node:fs"), import('fs/promises'), import(`node:fs/promises`)
 * - Static: import ... from "node:fs", import "node:fs"
 * - Require: require("node:fs"), require('fs/promises')
 */
const FS_IMPORT_OR_REQUIRE_REGEX =
  /\b(import\s*\(\s*["'`]\s*(node:)?fs(\/promises)?\s*["'`]\s*\)|require\s*\(\s*["'`]\s*(node:)?fs(\/promises)?\s*["'`]\s*\)|import\s+[\s\S]*?\s+from\s+["'`]\s*(node:)?fs(\/promises)?\s*["'`]|import\s+["'`]\s*(node:)?fs(\/promises)?\s*["'`])/;

/**
 * Normalizes a file path to POSIX relative path from workspace root.
 */
export function normalizeRelativePath(fullPath: string, workspaceRoot: string): string {
  const rel = path.relative(workspaceRoot, fullPath);
  return rel.replace(/\\/g, "/");
}

/**
 * Checks arbitrary content string for persistence boundary violations.
 * Useful for deterministic testing and static analysis.
 */
export function checkContentForViolations(
  relativeFilePath: string,
  content: string,
  allowlistEntry?: { allowedOperations: string[]; reason: string },
): PersistenceViolation[] {
  const violations: PersistenceViolation[] = [];
  const lines = content.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const lineContent = lines[i];
    const lineNum = i + 1;

    // Rule 1: Prohibit any reference to db.json in runtime source (even in allowlisted files)
    if (PROHIBITED_DB_JSON_REGEX.test(lineContent)) {
      violations.push({
        filePath: relativeFilePath,
        line: lineNum,
        snippet: lineContent.trim(),
        rule: "PROHIBIT_DB_JSON",
        reason: "Reference to legacy 'db.json' is strictly prohibited in runtime application code.",
      });
    }

    // Rule 2: Prohibit file-based database packages / engines (even in allowlisted files)
    if (PROHIBITED_FILE_DB_MODULES.test(lineContent)) {
      violations.push({
        filePath: relativeFilePath,
        line: lineNum,
        snippet: lineContent.trim(),
        rule: "PROHIBIT_FILE_DB_MODULE",
        reason: "File-based database engines (lowdb, diskdb, etc.) are prohibited in runtime application code.",
      });
    }

    // Rule 3: Prohibit mutable filesystem persistence write operations (strictly enforced even in allowlisted files)
    if (PROHIBITED_WRITE_OPS.test(lineContent)) {
      violations.push({
        filePath: relativeFilePath,
        line: lineNum,
        snippet: lineContent.trim(),
        rule: "PROHIBIT_FS_PERSISTENCE_WRITES",
        reason: "Mutable filesystem write operations (writeFile, createWriteStream, etc.) cannot be used for application persistence.",
      });
    }

    // Rule 4: Prohibit fs static imports, dynamic imports, and require calls unless explicitly allowlisted
    if (FS_IMPORT_OR_REQUIRE_REGEX.test(lineContent) && !allowlistEntry) {
      violations.push({
        filePath: relativeFilePath,
        line: lineNum,
        snippet: lineContent.trim(),
        rule: "PROHIBIT_UNAUTHORIZED_FS_IMPORT",
        reason: "Filesystem module access (static import, dynamic import, or require) in runtime source must be explicitly allowlisted with approved architectural justification.",
      });
    }
  }

  return violations;
}

/**
 * Recursively scans directory for source files (.ts, .tsx, .js, .jsx, .mjs, .cjs).
 */
function collectSourceFiles(dirPath: string): string[] {
  if (!fs.existsSync(dirPath)) {
    return [];
  }

  const results: string[] = [];
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== "node_modules" && entry.name !== "dist" && entry.name !== "build") {
        results.push(...collectSourceFiles(fullPath));
      }
    } else if (entry.isFile() && /\.(ts|tsx|js|jsx|mjs|cjs)$/.test(entry.name)) {
      results.push(fullPath);
    }
  }

  return results;
}

/**
 * Scans the entire workspace runtime source for persistence boundary violations.
 */
export function scanWorkspaceForPersistenceViolations(workspaceRoot: string): PersistenceViolation[] {
  const violations: PersistenceViolation[] = [];

  for (const relDir of RUNTIME_SOURCE_DIRS) {
    const fullDir = path.resolve(workspaceRoot, relDir);
    const sourceFiles = collectSourceFiles(fullDir);

    for (const sourceFile of sourceFiles) {
      const relPath = normalizeRelativePath(sourceFile, workspaceRoot);
      const content = fs.readFileSync(sourceFile, "utf-8");
      const allowlistEntry = RUNTIME_FS_ALLOWLIST[relPath];

      const fileViolations = checkContentForViolations(relPath, content, allowlistEntry);
      violations.push(...fileViolations);
    }
  }

  return violations;
}

/**
 * Asserts that the workspace runtime source contains zero persistence boundary violations.
 * Throws a sanitized, path-safe error if violations are found.
 */
export function assertNoLegacyPersistence(workspaceRoot: string): void {
  const violations = scanWorkspaceForPersistenceViolations(workspaceRoot);

  if (violations.length > 0) {
    const details = violations
      .map((v) => `  - [${v.rule}] ${v.filePath}:${v.line} — ${v.reason}\n    Snippet: ${v.snippet}`)
      .join("\n");

    throw new Error(
      `[PERSISTENCE_GUARD_VIOLATION] Discovered ${violations.length} prohibited legacy persistence pattern(s) in runtime code:\n${details}`,
    );
  }
}
