import type { HealthStatus } from "@aura/shared";
import { getEnv } from "../../infrastructure/config/env.js";
import { checkRedisReadiness, type RedisReadinessReport } from "../../infrastructure/redis/redis-health.js";
import { logger } from "../../infrastructure/logging/logger.js";
import type { IHealthRepository } from "./health.repository.js";
import { healthRepository as defaultHealthRepository } from "../../infrastructure/database/repository-factory.js";

export interface LivenessStatus {
  status: "healthy";
  service: "aura-api";
  timestamp: string;
}

export interface ReadinessChecks {
  database: "healthy" | "unhealthy";
  redis: "healthy" | "unhealthy";
}

export interface ReadinessStatus {
  status: "ready" | "unhealthy";
  service: "aura-api";
  checks: ReadinessChecks;
  timestamp: string;
}

export interface ReadinessResult {
  isReady: boolean;
  report: ReadinessStatus;
}

export interface HealthServiceDependencies {
  healthRepo?: IHealthRepository;
  checkRedis?: (options?: { timeoutMs?: number }) => Promise<RedisReadinessReport>;
}

export class HealthService {
  private startTime: number;
  private healthRepo: IHealthRepository;
  private checkRedisOverride?: (options?: { timeoutMs?: number }) => Promise<RedisReadinessReport>;

  constructor(deps?: HealthServiceDependencies) {
    this.startTime = Date.now();
    this.healthRepo = deps?.healthRepo ?? defaultHealthRepository;
    this.checkRedisOverride = deps?.checkRedis;
  }

  getHealthStatus(): HealthStatus {
    const env = getEnv();
    const uptimeSeconds = (Date.now() - this.startTime) / 1000;

    return {
      status: "healthy",
      service: "aura-api",
      version: "0.1.0",
      environment: env.NODE_ENV,
      timestamp: new Date().toISOString(),
      uptime: Math.round(uptimeSeconds * 100) / 100,
    };
  }

  getLivenessStatus(): LivenessStatus {
    return {
      status: "healthy",
      service: "aura-api",
      timestamp: new Date().toISOString(),
    };
  }

  async getReadinessStatus(options?: { timeoutMs?: number }): Promise<ReadinessResult> {
    const timeoutMs = options?.timeoutMs ?? 2000;

    // 1. Probe PostgreSQL Database via architectural repository boundary
    let dbHealthy = false;
    try {
      let timeoutHandle: NodeJS.Timeout | undefined;
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutHandle = setTimeout(() => reject(new Error("DB_TIMEOUT")), timeoutMs);
      });

      const probePromise = this.healthRepo.pingDatabase();
      await Promise.race([probePromise, timeoutPromise]);
      if (timeoutHandle) clearTimeout(timeoutHandle);
      dbHealthy = true;
    } catch (err: unknown) {
      logger.warn("Database readiness probe failed", {
        category: "DATABASE_ERROR",
        error: err instanceof Error ? err.message : "Database probe failed",
      });
      dbHealthy = false;
    }

    // 2. Probe Redis Cache & Transient State
    let redisHealthy = false;
    try {
      const checkRedis = this.checkRedisOverride ?? checkRedisReadiness;
      const report = await checkRedis({ timeoutMs });
      redisHealthy = report.status === "ready";
    } catch (err: unknown) {
      logger.warn("Redis readiness probe failed", {
        category: "REDIS_ERROR",
        error: err instanceof Error ? err.message : "Redis probe failed",
      });
      redisHealthy = false;
    }

    const isReady = dbHealthy && redisHealthy;
    return {
      isReady,
      report: {
        status: isReady ? "ready" : "unhealthy",
        service: "aura-api",
        checks: {
          database: dbHealthy ? "healthy" : "unhealthy",
          redis: redisHealthy ? "healthy" : "unhealthy",
        },
        timestamp: new Date().toISOString(),
      },
    };
  }
}

export const healthService = new HealthService();
