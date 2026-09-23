import type { EnvConfig } from "@aura/shared";
import { AI_GATEWAY_ERROR_CODES } from "@aura/shared";
import type {
  LLMProvider,
  LLMGenerateRequest,
  LLMExecutionContext,
  LLMProviderResult,
  LLMTokenUsage,
  AIClockPort,
  AITelemetryPort,
} from "./llm-provider.types.js";
import {
  AIGatewayError,
  AIGatewayConfigurationError,
  AIGatewayTimeoutError,
  AIGatewayCancelledError,
  AIGatewayMalformedResponseError,
  sanitizeAIGatewayMessage,
} from "./ai-gateway.errors.js";
import type { AIGatewayConfig } from "./ai-gateway.config.js";
import { validateAIGatewayConfig, getMockActivationProof } from "./ai-gateway.config.js";
import { DeterministicFakeLLMProvider } from "../test-doubles/deterministic-fake-llm-provider.js";

export interface AIGatewayServiceOptions {
  readonly provider: LLMProvider | null;
  readonly config: AIGatewayConfig;
  readonly clock?: AIClockPort;
  readonly telemetry?: AITelemetryPort;
}

export class AIGatewayService {
  private readonly provider: LLMProvider | null;
  private readonly config: AIGatewayConfig;
  private readonly clock: AIClockPort;
  private readonly telemetry?: AITelemetryPort;

  constructor(options: AIGatewayServiceOptions) {
    this.provider = options.provider;
    this.config = options.config;
    this.clock = options.clock ?? {
      now: () => new Date(),
      nowMs: () => Date.now(),
    };
    this.telemetry = options.telemetry;
  }

  isAvailable(): boolean {
    return this.config.enabled && this.provider !== null;
  }

  getConfig(): AIGatewayConfig {
    return { ...this.config };
  }

  async generate(
    request: LLMGenerateRequest,
    options?: { timeoutMs?: number; signal?: AbortSignal },
  ): Promise<LLMProviderResult> {
    if (!this.config.enabled) {
      throw new AIGatewayConfigurationError("AI Gateway is disabled");
    }

    if (!this.provider) {
      throw new AIGatewayConfigurationError("No AI provider adapter is available for generation");
    }

    // 1. Request validation
    this.validateRequest(request);

    // 2. Timeout and Cancellation Orchestration (FR-003, AC-002, AC-003)
    const effectiveTimeoutMs = Math.min(
      options?.timeoutMs ?? this.config.timeoutMs,
      this.config.timeoutMs,
    );

    const abortController = new AbortController();
    let isTimeout = false;

    // Link caller's signal
    const callerSignal = options?.signal;
    if (callerSignal?.aborted) {
      throw new AIGatewayCancelledError("Generation request was cancelled before start");
    }

    const onCallerAbort = () => {
      abortController.abort();
    };

    if (callerSignal) {
      callerSignal.addEventListener("abort", onCallerAbort, { once: true });
    }

    const timeoutHandle = setTimeout(() => {
      isTimeout = true;
      abortController.abort();
    }, effectiveTimeoutMs);

    const executionContext: LLMExecutionContext = {
      timeoutMs: effectiveTimeoutMs,
      signal: abortController.signal,
    };

    const startTime = this.clock.nowMs();
    let success = false;
    let errorCode: (typeof AI_GATEWAY_ERROR_CODES)[keyof typeof AI_GATEWAY_ERROR_CODES] =
      AI_GATEWAY_ERROR_CODES.UNKNOWN;
    let capturedUsage: LLMTokenUsage = {
      inputTokens: null,
      outputTokens: null,
      totalTokens: null,
    };

    try {
      const rawResult = await this.provider.generate(request, executionContext);

      // Validate structured output if requested
      if (request.outputMode.kind === "STRUCTURED") {
        if (!rawResult.structuredPayload || typeof rawResult.structuredPayload !== "object") {
          throw new AIGatewayMalformedResponseError(
            `Structured output requested for schema '${request.outputMode.schemaId}' but provider returned non-object payload`,
          );
        }
      }

      // Usage normalization (FR-003, AC-003)
      const normalizedUsage: LLMTokenUsage = {
        inputTokens:
          typeof rawResult.usage?.inputTokens === "number" && rawResult.usage.inputTokens >= 0
            ? rawResult.usage.inputTokens
            : null,
        outputTokens:
          typeof rawResult.usage?.outputTokens === "number" && rawResult.usage.outputTokens >= 0
            ? rawResult.usage.outputTokens
            : null,
        totalTokens:
          typeof rawResult.usage?.totalTokens === "number" && rawResult.usage.totalTokens >= 0
            ? rawResult.usage.totalTokens
            : typeof rawResult.usage?.inputTokens === "number" &&
                typeof rawResult.usage?.outputTokens === "number"
              ? rawResult.usage.inputTokens + rawResult.usage.outputTokens
              : null,
      };

      capturedUsage = normalizedUsage;
      success = true;

      return {
        content: rawResult.content,
        structuredPayload: rawResult.structuredPayload ?? null,
        usage: normalizedUsage,
        providerId: rawResult.providerId,
        modelId: rawResult.modelId,
        apiVersion: rawResult.apiVersion,
      };
    } catch (err: unknown) {
      if (isTimeout) {
        errorCode = AI_GATEWAY_ERROR_CODES.TIMEOUT;
        throw new AIGatewayTimeoutError(`AI generation timed out after ${effectiveTimeoutMs}ms`);
      }

      if (callerSignal?.aborted) {
        errorCode = AI_GATEWAY_ERROR_CODES.CANCELLED;
        throw new AIGatewayCancelledError("AI generation was cancelled by caller");
      }

      if (err instanceof AIGatewayError) {
        errorCode = err.code;
        throw err;
      }

      // Map unknown error safely into closed taxonomy
      const rawMessage = err instanceof Error ? err.message : String(err);
      errorCode = AI_GATEWAY_ERROR_CODES.UNKNOWN;
      throw new AIGatewayError(
        sanitizeAIGatewayMessage(rawMessage),
        AI_GATEWAY_ERROR_CODES.UNKNOWN,
      );
    } finally {
      clearTimeout(timeoutHandle);
      if (callerSignal) {
        callerSignal.removeEventListener("abort", onCallerAbort);
      }

      const durationMs = Math.max(0, this.clock.nowMs() - startTime);
      this.telemetry?.recordInvocation({
        providerId: this.provider.providerId,
        modelId: this.config.modelId ?? "unknown",
        durationMs,
        usage: capturedUsage,
        success,
        errorCode: success ? undefined : errorCode,
      });
    }
  }

