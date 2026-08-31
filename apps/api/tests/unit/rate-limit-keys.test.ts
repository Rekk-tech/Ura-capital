import { describe, it, expect } from "vitest";
import {
  buildRateLimitKey,
  computeIdentityDigest,
  resolveSource,
  buildIdentitySourceKey,
  KEY_SCOPES,
  KEY_ENDPOINTS,
} from "../../src/modules/auth/rate-limit/rate-limit.keys.js";

import type { Request } from "express";

describe("Rate Limit Keys", () => {
  describe("buildRateLimitKey", () => {
    it("builds correctly namespaced keys matching aura:{env}:rl:v1:{endpoint}:{scope}:{identifier}", () => {
      const key = buildRateLimitKey("login", "source", "127.0.0.1", "test");
      expect(key).toBe("aura:test:rl:v1:login:source:127.0.0.1");
    });

    it("builds identity+source keys", () => {
      const key = buildRateLimitKey("login", KEY_SCOPES.IDENTITY_SOURCE, "127.0.0.1:abc123", "test");
      expect(key).toBe("aura:test:rl:v1:login:id_src:127.0.0.1:abc123");
    });

    it("builds cooldown keys", () => {
      const key = buildRateLimitKey(KEY_ENDPOINTS.LOGIN, KEY_SCOPES.COOLDOWN, "127.0.0.1", "test");
      expect(key).toBe("aura:test:rl:v1:login:cd:127.0.0.1");
    });

    it("builds escalation keys", () => {
      const key = buildRateLimitKey(KEY_ENDPOINTS.LOGIN, KEY_SCOPES.ESCALATION, "test", "test");
      expect(key).toBe("aura:test:rl:v1:login:esc:test");
    });

    it("uses all endpoint types", () => {
      expect(buildRateLimitKey(KEY_ENDPOINTS.LOGIN, KEY_SCOPES.SOURCE, "x", "test")).toBe("aura:test:rl:v1:login:source:x");
      expect(buildRateLimitKey(KEY_ENDPOINTS.REGISTER, KEY_SCOPES.SOURCE, "x", "test")).toBe("aura:test:rl:v1:register:source:x");
      expect(buildRateLimitKey(KEY_ENDPOINTS.REFRESH, KEY_SCOPES.SOURCE, "x", "test")).toBe("aura:test:rl:v1:refresh:source:x");
    });
  });

  describe("computeIdentityDigest", () => {
    const secret = "test-hmac-secret-for-rate-limiting-32-chars";

    it("produces a hex digest", () => {
      const digest = computeIdentityDigest("user@example.com", secret);
      expect(digest).toMatch(/^[a-f0-9]{64}$/); // SHA-256 hex = 64 chars
    });

    it("produces deterministic output for same input", () => {
      const d1 = computeIdentityDigest("user@example.com", secret);
      const d2 = computeIdentityDigest("user@example.com", secret);
      expect(d1).toBe(d2);
    });

    it("normalizes email (case-insensitive)", () => {
      const d1 = computeIdentityDigest("User@Example.com", secret);
      const d2 = computeIdentityDigest("user@example.com", secret);
      expect(d1).toBe(d2);
    });

    it("produces different digests for different emails", () => {
      const d1 = computeIdentityDigest("alice@example.com", secret);
      const d2 = computeIdentityDigest("bob@example.com", secret);
      expect(d1).not.toBe(d2);
    });

    it("produces different digests with different secrets", () => {
      const d1 = computeIdentityDigest("user@example.com", "secret-one-that-is-long-enough-32chars");
      const d2 = computeIdentityDigest("user@example.com", "secret-two-that-is-long-enough-32chars");
      expect(d1).not.toBe(d2);
    });

    it("does NOT contain raw email in the digest", () => {
      const digest = computeIdentityDigest("user@example.com", secret);
      expect(digest).not.toContain("user");
      expect(digest).not.toContain("example");
      expect(digest).not.toContain("@");
    });
  });

  describe("resolveSource", () => {
    function makeFakeReq(remoteAddress: string, xForwardedFor?: string): Request {
      return {
        socket: { remoteAddress },
        headers: xForwardedFor ? { "x-forwarded-for": xForwardedFor } : {},
      } as unknown as Request;
    }

    it("uses remoteAddress when trustProxy=false", () => {
      const req = makeFakeReq("192.168.1.1", "10.0.0.1, 172.16.0.1");
      expect(resolveSource(req, false)).toBe("192.168.1.1");
    });

    it("ignores X-Forwarded-For when trustProxy=false", () => {
      const req = makeFakeReq("192.168.1.1", "spoofed-ip");
      expect(resolveSource(req, false)).toBe("192.168.1.1");
    });

    it("uses rightmost X-Forwarded-For when trustProxy=true", () => {
      const req = makeFakeReq("10.0.0.1", "client-ip, proxy1, proxy2");
      expect(resolveSource(req, true)).toBe("proxy2");
    });

    it("uses single X-Forwarded-For when trustProxy=true", () => {
      const req = makeFakeReq("10.0.0.1", "real-client-ip");
      expect(resolveSource(req, true)).toBe("real-client-ip");
    });

    it("falls back to remoteAddress when X-Forwarded-For is absent with trustProxy=true", () => {
      const req = makeFakeReq("10.0.0.1");
      expect(resolveSource(req, true)).toBe("10.0.0.1");
    });

    it("returns 'unknown' when remoteAddress is undefined", () => {
      const req = { socket: {}, headers: {} } as unknown as Request;
      expect(resolveSource(req, false)).toBe("unknown");
    });

    it("spoofed X-Forwarded-For does not bypass when trustProxy=false", () => {
      const req = makeFakeReq("127.0.0.1", "attacker-ip");
      const source = resolveSource(req, false);
      expect(source).toBe("127.0.0.1");
      expect(source).not.toBe("attacker-ip");
    });
  });

  describe("buildIdentitySourceKey", () => {
    it("combines source and identity digest", () => {
      const key = buildIdentitySourceKey("127.0.0.1", "abc123def456");
      expect(key).toBe("127.0.0.1:abc123def456");
    });
  });

  describe("Key safety — no raw sensitive data", () => {
    const secret = "rate-limit-test-secret-at-least-32-chars";

    it("key does not contain raw email", () => {
      const email = "sensitive-user@company.com";
      const digest = computeIdentityDigest(email, secret);
      const key = buildRateLimitKey(KEY_ENDPOINTS.LOGIN, KEY_SCOPES.IDENTITY_SOURCE, buildIdentitySourceKey("1.2.3.4", digest));
      expect(key).not.toContain(email);
      expect(key).not.toContain("sensitive-user");
      expect(key).not.toContain("company.com");
    });

    it("key does not contain raw password", () => {
      // Passwords should never be used in key construction
      const password = "MyS3cretP@ssword!";
      const key = buildRateLimitKey(KEY_ENDPOINTS.LOGIN, KEY_SCOPES.SOURCE, "1.2.3.4");
      expect(key).not.toContain(password);
    });

    it("key does not contain raw token", () => {
      const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.payload.signature";
      const key = buildRateLimitKey(KEY_ENDPOINTS.REFRESH, KEY_SCOPES.SOURCE, "1.2.3.4");
      expect(key).not.toContain(token);
      expect(key).not.toContain("eyJ");
    });
  });
});
