import { describe, it, expect } from "vitest";
import {
  AIGatewayService,
  createAIGatewayService,
  AIGatewayTimeoutError,
  AIGatewayCancelledError,
  AIGatewayMalformedResponseError,
  DeterministicFakeLLMProvider,
  MOCK_AI_ACTIVATION_PROOF,
} from "../../../src/modules/ai/index.js";
import type {
  LLMGenerateRequest,
  AIGatewayConfig,
  AITelemetryPort,
} from "../../../src/modules/ai/index.js";
import type { EnvConfig } from "@aura/shared";

describe("FEAT-058 AIGatewayService Contract & Orchestration Tests", () => {
  const sampleConfig: AIGatewayConfig = {
    enabled: true,
    provider: "mock",
    modelId: "mock-model",
    apiVersion: "v1",
    maxInputTokens: 4096,
    maxOutputTokens: 1024,
    timeoutMs: 1000,
    apiKey: null,
  };

  const sampleRequest: LLMGenerateRequest = {
    messages: [
      { role: "system", content: "You are a financial literacy tutor." },
      { role: "user", content: "Explain compound interest." },
    ],
    outputMode: { kind: "TEXT" },
  };

  describe("Generation and Usage Normalization (AC-001, AC-003)", () => {
    it("generates text response using deterministic fake provider", async () => {
      const provider = new DeterministicFakeLLMProvider({
        activationProof: MOCK_AI_ACTIVATION_PROOF,
        defaultTextResponse: "Compound interest is interest earned on interest.",
      });

      const service = new AIGatewayService({
        provider,
        config: sampleConfig,
      });

      const result = await service.generate(sampleRequest);

      expect(result.content).toBe("Compound interest is interest earned on interest.");
      expect(result.providerId).toBe("deterministic-fake");
      expect(result.modelId).toBe("mock-model");
      expect(result.apiVersion).toBe("v1");
      expect(result.usage.inputTokens).toBe(12);
      expect(result.usage.outputTokens).toBe(24);
      expect(result.usage.totalTokens).toBe(36);
    });

    it("generates structured output payload conforming to requested schema (AC-003)", async () => {
      const provider = new DeterministicFakeLLMProvider({
        activationProof: MOCK_AI_ACTIVATION_PROOF,
        defaultStructuredPayload: { answer: "Diversification reduces unsystematic risk" },
      });

      const service = new AIGatewayService({
        provider,
        config: sampleConfig,
      });

      const structuredRequest: LLMGenerateRequest = {
        messages: [{ role: "user", content: "Explain portfolio risk" }],
        outputMode: {
          kind: "STRUCTURED",
          schemaId: "quiz-explanation",
          schemaVersion: "1.0.0",
        },
      };

      const result = await service.generate(structuredRequest);

      expect(result.structuredPayload).toBeDefined();
      expect(result.structuredPayload?.answer).toBe("Diversification reduces unsystematic risk");
      expect(result.structuredPayload?.schemaId).toBe("quiz-explanation");
      expect(result.structuredPayload?.schemaVersion).toBe("1.0.0");
    });

    it("rejects provider response when structured output is requested but payload is missing or invalid", async () => {
      const provider = new DeterministicFakeLLMProvider({
        activationProof: MOCK_AI_ACTIVATION_PROOF,
      });

      // Enqueue malformed result with null structured payload
      provider.enqueueResponse({
        content: "Not JSON",
        structuredPayload: null,
        usage: { inputTokens: 5, outputTokens: 5, totalTokens: 10 },
        providerId: "deterministic-fake",
        modelId: "mock-model",
        apiVersion: "v1",
      });

      const service = new AIGatewayService({
        provider,
        config: sampleConfig,
      });

      await expect(
        service.generate({
          messages: [{ role: "user", content: "Test" }],
          outputMode: {
            kind: "STRUCTURED",
            schemaId: "test-schema",
            schemaVersion: "1.0.0",
          },
        }),
      ).rejects.toThrow(AIGatewayMalformedResponseError);
    });
  });

  describe("Timeout and Cancellation Handling (AC-003)", () => {
    it("enforces timeout deadline and throws AIGatewayTimeoutError", async () => {
      const provider = new DeterministicFakeLLMProvider({
        activationProof: MOCK_AI_ACTIVATION_PROOF,
        simulateDelayMs: 200,
      });

      const service = new AIGatewayService({
        provider,
        config: { ...sampleConfig, timeoutMs: 50 }, // 50ms timeout
      });

      await expect(service.generate(sampleRequest)).rejects.toThrow(AIGatewayTimeoutError);
    });

    it("handles caller cancellation via AbortSignal", async () => {
      const provider = new DeterministicFakeLLMProvider({
        activationProof: MOCK_AI_ACTIVATION_PROOF,
        simulateDelayMs: 200,
      });

      const service = new AIGatewayService({
        provider,
        config: sampleConfig,
      });

      const controller = new AbortController();
      setTimeout(() => controller.abort(), 30);

      await expect(service.generate(sampleRequest, { signal: controller.signal })).rejects.toThrow(
        AIGatewayCancelledError,
      );
    });

    it("rejects immediately if caller signal is already aborted", async () => {
      const provider = new DeterministicFakeLLMProvider({
        activationProof: MOCK_AI_ACTIVATION_PROOF,
      });

      const service = new AIGatewayService({
        provider,
        config: sampleConfig,
      });

      const controller = new AbortController();
      controller.abort();

      await expect(service.generate(sampleRequest, { signal: controller.signal })).rejects.toThrow(
        AIGatewayCancelledError,
      );
    });
  });

  describe("Request Validation and Bounds Enforcement", () => {
    const provider = new DeterministicFakeLLMProvider({
      activationProof: MOCK_AI_ACTIVATION_PROOF,
    });
    const service = new AIGatewayService({ provider, config: sampleConfig });

    it("rejects empty message list", async () => {
      await expect(
        service.generate({ messages: [], outputMode: { kind: "TEXT" } }),
      ).rejects.toThrow("Request must contain at least one message");
    });

    it("rejects empty or whitespace-only message content", async () => {
      await expect(
        service.generate({
          messages: [{ role: "user", content: "   " }],
          outputMode: { kind: "TEXT" },
        }),
      ).rejects.toThrow("Message content must be a non-empty string");
    });

    it("rejects maxTokens exceeding configured maxOutputTokens", async () => {
      await expect(
        service.generate({
          ...sampleRequest,
          maxTokens: 5000, // Config is 1024
        }),
      ).rejects.toThrow("exceeds configured limit");
    });
  });

  describe("Telemetry Port Recording", () => {
    it("records invocation telemetry event without leaking sensitive prompt content", async () => {
      const telemetryEvents: Array<Parameters<AITelemetryPort["recordInvocation"]>[0]> = [];
      const mockTelemetry: AITelemetryPort = {
        recordInvocation: (event) => telemetryEvents.push(event),
      };

      const provider = new DeterministicFakeLLMProvider({
        activationProof: MOCK_AI_ACTIVATION_PROOF,
      });

      const service = new AIGatewayService({
        provider,
        config: sampleConfig,
        telemetry: mockTelemetry,
      });

      await service.generate(sampleRequest);

      expect(telemetryEvents.length).toBe(1);
      const event = telemetryEvents[0];
      expect(event).toBeDefined();
      if (event) {
        expect(event.providerId).toBe("deterministic-fake");
        expect(event.modelId).toBe("mock-model");
        expect(event.success).toBe(true);
        expect(event.durationMs).toBeGreaterThanOrEqual(0);
        expect(event.usage.totalTokens).toBe(36);
        expect(event.errorCode).toBeUndefined();

        // Ensure no prompt or response content is in the telemetry event
        expect("messages" in event).toBe(false);
        expect("content" in event).toBe(false);
      }
    });
  });

  describe("Dependency Injection and Provider Selection (FR-009, AC-009)", () => {
    const baseEnv: EnvConfig = {
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

    it("creates disabled service when AI_ENABLED is false", () => {
      const service = createAIGatewayService(baseEnv);
      expect(service.isAvailable()).toBe(false);
    });

    it("creates service with DeterministicFakeLLMProvider when AI_PROVIDER is mock", () => {
      const service = createAIGatewayService({
        ...baseEnv,
        AI_ENABLED: true,
        AI_PROVIDER: "mock",
      });
      expect(service.isAvailable()).toBe(true);
    });

    it("successfully creates Gemini provider adapter when AI_PROVIDER is gemini (FEAT-059)", () => {
      const service = createAIGatewayService({
        ...baseEnv,
        AI_ENABLED: true,
        AI_PROVIDER: "gemini",
        GEMINI_MODEL_ID: "gemini-3.5-flash-lite",
        GEMINI_API_VERSION: "v1",
        GEMINI_MAX_INPUT_TOKENS: 4096,
        GEMINI_MAX_OUTPUT_TOKENS: 1024,
        GEMINI_TIMEOUT_MS: 15000,
        GEMINI_API_KEY: "test-key",
      });
      expect(service.isAvailable()).toBe(true);
      expect(service.getConfig().provider).toBe("gemini");
      expect(service.getConfig().modelId).toBe("gemini-3.5-flash-lite");
    });
  });
});
