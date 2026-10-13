import type { Request, Response, NextFunction } from "express";
import { AppError } from "../../../shared/errors/error-envelope.js";
import { ERROR_CODES, HTTP_STATUS } from "@aura/shared";
import { AICoachService, aiCoachService } from "./ai-coach.service.js";

export class AICoachController {
  constructor(private readonly service: AICoachService = aiCoachService) {}

  consultCoach = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { query, topic, mapContext } = req.body as {
        query?: unknown;
        topic?: unknown;
        mapContext?: unknown;
      };

      if (!query || typeof query !== "string" || query.trim().length === 0) {
        throw new AppError(
          "Query is required and must be a non-empty string",
          ERROR_CODES.VALIDATION_ERROR,
          HTTP_STATUS.BAD_REQUEST,
        );
      }

      const trimmedQuery = query.trim();
      if (trimmedQuery.length > 1000) {
        throw new AppError(
          "Query exceeds maximum allowed length of 1000 characters",
          ERROR_CODES.VALIDATION_ERROR,
          HTTP_STATUS.BAD_REQUEST,
        );
      }

      let validMapContext: "MAP1" | "MAP2" | "GENERAL" | undefined = undefined;
      if (mapContext === "MAP1" || mapContext === "MAP2" || mapContext === "GENERAL") {
        validMapContext = mapContext;
      }

      const result = await this.service.consult({
        query: trimmedQuery,
        topic: typeof topic === "string" ? topic.trim() : undefined,
        mapContext: validMapContext,
      });

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: result,
      });
    } catch (err: unknown) {
      next(err);
    }
  };
}

export const aiCoachController = new AICoachController();
