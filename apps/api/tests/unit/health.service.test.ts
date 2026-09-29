import { describe, it, expect, vi } from "vitest";
import { HealthService } from "../../src/modules/health/health.service.js";
import type { IHealthRepository } from "../../src/modules/health/health.repository.js";

describe("HealthService Unit Tests", () => {
  it("returns process liveness status with healthy flag and timestamp", () => {
    const service = new HealthService();
    const liveness = service.getLivenessStatus();

    expect(liveness.status).toBe("healthy");
    expect(liveness.service).toBe("aura-api");
    expect(new Date(liveness.timestamp).getTime()).not.toBeNaN();
  });

  it("returns ready when both database and redis probes succeed", async () => {
    const mockHealthRepo: IHealthRepository = {
      pingDatabase: vi.fn().mockResolvedValue(true),
    };

    const mockCheckRedis = vi.fn().mockResolvedValue({
      status: "ready",
      category: "REDIS_AVAILABLE",
      latencyMs: 2,
    });

    const service = new HealthService({
      healthRepo: mockHealthRepo,
      checkRedis: mockCheckRedis,
    });

    const result = await service.getReadinessStatus({ timeoutMs: 500 });
    expect(result.isReady).toBe(true);
    expect(result.report.status).toBe("ready");
    expect(result.report.checks.database).toBe("healthy");
    expect(result.report.checks.redis).toBe("healthy");
  });

  it("returns unhealthy when database probe fails", async () => {
    const mockHealthRepo: IHealthRepository = {
      pingDatabase: vi.fn().mockRejectedValue(new Error("Connection refused")),
    };

    const mockCheckRedis = vi.fn().mockResolvedValue({
      status: "ready",
      category: "REDIS_AVAILABLE",
      latencyMs: 2,
    });

    const service = new HealthService({
      healthRepo: mockHealthRepo,
      checkRedis: mockCheckRedis,
    });

    const result = await service.getReadinessStatus({ timeoutMs: 500 });
    expect(result.isReady).toBe(false);
    expect(result.report.status).toBe("unhealthy");
    expect(result.report.checks.database).toBe("unhealthy");
    expect(result.report.checks.redis).toBe("healthy");
  });

  it("returns unhealthy when redis probe fails or reports not_ready", async () => {
    const mockHealthRepo: IHealthRepository = {
      pingDatabase: vi.fn().mockResolvedValue(true),
    };

    const mockCheckRedis = vi.fn().mockResolvedValue({
      status: "not_ready",
      category: "REDIS_UNAVAILABLE",
    });

    const service = new HealthService({
      healthRepo: mockHealthRepo,
      checkRedis: mockCheckRedis,
    });

    const result = await service.getReadinessStatus({ timeoutMs: 500 });
    expect(result.isReady).toBe(false);
    expect(result.report.status).toBe("unhealthy");
    expect(result.report.checks.database).toBe("healthy");
    expect(result.report.checks.redis).toBe("unhealthy");
  });

  it("returns general health status conforming to HealthStatus interface", () => {
    const service = new HealthService();
    const health = service.getHealthStatus();

    expect(health.status).toBe("healthy");
    expect(health.service).toBe("aura-api");
    expect(typeof health.uptime).toBe("number");
  });
});
