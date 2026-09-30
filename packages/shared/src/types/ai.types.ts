import { z } from "zod";
import {
  AIAssistRequestSchema,
  AICallContextDtoSchema,
  AICitationDtoSchema,
  AISafetyDtoSchema,
  AIQuotaDtoSchema,
  AIAssistDataDtoSchema,
  AIAssistResponseSchema,
  AIAssistProviderStructuredPayloadSchema,
} from "../schemas/ai.schemas.js";
import type {
  AIIntent,
  AIRequestContextMode,
  AIResponseContextMode,
  AICitationSourceType,
  AISafetyOutcome,
  AIRefusalCode,
  AIDisclaimerCode,
} from "../constants/ai.constants.js";

/** Inferred Request DTO */
export type AIAssistRequest = z.infer<typeof AIAssistRequestSchema>;

/** Inferred Context DTO */
export type AICallContextDto = z.infer<typeof AICallContextDtoSchema>;

/** Inferred Citation DTO */
export type AICitationDto = z.infer<typeof AICitationDtoSchema>;

/** Inferred Safety DTO */
export type AISafetyDto = z.infer<typeof AISafetyDtoSchema>;

/** Inferred Quota DTO */
export type AIQuotaDto = z.infer<typeof AIQuotaDtoSchema>;

/** Inferred Assist Data DTO */
export type AIAssistDataDto = z.infer<typeof AIAssistDataDtoSchema>;

/** Inferred Public Response Envelope */
export type AIAssistResponse = z.infer<typeof AIAssistResponseSchema>;

/** Inferred LLMProvider Structured Output Payload */
export type AIAssistProviderStructuredPayload = z.infer<
  typeof AIAssistProviderStructuredPayloadSchema
>;

/**
 * Server-owned context item provided by domain context adapters.
 */
export interface AIContextItem {
  readonly id: string;
  readonly source: string;
  readonly content: string;
  readonly byteSize: number;
}

/**
 * Retrieval item returned by lexical/RAG retrieval foundation.
 */
export interface AIRetrievalItem {
  readonly citationId: string;
  readonly sourceType: AICitationSourceType;
  readonly title: string;
  readonly locationLabel: string | null;
  readonly snippet: string;
  readonly byteSize: number;
}

/**
 * Result of user context resolution and budgeting.
 */
export interface AIResolvedContextEnvelope {
  readonly mode: AIResponseContextMode;
  readonly isSimulation: boolean;
  readonly contextItems: readonly AIContextItem[];
  readonly retrievalItems: readonly AIRetrievalItem[];
  readonly totalContextBytes: number;
  readonly totalRetrievalBytes: number;
  readonly aggregateBytes: number;
  readonly estimatedTokens: number;
}

export type {
  AIIntent,
  AIRequestContextMode,
  AIResponseContextMode,
  AICitationSourceType,
  AISafetyOutcome,
  AIRefusalCode,
  AIDisclaimerCode,
};
