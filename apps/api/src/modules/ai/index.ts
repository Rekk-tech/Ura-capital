// Core provider-independent LLM contracts and ports (FR-003, AC-003)
export type {
  LLMProvider,
  LLMGenerateRequest,
  LLMMessagePart,
  LLMMessageRole,
  LLMOutputMode,
  LLMExecutionContext,
  LLMTokenUsage,
  LLMProviderResult,
  AIContextResolverPort,
  AIRetrievalPort,
  AIQuotaPort,
  AIClockPort,
  AITelemetryPort,
} from "./core/llm-provider.types.js";

export { MOCK_AI_ACTIVATION_PROOF } from "./core/llm-provider.types.js";

// Closed normalized error taxonomy and sanitization (FR-006, AC-006)
export {
  AIGatewayError,
  AIGatewayConfigurationError,
  AIGatewayAuthenticationError,
  AIGatewayRateLimitError,
  AIGatewayTimeoutError,
  AIGatewayCancelledError,
  AIGatewayUnavailableError,
  AIGatewayRefusedError,
  AIGatewayMalformedResponseError,
  sanitizeAIGatewayMessage,
} from "./core/ai-gateway.errors.js";

// Gateway configuration and environment classification (FR-002, FR-004, AC-002, AC-004)
export type { AIGatewayConfig } from "./core/ai-gateway.config.js";

export {
  validateAIGatewayConfig,
  isApprovedFakeEnvironment,
  isProductionLikeEnvironment,
  getMockActivationProof,
} from "./core/ai-gateway.config.js";

// Gateway service orchestrator and DI factory (FR-001, FR-009, AC-001, AC-009)
export type {
  AIGatewayServiceOptions,
  CreateAIGatewayServiceOptions,
} from "./core/ai-gateway.service.js";

export { AIGatewayService, createAIGatewayService } from "./core/ai-gateway.service.js";

// Deterministic test double for local/test/CI verification (FR-004, FR-009, AC-004, AC-009)
export type { DeterministicFakeProviderOptions } from "./test-doubles/deterministic-fake-llm-provider.js";

export { DeterministicFakeLLMProvider } from "./test-doubles/deterministic-fake-llm-provider.js";

// Isolated Gemini development adapter (FR-001, FR-002, AC-001, AC-002)
export type { GeminiAdapterOptions } from "./infrastructure/gemini/index.js";
export {
  GeminiAdapter,
  registerStructuredSchema,
  getRegisteredSchema,
  validateStructuredPayload,
} from "./infrastructure/gemini/index.js";
export type { SchemaValidationRule } from "./infrastructure/gemini/index.js";
