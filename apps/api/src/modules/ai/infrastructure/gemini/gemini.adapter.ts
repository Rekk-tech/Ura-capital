import type {
  LLMProvider,
  LLMGenerateRequest,
  LLMExecutionContext,
  LLMProviderResult,
  LLMTokenUsage,
} from "../../core/llm-provider.types.js";
import {
  AIGatewayConfigurationError,
  AIGatewayMalformedResponseError,
  AIGatewayRefusedError,
} from "../../core/ai-gateway.errors.js";
import type { AIGatewayConfig } from "../../core/ai-gateway.config.js";
import type {
  GeminiGenerateContentRequest,
  GeminiGenerateContentResponse,
  GeminiContent,
  GeminiGenerationConfig,
} from "./gemini.types.js";
import { mapGeminiHttpError, mapGeminiNetworkError } from "./gemini.errors.js";
import { getRegisteredSchema, validateStructuredPayload } from "./gemini.schema-validator.js";

export interface GeminiAdapterOptions {
  readonly config: AIGatewayConfig;
  readonly fetchFn?: typeof fetch;
  readonly baseUrl?: string;
}

/**
 * Isolated Gemini Development Adapter conforming to LLMProvider port (FR-001, FR-002, AC-001, AC-002).
 * Zero Gemini SDK types escape this adapter boundary.
 */
export class GeminiAdapter implements LLMProvider {
  readonly providerId = "gemini";
  private readonly config: AIGatewayConfig;
  private readonly fetchFn: typeof fetch;
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly modelId: string;
  private readonly apiVersion: string;

  constructor(options: GeminiAdapterOptions) {
    this.config = options.config;
    this.fetchFn = options.fetchFn ?? globalThis.fetch;

    if (!this.config.apiKey || this.config.apiKey.trim() === "") {
      throw new AIGatewayConfigurationError(
        "GEMINI_API_KEY is required and must not be empty for GeminiAdapter",
      );
    }
    if (!this.config.modelId) {
      throw new AIGatewayConfigurationError(
        "GEMINI_MODEL_ID is required for GeminiAdapter",
      );
    }
    if (!this.config.apiVersion) {
      throw new AIGatewayConfigurationError(
        "GEMINI_API_VERSION is required for GeminiAdapter",
      );
    }

    this.apiKey = this.config.apiKey.trim();
    this.modelId = this.config.modelId;
    this.apiVersion = this.config.apiVersion;

    this.baseUrl =
      options.baseUrl ??
      `https://generativelanguage.googleapis.com/${this.apiVersion}`;
  }

  async generate(
    request: LLMGenerateRequest,
    execution: LLMExecutionContext,
  ): Promise<LLMProviderResult> {
    if (execution.signal.aborted) {
      throw mapGeminiNetworkError(new Error("Request aborted"), execution.signal);
    }

    // 1. Build request payload
    const payload = this.buildRequestPayload(request);

    // 2. Build URL and headers (use x-goog-api-key and URL key)
    const url = `${this.baseUrl}/models/${this.modelId}:generateContent?key=${this.apiKey}`;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "x-goog-api-key": this.apiKey,
    };

