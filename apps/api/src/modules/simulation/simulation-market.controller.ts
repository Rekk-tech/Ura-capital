import type { Request, Response, NextFunction } from "express";
import { ERROR_CODES, HTTP_STATUS } from "@aura/shared";
import { AppError } from "../../shared/errors/error-envelope.js";
import type { SimulationMarketReadService } from "./simulation-market-read.service.js";
import {
  noQueryParamsSchema,
  scenarioSnapshotParamsSchema,
} from "./simulation.validation.js";

function rejectRequestBody(req: Request): void {
  const hasBody =
    req.body !== undefined &&
    req.body !== null &&
    (typeof req.body !== "object" ||
      (Array.isArray(req.body) ? req.body.length > 0 : Object.keys(req.body as Record<string, unknown>).length > 0));

  if (hasBody) {
    throw new AppError(
      "GET simulation read routes do not accept request bodies",
      ERROR_CODES.VALIDATION_ERROR,
      HTTP_STATUS.BAD_REQUEST,
    );
  }
}

export class SimulationMarketController {
  constructor(private readonly service: SimulationMarketReadService) {}

  async listAssets(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsedQuery = noQueryParamsSchema.safeParse(req.query);
      if (!parsedQuery.success) {
        throw parsedQuery.error;
      }
      rejectRequestBody(req);

      const result = await this.service.listAssets();
      res.status(HTTP_STATUS.OK).json(result);
    } catch (error) {
      next(error);
    }
  }

  async listScenarioSnapshots(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsedParams = scenarioSnapshotParamsSchema.safeParse(req.params);
      if (!parsedParams.success) {
        throw parsedParams.error;
      }
      const parsedQuery = noQueryParamsSchema.safeParse(req.query);
      if (!parsedQuery.success) {
        throw parsedQuery.error;
      }
      rejectRequestBody(req);

      const result = await this.service.listScenarioSnapshots(
        parsedParams.data.scenarioKey,
        parsedParams.data.cycle,
      );
      res.status(HTTP_STATUS.OK).json(result);
    } catch (error) {
      next(error);
    }
  }
}
