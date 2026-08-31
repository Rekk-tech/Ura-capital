import type { Request, Response } from "express";
import { HTTP_STATUS } from "@aura/shared";
import { healthService } from "./health.service.js";

export class HealthController {
  getHealth(_req: Request, res: Response): void {
    const health = healthService.getHealthStatus();
    res.status(HTTP_STATUS.OK).json(health);
  }
}

export const healthController = new HealthController();