    let response: Response;
    try {
      response = await this.fetchFn(url, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
        signal: execution.signal,
      });
    } catch (err: unknown) {
      // Automatic retry is strictly DISABLED (FR-005, AC-005)
      throw mapGeminiNetworkError(err, execution.signal);
    }

    // 3. Handle non-2xx HTTP errors
    if (!response.ok) {
      let errBody = "";
      try {
        errBody = await response.text();
      } catch {
        // Ignore read error on error body
      }
      if (this.apiKey) {
        errBody = errBody.replaceAll(this.apiKey, "[REDACTED_API_KEY]");
      }
      throw mapGeminiHttpError(response.status, errBody);
    }

    // 4. Parse JSON response
    let responseText = "";
    let data: GeminiGenerateContentResponse;
    try {
      responseText = await response.text();
      data = JSON.parse(responseText) as GeminiGenerateContentResponse;
    } catch {
      throw new AIGatewayMalformedResponseError(
        "Gemini returned non-JSON or unparseable response body",
      );
    }

    // 5. Inspect candidates and block reasons
    if (data.promptFeedback?.blockReason) {
      throw new AIGatewayRefusedError(
        `Gemini blocked prompt: ${data.promptFeedback.blockReason}`,
      );
    }

    const candidate = data.candidates?.[0];
    if (!candidate) {
      throw new AIGatewayMalformedResponseError(
        "Gemini response contained zero candidate completions",
      );
    }

    // Check finish reason
    const finishReason = candidate.finishReason;
    if (finishReason === "SAFETY" || finishReason === "BLOCKLIST" || finishReason === "PROHIBITED_CONTENT") {
      throw new AIGatewayRefusedError(
        `Gemini candidate was refused due to finishReason '${finishReason}'`,
      );
    }

    // Truncation detection (Section 7)
    if (finishReason === "MAX_TOKENS" && request.outputMode.kind === "STRUCTURED") {
      throw new AIGatewayMalformedResponseError(
        "Structured output was truncated due to output token limit (finishReason: MAX_TOKENS)",
      );
    }

    // 6. Extract generated content text
    const textParts = candidate.content?.parts?.map((p) => p.text ?? "").filter(Boolean) ?? [];
    const content = textParts.join("");

    // 7. Structured output validation (Section 6)
    let structuredPayload: Record<string, unknown> | null = null;
    if (request.outputMode.kind === "STRUCTURED") {
      if (!content || content.trim() === "") {
        throw new AIGatewayMalformedResponseError(
          "Gemini returned empty text for structured output request",
        );
      }

      let parsedJson: unknown;
      try {
        parsedJson = JSON.parse(content);
      } catch {
        throw new AIGatewayMalformedResponseError(
          "Gemini structured output could not be parsed as JSON",
        );
      }

      structuredPayload = validateStructuredPayload(
        parsedJson,
        request.outputMode.schemaId,
      );
    }

    // 8. Normalize token usage (FR-007, AC-007)
    const usage = this.normalizeUsage(data.usageMetadata);

    return {
      content,
      structuredPayload,
      usage,
      providerId: this.providerId,
      modelId: this.modelId,
      apiVersion: this.apiVersion,
    };
  }

  private buildRequestPayload(request: LLMGenerateRequest): GeminiGenerateContentRequest {
    const contents: GeminiContent[] = [];
    let systemText: string | undefined;

    for (const msg of request.messages) {
      if (msg.role === "system") {
        systemText = systemText ? `${systemText}\n\n${msg.content}` : msg.content;
      } else {
        contents.push({
          role: msg.role === "assistant" ? "model" : "user",
          parts: [{ text: msg.content }],
        });
      }
    }

    // If no non-system messages, Gemini requires at least one user part
    if (contents.length === 0) {
      contents.push({
        role: "user",
        parts: [{ text: "" }],
      });
    }

    // Bounded maxOutputTokens (bounded by config limit)
    const effectiveMaxOutputTokens = Math.min(
      request.maxTokens ?? this.config.maxOutputTokens,
      this.config.maxOutputTokens,
    );

    const generationConfig: GeminiGenerationConfig = {
      maxOutputTokens: effectiveMaxOutputTokens,
      temperature:
        request.temperature !== undefined
          ? Math.max(0, Math.min(2, request.temperature))
          : 0.0,
    };

    if (request.outputMode.kind === "STRUCTURED") {
      const registered = getRegisteredSchema(request.outputMode.schemaId);
      if (registered) {
        Object.assign(generationConfig, {
          responseMimeType: "application/json",
          responseSchema: registered.geminiSchema,
        });
      } else {
        Object.assign(generationConfig, {
          responseMimeType: "application/json",
        });
      }
    }

    const payload: GeminiGenerateContentRequest = {
      contents,
      generationConfig,
      ...(systemText
        ? {
            systemInstruction: {
              parts: [{ text: systemText }],
            },
          }
        : {}),
    };

    return payload;
  }

  private normalizeUsage(meta?: GeminiGenerateContentResponse["usageMetadata"]): LLMTokenUsage {
    if (!meta) {
      return {
        inputTokens: null,
        outputTokens: null,
        totalTokens: null,
      };
    }

    const inputTokens = typeof meta.promptTokenCount === "number" ? meta.promptTokenCount : null;
    const outputTokens =
      typeof meta.candidatesTokenCount === "number" ? meta.candidatesTokenCount : null;
    const totalTokens =
      typeof meta.totalTokenCount === "number"
        ? meta.totalTokenCount
        : inputTokens !== null && outputTokens !== null
          ? inputTokens + outputTokens
          : null;

    return {
      inputTokens,
      outputTokens,
      totalTokens,
    };
  }
}
