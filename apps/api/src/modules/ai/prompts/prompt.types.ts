import type { AIIntent } from "@aura/shared";
import type { LLMMessagePart } from "../core/llm-provider.types.js";

export interface PromptMetadata {
  readonly author: string;
  readonly createdAt: string;
  readonly description: string;
  readonly purpose: string;
}

export interface PromptDefinition {
  readonly promptId: string;
  readonly version: string;
  readonly systemInstructions: string;
  readonly supportedIntents: readonly AIIntent[];
  readonly expectedOutputSchemaId: string;
  readonly expectedOutputSchemaVersion: string;
  readonly metadata: PromptMetadata;
  readonly isDefault?: boolean;
}

export interface TrustedContextItemInput {
  readonly id: string;
  readonly source: string;
  readonly content: string;
}

export interface UntrustedRetrievalItemInput {
  readonly citationId: string;
  readonly title: string;
  readonly snippet: string;
}

export interface PromptAssemblyContext {
  readonly promptId: string;
  readonly promptVersion?: string;
  readonly userMessage: string;
  readonly contextMode?: "AUTO" | "ACADEMY" | "SIMULATION";
  readonly trustedContext?: readonly TrustedContextItemInput[];
  readonly untrustedRetrieval?: readonly UntrustedRetrievalItemInput[];
}

export interface PromptAssemblyResult {
  readonly promptId: string;
  readonly promptVersion: string;
  readonly messages: readonly LLMMessagePart[];
  readonly estimatedTokens: number;
  readonly totalUtf8Bytes: number;
  readonly truncatedRetrievalCount: number;
}
