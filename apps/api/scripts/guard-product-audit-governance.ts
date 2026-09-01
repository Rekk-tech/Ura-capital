import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { AUDIT_EVENT_TYPES } from "../src/modules/auth/audit-event.constants.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, "../../..");
const SCHEMA_PATH = path.resolve(REPO_ROOT, "apps/api/prisma/schema.prisma");
const MIGRATIONS_DIR = path.resolve(REPO_ROOT, "apps/api/prisma/migrations");
const GOVERNANCE_DOC_PATH = path.resolve(REPO_ROOT, "docs/product-audit-governance.md");
const CONTROLLERS_DIR = path.resolve(REPO_ROOT, "apps/api/src/modules");
const WEB_SRC_DIR = path.resolve(REPO_ROOT, "apps/web/src");

export interface ProductAuditGuardResult {
  passed: boolean;
  violations: string[];
}

export interface GovernanceGuardEvaluationInput {
  schemaContent?: string;
  migrationSqls?: Array<{ name: string; sql: string }>;
  docContent?: string;
  codeFiles?: Array<{ path: string; content: string }>;
  uiFiles?: Array<{ path: string; content: string }>;
  auditEventTypes?: Record<string, string> | readonly string[];
}

/**
 * Pure evaluation function for product audit governance scope guards.
 * Can be run against real workspace content or synthetic test probe fixtures.
 */
