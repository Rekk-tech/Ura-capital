/**
 * Internal Gemini API v1 types and payload definitions.
 * Strictly confined to the Gemini adapter infrastructure (FR-002, AC-002).
 * These vendor types MUST NOT be exposed outside this module.
 */

export interface GeminiPart {
  readonly text?: string;
  readonly thoughtSignature?: string;
}

export interface GeminiContent {
  readonly role?: "user" | "model";
  readonly parts: readonly GeminiPart[];
}

export interface GeminiSchemaProperty {
  readonly type: "STRING" | "NUMBER" | "INTEGER" | "BOOLEAN" | "ARRAY" | "OBJECT";
  readonly description?: string;
  readonly properties?: Record<string, GeminiSchemaProperty>;
  readonly items?: GeminiSchemaProperty;
  readonly required?: readonly string[];
  readonly enum?: readonly string[];
}

export interface GeminiResponseSchema {
  readonly type: "OBJECT" | "ARRAY";
  readonly properties?: Record<string, GeminiSchemaProperty>;
  readonly required?: readonly string[];
  readonly items?: GeminiSchemaProperty;
}

export interface GeminiGenerationConfig {
  readonly maxOutputTokens?: number;
  readonly temperature?: number;
  readonly topP?: number;
  readonly topK?: number;
  readonly responseMimeType?: "text/plain" | "application/json";
  readonly responseSchema?: GeminiResponseSchema;
  readonly stopSequences?: readonly string[];
}

export interface GeminiSystemInstruction {
  readonly parts: readonly { readonly text: string }[];
}

export interface GeminiGenerateContentRequest {
  readonly contents: readonly GeminiContent[];
  readonly systemInstruction?: GeminiSystemInstruction;
  readonly generationConfig?: GeminiGenerationConfig;
}

export type GeminiFinishReason =
  | "STOP"
  | "MAX_TOKENS"
  | "SAFETY"
  | "RECITATION"
  | "LANGUAGE"
  | "BLOCKLIST"
  | "PROHIBITED_CONTENT"
  | "SPII"
  | "MALFORMED_FUNCTION_CALL"
  | "IMAGE_SAFETY"
  | "OTHER";

export interface GeminiCandidate {
  readonly content?: {
    readonly parts?: readonly GeminiPart[];
    readonly role?: string;
  };
  readonly finishReason?: GeminiFinishReason;
  readonly index?: number;
  readonly safetyRatings?: readonly unknown[];
}

export interface GeminiUsageMetadata {
  readonly promptTokenCount?: number;
  readonly candidatesTokenCount?: number;
  readonly totalTokenCount?: number;
  readonly promptTokensDetails?: readonly {
    readonly modality?: string;
    readonly tokenCount?: number;
  }[];
  readonly candidatesTokensDetails?: readonly {
    readonly modality?: string;
    readonly tokenCount?: number;
  }[];
  readonly serviceTier?: string;
}

export interface GeminiPromptFeedback {
  readonly blockReason?: string;
  readonly safetyRatings?: readonly unknown[];
}

export interface GeminiGenerateContentResponse {
  readonly candidates?: readonly GeminiCandidate[];
  readonly promptFeedback?: GeminiPromptFeedback;
  readonly usageMetadata?: GeminiUsageMetadata;
  readonly modelVersion?: string;
}

export interface GeminiErrorResponse {
  readonly error?: {
    readonly code?: number;
    readonly message?: string;
    readonly status?: string;
    readonly details?: readonly unknown[];
  };
}
