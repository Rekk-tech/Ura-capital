import {
  AIAssistRequestSchema,
  AI_BUDGET_LIMITS,
  type AIAssistRequest,
  countUtf8Bytes,
} from "@aura/shared";

export class AIAssistValidationError extends Error {
  readonly code: string;
  readonly httpStatus: number;

  constructor(message: string, code = "AI_INVALID_REQUEST", httpStatus = 400) {
    super(message);
    this.name = "AIAssistValidationError";
    this.code = code;
    this.httpStatus = httpStatus;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Validates inbound request body for POST /api/ai/assist (FR-002, AC-002, P8-D09-A).
 * Enforces:
 * - 12 KiB maximum body size (413 AI_REQUEST_TOO_LARGE)
 * - Strict JSON object structure (400 AI_INVALID_REQUEST)
 * - Exact { message, contextMode? } schema with no extra or authority-bearing fields
 * - NFKC normalization, code-point (1..2,000) and byte (<= 8 KiB) limits
 * - Disallowed control character rejection
 */
export function validateAIAssistRequestBody(
  rawBody: unknown,
  rawByteLength?: number,
): AIAssistRequest {
  if (
    rawByteLength !== undefined &&
    rawByteLength > AI_BUDGET_LIMITS.MAX_REQUEST_BODY_BYTES
  ) {
    throw new AIAssistValidationError(
      `Request body exceeds maximum size of ${AI_BUDGET_LIMITS.MAX_REQUEST_BODY_BYTES} bytes (got ${rawByteLength})`,
      "AI_REQUEST_TOO_LARGE",
      413,
    );
  }

  if (typeof rawBody === "string") {
    const bytes = countUtf8Bytes(rawBody);
    if (bytes > AI_BUDGET_LIMITS.MAX_REQUEST_BODY_BYTES) {
      throw new AIAssistValidationError(
        `Request body exceeds maximum size of ${AI_BUDGET_LIMITS.MAX_REQUEST_BODY_BYTES} bytes`,
        "AI_REQUEST_TOO_LARGE",
        413,
      );
    }
    try {
      rawBody = JSON.parse(rawBody);
    } catch {
      throw new AIAssistValidationError(
        "Request body must be valid JSON",
        "AI_INVALID_REQUEST",
        400,
      );
    }
  }

  if (!rawBody || typeof rawBody !== "object" || Array.isArray(rawBody)) {
    throw new AIAssistValidationError(
      "Request body must be a JSON object",
      "AI_INVALID_REQUEST",
      400,
    );
  }

  const parseResult = AIAssistRequestSchema.safeParse(rawBody);
  if (!parseResult.success) {
    const issue = parseResult.error.issues[0];
    const message = issue ? `${issue.path.join(".")}: ${issue.message}` : "Validation failed";
    throw new AIAssistValidationError(
      message.startsWith(": ") ? message.slice(2) : message,
      "AI_INVALID_REQUEST",
      400,
    );
  }

  return parseResult.data;
}
