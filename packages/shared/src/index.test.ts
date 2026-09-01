import { describe, it, expect } from "vitest";
import {
  APP_NAME,
  API_VERSION,
  HTTP_STATUS,
  ERROR_CODES,
  HealthStatusSchema,
  ErrorEnvelopeSchema,
  EnvConfigSchema,
  PRODUCT_AUDIT_OPERATION_SOURCES,
  PRODUCT_AUDIT_TRANSACTION_STRATEGIES,
  PRODUCT_AUDIT_EVENT_OUTCOMES,
  validateProductAuditMetadata,
  validateProductAuditEventDefinition,
  validateSeedEnvironment,
  isLocalDevelopmentDatabaseUrl,
  isIsolatedTestDatabaseUrl,
  buildTestSeedUserEmail,
  buildTestSeedAdminEmail,
  SEED_MODES,
  SEED_ENVIRONMENTS,
  MIN_DEV_SEED_PASSWORD_LENGTH,
} from "./index.js";

describe("@aura/shared package", () => {
  it("exports required application constants", () => {
    expect(APP_NAME).toBe("Aura Capital");
    expect(API_VERSION).toBe("v1");
    expect(HTTP_STATUS.OK).toBe(200);
    expect(ERROR_CODES.INTERNAL_ERROR).toBe("INTERNAL_ERROR");
  });

  it("validates HealthStatusSchema successfully", () => {
    const validHealth = {
      status: "healthy",
      service: "aura-api",
      version: "0.1.0",
      environment: "development",
      timestamp: new Date().toISOString(),
      uptime: 12.34,
    };

    const parsed = HealthStatusSchema.safeParse(validHealth);
    expect(parsed.success).toBe(true);
  });

  it("rejects invalid HealthStatusSchema", () => {
    const invalidHealth = {
      status: "degraded",
      service: "aura-api",
    };

    const parsed = HealthStatusSchema.safeParse(invalidHealth);
    expect(parsed.success).toBe(false);
  });

  it("validates ErrorEnvelopeSchema successfully", () => {
    const validError = {
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid payload",
        requestId: "req-12345",
      },
    };

    const parsed = ErrorEnvelopeSchema.safeParse(validError);
    expect(parsed.success).toBe(true);
  });

  it("validates EnvConfigSchema and rejects short JWT secret", () => {
    const invalidEnv = {
      JWT_SECRET: "short-secret",
    };

    const parsed = EnvConfigSchema.safeParse(invalidEnv);
    expect(parsed.success).toBe(false);
  });

  describe("Product Audit Governance Contracts (FEAT-016 / DEF-001 & DEF-002)", () => {
    it("exports approved operation sources and transaction strategies", () => {
      expect(PRODUCT_AUDIT_OPERATION_SOURCES).toContain("USER_REQUEST");
      expect(PRODUCT_AUDIT_OPERATION_SOURCES).toContain("SYSTEM_JOB");
      expect(PRODUCT_AUDIT_OPERATION_SOURCES).toContain("ADMIN_OPERATION");
      expect(PRODUCT_AUDIT_OPERATION_SOURCES).toContain("INTERNAL_MAINTENANCE");
      expect(PRODUCT_AUDIT_OPERATION_SOURCES).toContain("TEST_FIXTURE");

      expect(PRODUCT_AUDIT_TRANSACTION_STRATEGIES).toContain("TRANSACTIONALLY_COUPLED");
      expect(PRODUCT_AUDIT_TRANSACTION_STRATEGIES).toContain("STATE_FIRST");
      expect(PRODUCT_AUDIT_TRANSACTION_STRATEGIES).toContain("BEST_EFFORT");

      expect(PRODUCT_AUDIT_EVENT_OUTCOMES).toEqual(["SUCCESS", "FAILURE", "DENIED", "ERROR"]);
    });

    it("validates compliant flat metadata within size limit", () => {
      const validMetadata = {
        lessonId: "11111111-2222-3333-4444-555555555555",
        timeSpentSec: 320,
        completed: true,
      };

      const result = validateProductAuditMetadata(validMetadata, ["lessonId", "timeSpentSec", "completed"]);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.serializedBytes).toBeLessThan(2048);
    });

    it("rejects metadata containing prohibited security fields across snake_case, camelCase, uppercase, and kebab-case (DEF-001)", () => {
      const prohibitedKeys = [
        "apiKey",
        "api_key",
        "API_KEY",
        "api-key",
        "databaseUrl",
        "database_url",
        "DATABASE_URL",
        "redisUrl",
        "redis_url",
        "REDIS_URL",
        "rawBody",
        "raw_request_body",
        "raw-request-body",
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
        expect(result.valid, `Expected key '${key}' to be rejected as prohibited`).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      }
    });

    it("rejects non-flat nested metadata structures (nested objects and arrays)", () => {
      const nestedObject = {
        orderId: "ord-123",
        details: { nestedKey: "nestedValue" },
      };
      expect(validateProductAuditMetadata(nestedObject).valid).toBe(false);

      const arrayValue = {
        orderId: "ord-123",
        tags: ["tag1", "tag2"],
      };
      expect(validateProductAuditMetadata(arrayValue).valid).toBe(false);
    });

    it("rejects metadata exceeding 2 KiB limit with multibyte UTF-8 characters", () => {
      // 700 3-byte unicode characters = 2100 bytes
      const multiByteString = "€".repeat(700);
      const largeMetadata = {
        notes: multiByteString,
      };

      const result = validateProductAuditMetadata(largeMetadata);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("exceeds maximum allowable limit"))).toBe(true);
    });

    it("strictly enforces exactly one transaction strategy and rejects contradictory/multiple fields (DEF-002)", () => {
      const validDef = {
        eventType: "SIMULATION_ORDER_SUBMITTED",
        domain: "SIMULATION",
        transactionStrategy: "TRANSACTIONALLY_COUPLED" as const,
        allowedMetadataKeys: ["orderId", "ticker", "shares"],
      };
      expect(validateProductAuditEventDefinition(validDef).valid).toBe(true);

      // Contradictory multiple strategy definitions
      const contradictoryDef = {
        eventType: "SIMULATION_ORDER",
        domain: "SIMULATION",
        transactionStrategy: "STATE_FIRST" as const,
        transactionStrategies: ["BEST_EFFORT"],
        allowedMetadataKeys: [],
      };
      const cResult = validateProductAuditEventDefinition(contradictoryDef);
      expect(cResult.valid).toBe(false);
      expect(cResult.errors.some((e) => e.includes("Contradictory or multiple"))).toBe(true);

      // Missing transaction strategy
      const missingStrategy = {
        eventType: "SIMULATION_ORDER",
        domain: "SIMULATION",
        allowedMetadataKeys: [],
      };
      expect(validateProductAuditEventDefinition(missingStrategy).valid).toBe(false);
    });
  });

  describe("Seed Environment & Target Safety Contracts (FEAT-017 / DEF-001 & DEF-002)", () => {
    it("exports approved seed modes, environments, and minimum password length baseline", () => {
      expect(SEED_MODES).toEqual(["development", "test", "ci"]);
      expect(SEED_ENVIRONMENTS).toEqual(["development", "test"]);
      expect(MIN_DEV_SEED_PASSWORD_LENGTH).toBe(12);
    });

    it("validates compliant local development seed environment with 12+ char password", () => {
      const validDev = {
        nodeEnv: "development",
        seedMode: "development",
        isCi: false,
        databaseUrl: "postgresql://postgres:postgrespassword@localhost:5432/aura_capital_dev",
        devSeedUserPassword: "ValidDevPassword123!",
      };

      expect(isLocalDevelopmentDatabaseUrl(validDev.databaseUrl)).toBe(true);
      expect(isIsolatedTestDatabaseUrl(validDev.databaseUrl)).toBe(false);

      const result = validateSeedEnvironment(validDev);
      expect(result.valid).toBe(true);
      expect(result.dbTargetClass).toBe("LOCAL_DEV");
      expect(result.errors).toHaveLength(0);
    });

    it("validates compliant automated test seed environment", () => {
      const validTest = {
        nodeEnv: "test",
        seedMode: "test",
        isCi: false,
        databaseUrl: "postgresql://postgres:postgrespassword@localhost:5432/aura_capital_test_unit",
      };

      expect(isIsolatedTestDatabaseUrl(validTest.databaseUrl)).toBe(true);
      expect(isLocalDevelopmentDatabaseUrl(validTest.databaseUrl)).toBe(false);

      const result = validateSeedEnvironment(validTest);
      expect(result.valid).toBe(true);
      expect(result.dbTargetClass).toBe("ISOLATED_TEST");
      expect(result.errors).toHaveLength(0);
    });

    it("validates compliant CI seed environment", () => {
      const validCi = {
        nodeEnv: "test",
        seedMode: "ci",
        isCi: true,
        databaseUrl: "postgresql://postgres:postgrespassword@postgres:5432/aura_capital_test_ci",
      };

      const result = validateSeedEnvironment(validCi);
      expect(result.valid).toBe(true);
      expect(result.dbTargetClass).toBe("ISOLATED_TEST");
      expect(result.errors).toHaveLength(0);
    });

    it("strictly enforces 12-character minimum password policy (DEF-001)", () => {
      const baseDev = {
        nodeEnv: "development",
        seedMode: "development",
        isCi: false,
        databaseUrl: "postgresql://postgres:postgrespassword@localhost:5432/aura_capital_dev",
      };

      // 1. Missing password
      expect(validateSeedEnvironment({ ...baseDev }).valid).toBe(false);

      // 2. 8-char password -> REJECT
      const p8 = validateSeedEnvironment({ ...baseDev, devSeedUserPassword: "12345678" });
      expect(p8.valid).toBe(false);
      expect(p8.errors.some((e) => e.includes(">= 12 chars"))).toBe(true);

      // 3. 11-char password -> REJECT
      const p11 = validateSeedEnvironment({ ...baseDev, devSeedUserPassword: "12345678901" });
      expect(p11.valid).toBe(false);
      expect(p11.errors.some((e) => e.includes(">= 12 chars"))).toBe(true);

      // 4. 12-char password -> ACCEPT
      const p12 = validateSeedEnvironment({ ...baseDev, devSeedUserPassword: "123456789012" });
      expect(p12.valid).toBe(true);
    });

    it("rejects staging, production, production-like, and unknown environments", () => {
      const prodEnv = {
        nodeEnv: "production",
        seedMode: "development",
        databaseUrl: "postgresql://postgres:postgrespassword@localhost:5432/aura_capital_dev",
        devSeedUserPassword: "Password123456!",
      };
      expect(validateSeedEnvironment(prodEnv).valid).toBe(false);

      const stagingEnv = {
        nodeEnv: "staging",
        seedMode: "test",
        databaseUrl: "postgresql://postgres:postgrespassword@localhost:5432/aura_capital_test",
      };
      expect(validateSeedEnvironment(stagingEnv).valid).toBe(false);

      const unknownEnv = {
        nodeEnv: "qa-custom",
        seedMode: "development",
        databaseUrl: "postgresql://postgres:postgrespassword@localhost:5432/aura_capital_dev",
      };
      expect(validateSeedEnvironment(unknownEnv).valid).toBe(false);
    });

    it("rejects seed:dev in CI environments (CI=true)", () => {
      const devInCi = {
        nodeEnv: "development",
        seedMode: "development",
        isCi: true,
        databaseUrl: "postgresql://postgres:postgrespassword@localhost:5432/aura_capital_dev",
        devSeedUserPassword: "Password123456!",
      };
      const result = validateSeedEnvironment(devInCi);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("prohibited in CI"))).toBe(true);
    });

    it("rejects unsafe DB targets with production, staging, shared markers in query params or userinfo (DEF-002)", () => {
      // Query param with prod
      expect(isLocalDevelopmentDatabaseUrl("postgresql://localhost:5432/aura_capital_dev?target=prod")).toBe(false);
      expect(isIsolatedTestDatabaseUrl("postgresql://localhost:5432/aura_capital_test?target=prod")).toBe(false);

      // Query param with shared
      expect(isLocalDevelopmentDatabaseUrl("postgresql://localhost:5432/aura_capital_dev?target=shared")).toBe(false);
      expect(isIsolatedTestDatabaseUrl("postgresql://localhost:5432/aura_capital_test?target=shared")).toBe(false);

      // Query param with schema=production
      expect(isIsolatedTestDatabaseUrl("postgresql://localhost:5432/aura_capital_test?schema=production")).toBe(false);

      // Percent-encoded query param (%70%72%6f%64 = prod)
      expect(isLocalDevelopmentDatabaseUrl("postgresql://localhost:5432/aura_capital_dev?target=%70%72%6f%64")).toBe(false);

      // Userinfo trick (prod username)
      expect(isLocalDevelopmentDatabaseUrl("postgresql://prod:secret@localhost:5432/aura_capital_dev")).toBe(false);

      // Other prohibited markers (live, main, master, primary)
      expect(isLocalDevelopmentDatabaseUrl("postgresql://localhost:5432/aura_capital_dev?target=live")).toBe(false);
      expect(isLocalDevelopmentDatabaseUrl("postgresql://localhost:5432/aura_capital_dev?target=main")).toBe(false);
      expect(isLocalDevelopmentDatabaseUrl("postgresql://localhost:5432/aura_capital_dev?target=master")).toBe(false);
      expect(isLocalDevelopmentDatabaseUrl("postgresql://localhost:5432/aura_capital_dev?target=primary")).toBe(false);

      // Remote host with dev DB name
      expect(isLocalDevelopmentDatabaseUrl("postgresql://remote.host:5432/aura_capital_dev")).toBe(false);

      // Missing DB name
      expect(isLocalDevelopmentDatabaseUrl("postgresql://localhost:5432/")).toBe(false);
    });

    it("builds deterministic run/worker-scoped fixture identities (DEF-004)", () => {
      const email1 = buildTestSeedUserEmail("test.user1", "runA", "worker1");
      const email2 = buildTestSeedUserEmail("test.user1", "runB", "worker1");
      const email3 = buildTestSeedUserEmail("test.user1", "runA", "worker2");
      const adminEmail = buildTestSeedAdminEmail("runA", "worker1");

      expect(email1).toBe("test.user1+runA.worker1@aura.test");
      expect(email2).toBe("test.user1+runB.worker1@aura.test");
      expect(email3).toBe("test.user1+runA.worker2@aura.test");
      expect(adminEmail).toBe("test.admin+runA.worker1@aura.test");

      // Verify different runs / workers do not collide
      expect(email1).not.toBe(email2);
      expect(email1).not.toBe(email3);
    });
  });
});
