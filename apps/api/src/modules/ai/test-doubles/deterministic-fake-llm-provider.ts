import type {
  LLMProvider,
  LLMGenerateRequest,
  LLMExecutionContext,
  LLMProviderResult,
  LLMTokenUsage,
} from "../core/llm-provider.types.js";
import { MOCK_AI_ACTIVATION_PROOF } from "../core/llm-provider.types.js";
import { AIGatewayConfigurationError, AIGatewayCancelledError } from "../core/ai-gateway.errors.js";

export interface DeterministicFakeProviderOptions {
  readonly activationProof: symbol;
  defaultTextResponse?: string;
  defaultStructuredPayload?: Record<string, unknown>;
  defaultUsage?: LLMTokenUsage;
  simulateDelayMs?: number;
  simulateError?: Error | null;
}

export class DeterministicFakeLLMProvider implements LLMProvider {
  readonly providerId = "deterministic-fake";
  readonly modelId = "mock-model";
  readonly apiVersion = "v1";

  private defaultTextResponse: string;
  private defaultStructuredPayload: Record<string, unknown>;
  private defaultUsage: LLMTokenUsage;
  private simulateDelayMs: number;
  private simulateError: Error | null;
  private responseQueue: LLMProviderResult[] = [];
  public invocationCount = 0;
  public lastRequest: LLMGenerateRequest | null = null;

  constructor(options: DeterministicFakeProviderOptions) {
    if (options.activationProof !== MOCK_AI_ACTIVATION_PROOF) {
      throw new AIGatewayConfigurationError(
        "Prohibited activation: DeterministicFakeLLMProvider requires valid activation proof",
      );
    }

    this.defaultTextResponse = options.defaultTextResponse ?? "Deterministic mock text response";
    this.defaultStructuredPayload = options.defaultStructuredPayload ?? {
      status: "success",
      mockResult: true,
    };
    this.defaultUsage = options.defaultUsage ?? {
      inputTokens: 12,
      outputTokens: 24,
      totalTokens: 36,
    };
    this.simulateDelayMs = options.simulateDelayMs ?? 0;
    this.simulateError = options.simulateError ?? null;
  }

  enqueueResponse(response: LLMProviderResult): void {
    this.responseQueue.push(response);
  }

  setSimulatedError(error: Error | null): void {
    this.simulateError = error;
  }

  setSimulateDelayMs(delayMs: number): void {
    this.simulateDelayMs = delayMs;
  }

  reset(): void {
    this.responseQueue = [];
    this.invocationCount = 0;
    this.lastRequest = null;
    this.simulateError = null;
    this.simulateDelayMs = 0;
  }

  async generate(
    request: LLMGenerateRequest,
    execution: LLMExecutionContext,
  ): Promise<LLMProviderResult> {
    this.invocationCount++;
    this.lastRequest = request;

    // Check cancellation immediately
    if (execution.signal.aborted) {
      throw new AIGatewayCancelledError("Request was cancelled before execution");
    }

    // Handle simulated delay with cancellation listener
    if (this.simulateDelayMs > 0) {
      await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(() => {
          execution.signal.removeEventListener("abort", onAbort);
          resolve();
        }, this.simulateDelayMs);

        const onAbort = () => {
          clearTimeout(timer);
          execution.signal.removeEventListener("abort", onAbort);
          reject(new AIGatewayCancelledError("Execution aborted during delay"));
        };

        execution.signal.addEventListener("abort", onAbort, { once: true });
      });
    }

    if (this.simulateError) {
      throw this.simulateError;
    }

    if (this.responseQueue.length > 0) {
      return this.responseQueue.shift()!;
    }

    if (request.outputMode.kind === "STRUCTURED") {
      const payload = {
        ...this.defaultStructuredPayload,
        schemaId: request.outputMode.schemaId,
        schemaVersion: request.outputMode.schemaVersion,
      };
      return {
        content: JSON.stringify(payload),
        structuredPayload: payload,
        usage: { ...this.defaultUsage },
        providerId: this.providerId,
        modelId: this.modelId,
        apiVersion: this.apiVersion,
      };
    }

    return {
      content: this.defaultTextResponse,
      usage: { ...this.defaultUsage },
      providerId: this.providerId,
      modelId: this.modelId,
      apiVersion: this.apiVersion,
    };
  }
}
