import { describe, it, expect } from "vitest";
import type { Request } from "express";
import {
  COMMUNITY_RATE_LIMIT_POLICIES,
  validateCommunityRateLimitSecret,
  type CommunityRateLimitOperation,
} from "../../src/modules/community/community-rate-limit.config.js";
import {
  computeCommunityIdentifierDigest,
  resolveCommunitySource,
  buildCommunityRateLimitKey,
} from "../../src/modules/community/community-rate-limit.keys.js";

describe("FEAT-045 Community Rate Limiting Configuration & Keys (Unit)", () => {
  const validSecret = "aura-dev-community-rl-hmac-key-at-least-32-chars-long";
  const dummyEnv = {
    JWT_SECRET: "jwt-secret-at-least-32-chars-for-test-purposes",
    AUTH_ACCESS_TOKEN_SECRET: "access-secret-at-least-32-chars-for-test-purposes",
    AUTH_REFRESH_TOKEN_SECRET: "refresh-secret-at-least-32-chars-for-test-purposes",
    AUTH_RATE_LIMIT_KEY_SECRET: "auth-rate-limit-secret-32-chars-for-test-purposes",
  };

  // AC-018..AC-022: Canonical Rate Limit Thresholds
  describe("Canonical Operation Policies (AC-018..AC-022)", () => {
    it("matches exact human-approved thresholds for post create (10/user, 60/source per 10m) (AC-018)", () => {
      const policy = COMMUNITY_RATE_LIMIT_POLICIES.post_create;
      expect(policy.userMax).toBe(10);
      expect(policy.sourceMax).toBe(60);
      expect(policy.windowSec).toBe(600);
    });

    it("matches exact human-approved thresholds for comment create (30/user, 180/source per 10m) (AC-019)", () => {
      const policy = COMMUNITY_RATE_LIMIT_POLICIES.comment_create;
      expect(policy.userMax).toBe(30);
      expect(policy.sourceMax).toBe(180);
      expect(policy.windowSec).toBe(600);
    });

    it("matches exact human-approved thresholds for post delete (30/user, 180/source per 10m) (AC-020)", () => {
      const policy = COMMUNITY_RATE_LIMIT_POLICIES.post_delete;
      expect(policy.userMax).toBe(30);
      expect(policy.sourceMax).toBe(180);
      expect(policy.windowSec).toBe(600);
    });

    it("matches exact human-approved thresholds for comment delete (60/user, 300/source per 10m) (AC-021)", () => {
      const policy = COMMUNITY_RATE_LIMIT_POLICIES.comment_delete;
      expect(policy.userMax).toBe(60);
      expect(policy.sourceMax).toBe(300);
      expect(policy.windowSec).toBe(600);
    });

    it("matches exact human-approved thresholds for combined like/unlike mutations (120/user, 600/source per 10m) (AC-022)", () => {
      const policy = COMMUNITY_RATE_LIMIT_POLICIES.post_like_mutation;
      expect(policy.userMax).toBe(120);
      expect(policy.sourceMax).toBe(600);
      expect(policy.windowSec).toBe(600);
    });
  });

  // AC-015: Secret Validation & Anti-Reuse
  describe("Secret Validation & Anti-Reuse (AC-015)", () => {
    it("accepts a valid distinct secret of at least 32 characters", () => {
      expect(validateCommunityRateLimitSecret(validSecret, dummyEnv)).toBe(validSecret);
    });

    it("rejects empty or missing secret with no fallback", () => {
      expect(() => validateCommunityRateLimitSecret(undefined, dummyEnv)).toThrow(/is required/i);
      expect(() => validateCommunityRateLimitSecret("", dummyEnv)).toThrow(/is required/i);
      expect(() => validateCommunityRateLimitSecret("   ", dummyEnv)).toThrow(/is required/i);
    });

    it("rejects secrets shorter than 32 characters", () => {
      expect(() => validateCommunityRateLimitSecret("too-short-secret", dummyEnv)).toThrow(
        /at least 32 characters/i,
      );
    });

    it("rejects secret if it reuses JWT_SECRET", () => {
      expect(() =>
        validateCommunityRateLimitSecret(dummyEnv.JWT_SECRET, dummyEnv),
      ).toThrow(/must not reuse/i);
    });

    it("rejects secret if it reuses AUTH_ACCESS_TOKEN_SECRET", () => {
      expect(() =>
        validateCommunityRateLimitSecret(dummyEnv.AUTH_ACCESS_TOKEN_SECRET, dummyEnv),
      ).toThrow(/must not reuse/i);
    });

    it("rejects secret if it reuses AUTH_REFRESH_TOKEN_SECRET", () => {
      expect(() =>
        validateCommunityRateLimitSecret(dummyEnv.AUTH_REFRESH_TOKEN_SECRET, dummyEnv),
      ).toThrow(/must not reuse/i);
    });

    it("rejects secret if it reuses AUTH_RATE_LIMIT_KEY_SECRET", () => {
      expect(() =>
        validateCommunityRateLimitSecret(dummyEnv.AUTH_RATE_LIMIT_KEY_SECRET, dummyEnv),
      ).toThrow(/must not reuse/i);
    });
  });

  // AC-016, AC-030: Redis Key Strategy & Privacy
  describe("Redis Key Strategy & Privacy (AC-016, AC-030)", () => {
    it("produces deterministic 64-char HMAC digests without leaking raw values", () => {
      const digest1 = computeCommunityIdentifierDigest("user-12345", validSecret);
      const digest2 = computeCommunityIdentifierDigest("user-12345", validSecret);
      const digestDiff = computeCommunityIdentifierDigest("user-67890", validSecret);

      expect(digest1).toHaveLength(64);
      expect(digest1).toMatch(/^[0-9a-f]{64}$/);
      expect(digest1).toBe(digest2);
      expect(digest1).not.toBe(digestDiff);
      expect(digest1).not.toContain("user-12345");
    });

    it("builds canonical namespaced keys for all approved operations", () => {
      const operations: CommunityRateLimitOperation[] = [
        "post_create",
        "comment_create",
        "post_delete",
        "comment_delete",
        "post_like_mutation",
      ];

      for (const op of operations) {
        const userKey = buildCommunityRateLimitKey({
          operation: op,
          scope: "user",
          rawIdentifier: "user-uuid-1111",
          secret: validSecret,
          env: "development",
        });

        expect(userKey).toMatch(
          new RegExp(`^aura:development:community-rl:v1:${op}:user:[0-9a-f]{64}$`),
        );
        expect(userKey).not.toContain("user-uuid-1111");

        const sourceKey = buildCommunityRateLimitKey({
          operation: op,
          scope: "source",
          rawIdentifier: "192.168.1.100",
          secret: validSecret,
          env: "development",
        });

        expect(sourceKey).toMatch(
          new RegExp(`^aura:development:community-rl:v1:${op}:source:[0-9a-f]{64}$`),
        );
        expect(sourceKey).not.toContain("192.168.1.100");
      }
    });
  });

  // AC-023: Proxy Resolution Semantics
  describe("Proxy & Source Resolution (AC-023)", () => {
    it("ignores spoofed X-Forwarded-For when trustProxy is false", () => {
      const req = {
        headers: {
          "x-forwarded-for": "10.0.0.1, 10.0.0.2",
        },
        socket: {
          remoteAddress: "192.168.1.50",
        },
      } as unknown as Request;

      const ip = resolveCommunitySource(req, false);
      expect(ip).toBe("192.168.1.50");
    });

    it("extracts rightmost trusted proxy entry when trustProxy is true", () => {
      const req = {
        headers: {
          "x-forwarded-for": "203.0.113.195, 70.41.3.18, 150.172.238.178",
        },
        socket: {
          remoteAddress: "127.0.0.1",
        },
      } as unknown as Request;

      const ip = resolveCommunitySource(req, true);
      expect(ip).toBe("150.172.238.178");
    });

    it("falls back to remoteAddress when X-Forwarded-For is missing or empty even with trustProxy true", () => {
      const req = {
        headers: {},
        socket: {
          remoteAddress: "192.168.1.75",
        },
      } as unknown as Request;

      const ip = resolveCommunitySource(req, true);
      expect(ip).toBe("192.168.1.75");
    });
  });
});
