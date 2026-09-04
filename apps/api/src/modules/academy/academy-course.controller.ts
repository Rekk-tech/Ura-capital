import type { Request, Response, NextFunction } from "express";
import { HTTP_STATUS } from "@aura/shared";
import { AcademyCourseReadService } from "./academy-course-read.service.js";
import {
  listCoursesQuerySchema,
  courseSlugParamSchema,
  lessonSlugParamSchema,
} from "./academy.validation.js";

export class AcademyCourseController {
  constructor(private readonly service: AcademyCourseReadService) {}

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
}
