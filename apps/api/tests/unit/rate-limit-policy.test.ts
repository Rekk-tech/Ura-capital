import { describe, it, expect, beforeEach } from "vitest";
import {
  evaluateLoginPolicy,
  evaluateRegisterPolicy,
  evaluateRefreshPolicy,
  incrementLoginFailure,
  clearLoginFailureCounters,
} from "../../src/modules/auth/rate-limit/rate-limit.policy.js";
import {
  buildRateLimitKey,
  KEY_SCOPES,
  KEY_ENDPOINTS,
} from "../../src/modules/auth/rate-limit/rate-limit.keys.js";
import type { LoginPolicy, RegisterPolicy, RefreshPolicy } from "../../src/modules/auth/rate-limit/rate-limit.config.js";
import type { IRateLimitStore } from "../../src/modules/auth/rate-limit/rate-limit.store.js";

/**
 * In-memory mock store for unit testing policy logic without Redis.
 */
class MockRateLimitStore implements IRateLimitStore {
  private data = new Map<string, { value: number; ttl: number; expiresAt: number }>();
  private cooldowns = new Map<string, number>();

  async increment(key: string, windowSec: number): Promise<number> {
    const existing = this.data.get(key);
    const now = Date.now();
    if (existing && existing.expiresAt > now) {
      existing.value++;
      return existing.value;
    }
    this.data.set(key, { value: 1, ttl: windowSec, expiresAt: now + windowSec * 1000 });
    return 1;
  }

  async getCount(key: string): Promise<number> {
    const existing = this.data.get(key);
    if (existing && existing.expiresAt > Date.now()) {
      return existing.value;
    }
    return 0;
  }

  async setCooldown(key: string, durationSec: number): Promise<void> {
    this.cooldowns.set(key, durationSec);
  }

  async getCooldownTTL(key: string): Promise<number> {
    const ttl = this.cooldowns.get(key);
    return ttl && ttl > 0 ? ttl : -1;
  }

  async delete(key: string): Promise<void> {
    this.data.delete(key);
    this.cooldowns.delete(key);
  }

  async deleteByPrefix(prefix: string): Promise<void> {
    for (const key of this.data.keys()) {
      if (key.startsWith(prefix)) this.data.delete(key);
    }
    for (const key of this.cooldowns.keys()) {
      if (key.startsWith(prefix)) this.cooldowns.delete(key);
    }
  }

  reset(): void {
    this.data.clear();
    this.cooldowns.clear();
  }
}

const testLoginPolicy: LoginPolicy = {
  identitySource: { maxAttempts: 3, windowSec: 600, cooldownSec: 900 },
  sourceCeiling: { maxAttempts: 10, windowSec: 600, cooldownSec: 900 },
  escalatedCooldownSec: 1800,
  escalationWindowSec: 3600,
};

const testRegisterPolicy: RegisterPolicy = {
  source: { maxAttempts: 3, windowSec: 900, cooldownSec: 1800 },
  identitySource: { maxAttempts: 2, windowSec: 3600, cooldownSec: 1800 },
};

const testRefreshPolicy: RefreshPolicy = {
  source: { maxAttempts: 10, windowSec: 600, cooldownSec: 900 },
  malformedSource: { maxAttempts: 3, windowSec: 600, cooldownSec: 900 },
};

