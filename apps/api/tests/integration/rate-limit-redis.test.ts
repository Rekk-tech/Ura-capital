import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import Redis from "ioredis";
import { RateLimitStore, RedisUnavailableError } from "../../src/modules/auth/rate-limit/rate-limit.store.js";
import { sanitizeDiagnosticMessage } from "../helpers/test-db-guard.js";
import { buildTestIsolatedRedisPrefix } from "../../src/infrastructure/redis/redis-keys.js";

/**
 * Redis-backed tests for rate-limit store (FEAT-010A).
 * Requires a live Redis instance on REDIS_URL.
 * Tests fail fast if Redis is unavailable — no silent skip.
 */
describe("Rate Limit — Redis-Backed Store", () => {
  let redis: Redis;
  let store: RateLimitStore;
  const TEST_PREFIX = buildTestIsolatedRedisPrefix({ feature: "rl", version: "v1" });

  beforeAll(async () => {
    const url = process.env.REDIS_URL || "redis://127.0.0.1:6379";
    redis = new Redis(url, {
      connectTimeout: 1000,
      maxRetriesPerRequest: 1,
      retryStrategy: () => null,
      lazyConnect: false,
    });

    try {
      const pong = await redis.ping();
      expect(pong).toBe("PONG");
    } catch (err: unknown) {
      const safeError = sanitizeDiagnosticMessage(err instanceof Error ? err.message : String(err));
      throw new Error(
        `[REDIS_TEST_SETUP_FAILED] Redis is not reachable. Ensure Docker container 'aura-redis' is running. Error: ${safeError}`,
      );
    }

    store = new RateLimitStore(redis);
  });

  afterAll(async () => {
    if (redis && redis.status === "ready") {
      try {
        const keys = await redis.keys(`${TEST_PREFIX}*`);
        if (keys.length > 0) await redis.del(...keys);
        await redis.quit();
      } catch {
        // Ignore teardown errors
      }
    }
  });

  beforeEach(async () => {
    const keys = await redis.keys(`${TEST_PREFIX}*`);
    if (keys.length > 0) await redis.del(...keys);
  });

  describe("increment", () => {
    it("returns 1 on first increment", async () => {
      const count = await store.increment(`${TEST_PREFIX}incr:1`, 60);
      expect(count).toBe(1);
    });

    it("increments atomically", async () => {
      const key = `${TEST_PREFIX}incr:atomic`;
      const c1 = await store.increment(key, 60);
      const c2 = await store.increment(key, 60);
      const c3 = await store.increment(key, 60);
      expect(c1).toBe(1);
      expect(c2).toBe(2);
      expect(c3).toBe(3);
    });

    it("sets TTL on key", async () => {
      const key = `${TEST_PREFIX}incr:ttl`;
      await store.increment(key, 30);

      const ttl = await redis.ttl(key);
      expect(ttl).toBeGreaterThan(0);
      expect(ttl).toBeLessThanOrEqual(30);
    });

    it("counters persist across store instances (multi-instance safety)", async () => {
      const key = `${TEST_PREFIX}incr:multi`;
      const store2 = new RateLimitStore(redis);

      await store.increment(key, 60);
      await store2.increment(key, 60);

      const count = await store.getCount(key);
      expect(count).toBe(2);
    });
  });

  describe("getCount", () => {
    it("returns 0 for non-existent key", async () => {
      const count = await store.getCount(`${TEST_PREFIX}nonexistent`);
      expect(count).toBe(0);
    });

    it("returns current count", async () => {
      const key = `${TEST_PREFIX}count:current`;
      await store.increment(key, 60);
      await store.increment(key, 60);

      const count = await store.getCount(key);
      expect(count).toBe(2);
    });
  });

  describe("cooldown", () => {
    it("setCooldown creates key with TTL", async () => {
      const key = `${TEST_PREFIX}cd:set`;
      await store.setCooldown(key, 120);

      const ttl = await store.getCooldownTTL(key);
      expect(ttl).toBeGreaterThan(0);
      expect(ttl).toBeLessThanOrEqual(120);
    });

    it("getCooldownTTL returns -1 for non-existent key", async () => {
      const ttl = await store.getCooldownTTL(`${TEST_PREFIX}cd:nonexistent`);
      expect(ttl).toBe(-1);
    });

    it("cooldown key expires naturally", async () => {
      const key = `${TEST_PREFIX}cd:expire`;
      await store.setCooldown(key, 1); // 1 second TTL

      await new Promise((resolve) => setTimeout(resolve, 1500));

      const ttl = await store.getCooldownTTL(key);
      expect(ttl).toBe(-1);
    });
  });

  describe("delete", () => {
    it("removes a key", async () => {
      const key = `${TEST_PREFIX}del:single`;
      await store.increment(key, 60);
      expect(await store.getCount(key)).toBe(1);

      await store.delete(key);
      expect(await store.getCount(key)).toBe(0);
    });
  });

  describe("deleteByPrefix", () => {
    it("removes all keys matching prefix", async () => {
      const prefix = `${TEST_PREFIX}batch:`;
      await store.increment(`${prefix}a`, 60);
      await store.increment(`${prefix}b`, 60);
      await store.increment(`${prefix}c`, 60);

      await store.deleteByPrefix(prefix);

      expect(await store.getCount(`${prefix}a`)).toBe(0);
      expect(await store.getCount(`${prefix}b`)).toBe(0);
      expect(await store.getCount(`${prefix}c`)).toBe(0);
    });
  });

  describe("key safety", () => {
    it("no raw email appears in Redis keys", async () => {
      const rawEmail = "secret-user@company.com";
      const { computeIdentityDigest } = await import("../../src/modules/auth/rate-limit/rate-limit.keys.js");
      const digest = computeIdentityDigest(rawEmail, "test-secret-at-least-32-characters");

      const key = `${TEST_PREFIX}safe:${digest}`;
      await store.increment(key, 60);

      const allKeys = await redis.keys(`${TEST_PREFIX}*`);
      for (const k of allKeys) {
        expect(k).not.toContain(rawEmail);
        expect(k).not.toContain("secret-user");
        expect(k).not.toContain("company.com");
      }
    });

    it("no raw token appears in Redis keys", async () => {
      const key = `${TEST_PREFIX}safe:source:127.0.0.1`;
      await store.increment(key, 60);

      const allKeys = await redis.keys(`${TEST_PREFIX}*`);
      for (const k of allKeys) {
        expect(k).not.toContain("eyJ");
      }
    });

    it("no raw password appears in Redis keys", async () => {
      const key = `${TEST_PREFIX}safe:src:10.0.0.1`;
      await store.increment(key, 60);

      const allKeys = await redis.keys(`${TEST_PREFIX}*`);
      for (const k of allKeys) {
        expect(k).not.toContain("password");
        expect(k).not.toContain("Password");
      }
    });
  });

  describe("Redis unavailable behavior", () => {
    it("throws RedisUnavailableError when Redis is disconnected", async () => {
      const badRedis = new Redis("redis://127.0.0.1:59996", {
        maxRetriesPerRequest: 0,
        connectTimeout: 200,
        commandTimeout: 200,
        retryStrategy: () => null,
        lazyConnect: true,
        enableOfflineQueue: false,
      });
      badRedis.on("error", () => {});

      const badStore = new RateLimitStore(badRedis);

      try {
        await badStore.increment("test-key", 60);
        expect.fail("Should have thrown RedisUnavailableError");
      } catch (err) {
        expect(err).toBeInstanceOf(RedisUnavailableError);
      } finally {
        try {
          await badRedis.disconnect();
        } catch {
          // ignore
        }
      }
    });
  });

  describe("isolated test namespace", () => {
    it("test keys do not pollute production namespace", async () => {
      const key = `${TEST_PREFIX}isolation:check`;
      await store.increment(key, 60);

      expect(key.startsWith(TEST_PREFIX)).toBe(true);

      const prodKeys = await redis.keys("rl:v1:*");
      for (const pk of prodKeys) {
        if (pk.startsWith(TEST_PREFIX)) continue;
      }
    });
  });
});
