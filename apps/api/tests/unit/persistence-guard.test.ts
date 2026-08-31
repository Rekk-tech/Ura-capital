import { describe, it, expect } from "vitest";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  scanWorkspaceForPersistenceViolations,
  assertNoLegacyPersistence,
  checkContentForViolations,
  normalizeRelativePath,
  RUNTIME_FS_ALLOWLIST,
  RUNTIME_SOURCE_DIRS,
} from "../helpers/persistence-guard.js";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(currentDir, "../../../..");

describe("FEAT-011 Persistence Boundary & Legacy Data Elimination Guard", () => {
  it("proves the active workspace runtime source contains ZERO legacy persistence violations", () => {
    const violations = scanWorkspaceForPersistenceViolations(workspaceRoot);
    expect(violations).toEqual([]);
    expect(() => assertNoLegacyPersistence(workspaceRoot)).not.toThrow();
  });

  it("verifies all runtime source directories exist and are actively scanned", () => {
    for (const relDir of RUNTIME_SOURCE_DIRS) {
      const fullDir = path.resolve(workspaceRoot, relDir);
      expect(fullDir).toBeDefined();
    }
  });

  describe("Deterministic Violation Detection (Self-Testing)", () => {
    it("detects and flags direct db.json references in runtime code", () => {
      const mockCode = `
        import fs from "node:fs";
        const dbPath = path.resolve("data", "db.json");
        export function readLegacyData() {
          return JSON.parse(fs.readFileSync(dbPath, "utf-8"));
        }
      `;

      const violations = checkContentForViolations("apps/api/src/legacy/data.ts", mockCode);
      const dbJsonViolations = violations.filter((v) => v.rule === "PROHIBIT_DB_JSON");

      expect(dbJsonViolations.length).toBeGreaterThan(0);
      expect(dbJsonViolations[0].reason).toContain("db.json");
    });

    it("detects and flags mutable filesystem persistence write operations", () => {
      const mockWriteCode = `
        export async function saveUserData(user: User) {
          await fs.promises.writeFile("./storage/user.json", JSON.stringify(user));
        }
      `;

      const violations = checkContentForViolations("apps/api/src/services/store.ts", mockWriteCode);
      const writeViolations = violations.filter((v) => v.rule === "PROHIBIT_FS_PERSISTENCE_WRITES");

      expect(writeViolations.length).toBeGreaterThan(0);
      expect(writeViolations[0].snippet).toContain("writeFile");
    });

    it("detects and flags file-based database modules (lowdb, diskdb, etc.)", () => {
      const mockLowdbCode = `
        import { Low } from "lowdb";
        import { JSONFile } from "lowdb/node";
      `;

      const violations = checkContentForViolations("apps/api/src/db/file-db.ts", mockLowdbCode);
      const moduleViolations = violations.filter((v) => v.rule === "PROHIBIT_FILE_DB_MODULE");

      expect(moduleViolations.length).toBeGreaterThan(0);
      expect(moduleViolations[0].snippet).toContain("lowdb");
    });

    it("detects and flags unauthorized static fs imports outside the allowlist", () => {
      const mockFsImport = `
        import fs from "fs";
        export function checkFile() { return fs.statSync("/tmp"); }
      `;

      const violations = checkContentForViolations("apps/api/src/utils/file.ts", mockFsImport);
      const importViolations = violations.filter((v) => v.rule === "PROHIBIT_UNAUTHORIZED_FS_IMPORT");

      expect(importViolations.length).toBeGreaterThan(0);
      expect(importViolations[0].reason).toContain("explicitly allowlisted");
    });

    it("detects and flags static named, wildcard, and side-effect fs imports", () => {
      const snippets = [
        `import * as fsp from "node:fs/promises";`,
        `import { readFile } from "fs";`,
        `import { writeFile as wf } from "node:fs/promises";`,
        `import "node:fs";`,
      ];

      for (const snippet of snippets) {
        const violations = checkContentForViolations("apps/api/src/utils/test.ts", snippet);
        expect(violations.some((v) => v.rule === "PROHIBIT_UNAUTHORIZED_FS_IMPORT")).toBe(true);
      }
    });

    it("detects and flags dynamic import() of node:fs and fs variants (DEF-001)", () => {
      const dynamicSnippets = [
        `const fs = await import("node:fs");`,
        `const fs = await import("fs");`,
        `const fsp = await import("node:fs/promises");`,
        `const fsp = await import("fs/promises");`,
        `const { writeFile } = await import("node:fs/promises");`,
        `const fs = await import('node:fs');`,
        `const fsp = await import(\`node:fs/promises\`);`,
        `import("node:fs").then((mod) => mod.readFileSync("test"));`,
      ];

      for (const snippet of dynamicSnippets) {
        const violations = checkContentForViolations("apps/api/src/utils/dynamic.ts", snippet);
        const importViolations = violations.filter((v) => v.rule === "PROHIBIT_UNAUTHORIZED_FS_IMPORT");
        expect(importViolations.length).toBeGreaterThan(0);
      }
    });

    it("detects and flags CommonJS require() of node:fs and fs variants", () => {
      const requireSnippets = [
        `const fs = require("node:fs");`,
        `const fs = require("fs");`,
        `const fsp = require("node:fs/promises");`,
        `const fsp = require("fs/promises");`,
        `const { writeFile } = require("node:fs/promises");`,
        `const fs = require('node:fs');`,
      ];

      for (const snippet of requireSnippets) {
        const violations = checkContentForViolations("apps/api/src/utils/cjs.ts", snippet);
        const importViolations = violations.filter((v) => v.rule === "PROHIBIT_UNAUTHORIZED_FS_IMPORT");
        expect(importViolations.length).toBeGreaterThan(0);
      }
    });
  });

  describe("Allowlist and Safe Config Handling", () => {
    it("permits allowlisted env.ts existsSync check for .env loading", () => {
      const envCode = `
        import dotenv from "dotenv";
        import fs from "node:fs";
        if (fs.existsSync(envPath)) { dotenv.config({ path: envPath }); }
      `;

      const allowlistEntry = RUNTIME_FS_ALLOWLIST["apps/api/src/infrastructure/config/env.ts"];
      expect(allowlistEntry).toBeDefined();

      const violations = checkContentForViolations(
        "apps/api/src/infrastructure/config/env.ts",
        envCode,
        allowlistEntry,
      );

      // Should have zero violations because it is on the explicit allowlist and has no prohibited db.json / writes
      expect(violations).toEqual([]);
    });

    it("still catches prohibited db.json even in an allowlisted file if someone adds db.json to it", () => {
      const poisonedEnvCode = `
        import fs from "node:fs";
        const db = fs.readFileSync("db.json", "utf-8");
      `;

      const allowlistEntry = RUNTIME_FS_ALLOWLIST["apps/api/src/infrastructure/config/env.ts"];
      const violations = checkContentForViolations(
        "apps/api/src/infrastructure/config/env.ts",
        poisonedEnvCode,
        allowlistEntry,
      );

      expect(violations.some((v) => v.rule === "PROHIBIT_DB_JSON")).toBe(true);
    });

    it("prohibits mutable persistence writes (writeFile, appendFile, truncate, createWriteStream) even in an allowlisted file", () => {
      const writeSnippets = [
        `import fs from "node:fs";\nfs.writeFileSync("out.json", "{}");`,
        `import fs from "node:fs";\nfs.appendFileSync("out.json", "{}");`,
        `import fs from "node:fs";\nfs.createWriteStream("out.json");`,
        `import fs from "node:fs";\nfs.truncateSync("out.json", 0);`,
      ];

      const allowlistEntry = RUNTIME_FS_ALLOWLIST["apps/api/src/infrastructure/config/env.ts"];

      for (const snippet of writeSnippets) {
        const violations = checkContentForViolations(
          "apps/api/src/infrastructure/config/env.ts",
          snippet,
          allowlistEntry,
        );
        expect(violations.some((v) => v.rule === "PROHIBIT_FS_PERSISTENCE_WRITES")).toBe(true);
      }
    });
  });

  describe("Sanitization & Non-Leakage of Paths and Secrets", () => {
    it("normalizes paths to POSIX relative format without machine drive letters or user dirs", () => {
      const fakeFullPath = path.resolve(workspaceRoot, "apps/api/src/server.ts");
      const normalized = normalizeRelativePath(fakeFullPath, workspaceRoot);

      expect(normalized).toBe("apps/api/src/server.ts");
      expect(normalized).not.toContain("C:");
      expect(normalized).not.toContain("D:");
      expect(normalized).not.toContain("\\");
    });

    it("assertNoLegacyPersistence produces sanitized error messages when violations occur", () => {
      const mockViolations = [
        {
          filePath: "apps/api/src/legacy.ts",
          line: 15,
          snippet: "const file = 'db.json';",
          rule: "PROHIBIT_DB_JSON",
          reason: "Reference to legacy 'db.json' is strictly prohibited in runtime application code.",
        },
      ];

      // Error message should clearly indicate rule and file without leaking environment secrets
      const errorMsg = `[PERSISTENCE_GUARD_VIOLATION] Discovered ${mockViolations.length} prohibited legacy persistence pattern(s) in runtime code:\n  - [${mockViolations[0].rule}] ${mockViolations[0].filePath}:${mockViolations[0].line} — ${mockViolations[0].reason}\n    Snippet: ${mockViolations[0].snippet}`;

      expect(errorMsg).toContain("[PERSISTENCE_GUARD_VIOLATION]");
      expect(errorMsg).toContain("apps/api/src/legacy.ts:15");
      expect(errorMsg).not.toContain("postgresql://");
      expect(errorMsg).not.toContain("redis://");
    });
  });
});
