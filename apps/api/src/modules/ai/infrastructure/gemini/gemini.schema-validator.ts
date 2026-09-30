import { AIGatewayMalformedResponseError } from "../../core/ai-gateway.errors.js";
import type { GeminiResponseSchema } from "./gemini.types.js";

export interface SchemaValidationRule {
  readonly schemaId: string;
  readonly schemaVersion: string;
  readonly geminiSchema: GeminiResponseSchema;
  readonly validate: (data: unknown) => { valid: boolean; errors?: string[] };
}

// Built-in standard schemas for Phase 8 structured contracts
const SCHEMA_REGISTRY = new Map<string, SchemaValidationRule>();

/**
 * Registers an application-owned schema for structured output validation (FR-006, AC-010).
 */
export function registerStructuredSchema(rule: SchemaValidationRule): void {
  SCHEMA_REGISTRY.set(rule.schemaId, rule);
}

/**
 * Retrieves a registered schema by schemaId.
 */
export function getRegisteredSchema(schemaId: string): SchemaValidationRule | undefined {
  return SCHEMA_REGISTRY.get(schemaId);
}

// Pre-register canonical test and intent schemas
registerStructuredSchema({
  schemaId: "test-structured-schema",
  schemaVersion: "1.0",
  geminiSchema: {
    type: "OBJECT",
    properties: {
      status: { type: "STRING" },
      code: { type: "INTEGER" },
    },
    required: ["status", "code"],
  },
  validate: (data: unknown) => {
    if (!data || typeof data !== "object" || Array.isArray(data)) {
      return { valid: false, errors: ["Expected JSON object"] };
    }
    const record = data as Record<string, unknown>;
    const errors: string[] = [];
    if (typeof record.status !== "string") {
      errors.push("Field 'status' must be a string");
    }
    if (typeof record.code !== "number" || !Number.isInteger(record.code)) {
      errors.push("Field 'code' must be an integer");
    }
    // Reject unexpected properties
    const allowedKeys = new Set(["status", "code"]);
    for (const k of Object.keys(record)) {
      if (!allowedKeys.has(k)) {
        errors.push(`Unexpected property '${k}' in structured output`);
      }
    }
    return { valid: errors.length === 0, errors };
  },
});

registerStructuredSchema({
  schemaId: "ai-intent-schema",
  schemaVersion: "1.0",
  geminiSchema: {
    type: "OBJECT",
    properties: {
      intent: { type: "STRING" },
      confidence: { type: "NUMBER" },
    },
    required: ["intent", "confidence"],
  },
  validate: (data: unknown) => {
    if (!data || typeof data !== "object" || Array.isArray(data)) {
      return { valid: false, errors: ["Expected JSON object"] };
    }
    const record = data as Record<string, unknown>;
    const errors: string[] = [];
    if (typeof record.intent !== "string") {
      errors.push("Field 'intent' must be a string");
    }
    if (typeof record.confidence !== "number") {
      errors.push("Field 'confidence' must be a number");
    }
    const allowedKeys = new Set(["intent", "confidence"]);
    for (const k of Object.keys(record)) {
      if (!allowedKeys.has(k)) {
        errors.push(`Unexpected property '${k}' in structured output`);
      }
    }
    return { valid: errors.length === 0, errors };
  },
});

/**
 * Validates a parsed JSON payload against the specified schema contract (FR-006, Section 6).
 * Fails closed with AIGatewayMalformedResponseError if the payload violates the schema.
 */
export function validateStructuredPayload(
  payload: unknown,
  schemaId: string,
): Record<string, unknown> {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new AIGatewayMalformedResponseError(
      `Structured output for schema '${schemaId}' is not a valid JSON object`,
    );
  }

  const registered = getRegisteredSchema(schemaId);
  if (registered) {
    const result = registered.validate(payload);
    if (!result.valid) {
      const errList = result.errors?.join("; ") ?? "Validation failed";
      throw new AIGatewayMalformedResponseError(
        `Structured output violated schema '${schemaId}': ${errList}`,
      );
    }
  }

  return payload as Record<string, unknown>;
}
