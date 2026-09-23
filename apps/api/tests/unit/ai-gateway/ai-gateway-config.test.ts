import { describe, it, expect } from "vitest";
import type { EnvConfig } from "@aura/shared";
import {
  validateAIGatewayConfig,
  isApprovedFakeEnvironment,
  isProductionLikeEnvironment,
  getMockActivationProof,
} from "../../../src/modules/ai/core/ai-gateway.config.js";
import { AIGatewayConfigurationError } from "../../../src/modules/ai/core/ai-gateway.errors.js";
import { MOCK_AI_ACTIVATION_PROOF } from "../../../src/modules/ai/core/llm-provider.types.js";

describe("FEAT-058 AI Gateway Configuration & Environment Validation", () => {
  const baseValidEnv: EnvConfig = {
    NODE_ENV: "development",
    PORT: 4000,
    HOST: "localhost",
    JWT_SECRET: "11111111-2222-3333-4444-555555555555-jwt-secret-min32",
    CORS_ORIGIN: "http://localhost:5173",
    DATABASE_URL: "postgresql://postgres:postgrespassword@localhost:5432/aura_capital_dev",
    AUTH_ACCESS_TOKEN_SECRET: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee-access-secret-32",
    AUTH_REFRESH_TOKEN_SECRET: "11112222-3333-4444-5555-666677778888-refresh-secret-32",
    AUTH_ACCESS_TOKEN_TTL_MINUTES: 15,
    AUTH_ACCESS_TOKEN_ISSUER: "aura-capital",
    AUTH_ACCESS_TOKEN_AUDIENCE: "aura-client",
    AUTH_REFRESH_TOKEN_TTL_DAYS: 7,
    AUTH_REFRESH_COOKIE_NAME: "aura_refresh_token",
    AUTH_REFRESH_COOKIE_SECURE: false,
    AUTH_REFRESH_COOKIE_SAME_SITE: "lax",
    AUTH_RATE_LIMIT_WINDOW_MS: 900000,
    AUTH_RATE_LIMIT_MAX_REQUESTS: 100,
    AUTH_RATE_LIMIT_ENABLED: false,
    AUTH_RATE_LIMIT_TRUST_PROXY: false,
    COMMUNITY_RATE_LIMIT_ENABLED: false,
    AI_DAILY_QUOTA: 50,
    AI_ENABLED: false,
    GEMINI_AUTOMATIC_FALLBACK: false,
    GEMINI_AUTOMATIC_RETRY: false,
  };

  const validGeminiEnv: EnvConfig = {
    ...baseValidEnv,
    AI_ENABLED: true,
    AI_PROVIDER: "gemini",
    GEMINI_MODEL_ID: "gemini-3.5-flash-lite",
    GEMINI_API_VERSION: "v1",
    GEMINI_MAX_INPUT_TOKENS: 4096,
    GEMINI_MAX_OUTPUT_TOKENS: 1024,
    GEMINI_TIMEOUT_MS: 15000,
    GEMINI_AUTOMATIC_FALLBACK: false,
    GEMINI_AUTOMATIC_RETRY: false,
    GEMINI_API_KEY: "test-dev-gemini-key",
  };

  describe("Disabled State by Default", () => {
    it("returns enabled=false when AI_ENABLED is false", () => {
      const config = validateAIGatewayConfig(baseValidEnv);
      expect(config.enabled).toBe(false);
      expect(config.provider).toBeNull();
      expect(config.modelId).toBeNull();
    });
  });

  describe("Approved Gemini Development Configuration (AC-002)", () => {
    it("successfully validates pinned Gemini development settings", () => {
      const config = validateAIGatewayConfig(validGeminiEnv);
      expect(config.enabled).toBe(true);
      expect(config.provider).toBe("gemini");
      expect(config.modelId).toBe("gemini-3.5-flash-lite");
      expect(config.apiVersion).toBe("v1");
      expect(config.maxInputTokens).toBe(4096);
      expect(config.maxOutputTokens).toBe(1024);
      expect(config.timeoutMs).toBe(15000);
      expect(config.apiKey).toBe("test-dev-gemini-key");
    });

    it("rejects wrong or unapproved model identifier", () => {
      expect(() =>
        validateAIGatewayConfig({
          ...validGeminiEnv,
          GEMINI_MODEL_ID: "gemini-2.5-flash",
        }),
      ).toThrow(AIGatewayConfigurationError);

      expect(() =>
        validateAIGatewayConfig({
          ...validGeminiEnv,
          GEMINI_MODEL_ID: "gemini-2.0-flash",
        }),
      ).toThrow(AIGatewayConfigurationError);
    });

    it("rejects wrong or unapproved API version", () => {
      expect(() =>
        validateAIGatewayConfig({
          ...validGeminiEnv,
          GEMINI_API_VERSION: "v1beta",
        }),
      ).toThrow(AIGatewayConfigurationError);
    });

    it("rejects token limit exceeding 4096 / 1024 budgets", () => {
      expect(() =>
        validateAIGatewayConfig({
          ...validGeminiEnv,
          GEMINI_MAX_INPUT_TOKENS: 8192,
        }),
      ).toThrow(AIGatewayConfigurationError);

      expect(() =>
        validateAIGatewayConfig({
          ...validGeminiEnv,
          GEMINI_MAX_OUTPUT_TOKENS: 2048,
        }),
      ).toThrow(AIGatewayConfigurationError);
    });

    it("rejects timeout exceeding 15000 ms", () => {
      expect(() =>
        validateAIGatewayConfig({
          ...validGeminiEnv,
          GEMINI_TIMEOUT_MS: 30000,
        }),
      ).toThrow(AIGatewayConfigurationError);
    });

    it("rejects automatic fallback when enabled", () => {
      expect(() =>
        validateAIGatewayConfig({
          ...validGeminiEnv,
          GEMINI_AUTOMATIC_FALLBACK: true,
        }),
      ).toThrow(AIGatewayConfigurationError);
    });

    it("rejects automatic retry when enabled", () => {
      expect(() =>
        validateAIGatewayConfig({
          ...validGeminiEnv,
          GEMINI_AUTOMATIC_RETRY: true,
        }),
      ).toThrow(AIGatewayConfigurationError);
    });

    it("rejects missing or empty GEMINI_API_KEY", () => {
      expect(() =>
        validateAIGatewayConfig({
          ...validGeminiEnv,
          GEMINI_API_KEY: "",
        }),
      ).toThrow(AIGatewayConfigurationError);

      expect(() =>
        validateAIGatewayConfig({
          ...validGeminiEnv,
          GEMINI_API_KEY: undefined,
        }),
      ).toThrow(AIGatewayConfigurationError);
    });
  });

  describe("Environment Classification and Fake Provider Isolation (AC-004, AC-009)", () => {
    it("recognizes production and production-like environments", () => {
      expect(isProductionLikeEnvironment("production")).toBe(true);
      expect(isProductionLikeEnvironment("prod")).toBe(true);
      expect(isProductionLikeEnvironment("staging")).toBe(true);
      expect(isProductionLikeEnvironment("uat")).toBe(true);
      expect(isProductionLikeEnvironment("sandbox")).toBe(true);
      expect(isProductionLikeEnvironment(undefined)).toBe(true); // Fails closed on undefined
      expect(isProductionLikeEnvironment("unknown")).toBe(true); // Fails closed on unknown
      expect(isProductionLikeEnvironment("development")).toBe(false);
      expect(isProductionLikeEnvironment("test")).toBe(false);
    });

    it("approves fake environment only in development or test", () => {
      expect(isApprovedFakeEnvironment({ nodeEnv: "development" })).toBe(true);
      expect(isApprovedFakeEnvironment({ nodeEnv: "test" })).toBe(true);
      expect(isApprovedFakeEnvironment({ nodeEnv: "production" })).toBe(false);
      expect(isApprovedFakeEnvironment({ nodeEnv: "staging" })).toBe(false);
      expect(isApprovedFakeEnvironment({ nodeEnv: "uat" })).toBe(false);
      expect(isApprovedFakeEnvironment({})).toBe(false);
    });

    it("issues mock activation proof symbol only in approved environment", () => {
      const proof = getMockActivationProof({ nodeEnv: "test" });
      expect(proof).toBe(MOCK_AI_ACTIVATION_PROOF);

      expect(() => getMockActivationProof({ nodeEnv: "production" })).toThrow(
        AIGatewayConfigurationError,
      );
      expect(() => getMockActivationProof({ nodeEnv: "staging" })).toThrow(
        AIGatewayConfigurationError,
      );
    });

    it("rejects production activation unconditionally (P8-D11/P8-D15)", () => {
      expect(() =>
        validateAIGatewayConfig({
          ...validGeminiEnv,
          NODE_ENV: "production",
        }),
      ).toThrow(AIGatewayConfigurationError);

      expect(() =>
        validateAIGatewayConfig({
          ...validGeminiEnv,
          NODE_ENV: "staging" as unknown as EnvConfig["NODE_ENV"],
        }),
      ).toThrow(AIGatewayConfigurationError);
    });

    it("permits mock provider in development mode", () => {
      const config = validateAIGatewayConfig({
        ...baseValidEnv,
        AI_ENABLED: true,
        AI_PROVIDER: "mock",
      });
      expect(config.enabled).toBe(true);
      expect(config.provider).toBe("mock");
      expect(config.modelId).toBe("mock-model");
    });
  });
});
