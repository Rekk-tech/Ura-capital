import { z } from "zod";
import {
  AI_INTENTS,
  AI_REQUEST_CONTEXT_MODES,
  AI_RESPONSE_CONTEXT_MODES,
  AI_CITATION_SOURCE_TYPES,
  AI_SAFETY_OUTCOMES,
  AI_REFUSAL_CODES,
  AI_DISCLAIMER_CODES,
  AI_BUDGET_LIMITS,
  AI_CONTRACT_VERSION_V1,
} from "../constants/ai.constants.js";

/**
 * Calculates string length in Unicode code points.
 */
export function countCodePoints(str: string): number {
  return [...str].length;
}

/**
 * Calculates string size in UTF-8 bytes.
 */
export function countUtf8Bytes(str: string): number {
  return new TextEncoder().encode(str).length;
}

/**
 * Checks for disallowed control characters:
 * - NUL (\u0000)
 * - ASCII control chars 0x01-0x08, 0x0B (\v), 0x0C (\f), 0x0E-0x1F
 * - DEL (0x7F)
 * Permitted whitespace: \t (0x09), \n (0x0A), \r (0x0D), space (0x20).
 */
export function hasDisallowedControlCharacters(str: string): boolean {
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    if (code === 0x09 || code === 0x0A || code === 0x0D) {
      continue;
    }
    if (code <= 0x1f || code === 0x7f) {
      return true;
    }
  }
  return false;
}

/**
 * Safe ASCII identifier regex for opaque IDs (citationId, requestId).
 */
export const SAFE_ASCII_ID_REGEX = /^[A-Za-z0-9_.:-]+$/;

/**
 * Normalizes user query:
 * 1. NFKC Unicode normalization
 * 2. Unicode whitespace trimming
 */
export function normalizeAIMessage(raw: string): string {
  if (typeof raw !== "string") {
    return "";
  }
  return raw.normalize("NFKC").trim();
}

/**
 * Request message validator ensuring NFKC normalization, byte/code-point bounds,
 * and rejection of disallowed control characters.
 */
export const AIMessageSchema = z
  .string({ required_error: "message is required" })
  .transform((val) => normalizeAIMessage(val))
  .superRefine((val, ctx) => {
    if (hasDisallowedControlCharacters(val)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "message contains disallowed control characters",
      });
      return;
    }

    const codePoints = countCodePoints(val);
    if (codePoints < AI_BUDGET_LIMITS.MIN_MESSAGE_CODE_POINTS) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `message must be at least ${AI_BUDGET_LIMITS.MIN_MESSAGE_CODE_POINTS} code point`,
      });
      return;
    }

    if (codePoints > AI_BUDGET_LIMITS.MAX_MESSAGE_CODE_POINTS) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `message must not exceed ${AI_BUDGET_LIMITS.MAX_MESSAGE_CODE_POINTS} code points (got ${codePoints})`,
      });
      return;
    }

    const bytes = countUtf8Bytes(val);
    if (bytes > AI_BUDGET_LIMITS.MAX_MESSAGE_UTF8_BYTES) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `message must not exceed ${AI_BUDGET_LIMITS.MAX_MESSAGE_UTF8_BYTES} UTF-8 bytes (got ${bytes})`,
      });
      return;
    }
  });

/**
 * Strict request DTO schema for POST /api/ai/assist (FR-002, AC-002, P8-D09-A).
 * Unknown fields and client attempts to supply authority/model/prompt/context are strictly rejected.
 */
export const AIAssistRequestSchema = z
  .object({
    message: AIMessageSchema,
    contextMode: z
      .enum([
        AI_REQUEST_CONTEXT_MODES.AUTO,
        AI_REQUEST_CONTEXT_MODES.ACADEMY,
        AI_REQUEST_CONTEXT_MODES.SIMULATION,
      ])
      .default(AI_REQUEST_CONTEXT_MODES.AUTO),
  })
  .strict({
    message: "Unknown or prohibited fields in request body",
  });

/**
 * Context disclosure DTO schema (P8-D09-C).
 */
