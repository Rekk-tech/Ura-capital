/**
 * Test Database Guard Utility
 * Ensures database operations in tests only run against safe, isolated test environments
 * and never against production, staging, local development, or unapproved database targets.
 */

const FORBIDDEN_DB_NAMES = [
  "aura_capital_dev",
  "aura_capital_development",
  "aura_capital_prod",
  "aura_capital_production",
  "aura_capital_staging",
  "aura_capital_stage",
];

/**
 * Sanitizes any diagnostic string or error message to ensure NO sensitive infrastructure details,
 * hostnames, ports, database names, credentials, DATABASE_URL, raw SQL, or absolute local paths leak out.
 */
export function sanitizeDiagnosticMessage(message: string): string {
  if (!message || typeof message !== "string") {
    return "";
  }

  let sanitized = message;

  // 1. Redact database URLs (postgres/postgresql)
  sanitized = sanitized.replace(/postgres(?:ql)?:\/\/[^\s"'`]+/gi, "[REDACTED_DB_URL]");

  // 2. Redact Redis URLs
  sanitized = sanitized.replace(/redis:\/\/[^\s"'`]+/gi, "[REDACTED_REDIS_URL]");

  // 3. Redact host:port pairs
  sanitized = sanitized.replace(/(?:localhost|127\.0\.0\.1|0\.0\.0\.0|[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}):\d{2,5}/gi, "[REDACTED_HOST:PORT]");

  // 4. Redact database names (e.g. aura_capital_test, aura_capital_dev, etc.)
  sanitized = sanitized.replace(/aura_capital_[a-zA-Z0-9_]+/gi, "[REDACTED_DB_NAME]");

  // 5. Redact absolute local file paths (Windows & Unix)
  sanitized = sanitized.replace(/[a-zA-Z]:\\[^\s"'`:]+/g, "[REDACTED_PATH]");
  sanitized = sanitized.replace(/(?:\/[a-zA-Z0-9_.-]+){3,}/g, "[REDACTED_PATH]");

  // 6. Redact potential credentials or tokens in key=value pairs
  sanitized = sanitized.replace(/(password|token|secret|cookie|authorization|key)=([^\s"'`&]+)/gi, "$1=[REDACTED]");

  return sanitized;
}

export function sanitizeDatabaseUrl(databaseUrl: string): string {
  if (!databaseUrl || typeof databaseUrl !== "string") {
    return "[INVALID_URL]";
  }
  return "[REDACTED_DB_URL]";
}

export function isSafeTestDatabaseUrl(databaseUrl: string): boolean {
  if (!databaseUrl || typeof databaseUrl !== "string") {
    return false;
  }

  let dbName = "";
  let hostname = "";

  try {
    const parsed = new URL(databaseUrl);
    dbName = (parsed.pathname || "").replace(/^\//, "").toLowerCase();
    hostname = (parsed.hostname || "").toLowerCase();
  } catch {
    const normalized = databaseUrl.toLowerCase();
    const parts = normalized.split("/");
    dbName = parts[parts.length - 1] || "";
  }

  // 1. Explicit rejection of known development, staging, or production database names
  for (const forbidden of FORBIDDEN_DB_NAMES) {
    if (dbName === forbidden || dbName.includes(forbidden)) {
      return false;
    }
  }

  // 2. Reject if hostname contains production or staging markers
  if (hostname.includes("prod") || hostname.includes("staging")) {
    return false;
  }

  // 3. Reject if dbName contains general development or production keywords without test marker
  if (dbName.includes("dev") && !dbName.includes("test")) {
    return false;
  }

  // 4. Require explicit test marker in the database name or schema
  const hasTestMarker = dbName.includes("test") || databaseUrl.toLowerCase().includes("schema=test");

  return hasTestMarker;
}

export function assertSafeTestDatabase(
  databaseUrl: string,
  nodeEnv: string = process.env.NODE_ENV ?? "",
): void {
  if (nodeEnv !== "test") {
    throw new Error(
      `[TEST_DB_GUARD_VIOLATION] Database tests must only run with NODE_ENV='test'. Current NODE_ENV: '${nodeEnv}'`,
    );
  }

  if (!isSafeTestDatabaseUrl(databaseUrl)) {
    throw new Error(
      `[TEST_DB_GUARD_VIOLATION] Refusing to run tests against an unsafe or non-test database target. Database must contain an explicit test marker (e.g., 'aura_capital_test').`,
    );
  }
}

export interface TestCleanupClient {
  academyRewardLedger?: { deleteMany: () => Promise<unknown> };
  academyUserXp?: { deleteMany: () => Promise<unknown> };
  academyUserLessonProgress?: { deleteMany: () => Promise<unknown> };
  academyUserCourseProgress?: { deleteMany: () => Promise<unknown> };
  academyQuizAnswer?: { deleteMany: () => Promise<unknown> };
  academyQuizAttempt?: { deleteMany: () => Promise<unknown> };
  academyQuizOption?: { deleteMany: () => Promise<unknown> };
  academyQuizQuestion?: { deleteMany: () => Promise<unknown> };
  academyQuiz?: { deleteMany: () => Promise<unknown> };
  academyFlashcard?: { deleteMany: () => Promise<unknown> };
  academyLesson?: { deleteMany: () => Promise<unknown> };
  academyCourse?: { deleteMany: () => Promise<unknown> };
  userRole?: { deleteMany: () => Promise<unknown> };
  credential?: { deleteMany: () => Promise<unknown> };
  refreshSession?: { deleteMany: () => Promise<unknown> };
  authSecurityAuditRecord?: { deleteMany: () => Promise<unknown> };
  role?: { deleteMany: () => Promise<unknown> };
  user?: { deleteMany: () => Promise<unknown> };
}

export async function cleanAllTestTables(prisma: TestCleanupClient | null | undefined): Promise<void> {
  if (!prisma) return;
  // Phase 4 Academy tables (in reverse dependency order)
  if (prisma.academyRewardLedger) await prisma.academyRewardLedger.deleteMany().catch(() => {});
  if (prisma.academyUserXp) await prisma.academyUserXp.deleteMany().catch(() => {});
  if (prisma.academyUserLessonProgress) await prisma.academyUserLessonProgress.deleteMany().catch(() => {});
  if (prisma.academyUserCourseProgress) await prisma.academyUserCourseProgress.deleteMany().catch(() => {});
  if (prisma.academyQuizAnswer) await prisma.academyQuizAnswer.deleteMany().catch(() => {});
  if (prisma.academyQuizAttempt) await prisma.academyQuizAttempt.deleteMany().catch(() => {});
  if (prisma.academyQuizOption) await prisma.academyQuizOption.deleteMany().catch(() => {});
  if (prisma.academyQuizQuestion) await prisma.academyQuizQuestion.deleteMany().catch(() => {});
  if (prisma.academyQuiz) await prisma.academyQuiz.deleteMany().catch(() => {});
  if (prisma.academyFlashcard) await prisma.academyFlashcard.deleteMany().catch(() => {});
  if (prisma.academyLesson) await prisma.academyLesson.deleteMany().catch(() => {});
  if (prisma.academyCourse) await prisma.academyCourse.deleteMany().catch(() => {});

  // Phase 2/3 Identity tables
  if (prisma.userRole) await prisma.userRole.deleteMany().catch(() => {});
  if (prisma.credential) await prisma.credential.deleteMany().catch(() => {});
  if (prisma.refreshSession) await prisma.refreshSession.deleteMany().catch(() => {});
  if (prisma.authSecurityAuditRecord) await prisma.authSecurityAuditRecord.deleteMany().catch(() => {});
  if (prisma.role) await prisma.role.deleteMany().catch(() => {});
  if (prisma.user) await prisma.user.deleteMany().catch(() => {});
}
