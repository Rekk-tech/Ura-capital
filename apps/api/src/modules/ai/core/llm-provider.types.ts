import type { AIGatewayErrorCode } from "@aura/shared";

/**
 * Symbol guard required to activate deterministic mock/fake LLM infrastructure.
 * Cannot be created or forged outside approved environment predicates.
 */
export const MOCK_AI_ACTIVATION_PROOF = Symbol("safe-mock-ai-activation-proof");

/**
 * Message roles supported by the provider-neutral AI gateway.
 */
export type LLMMessageRole = "system" | "user" | "assistant";

/**
 * Canonical server-owned message part. No SDK types permitted.
 */
export interface LLMMessagePart {
  readonly role: LLMMessageRole;
  readonly content: string;
}

/**
 * Generation output modes.
 * - TEXT: Plain unstructured textual response.
 * - STRUCTURED: Strict structured JSON payload adhering to the specified schema contract.
 */
export type LLMOutputMode =
  | { readonly kind: "TEXT" }
  | { readonly kind: "STRUCTURED"; readonly schemaId: string; readonly schemaVersion: string };

/**
 * Bounded execution context passed to LLMProvider on each request.
 * Contains effective deadline/timeout in milliseconds and an AbortSignal.
 */
export interface LLMExecutionContext {
  readonly timeoutMs: number;
  readonly signal: AbortSignal;
}

/**
 * Normalized token usage across provider responses.
 */
export interface LLMTokenUsage {
  readonly inputTokens: number | null;
  readonly outputTokens: number | null;
  readonly totalTokens: number | null;
}

/**
 * Canonical generation request. Contains strictly server-owned prompt parts,
 * output mode, and optional execution parameters.
 */
export interface LLMGenerateRequest {
  readonly messages: readonly LLMMessagePart[];
  readonly outputMode: LLMOutputMode;
  readonly maxTokens?: number;
  readonly temperature?: number;
}

/**
 * Canonical provider response. Free of any vendor SDK objects.
 */
export interface LLMProviderResult {
  readonly content: string;
  readonly structuredPayload?: Record<string, unknown> | null;
  readonly usage: LLMTokenUsage;
  readonly providerId: string;
  readonly modelId: string;
  readonly apiVersion: string;
}

/**
 * Provider-independent LLMProvider port.
 * Adapters (e.g. Gemini in FEAT-059, test doubles in FEAT-058) implement this interface.
 * No SDK types may escape the adapter boundary.
 */
export interface LLMProvider {
  readonly providerId: string;
  generate(request: LLMGenerateRequest, execution: LLMExecutionContext): Promise<LLMProviderResult>;
}

// ---------------------------------------------------------------------------
// Distinct ports for future AI capability integration (FR-003, AC-003)
// ---------------------------------------------------------------------------

/**
 * Port for resolving user and session context before prompt assembly (FEAT-060+).
 */
export interface AIContextResolverPort {
  resolveContext(userId: string, contextId: string): Promise<Record<string, unknown>>;
}

/**
 * Port for retrieving relevant curriculum/grounding materials (FEAT-061+).
 */
export interface AIRetrievalPort {
  retrieve(query: string, filter?: Record<string, unknown>): Promise<readonly unknown[]>;
}

/**
 * Port for validating and tracking user quota budgets (FEAT-062+).
 */
export interface AIQuotaPort {
  checkQuota(userId: string): Promise<{ readonly allowed: boolean; readonly remaining: number }>;
  consumeQuota(userId: string, tokens: number): Promise<void>;
}

/**
 * Port for deterministic time access across timeouts and metrics.
 */
export interface AIClockPort {
  now(): Date;
  nowMs(): number;
}

/**
 * Port for recording invocation metrics without exposing sensitive prompt or response data.
 */
export interface AITelemetryPort {
  recordInvocation(event: {
    readonly providerId: string;
    readonly modelId: string;
    readonly durationMs: number;
    readonly usage: LLMTokenUsage;
    readonly success: boolean;
    readonly errorCode?: AIGatewayErrorCode;
  }): void;
}
