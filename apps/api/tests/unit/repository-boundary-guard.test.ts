import { describe, it, expect } from "vitest";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";
import os from "node:os";
import {
  assertRepositoryBoundary,
  scanRawSqlContainment,
  scanControllerAst,
  scanServiceAst,
  sanitizePath,
} from "../helpers/repository-boundary-guard.js";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const srcDir = path.resolve(currentDir, "../../src");

describe("FEAT-013 Repository & Transaction Boundary Guard (Unit)", () => {
  describe("Active Codebase Conformance", () => {
    it("verifies the active apps/api/src tree contains 0 repository or transaction boundary violations", () => {
      const result = assertRepositoryBoundary(srcDir);
      expect(result.passed).toBe(true);
      expect(result.violations).toEqual([]);
      expect(result.controllersScanned).toBeGreaterThan(0);
      expect(result.servicesScanned).toBeGreaterThan(0);
      expect(result.repositoriesScanned).toBeGreaterThan(0);
    });
  });

  describe("Controller Boundary Violation Detection (Self-Testing)", () => {
    it("flags direct @prisma/client import in controller as prohibited", () => {
      const violations = scanControllerAst(
        "apps/api/src/modules/test/test.controller.ts",
        `import { PrismaClient } from "@prisma/client";\nexport class BadController {}\n`,
      );
      expect(violations.some((v) => v.rule === "CONTROLLER_PRISMA_IMPORT_PROHIBITED")).toBe(true);
    });

    it("flags aliased @prisma/client import in controller as prohibited", () => {
      const violations = scanControllerAst(
        "apps/api/src/modules/test/test.controller.ts",
        `import { PrismaClient as CustomPrismaClient } from "@prisma/client";\nexport class BadController {}\n`,
      );
      expect(violations.some((v) => v.rule === "CONTROLLER_PRISMA_IMPORT_PROHIBITED")).toBe(true);
    });

    it("flags namespace @prisma/client import in controller as prohibited", () => {
      const violations = scanControllerAst(
        "apps/api/src/modules/test/test.controller.ts",
        `import * as Prisma from "@prisma/client";\nexport class BadController {}\n`,
      );
      expect(violations.some((v) => v.rule === "CONTROLLER_PRISMA_IMPORT_PROHIBITED")).toBe(true);
    });

    it("flags dynamic require/import of @prisma/client in controller as prohibited", () => {
      const violations = scanControllerAst(
        "apps/api/src/modules/test/test.controller.ts",
        `const p = require("@prisma/client");\n`,
      );
      expect(violations.some((v) => v.rule === "CONTROLLER_PRISMA_IMPORT_PROHIBITED")).toBe(true);
    });

    it("flags direct database connection singleton import in controller as prohibited", () => {
      const violations = scanControllerAst(
        "apps/api/src/modules/test/test.controller.ts",
        `import { getPrismaClient } from "../../infrastructure/database/prisma.js";\n`,
      );
      expect(violations.some((v) => v.rule === "CONTROLLER_DATABASE_INFRA_IMPORT_PROHIBITED")).toBe(true);
    });

    it("flags direct Prisma repository instantiation in controller as prohibited", () => {
      const violations = scanControllerAst(
        "apps/api/src/modules/test/test.controller.ts",
        `const userRepo = new PrismaUserRepository();\n`,
      );
      expect(violations.some((v) => v.rule === "CONTROLLER_DIRECT_PRISMA_REPO_INSTANTIATION")).toBe(true);
    });

    it("flags direct PrismaTransactionRunner instantiation in controller as prohibited", () => {
      const violations = scanControllerAst(
        "apps/api/src/modules/test/test.controller.ts",
        `const runner = new PrismaTransactionRunner();\n`,
      );
      expect(violations.some((v) => v.rule === "CONTROLLER_DIRECT_PRISMA_REPO_INSTANTIATION")).toBe(true);
    });

    it("flags raw SQL in controller as prohibited", () => {
      const violations = scanControllerAst(
        "apps/api/src/modules/test/test.controller.ts",
        `const data = await prisma.$queryRaw\`SELECT * FROM users\`;\n`,
      );
      expect(violations.some((v) => v.rule === "CONTROLLER_RAW_SQL_PROHIBITED")).toBe(true);
    });
  });

  describe("Service Boundary Violation Detection (Self-Testing)", () => {
    it("flags direct Prisma delegate queries in ordinary services as prohibited", () => {
      const violations = scanServiceAst(
        "apps/api/src/modules/test/test.service.ts",
        `export class BadService { async findUser() { return await this.prisma.user.findUnique({ where: { id: "1" } }); } }\n`,
      );
      expect(violations.some((v) => v.rule === "SERVICE_DIRECT_PRISMA_DELEGATE_QUERY_PROHIBITED")).toBe(true);
    });

    it("flags renamed Prisma client variable queries (e.g. db.user.findFirst) in ordinary services", () => {
      const violations = scanServiceAst(
        "apps/api/src/modules/test/test.service.ts",
        `export class BadService { async getUser(db: any) { return await db.user.findFirst({ where: { email: "test" } }); } }\n`,
      );
      expect(violations.some((v) => v.rule === "SERVICE_DIRECT_PRISMA_DELEGATE_QUERY_PROHIBITED")).toBe(true);
    });

    it("flags destructured Prisma model delegate queries (e.g. const { user } = prisma; user.findMany())", () => {
      const violations = scanServiceAst(
        "apps/api/src/modules/test/test.service.ts",
        `export class BadService { async listUsers(client: any) { const { user } = client; return await user.findMany(); } }\n`,
      );
      expect(violations.some((v) => v.rule === "SERVICE_DIRECT_PRISMA_DELEGATE_QUERY_PROHIBITED")).toBe(true);
    });

    it("flags direct Prisma repository construction in ordinary services", () => {
      const violations = scanServiceAst(
        "apps/api/src/modules/test/test.service.ts",
        `export class BadService { private repo = new PrismaUserRepository(); }\n`,
      );
      expect(violations.some((v) => v.rule === "SERVICE_DIRECT_PRISMA_REPO_INSTANTIATION")).toBe(true);
    });

    it("flags direct PrismaTransactionRunner construction in ordinary services", () => {
      const violations = scanServiceAst(
        "apps/api/src/modules/test/test.service.ts",
        `export class BadService { private runner = new PrismaTransactionRunner(); }\n`,
      );
      expect(violations.some((v) => v.rule === "SERVICE_DIRECT_PRISMA_TRANSACTION_RUNNER_INSTANTIATION")).toBe(true);
    });

    it("flags value and type-only @prisma/client import in ordinary services", () => {
      const violations1 = scanServiceAst(
        "apps/api/src/modules/test/test.service.ts",
        `import { PrismaClient } from "@prisma/client";\n`,
      );
      expect(violations1.some((v) => v.rule === "SERVICE_PRISMA_CLIENT_IMPORT_PROHIBITED")).toBe(true);

      const violations2 = scanServiceAst(
        "apps/api/src/modules/test/test.service.ts",
        `import type { RefreshSession, Prisma } from "@prisma/client";\n`,
      );
      expect(violations2.some((v) => v.rule === "SERVICE_PRISMA_CLIENT_IMPORT_PROHIBITED")).toBe(true);
    });

    it("flags namespace @prisma/client import in ordinary services", () => {
      const violations = scanServiceAst(
        "apps/api/src/modules/test/test.service.ts",
        `import * as Prisma from "@prisma/client";\nexport class CustomService {}\n`,
      );
      expect(violations.some((v) => v.rule === "SERVICE_PRISMA_CLIENT_IMPORT_PROHIBITED")).toBe(true);
    });

    it("flags direct $transaction calls in ordinary services", () => {
      const violations = scanServiceAst(
        "apps/api/src/modules/test/test.service.ts",
        `export class BadService { async runTx(client: any) { await client.$transaction(async (tx: any) => {}); } }\n`,
      );
      expect(violations.some((v) => v.rule === "SERVICE_DIRECT_TRANSACTION_PROHIBITED")).toBe(true);
    });

    it("flags violations in role.seed.ts when prohibited Prisma patterns are present", () => {
      const violations = scanServiceAst(
        "apps/api/src/modules/auth/role.seed.ts",
        `import type { PrismaClient } from "@prisma/client";\nexport async function badSeed(prisma: any) { return prisma.$transaction(async () => {}); }\n`,
      );
      expect(violations.some((v) => v.rule === "SERVICE_PRISMA_CLIENT_IMPORT_PROHIBITED")).toBe(true);
      expect(violations.some((v) => v.rule === "SERVICE_DIRECT_TRANSACTION_PROHIBITED")).toBe(true);
    });

    it("flags raw SQL in ordinary services as prohibited", () => {
      const violations = scanServiceAst(
        "apps/api/src/modules/test/test.service.ts",
        `export class BadService { async query() { await prisma.$executeRaw\`DELETE FROM users\`; } }\n`,
      );
      expect(violations.some((v) => v.rule === "SERVICE_RAW_SQL_PROHIBITED")).toBe(true);
    });
  });

  describe("Raw SQL Containment Rules (Self-Testing)", () => {
    it("flags raw SQL in non-allowlisted modules as unauthorized", () => {
      const tempFile = path.join(os.tmpdir(), "random-helper.ts");
      fs.writeFileSync(
        tempFile,
        `export function runCustomQuery() { return prisma.$queryRaw\`SELECT 1\`; }\n`,
      );

      try {
        const violations = scanRawSqlContainment([tempFile]);
        expect(violations.some((v) => v.rule === "UNAUTHORIZED_RAW_SQL_LOCATION")).toBe(true);
      } finally {
        fs.rmSync(tempFile, { force: true });
      }
    });
  });

  describe("Path Sanitization and Output Safety", () => {
    it("strips absolute drive letters and user paths from violation output", () => {
      const winPath = "D:\\project\\ura-capital\\apps\\api\\src\\modules\\auth\\login.service.ts";
      const sanitized = sanitizePath(winPath);
      expect(sanitized).toBe("apps/api/src/modules/auth/login.service.ts");
      expect(sanitized).not.toContain("D:");
      expect(sanitized).not.toContain("\\");

      const unixPath = "/home/user/project/ura-capital/apps/api/src/modules/auth/login.controller.ts";
      const sanitizedUnix = sanitizePath(unixPath);
      expect(sanitizedUnix).toBe("apps/api/src/modules/auth/login.controller.ts");
      expect(sanitizedUnix).not.toContain("/home");
    });
  });
});