describe("Rate Limit Policy", () => {
  let store: MockRateLimitStore;

  beforeEach(() => {
    store = new MockRateLimitStore();
  });

  describe("evaluateLoginPolicy", () => {
    it("allows requests below threshold", async () => {
      const result = await evaluateLoginPolicy("1.2.3.4", "digest123", store, testLoginPolicy);
      expect(result.allowed).toBe(true);
    });

    it("denies when identity+source failure counter exceeds threshold", async () => {
      // Pre-fill identity+source counter using standard key builder
      const key = buildRateLimitKey(KEY_ENDPOINTS.LOGIN, KEY_SCOPES.IDENTITY_SOURCE, "1.2.3.4:digest123");
      for (let i = 0; i < 3; i++) {
        await store.increment(key, 600);
      }

      const result = await evaluateLoginPolicy("1.2.3.4", "digest123", store, testLoginPolicy);
      expect(result.allowed).toBe(false);
      expect(result.retryAfterSec).toBeDefined();
      expect(result.retryAfterSec).toBeGreaterThan(0);
    });

    it("denies when source ceiling counter exceeds threshold", async () => {
      const key = buildRateLimitKey(KEY_ENDPOINTS.LOGIN, KEY_SCOPES.SOURCE, "1.2.3.4");
      for (let i = 0; i < 10; i++) {
        await store.increment(key, 600);
      }

      const result = await evaluateLoginPolicy("1.2.3.4", null, store, testLoginPolicy);
      expect(result.allowed).toBe(false);
      expect(result.retryAfterSec).toBeDefined();
    });

    it("denies immediately when cooldown is active", async () => {
      const cdKey = buildRateLimitKey(KEY_ENDPOINTS.LOGIN, KEY_SCOPES.COOLDOWN, "1.2.3.4:digest123");
      await store.setCooldown(cdKey, 300);

      const result = await evaluateLoginPolicy("1.2.3.4", "digest123", store, testLoginPolicy);
      expect(result.allowed).toBe(false);
      expect(result.retryAfterSec).toBe(300);
    });

    it("handles null identity digest (no email in body)", async () => {
      const result = await evaluateLoginPolicy("1.2.3.4", null, store, testLoginPolicy);
      expect(result.allowed).toBe(true);
    });

    it("provides Retry-After when denied", async () => {
      const cdKey = buildRateLimitKey(KEY_ENDPOINTS.LOGIN, KEY_SCOPES.COOLDOWN, "1.2.3.4");
      await store.setCooldown(cdKey, 450);

      const result = await evaluateLoginPolicy("1.2.3.4", null, store, testLoginPolicy);
      expect(result.allowed).toBe(false);
      expect(result.retryAfterSec).toBe(450);
    });
  });

  describe("incrementLoginFailure", () => {
    it("increments identity+source failure counter when identity digest is provided", async () => {
      await incrementLoginFailure("1.2.3.4", "digest123", store, testLoginPolicy);
      const key = buildRateLimitKey(KEY_ENDPOINTS.LOGIN, KEY_SCOPES.IDENTITY_SOURCE, "1.2.3.4:digest123");
      const idCount = await store.getCount(key);
      expect(idCount).toBe(1);
    });

    it("does not throw when identity digest is null", async () => {
      await expect(incrementLoginFailure("1.2.3.4", null, store, testLoginPolicy)).resolves.not.toThrow();
    });
  });

  describe("clearLoginFailureCounters", () => {
    it("clears identity+source counters", async () => {
      const key = buildRateLimitKey(KEY_ENDPOINTS.LOGIN, KEY_SCOPES.IDENTITY_SOURCE, "1.2.3.4:digest123");
      await store.increment(key, 600);
      expect(await store.getCount(key)).toBe(1);

      await clearLoginFailureCounters("1.2.3.4", "digest123", store);
      expect(await store.getCount(key)).toBe(0);
    });
  });

  describe("evaluateRegisterPolicy", () => {
    it("allows first request", async () => {
      const result = await evaluateRegisterPolicy("1.2.3.4", "digest123", store, testRegisterPolicy);
      expect(result.allowed).toBe(true);
    });

    it("denies when source counter exceeds threshold", async () => {
      // Make enough requests to exceed the limit
      for (let i = 0; i < 3; i++) {
        await evaluateRegisterPolicy("1.2.3.4", `digest${i}`, store, testRegisterPolicy);
      }
      const result = await evaluateRegisterPolicy("1.2.3.4", "digestNew", store, testRegisterPolicy);
      expect(result.allowed).toBe(false);
      expect(result.retryAfterSec).toBeDefined();
    });

    it("denies when identity+source counter exceeds threshold", async () => {
      for (let i = 0; i < 2; i++) {
        await evaluateRegisterPolicy("1.2.3.4", "sameDigest", store, testRegisterPolicy);
      }
      const result = await evaluateRegisterPolicy("1.2.3.4", "sameDigest", store, testRegisterPolicy);
      expect(result.allowed).toBe(false);
    });

    it("provides Retry-After when denied", async () => {
      const cdKey = buildRateLimitKey(KEY_ENDPOINTS.REGISTER, KEY_SCOPES.COOLDOWN, "1.2.3.4");
      await store.setCooldown(cdKey, 600);

      const result = await evaluateRegisterPolicy("1.2.3.4", null, store, testRegisterPolicy);
      expect(result.allowed).toBe(false);
      expect(result.retryAfterSec).toBe(600);
    });
  });

  describe("evaluateRefreshPolicy", () => {
    it("allows requests below threshold with cookie", async () => {
      const result = await evaluateRefreshPolicy("1.2.3.4", true, store, testRefreshPolicy);
      expect(result.allowed).toBe(true);
    });

    it("allows requests below threshold without cookie", async () => {
      const result = await evaluateRefreshPolicy("1.2.3.4", false, store, testRefreshPolicy);
      expect(result.allowed).toBe(true);
    });

    it("denies when malformed counter exceeds threshold (no cookie)", async () => {
      for (let i = 0; i < 3; i++) {
        await evaluateRefreshPolicy("1.2.3.4", false, store, testRefreshPolicy);
      }
      const result = await evaluateRefreshPolicy("1.2.3.4", false, store, testRefreshPolicy);
      expect(result.allowed).toBe(false);
    });

    it("denies when source counter exceeds threshold", async () => {
      for (let i = 0; i < 10; i++) {
        await evaluateRefreshPolicy("1.2.3.4", true, store, testRefreshPolicy);
      }
      const result = await evaluateRefreshPolicy("1.2.3.4", true, store, testRefreshPolicy);
      expect(result.allowed).toBe(false);
    });

    it("does not create permanent lockout", async () => {
      // After cooldown, requests should be allowed again
      for (let i = 0; i < 20; i++) {
        await evaluateRefreshPolicy("1.2.3.4", true, store, testRefreshPolicy);
      }
      const denied = await evaluateRefreshPolicy("1.2.3.4", true, store, testRefreshPolicy);
      expect(denied.allowed).toBe(false);

      // Clear cooldown (simulating expiry)
      store.reset();
      const allowed = await evaluateRefreshPolicy("1.2.3.4", true, store, testRefreshPolicy);
      expect(allowed.allowed).toBe(true);
    });
  });
});
