import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

export interface BoundaryViolation {
  file: string;
  line: number;
  rule: string;
  description: string;
}

export interface BoundaryScanResult {
  passed: boolean;
  violations: BoundaryViolation[];
  controllersScanned: number;
  servicesScanned: number;
  repositoriesScanned: number;
}

const APPROVED_PRISMA_INFRA_ALLOWLIST = [
  "apps/api/src/infrastructure/database/prisma.ts",
  "apps/api/src/infrastructure/database/repository-factory.ts",
  "apps/api/src/infrastructure/database/transaction-runner.ts",
  "apps/api/src/infrastructure/database/transaction-context.ts",
  "apps/api/src/infrastructure/database/error-mapper.ts",
];

const KNOWN_PRISMA_MODELS = new Set([
  "user",
  "credential",
  "role",
  "userRole",
  "refreshSession",
  "authSecurityAuditRecord",
  "academyCourse",
  "academyLesson",
  "academyFlashcard",
  "academyQuiz",
  "academyQuizQuestion",
  "academyQuizOption",
  "academyQuizAttempt",
  "academyQuizAnswer",
  "academyUserCourseProgress",
  "academyUserLessonProgress",
  "academyUserXp",
  "academyRewardLedger",
]);

const KNOWN_PRISMA_ACTIONS = new Set([
  "findUnique",
  "findUniqueOrThrow",
  "findFirst",
  "findFirstOrThrow",
  "findMany",
  "create",
  "createMany",
  "createManyAndReturn",
  "update",
  "updateMany",
  "delete",
  "deleteMany",
  "upsert",
  "count",
  "aggregate",
  "groupBy",
]);

export function sanitizePath(filePath: string): string {
  const normalized = filePath.replace(/\\/g, "/");
  const repoRootMarker = "ura-capital/";
  const idx = normalized.lastIndexOf(repoRootMarker);
  if (idx !== -1) {
    return normalized.substring(idx + repoRootMarker.length);
  }
  // If path contains apps/api, strip everything before it
  const appsIdx = normalized.indexOf("apps/api/");
  if (appsIdx !== -1) {
    return normalized.substring(appsIdx);
  }
  return path.basename(normalized);
}

function isAllowlistedInfra(filePath: string): boolean {
  const norm = filePath.replace(/\\/g, "/");
  return APPROVED_PRISMA_INFRA_ALLOWLIST.some((allowed) => norm.endsWith(allowed));
}

function isRepositoryFile(filePath: string): boolean {
  const norm = filePath.replace(/\\/g, "/");
  return norm.endsWith(".repository.ts") || norm.includes("/repositories/");
}

function getAllFiles(dir: string, extension: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const results: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...getAllFiles(fullPath, extension));
    } else if (entry.isFile() && entry.name.endsWith(extension)) {
      results.push(fullPath);
    }
  }

  return results;
}

function getLineNumber(sourceFile: ts.SourceFile, pos: number): number {
  return sourceFile.getLineAndCharacterOfPosition(pos).line + 1;
}

/**
 * Scans a source string or file using the TypeScript AST for controller boundary rules.
 */