export const AICallContextDtoSchema = z
  .object({
    mode: z.enum([
      AI_RESPONSE_CONTEXT_MODES.GENERAL,
      AI_RESPONSE_CONTEXT_MODES.ACADEMY,
      AI_RESPONSE_CONTEXT_MODES.SIMULATION,
    ]),
    isSimulation: z.boolean(),
  })
  .strict()
  .superRefine((val, ctx) => {
    const expectedIsSim = val.mode === AI_RESPONSE_CONTEXT_MODES.SIMULATION;
    if (val.isSimulation !== expectedIsSim) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `isSimulation must be ${expectedIsSim} when mode is ${val.mode}`,
        path: ["isSimulation"],
      });
    }
  });

/**
 * Citation DTO schema (P8-D09-D).
 */
export const AICitationDtoSchema = z
  .object({
    citationId: z
      .string()
      .min(1)
      .max(AI_BUDGET_LIMITS.MAX_CITATION_ID_LENGTH)
      .regex(SAFE_ASCII_ID_REGEX, "citationId must contain safe ASCII characters only"),
    sourceType: z.enum([
      AI_CITATION_SOURCE_TYPES.ACADEMY_CONTENT,
      AI_CITATION_SOURCE_TYPES.SIMULATION_CONTEXT,
    ]),
    title: z
      .string()
      .min(1)
      .superRefine((val, ctx) => {
        const cp = countCodePoints(val);
        if (cp > AI_BUDGET_LIMITS.MAX_CITATION_TITLE_CODE_POINTS) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Citation title exceeds ${AI_BUDGET_LIMITS.MAX_CITATION_TITLE_CODE_POINTS} code points`,
          });
        }
        const bytes = countUtf8Bytes(val);
        if (bytes > AI_BUDGET_LIMITS.MAX_CITATION_TITLE_BYTES) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Citation title exceeds ${AI_BUDGET_LIMITS.MAX_CITATION_TITLE_BYTES} bytes`,
          });
        }
      }),
    locationLabel: z
      .string()
      .superRefine((val, ctx) => {
        const cp = countCodePoints(val);
        if (cp > AI_BUDGET_LIMITS.MAX_LOCATION_LABEL_CODE_POINTS) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `locationLabel exceeds ${AI_BUDGET_LIMITS.MAX_LOCATION_LABEL_CODE_POINTS} code points`,
          });
        }
        const bytes = countUtf8Bytes(val);
        if (bytes > AI_BUDGET_LIMITS.MAX_LOCATION_LABEL_BYTES) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `locationLabel exceeds ${AI_BUDGET_LIMITS.MAX_LOCATION_LABEL_BYTES} bytes`,
          });
        }
      })
      .nullable(),
  })
  .strict();

/**
 * Safety and refusal outcome schema (P8-D09-E).
 */
export const AISafetyDtoSchema = z
  .object({
    outcome: z.enum([AI_SAFETY_OUTCOMES.ALLOWED, AI_SAFETY_OUTCOMES.REFUSED]),
    refusalCode: z
      .enum([
        AI_REFUSAL_CODES.UNSUPPORTED_REQUEST,
        AI_REFUSAL_CODES.PROHIBITED_FINANCIAL_ACTION,
        AI_REFUSAL_CODES.INSUFFICIENT_SAFE_CONTEXT,
        AI_REFUSAL_CODES.SAFETY_POLICY,
      ])
      .nullable(),
    disclaimerCode: z
      .enum([
        AI_DISCLAIMER_CODES.EDUCATIONAL_ONLY,
        AI_DISCLAIMER_CODES.SIMULATION_ONLY,
      ])
      .nullable(),
  })
  .strict()
  .superRefine((val, ctx) => {
    if (val.outcome === AI_SAFETY_OUTCOMES.REFUSED && val.refusalCode === null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "refusalCode must be provided when outcome is REFUSED",
        path: ["refusalCode"],
      });
    }
    if (val.outcome === AI_SAFETY_OUTCOMES.ALLOWED && val.refusalCode !== null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "refusalCode must be null when outcome is ALLOWED",
        path: ["refusalCode"],
      });
    }
  });

/**
 * Public quota projection schema (P8-D09-G).
 * Exposes only minute/day limit, remaining, and UTC reset timestamp.
 */
export const AIQuotaDtoSchema = z
  .object({
    minuteLimit: z.number().int().positive(),
    minuteRemaining: z.number().int().nonnegative(),
    minuteResetAt: z.string().datetime(),
    dailyLimit: z.number().int().positive(),
    dailyRemaining: z.number().int().nonnegative(),
    dailyResetAt: z.string().datetime(),
  })
  .strict();

