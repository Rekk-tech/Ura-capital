import type { Response, NextFunction } from "express";
import { HTTP_STATUS, ERROR_CODES } from "@aura/shared";
import { AppError } from "../../shared/errors/error-envelope.js";
import type { AuthenticatedRequest } from "../auth/auth.types.js";
import type { AcademyProgressionService } from "./academy-progression.service.js";

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

      const { courseSlug } = req.params;
      const result = await this.service.getCourseProgress(
        userId,
        courseSlug as string,
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

      const { courseSlug, lessonSlug } = req.params;
      const result = await this.service.completeInformationalLesson(
        userId,
        courseSlug as string,
        lessonSlug as string,
        req.body,
      );

      res.status(HTTP_STATUS.OK).json({ data: result.progress });
    } catch (error) {
      next(error);
    }
  }
}
