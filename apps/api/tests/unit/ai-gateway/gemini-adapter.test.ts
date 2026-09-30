import { describe, it, expect, vi } from "vitest";
import { GeminiAdapter } from "../../../src/modules/ai/infrastructure/gemini/index.js";
import {
  AIGatewayAuthenticationError,
  AIGatewayRateLimitError,
  AIGatewayTimeoutError,
  AIGatewayCancelledError,
  AIGatewayUnavailableError,
  AIGatewayRefusedError,
  AIGatewayMalformedResponseError,
  AIGatewayConfigurationError,
} from "../../../src/modules/ai/core/ai-gateway.errors.js";
import type { AIGatewayConfig } from "../../../src/modules/ai/core/ai-gateway.config.js";
import type {
  LLMGenerateRequest,
  LLMExecutionContext,
} from "../../../src/modules/ai/core/llm-provider.types.js";

describe("GeminiAdapter Unit Tests (FEAT-059)", () => {
  const baseConfig: AIGatewayConfig = {
    enabled: true,
    provider: "gemini",
    modelId: "gemini-3.5-flash-lite",
    apiVersion: "v1",
    maxInputTokens: 4096,
    maxOutputTokens: 1024,
    timeoutMs: 15000,
    apiKey: "test-gemini-dev-key-12345",
  };

  const dummyContext: LLMExecutionContext = {
    timeoutMs: 15000,
    signal: new AbortController().signal,
  };

  const simpleRequest: LLMGenerateRequest = {
    messages: [
      { role: "system", content: "You are a helpful assistant." },
      { role: "user", content: "Hello Gemini" },
    ],
    outputMode: { kind: "TEXT" },
  };

  describe("1. Configuration and Credential Boundaries (AC-001, AC-003)", () => {
    it("conforms to LLMProvider port with providerId 'gemini'", () => {
      const adapter = new GeminiAdapter({ config: baseConfig });
      expect(adapter.providerId).toBe("gemini");
      expect(typeof adapter.generate).toBe("function");
    });

    it("fails closed at instantiation if GEMINI_API_KEY is missing or empty", () => {
      expect(
        () => new GeminiAdapter({ config: { ...baseConfig, apiKey: undefined } }),
      ).toThrow(AIGatewayConfigurationError);

      expect(
        () => new GeminiAdapter({ config: { ...baseConfig, apiKey: "   " } }),
      ).toThrow(AIGatewayConfigurationError);
    });
  });

  describe("2. Plain Text Generation & Usage Normalization (AC-001, AC-007)", () => {
    it("successfully generates content and normalizes token usage", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () =>
          JSON.stringify({
            candidates: [
              {
                content: {
                  parts: [{ text: "Hello! How can I assist you today?" }],
                  role: "model",
                },
                finishReason: "STOP",
              },
            ],
            usageMetadata: {
              promptTokenCount: 15,
              candidatesTokenCount: 22,
              totalTokenCount: 37,
              serviceTier: "standard",
            },
          }),
      });

      const adapter = new GeminiAdapter({
        config: baseConfig,
        fetchFn: mockFetch as unknown as typeof fetch,
      });

      const result = await adapter.generate(simpleRequest, dummyContext);

      expect(result.content).toBe("Hello! How can I assist you today?");
      expect(result.providerId).toBe("gemini");
      expect(result.modelId).toBe("gemini-3.5-flash-lite");
      expect(result.apiVersion).toBe("v1");
      expect(result.structuredPayload).toBeNull();
      expect(result.usage).toEqual({
        inputTokens: 15,
        outputTokens: 22,
        totalTokens: 37,
      });

      // Verify request payload sent to Gemini API
      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [calledUrl, calledInit] = mockFetch.mock.calls[0];
      expect(calledUrl).toContain("models/gemini-3.5-flash-lite:generateContent");
      expect(calledInit.headers["x-goog-api-key"]).toBe("test-gemini-dev-key-12345");

      const body = JSON.parse(calledInit.body);
      expect(body.systemInstruction.parts[0].text).toBe("You are a helpful assistant.");
      expect(body.contents).toHaveLength(1);
      expect(body.contents[0].role).toBe("user");
      expect(body.contents[0].parts[0].text).toBe("Hello Gemini");
      expect(body.generationConfig.maxOutputTokens).toBe(1024);
    });

    it("caps maxTokens to internal development budget", async () => {
      let capturedBody: string | undefined;
      const mockFetch = vi.fn().mockImplementation((_url, init) => {
        capturedBody = init.body;
        return Promise.resolve({
          ok: true,
          status: 200,
          text: async () =>
            JSON.stringify({
              candidates: [{ content: { parts: [{ text: "OK" }] }, finishReason: "STOP" }],
            }),
        });
      });

      const adapter = new GeminiAdapter({
        config: baseConfig,
        fetchFn: mockFetch as unknown as typeof fetch,
      });

      // Request asks for 8000 tokens, but config limit is 1024
      await adapter.generate(
        { ...simpleRequest, maxTokens: 8000 },
        dummyContext,
      );

      const parsed = JSON.parse(capturedBody!);
      expect(parsed.generationConfig.maxOutputTokens).toBe(1024);
    });
  });

  describe("3. Structured Output & Schema Validation (AC-001, AC-010, Section 6)", () => {
    const structuredRequest: LLMGenerateRequest = {
      messages: [{ role: "user", content: "Generate test status" }],
      outputMode: {
        kind: "STRUCTURED",
        schemaId: "test-structured-schema",
        schemaVersion: "1.0",
      },
    };

    it("successfully validates and returns conforming structured JSON", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () =>
          JSON.stringify({
            candidates: [
              {
                content: {
                  parts: [{ text: JSON.stringify({ status: "success", code: 200 }) }],
                },
                finishReason: "STOP",
              },
            ],
            usageMetadata: { promptTokenCount: 10, candidatesTokenCount: 8, totalTokenCount: 18 },
          }),
      });

      const adapter = new GeminiAdapter({
        config: baseConfig,
        fetchFn: mockFetch as unknown as typeof fetch,
      });

      const result = await adapter.generate(structuredRequest, dummyContext);

      expect(result.structuredPayload).toEqual({ status: "success", code: 200 });
      expect(result.content).toBe(JSON.stringify({ status: "success", code: 200 }));
    });

    it("rejects non-JSON structured response with AIGatewayMalformedResponseError", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () =>
          JSON.stringify({
            candidates: [
              {
                content: { parts: [{ text: "This is definitely not JSON!" }] },
                finishReason: "STOP",
              },
            ],
          }),
      });

      const adapter = new GeminiAdapter({
        config: baseConfig,
        fetchFn: mockFetch as unknown as typeof fetch,
      });

      await expect(adapter.generate(structuredRequest, dummyContext)).rejects.toThrow(
        AIGatewayMalformedResponseError,
      );
    });

    it("rejects empty structured response with AIGatewayMalformedResponseError", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () =>
          JSON.stringify({
            candidates: [
              {
                content: { parts: [{ text: "   " }] },
                finishReason: "STOP",
              },
            ],
          }),
      });

      const adapter = new GeminiAdapter({
        config: baseConfig,
        fetchFn: mockFetch as unknown as typeof fetch,
      });

      await expect(adapter.generate(structuredRequest, dummyContext)).rejects.toThrow(
        AIGatewayMalformedResponseError,
      );
    });

    it("rejects missing required fields with AIGatewayMalformedResponseError", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () =>
          JSON.stringify({
            candidates: [
              {
                // Missing required 'code' field
                content: { parts: [{ text: JSON.stringify({ status: "partial" }) }] },
                finishReason: "STOP",
              },
            ],
          }),
      });

      const adapter = new GeminiAdapter({
        config: baseConfig,
        fetchFn: mockFetch as unknown as typeof fetch,
      });

      await expect(adapter.generate(structuredRequest, dummyContext)).rejects.toThrow(
        /violated schema.*code/,
      );
    });

    it("rejects unexpected extra properties with AIGatewayMalformedResponseError", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () =>
          JSON.stringify({
            candidates: [
              {
                // Injected unauthorized property
                content: {
                  parts: [
                    {
                      text: JSON.stringify({
                        status: "ok",
                        code: 200,
                        injectedAdminToken: "ATTACKER_INJECTION",
                      }),
                    },
                  ],
                },
                finishReason: "STOP",
              },
            ],
          }),
      });

      const adapter = new GeminiAdapter({
        config: baseConfig,
        fetchFn: mockFetch as unknown as typeof fetch,
      });

      await expect(adapter.generate(structuredRequest, dummyContext)).rejects.toThrow(
        /Unexpected property 'injectedAdminToken'/,
      );
    });

    it("detects truncation when finishReason is MAX_TOKENS on structured output (Section 7)", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () =>
          JSON.stringify({
            candidates: [
              {
                // Incomplete JSON fragment truncated by token ceiling
                content: { parts: [{ text: '{"status": "truncat' }] },
                finishReason: "MAX_TOKENS",
              },
            ],
          }),
      });

      const adapter = new GeminiAdapter({
        config: baseConfig,
        fetchFn: mockFetch as unknown as typeof fetch,
      });

      await expect(adapter.generate(structuredRequest, dummyContext)).rejects.toThrow(
        /truncated due to output token limit/,
      );
    });
  });

  describe("4. Error Taxonomy & Sanitization (AC-006, AC-008)", () => {
    it("maps HTTP 401/403 to AIGatewayAuthenticationError and sanitizes key", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        text: async () =>
          JSON.stringify({
            error: {
              code: 401,
              message: "API key test-gemini-dev-key-12345 is invalid",
              status: "UNAUTHENTICATED",
            },
          }),
      });

      const adapter = new GeminiAdapter({
        config: baseConfig,
        fetchFn: mockFetch as unknown as typeof fetch,
      });

      let caughtError: unknown;
      try {
        await adapter.generate(simpleRequest, dummyContext);
      } catch (err) {
        caughtError = err;
      }

      expect(caughtError).toBeInstanceOf(AIGatewayAuthenticationError);
      expect((caughtError as Error).message).not.toContain("test-gemini-dev-key-12345");
      expect((caughtError as Error).message).toContain("[REDACTED_API_KEY]");
    });

    it("maps HTTP 429 to AIGatewayRateLimitError", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        text: async () =>
          JSON.stringify({
            error: {
              code: 429,
              message: "Resource has been exhausted (quota exceeded)",
              status: "RESOURCE_EXHAUSTED",
            },
          }),
      });

      const adapter = new GeminiAdapter({
        config: baseConfig,
        fetchFn: mockFetch as unknown as typeof fetch,
      });

      await expect(adapter.generate(simpleRequest, dummyContext)).rejects.toThrow(
        AIGatewayRateLimitError,
      );
    });

    it("maps HTTP 500/503 to AIGatewayUnavailableError", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
        text: async () =>
          JSON.stringify({
            error: {
              code: 503,
              message: "The model is overloaded. Please try again later.",
              status: "UNAVAILABLE",
            },
          }),
      });

      const adapter = new GeminiAdapter({
        config: baseConfig,
        fetchFn: mockFetch as unknown as typeof fetch,
      });

      await expect(adapter.generate(simpleRequest, dummyContext)).rejects.toThrow(
        AIGatewayUnavailableError,
      );
    });

    it("maps safety refusal (prompt block) to AIGatewayRefusedError", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () =>
          JSON.stringify({
            promptFeedback: {
              blockReason: "SAFETY",
            },
          }),
      });

      const adapter = new GeminiAdapter({
        config: baseConfig,
        fetchFn: mockFetch as unknown as typeof fetch,
      });

      await expect(adapter.generate(simpleRequest, dummyContext)).rejects.toThrow(
        AIGatewayRefusedError,
      );
    });

    it("maps finishReason SAFETY to AIGatewayRefusedError", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () =>
          JSON.stringify({
            candidates: [
              {
                content: { parts: [{ text: "" }] },
                finishReason: "SAFETY",
              },
            ],
          }),
      });

      const adapter = new GeminiAdapter({
        config: baseConfig,
        fetchFn: mockFetch as unknown as typeof fetch,
      });

      await expect(adapter.generate(simpleRequest, dummyContext)).rejects.toThrow(
        AIGatewayRefusedError,
      );
    });

    it("maps zero candidate completions to AIGatewayMalformedResponseError", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ candidates: [] }),
      });

      const adapter = new GeminiAdapter({
        config: baseConfig,
        fetchFn: mockFetch as unknown as typeof fetch,
      });

      await expect(adapter.generate(simpleRequest, dummyContext)).rejects.toThrow(
        AIGatewayMalformedResponseError,
      );
    });
  });

  describe("5. Timeout & Cancellation Handling (AC-004, Section 7)", () => {
    it("fails immediately if execution signal was aborted prior to invocation", async () => {
      const abortController = new AbortController();
      abortController.abort("user_cancelled");

      const adapter = new GeminiAdapter({ config: baseConfig });

      await expect(
        adapter.generate(simpleRequest, {
          timeoutMs: 15000,
          signal: abortController.signal,
        }),
      ).rejects.toThrow(AIGatewayCancelledError);
    });

    it("maps AbortError with timeout reason to AIGatewayTimeoutError", async () => {
      const abortController = new AbortController();
      const mockFetch = vi.fn().mockImplementation(() => {
        abortController.abort("timeout");
        const abortErr = new Error("The operation was aborted");
        abortErr.name = "AbortError";
        return Promise.reject(abortErr);
      });

      const adapter = new GeminiAdapter({
        config: baseConfig,
        fetchFn: mockFetch as unknown as typeof fetch,
      });

      await expect(
        adapter.generate(simpleRequest, {
          timeoutMs: 15000,
          signal: abortController.signal,
        }),
      ).rejects.toThrow(AIGatewayTimeoutError);
    });

    it("maps AbortError with client cancel to AIGatewayCancelledError", async () => {
      const abortController = new AbortController();
      const mockFetch = vi.fn().mockImplementation(() => {
        abortController.abort();
        const abortErr = new Error("The user aborted a request.");
        abortErr.name = "AbortError";
        return Promise.reject(abortErr);
      });

      const adapter = new GeminiAdapter({
        config: baseConfig,
        fetchFn: mockFetch as unknown as typeof fetch,
      });

      await expect(
        adapter.generate(simpleRequest, {
          timeoutMs: 15000,
          signal: abortController.signal,
        }),
      ).rejects.toThrow(AIGatewayCancelledError);
    });
  });

  describe("6. Ambiguous-Call No-Retry Policy (AC-005, Section 7)", () => {
    it("never retries a failed or ambiguous call automatically", async () => {
      let callCount = 0;
      const mockFetch = vi.fn().mockImplementation(() => {
        callCount++;
        return Promise.reject(new Error("Network connection dropped mid-transfer"));
      });

      const adapter = new GeminiAdapter({
        config: baseConfig,
        fetchFn: mockFetch as unknown as typeof fetch,
      });

      await expect(adapter.generate(simpleRequest, dummyContext)).rejects.toThrow(
        AIGatewayUnavailableError,
      );

      // Must be called exactly once; NO automatic retry loop
      expect(callCount).toBe(1);
    });
  });
});
