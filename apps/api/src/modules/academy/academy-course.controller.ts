import type { Request, Response, NextFunction } from "express";
import { HTTP_STATUS, ERROR_CODES } from "@aura/shared";
import { AppError } from "../../shared/errors/error-envelope.js";
import { AcademyCourseReadService } from "./academy-course-read.service.js";
import type { AcademyQuizReadService } from "./academy-quiz-read.service.js";
import {
  listCoursesQuerySchema,
  courseSlugParamSchema,
  lessonSlugParamSchema,
  getLessonQuizParamsSchema,
} from "./academy.validation.js";

export class AcademyCourseController {
  constructor(
    private readonly service: AcademyCourseReadService,
    private readonly quizService?: AcademyQuizReadService,
  ) {}

  async listCourses(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = listCoursesQuerySchema.safeParse(req.query);
      if (!parsed.success) {
        throw parsed.error;
      }

      const result = await this.service.listCourses(parsed.data);
      res.status(HTTP_STATUS.OK).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getCourse(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = courseSlugParamSchema.safeParse(req.params);
      if (!parsed.success) {
        throw parsed.error;
      }

      const result = await this.service.getCourseBySlug(parsed.data.slug);
      res.status(HTTP_STATUS.OK).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getLesson(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = lessonSlugParamSchema.safeParse(req.params);
      if (!parsed.success) {
        throw parsed.error;
      }

      const result = await this.service.getLessonBySlug(
        parsed.data.courseSlug,
        parsed.data.lessonSlug,
      );
      res.status(HTTP_STATUS.OK).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getFlashcards(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = lessonSlugParamSchema.safeParse(req.params);
      if (!parsed.success) {
        throw parsed.error;
      }

      const result = await this.service.getPublishedFlashcards(
        parsed.data.courseSlug,
        parsed.data.lessonSlug,
      );
      res.status(HTTP_STATUS.OK).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getLessonQuiz(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = getLessonQuizParamsSchema.safeParse(req.params);
      if (!parsed.success) {
        throw parsed.error;
      }

      if (!this.quizService) {
        throw new AppError(
          "Resource not found",
          ERROR_CODES.NOT_FOUND,
          HTTP_STATUS.NOT_FOUND,
        );
      }

      const result = await this.quizService.getLessonQuiz(
        parsed.data.courseSlug,
        parsed.data.lessonSlug,
      );
      res.status(HTTP_STATUS.OK).json(result);
    } catch (error) {
      next(error);
    }
  }
}