export function evaluateProductAuditGovernance(inputs: GovernanceGuardEvaluationInput): ProductAuditGuardResult {
  const violations: string[] = [];

  // 1. Evaluate Governance Documentation
  if (inputs.docContent !== undefined) {
    const requiredSections = [
      "Authority & Storage Boundary",
      "Separation of Auth/Security Audit vs Product Audit",
      "Product Audit Event Semantics",
      "Operation Source Model",
      "Metadata Governance & Data Privacy",
      "Transaction Strategy Classification",
      "Layering & Architectural Boundaries",
      "Schema Activation Gate",
      "Retention, Deletion & Idempotency",
      "Observability vs Durable Audit Boundary",
    ];

    for (const section of requiredSections) {
      if (!inputs.docContent.includes(section)) {
        violations.push(`Governance doc missing required section: "${section}"`);
      }
    }
  }

  // 2. Evaluate Prisma Schema
  if (inputs.schemaContent !== undefined) {
    const schema = inputs.schemaContent;

    // A. Parse all model declarations
    const modelMatches = Array.from(schema.matchAll(/model\s+([a-zA-Z0-9_]+)\s*\{([^}]*)\}/gi));
    for (const match of modelMatches) {
      const modelName = match[1];
      const modelBody = match[2];
      const normalizedModel = modelName.toLowerCase().replace(/[^a-z0-9]/g, "");

      // Check prohibited domain roots
      const prohibitedDomainRoots = [
        "ai",
        "academy",
        "simulation",
        "community",
        "subscription",
        "productaudit",
        "businessaudit",
        "auditlog",
      ];

      for (const root of prohibitedDomainRoots) {
        if (normalizedModel === root || normalizedModel.startsWith(root) || normalizedModel.includes(root)) {
          // Exempt approved AuthSecurityAuditRecord
          if (modelName === "AuthSecurityAuditRecord") continue;
          violations.push(`Prohibited product/domain model '${modelName}' detected in schema.prisma.`);
        }
      }

      // Check @@map table mapping
      const mapMatch = modelBody.match(/@@map\(["']([^"']+)["']\)/i);
      if (mapMatch) {
        const mappedTable = mapMatch[1];
        const normalizedTable = mappedTable.toLowerCase().replace(/[^a-z0-9]/g, "");

        if (normalizedTable.includes("productaudit") || normalizedTable.includes("businessaudit") || (normalizedTable.includes("audit") && mappedTable !== "auth_security_audit_records")) {
          violations.push(`Prohibited product audit table mapping '@@map("${mappedTable}")' in model '${modelName}'.`);
        }
      }

      // Check AuthSecurityAuditRecord field repurposing
      if (modelName === "AuthSecurityAuditRecord") {
        const productFieldPatterns = [
          /\bproductEventType\b/i,
          /\bproductEvent\b/i,
          /\bdomain\b/i,
          /\blessonId\b/i,
          /\borderId\b/i,
          /\bportfolioId\b/i,
          /\bcourseId\b/i,
          /\bcommunityId\b/i,
          /\bsubscriptionId\b/i,
          /\baiPromptId\b/i,
          /\bproduct_[a-zA-Z0-9_]+\b/i,
        ];

        for (const pattern of productFieldPatterns) {
          if (pattern.test(modelBody)) {
            violations.push(`Prohibited product field detected in AuthSecurityAuditRecord.`);
          }
        }
      }
    }

    // B. Verify AuthSecurityAuditRecord is preserved exactly
    if (!schema.includes("model AuthSecurityAuditRecord")) {
      violations.push("AuthSecurityAuditRecord model is missing from schema.prisma.");
    }
  }

  // 3. Evaluate SQL Migrations
  if (inputs.migrationSqls !== undefined) {
    for (const m of inputs.migrationSqls) {
      const sql = m.sql;
      // Match CREATE TABLE with optional quotes and IF NOT EXISTS
      const tableMatches = Array.from(sql.matchAll(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?["'`]?([a-zA-Z0-9_]+)["'`]?/gi));
      for (const tMatch of tableMatches) {
        const rawTable = tMatch[1];
        const normalized = rawTable.toLowerCase().replace(/[^a-z0-9]/g, "");

        const prohibitedRoots = [
          "productaudit",
          "businessaudit",
          "productauditevent",
          "productauditrecord",
          "academy",
          "simulation",
          "community",
          "subscription",
          "ai_",
          "aiprompt",
          "aiquota",
        ];

        for (const root of prohibitedRoots) {
          const normRoot = root.replace(/[^a-z0-9]/g, "");
          if (normalized === normRoot || normalized.startsWith(normRoot) || normalized.includes(normRoot)) {
            // Exempt approved auth table
            if (rawTable === "auth_security_audit_records") continue;
            violations.push(`Prohibited table creation '${rawTable}' in migration ${m.name}.`);
          }
        }
      }
    }
  }

  // 4. Evaluate Code Files (Routes, Controllers, Services, Pages)
  if (inputs.codeFiles !== undefined) {
    for (const file of inputs.codeFiles) {
      const content = file.content;
      if (file.path.endsWith(".test.ts") || file.path.endsWith(".spec.ts")) continue;

      // Prohibit product audit endpoints (both with and without /api prefix)
      if (/(?:\.|\b)(?:post|get|put|delete|patch|use)\s*\(\s*["'`]\/?(?:api\/)?(?:product[-_]?audit|audit\/product|audits)/i.test(content) ||
          content.includes("/product-audit") ||
          content.includes("/api/product-audit") ||
          content.includes("/audit/product")) {
        violations.push(`Prohibited product audit HTTP route detected in ${file.path}.`);
      }

      // Prohibit premature product audit repositories, services, controllers
      const classMatch = content.match(/ProductAuditController|ProductAuditPersistenceService|ProductAuditRepository|ProductAuditService/i);
      if (classMatch) {
        violations.push(`Prohibited product audit class implementation '${classMatch[0]}' detected in ${file.path}.`);
      }
    }
  }

  // 5. Evaluate UI Files (Pages, Components, Viewers)
  if (inputs.uiFiles !== undefined) {
    for (const file of inputs.uiFiles) {
      const content = file.content;
      if (file.path.endsWith(".test.tsx") || file.path.endsWith(".spec.tsx")) continue;

      const uiMatch = content.match(/ProductAuditViewer|ProductAuditLog|AuditLogViewer|ProductAuditPage/i);
      if (uiMatch) {
        violations.push(`Prohibited product audit UI component '${uiMatch[0]}' detected in ${file.path}.`);
      }
    }
  }

  // 6. Evaluate FEAT-009 Auth Taxonomy Invariance
  if (inputs.auditEventTypes !== undefined) {
    const events = Array.isArray(inputs.auditEventTypes)
      ? inputs.auditEventTypes
      : Object.values(inputs.auditEventTypes);

    const allowedAuthPrefixes = ["REGISTRATION_", "LOGIN_", "REFRESH_", "LOGOUT_", "AUTHENTICATION_", "AUTHORIZATION_", "ROLE_"];
    const prohibitedKeywords = ["LESSON", "COURSE", "ORDER", "SIMULATION", "PORTFOLIO", "POST", "COMMENT", "SUBSCRIPTION", "AI_", "PRODUCT"];

    for (const event of events) {
      const isAuthScoped = allowedAuthPrefixes.some((prefix) => event.startsWith(prefix));
      const hasProhibitedTerm = prohibitedKeywords.some((term) => event.toUpperCase().includes(term));

      if (!isAuthScoped || hasProhibitedTerm) {
        violations.push(`Prohibited product event name '${event}' detected in auth security audit taxonomy.`);
      }
    }
  }

  return {
    passed: violations.length === 0,
    violations,
  };
}

/**
 * Runs the guard against active workspace filesystem artifacts.
 */
export function runProductAuditGovernanceGuard(): ProductAuditGuardResult {
  const docContent = fs.existsSync(GOVERNANCE_DOC_PATH) ? fs.readFileSync(GOVERNANCE_DOC_PATH, "utf8") : "";
  const schemaContent = fs.existsSync(SCHEMA_PATH) ? fs.readFileSync(SCHEMA_PATH, "utf8") : "";

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

  const codeFiles: Array<{ path: string; content: string }> = [];
  if (fs.existsSync(CONTROLLERS_DIR)) {
    const collectCode = (dir: string) => {
      const items = fs.readdirSync(dir);
      for (const item of items) {
        const fullPath = path.join(dir, item);
        if (fs.statSync(fullPath).isDirectory()) {
          collectCode(fullPath);
        } else if (item.endsWith(".ts")) {
          codeFiles.push({
            path: path.relative(REPO_ROOT, fullPath),
            content: fs.readFileSync(fullPath, "utf8"),
          });
        }
      }
    };
    collectCode(CONTROLLERS_DIR);
  }

  const uiFiles: Array<{ path: string; content: string }> = [];
  if (fs.existsSync(WEB_SRC_DIR)) {
    const collectUi = (dir: string) => {
      const items = fs.readdirSync(dir);
      for (const item of items) {
        const fullPath = path.join(dir, item);
        if (fs.statSync(fullPath).isDirectory()) {
          collectUi(fullPath);
        } else if (item.endsWith(".tsx") || item.endsWith(".ts")) {
          uiFiles.push({
            path: path.relative(REPO_ROOT, fullPath),
            content: fs.readFileSync(fullPath, "utf8"),
          });
        }
      }
    };
    collectUi(WEB_SRC_DIR);
  }

  return evaluateProductAuditGovernance({
    docContent,
    schemaContent,
    migrationSqls,
    codeFiles,
    uiFiles,
    auditEventTypes: AUDIT_EVENT_TYPES,
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename)) {
  const result = runProductAuditGovernanceGuard();
  if (result.passed) {
    console.log("[PRODUCT_AUDIT_GOVERNANCE_GUARD] PASS");
    console.log("[PRODUCT_AUDIT_GOVERNANCE_GUARD] Zero premature product audit schemas, models, or APIs detected.");
    process.exit(0);
  } else {
    console.error("[PRODUCT_AUDIT_GOVERNANCE_GUARD] FAIL");
    for (const v of result.violations) {
      console.error(`  - ${v}`);
    }
    process.exit(1);
  }
}
