import { describe, it, expect } from "vitest";
import { getRateLimitConfig } from "../../src/modules/auth/rate-limit/rate-limit.config.js";
import { EnvConfigSchema } from "@aura/shared";

describe("Rate Limit Config", () => {
  const baseValidEnv = {
    NODE_ENV: "test" as const,
    PORT: 4000,
    HOST: "localhost",
    JWT_SECRET: "development-fallback-secret-for-jwt-signing-only-minimum-32-chars-long",
    DATABASE_URL: "postgresql://postgres:postgrespassword@localhost:5432/aura_capital_test",
    AUTH_ACCESS_TOKEN_SECRET: "aura-capital-dev-access-token-secret-at-least-32-chars",
    AUTH_REFRESH_TOKEN_SECRET: "aura-capital-dev-refresh-token-secret-at-least-32-chars",
    AUTH_ACCESS_TOKEN_ISSUER: "aura-capital",
    AUTH_ACCESS_TOKEN_AUDIENCE: "aura-client",
    AUTH_RATE_LIMIT_ENABLED: true,
    AUTH_RATE_LIMIT_KEY_SECRET: "aura-capital-dev-rate-limit-hmac-key-at-least-32-chars",
    AUTH_RATE_LIMIT_TRUST_PROXY: false,
  };

  it("returns default config matching approved spec thresholds", () => {
    const parsedEnv = EnvConfigSchema.parse(baseValidEnv);
    const config = getRateLimitConfig(parsedEnv);

    expect(config.enabled).toBe(true);
    expect(config.trustProxy).toBe(false);
    expect(config.keySecret).toBe("aura-capital-dev-rate-limit-hmac-key-at-least-32-chars");

    // Login policy thresholds
    expect(config.login.identitySource.maxAttempts).toBe(5);
    expect(config.login.identitySource.windowSec).toBe(600);
    expect(config.login.identitySource.cooldownSec).toBe(900);
    expect(config.login.sourceCeiling.maxAttempts).toBe(30);
    expect(config.login.sourceCeiling.windowSec).toBe(600);
    expect(config.login.sourceCeiling.cooldownSec).toBe(900);
    expect(config.login.escalatedCooldownSec).toBe(1800);
    expect(config.login.escalationWindowSec).toBe(3600);

    // Register policy thresholds
    expect(config.register.source.maxAttempts).toBe(5);
    expect(config.register.source.windowSec).toBe(900);
    expect(config.register.source.cooldownSec).toBe(1800);
    expect(config.register.identitySource.maxAttempts).toBe(3);
    expect(config.register.identitySource.windowSec).toBe(3600);
    expect(config.register.identitySource.cooldownSec).toBe(1800);

    // Refresh policy thresholds
    expect(config.refresh.source.maxAttempts).toBe(20);
    expect(config.refresh.source.windowSec).toBe(600);
    expect(config.refresh.source.cooldownSec).toBe(900);
    expect(config.refresh.malformedSource.maxAttempts).toBe(5);
    expect(config.refresh.malformedSource.windowSec).toBe(600);
    expect(config.refresh.malformedSource.cooldownSec).toBe(900);
  });

  it("rejects short rate-limit key secret in production", () => {
    const prodEnv = {
      ...baseValidEnv,
      NODE_ENV: "production" as const,
      AUTH_REFRESH_COOKIE_SECURE: true,
      AUTH_RATE_LIMIT_KEY_SECRET: "too-short",
    };

    const result = EnvConfigSchema.safeParse(prodEnv);
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path.includes("AUTH_RATE_LIMIT_KEY_SECRET"));
      expect(issue).toBeDefined();
    }
  });

  it("rejects reused JWT/auth secrets for rate-limit key secret in production", () => {
    const prodEnv = {
      ...baseValidEnv,
      NODE_ENV: "production" as const,
      AUTH_REFRESH_COOKIE_SECURE: true,
      AUTH_RATE_LIMIT_KEY_SECRET: baseValidEnv.AUTH_ACCESS_TOKEN_SECRET, // Reusing secret
    };

    const result = EnvConfigSchema.safeParse(prodEnv);
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path.includes("AUTH_RATE_LIMIT_KEY_SECRET"));
      expect(issue).toBeDefined();
      expect(issue?.message).toContain("must not reuse");
    }
  });
});
