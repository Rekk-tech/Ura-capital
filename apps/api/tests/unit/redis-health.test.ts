import { describe, it, expect, vi, beforeEach } from "vitest";
import { checkRedisReadiness, sanitizeRedisDiagnostic } from "../../src/infrastructure/redis/redis-health.js";
import { healthService } from "../../src/modules/health/health.service.js";
import type { Redis } from "ioredis";

describe("Redis Health & Readiness Unit Tests (FEAT-015)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("checkRedisReadiness", () => {
    it("returns ready report when Redis responds with PONG", async () => {
      const mockClient = {
        ping: vi.fn().mockResolvedValue("PONG"),
      } as unknown as Redis;

      const report = await checkRedisReadiness({ client: mockClient, timeoutMs: 1000 });

      expect(report.status).toBe("ready");
      expect(report.category).toBe("REDIS_AVAILABLE");
      expect(typeof report.latencyMs).toBe("number");
      expect(report.latencyMs).toBeGreaterThanOrEqual(0);
    });

    it("returns not_ready report when Redis ping rejects with an error", async () => {
      const mockClient = {
        ping: vi.fn().mockRejectedValue(new Error("Connection refused")),
      } as unknown as Redis;

      const report = await checkRedisReadiness({ client: mockClient, timeoutMs: 1000 });

      expect(report.status).toBe("not_ready");
      expect(report.category).toBe("REDIS_UNAVAILABLE");
      expect(report.message).toContain("unreachable");
    });

    it("returns not_ready and REDIS_TIMEOUT when ping exceeds timeoutMs", async () => {
      const mockClient = {
        ping: vi.fn().mockImplementation(() => new Promise((resolve) => setTimeout(() => resolve("PONG"), 500))),
      } as unknown as Redis;

      const report = await checkRedisReadiness({ client: mockClient, timeoutMs: 50 });

      expect(report.status).toBe("not_ready");
      expect(report.category).toBe("REDIS_TIMEOUT");
      expect(report.message).toContain("timed out");
    });

    it("returns not_ready if Redis returns unexpected ping value", async () => {
      const mockClient = {
        ping: vi.fn().mockResolvedValue("NOT_PONG"),
      } as unknown as Redis;

      const report = await checkRedisReadiness({ client: mockClient, timeoutMs: 1000 });

      expect(report.status).toBe("not_ready");
      expect(report.category).toBe("REDIS_UNAVAILABLE");
    });
  });

  describe("sanitizeRedisDiagnostic (DEF-005 Sentinel Tests)", () => {
    it("redacts redis:// and rediss:// connection URLs with credentials and DB indices", () => {
      const raw1 = "Error connecting to redis://default:supersecret@10.0.0.5:6379/0";
      const raw2 = "Failed to open redis://user:pass@host:6379/3";
      expect(sanitizeRedisDiagnostic(raw1)).toBe("Error connecting to [REDACTED_REDIS_URL]");
      expect(sanitizeRedisDiagnostic(raw2)).toBe("Failed to open [REDACTED_REDIS_URL]");
    });

    it("redacts postgresql:// URLs and credentials", () => {
      const raw = "Database URL was postgresql://user:pass@localhost:5432/aura_capital_dev";
      const sanitized = sanitizeRedisDiagnostic(raw);

      expect(sanitized).not.toContain("pass");
      expect(sanitized).not.toContain("aura_capital_dev");
      expect(sanitized).toContain("[REDACTED_DB_URL]");
    });

    it("redacts arbitrary host:port, IPv4, IPv6, localhost:6380, and 127.0.0.1:6381 pairs", () => {
      const raw = "Connection failed to redis-cache.internal.company.com:6379, localhost:6380, 127.0.0.1:6381, 192.168.1.100:6379, and [::1]:6379";
      const sanitized = sanitizeRedisDiagnostic(raw);

      expect(sanitized).not.toContain("redis-cache.internal.company.com:6379");
      expect(sanitized).not.toContain("localhost:6380");
      expect(sanitized).not.toContain("127.0.0.1:6381");
      expect(sanitized).not.toContain("192.168.1.100:6379");
      expect(sanitized).not.toContain("[::1]:6379");
      expect(sanitized).toBe("Connection failed to [REDACTED_HOST:PORT], [REDACTED_HOST:PORT], [REDACTED_HOST:PORT], [REDACTED_HOST:PORT], and [REDACTED_HOST:PORT]");
    });

    it("redacts database names like aura_capital_*", () => {
      const raw = "Target DB is aura_capital_test_feat015_qa1";
      const sanitized = sanitizeRedisDiagnostic(raw);

      expect(sanitized).not.toContain("aura_capital_test_feat015_qa1");
      expect(sanitized).toContain("[REDACTED_DB_NAME]");
    });

    it("redacts JWT tokens and Bearer authorization values", () => {
      const raw = "Auth header: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.payload.sig";
      const sanitized = sanitizeRedisDiagnostic(raw);

      expect(sanitized).not.toContain("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.payload.sig");
      expect(sanitized).toContain("[REDACTED_JWT]");
    });

    it("redacts cookie values such as aura_refresh_token", () => {
      const raw = "Cookie header: aura_refresh_token=secret_refresh_token_value_12345; session=abc";
      const sanitized = sanitizeRedisDiagnostic(raw);

      expect(sanitized).not.toContain("secret_refresh_token_value_12345");
      expect(sanitized).toContain("aura_refresh_token=[REDACTED_COOKIE]");
    });

    it("redacts password/secret parameter fragments", () => {
      const raw = "Failed request with password=MySecretPassword123!, secret=topsecret, token=tok123, and apiKey=xyz789";
      const sanitized = sanitizeRedisDiagnostic(raw);

      expect(sanitized).not.toContain("MySecretPassword123!");
      expect(sanitized).not.toContain("topsecret");
      expect(sanitized).not.toContain("tok123");
      expect(sanitized).toContain("password=[REDACTED_SECRET]");
      expect(sanitized).toContain("secret=[REDACTED_SECRET]");
      expect(sanitized).toContain("token=[REDACTED_SECRET]");
    });

    it("redacts full Redis key values including dotted IPv4 source, IPv6 source, and HMAC suffixes", () => {
      const raw1 = "Key failure: aura:production:rl:v1:login:source:1.2.3.4 was rejected";
      const raw2 = "IPv6 probe: aura:test:rl:v1:register:source:2001:db8::1 was checked";
      const raw3 = "HMAC probe: aura:test:rl:v1:login:id_src:127.0.0.1:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855 expired";

      expect(sanitizeRedisDiagnostic(raw1)).toBe("Key failure: [REDACTED_REDIS_KEY] was rejected");
      expect(sanitizeRedisDiagnostic(raw2)).toBe("IPv6 probe: [REDACTED_REDIS_KEY] was checked");
      expect(sanitizeRedisDiagnostic(raw3)).toBe("HMAC probe: [REDACTED_REDIS_KEY] expired");
    });

    it("redacts Windows absolute file paths", () => {
      const raw = "Error in file D:\\project\\ura-capital\\apps\\api\\src\\server.ts:42";
      const sanitized = sanitizeRedisDiagnostic(raw);

      expect(sanitized).not.toContain("D:\\project\\ura-capital");
      expect(sanitized).toContain("[REDACTED_PATH]");
    });

    it("redacts POSIX absolute file paths", () => {
      const raw = "Error in /Users/deploy/app/src/index.ts or /home/ubuntu/app/main.js";
      const sanitized = sanitizeRedisDiagnostic(raw);

      expect(sanitized).not.toContain("/Users/deploy/app");
      expect(sanitized).not.toContain("/home/ubuntu/app");
      expect(sanitized).toContain("[REDACTED_PATH]");
    });

    it("handles null or undefined input gracefully", () => {
      expect(sanitizeRedisDiagnostic(null)).toBe("");
      expect(sanitizeRedisDiagnostic(undefined)).toBe("");
    });
  });

  describe("Liveness vs Readiness Separation", () => {
    it("healthService.getHealthStatus() provides generic liveness without requiring Redis", () => {
      const status = healthService.getHealthStatus();

      expect(status.status).toBe("healthy");
      expect(status.service).toBe("aura-api");
      expect(status.version).toBe("0.1.0");
      expect(status).not.toHaveProperty("redis");
      expect(status).not.toHaveProperty("redisUrl");
      expect(status).not.toHaveProperty("host");
      expect(status).not.toHaveProperty("port");
    });
  });
});
