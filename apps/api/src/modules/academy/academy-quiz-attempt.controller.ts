import type { Response, NextFunction } from "express";
import { HTTP_STATUS, ERROR_CODES } from "@aura/shared";
import { AppError } from "../../shared/errors/error-envelope.js";
import type { AuthenticatedRequest } from "../auth/auth.types.js";
import { AcademyQuizAttemptService } from "./academy-quiz-attempt.service.js";
import {
  getLessonQuizParamsSchema,
  quizAttemptParamSchema,
  quizDraftAnswerParamSchema,
} from "./academy.validation.js";

export class AcademyQuizAttemptController {
  constructor(private readonly attemptService: AcademyQuizAttemptService) {}

  async startAttempt(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError(
          "Authentication required",
          ERROR_CODES.UNAUTHENTICATED,
          HTTP_STATUS.UNAUTHORIZED,
        );
      }

      const parsedParams = getLessonQuizParamsSchema.safeParse(req.params);
      if (!parsedParams.success) {
        throw new AppError(
          "Validation failed",
          ERROR_CODES.VALIDATION_ERROR,
          HTTP_STATUS.BAD_REQUEST,
        );
      }

      const result = await this.attemptService.startAttempt(
        userId,
        parsedParams.data.courseSlug,
        parsedParams.data.lessonSlug,
        req.body,
      );

      const status = result.created ? HTTP_STATUS.CREATED : HTTP_STATUS.OK;
      res.status(status).json({ data: result.attempt });
    } catch (error) {
      next(error);
    }
  }

  async getCurrentAttempt(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError(
          "Authentication required",
          ERROR_CODES.UNAUTHENTICATED,
          HTTP_STATUS.UNAUTHORIZED,
        );
      }

      const parsedParams = getLessonQuizParamsSchema.safeParse(req.params);
      if (!parsedParams.success) {
        throw new AppError(
          "Validation failed",
          ERROR_CODES.VALIDATION_ERROR,
          HTTP_STATUS.BAD_REQUEST,
        );
      }

      const attempt = await this.attemptService.getCurrentAttempt(
        userId,
        parsedParams.data.courseSlug,
        parsedParams.data.lessonSlug,
      );

      res.status(HTTP_STATUS.OK).json({ data: attempt });
    } catch (error) {
      next(error);
    }
  }

  async getAttemptById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError(
          "Authentication required",
          ERROR_CODES.UNAUTHENTICATED,
          HTTP_STATUS.UNAUTHORIZED,
        );
      }

      const parsedParams = quizAttemptParamSchema.safeParse(req.params);
      if (!parsedParams.success) {
        throw new AppError(
          "Validation failed",
          ERROR_CODES.VALIDATION_ERROR,
          HTTP_STATUS.BAD_REQUEST,
        );
      }

      const attempt = await this.attemptService.getAttemptById(
        userId,
        parsedParams.data.attemptId,
      );

      res.status(HTTP_STATUS.OK).json({ data: attempt });
    } catch (error) {
      next(error);
    }
  }

  async recordDraftAnswer(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError(
          "Authentication required",
          ERROR_CODES.UNAUTHENTICATED,
          HTTP_STATUS.UNAUTHORIZED,
        );
      }

      const parsedParams = quizDraftAnswerParamSchema.safeParse(req.params);
      if (!parsedParams.success) {
        throw new AppError(
          "Validation failed",
          ERROR_CODES.VALIDATION_ERROR,
          HTTP_STATUS.BAD_REQUEST,
        );
      }

      const result = await this.attemptService.recordDraftAnswer(
        userId,
        parsedParams.data.attemptId,
        parsedParams.data.questionId,
        req.body,
      );

      res.status(HTTP_STATUS.OK).json({ data: result });
    } catch (error) {
      next(error);
    }
  }

  async submitAttempt(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError(
          "Authentication required",
          ERROR_CODES.UNAUTHENTICATED,
          HTTP_STATUS.UNAUTHORIZED,
        );
      }

      const parsedParams = quizAttemptParamSchema.safeParse(req.params);
      if (!parsedParams.success) {
        throw new AppError(
          "Validation failed",
          ERROR_CODES.VALIDATION_ERROR,
          HTTP_STATUS.BAD_REQUEST,
        );
      }

      const result = await this.attemptService.submitAttempt(
        userId,
        parsedParams.data.attemptId,
        req.body,
      );

      res.status(HTTP_STATUS.OK).json({ data: result });
    } catch (error) {
      next(error);
    }
  }

  async getGradedResult(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError(
          "Authentication required",
          ERROR_CODES.UNAUTHENTICATED,
          HTTP_STATUS.UNAUTHORIZED,
        );
      }

      const parsedParams = quizAttemptParamSchema.safeParse(req.params);
      if (!parsedParams.success) {
        throw new AppError(
          "Validation failed",
          ERROR_CODES.VALIDATION_ERROR,
          HTTP_STATUS.BAD_REQUEST,
        );
      }

      const result = await this.attemptService.getGradedResult(
        userId,
        parsedParams.data.attemptId,
      );

      res.status(HTTP_STATUS.OK).json({ data: result });
    } catch (error) {
      next(error);
    }
  }
}
