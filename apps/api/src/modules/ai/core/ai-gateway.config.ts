import type { EnvConfig } from "@aura/shared";
import {
  APPROVED_GEMINI_MODELS,
  APPROVED_GEMINI_API_VERSIONS,
  APPROVED_GEMINI_MAX_INPUT_TOKENS,
  APPROVED_GEMINI_MAX_OUTPUT_TOKENS,
  APPROVED_GEMINI_TIMEOUT_MS,
} from "@aura/shared";
import { AIGatewayConfigurationError } from "./ai-gateway.errors.js";
import { MOCK_AI_ACTIVATION_PROOF } from "./llm-provider.types.js";

export interface AIGatewayConfig {
  readonly enabled: boolean;
  readonly provider: "gemini" | "mock" | null;
  readonly modelId: string | null;
  readonly apiVersion: string | null;
  readonly maxInputTokens: number;
  readonly maxOutputTokens: number;
  readonly timeoutMs: number;
  readonly apiKey: string | null;
}

/**
 * Returns true if the environment represents a production, staging, or unknown non-development target.
 * Fails closed: only explicit 'development' and 'test' are non-production.
 */
export function isProductionLikeEnvironment(nodeEnv?: string): boolean {
  if (!nodeEnv || typeof nodeEnv !== "string") {
    return true; // Unknown environments fail closed as production-like
  }
  const normalized = nodeEnv.trim().toLowerCase();
  if (normalized === "development" || normalized === "test") {
    return false;
  }
  return true;
}

/**
 * Validates whether mock / fake AI adapters are permitted in the current environment.
 * Approved ONLY for explicit local development or test / CI modes.
 */
export function isApprovedFakeEnvironment(env: { nodeEnv?: string; isCi?: boolean }): boolean {
  const nodeEnv = env.nodeEnv?.trim().toLowerCase();
  if (!nodeEnv) return false;

  // Staging, production, production-like targets fail closed
  if (isProductionLikeEnvironment(nodeEnv)) {
    return false;
  }

  // Permitted in test or development
  return nodeEnv === "test" || nodeEnv === "development";
}

/**
 * Issues activation proof symbol for deterministic fake provider in approved environments only.
 * Fails closed in production-like or unknown environments.
 */
export function getMockActivationProof(env: { nodeEnv?: string; isCi?: boolean }): symbol {
  if (!isApprovedFakeEnvironment(env)) {
    throw new AIGatewayConfigurationError(
      "Deterministic mock AI provider is prohibited outside approved test or local development environments",
    );
  }
  return MOCK_AI_ACTIVATION_PROOF;
}

/**
 * Validates application environment against strict AI Gateway configuration rules.
 */
export function validateAIGatewayConfig(env: EnvConfig): AIGatewayConfig {
  if (!env.AI_ENABLED) {
    return {
      enabled: false,
      provider: null,
      modelId: null,
      apiVersion: null,
      maxInputTokens: 0,
      maxOutputTokens: 0,
      timeoutMs: 0,
      apiKey: null,
    };
  }

  // Production activation is strictly disabled pending P8-D11 & P8-D15 approvals
  if (isProductionLikeEnvironment(env.NODE_ENV)) {
    throw new AIGatewayConfigurationError(
      "Production AI activation is disabled pending P8-D11 and P8-D15 approvals",
    );
  }

  const provider = env.AI_PROVIDER;
  if (!provider || (provider !== "gemini" && provider !== "mock")) {
    throw new AIGatewayConfigurationError(
      `Unsupported or missing AI_PROVIDER: ${provider ?? "undefined"}`,
    );
  }

  if (provider === "mock") {
    if (!isApprovedFakeEnvironment({ nodeEnv: env.NODE_ENV })) {
      throw new AIGatewayConfigurationError(
        "Mock AI provider is only permitted in development and test environments",
      );
    }

    return {
      enabled: true,
      provider: "mock",
      modelId: "mock-model",
      apiVersion: "v1",
      maxInputTokens: 4096,
      maxOutputTokens: 1024,
      timeoutMs: 15000,
      apiKey: null,
    };
  }

  // Provider is "gemini" — validate development runtime settings (P8-D03)
  const modelId = env.GEMINI_MODEL_ID;
  if (!modelId || !(APPROVED_GEMINI_MODELS as readonly string[]).includes(modelId)) {
    throw new AIGatewayConfigurationError(
      `Invalid GEMINI_MODEL_ID: expected 'gemini-3.5-flash-lite', got '${modelId ?? ""}'`,
    );
  }

  const apiVersion = env.GEMINI_API_VERSION;
  if (!apiVersion || !(APPROVED_GEMINI_API_VERSIONS as readonly string[]).includes(apiVersion)) {
    throw new AIGatewayConfigurationError(
      `Invalid GEMINI_API_VERSION: expected 'v1', got '${apiVersion ?? ""}'`,
    );
  }

  const maxInputTokens = env.GEMINI_MAX_INPUT_TOKENS ?? APPROVED_GEMINI_MAX_INPUT_TOKENS;
  if (maxInputTokens < 1 || maxInputTokens > APPROVED_GEMINI_MAX_INPUT_TOKENS) {
    throw new AIGatewayConfigurationError(
      `GEMINI_MAX_INPUT_TOKENS must be between 1 and ${APPROVED_GEMINI_MAX_INPUT_TOKENS}`,
    );
  }

  const maxOutputTokens = env.GEMINI_MAX_OUTPUT_TOKENS ?? APPROVED_GEMINI_MAX_OUTPUT_TOKENS;
  if (maxOutputTokens < 1 || maxOutputTokens > APPROVED_GEMINI_MAX_OUTPUT_TOKENS) {
    throw new AIGatewayConfigurationError(
      `GEMINI_MAX_OUTPUT_TOKENS must be between 1 and ${APPROVED_GEMINI_MAX_OUTPUT_TOKENS}`,
    );
  }

  const timeoutMs = env.GEMINI_TIMEOUT_MS ?? APPROVED_GEMINI_TIMEOUT_MS;
  if (timeoutMs < 1 || timeoutMs > APPROVED_GEMINI_TIMEOUT_MS) {
    throw new AIGatewayConfigurationError(
      `GEMINI_TIMEOUT_MS must be between 1 and ${APPROVED_GEMINI_TIMEOUT_MS}`,
    );
  }

  if (env.GEMINI_AUTOMATIC_FALLBACK === true) {
    throw new AIGatewayConfigurationError("Automatic provider fallback must be disabled");
  }

  if (env.GEMINI_AUTOMATIC_RETRY === true) {
    throw new AIGatewayConfigurationError("Automatic request retry must be disabled");
  }

  const apiKey = env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw new AIGatewayConfigurationError(
      "GEMINI_API_KEY is required and must not be empty when AI_PROVIDER is gemini",
    );
  }

  return {
    enabled: true,
    provider: "gemini",
    modelId,
    apiVersion,
    maxInputTokens,
    maxOutputTokens,
    timeoutMs,
    apiKey,
  };
}
