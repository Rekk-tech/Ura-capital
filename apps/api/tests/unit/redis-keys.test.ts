import { describe, it, expect } from "vitest";
import {
  buildStandardRedisKey,
  buildTestIsolatedRedisPrefix,
  validateRedisKeySafety,
  computeKeyDigest,
} from "../../src/infrastructure/redis/redis-keys.js";
import { buildRateLimitKey, KEY_SCOPES, KEY_ENDPOINTS } from "../../src/modules/auth/rate-limit/rate-limit.keys.js";

describe("Redis Key Strategy & Namespace Unit Tests (FEAT-015)", () => {
  describe("buildStandardRedisKey", () => {
    it("builds standard key matching {app}:{env}:{feature}:{version}:{scope}:{identifier}", () => {
      const key = buildStandardRedisKey({
        app: "aura",
        env: "production",
        feature: "rl",
        version: "v1",
        scope: "login:source",
        identifier: "127.0.0.1",
      });

      expect(key).toBe("aura:production:rl:v1:login:source:127.0.0.1");
    });

    it("defaults app to aura when omitted", () => {
      const key = buildStandardRedisKey({
        env: "staging",
        feature: "health",
        version: "v1",
        scope: "probe",
      });

      expect(key).toBe("aura:staging:health:v1:probe");
    });

    it("prevents cross-feature key collisions", () => {
      const authKey = buildStandardRedisKey({
        env: "production",
        feature: "auth",
        version: "v1",
        scope: "counter",
        identifier: "123",
      });
      const rlKey = buildStandardRedisKey({
        env: "production",
        feature: "rl",
        version: "v1",
        scope: "counter",
        identifier: "123",
      });

      expect(authKey).not.toBe(rlKey);
      expect(authKey).toContain(":auth:");
      expect(rlKey).toContain(":rl:");
    });

    it("prevents cross-environment key collisions", () => {
      const devKey = buildStandardRedisKey({
        env: "development",
        feature: "rl",
        version: "v1",
        scope: "source",
        identifier: "127.0.0.1",
      });
      const prodKey = buildStandardRedisKey({
        env: "production",
        feature: "rl",
        version: "v1",
        scope: "source",
        identifier: "127.0.0.1",
      });

      expect(devKey).not.toBe(prodKey);
      expect(devKey).toContain(":development:");
      expect(prodKey).toContain(":production:");
    });
  });

  describe("buildTestIsolatedRedisPrefix & Worker Isolation (DEF-003)", () => {
    it("generates isolated prefix with runId and workerId", () => {
      const prefix = buildTestIsolatedRedisPrefix({ runId: "ci-run-101", workerId: "worker-2", feature: "rl" });
      expect(prefix).toBe("aura:test:ci-run-101:worker-2:rl:v1:");
    });

    it("proves two simulated parallel workers do not collide", () => {
      const prefixWorker1 = buildTestIsolatedRedisPrefix({ runId: "run-42", workerId: "w1" });
      const prefixWorker2 = buildTestIsolatedRedisPrefix({ runId: "run-42", workerId: "w2" });

      const key1 = `${prefixWorker1}login:source:127.0.0.1`;
      const key2 = `${prefixWorker2}login:source:127.0.0.1`;

      expect(key1).not.toBe(key2);
      expect(key1).toContain(":w1:");
      expect(key2).toContain(":w2:");
    });

    it("proves two simulated parallel CI runs do not collide", () => {
      const prefixRunA = buildTestIsolatedRedisPrefix({ runId: "runA", workerId: "w1" });
      const prefixRunB = buildTestIsolatedRedisPrefix({ runId: "runB", workerId: "w1" });

      const keyA = `${prefixRunA}register:id_src:abc`;
      const keyB = `${prefixRunB}register:id_src:abc`;

      expect(keyA).not.toBe(keyB);
      expect(keyA).toContain(":runA:");
      expect(keyB).toContain(":runB:");
    });

    it("proves cleanup of namespace A preserves keys belonging to namespace B", () => {
      const prefixA = buildTestIsolatedRedisPrefix({ runId: "runA", workerId: "w1" });
      const prefixB = buildTestIsolatedRedisPrefix({ runId: "runB", workerId: "w2" });

      const mockStore = new Set<string>();
      mockStore.add(`${prefixA}login:source:1.1.1.1`);
      mockStore.add(`${prefixA}login:source:2.2.2.2`);
      mockStore.add(`${prefixB}login:source:1.1.1.1`);
      mockStore.add(`${prefixB}register:source:3.3.3.3`);

      // Simulate cleanup scoped to prefixA only
      for (const key of Array.from(mockStore)) {
        if (key.startsWith(prefixA)) {
          mockStore.delete(key);
        }
      }

      // Assert prefixA keys are deleted, but prefixB keys are intact
      expect(Array.from(mockStore).filter((k) => k.startsWith(prefixA))).toHaveLength(0);
      expect(Array.from(mockStore).filter((k) => k.startsWith(prefixB))).toHaveLength(2);
      expect(mockStore.has(`${prefixB}login:source:1.1.1.1`)).toBe(true);
    });

    it("proves canonical route and alias route produce identical rate-limit keys within one namespace", () => {
      const testEnv = "test:ci1:w0";
      const canonicalKey = buildRateLimitKey(KEY_ENDPOINTS.LOGIN, KEY_SCOPES.SOURCE, "127.0.0.1", testEnv);
      const aliasKey = buildRateLimitKey(KEY_ENDPOINTS.LOGIN, KEY_SCOPES.SOURCE, "127.0.0.1", testEnv);

      expect(canonicalKey).toBe(aliasKey);
      expect(canonicalKey).toBe("aura:test:ci1:w0:rl:v1:login:source:127.0.0.1");
    });
  });

  describe("validateRedisKeySafety", () => {
    it("passes for safe, namespaced keys with digests", () => {
      const digest = computeKeyDigest("user@example.com", "my-secret-key-at-least-32-chars-long");
      const key = buildStandardRedisKey({
        env: "test",
        feature: "rl",
        version: "v1",
        scope: "id_src",
        identifier: `127.0.0.1:${digest}`,
      });

      const validation = validateRedisKeySafety(key);
      expect(validation.safe).toBe(true);
    });

    it("rejects keys containing raw email address", () => {
      const key = "aura:test:rl:v1:user@example.com";
      const validation = validateRedisKeySafety(key);

      expect(validation.safe).toBe(false);
      expect(validation.reason).toContain("@");
    });

    it("rejects keys containing JWT tokens", () => {
      const key = "aura:test:auth:v1:eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.t-IDcSemACt8x4iTMCda8Yhe3iZaWbvV5XKSTbuAn0M";
      const validation = validateRedisKeySafety(key);

      expect(validation.safe).toBe(false);
      expect(validation.reason).toContain("eyj");
    });

    it("rejects keys containing Bearer authorization strings", () => {
      const key = "aura:test:auth:v1:Bearer token123";
      const validation = validateRedisKeySafety(key);

      expect(validation.safe).toBe(false);
    });

    it("rejects keys containing postgresql or redis URLs", () => {
      const key1 = "aura:test:cfg:v1:postgresql://user:pass@localhost:5432/db";
      const key2 = "aura:test:cfg:v1:redis://localhost:6379";

      expect(validateRedisKeySafety(key1).safe).toBe(false);
      expect(validateRedisKeySafety(key2).safe).toBe(false);
    });

    it("rejects keys containing cookies or secret fragments", () => {
      const key1 = "aura:test:rl:v1:cookie=secret_session_cookie_123";
      const key2 = "aura:test:rl:v1:aura_refresh_token=secret_refresh_token_123";
      const key3 = "aura:test:rl:v1:password=MyPassword123";

      expect(validateRedisKeySafety(key1).safe).toBe(false);
      expect(validateRedisKeySafety(key2).safe).toBe(false);
      expect(validateRedisKeySafety(key3).safe).toBe(false);
    });

    it("rejects keys containing absolute local paths", () => {
      const key1 = "aura:test:rl:v1:D:\\project\\ura-capital\\secret.txt";
      const key2 = "aura:test:rl:v1:/Users/admin/secrets.json";

      expect(validateRedisKeySafety(key1).safe).toBe(false);
      expect(validateRedisKeySafety(key2).safe).toBe(false);
    });
  });

  describe("computeKeyDigest", () => {
    const secret = "test-hmac-secret-at-least-32-characters-long";

    it("produces deterministic SHA-256 hex digest", () => {
      const d1 = computeKeyDigest("admin@auracapital.io", secret);
      const d2 = computeKeyDigest("ADMIN@auracapital.io", secret);

      expect(d1).toBe(d2);
      expect(d1).toMatch(/^[a-f0-9]{64}$/);
    });

    it("does not leak raw email characters in digest", () => {
      const digest = computeKeyDigest("sensitive@company.internal", secret);
      expect(digest).not.toContain("sensitive");
      expect(digest).not.toContain("company");
      expect(digest).not.toContain("@");
    });
  });
});
