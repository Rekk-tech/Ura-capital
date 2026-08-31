import type { HealthStatus } from "@aura/shared";
import { getEnv } from "../../infrastructure/config/env.js";

export class HealthService {
  private startTime: number;

  constructor() {
    this.startTime = Date.now();
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
}

export const healthService = new HealthService();
