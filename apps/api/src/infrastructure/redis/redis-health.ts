import type { Redis } from "ioredis";
import { getRedisClient } from "./redis.js";

/**
 * Internal Redis readiness check report.
 * Strictly internal/operator-facing. NEVER exposed to public HTTP responses.
 */
export interface RedisReadinessReport {
  status: "ready" | "not_ready";
  category: "REDIS_AVAILABLE" | "REDIS_UNAVAILABLE" | "REDIS_TIMEOUT";
  latencyMs?: number;
  message?: string;
}

export interface CheckRedisReadinessOptions {
  timeoutMs?: number;
  client?: Redis;
}

/**
 * Performs a bounded readiness check against Redis using PING.
 * Returns safe categorical status without leaking connection string, host, port, DB index, or secrets.
 *
 * @param options - optional timeoutMs (default 2000ms) and custom client
 */
export async function checkRedisReadiness(
  options: CheckRedisReadinessOptions = {},
): Promise<RedisReadinessReport> {
  const timeoutMs = options.timeoutMs ?? 2000;
  const startTime = Date.now();

  try {
    const client = options.client ?? getRedisClient();

    // Bound the PING operation with a timeout promise
    let timeoutHandle: NodeJS.Timeout | undefined;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutHandle = setTimeout(() => {
        reject(new Error("REDIS_TIMEOUT"));
      }, timeoutMs);
    });

    const pingPromise = (async () => {
      const response = await client.ping();
      return response;
    })();

    const result = await Promise.race([pingPromise, timeoutPromise]);
    if (timeoutHandle) clearTimeout(timeoutHandle);

    const latencyMs = Date.now() - startTime;

    if (result === "PONG") {
      return {
        status: "ready",
        category: "REDIS_AVAILABLE",
        latencyMs,
      };
    }

    return {
      status: "not_ready",
      category: "REDIS_UNAVAILABLE",
      message: "Unexpected response from Redis ping",
    };
  } catch (err) {
    const isTimeout = err instanceof Error && err.message === "REDIS_TIMEOUT";
    return {
      status: "not_ready",
      category: isTimeout ? "REDIS_TIMEOUT" : "REDIS_UNAVAILABLE",
      message: isTimeout ? "Redis ping timed out" : "Redis is unreachable or connection closed",
    };
  }
}

/**
 * Sanitizes Redis diagnostics, redacting host:port, connection URLs, credentials, tokens, cookies, paths, and secrets.
 */
export function sanitizeRedisDiagnostic(diagnostic: unknown): string {
  if (!diagnostic) return "";
  let message = typeof diagnostic === "string" ? diagnostic : diagnostic instanceof Error ? diagnostic.message : String(diagnostic);

  // Redact redis:// and rediss:// URLs
  message = message.replace(/rediss?:\/\/[^\s@]+@/gi, "redis://[REDACTED_AUTH]@");
  message = message.replace(/rediss?:\/\/[^\s"',)]+/gi, "[REDACTED_REDIS_URL]");

  // Redact postgresql:// URLs
  message = message.replace(/postgres(?:ql)?:\/\/[^\s@]+@/gi, "postgresql://[REDACTED_AUTH]@");
  message = message.replace(/postgres(?:ql)?:\/\/[^\s"',)]+/gi, "[REDACTED_DB_URL]");

  // Redact database names
  message = message.replace(/\baura_capital_[a-zA-Z0-9_-]+\b/gi, "[REDACTED_DB_NAME]");

  // Redact JWT tokens
  message = message.replace(/eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/g, "[REDACTED_JWT]");

  // Redact Bearer tokens
  message = message.replace(/Bearer\s+[a-zA-Z0-9._-]+/gi, "Bearer [REDACTED_TOKEN]");

  // Redact Cookie values
  message = message.replace(/\b(aura_refresh_token|connect\.sid|session|cookie)=([^\s;,"']+)/gi, "$1=[REDACTED_COOKIE]");

  // Redact Password / secret parameters
  message = message.replace(/\b(password|passwd|secret|token|apiKey|keySecret)=([^\s&,;"']+)/gi, "$1=[REDACTED_SECRET]");

  // Redact Redis key values (including dotted IPv4 source and HMAC digests)
  message = message.replace(/\b(?:aura|rl:v1):[a-zA-Z0-9_:.\-@]+\b/g, "[REDACTED_REDIS_KEY]");

  // Redact Windows absolute file paths
  message = message.replace(/\b[a-zA-Z]:\\(?:[^\\/:*?"<>|\r\n\s]+\\)*[^\\/:*?"<>|\r\n\s]*/g, "[REDACTED_PATH]");

  // Redact POSIX absolute file paths
  message = message.replace(/(?:\/(?:Users|home|var|tmp|etc|app|usr))\/(?:[^\s"':;,]+)/g, "[REDACTED_PATH]");

  // Redact host:port pairs (IPv4, IPv6, localhost, custom hostnames)
  message = message.replace(/\b(?:localhost|127\.0\.0\.1|0\.0\.0\.0|(?:\d{1,3}\.){3}\d{1,3}|(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}):(\d{2,5})\b/gi, "[REDACTED_HOST:PORT]");
  message = message.replace(/(?:\[[0-9a-fA-F:]+\]|::1):(\d{2,5})\b/gi, "[REDACTED_HOST:PORT]");

  return message;
}
