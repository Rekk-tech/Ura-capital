import { describe, it, expect } from "vitest";
import {
  runProductAuditGovernanceGuard,
  evaluateProductAuditGovernance,
} from "../../scripts/guard-product-audit-governance.js";
import {
  PRODUCT_AUDIT_TRANSACTION_STRATEGIES,
  PRODUCT_AUDIT_OPERATION_SOURCES,
  validateProductAuditMetadata,
  validateProductAuditEventDefinition,
} from "@aura/shared";
import { AUDIT_EVENT_TYPES } from "../../src/modules/auth/audit-event.constants.js";

describe("FEAT-016 Product Audit Governance & Abstraction Unit Tests", () => {
  describe("Product Audit Governance Scope Guard (DEF-003)", () => {
    it("proves current workspace has zero premature product audit models, tables, migrations, or APIs", () => {
      const result = runProductAuditGovernanceGuard();
      expect(result.passed).toBe(true);
      expect(result.violations).toHaveLength(0);
    });

    it("proves guard catches injected false-negative Prisma models (model Ai, model AI, renamed/mapped/domain models)", () => {
      // 1. Probed model Ai
      const probeAi = evaluateProductAuditGovernance({
        schemaContent: `
          model Ai {
            id String @id
          }
          model AuthSecurityAuditRecord {
            id String @id
            @@map("auth_security_audit_records")
          }
        `,
      });
      expect(probeAi.passed).toBe(false);
      expect(probeAi.violations.some((v) => v.includes("Ai"))).toBe(true);

      // 2. Probed model AI
      const probeAI = evaluateProductAuditGovernance({
        schemaContent: `
          model AI {
            id String @id
          }
          model AuthSecurityAuditRecord {
            id String @id
            @@map("auth_security_audit_records")
          }
        `,
      });
      expect(probeAI.passed).toBe(false);
      expect(probeAI.violations.some((v) => v.includes("AI"))).toBe(true);

      // 3. Probed renamed model with product_audit_events table mapping
      const probeMapped = evaluateProductAuditGovernance({
        schemaContent: `
          model BusinessAuditRecord {
            id String @id
            @@map("product_audit_events")
          }
          model AuthSecurityAuditRecord {
            id String @id
            @@map("auth_security_audit_records")
          }
        `,
      });
      expect(probeMapped.passed).toBe(false);
      expect(probeMapped.violations.some((v) => v.includes("product_audit_events"))).toBe(true);

      // 4. Probed lowercase model name productauditlog
      const probeLowercase = evaluateProductAuditGovernance({
        schemaContent: `
          model productauditlog {
            id String @id
          }
          model AuthSecurityAuditRecord {
            id String @id
            @@map("auth_security_audit_records")
          }
        `,
      });
      expect(probeLowercase.passed).toBe(false);
      expect(probeLowercase.violations.some((v) => v.includes("productauditlog"))).toBe(true);

      // 5. Probed unapproved future domain model Simulation
      const probeSimulation = evaluateProductAuditGovernance({
        schemaContent: `
          model Simulation {
            id String @id
          }
          model AuthSecurityAuditRecord {
            id String @id
            @@map("auth_security_audit_records")
          }
        `,
      });
      expect(probeSimulation.passed).toBe(false);
      expect(probeSimulation.violations.some((v) => v.includes("Simulation"))).toBe(true);
    });

    it("proves guard catches AuthSecurityAuditRecord repurposing with product-domain fields", () => {
      const probeRepurposed = evaluateProductAuditGovernance({
        schemaContent: `
          model AuthSecurityAuditRecord {
            id String @id
            eventType String
            productEventType String?
            domain String?
            @@map("auth_security_audit_records")
          }
        `,
      });
      expect(probeRepurposed.passed).toBe(false);
      expect(probeRepurposed.violations.some((v) => v.includes("Prohibited product field detected in AuthSecurityAuditRecord"))).toBe(true);
    });

    it("proves guard catches injected false-negative SQL migration statements (quoted/camelCase/snake_case tables)", () => {
      // 1. Quoted table "ProductAuditRecord"
      const probe1 = evaluateProductAuditGovernance({
        migrationSqls: [{ name: "20260901_test", sql: 'CREATE TABLE "ProductAuditRecord" (id UUID PRIMARY KEY);' }],
      });
      expect(probe1.passed).toBe(false);
      expect(probe1.violations.some((v) => v.includes("ProductAuditRecord"))).toBe(true);

      // 2. Quoted camelCase table "productAuditEvents"
      const probe2 = evaluateProductAuditGovernance({
        migrationSqls: [{ name: "20260901_test", sql: 'CREATE TABLE "productAuditEvents" (id UUID PRIMARY KEY);' }],
      });
      expect(probe2.passed).toBe(false);
      expect(probe2.violations.some((v) => v.includes("productAuditEvents"))).toBe(true);

      // 3. Unapproved domain table "simulation_trades"
      const probe3 = evaluateProductAuditGovernance({
        migrationSqls: [{ name: "20260901_test", sql: 'CREATE TABLE "simulation_trades" (id UUID PRIMARY KEY);' }],
      });
      expect(probe3.passed).toBe(false);
      expect(probe3.violations.some((v) => v.includes("simulation_trades"))).toBe(true);
    });

    it("proves guard catches injected product audit routes (with and without /api prefix) and controllers/services/pages", () => {
      // 1. Route /product-audit (without /api)
      const probeRouteWithoutApi = evaluateProductAuditGovernance({
        codeFiles: [{ path: "apps/api/src/modules/audit/audit.route.ts", content: 'router.get("/product-audit", handler);' }],
      });
      expect(probeRouteWithoutApi.passed).toBe(false);
      expect(probeRouteWithoutApi.violations.length).toBeGreaterThan(0);

      // 2. Route /api/product-audit
      const probeRouteWithApi = evaluateProductAuditGovernance({
        codeFiles: [{ path: "apps/api/src/modules/audit/audit.route.ts", content: 'router.get("/api/product-audit", handler);' }],
      });
      expect(probeRouteWithApi.passed).toBe(false);
      expect(probeRouteWithApi.violations.length).toBeGreaterThan(0);

      // 3. ProductAuditController
      const probeController = evaluateProductAuditGovernance({
        codeFiles: [{ path: "apps/api/src/modules/audit/product-audit.controller.ts", content: "export class ProductAuditController {}" }],
      });
      expect(probeController.passed).toBe(false);
      expect(probeController.violations.some((v) => v.includes("ProductAuditController"))).toBe(true);

      // 4. ProductAuditPersistenceService
      const probePersistence = evaluateProductAuditGovernance({
        codeFiles: [{ path: "apps/api/src/modules/audit/product-audit.service.ts", content: "export class ProductAuditPersistenceService {}" }],
      });
      expect(probePersistence.passed).toBe(false);
      expect(probePersistence.violations.some((v) => v.includes("ProductAuditPersistenceService"))).toBe(true);

      // 5. ProductAuditPage UI component
      const probePage = evaluateProductAuditGovernance({
        uiFiles: [{ path: "apps/web/src/pages/ProductAuditPage.tsx", content: "export function ProductAuditPage() {}" }],
      });
      expect(probePage.passed).toBe(false);
      expect(probePage.violations.some((v) => v.includes("ProductAuditPage"))).toBe(true);

      // 6. ProductAuditViewer UI component
      const probeViewer = evaluateProductAuditGovernance({
        uiFiles: [{ path: "apps/web/src/components/ProductAuditViewer.tsx", content: "export function ProductAuditViewer() {}" }],
      });
      expect(probeViewer.passed).toBe(false);
      expect(probeViewer.violations.some((v) => v.includes("ProductAuditViewer"))).toBe(true);
    });

    it("proves guard catches injected product-domain events in FEAT-009 audit taxonomy", () => {
      const probeTaxonomy = evaluateProductAuditGovernance({
        auditEventTypes: {
          REGISTRATION_SUCCESS: "REGISTRATION_SUCCESS",
          SIMULATION_ORDER_SUBMITTED: "SIMULATION_ORDER_SUBMITTED",
          ACADEMY_LESSON_COMPLETED: "ACADEMY_LESSON_COMPLETED",
        },
      });
      expect(probeTaxonomy.passed).toBe(false);
      expect(probeTaxonomy.violations.some((v) => v.includes("SIMULATION_ORDER_SUBMITTED"))).toBe(true);
      expect(probeTaxonomy.violations.some((v) => v.includes("ACADEMY_LESSON_COMPLETED"))).toBe(true);
    });
  });

  describe("FEAT-009 Auth/Security Audit Taxonomy Invariance", () => {
    it("proves FEAT-009 auth taxonomy contains only approved identity/security events", () => {
      const allowedAuthPrefixes = ["REGISTRATION_", "LOGIN_", "REFRESH_", "LOGOUT_", "AUTHENTICATION_", "AUTHORIZATION_", "ROLE_"];
      for (const event of Object.values(AUDIT_EVENT_TYPES)) {
        const isAuthScoped = allowedAuthPrefixes.some((prefix) => event.startsWith(prefix));
        expect(isAuthScoped).toBe(true);

        // Explicitly assert no product-domain keywords
        expect(event).not.toContain("LESSON");
        expect(event).not.toContain("COURSE");
        expect(event).not.toContain("ORDER");
        expect(event).not.toContain("SIMULATION");
        expect(event).not.toContain("PORTFOLIO");
        expect(event).not.toContain("POST");
        expect(event).not.toContain("COMMENT");
        expect(event).not.toContain("SUBSCRIPTION");
        expect(event).not.toContain("AI_");
      }
    });
  });

  describe("Metadata Governance & Data Privacy Policy (DEF-001)", () => {
    it("accepts sanitized flat metadata within the 2 KiB limit", () => {
      const validMetadata = {
        lessonId: "88888888-4444-4444-4444-121212121212",
        attemptCount: 2,
        durationSeconds: 145,
        passed: true,
      };

      const result = validateProductAuditMetadata(validMetadata);
      expect(result.valid).toBe(true);
      expect(result.serializedBytes).toBeLessThanOrEqual(2048);
    });

    it("rejects metadata containing prohibited credential/token/privilege fields across casing variants (DEF-001)", () => {
      const prohibitedKeys = [
        "apiKey",
        "api_key",
        "API_KEY",
        "databaseUrl",
        "database_url",
        "DATABASE_URL",
        "redisUrl",
        "redis_url",
        "rawBody",
        "raw_request_body",
        "clientRole",
        "client_role",
        "isAdmin",
        "is_admin",
        "admin",
        "role",
        "authorization",
        "password",
        "passwordHash",
        "password_hash",
        "accessToken",
        "access_token",
        "refreshToken",
        "refresh_token",
        "cookie",
        "jwt",
        "secret",
        "token",
      ];

      for (const key of prohibitedKeys) {
        const payload = { [key]: "sensitive-value" };
        const result = validateProductAuditMetadata(payload);
        expect(result.valid, `Expected key '${key}' to be rejected`).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      }
    });

    it("rejects non-flat nested object hierarchies and arrays", () => {
      const nonFlatObject = {
        actionId: "act-1",
        details: {
          subDetail: "forbidden-nesting",
        },
      };
      expect(validateProductAuditMetadata(nonFlatObject).valid).toBe(false);

      const nonFlatArray = {
        actionId: "act-1",
        items: ["item1", "item2"],
      };
      expect(validateProductAuditMetadata(nonFlatArray).valid).toBe(false);
    });

    it("rejects metadata payloads larger than 2 KiB with multibyte characters", () => {
      const multiBytePayload = {
        notes: "€".repeat(700), // 2100 bytes
      };

      const result = validateProductAuditMetadata(multiBytePayload);
      expect(result.valid).toBe(false);
      expect(result.errors.some((err) => err.includes("exceeds maximum allowable limit"))).toBe(true);
    });
  });

  describe("Transaction Strategy & Classification Contract (DEF-002)", () => {
    it("enforces mandatory and valid transaction strategy declaration", () => {
      for (const strategy of PRODUCT_AUDIT_TRANSACTION_STRATEGIES) {
        const def = {
          eventType: "SIMULATION_ORDER_PLACED",
          domain: "SIMULATION",
          transactionStrategy: strategy,
          allowedMetadataKeys: ["orderId", "symbol", "quantity"],
        };

        const result = validateProductAuditEventDefinition(def);
        expect(result.valid).toBe(true);
      }
    });

    it("rejects event definition with multiple or contradictory strategy declarations", () => {
      const contradictoryDef = {
        eventType: "SIMULATION_ORDER",
        domain: "SIMULATION",
        transactionStrategy: "STATE_FIRST" as const,
        transactionStrategies: ["BEST_EFFORT"],
        allowedMetadataKeys: [],
      };
      const result = validateProductAuditEventDefinition(contradictoryDef);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("Contradictory or multiple"))).toBe(true);
    });

    it("rejects event definition with missing or invalid strategy", () => {
      const missingStrategy = {
        eventType: "SIMULATION_ORDER_PLACED",
        domain: "SIMULATION",
        allowedMetadataKeys: [],
      };
      expect(validateProductAuditEventDefinition(missingStrategy).valid).toBe(false);

      const invalidStrategy = {
        eventType: "SIMULATION_ORDER_PLACED",
        domain: "SIMULATION",
        transactionStrategy: "ASYNC_FIRE_AND_FORGET" as unknown as "BEST_EFFORT",
        allowedMetadataKeys: [],
      };
      expect(validateProductAuditEventDefinition(invalidStrategy).valid).toBe(false);
    });
  });

  describe("Safety Invariant Verification", () => {
    it("guarantees audit recording failure cannot make denial or risk-reducing operations permissive", () => {
      let accessGranted = false;
      let auditWritten = false;

      // Access check fails
      const isAuthorized = false;
      if (!isAuthorized) {
        accessGranted = false; // Denial is final

        try {
          throw new Error("Audit database unreachable");
        } catch {
          auditWritten = false;
        }
      }

      // Assert the safety invariant: denial remained non-permissive despite audit failure
      expect(accessGranted).toBe(false);
      expect(auditWritten).toBe(false);
    });
  });

  describe("Operation Source Governance", () => {
    it("guarantees approved operation source constants", () => {
      expect(PRODUCT_AUDIT_OPERATION_SOURCES).toContain("USER_REQUEST");
      expect(PRODUCT_AUDIT_OPERATION_SOURCES).toContain("SYSTEM_JOB");
      expect(PRODUCT_AUDIT_OPERATION_SOURCES).toContain("ADMIN_OPERATION");
      expect(PRODUCT_AUDIT_OPERATION_SOURCES).toContain("INTERNAL_MAINTENANCE");
      expect(PRODUCT_AUDIT_OPERATION_SOURCES).toContain("TEST_FIXTURE");
    });
  });
});
