import { describe, it, expect } from "vitest";
import {
  isSafeTestDatabaseUrl,
  assertSafeTestDatabase,
  sanitizeDatabaseUrl,
  sanitizeDiagnosticMessage,
} from "../helpers/test-db-guard.js";

describe("Test Database Guard (Unit)", () => {
  it("allows safe test database URLs with explicit test marker", () => {
    expect(isSafeTestDatabaseUrl("postgresql://postgres:postgrespassword@localhost:5432/aura_capital_test")).toBe(true);
    expect(isSafeTestDatabaseUrl("postgresql://ci_user:ci_pass@db-service:5432/test_db")).toBe(true);
    expect(isSafeTestDatabaseUrl("postgresql://user:pass@localhost:5432/aura_db?schema=test")).toBe(true);
  });

  it("strictly rejects local development, staging, and production database targets", () => {
    expect(isSafeTestDatabaseUrl("postgresql://postgres:postgrespassword@localhost:5432/aura_capital_dev")).toBe(
      false,
    );
    expect(isSafeTestDatabaseUrl("postgresql://admin:secret@prod-db.auracapital.com:5432/aura_capital_prod")).toBe(
      false,
    );
    expect(isSafeTestDatabaseUrl("postgresql://admin:secret@staging-db.auracapital.com:5432/aura_capital_staging")).toBe(
      false,
    );
    expect(isSafeTestDatabaseUrl("postgresql://user:pass@production-server:5432/aura_capital")).toBe(false);
  });

  it("sanitizes database URLs to safe redacted placeholder", () => {
    const rawUrl = "postgresql://myuser:supersecretpassword@localhost:5432/aura_capital_dev";
    const sanitized = sanitizeDatabaseUrl(rawUrl);

    expect(sanitized).toBe("[REDACTED_DB_URL]");
    expect(sanitized).not.toContain("supersecretpassword");
    expect(sanitized).not.toContain("localhost:5432");
    expect(sanitized).not.toContain("aura_capital_dev");
  });

  it("sanitizes diagnostic messages stripping host, port, db name, credentials, paths, and URLs", () => {
    const rawDiagnostic =
      "Error: connect ECONNREFUSED 127.0.0.1:5432 for database aura_capital_test_feat013 at D:\\project\\ura-capital\\apps\\api\\src\\index.ts with token=eyJhbGciOiJIUzI1NiJ9";
    const sanitized = sanitizeDiagnosticMessage(rawDiagnostic);

    expect(sanitized).not.toContain("127.0.0.1:5432");
    expect(sanitized).not.toContain("aura_capital_test_feat013");
    expect(sanitized).not.toContain("D:\\project");
    expect(sanitized).not.toContain("eyJhbGciOiJIUzI1NiJ9");
    expect(sanitized).toContain("[REDACTED_HOST:PORT]");
    expect(sanitized).toContain("[REDACTED_DB_NAME]");
    expect(sanitized).toContain("[REDACTED_PATH]");
    expect(sanitized).toContain("token=[REDACTED]");
  });

  it("throws error when NODE_ENV is not 'test'", () => {
    const safeUrl = "postgresql://postgres:postgres@localhost:5432/aura_capital_test";

    expect(() => assertSafeTestDatabase(safeUrl, "development")).toThrow(
      /\[TEST_DB_GUARD_VIOLATION\] Database tests must only run with NODE_ENV='test'/,
    );
    expect(() => assertSafeTestDatabase(safeUrl, "production")).toThrow(
      /\[TEST_DB_GUARD_VIOLATION\] Database tests must only run with NODE_ENV='test'/,
    );
    expect(() => assertSafeTestDatabase(safeUrl, "")).toThrow(
      /\[TEST_DB_GUARD_VIOLATION\] Database tests must only run with NODE_ENV='test'/,
    );
  });

  it("throws error and does NOT echo credentials, host, or db name when attempting to run tests against an unsafe database URL", () => {
    const sensitivePassword = "super_secret_db_password_12345";
    const unsafeUrl = `postgresql://admin:${sensitivePassword}@production-db.internal:5432/aura_capital_production`;

    try {
      assertSafeTestDatabase(unsafeUrl, "test");
      expect.unreachable("Should have thrown error");
    } catch (err: unknown) {
      const message = (err as Error).message;
      expect(message).toContain("[TEST_DB_GUARD_VIOLATION]");
      expect(message).not.toContain(sensitivePassword);
      expect(message).not.toContain("production-db.internal:5432");
      expect(message).not.toContain("aura_capital_production");
    }
  });

  it("passes when given a safe test URL and NODE_ENV='test'", () => {
    const safeUrl = "postgresql://postgres:postgrespassword@localhost:5432/aura_capital_test";

    expect(() => assertSafeTestDatabase(safeUrl, "test")).not.toThrow();
  });
});
