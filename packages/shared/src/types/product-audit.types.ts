/**
 * FEAT-016 Product Audit Governance Types & Contracts
 */

export const PRODUCT_AUDIT_OPERATION_SOURCES = [
  "USER_REQUEST",
  "SYSTEM_JOB",
  "ADMIN_OPERATION",
  "INTERNAL_MAINTENANCE",
  "TEST_FIXTURE",
] as const;

export type ProductAuditOperationSource = (typeof PRODUCT_AUDIT_OPERATION_SOURCES)[number];

export const PRODUCT_AUDIT_TRANSACTION_STRATEGIES = [
  "TRANSACTIONALLY_COUPLED",
  "STATE_FIRST",
  "BEST_EFFORT",
] as const;

export type ProductAuditTransactionStrategy = (typeof PRODUCT_AUDIT_TRANSACTION_STRATEGIES)[number];

export const PRODUCT_AUDIT_EVENT_OUTCOMES = [
  "SUCCESS",
  "FAILURE",
  "DENIED",
  "ERROR",
] as const;

export type ProductAuditEventOutcome = (typeof PRODUCT_AUDIT_EVENT_OUTCOMES)[number];

/**
 * Conceptual schema definition for a future product audit event.
 */
export interface ProductAuditEventDefinition {
  eventType: string;
  domain: string;
  transactionStrategy: ProductAuditTransactionStrategy;
  allowedMetadataKeys: readonly string[];
  maxMetadataBytes?: number;
  description?: string;
}

/**
 * Normalized roots for prohibited metadata keys.
 * Checked after stripping all punctuation, casing, and separators.
 */
export const PROHIBITED_NORMALIZED_ROOTS = [
  "password",
  "passwd",
  "passwordhash",
  "pwd",
  "token",
  "accesstoken",
  "refreshtoken",
  "jwt",
  "bearer",
  "cookie",
  "cookies",
  "session",
  "authorization",
  "authheader",
  "secret",
  "keysecret",
  "apikey",
  "credential",
  "credentials",
  "databaseurl",
  "dburl",
  "postgres",
  "postgresql",
  "redisurl",
  "rawbody",
  "requestbody",
  "rawrequestbody",
  "stacktrace",
  "stack",
  "rawerror",
  "exception",
  "sql",
  "query",
  "ssn",
  "socialsecurity",
  "creditcard",
  "bankaccount",
  "cvv",
  "role",
  "clientrole",
  "userrole",
  "roleclaim",
  "admin",
  "isadmin",
  "adminclaim",
] as const;

export interface MetadataValidationResult {
  valid: boolean;
  errors: string[];
  serializedBytes: number;
}

export const MAX_METADATA_SERIALIZED_BYTES_DEFAULT = 2048; // 2 KiB

/**
 * Normalizes a metadata key for security analysis:
 * Lowercases and removes all separators/punctuation (_, -, ., :, spaces).
 */
