export type { GeminiAdapterOptions } from "./gemini.adapter.js";
export { GeminiAdapter } from "./gemini.adapter.js";
export {
  mapGeminiHttpError,
  mapGeminiNetworkError,
} from "./gemini.errors.js";
export {
  registerStructuredSchema,
  getRegisteredSchema,
  validateStructuredPayload,
} from "./gemini.schema-validator.js";
export type {
  SchemaValidationRule,
} from "./gemini.schema-validator.js";
export type {
  GeminiGenerateContentRequest,
  GeminiGenerateContentResponse,
  GeminiCandidate,
  GeminiUsageMetadata,
} from "./gemini.types.js";
