/**
 * Phase 8 AI Intelligence Constants (FEAT-060)
 *
 * Implements the approved closed intent catalog (P8-D08), API contract (P8-D09),
 * and educational safety policies (P8-D10).
 */

export const AI_INTENTS = {
  LEARNING_EXPLANATION: "LEARNING_EXPLANATION",
  ACADEMY_GUIDANCE: "ACADEMY_GUIDANCE",
  SIMULATION_ANALYSIS: "SIMULATION_ANALYSIS",
  PORTFOLIO_EDUCATION: "PORTFOLIO_EDUCATION",
  UNSUPPORTED_OR_REFUSED: "UNSUPPORTED_OR_REFUSED",
} as const;

export type AIIntent = (typeof AI_INTENTS)[keyof typeof AI_INTENTS];

export const APPROVED_AI_INTENTS: readonly AIIntent[] = Object.values(AI_INTENTS);

export const AI_REQUEST_CONTEXT_MODES = {
  AUTO: "AUTO",
  ACADEMY: "ACADEMY",
  SIMULATION: "SIMULATION",
} as const;

export type AIRequestContextMode =
  (typeof AI_REQUEST_CONTEXT_MODES)[keyof typeof AI_REQUEST_CONTEXT_MODES];

export const APPROVED_AI_REQUEST_CONTEXT_MODES: readonly AIRequestContextMode[] =
  Object.values(AI_REQUEST_CONTEXT_MODES);

export const AI_RESPONSE_CONTEXT_MODES = {
  GENERAL: "GENERAL",
  ACADEMY: "ACADEMY",
  SIMULATION: "SIMULATION",
} as const;

export type AIResponseContextMode =
  (typeof AI_RESPONSE_CONTEXT_MODES)[keyof typeof AI_RESPONSE_CONTEXT_MODES];

export const AI_CITATION_SOURCE_TYPES = {
  ACADEMY_CONTENT: "ACADEMY_CONTENT",
  SIMULATION_CONTEXT: "SIMULATION_CONTEXT",
} as const;

export type AICitationSourceType =
  (typeof AI_CITATION_SOURCE_TYPES)[keyof typeof AI_CITATION_SOURCE_TYPES];

export const AI_SAFETY_OUTCOMES = {
  ALLOWED: "ALLOWED",
  REFUSED: "REFUSED",
} as const;

export type AISafetyOutcome =
  (typeof AI_SAFETY_OUTCOMES)[keyof typeof AI_SAFETY_OUTCOMES];

export const AI_REFUSAL_CODES = {
  UNSUPPORTED_REQUEST: "UNSUPPORTED_REQUEST",
  PROHIBITED_FINANCIAL_ACTION: "PROHIBITED_FINANCIAL_ACTION",
  INSUFFICIENT_SAFE_CONTEXT: "INSUFFICIENT_SAFE_CONTEXT",
  SAFETY_POLICY: "SAFETY_POLICY",
} as const;

export type AIRefusalCode =
  (typeof AI_REFUSAL_CODES)[keyof typeof AI_REFUSAL_CODES];

export const APPROVED_AI_REFUSAL_CODES: readonly AIRefusalCode[] =
  Object.values(AI_REFUSAL_CODES);

export const AI_DISCLAIMER_CODES = {
  EDUCATIONAL_ONLY: "EDUCATIONAL_ONLY",
  SIMULATION_ONLY: "SIMULATION_ONLY",
} as const;

export type AIDisclaimerCode =
  (typeof AI_DISCLAIMER_CODES)[keyof typeof AI_DISCLAIMER_CODES];

export const APPROVED_AI_DISCLAIMER_CODES: readonly AIDisclaimerCode[] =
  Object.values(AI_DISCLAIMER_CODES);

export const AI_HTTP_ERROR_CODES = {
  AI_INVALID_REQUEST: "AI_INVALID_REQUEST",
  AUTHENTICATION_REQUIRED: "AUTHENTICATION_REQUIRED",
  AI_REQUEST_TOO_LARGE: "AI_REQUEST_TOO_LARGE",
  UNSUPPORTED_MEDIA_TYPE: "UNSUPPORTED_MEDIA_TYPE",
  AI_RATE_LIMITED: "AI_RATE_LIMITED",
  AI_DAILY_QUOTA_EXHAUSTED: "AI_DAILY_QUOTA_EXHAUSTED",
  AI_CONCURRENCY_LIMITED: "AI_CONCURRENCY_LIMITED",
  AI_INVALID_PROVIDER_RESPONSE: "AI_INVALID_PROVIDER_RESPONSE",
  AI_TEMPORARILY_UNAVAILABLE: "AI_TEMPORARILY_UNAVAILABLE",
  AI_PROVIDER_TIMEOUT: "AI_PROVIDER_TIMEOUT",
  INTERNAL_ERROR: "INTERNAL_ERROR",
} as const;

export type AIHttpErrorCode =
  (typeof AI_HTTP_ERROR_CODES)[keyof typeof AI_HTTP_ERROR_CODES];

export const AI_BUDGET_LIMITS = {
  /** Maximum encoded request body: 12 KiB */
  MAX_REQUEST_BODY_BYTES: 12288,
  /** Minimum message length in code points: 1 */
  MIN_MESSAGE_CODE_POINTS: 1,
  /** Maximum message length in code points: 2,000 */
  MAX_MESSAGE_CODE_POINTS: 2000,
  /** Maximum message UTF-8 size: 8 KiB */
  MAX_MESSAGE_UTF8_BYTES: 8192,
  /** Minimum answer length in code points: 1 */
  MIN_ANSWER_CODE_POINTS: 1,
  /** Maximum answer length in code points: 6,000 */
  MAX_ANSWER_CODE_POINTS: 6000,
  /** Maximum answer UTF-8 size: 24 KiB */
  MAX_ANSWER_UTF8_BYTES: 24576,
  /** Maximum complete success response body size: 32 KiB */
  MAX_RESPONSE_BODY_BYTES: 32768,
  /** Maximum context item size: 2 KiB */
  MAX_CONTEXT_ITEM_BYTES: 2048,
  /** Maximum context contributed per adapter: 8 KiB */
  MAX_ADAPTER_CONTEXT_BYTES: 8192,
  /** Maximum retrieval items count: 5 */
  MAX_RETRIEVAL_ITEMS: 5,
  /** Maximum retrieval content size: 8 KiB */
  MAX_RETRIEVAL_BYTES: 8192,
  /** Maximum combined context and retrieval size: 16 KiB */
  MAX_AGGREGATE_CONTEXT_BYTES: 16384,
  /** Maximum aggregate estimated context tokens: 4,096 */
  MAX_AGGREGATE_CONTEXT_TOKENS: 4096,
  /** Maximum number of citations: 5 */
  MAX_CITATIONS: 5,
  /** Maximum citation ID length: 128 safe ASCII chars */
  MAX_CITATION_ID_LENGTH: 128,
  /** Maximum citation title length in code points: 160 */
  MAX_CITATION_TITLE_CODE_POINTS: 160,
  /** Maximum citation title UTF-8 bytes: 640 */
  MAX_CITATION_TITLE_BYTES: 640,
  /** Maximum location label length in code points: 160 */
  MAX_LOCATION_LABEL_CODE_POINTS: 160,
  /** Maximum location label UTF-8 bytes: 640 */
  MAX_LOCATION_LABEL_BYTES: 640,
  /** Maximum request ID length: 128 safe ASCII chars */
  MAX_REQUEST_ID_LENGTH: 128,
} as const;

/** Canonical contract version for Phase 8 assistant */
export const AI_CONTRACT_VERSION_V1 = "v1" as const;
