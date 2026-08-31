import { sanitizeLogString } from "./error-sanitizer.js";

export type LogLevel = "info" | "warn" | "error" | "debug";

export interface LogMetadata {
  requestId?: string | undefined;
  userId?: string | undefined;
  path?: string | undefined;
  method?: string | undefined;
  statusCode?: number | undefined;
  durationMs?: number | undefined;
  error?: unknown;
  [key: string]: unknown;
}

const SENSITIVE_KEYS = new Set([
  "password",
  "passwd",
  "pwd",
  "token",
  "secret",
  "jwt",
  "jwt_secret",
  "jwtsecret",
  "authorization",
  "apikey",
  "api_key",
  "gemini_api_key",
  "cookie",
  "refreshtoken",
  "accesstoken",
  "rawtoken",
  "raw_token",
  "tokenhash",
  "token_hash",
  "hash",
  "clientsecret",
  "client_secret",
  "databaseurl",
  "database_url",
  "dburl",
  "db_url",
  "redisurl",
  "redis_url",
]);

export function sanitizeLogData(data: unknown): unknown {
  if (data === null || data === undefined) return data;

  if (typeof data === "string") {
    return sanitizeLogString(data);
  }

  if (typeof data !== "object") return data;

  if (Array.isArray(data)) {
    return data.map((item) => sanitizeLogData(item));
  }

  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
    if (SENSITIVE_KEYS.has(key.toLowerCase().replace(/[-_]/g, ""))) {
      sanitized[key] = "[REDACTED]";
    } else if (typeof value === "object" && value !== null) {
      sanitized[key] = sanitizeLogData(value);
    } else if (typeof value === "string") {
      sanitized[key] = sanitizeLogString(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

export class Logger {
  private serviceName: string;

  constructor(serviceName = "aura-api") {
    this.serviceName = serviceName;
  }

  private log(level: LogLevel, message: string, metadata?: LogMetadata): void {
    const entry = {
      timestamp: new Date().toISOString(),
      service: this.serviceName,
      level,
      message: sanitizeLogString(message),
      ...(metadata ? (sanitizeLogData(metadata) as Record<string, unknown>) : {}),
    };

    const serialized = JSON.stringify(entry);
    if (level === "error") {
      console.error(serialized);
    } else if (level === "warn") {
      console.warn(serialized);
    } else {
      console.log(serialized);
    }
  }

  info(message: string, metadata?: LogMetadata): void {
    this.log("info", message, metadata);
  }

  warn(message: string, metadata?: LogMetadata): void {
    this.log("warn", message, metadata);
  }

  error(message: string, metadata?: LogMetadata): void {
    this.log("error", message, metadata);
  }

  debug(message: string, metadata?: LogMetadata): void {
    this.log("debug", message, metadata);
  }
}

export const logger = new Logger();
