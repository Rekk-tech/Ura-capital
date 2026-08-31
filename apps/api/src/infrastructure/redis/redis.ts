import { Redis, type RedisOptions } from "ioredis";
import { getEnv } from "../config/env.js";
import { logger } from "../logging/logger.js";

let redisInstance: Redis | null = null;

/**
 * Creates an isolated Redis client instance.
 * Used for multi-instance verification, worker isolation, or test suites.
 */
export function createIsolatedRedisClient(customUrl?: string, customOptions?: RedisOptions): Redis {
  let redisUrl = customUrl;
  if (!redisUrl) {
    try {
      const env = getEnv();
      redisUrl = env.REDIS_URL || process.env.REDIS_URL || "redis://127.0.0.1:6379";
    } catch {
      redisUrl = process.env.REDIS_URL || "redis://127.0.0.1:6379";
    }
  }

  const client = new Redis(redisUrl, {
    maxRetriesPerRequest: 1,
    lazyConnect: false,
    connectTimeout: 5000,
    commandTimeout: 3000,
    retryStrategy(times: number) {
      if (times > 3) return null; // Stop retrying after 3 attempts
      return Math.min(times * 200, 1000);
    },
    ...customOptions,
  });

  client.on("error", () => {
    // Sanitized log — no URL, no key material, no secrets
    logger.error("Redis connection error", {
      category: "REDIS_ERROR",
    });
  });

  return client;
}

/**
 * Returns a connected Redis client singleton.
 */
export function getRedisClient(): Redis {
  if (!redisInstance || redisInstance.status === "end") {
    redisInstance = createIsolatedRedisClient();
  }

  return redisInstance;
}

/**
 * Disconnect and reset Redis client.
 * Used for graceful shutdown and test cleanup.
 */
export async function disconnectRedis(): Promise<void> {
  if (redisInstance) {
    try {
      await redisInstance.quit();
    } catch {
      // Ignore disconnect errors during cleanup
    }
    redisInstance = null;
  }
}

/**
 * Check if Redis is reachable via PING.
 */
export async function isRedisAvailable(): Promise<boolean> {
  try {
    const client = getRedisClient();
    const result = await client.ping();
    return result === "PONG";
  } catch {
    return false;
  }
}

/**
 * Reset the singleton for test isolation.
 */
export function resetRedisClient(): void {
  redisInstance = null;
}
