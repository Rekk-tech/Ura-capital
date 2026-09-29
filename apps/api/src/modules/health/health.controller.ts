import type { Request, Response } from "express";
import { HTTP_STATUS } from "@aura/shared";
import { healthService } from "./health.service.js";

export class HealthController {
  getHealth(_req: Request, res: Response): void {
    const health = healthService.getHealthStatus();
    res.status(HTTP_STATUS.OK).json(health);
  }

  getLiveness(_req: Request, res: Response): void {
    const liveness = healthService.getLivenessStatus();
    res.status(HTTP_STATUS.OK).json(liveness);
  }

  async getReadiness(_req: Request, res: Response): Promise<void> {
    const { isReady, report } = await healthService.getReadinessStatus();
    const statusCode = isReady ? HTTP_STATUS.OK : HTTP_STATUS.SERVICE_UNAVAILABLE;
    res.status(statusCode).json(report);
  }
}

export const healthController = new HealthController();