export function normalizeMetadataKey(key: string): string {
  return key.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/**
 * Checks if a key matches any prohibited security pattern across
 * camelCase, snake_case, kebab-case, or case variants.
 */
export function isProhibitedMetadataKey(key: string): { prohibited: boolean; matchedPattern?: string } {
  const normalized = normalizeMetadataKey(key);
  const lowerRaw = key.toLowerCase();

  for (const root of PROHIBITED_NORMALIZED_ROOTS) {
    if (normalized === root || normalized.includes(root)) {
      return { prohibited: true, matchedPattern: root };
    }
  }

  // Regex pattern matching boundary checks on raw key
  const boundaryRegex = /(?:^|[_\-.\s:])(password|passwd|pwd|token|jwt|cookie|auth|secret|apikey|api_key|credential|dburl|database_url|databaseurl|redis_url|redisurl|rawbody|raw_request_body|request_body|stack|sql|ssn|role|client_role|admin|is_admin)(?:[_\-.\s:]|$)/i;
  if (boundaryRegex.test(lowerRaw)) {
    return { prohibited: true, matchedPattern: lowerRaw };
  }

  return { prohibited: false };
}

/**
 * Validates metadata against FEAT-016 governance:
 * - Must be flat object (no nested objects/arrays)
 * - Must not exceed 2 KiB serialized size (evaluated in UTF-8 bytes)
 * - Must not contain prohibited security keys across casing/naming styles
 */
export function validateProductAuditMetadata(
  metadata: unknown,
  allowedKeys?: readonly string[],
  maxBytes: number = MAX_METADATA_SERIALIZED_BYTES_DEFAULT,
): MetadataValidationResult {
  const errors: string[] = [];

  if (metadata === null || metadata === undefined) {
    return { valid: true, errors: [], serializedBytes: 0 };
  }

  if (typeof metadata !== "object" || Array.isArray(metadata)) {
    return {
      valid: false,
      errors: ["Metadata must be a plain key-value object (arrays and non-object primitives are rejected)."],
      serializedBytes: 0,
    };
  }

  let serialized = "";
  try {
    serialized = JSON.stringify(metadata);
  } catch {
    return {
      valid: false,
      errors: ["Metadata could not be serialized to JSON."],
      serializedBytes: 0,
    };
  }

  const serializedBytes = Buffer.byteLength(serialized, "utf8");
  if (serializedBytes > maxBytes) {
    errors.push(`Metadata serialized size (${serializedBytes} bytes) exceeds maximum allowable limit (${maxBytes} bytes).`);
  }

  const entries = Object.entries(metadata as Record<string, unknown>);
  for (const [key, value] of entries) {
    // 1. Check prohibited denylist across normalized variants
    const check = isProhibitedMetadataKey(key);
    if (check.prohibited) {
      errors.push(`Prohibited key '${key}' detected in metadata (violates security denylist root: ${check.matchedPattern}).`);
    }

    // 2. Check allowlist if provided
    if (allowedKeys && allowedKeys.length > 0 && !allowedKeys.includes(key)) {
      errors.push(`Key '${key}' is not in the approved metadata allowlist [${allowedKeys.join(", ")}].`);
    }

    // 3. Check flatness: primitive values or null only (reject nested objects, arrays, and symbols)
    if (value !== null && value !== undefined && typeof value === "object") {
      errors.push(`Metadata key '${key}' contains a non-flat nested structure (objects and arrays are prohibited in flat audit metadata).`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    serializedBytes,
  };
}

/**
 * Validates a product audit event definition contract.
 * Strictly enforces exactly one transaction strategy and rejects contradictory/multiple configurations.
 */
export function validateProductAuditEventDefinition(def: unknown): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!def || typeof def !== "object" || Array.isArray(def)) {
    return { valid: false, errors: ["Event definition must be an object."] };
  }

  const record = def as Record<string, unknown>;

  // Check for prohibited multiple/contradictory strategy fields
  const conflictingKeys = [
    "transactionStrategies",
    "strategies",
    "strategyList",
    "couplingStrategies",
    "alternativeStrategies",
  ];
  for (const conflict of conflictingKeys) {
    if (conflict in record) {
      errors.push(`Contradictory or multiple transaction strategy field '${conflict}' is prohibited; exactly one 'transactionStrategy' must be declared.`);
    }
  }

  const d = def as Partial<ProductAuditEventDefinition>;

  if (!d.eventType || typeof d.eventType !== "string" || d.eventType.trim() === "") {
    errors.push("Event definition must declare a non-empty eventType string.");
  } else if (!/^[A-Z0-9_]+$/.test(d.eventType)) {
    errors.push(`Event type '${d.eventType}' must be uppercase alphanumeric with underscores.`);
  }

  if (!d.domain || typeof d.domain !== "string" || d.domain.trim() === "") {
    errors.push("Event definition must declare an owning domain name.");
  }

  if (typeof d.transactionStrategy !== "string" || !PRODUCT_AUDIT_TRANSACTION_STRATEGIES.includes(d.transactionStrategy)) {
    errors.push(`Event definition must explicitly declare exactly one valid transactionStrategy (${PRODUCT_AUDIT_TRANSACTION_STRATEGIES.join(", ")}).`);
  }

  if (!Array.isArray(d.allowedMetadataKeys)) {
    errors.push("Event definition must declare an allowedMetadataKeys array.");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
