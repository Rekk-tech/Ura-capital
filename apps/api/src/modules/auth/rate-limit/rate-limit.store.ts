import type Redis from "ioredis";
import { getRedisClient } from "../../../infrastructure/redis/redis.js";

/**
 * Error thrown when Redis is unavailable or a Redis operation fails.
 */
export class RedisUnavailableError extends Error {
  constructor(message = "Redis is unavailable") {
    super(message);
    this.name = "RedisUnavailableError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Interface for rate-limit storage operations.
 */
export interface IRateLimitStore {
  increment(key: string, windowSec: number): Promise<number>;
  getCount(key: string): Promise<number>;
  setCooldown(key: string, durationSec: number): Promise<void>;
  getCooldownTTL(key: string): Promise<number>;
  delete(key: string): Promise<void>;
  deleteByPrefix(prefix: string): Promise<void>;
}

/**
 * Redis-backed transient counter store for rate limiting.
 * All operations are multi-instance safe through shared Redis state.
 * Throws RedisUnavailableError on any Redis failure.
 */
export class RateLimitStore implements IRateLimitStore {
  constructor(private readonly redis: Redis = getRedisClient()) {}

  /**
   * Atomically increment a counter and set expiry on first creation.
   * Returns the new count after increment.
   */
  async increment(key: string, windowSec: number): Promise<number> {
    try {
      const pipeline = this.redis.multi();
      pipeline.incr(key);
      pipeline.expire(key, windowSec, "NX"); // Set expiry only if not already set
      const results = await pipeline.exec();

      if (!results || results.length === 0) {
        throw new RedisUnavailableError("Redis pipeline returned empty results");
      }

      const firstResult = results[0];
      if (!firstResult) {
        throw new RedisUnavailableError("Redis pipeline first result is empty");
      }

      // firstResult = [error, count] from INCR
      const [incrErr, count] = firstResult;
      if (incrErr) {
        throw new RedisUnavailableError("Redis INCR failed");
      }

      return count as number;
    } catch (err) {
      if (err instanceof RedisUnavailableError) throw err;
      throw new RedisUnavailableError("Redis operation failed");
    }
  }

  /**
   * Get the current count for a key.
   * Returns 0 if key does not exist.
   */
  async getCount(key: string): Promise<number> {
    try {
      const val = await this.redis.get(key);
      return val ? parseInt(val, 10) : 0;
    } catch {
      throw new RedisUnavailableError("Redis GET failed");
    }
  }

  /**
   * Set a cooldown key with expiry.
   */
  async setCooldown(key: string, durationSec: number): Promise<void> {
    try {
      await this.redis.set(key, "1", "EX", durationSec);
    } catch {
      throw new RedisUnavailableError("Redis SET cooldown failed");
    }
  }

  /**
   * Check if a cooldown is active.
   * Returns remaining TTL in seconds, or -1 if no cooldown.
   */
  async getCooldownTTL(key: string): Promise<number> {
    try {
      const ttl = await this.redis.ttl(key);
      // ttl = -2 means key doesn't exist, -1 means no expiry set
      return ttl > 0 ? ttl : -1;
    } catch {
      throw new RedisUnavailableError("Redis TTL check failed");
    }
  }

  /**
   * Delete a key. Used for counter reset on successful login.
   */
  async delete(key: string): Promise<void> {
    try {
      await this.redis.del(key);
    } catch {
      // Non-critical — best effort counter reset
    }
  }

  /**
   * Delete multiple keys by pattern. Used for test cleanup.
   */
  async deleteByPrefix(prefix: string): Promise<void> {
    try {
      const keys = await this.redis.keys(`${prefix}*`);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } catch {
      // Best effort cleanup
    }
  }
}
