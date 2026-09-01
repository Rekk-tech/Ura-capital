import { describe, it, expect } from "vitest";
import {
  runSeedSafetyGuard,
  evaluateSeedSafety,
} from "../../scripts/guard-seed-safety.js";

describe("FEAT-017 Seed Safety & Governance Guard Unit Tests", () => {
  it("proves current workspace has zero prohibited seed scripts, migration fixtures, or default admin backdoors", () => {
    const result = runSeedSafetyGuard();
    expect(result.passed).toBe(true);
    expect(result.violations).toHaveLength(0);
  });

  describe("Negative Probes & Fail-Closed Guard Verification (DEF-005)", () => {
    it("proves guard rejects prohibited package scripts (seed:prod, seed:staging, and generic unsafe seed)", () => {
      const probeProd = evaluateSeedSafety({
        packageJsons: [
          {
            path: "package.json",
            content: JSON.stringify({
              scripts: {
                "seed:prod": "tsx scripts/seed-prod.ts",
              },
            }),
          },
        ],
      });
      expect(probeProd.passed).toBe(false);
      expect(probeProd.violations.some((v) => v.includes("seed:prod"))).toBe(true);

      const probeStaging = evaluateSeedSafety({
        packageJsons: [
          {
            path: "apps/api/package.json",
            content: JSON.stringify({
              scripts: {
                "seed:staging": "tsx scripts/seed-staging.ts",
              },
            }),
          },
        ],
      });
      expect(probeStaging.passed).toBe(false);
      expect(probeStaging.violations.some((v) => v.includes("seed:staging"))).toBe(true);

      const probeGenericSeed = evaluateSeedSafety({
        packageJsons: [
          {
            path: "package.json",
            content: JSON.stringify({
              scripts: {
                seed: "node run-seed.js",
              },
            }),
          },
        ],
      });
      expect(probeGenericSeed.passed).toBe(false);
      expect(probeGenericSeed.violations.some((v) => v.includes("generic unsafe seed script"))).toBe(true);
    });

    it("proves guard rejects fixture INSERT, UPDATE, and DELETE statements in Prisma migrations", () => {
      const probeInsert = evaluateSeedSafety({
        migrationSqls: [
          {
            name: "20260901_seed_users",
            sql: `INSERT INTO "users" (id, email) VALUES ('u1', 'admin@aura.test');`,
          },
        ],
      });
      expect(probeInsert.passed).toBe(false);
      expect(probeInsert.violations.some((v) => v.includes("INSERT statement into table 'users'"))).toBe(true);

      const probeUpdate = evaluateSeedSafety({
        migrationSqls: [
          {
            name: "20260901_update_roles",
            sql: `UPDATE "users" SET "status" = 'ACTIVE';`,
          },
        ],
      });
      expect(probeUpdate.passed).toBe(false);
      expect(probeUpdate.violations.some((v) => v.includes("UPDATE statement on table 'users'"))).toBe(true);

      const probeDelete = evaluateSeedSafety({
        migrationSqls: [
          {
            name: "20260901_delete_test",
            sql: `DELETE FROM "roles" WHERE "name" = 'USER';`,
          },
        ],
      });
      expect(probeDelete.passed).toBe(false);
      expect(probeDelete.violations.some((v) => v.includes("DELETE statement on table 'roles'"))).toBe(true);
    });

    it("proves guard rejects premature product-domain schemas in Prisma schema", () => {
      const probeSchema = evaluateSeedSafety({
        schemaContent: `
          model AcademyCourse {
            id String @id
          }
          model User {
            id String @id
          }
        `,
      });
      expect(probeSchema.passed).toBe(false);
      expect(probeSchema.violations.some((v) => v.includes("AcademyCourse"))).toBe(true);
    });

    it("proves guard rejects public grant-admin and role assignment routes (/grant-admin, /api/admin/users/grant)", () => {
      const probeRoute1 = evaluateSeedSafety({
        codeFiles: [
          {
            path: "apps/api/src/modules/auth/admin.controller.ts",
            content: `router.post("/grant-admin", grantAdminHandler);`,
          },
        ],
      });
      expect(probeRoute1.passed).toBe(false);
      expect(probeRoute1.violations.some((v) => v.includes("grant-admin"))).toBe(true);

      const probeRoute2 = evaluateSeedSafety({
        codeFiles: [
          {
            path: "apps/api/src/modules/auth/admin.controller.ts",
            content: `router.post("/api/admin/users/grant", grantUserAdminHandler);`,
          },
        ],
      });
      expect(probeRoute2.passed).toBe(false);
      expect(probeRoute2.violations.some((v) => v.includes("grant"))).toBe(true);
    });

    it("proves guard rejects hardcoded default admin password constants", () => {
      const probeConst = evaluateSeedSafety({
        codeFiles: [
          {
            path: "apps/api/src/modules/auth/constants.ts",
            content: `export const DEFAULT_ADMIN_PASSWORD = "AdminPassword123!";`,
          },
        ],
      });
      expect(probeConst.passed).toBe(false);
      expect(probeConst.violations.some((v) => v.includes("DEFAULT_ADMIN_PASSWORD"))).toBe(true);
    });

    it("proves guard rejects automatic ADMIN role assignment in registration service", () => {
      const probeReg = evaluateSeedSafety({
        codeFiles: [
          {
            path: "apps/api/src/modules/auth/registration.service.ts",
            content: `const userRoles = { roles: ["ADMIN"] };`,
          },
        ],
      });
      expect(probeReg.passed).toBe(false);
      expect(probeReg.violations.some((v) => v.includes("automatic ADMIN role assignment"))).toBe(true);
    });

    it("proves guard rejects plaintext credential or password hash logging across console and structured loggers (DEF-005)", () => {
      // 1. console.log with env var
      const probeConsoleEnv = evaluateSeedSafety({
        codeFiles: [
          {
            path: "apps/api/src/infrastructure/seed/seed-service.ts",
            content: `console.log("Dev password is:", process.env.DEV_SEED_USER_PASSWORD);`,
          },
        ],
      });
      expect(probeConsoleEnv.passed).toBe(false);
      expect(probeConsoleEnv.violations.some((v) => v.includes("credential"))).toBe(true);

      // 2. logger.info with structured object containing password
      const probeLoggerPassword = evaluateSeedSafety({
        codeFiles: [
          {
            path: "apps/api/src/infrastructure/seed/seed-service.ts",
            content: `logger.info({ password: process.env.DEV_SEED_USER_PASSWORD });`,
          },
        ],
      });
      expect(probeLoggerPassword.passed).toBe(false);
      expect(probeLoggerPassword.violations.some((v) => v.includes("password"))).toBe(true);

      // 3. logger.info shorthand passwordHash
      const probeLoggerHash = evaluateSeedSafety({
        codeFiles: [
          {
            path: "apps/api/src/infrastructure/seed/seed-service.ts",
            content: `logger.info({ passwordHash });`,
          },
        ],
      });
      expect(probeLoggerHash.passed).toBe(false);
      expect(probeLoggerHash.violations.some((v) => v.includes("passwordHash"))).toBe(true);

      // 4. logger.warn with credential
      const probeLoggerCred = evaluateSeedSafety({
        codeFiles: [
          {
            path: "apps/api/src/infrastructure/seed/seed-service.ts",
            content: `logger.warn({ credential: someCredential });`,
          },
        ],
      });
      expect(probeLoggerCred.passed).toBe(false);
      expect(probeLoggerCred.violations.some((v) => v.includes("credential"))).toBe(true);

      // 5. appLogger.info with secret
      const probeAppLoggerSecret = evaluateSeedSafety({
        codeFiles: [
          {
            path: "apps/api/src/infrastructure/seed/seed-service.ts",
            content: `appLogger.info({ secret: process.env.DEV_SEED_USER_PASSWORD });`,
          },
        ],
      });
      expect(probeAppLoggerSecret.passed).toBe(false);
      expect(probeAppLoggerSecret.violations.some((v) => v.includes("secret"))).toBe(true);

      // 6. logger.debug with token
      const probeLoggerToken = evaluateSeedSafety({
        codeFiles: [
          {
            path: "apps/api/src/infrastructure/seed/seed-service.ts",
            content: `logger.debug({ token: "raw-jwt" });`,
          },
        ],
      });
      expect(probeLoggerToken.passed).toBe(false);
      expect(probeLoggerToken.violations.some((v) => v.includes("token"))).toBe(true);

      // 7. Nested structured log payload
      const probeNestedLog = evaluateSeedSafety({
        codeFiles: [
          {
            path: "apps/api/src/infrastructure/seed/seed-service.ts",
            content: `logger.info({ auth: { password: process.env.DEV_SEED_USER_PASSWORD } });`,
          },
        ],
      });
      expect(probeNestedLog.passed).toBe(false);
      expect(probeNestedLog.violations.some((v) => v.includes("password"))).toBe(true);

      // 8. Snake case sensitive field variants (api_key, refresh_token, password_hash)
      const probeSnakeVariants = evaluateSeedSafety({
        codeFiles: [
          {
            path: "apps/api/src/infrastructure/seed/seed-service.ts",
            content: `logger.info({ api_key: "val", refresh_token: "tok", password_hash: "hash" });`,
          },
        ],
      });
      expect(probeSnakeVariants.passed).toBe(false);
      expect(probeSnakeVariants.violations.length).toBeGreaterThan(0);
    });

    it("proves guard rejects Redis durable seed authority patterns", () => {
      const probeRedis = evaluateSeedSafety({
        codeFiles: [
          {
            path: "apps/api/src/infrastructure/seed/seed-service.ts",
            content: `await redis.set("seed:user1", JSON.stringify(userData));`,
          },
        ],
      });
      expect(probeRedis.passed).toBe(false);
      expect(probeRedis.violations.some((v) => v.includes("durable seed key in Redis"))).toBe(true);
    });

    it("proves guard rejects product fixture aliases (e.g. courseTitle) in seed infrastructure", () => {
      const probeProduct = evaluateSeedSafety({
        codeFiles: [
          {
            path: "apps/api/src/infrastructure/seed/seed-service.ts",
            content: `const seedCourses = [{ courseTitle: "Intro to Investing" }];`,
          },
        ],
      });
      expect(probeProduct.passed).toBe(false);
      expect(probeProduct.violations.some((v) => v.includes("courseTitle"))).toBe(true);
    });
  });
});