/**
 * Answer content validator enforcing code point and UTF-8 byte bounds.
 */
export const AIAnswerSchema = z
  .string()
  .min(AI_BUDGET_LIMITS.MIN_ANSWER_CODE_POINTS)
  .superRefine((val, ctx) => {
    const cp = countCodePoints(val);
    if (cp > AI_BUDGET_LIMITS.MAX_ANSWER_CODE_POINTS) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Answer exceeds ${AI_BUDGET_LIMITS.MAX_ANSWER_CODE_POINTS} code points (got ${cp})`,
      });
    }
    const bytes = countUtf8Bytes(val);
    if (bytes > AI_BUDGET_LIMITS.MAX_ANSWER_UTF8_BYTES) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Answer exceeds ${AI_BUDGET_LIMITS.MAX_ANSWER_UTF8_BYTES} UTF-8 bytes (got ${bytes})`,
      });
    }
  });

/**
 * Canonical AI Assist Response Data DTO schema (P8-D09-C).
 */
export const AIAssistDataDtoSchema = z
  .object({
    contractVersion: z.literal(AI_CONTRACT_VERSION_V1),
    requestId: z
      .string()
      .min(1)
      .max(AI_BUDGET_LIMITS.MAX_REQUEST_ID_LENGTH)
      .regex(SAFE_ASCII_ID_REGEX, "requestId must contain safe ASCII characters only"),
    answer: AIAnswerSchema,
    intent: z.enum([
      AI_INTENTS.LEARNING_EXPLANATION,
      AI_INTENTS.ACADEMY_GUIDANCE,
      AI_INTENTS.SIMULATION_ANALYSIS,
      AI_INTENTS.PORTFOLIO_EDUCATION,
      AI_INTENTS.UNSUPPORTED_OR_REFUSED,
    ]),
    context: AICallContextDtoSchema,
    citations: z.array(AICitationDtoSchema).min(0).max(AI_BUDGET_LIMITS.MAX_CITATIONS),
    safety: AISafetyDtoSchema,
    quota: AIQuotaDtoSchema,
  })
  .strict();

/**
 * Complete public response envelope schema (P8-D09-C).
 */
export const AIAssistResponseSchema = z
  .object({
    data: AIAssistDataDtoSchema,
  })
  .strict();

/**
 * Provider-independent structured payload schema generated by LLMProvider
 * under outputMode: { kind: "STRUCTURED", schemaId: "ai-assist-v1" } (FR-003, AC-003).
 */
export const AIAssistProviderStructuredPayloadSchema = z
  .object({
    answer: AIAnswerSchema,
    intent: z.enum([
      AI_INTENTS.LEARNING_EXPLANATION,
      AI_INTENTS.ACADEMY_GUIDANCE,
      AI_INTENTS.SIMULATION_ANALYSIS,
      AI_INTENTS.PORTFOLIO_EDUCATION,
      AI_INTENTS.UNSUPPORTED_OR_REFUSED,
    ]),
    suggestedMode: z.enum([
      AI_RESPONSE_CONTEXT_MODES.GENERAL,
      AI_RESPONSE_CONTEXT_MODES.ACADEMY,
      AI_RESPONSE_CONTEXT_MODES.SIMULATION,
    ]),
    safety: z
      .object({
        outcome: z.enum([AI_SAFETY_OUTCOMES.ALLOWED, AI_SAFETY_OUTCOMES.REFUSED]),
        refusalCode: z
          .enum([
            AI_REFUSAL_CODES.UNSUPPORTED_REQUEST,
            AI_REFUSAL_CODES.PROHIBITED_FINANCIAL_ACTION,
            AI_REFUSAL_CODES.INSUFFICIENT_SAFE_CONTEXT,
            AI_REFUSAL_CODES.SAFETY_POLICY,
          ])
          .nullable(),
        disclaimerCode: z
          .enum([
            AI_DISCLAIMER_CODES.EDUCATIONAL_ONLY,
            AI_DISCLAIMER_CODES.SIMULATION_ONLY,
          ])
          .nullable(),
      })
      .strict(),
    referencedCitationIds: z
      .array(
        z
          .string()
          .min(1)
          .max(AI_BUDGET_LIMITS.MAX_CITATION_ID_LENGTH)
          .regex(SAFE_ASCII_ID_REGEX),
      )
      .max(AI_BUDGET_LIMITS.MAX_CITATIONS),
  })
  .strict();
