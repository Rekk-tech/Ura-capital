import {
  AIAssistResponseSchema,
  AIAssistProviderStructuredPayloadSchema,
  AI_BUDGET_LIMITS,
  AI_CONTRACT_VERSION_V1,
  AI_SAFETY_OUTCOMES,
  type AIAssistResponse,
  type AIAssistProviderStructuredPayload,
  type AICallContextDto,
  type AICitationDto,
  type AISafetyDto,
  type AIQuotaDto,
  type AIIntent,
  type AIRefusalCode,
  type AIDisclaimerCode,
  type AIResponseContextMode,
  countUtf8Bytes,
} from "@aura/shared";
import { AIGatewayMalformedResponseError } from "../core/ai-gateway.errors.js";

export interface BuildAIAssistResponseParams {
  readonly requestId: string;
  readonly answer: string;
  readonly intent: AIIntent;
  readonly context: AICallContextDto;
  readonly citations: readonly AICitationDto[];
  readonly safety: AISafetyDto;
  readonly quota: AIQuotaDto;
}

export interface BuildServerOwnedRefusalParams {
  readonly requestId: string;
  readonly refusalCode: AIRefusalCode;
  readonly disclaimerCode?: AIDisclaimerCode | null;
  readonly customMessage?: string;
  readonly quota: AIQuotaDto;
  readonly contextMode?: AIResponseContextMode;
}

const SERVER_OWNED_REFUSAL_MESSAGES: Record<AIRefusalCode, string> = {
  UNSUPPORTED_REQUEST:
    "I am your Aura Capital learning assistant. I can help explain financial and market concepts, guide you through Academy lessons, or analyze your simulated portfolio. I cannot help with requests outside this scope.",
  PROHIBITED_FINANCIAL_ACTION:
    "Aura Capital AI provides educational guidance only. I cannot provide personalized financial advice, execute real financial transactions, recommend live trades, or manage real money.",
  INSUFFICIENT_SAFE_CONTEXT:
    "I could not locate sufficient verified Academy or simulation context to answer your question accurately and safely.",
  SAFETY_POLICY:
    "Your request cannot be processed as it conflicts with Aura Capital safety and acceptable use policies.",
};

/**
 * Validates the raw structured payload returned by an LLMProvider (FR-003, FR-007, AC-003, AC-007).
 * Strictly rejects:
 * - Non-JSON or array payloads
 * - Unknown or extra properties
 * - Provider-specific internals or metadata
 * - Length and byte violations
 * Never coerces or repairs malformed output into success.
 */
export function validateProviderStructuredPayload(
  payload: unknown,
): AIAssistProviderStructuredPayload {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new AIGatewayMalformedResponseError(
      "Provider structured output must be a non-null JSON object",
    );
  }

  const result = AIAssistProviderStructuredPayloadSchema.safeParse(payload);
  if (!result.success) {
    const issue = result.error.issues[0];
    const details = issue ? `${issue.path.join(".")}: ${issue.message}` : "Validation failed";
    throw new AIGatewayMalformedResponseError(
      `Provider structured output failed schema validation: ${details}`,
    );
  }

  return result.data;
}

/**
 * Assembles and strictly validates the canonical public response envelope (P8-D09-C, FR-003).
 * Enforces maximum 32 KiB serialized body limit.
 */
export function buildAIAssistResponse(params: BuildAIAssistResponseParams): AIAssistResponse {
  const candidate = {
    data: {
      contractVersion: AI_CONTRACT_VERSION_V1,
      requestId: params.requestId,
      answer: params.answer,
      intent: params.intent,
      context: params.context,
      citations: [...params.citations],
      safety: params.safety,
      quota: params.quota,
    },
  };

  const validation = AIAssistResponseSchema.safeParse(candidate);
  if (!validation.success) {
    const issue = validation.error.issues[0];
    throw new AIGatewayMalformedResponseError(
      `Public response envelope validation failed: ${issue?.message ?? "Invalid shape"}`,
    );
  }

  // Enforce 32 KiB total response body limit
  const serialized = JSON.stringify(validation.data);
  const totalBytes = countUtf8Bytes(serialized);
  if (totalBytes > AI_BUDGET_LIMITS.MAX_RESPONSE_BODY_BYTES) {
    throw new AIGatewayMalformedResponseError(
      `Response body exceeds maximum size of ${AI_BUDGET_LIMITS.MAX_RESPONSE_BODY_BYTES} bytes (got ${totalBytes})`,
    );
  }

  return validation.data;
}

/**
 * Builds a server-owned HTTP 200 refusal response according to P8-D09-E (FR-008, AC-008).
 * Never exposes raw provider refusal or fabricated citations.
 */
export function buildServerOwnedRefusalResponse(
  params: BuildServerOwnedRefusalParams,
): AIAssistResponse {
  const mode = params.contextMode ?? "GENERAL";
  const answer =
    params.customMessage?.trim() || SERVER_OWNED_REFUSAL_MESSAGES[params.refusalCode];

  return buildAIAssistResponse({
    requestId: params.requestId,
    answer,
    intent: "UNSUPPORTED_OR_REFUSED",
    context: {
      mode,
      isSimulation: mode === "SIMULATION",
    },
    citations: [],
    safety: {
      outcome: AI_SAFETY_OUTCOMES.REFUSED,
      refusalCode: params.refusalCode,
      disclaimerCode: params.disclaimerCode ?? "EDUCATIONAL_ONLY",
    },
    quota: params.quota,
  });
}
