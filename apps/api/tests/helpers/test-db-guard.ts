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