export function scanControllerAst(filePath: string, content: string): BoundaryViolation[] {
  const violations: BoundaryViolation[] = [];
  const displayPath = sanitizePath(filePath);
  const sourceFile = ts.createSourceFile(filePath, content, ts.ScriptTarget.Latest, true);

  function visit(node: ts.Node) {
    // 1. Check imports (static import, require, dynamic import)
    if (ts.isImportDeclaration(node)) {
      const moduleSpecifier = (node.moduleSpecifier as ts.StringLiteral).text;
      if (moduleSpecifier === "@prisma/client" || moduleSpecifier.includes("@prisma/client")) {
        violations.push({
          file: displayPath,
          line: getLineNumber(sourceFile, node.getStart()),
          rule: "CONTROLLER_PRISMA_IMPORT_PROHIBITED",
          description: "Controllers must not import @prisma/client directly. Use service layer interfaces.",
        });
      }
      if (moduleSpecifier.includes("database/prisma") || moduleSpecifier.includes("getPrismaClient")) {
        violations.push({
          file: displayPath,
          line: getLineNumber(sourceFile, node.getStart()),
          rule: "CONTROLLER_DATABASE_INFRA_IMPORT_PROHIBITED",
          description: "Controllers must not import or call database connection infrastructure (getPrismaClient).",
        });
      }
    }

    if (ts.isCallExpression(node)) {
      const exprText = node.expression.getText(sourceFile);
      if (exprText === "require" || exprText === "import") {
        const firstArg = node.arguments[0];
        if (firstArg && ts.isStringLiteral(firstArg)) {
          if (firstArg.text === "@prisma/client" || firstArg.text.includes("@prisma/client")) {
            violations.push({
              file: displayPath,
              line: getLineNumber(sourceFile, node.getStart()),
              rule: "CONTROLLER_PRISMA_IMPORT_PROHIBITED",
              description: "Controllers must not import @prisma/client directly.",
            });
          }
        }
      }

      // Check for raw SQL calls in controller
      if (exprText.includes("$queryRaw") || exprText.includes("$executeRaw")) {
        violations.push({
          file: displayPath,
          line: getLineNumber(sourceFile, node.getStart()),
          rule: "CONTROLLER_RAW_SQL_PROHIBITED",
          description: "Controllers must never contain raw SQL queries.",
        });
      }
    }

    if (ts.isTaggedTemplateExpression(node)) {
      const tagText = node.tag.getText(sourceFile);
      if (tagText.includes("$queryRaw") || tagText.includes("$executeRaw")) {
        violations.push({
          file: displayPath,
          line: getLineNumber(sourceFile, node.getStart()),
          rule: "CONTROLLER_RAW_SQL_PROHIBITED",
          description: "Controllers must never contain raw SQL queries.",
        });
      }
    }

    // 2. Check for direct Prisma repository or TransactionRunner instantiation in controller
    if (ts.isNewExpression(node)) {
      const className = node.expression.getText(sourceFile);
      if (/^Prisma[A-Za-z0-9_]*Repository$/.test(className) || className === "PrismaTransactionRunner") {
        violations.push({
          file: displayPath,
          line: getLineNumber(sourceFile, node.getStart()),
          rule: "CONTROLLER_DIRECT_PRISMA_REPO_INSTANTIATION",
          description: `Controllers must not instantiate ${className} directly. Inject or call service layer.`,
        });
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return violations;
}

/**
 * Scans a source string or file using the TypeScript AST for ordinary service boundary rules.
 */
export function scanServiceAst(filePath: string, content: string): BoundaryViolation[] {
  const violations: BoundaryViolation[] = [];
  const displayPath = sanitizePath(filePath);
  const sourceFile = ts.createSourceFile(filePath, content, ts.ScriptTarget.Latest, true);

  const destructuredModelAliases = new Set<string>();

  function visit(node: ts.Node) {
    // 1. Check for prohibited Prisma/infrastructure imports in ordinary service (including type-only imports)
    if (ts.isImportDeclaration(node)) {
      const moduleSpecifier = (node.moduleSpecifier as ts.StringLiteral).text;
      if (moduleSpecifier === "@prisma/client" || moduleSpecifier.includes("@prisma/client")) {
        violations.push({
          file: displayPath,
          line: getLineNumber(sourceFile, node.getStart()),
          rule: "SERVICE_PRISMA_CLIENT_IMPORT_PROHIBITED",
          description: "Ordinary services must not import @prisma/client (including type-only imports). Use repository interfaces, domain types, and ITransactionRunner.",
        });
      }
      if (moduleSpecifier.includes("database/prisma") || moduleSpecifier.includes("getPrismaClient")) {
        violations.push({
          file: displayPath,
          line: getLineNumber(sourceFile, node.getStart()),
          rule: "SERVICE_DATABASE_INFRA_IMPORT_PROHIBITED",
          description: "Ordinary services must not import database connection infrastructure (getPrismaClient).",
        });
      }
    }

    // Check dynamic require/import and direct $transaction
    if (ts.isCallExpression(node)) {
      const exprText = node.expression.getText(sourceFile);
      if (exprText === "require" || exprText === "import") {
        const firstArg = node.arguments[0];
        if (firstArg && ts.isStringLiteral(firstArg)) {
          if (firstArg.text === "@prisma/client" || firstArg.text.includes("@prisma/client")) {
            violations.push({
              file: displayPath,
              line: getLineNumber(sourceFile, node.getStart()),
              rule: "SERVICE_PRISMA_CLIENT_IMPORT_PROHIBITED",
              description: "Ordinary services must not import @prisma/client.",
            });
          }
        }
      }

      // Check direct $transaction calls
      if (exprText.includes("$transaction")) {
        violations.push({
          file: displayPath,
          line: getLineNumber(sourceFile, node.getStart()),
          rule: "SERVICE_DIRECT_TRANSACTION_PROHIBITED",
          description: "Ordinary services must not call $transaction directly. Use ITransactionRunner and TransactionContext.",
        });
      }

      // Check raw SQL calls
      if (exprText.includes("$queryRaw") || exprText.includes("$executeRaw")) {
        violations.push({
          file: displayPath,
          line: getLineNumber(sourceFile, node.getStart()),
          rule: "SERVICE_RAW_SQL_PROHIBITED",
          description: "Ordinary services must not execute raw SQL. Encapsulate queries in repositories.",
        });
      }
    }

    if (ts.isTaggedTemplateExpression(node)) {
      const tagText = node.tag.getText(sourceFile);
      if (tagText.includes("$queryRaw") || tagText.includes("$executeRaw")) {
        violations.push({
          file: displayPath,
          line: getLineNumber(sourceFile, node.getStart()),
          rule: "SERVICE_RAW_SQL_PROHIBITED",
          description: "Ordinary services must not execute raw SQL. Encapsulate queries in repositories.",
        });
      }
    }

    // 2. Check for direct Prisma repository instantiation in ordinary service
    if (ts.isNewExpression(node)) {
      const className = node.expression.getText(sourceFile);
      if (/^Prisma[A-Za-z0-9_]*Repository$/.test(className)) {
        violations.push({
          file: displayPath,
          line: getLineNumber(sourceFile, node.getStart()),
          rule: "SERVICE_DIRECT_PRISMA_REPO_INSTANTIATION",
          description: `Ordinary services must not instantiate ${className} directly. Use repository factory or interfaces.`,
        });
      }
      if (className === "PrismaTransactionRunner") {
        violations.push({
          file: displayPath,
          line: getLineNumber(sourceFile, node.getStart()),
          rule: "SERVICE_DIRECT_PRISMA_TRANSACTION_RUNNER_INSTANTIATION",
          description: "Ordinary services must not instantiate PrismaTransactionRunner directly. Inject ITransactionRunner.",
        });
      }
    }

    // 3. Check for destructured Prisma model assignments (e.g. const { user } = prisma;)
    if (ts.isVariableDeclaration(node) && ts.isObjectBindingPattern(node.name)) {
      for (const element of node.name.elements) {
        const propertyName = element.propertyName ? element.propertyName.getText(sourceFile) : element.name.getText(sourceFile);
        const aliasName = element.name.getText(sourceFile);
        if (KNOWN_PRISMA_MODELS.has(propertyName)) {
          destructuredModelAliases.add(aliasName);
        }
      }
    }

    // 4. Check for direct Prisma delegate queries on any object: (e.g. *.user.findUnique, db.user.create, client.credential.findFirst)
    if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression)) {
      const actionName = node.expression.name.text;
      const targetExpr = node.expression.expression;

      if (KNOWN_PRISMA_ACTIONS.has(actionName)) {
        // Check case 1: obj.<model>.<action>()
        if (ts.isPropertyAccessExpression(targetExpr)) {
          const modelName = targetExpr.name.text;
          if (KNOWN_PRISMA_MODELS.has(modelName)) {
            violations.push({
              file: displayPath,
              line: getLineNumber(sourceFile, node.getStart()),
              rule: "SERVICE_DIRECT_PRISMA_DELEGATE_QUERY_PROHIBITED",
              description: `Ordinary services must not query Prisma model delegate '${modelName}.${actionName}' directly. Encapsulate in repository.`,
            });
          }
        }
        // Check case 2: destructured model: <modelAlias>.<action>()
        if (ts.isIdentifier(targetExpr) && (KNOWN_PRISMA_MODELS.has(targetExpr.text) || destructuredModelAliases.has(targetExpr.text))) {
          violations.push({
            file: displayPath,
            line: getLineNumber(sourceFile, node.getStart()),
            rule: "SERVICE_DIRECT_PRISMA_DELEGATE_QUERY_PROHIBITED",
            description: `Ordinary services must not query Prisma model delegate '${targetExpr.text}.${actionName}' directly. Encapsulate in repository.`,
          });
        }
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return violations;
}

/**
 * Validates that raw SQL is strictly contained within approved repository and infrastructure modules.
 */
export function scanRawSqlContainment(allSourceFiles: string[]): BoundaryViolation[] {
  const violations: BoundaryViolation[] = [];

  for (const file of allSourceFiles) {
    if (isAllowlistedInfra(file) || isRepositoryFile(file)) {
      continue;
    }

    const content = fs.readFileSync(file, "utf-8");
    const displayPath = sanitizePath(file);
    const sourceFile = ts.createSourceFile(file, content, ts.ScriptTarget.Latest, true);

    function visit(node: ts.Node) {
      if (ts.isCallExpression(node)) {
        const exprText = node.expression.getText(sourceFile);
        if (
          exprText.includes("$queryRaw") ||
          exprText.includes("$executeRaw") ||
          exprText === "Prisma.raw" ||
          exprText.includes(".raw(") ||
          exprText === "Prisma.sql"
        ) {
          violations.push({
            file: displayPath,
            line: getLineNumber(sourceFile, node.getStart()),
            rule: "UNAUTHORIZED_RAW_SQL_LOCATION",
            description: "Raw SQL is only permitted in approved infrastructure and repository modules.",
          });
        }
      }
      if (ts.isTaggedTemplateExpression(node)) {
        const tagText = node.tag.getText(sourceFile);
        if (tagText.includes("$queryRaw") || tagText.includes("$executeRaw")) {
          violations.push({
            file: displayPath,
            line: getLineNumber(sourceFile, node.getStart()),
            rule: "UNAUTHORIZED_RAW_SQL_LOCATION",
            description: "Raw SQL is only permitted in approved infrastructure and repository modules.",
          });
        }
      }
      ts.forEachChild(node, visit);
    }

    visit(sourceFile);
  }

  return violations;
}

/**
 * Validates that controller files do NOT import Prisma, Prisma delegates, or database connection singletons.
 */
export function scanControllerBoundaries(controllerFiles: string[]): BoundaryViolation[] {
  const violations: BoundaryViolation[] = [];
  for (const file of controllerFiles) {
    const content = fs.readFileSync(file, "utf-8");
    violations.push(...scanControllerAst(file, content));
  }
  return violations;
}

/**
 * Validates that ordinary services do NOT perform direct Prisma delegate queries or direct repository construction.
 */
export function scanServiceBoundaries(serviceFiles: string[]): BoundaryViolation[] {
  const violations: BoundaryViolation[] = [];
  for (const file of serviceFiles) {
    const content = fs.readFileSync(file, "utf-8");
    violations.push(...scanServiceAst(file, content));
  }
  return violations;
}

/**
 * Full repository and transaction boundary scanner across the API source directory.
 */
export function scanRepositoryBoundary(srcDir: string): BoundaryScanResult {
  const allTsFiles = getAllFiles(srcDir, ".ts");

  const controllerFiles = allTsFiles.filter((f) => f.endsWith(".controller.ts") || f.includes("/controllers/"));
  const serviceFiles = allTsFiles.filter(
    (f) =>
      (f.endsWith(".service.ts") ||
        f.endsWith("role.seed.ts") ||
        f.endsWith(".seed.ts") ||
        f.includes("/services/")) &&
      !f.endsWith(".repository.ts") &&
      !f.includes("/repositories/"),
  );
  const repositoryFiles = allTsFiles.filter((f) => isRepositoryFile(f));

  const controllerViolations = scanControllerBoundaries(controllerFiles);
  const serviceViolations = scanServiceBoundaries(serviceFiles);
  const rawSqlViolations = scanRawSqlContainment(allTsFiles);

  const allViolations = [...controllerViolations, ...serviceViolations, ...rawSqlViolations];

  return {
    passed: allViolations.length === 0,
    violations: allViolations,
    controllersScanned: controllerFiles.length,
    servicesScanned: serviceFiles.length,
    repositoriesScanned: repositoryFiles.length,
  };
}

/**
 * Asserts that the entire API source tree obeys repository, service, and controller boundaries.
 * Throws an error if any violation is detected.
 */
export function assertRepositoryBoundary(srcDir: string): BoundaryScanResult {
  const result = scanRepositoryBoundary(srcDir);
  if (!result.passed) {
    const violationSummary = result.violations
      .map((v) => `  - [${v.rule}] ${v.file}:${v.line} - ${v.description}`)
      .join("\n");
    throw new Error(`[REPOSITORY_BOUNDARY_VIOLATION] Found ${result.violations.length} boundary violations:\n${violationSummary}`);
  }
  return result;
}

