import { AppError } from "../../shared/errors/error-envelope.js";
import { ZodError } from "zod";

export interface SanitizedErrorInfo {
  category: "APPLICATION_ERROR" | "VALIDATION_ERROR" | "DATABASE_ERROR" | "REDIS_ERROR" | "INTERNAL_ERROR";
  code: string;
  message: string;
  isOperational: boolean;
}

const SENSITIVE_KEY_NAMES = [
  "password",
  "passwd",
  "pwd",
  "token",
  "access_token",
  "refresh_token",
  "raw_token",
  "rawtoken",
  "token_hash",
  "tokenhash",
  "hash",
  "secret",
  "client_secret",
  "jwt_secret",
  "refresh_token_secret",
  "access_token_secret",
  "api_key",
  "apikey",
  "authorization",
  "cookie",
  "database_url",
].join("|");

// Patterns that must NEVER appear in application logs
const SENSITIVE_PATTERNS: Array<{ pattern: RegExp; replacement: string }> = [
  // 1. Database connection URLs (with or without credentials)
  {
    pattern: /(?:postgresql|postgres|mysql|redis|mongodb):\/\/[^\s"']+/gi,
    replacement: "[DATABASE_URL_REDACTED]",
  },
  // 2. Host and port pairs (e.g. localhost:5432, 127.0.0.1:5432)
  {
    pattern: /(?:localhost|127\.0\.0\.1|0\.0\.0\.0|\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b):\d{2,5}/gi,
    replacement: "[HOST:PORT_REDACTED]",
  },
  // 3. Prisma error class names
  {
    pattern: /PrismaClient\w*(?:Error|Panic)?/g,
    replacement: "[PRISMA_ERROR]",
  },
  // 4. JWT tokens
  {
    pattern: /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g,
    replacement: "[JWT_TOKEN_REDACTED]",
  },
  // 5. Bearer tokens in headers/strings
  {
    pattern: /Bearer\s+(?!\[REDACTED\])[A-Za-z0-9._~+/-]+=*/gi,
    replacement: "Bearer [REDACTED]",
  },
  // 6. JSON-like serialized sensitive key-value pairs: "key": "value" or "key":"value"
  {
    pattern: new RegExp(`("(?:"|\\\\.)*(?:${SENSITIVE_KEY_NAMES})(?:"|\\\\.)*")(\\s*:\\s*)("(?:[^"\\\\]|\\\\.)*"|'[^']*'|[^\\s,}]+)`, "gi"),
    replacement: `$1$2"[REDACTED]"`,
  },
  // 7. Key-value pairs separated by = or : (e.g. password=supersecret, secret: 'hunter2', token=raw123)
  {
    pattern: new RegExp(`\\b(${SENSITIVE_KEY_NAMES})\\b(\\s*[=:]\\s*)(['"]?)(?!\\[REDACTED\\]|Bearer\\b)([^'"\\s,;&]+)(['"]?)`, "gi"),
    replacement: `$1$2$3[REDACTED]$5`,
  },
];

/**
 * Sanitizes any raw string to ensure sensitive connection info, tokens, secrets, and DB internals are redacted.
 */
export function sanitizeLogString(input: string): string {
  let result = input;
  for (const { pattern, replacement } of SENSITIVE_PATTERNS) {
    result = result.replace(pattern, replacement);
  }
  return result;
}

/**
 * Checks whether an error is related to Prisma or database infrastructure.
 */
export function isDatabaseError(err: unknown): boolean {
  if (!err) return false;

  if (typeof err === "object") {
    const errorObj = err as Record<string, unknown>;
    const name = typeof errorObj.name === "string" ? errorObj.name : "";
    const message = typeof errorObj.message === "string" ? errorObj.message : "";
    const constructorName = errorObj.constructor?.name ?? "";

    if (
      name.startsWith("Prisma") ||
      constructorName.startsWith("Prisma") ||
      message.includes("PrismaClient") ||
      message.includes("prisma") ||
      message.includes("database server") ||
      message.includes("postgresql") ||
      message.includes("P20") // Prisma error codes P2002, P2003, etc.
    ) {
      return true;
    }
  }

  if (typeof err === "string") {
    return (
      err.includes("Prisma") ||
      err.includes("postgresql") ||
      err.includes("database server")
    );
  }

  return false;
}

/**
 * Checks whether an error is related to Redis infrastructure.
 */
export function isRedisError(err: unknown): boolean {
  if (!err) return false;

  if (typeof err === "object") {
    const errorObj = err as Record<string, unknown>;
    const name = typeof errorObj.name === "string" ? errorObj.name : "";
    const message = typeof errorObj.message === "string" ? errorObj.message : "";

    if (
      name === "RedisUnavailableError" ||
      name.includes("Redis") ||
      message.includes("Redis") ||
      message.includes("redis") ||
      message.includes("ECONNREFUSED") ||
      message.includes("ETIMEDOUT")
    ) {
      return true;
    }
  }

  return false;
}

/**
 * Classifies an error into a safe category and produces a clean, non-leaking message for logging.
 */
export function classifyAndSanitizeError(err: unknown): SanitizedErrorInfo {
  // 1. Controlled Application Errors (AppError)
  if (err instanceof AppError) {
    return {
      category: "APPLICATION_ERROR",
      code: err.code,
      message: sanitizeLogString(err.message),
      isOperational: true,
    };
  }

  // 2. Schema Validation Errors (ZodError)
  if (err instanceof ZodError) {
    return {
      category: "VALIDATION_ERROR",
      code: "VALIDATION_ERROR",
      message: "Request validation failed",
      isOperational: true,
    };
  }

  // 3. Database / Prisma Infrastructure Errors
  if (isDatabaseError(err)) {
    let safeCode = "DATABASE_ERROR";
    if (typeof err === "object" && err !== null && "code" in err && typeof (err as { code: unknown }).code === "string") {
      const prismaCode = (err as { code: string }).code;
      if (/^P\d{4}$/.test(prismaCode)) {
        safeCode = `DATABASE_${prismaCode}`;
      }
    }

    return {
      category: "DATABASE_ERROR",
      code: safeCode,
      message: "Database operation failed",
      isOperational: false,
    };
  }

  // 4. Redis Infrastructure Errors
  if (isRedisError(err)) {
    return {
      category: "REDIS_ERROR",
      code: "REDIS_ERROR",
      message: "Redis operation failed",
      isOperational: false,
    };
  }

  // 5. Other Unexpected / System Errors
  return {
    category: "INTERNAL_ERROR",
    code: "INTERNAL_ERROR",
    message: "An unexpected internal error occurred",
    isOperational: false,
  };
}