  private validateRequest(request: LLMGenerateRequest): void {
    if (!request || !Array.isArray(request.messages) || request.messages.length === 0) {
      throw new AIGatewayError(
        "Request must contain at least one message",
        AI_GATEWAY_ERROR_CODES.CONFIGURATION_ERROR,
      );
    }

    for (const msg of request.messages) {
      if (!msg.content || typeof msg.content !== "string" || msg.content.trim() === "") {
        throw new AIGatewayError(
          "Message content must be a non-empty string",
          AI_GATEWAY_ERROR_CODES.CONFIGURATION_ERROR,
        );
      }
      if (msg.role !== "system" && msg.role !== "user" && msg.role !== "assistant") {
        throw new AIGatewayError(
          `Invalid message role: '${msg.role}'`,
          AI_GATEWAY_ERROR_CODES.CONFIGURATION_ERROR,
        );
      }
    }

    if (
      request.maxTokens !== undefined &&
      (request.maxTokens < 1 || request.maxTokens > this.config.maxOutputTokens)
    ) {
      throw new AIGatewayError(
        `Requested maxTokens (${request.maxTokens}) exceeds configured limit (${this.config.maxOutputTokens})`,
        AI_GATEWAY_ERROR_CODES.CONFIGURATION_ERROR,
      );
    }

    if (request.outputMode.kind === "STRUCTURED") {
      if (!request.outputMode.schemaId || !request.outputMode.schemaVersion) {
        throw new AIGatewayError(
          "Structured output mode requires schemaId and schemaVersion",
          AI_GATEWAY_ERROR_CODES.CONFIGURATION_ERROR,
        );
      }
    }
  }
}

export interface CreateAIGatewayServiceOptions {
  readonly provider?: LLMProvider;
  readonly clock?: AIClockPort;
  readonly telemetry?: AITelemetryPort;
}

/**
 * Dependency Injection factory for AIGatewayService (FR-009, AC-009).
 * Fails closed if unknown provider, automatic fallback, or production activation is detected.
 */
export function createAIGatewayService(
  env: EnvConfig,
  overrides?: CreateAIGatewayServiceOptions,
): AIGatewayService {
  const config = validateAIGatewayConfig(env);

  if (!config.enabled) {
    return new AIGatewayService({
      provider: null,
      config,
      clock: overrides?.clock,
      telemetry: overrides?.telemetry,
    });
  }

  // If a provider was explicitly injected (e.g. for testing)
  if (overrides?.provider) {
    return new AIGatewayService({
      provider: overrides.provider,
      config,
      clock: overrides?.clock,
      telemetry: overrides?.telemetry,
    });
  }

  if (config.provider === "mock") {
    const activationProof = getMockActivationProof({ nodeEnv: env.NODE_ENV });
    const fakeProvider = new DeterministicFakeLLMProvider({
      activationProof,
    });
    return new AIGatewayService({
      provider: fakeProvider,
      config,
      clock: overrides?.clock,
      telemetry: overrides?.telemetry,
    });
  }

  if (config.provider === "gemini") {
    // FEAT-058 Scope Boundary: Gemini adapter is NOT implemented in FEAT-058 (owned by FEAT-059)
    throw new AIGatewayConfigurationError(
      "Gemini provider adapter is pending implementation in FEAT-059",
    );
  }

  throw new AIGatewayConfigurationError(`Unsupported provider selection: '${config.provider}'`);
}
