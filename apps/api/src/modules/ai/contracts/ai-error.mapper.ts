import {
  AI_HTTP_ERROR_CODES,
  type AIHttpErrorCode,
} from "@aura/shared";
import {
  AIGatewayMalformedResponseError,
  AIGatewayTimeoutError,
  AIGatewayUnavailableError,
  AIGatewayRateLimitError,
  AIGatewayAuthenticationError,
  AIGatewayConfigurationError,
  sanitizeAIGatewayMessage,
} from "../core/ai-gateway.errors.js";
import { AIAssistValidationError } from "./ai-request.validator.js";

export interface SafeErrorResponse {
  readonly httpStatus: number;
  readonly body: {
    readonly error: {
      readonly message: string;
      readonly code: AIHttpErrorCode;
      readonly requestId: string;
    };
  };
  readonly retryAfterHeader?: number;
}

/**
 * Maps any internal error to the safe, provider-neutral public error envelope (P8-D09-F, FR-008, AC-008).
 * Ensures zero secret, provider payload, prompt, or sensitive infrastructure leakage.
 */
export function mapErrorToPublicResponse(
  error: unknown,
  fallbackRequestId = "req-ai-error",
): SafeErrorResponse {
  const requestId = fallbackRequestId;

  // 1. Inbound validation error (400 / 413)
  if (error instanceof AIAssistValidationError) {
    const code =
      error.code === "AI_REQUEST_TOO_LARGE"
        ? AI_HTTP_ERROR_CODES.AI_REQUEST_TOO_LARGE
        : AI_HTTP_ERROR_CODES.AI_INVALID_REQUEST;

    return {
      httpStatus: error.httpStatus,
      body: {
        error: {
          message: sanitizeAIGatewayMessage(error.message),
          code,
          requestId,
        },
      },
    };
  }

  // 2. Provider structured response violation (502)
  if (error instanceof AIGatewayMalformedResponseError) {
    return {
      httpStatus: 502,
      body: {
        error: {
          message: "The AI service returned an unparseable or non-conforming response",
          code: AI_HTTP_ERROR_CODES.AI_INVALID_PROVIDER_RESPONSE,
          requestId,
        },
      },
    };
  }

  // 3. Provider timeout (504)
  if (error instanceof AIGatewayTimeoutError) {
    return {
      httpStatus: 504,
      body: {
        error: {
          message: "The AI request timed out before completion",
          code: AI_HTTP_ERROR_CODES.AI_PROVIDER_TIMEOUT,
          requestId,
        },
      },
    };
  }

  // 4. Rate limit / Quota exceeded (429)
  if (error instanceof AIGatewayRateLimitError) {
    return {
      httpStatus: 429,
      body: {
        error: {
          message: "AI request rate limit exceeded. Please try again later.",
          code: AI_HTTP_ERROR_CODES.AI_RATE_LIMITED,
          requestId,
        },
      },
      retryAfterHeader: 60,
    };
  }

  // 5. Provider / service unavailable or misconfigured (503)
  if (
    error instanceof AIGatewayUnavailableError ||
    error instanceof AIGatewayAuthenticationError ||
    error instanceof AIGatewayConfigurationError
  ) {
    return {
      httpStatus: 503,
      body: {
        error: {
          message: "AI service is temporarily unavailable. Please try again later.",
          code: AI_HTTP_ERROR_CODES.AI_TEMPORARILY_UNAVAILABLE,
          requestId,
        },
      },
    };
  }

  // 6. Generic or gateway error (500)
  const rawMessage = error instanceof Error ? error.message : "An unexpected internal error occurred";
  return {
    httpStatus: 500,
    body: {
      error: {
        message: sanitizeAIGatewayMessage(rawMessage),
        code: AI_HTTP_ERROR_CODES.INTERNAL_ERROR,
        requestId,
      },
    },
  };
}
