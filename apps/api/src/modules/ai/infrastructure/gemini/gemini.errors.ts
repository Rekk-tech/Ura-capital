import {
  AIGatewayError,
  AIGatewayAuthenticationError,
  AIGatewayRateLimitError,
  AIGatewayTimeoutError,
  AIGatewayCancelledError,
  AIGatewayUnavailableError,
  AIGatewayRefusedError,
  AIGatewayConfigurationError,
  sanitizeAIGatewayMessage,
} from "../../core/ai-gateway.errors.js";
import { AI_GATEWAY_ERROR_CODES } from "@aura/shared";
import type { GeminiErrorResponse } from "./gemini.types.js";

/**
 * Maps Gemini HTTP responses and error bodies to the canonical AIGatewayError taxonomy (FR-006, AC-006).
 * All messages are strictly sanitized so credentials, raw tokens, and server URLs are scrubbed (FR-008, AC-008).
 */
export function mapGeminiHttpError(status: number, bodyText: string): AIGatewayError {
  let rawMessage = `Gemini HTTP ${status}`;
  let errorStatus: string | undefined;

  try {
    const parsed = JSON.parse(bodyText) as GeminiErrorResponse;
    if (parsed.error?.message) {
      rawMessage = parsed.error.message;
    }
    if (parsed.error?.status) {
      errorStatus = parsed.error.status;
    }
  } catch {
    // If not JSON, use truncated plain text
    if (bodyText && bodyText.trim().length > 0) {
      rawMessage = bodyText.slice(0, 200);
    }
  }

  const sanitizedMessage = sanitizeAIGatewayMessage(rawMessage);

  // Authentication errors: 401 or 403 or INVALID_ARGUMENT related to API key
  if (
    status === 401 ||
    status === 403 ||
    errorStatus === "UNAUTHENTICATED" ||
    errorStatus === "PERMISSION_DENIED" ||
    sanitizedMessage.toLowerCase().includes("api key") ||
    sanitizedMessage.toLowerCase().includes("invalid_api_key")
  ) {
    return new AIGatewayAuthenticationError(`Gemini authentication failed: ${sanitizedMessage}`);
  }

  // Rate limits / Resource exhausted: 429
  if (status === 429 || errorStatus === "RESOURCE_EXHAUSTED") {
    return new AIGatewayRateLimitError(`Gemini rate limit or quota exceeded: ${sanitizedMessage}`);
  }

  // Content blocked / Safety refusal: 400 with safety or block reason
  if (
    errorStatus === "BLOCKED" ||
    sanitizedMessage.toLowerCase().includes("safety") ||
    sanitizedMessage.toLowerCase().includes("blocked") ||
    sanitizedMessage.toLowerCase().includes("prohibited")
  ) {
    return new AIGatewayRefusedError(
      `Gemini request was refused by safety policy: ${sanitizedMessage}`,
    );
  }

  // Bad Request / Configuration error: 400
  if (status === 400 || errorStatus === "INVALID_ARGUMENT") {
    return new AIGatewayConfigurationError(
      `Gemini bad request or invalid parameter: ${sanitizedMessage}`,
    );
  }

  // Service unavailable / transient upstream: 500, 502, 503, 504
  if (
    status === 500 ||
    status === 502 ||
    status === 503 ||
    status === 504 ||
    errorStatus === "UNAVAILABLE" ||
    errorStatus === "INTERNAL" ||
    errorStatus === "DEADLINE_EXCEEDED"
  ) {
    return new AIGatewayUnavailableError(
      `Gemini service temporarily unavailable (HTTP ${status}): ${sanitizedMessage}`,
    );
  }

  // Fallback unknown gateway error
  return new AIGatewayError(
    `Gemini request failed (HTTP ${status}): ${sanitizedMessage}`,
    AI_GATEWAY_ERROR_CODES.UNKNOWN,
  );
}

/**
 * Maps network or fetch throwables to canonical AIGatewayError (FR-004, FR-006, AC-004, AC-006).
 */
export function mapGeminiNetworkError(err: unknown, executionSignal: AbortSignal): AIGatewayError {
  if (err instanceof AIGatewayError) {
    return err;
  }

  // If the execution context signal was aborted, distinguish timeout vs cancellation
  if (executionSignal.aborted) {
    const reason = executionSignal.reason;
    if (
      reason === "timeout" ||
      (typeof reason === "string" && reason.toLowerCase().includes("timeout"))
    ) {
      return new AIGatewayTimeoutError("Gemini request timed out before response was received");
    }
    return new AIGatewayCancelledError("Gemini request was cancelled by client abort signal");
  }

  const rawMsg = err instanceof Error ? err.message : String(err);
  const sanitizedMsg = sanitizeAIGatewayMessage(rawMsg);

  if (
    sanitizedMsg.toLowerCase().includes("abort") ||
    sanitizedMsg.toLowerCase().includes("cancelled")
  ) {
    return new AIGatewayCancelledError(`Gemini request was cancelled: ${sanitizedMsg}`);
  }

  if (sanitizedMsg.toLowerCase().includes("timeout")) {
    return new AIGatewayTimeoutError(`Gemini request timed out: ${sanitizedMsg}`);
  }

  return new AIGatewayUnavailableError(`Gemini network connection failed: ${sanitizedMsg}`);
}
