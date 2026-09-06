import { ERROR_CODES, HTTP_STATUS } from "@aura/shared";
import { AppError } from "../../shared/errors/error-envelope.js";
import type { IAcademyQuizRepository } from "./academy.repository.js";
import {
  type QuizDefinitionResponse,
  toQuizDefinitionDto,
} from "./academy.dto.js";

export class AcademyQuizReadService {
  constructor(private readonly quizRepo: IAcademyQuizRepository) {}

  async getLessonQuiz(
    courseSlug: string,
    lessonSlug: string,
  ): Promise<QuizDefinitionResponse> {
    const quiz = await this.quizRepo.findPublishedQuizByLesson(
      courseSlug,
      lessonSlug,
    );

    if (!quiz) {
      throw new AppError(
        "Resource not found",
        ERROR_CODES.NOT_FOUND,
        HTTP_STATUS.NOT_FOUND,
      );
    }

    return {
      data: toQuizDefinitionDto(quiz),
    };
  }
}
