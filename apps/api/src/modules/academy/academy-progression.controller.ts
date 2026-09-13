import type { Response, NextFunction } from "express";
import { HTTP_STATUS, ERROR_CODES } from "@aura/shared";
import { AppError } from "../../shared/errors/error-envelope.js";
import type { AuthenticatedRequest } from "../auth/auth.types.js";
import type { AcademyProgressionService } from "./academy-progression.service.js";
import {
  courseProgressParamSchema,
  completeLessonParamSchema,
} from "./academy.validation.js";

export class AcademyProgressionController {
  constructor(private readonly service: AcademyProgressionService) {}

  /**
   * GET /api/academy/courses/:courseSlug/progress
   * Authenticated current-user course progress read.
   */
  async getCourseProgress(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError(
          "Authentication required",
          ERROR_CODES.UNAUTHENTICATED,
          HTTP_STATUS.UNAUTHORIZED,
        );
      }

      const parsedParams = courseProgressParamSchema.safeParse(req.params);
      if (!parsedParams.success) {
        throw new AppError(
          "Validation failed",
          ERROR_CODES.VALIDATION_ERROR,
          HTTP_STATUS.BAD_REQUEST,
        );
      }

      const result = await this.service.getCourseProgress(
        userId,
        parsedParams.data.courseSlug,
      );

      res.status(HTTP_STATUS.OK).json({ data: result });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/academy/courses/:courseSlug/lessons/:lessonSlug/complete
   * Authenticated current-user explicit completion for informational lessons.
   */
  async completeLesson(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError(
          "Authentication required",
          ERROR_CODES.UNAUTHENTICATED,
          HTTP_STATUS.UNAUTHORIZED,
        );
      }

      const parsedParams = completeLessonParamSchema.safeParse(req.params);
      if (!parsedParams.success) {
        throw new AppError(
          "Validation failed",
          ERROR_CODES.VALIDATION_ERROR,
          HTTP_STATUS.BAD_REQUEST,
        );
      }

      const result = await this.service.completeInformationalLesson(
        userId,
        parsedParams.data.courseSlug,
        parsedParams.data.lessonSlug,
        req.body,
      );

      res.status(HTTP_STATUS.OK).json({ data: result.progress });
    } catch (error) {
      next(error);
    }
  }
}
