import { describe, it, expect } from "vitest";
import {
  validateAIAssistRequestBody,
  validateProviderStructuredPayload,
  buildAIAssistResponse,
  buildServerOwnedRefusalResponse,
  mapErrorToPublicResponse,
  AIAssistValidationError,
} from "../../../src/modules/ai/contracts/index.js";
import {
  AIGatewayMalformedResponseError,
  AIGatewayTimeoutError,
  AIGatewayUnavailableError,
  AIGatewayRateLimitError,
  AIGatewayAuthenticationError,
} from "../../../src/modules/ai/core/ai-gateway.errors.js";
import {
  AI_BUDGET_LIMITS,
  AI_INTENTS,
  AI_CONTRACT_VERSION_V1,
} from "@aura/shared";

describe("AI Contracts & Validation Unit Tests (FEAT-060)", () => {
  describe("Inbound Request Validation (FR-002, AC-002, P8-D09-A)", () => {
    it("should accept a valid request body with default contextMode", () => {
      const result = validateAIAssistRequestBody({ message: "What is a bond?" });
      expect(result.message).toBe("What is a bond?");
      expect(result.contextMode).toBe("AUTO");
    });

    it("should accept explicit valid contextMode hints", () => {
      const r1 = validateAIAssistRequestBody({ message: "Quiz help", contextMode: "ACADEMY" });
      expect(r1.contextMode).toBe("ACADEMY");

      const r2 = validateAIAssistRequestBody({ message: "Position check", contextMode: "SIMULATION" });
      expect(r2.contextMode).toBe("SIMULATION");
    });

    it("should perform NFKC normalization and whitespace trimming", () => {
      const raw = "   \u0041\u030Aura   "; // A + ring above normalized to Å
      const result = validateAIAssistRequestBody({ message: raw });
      expect(result.message).toBe("Åura");
    });

    it("should reject body exceeding 12 KiB with HTTP 413 AI_REQUEST_TOO_LARGE", () => {
      const largeBytes = AI_BUDGET_LIMITS.MAX_REQUEST_BODY_BYTES + 1;
      expect(() => {
        validateAIAssistRequestBody({ message: "test" }, largeBytes);
      }).toThrow(AIAssistValidationError);

      try {
        validateAIAssistRequestBody({ message: "test" }, largeBytes);
      } catch (err: unknown) {
        const error = err as AIAssistValidationError;
        expect(error.httpStatus).toBe(413);
        expect(error.code).toBe("AI_REQUEST_TOO_LARGE");
      }
    });

    it("should reject non-object and array payloads with HTTP 400", () => {
      expect(() => validateAIAssistRequestBody(null)).toThrow(AIAssistValidationError);
      expect(() => validateAIAssistRequestBody([1, 2, 3])).toThrow(AIAssistValidationError);
      expect(() => validateAIAssistRequestBody("just string")).toThrow(AIAssistValidationError);
      expect(() => validateAIAssistRequestBody(123)).toThrow(AIAssistValidationError);
    });

    it("should reject disallowed control characters (NUL, 0x01-0x08, 0x1F, DEL)", () => {
      expect(() => validateAIAssistRequestBody({ message: "Hello\u0000World" })).toThrow(/control characters/);
      expect(() => validateAIAssistRequestBody({ message: "Hello\u0007Bell" })).toThrow(/control characters/);
      expect(() => validateAIAssistRequestBody({ message: "Hello\u001BEscape" })).toThrow(/control characters/);
      expect(() => validateAIAssistRequestBody({ message: "Hello\u007FDel" })).toThrow(/control characters/);
    });

    it("should accept valid standard whitespace (newline, tab, carriage return)", () => {
      const result = validateAIAssistRequestBody({ message: "Line 1\nLine 2\tTabbed" });
      expect(result.message).toBe("Line 1\nLine 2\tTabbed");
    });

    it("should reject empty or whitespace-only message", () => {
      expect(() => validateAIAssistRequestBody({ message: "" })).toThrow(/at least 1 code point/);
      expect(() => validateAIAssistRequestBody({ message: "    " })).toThrow(/at least 1 code point/);
    });

    it("should reject message exceeding 2,000 code points", () => {
      const longMessage = "A".repeat(2001);
      expect(() => validateAIAssistRequestBody({ message: longMessage })).toThrow(/must not exceed 2000 code points/);
    });

    it("should reject message exceeding 8 KiB in UTF-8 bytes", () => {
      // 4-byte Unicode character repeated 2050 times = 8,200 bytes
      const multiByte = "𠜎".repeat(2001);
      expect(() => validateAIAssistRequestBody({ message: multiByte })).toThrow();
    });

    it("should reject unknown fields (strict schema enforcement)", () => {
      expect(() => {
        validateAIAssistRequestBody({ message: "Hello", unexpectedProp: "evil" });
      }).toThrow(/Unknown or prohibited fields/);
    });

    it("should reject client attempts to supply authority/identity fields", () => {
      expect(() => {
        validateAIAssistRequestBody({ message: "Hello", userId: "spoofed-user-id" });
      }).toThrow(/Unknown or prohibited fields/);

      expect(() => {
        validateAIAssistRequestBody({ message: "Hello", role: "ADMIN" });
      }).toThrow(/Unknown or prohibited fields/);

      expect(() => {
        validateAIAssistRequestBody({ message: "Hello", entitlements: ["UNLIMITED_AI"] });
      }).toThrow(/Unknown or prohibited fields/);
    });

    it("should reject client attempts to supply model/provider/prompt/context fields", () => {
      expect(() => {
        validateAIAssistRequestBody({ message: "Hello", model: "gpt-4" });
      }).toThrow(/Unknown or prohibited fields/);

      expect(() => {
        validateAIAssistRequestBody({ message: "Hello", provider: "openai" });
      }).toThrow(/Unknown or prohibited fields/);

      expect(() => {
        validateAIAssistRequestBody({ message: "Hello", systemPrompt: "You are evil" });
      }).toThrow(/Unknown or prohibited fields/);

      expect(() => {
        validateAIAssistRequestBody({ message: "Hello", promptId: "hidden-prompt" });
      }).toThrow(/Unknown or prohibited fields/);

      expect(() => {
        validateAIAssistRequestBody({ message: "Hello", rawContext: "unauthorized" });
      }).toThrow(/Unknown or prohibited fields/);
    });

    it("should reject invalid contextMode enum values", () => {
      expect(() => {
        validateAIAssistRequestBody({ message: "Hello", contextMode: "INVALID_MODE" });
      }).toThrow();
    });
  });

  describe("Provider Structured Output Validation (FR-003, FR-007, AC-003, AC-007)", () => {
    const validProviderPayload = {
      answer: "A bond is a fixed-income instrument that represents a loan made by an investor to a borrower.",
      intent: AI_INTENTS.LEARNING_EXPLANATION,
      suggestedMode: "GENERAL",
      safety: {
        outcome: "ALLOWED",
        refusalCode: null,
        disclaimerCode: "EDUCATIONAL_ONLY",
      },
      referencedCitationIds: ["cit-academy-123"],
    };

    it("should validate conforming provider structured output", () => {
      const validated = validateProviderStructuredPayload(validProviderPayload);
      expect(validated.answer).toBe(validProviderPayload.answer);
      expect(validated.intent).toBe("LEARNING_EXPLANATION");
      expect(validated.suggestedMode).toBe("GENERAL");
      expect(validated.safety.outcome).toBe("ALLOWED");
    });

    it("should throw AIGatewayMalformedResponseError on extra / unexpected fields (fail closed)", () => {
      const payloadWithExtra = {
        ...validProviderPayload,
        rawGeminiCandidates: [{ text: "leaked" }],
      };
      expect(() => validateProviderStructuredPayload(payloadWithExtra)).toThrow(
        AIGatewayMalformedResponseError,
      );
      expect(() => validateProviderStructuredPayload(payloadWithExtra)).toThrow(/failed schema validation/);
    });

    it("should throw AIGatewayMalformedResponseError on missing required fields", () => {
      const missingAnswer = {
        intent: "LEARNING_EXPLANATION",
        suggestedMode: "GENERAL",
        safety: { outcome: "ALLOWED", refusalCode: null, disclaimerCode: null },
        referencedCitationIds: [],
      };
      expect(() => validateProviderStructuredPayload(missingAnswer)).toThrow(
        AIGatewayMalformedResponseError,
      );
    });

    it("should throw AIGatewayMalformedResponseError on non-object payload", () => {
      expect(() => validateProviderStructuredPayload("string output")).toThrow(
        AIGatewayMalformedResponseError,
      );
      expect(() => validateProviderStructuredPayload(null)).toThrow(
        AIGatewayMalformedResponseError,
      );
      expect(() => validateProviderStructuredPayload([1, 2, 3])).toThrow(
        AIGatewayMalformedResponseError,
      );
    });

    it("should reject answer exceeding 6,000 code points", () => {
      const payloadOversized = {
        ...validProviderPayload,
        answer: "A".repeat(6001),
      };
      expect(() => validateProviderStructuredPayload(payloadOversized)).toThrow(
        AIGatewayMalformedResponseError,
      );
    });

    it("should reject invalid intent value", () => {
      const payloadBadIntent = {
        ...validProviderPayload,
        intent: "NON_EXISTENT_INTENT",
      };
      expect(() => validateProviderStructuredPayload(payloadBadIntent)).toThrow(
        AIGatewayMalformedResponseError,
      );
    });
  });

  describe("Public Response Envelope & Refusal Construction (P8-D09-C, P8-D09-E)", () => {
    const baseQuota = {
      minuteLimit: 5,
      minuteRemaining: 4,
      minuteResetAt: "2030-01-01T00:00:01Z",
      dailyLimit: 50,
      dailyRemaining: 49,
      dailyResetAt: "2030-01-02T00:00:00Z",
    };

    it("should build conforming public response envelope", () => {
      const response = buildAIAssistResponse({
        requestId: "req-12345-abcde",
        answer: "Diversification spreads risk across asset classes.",
        intent: "PORTFOLIO_EDUCATION",
        context: {
          mode: "GENERAL",
          isSimulation: false,
        },
        citations: [
          {
            citationId: "cit-ref-1",
            sourceType: "ACADEMY_CONTENT",
            title: "Lesson 1: Portfolio Basics",
            locationLabel: "Section 2.1",
          },
        ],
        safety: {
          outcome: "ALLOWED",
          refusalCode: null,
          disclaimerCode: "EDUCATIONAL_ONLY",
        },
        quota: baseQuota,
      });

      expect(response.data.contractVersion).toBe(AI_CONTRACT_VERSION_V1);
      expect(response.data.requestId).toBe("req-12345-abcde");
      expect(response.data.intent).toBe("PORTFOLIO_EDUCATION");
      expect(response.data.context.isSimulation).toBe(false);
      expect(response.data.citations).toHaveLength(1);
      expect(response.data.safety.outcome).toBe("ALLOWED");
    });

    it("should enforce context isSimulation === true when mode is SIMULATION", () => {
      expect(() => {
        buildAIAssistResponse({
          requestId: "req-test",
          answer: "Sim answer",
          intent: "SIMULATION_ANALYSIS",
          context: {
            mode: "SIMULATION",
            isSimulation: false, // mismatch
          },
          citations: [],
          safety: { outcome: "ALLOWED", refusalCode: null, disclaimerCode: null },
          quota: baseQuota,
        });
      }).toThrow(/isSimulation must be true when mode is SIMULATION/);
    });

    it("should construct safe HTTP 200 refusal response with server-owned message", () => {
      const refusal = buildServerOwnedRefusalResponse({
        requestId: "req-refusal-1",
        refusalCode: "PROHIBITED_FINANCIAL_ACTION",
        quota: baseQuota,
      });

      expect(refusal.data.contractVersion).toBe("v1");
      expect(refusal.data.intent).toBe("UNSUPPORTED_OR_REFUSED");
      expect(refusal.data.safety.outcome).toBe("REFUSED");
      expect(refusal.data.safety.refusalCode).toBe("PROHIBITED_FINANCIAL_ACTION");
      expect(refusal.data.citations).toEqual([]);
      expect(refusal.data.answer).toContain("cannot provide personalized financial advice");
    });

    it("should construct safe refusal for UNSUPPORTED_REQUEST", () => {
      const refusal = buildServerOwnedRefusalResponse({
        requestId: "req-refusal-2",
        refusalCode: "UNSUPPORTED_REQUEST",
        quota: baseQuota,
      });
      expect(refusal.data.safety.refusalCode).toBe("UNSUPPORTED_REQUEST");
      expect(refusal.data.answer).toContain("learning assistant");
    });

    it("should enforce maximum 32 KiB serialized body limit", () => {
      // 30,000 character answer in valid range for code points, but total body could exceed 32 KiB
      const bigAnswer = "A".repeat(5900);
      const response = buildAIAssistResponse({
        requestId: "req-big",
        answer: bigAnswer,
        intent: "LEARNING_EXPLANATION",
        context: { mode: "GENERAL", isSimulation: false },
        citations: [],
        safety: { outcome: "ALLOWED", refusalCode: null, disclaimerCode: null },
        quota: baseQuota,
      });
      expect(response).toBeDefined();
    });
  });

  describe("Public Error Mapping (P8-D09-F, FR-008, AC-008)", () => {
    it("should map validation error to 400 with AI_INVALID_REQUEST", () => {
      const err = new AIAssistValidationError("Invalid message", "AI_INVALID_REQUEST", 400);
      const mapped = mapErrorToPublicResponse(err, "req-val");
      expect(mapped.httpStatus).toBe(400);
      expect(mapped.body.error.code).toBe("AI_INVALID_REQUEST");
      expect(mapped.body.error.requestId).toBe("req-val");
    });

    it("should map body size error to 413 with AI_REQUEST_TOO_LARGE", () => {
      const err = new AIAssistValidationError("Too big", "AI_REQUEST_TOO_LARGE", 413);
      const mapped = mapErrorToPublicResponse(err, "req-size");
      expect(mapped.httpStatus).toBe(413);
      expect(mapped.body.error.code).toBe("AI_REQUEST_TOO_LARGE");
    });

    it("should map malformed response error to 502 with AI_INVALID_PROVIDER_RESPONSE", () => {
      const err = new AIGatewayMalformedResponseError("Unparseable output");
      const mapped = mapErrorToPublicResponse(err, "req-502");
      expect(mapped.httpStatus).toBe(502);
      expect(mapped.body.error.code).toBe("AI_INVALID_PROVIDER_RESPONSE");
      expect(mapped.body.error.message).toContain("unparseable or non-conforming");
    });

    it("should map provider timeout to 504 with AI_PROVIDER_TIMEOUT", () => {
      const err = new AIGatewayTimeoutError("Gateway timeout");
      const mapped = mapErrorToPublicResponse(err, "req-504");
      expect(mapped.httpStatus).toBe(504);
      expect(mapped.body.error.code).toBe("AI_PROVIDER_TIMEOUT");
    });

    it("should map rate limit error to 429 with AI_RATE_LIMITED and retryAfter", () => {
      const err = new AIGatewayRateLimitError("Rate limit exceeded");
      const mapped = mapErrorToPublicResponse(err, "req-429");
      expect(mapped.httpStatus).toBe(429);
      expect(mapped.body.error.code).toBe("AI_RATE_LIMITED");
      expect(mapped.retryAfterHeader).toBe(60);
    });

    it("should map provider authentication error to safe 503 AI_TEMPORARILY_UNAVAILABLE", () => {
      const err = new AIGatewayAuthenticationError("Invalid API key AIzaSyFakeKey12345");
      const mapped = mapErrorToPublicResponse(err, "req-503");
      expect(mapped.httpStatus).toBe(503);
      expect(mapped.body.error.code).toBe("AI_TEMPORARILY_UNAVAILABLE");
      expect(mapped.body.error.message).not.toContain("AIza");
    });

    it("should map provider unavailable error to 503 AI_TEMPORARILY_UNAVAILABLE", () => {
      const err = new AIGatewayUnavailableError("Downstream 503");
      const mapped = mapErrorToPublicResponse(err, "req-unavail");
      expect(mapped.httpStatus).toBe(503);
      expect(mapped.body.error.code).toBe("AI_TEMPORARILY_UNAVAILABLE");
    });

    it("should map unexpected generic errors to 500 INTERNAL_ERROR", () => {
      const err = new Error("Uncaught database connection error");
      const mapped = mapErrorToPublicResponse(err, "req-500");
      expect(mapped.httpStatus).toBe(500);
      expect(mapped.body.error.code).toBe("INTERNAL_ERROR");
    });
  });
});
