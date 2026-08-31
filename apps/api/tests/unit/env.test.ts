import { describe, it, expect } from "vitest";
import { validateEnv } from "../../src/infrastructure/config/env.js";
import { getAuthConfig } from "../../src/infrastructure/config/auth.config.js";

describe("API Environment Validation (Unit)", () => {
  const baseValidEnv = {
    NODE_ENV: "development" as const,
    PORT: "4000",
    HOST: "localhost",
    JWT_SECRET: "valid-jwt-secret-with-at-least-32-characters-length",
    AUTH_ACCESS_TOKEN_SECRET: "valid-access-token-secret-at-least-32-characters-length",
    AUTH_REFRESH_TOKEN_SECRET: "valid-refresh-token-secret-at-least-32-characters-length",
    AUTH_ACCESS_TOKEN_ISSUER: "aura-capital",
    AUTH_ACCESS_TOKEN_AUDIENCE: "aura-client",
    DATABASE_URL: "postgresql://postgres:postgrespassword@localhost:5432/aura_capital_dev",
    CORS_ORIGIN: "http://localhost:5173",
    AUTH_RATE_LIMIT_KEY_SECRET: "valid-rate-limit-hmac-secret-at-least-32-chars",
  };

  it("fails startup when JWT_SECRET is missing", () => {
    const invalidEnv = {
      ...baseValidEnv,
      JWT_SECRET: undefined,
    };

    expect(() => validateEnv(invalidEnv)).toThrow(/JWT_SECRET/);
  });

  it("fails startup when JWT_SECRET is shorter than 32 characters", () => {
    const invalidEnv = {
      ...baseValidEnv,
      JWT_SECRET: "short-secret",
    };

    expect(() => validateEnv(invalidEnv)).toThrow(/at least 32 characters long/);
  });

  it("fails startup when AUTH_ACCESS_TOKEN_SECRET is missing (no fallback allowed)", () => {
    const invalidEnv = {
      ...baseValidEnv,
      AUTH_ACCESS_TOKEN_SECRET: undefined,
    };

    expect(() => validateEnv(invalidEnv)).toThrow(/AUTH_ACCESS_TOKEN_SECRET/);
  });

  it("fails startup when AUTH_REFRESH_TOKEN_SECRET is missing (no fallback allowed)", () => {
    const invalidEnv = {
      ...baseValidEnv,
      AUTH_REFRESH_TOKEN_SECRET: undefined,
    };

    expect(() => validateEnv(invalidEnv)).toThrow(/AUTH_REFRESH_TOKEN_SECRET/);
  });

  it("fails startup when AUTH_ACCESS_TOKEN_ISSUER is missing (no fallback allowed)", () => {
    const invalidEnv = {
      ...baseValidEnv,
      AUTH_ACCESS_TOKEN_ISSUER: undefined,
    };

    expect(() => validateEnv(invalidEnv)).toThrow(/AUTH_ACCESS_TOKEN_ISSUER/);
  });

  it("fails startup when AUTH_ACCESS_TOKEN_AUDIENCE is missing (no fallback allowed)", () => {
    const invalidEnv = {
      ...baseValidEnv,
      AUTH_ACCESS_TOKEN_AUDIENCE: undefined,
    };

    expect(() => validateEnv(invalidEnv)).toThrow(/AUTH_ACCESS_TOKEN_AUDIENCE/);
  });

  it("fails startup when AUTH_ACCESS_TOKEN_SECRET is present but < 32 characters", () => {
    const invalidEnv = {
      ...baseValidEnv,
      AUTH_ACCESS_TOKEN_SECRET: "too-short",
    };

    expect(() => validateEnv(invalidEnv)).toThrow(/AUTH_ACCESS_TOKEN_SECRET/);
  });

  it("fails startup when AUTH_REFRESH_TOKEN_SECRET is present but < 32 characters", () => {
    const invalidEnv = {
      ...baseValidEnv,
      AUTH_REFRESH_TOKEN_SECRET: "too-short",
    };

    expect(() => validateEnv(invalidEnv)).toThrow(/AUTH_REFRESH_TOKEN_SECRET/);
  });

  it("fails startup when DATABASE_URL is missing or empty", () => {
    const invalidEnv = {
      ...baseValidEnv,
      DATABASE_URL: "",
    };

    expect(() => validateEnv(invalidEnv)).toThrow(/DATABASE_URL/);
  });

  it("fails startup when AUTH_ACCESS_TOKEN_TTL_MINUTES is outside 5-15 minute range", () => {
    expect(() =>
      validateEnv({
        ...baseValidEnv,
        AUTH_ACCESS_TOKEN_TTL_MINUTES: "4",
      }),
    ).toThrow(/AUTH_ACCESS_TOKEN_TTL_MINUTES must be between 5 and 15 minutes/);

    expect(() =>
      validateEnv({
        ...baseValidEnv,
        AUTH_ACCESS_TOKEN_TTL_MINUTES: "16",
      }),
    ).toThrow(/AUTH_ACCESS_TOKEN_TTL_MINUTES must be between 5 and 15 minutes/);
  });

  it("fails startup when AUTH_REFRESH_TOKEN_TTL_DAYS is outside 1-30 days range", () => {
    expect(() =>
      validateEnv({
        ...baseValidEnv,
        AUTH_REFRESH_TOKEN_TTL_DAYS: "0",
      }),
    ).toThrow(/AUTH_REFRESH_TOKEN_TTL_DAYS must be between 1 and 30 days/);

    expect(() =>
      validateEnv({
        ...baseValidEnv,
        AUTH_REFRESH_TOKEN_TTL_DAYS: "31",
      }),
    ).toThrow(/AUTH_REFRESH_TOKEN_TTL_DAYS must be between 1 and 30 days/);
  });

  it("fails startup when NODE_ENV is production but AUTH_REFRESH_COOKIE_SECURE is false", () => {
    expect(() =>
      validateEnv({
        ...baseValidEnv,
        NODE_ENV: "production",
        AUTH_REFRESH_COOKIE_SECURE: "false",
      }),
    ).toThrow(/AUTH_REFRESH_COOKIE_SECURE must be true in production environment/);
  });

  it("does not leak secret values in validation error messages", () => {
    const sensitiveValue = "super-secret-password-12345";
    try {
      validateEnv({
        ...baseValidEnv,
        JWT_SECRET: sensitiveValue, // Invalid because < 32 chars
      });
      expect.unreachable("Should have thrown error");
    } catch (err: unknown) {
      const message = (err as Error).message;
      expect(message).not.toContain(sensitiveValue);
      expect(message).toContain("JWT_SECRET");
    }
  });

  it("passes when valid environment variables are supplied and provides structured auth config with explicit secrets", () => {
    const validated = validateEnv(baseValidEnv);
    expect(validated.NODE_ENV).toBe("development");
    expect(validated.PORT).toBe(4000);
    expect(validated.DATABASE_URL).toBe("postgresql://postgres:postgrespassword@localhost:5432/aura_capital_dev");

    const authConfig = getAuthConfig(validated);
    expect(authConfig.accessTokenSecret).toBe("valid-access-token-secret-at-least-32-characters-length");
    expect(authConfig.refreshTokenSecret).toBe("valid-refresh-token-secret-at-least-32-characters-length");
    expect(authConfig.accessTokenIssuer).toBe("aura-capital");
    expect(authConfig.accessTokenAudience).toBe("aura-client");
    expect(authConfig.accessTokenTtlMinutes).toBe(15);
    expect(authConfig.refreshTokenTtlDays).toBe(7);
    expect(authConfig.refreshCookie.httpOnly).toBe(true);
    expect(authConfig.refreshCookie.name).toBe("aura_refresh_token");
    expect(authConfig.refreshCookie.sameSite).toBe("lax");
  });

  it("validates that CI environment variables from .github/workflows/ci.yml satisfy all startup requirements (DEF-002)", () => {
    const ciEnvironmentSet = {
      NODE_ENV: "test",
      PORT: "4000",
      HOST: "localhost",
      JWT_SECRET: "ci-test-jwt-secret-with-at-least-32-characters-length",
      AUTH_ACCESS_TOKEN_SECRET: "ci-test-jwt-secret-with-at-least-32-characters-length",
      AUTH_REFRESH_TOKEN_SECRET: "ci-test-jwt-secret-with-at-least-32-characters-length",
      AUTH_ACCESS_TOKEN_ISSUER: "aura-capital",
      AUTH_ACCESS_TOKEN_AUDIENCE: "aura-client",
      DATABASE_URL: "postgresql://postgres:postgrespassword@localhost:5432/aura_capital_test",
      TEST_DATABASE_URL: "postgresql://postgres:postgrespassword@localhost:5432/aura_capital_test",
      CORS_ORIGIN: "http://localhost:5173",
    };

    const validated = validateEnv(ciEnvironmentSet);
    expect(validated.AUTH_ACCESS_TOKEN_ISSUER).toBe("aura-capital");
    expect(validated.AUTH_ACCESS_TOKEN_AUDIENCE).toBe("aura-client");
    expect(validated.AUTH_ACCESS_TOKEN_SECRET).toBe("ci-test-jwt-secret-with-at-least-32-characters-length");
    expect(validated.NODE_ENV).toBe("test");
  });
});
