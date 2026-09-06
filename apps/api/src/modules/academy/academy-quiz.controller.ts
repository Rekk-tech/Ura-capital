import type { Request, Response, NextFunction } from "express";
import { HTTP_STATUS } from "@aura/shared";
import { AcademyQuizReadService } from "./academy-quiz-read.service.js";
import { getLessonQuizParamsSchema } from "./academy.validation.js";

export class AcademyQuizController {
  constructor(private readonly quizService: AcademyQuizReadService) {}

  async getLessonQuiz(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = getLessonQuizParamsSchema.safeParse(req.params);
      if (!parsed.success) {
        throw parsed.error;
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
