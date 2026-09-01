import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, "../../..");
const SCHEMA_PATH = path.resolve(REPO_ROOT, "apps/api/prisma/schema.prisma");
const MIGRATIONS_DIR = path.resolve(REPO_ROOT, "apps/api/prisma/migrations");
const ROOT_PACKAGE_PATH = path.resolve(REPO_ROOT, "package.json");
const API_PACKAGE_PATH = path.resolve(REPO_ROOT, "apps/api/package.json");
const CONTROLLERS_DIR = path.resolve(REPO_ROOT, "apps/api/src/modules");
const SEED_DIR = path.resolve(REPO_ROOT, "apps/api/src/infrastructure/seed");
const SCRIPTS_DIR = path.resolve(REPO_ROOT, "apps/api/scripts");

export interface SeedSafetyGuardResult {
  passed: boolean;
  violations: string[];
}

export interface SeedSafetyGuardInput {
  packageJsons?: Array<{ path: string; content: string }>;
  migrationSqls?: Array<{ name: string; sql: string }>;
  schemaContent?: string;
  codeFiles?: Array<{ path: string; content: string }>;
}

/**
 * Pure evaluation function for seed safety and governance rules.
 * Can be run against real workspace content or synthetic test probe fixtures.
 */
export function evaluateSeedSafety(inputs: SeedSafetyGuardInput): SeedSafetyGuardResult {
  const violations: string[] = [];

  // 1. Evaluate package.json scripts (prohibit seed:prod, seed:staging, and generic unsafe seed wrapper)
  if (inputs.packageJsons !== undefined) {
    for (const pkg of inputs.packageJsons) {
      try {
        const parsed = JSON.parse(pkg.content);
        const scripts = parsed.scripts || {};

        const prohibitedScriptNames = [
          "seed:prod",
          "seed:production",
          "seed:staging",
          "seed:stage",
          "seed:live",
          "seed:main",
        ];

        for (const script of prohibitedScriptNames) {
          if (scripts[script] !== undefined) {
            violations.push(`Prohibited unsafe seed script '${script}' found in ${pkg.path}.`);
          }
        }

        // Prohibit generic unsafe "seed" script unless explicitly mapped to a safe dev/test runner with fail-closed checks
        if (scripts["seed"] !== undefined) {
          const targetCommand = String(scripts["seed"]);
          if (!targetCommand.includes("seed:dev") && !targetCommand.includes("seed:test")) {
            violations.push(`Prohibited generic unsafe seed script 'seed' found in ${pkg.path}.`);
          }
        }
      } catch {
        violations.push(`Failed to parse JSON for ${pkg.path}`);
      }
    }
  }

  // 2. Evaluate migrations (ensure ZERO fixture INSERT / UPDATE / DELETE statements in schema migrations)
  if (inputs.migrationSqls !== undefined) {
    for (const m of inputs.migrationSqls) {
      const sql = m.sql;

      // Check for INSERT fixture statements
      const insertMatches = Array.from(sql.matchAll(/INSERT\s+INTO\s+["'`]?([a-zA-Z0-9_]+)["'`]?/gi));
      for (const match of insertMatches) {
        const table = match[1];
        violations.push(`Prohibited fixture INSERT statement into table '${table}' in migration ${m.name}.`);
      }

      // Check for UPDATE fixture statements
      const updateMatches = Array.from(sql.matchAll(/UPDATE\s+["'`]?([a-zA-Z0-9_]+)["'`]?\s+SET/gi));
      for (const match of updateMatches) {
        const table = match[1];
        violations.push(`Prohibited fixture UPDATE statement on table '${table}' in migration ${m.name}.`);
      }

      // Check for DELETE fixture statements
      const deleteMatches = Array.from(sql.matchAll(/DELETE\s+FROM\s+["'`]?([a-zA-Z0-9_]+)["'`]?/gi));
      for (const match of deleteMatches) {
        const table = match[1];
        violations.push(`Prohibited fixture DELETE statement on table '${table}' in migration ${m.name}.`);
      }
    }
  }

  // 3. Evaluate schema (ensure ZERO product-domain models)
  if (inputs.schemaContent !== undefined) {
    const schema = inputs.schemaContent;
    const modelMatches = Array.from(schema.matchAll(/model\s+([a-zA-Z0-9_]+)\s*\{/gi));
    for (const match of modelMatches) {
      const modelName = match[1];
      const normalized = modelName.toLowerCase().replace(/[^a-z0-9]/g, "");

      const prohibitedDomainRoots = [
        "academy",
        "simulation",
        "community",
        "subscription",
        "ai",
        "course",
        "lesson",
        "trade",
        "portfolio",
        "leaderboard",
        "productaudit",
      ];

      for (const root of prohibitedDomainRoots) {
        if (normalized === root || normalized.startsWith(root) || normalized.includes(root)) {
          violations.push(`Prohibited product domain model '${modelName}' detected in schema.prisma.`);
        }
      }
    }
  }

  // 4. Evaluate code files (routes, constants, credential logging, Redis durable seed, product fixture aliases)
  if (inputs.codeFiles !== undefined) {
    for (const file of inputs.codeFiles) {
      const content = file.content;
      if (file.path.endsWith(".test.ts") || file.path.endsWith(".spec.ts")) continue;

      // A. Prohibit public grant-admin / role management routes
      const routeMatch = content.match(/(?:\.|\b)(?:post|get|put|delete|patch|use)\s*\(\s*["'`]\/?(?:api\/)?(?:grant-admin|admin\/grant|admin\/users\/grant|roles\/assign|signup-as-admin)/i);
      if (routeMatch || content.includes("/grant-admin") || content.includes("/api/grant-admin") || content.includes("/api/admin/users/grant") || content.includes("/admin/grant")) {
        violations.push(`Prohibited public admin/role assignment route '${routeMatch ? routeMatch[0] : "grant-admin"}' detected in ${file.path}.`);
      }

      // B. Prohibit default hardcoded admin password constants
      const constMatch = content.match(/DEFAULT_ADMIN_PASSWORD\s*=\s*["'`][^"'`]+["'`]|defaultAdminPassword\s*=\s*["'`][^"'`]+["'`]/i);
      if (constMatch) {
        violations.push(`Prohibited default admin password constant '${constMatch[0]}' detected in ${file.path}.`);
      }

      // C. Prohibit automatic admin assignment to all registered users
      if (/roles:\s*\[["']ADMIN["']\]/i.test(content) && file.path.includes("registration.service")) {
        violations.push(`Prohibited automatic ADMIN role assignment detected in ${file.path}.`);
      }

      // D. Prohibit plaintext credential and password hash logging (console.*, logger.*, appLogger.*, structured objects)
      const sensitiveFieldNames = [
        "password",
        "passwordHash",
        "password_hash",
        "credential",
        "credentials",
        "secret",
        "token",
        "accessToken",
        "access_token",
        "refreshToken",
        "refresh_token",
        "cookie",
        "authorization",
        "apiKey",
        "api_key",
        "DEV_SEED_USER_PASSWORD",
      ];

      const loggerCallRegex = /(?:console|logger|appLogger)\s*\.\s*(?:log|error|warn|info|debug|trace)\s*\(([\s\S]*?)\)(?:;|\n|$)/gi;
      let logMatch: RegExpExecArray | null;
      while ((logMatch = loggerCallRegex.exec(content)) !== null) {
        const callArgs = logMatch[1];

        let foundSensitive = false;
        for (const key of sensitiveFieldNames) {
          const keyPattern = new RegExp(`(?:["']?${key}["']?\\s*:|\\b${key}\\b(?:\\s*[,}]|\\s*=))`, "i");
          if (keyPattern.test(callArgs)) {
            violations.push(`Prohibited credential, secret, or hash logging of field '${key}' detected in ${file.path}.`);
            foundSensitive = true;
            break;
          }
        }

        if (!foundSensitive && /DEV_SEED_USER_PASSWORD/i.test(callArgs)) {
          violations.push(`Prohibited environment credential logging of 'DEV_SEED_USER_PASSWORD' detected in ${file.path}.`);
        }
      }

      // E. Prohibit durable seed authority in Redis
      if (/redis\.(?:set|hset|hmset)\s*\(\s*["'](?:seed:|seed_)/i.test(content)) {
        violations.push(`Prohibited durable seed key in Redis detected in ${file.path}.`);
      }

      // F. Prohibit premature product-domain fixture seed aliases (courseTitle, lesson, trade, portfolio, leaderboard)
      if (file.path.includes("seed") && !file.path.endsWith(".test.ts")) {
        const productAliases = [
          /\bcourseTitle\b/i,
          /\blessonTitle\b/i,
          /\bportfolioBalance\b/i,
          /\bleaderboardRank\b/i,
          /\btradeQuantity\b/i,
        ];
        for (const alias of productAliases) {
          const match = content.match(alias);
          if (match) {
            violations.push(`Prohibited product domain fixture property '${match[0]}' detected in ${file.path}.`);
          }
        }
      }
    }
  }

  return {
    passed: violations.length === 0,
    violations,
  };
}

/**
 * Runs the seed safety guard against workspace filesystem artifacts.
 */
export function runSeedSafetyGuard(): SeedSafetyGuardResult {
  const packageJsons: Array<{ path: string; content: string }> = [];
  if (fs.existsSync(ROOT_PACKAGE_PATH)) {
    packageJsons.push({
      path: path.relative(REPO_ROOT, ROOT_PACKAGE_PATH),
      content: fs.readFileSync(ROOT_PACKAGE_PATH, "utf8"),
    });
  }
  if (fs.existsSync(API_PACKAGE_PATH)) {
    packageJsons.push({
      path: path.relative(REPO_ROOT, API_PACKAGE_PATH),
      content: fs.readFileSync(API_PACKAGE_PATH, "utf8"),
    });
  }

  const migrationSqls: Array<{ name: string; sql: string }> = [];
  if (fs.existsSync(MIGRATIONS_DIR)) {
    const migrationDirs = fs.readdirSync(MIGRATIONS_DIR).filter((f) => {
      return fs.statSync(path.join(MIGRATIONS_DIR, f)).isDirectory();
    });

    for (const mDir of migrationDirs) {
      const sqlFile = path.join(MIGRATIONS_DIR, mDir, "migration.sql");
      if (fs.existsSync(sqlFile)) {
        migrationSqls.push({
          name: mDir,
          sql: fs.readFileSync(sqlFile, "utf8"),
        });
      }
    }
  }

  const schemaContent = fs.existsSync(SCHEMA_PATH) ? fs.readFileSync(SCHEMA_PATH, "utf8") : "";

  const codeFiles: Array<{ path: string; content: string }> = [];
  const collectCode = (dir: string) => {
    if (!fs.existsSync(dir)) return;
    const items = fs.readdirSync(dir);
    for (const item of items) {
      const fullPath = path.join(dir, item);
      if (fs.statSync(fullPath).isDirectory()) {
        collectCode(fullPath);
      } else if (item.endsWith(".ts") && !item.startsWith("guard-") && !item.endsWith(".test.ts") && !item.endsWith(".spec.ts")) {
        codeFiles.push({
          path: path.relative(REPO_ROOT, fullPath),
          content: fs.readFileSync(fullPath, "utf8"),
        });
      }
    }
  };

  collectCode(CONTROLLERS_DIR);
  collectCode(SEED_DIR);
  collectCode(SCRIPTS_DIR);

  return evaluateSeedSafety({
    packageJsons,
    migrationSqls,
    schemaContent,
    codeFiles,
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename)) {
  const result = runSeedSafetyGuard();
  if (result.passed) {
    console.log("[SEED_SAFETY_GUARD] PASS");
    console.log("[SEED_SAFETY_GUARD] Zero unsafe seed scripts, migration fixtures, or default admin backdoors detected.");
    process.exit(0);
  } else {
    console.error("[SEED_SAFETY_GUARD] FAIL");
    for (const v of result.violations) {
      console.error(`  - ${v}`);
    }
    process.exit(1);
  }
}
