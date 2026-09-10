import {
  ERROR_CODES,
  HTTP_STATUS,
  CompleteLessonBodySchema,
  type CourseProgressDto,
  type LessonProgressDto,
  type AcademyCompletionFact,
} from "@aura/shared";
import { AppError } from "../../shared/errors/error-envelope.js";
import type { IAcademyProgressRepository } from "./academy.repository.js";
import type { ITransactionRunner } from "../../infrastructure/database/transaction-runner.js";
import { transactionRunner as defaultTransactionRunner } from "../../infrastructure/database/transaction-runner.js";
import { toCourseProgressDto, toLessonProgressDto } from "./academy.dto.js";
import {
  courseProgressParamSchema,
  completeLessonParamSchema,
} from "./academy.validation.js";

export interface ReconcileResult {
  lessonProgress: LessonProgressDto | null;
  facts: AcademyCompletionFact[];
}

export interface CompleteLessonResult {
  progress: LessonProgressDto;
  facts: AcademyCompletionFact[];
}

export class AcademyProgressionService {
  constructor(
    private readonly progressRepo: IAcademyProgressRepository,
    private readonly txRunner: ITransactionRunner = defaultTransactionRunner,
  ) {}

  /**
   * Reads authenticated current-user course progress with server-authoritative
   * historical completion semantics and dynamic published curriculum coverage.
   */
  async getCourseProgress(
    userId: string,
    courseSlug: string,
  ): Promise<CourseProgressDto> {
    const paramParsed = courseProgressParamSchema.safeParse({ courseSlug });
    if (!paramParsed.success) {
      throw new AppError(
        "Validation failed",
        ERROR_CODES.VALIDATION_ERROR,
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    const data = await this.progressRepo.findCourseProgressBySlug(
      userId,
      courseSlug,
    );

    if (!data) {
      throw new AppError(
        "Resource not found",
        ERROR_CODES.NOT_FOUND,
        HTTP_STATUS.NOT_FOUND,
      );
    }

    const { course, courseProgress, publishedLessons, lessonProgressMap } = data;

    const totalPublishedLessons = publishedLessons.length;
    const completedPublishedLessons = publishedLessons.filter((l) => {
      const p = lessonProgressMap.get(l.id);
      return p && (p.status === "COMPLETED" || p.completedAt !== null);
    }).length;

    // AC-011, AC-012: Deterministic percentage calculation safe against division by zero
    const progressPercent =
      totalPublishedLessons === 0
        ? 0
        : Math.round((completedPublishedLessons / totalPublishedLessons) * 100);

    // AC-013, AC-014: Historical course completion is monotonic
    const isHistoricallyCompleted =
      courseProgress !== null &&
      (courseProgress.status === "COMPLETED" ||
        courseProgress.completedAt !== null);

    const status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" =
      isHistoricallyCompleted
        ? "COMPLETED"
        : completedPublishedLessons > 0
          ? "IN_PROGRESS"
          : ((courseProgress?.status as
              | "NOT_STARTED"
              | "IN_PROGRESS"
              | "COMPLETED") ?? "NOT_STARTED");

    const completed = isHistoricallyCompleted;
    const completedAt = isHistoricallyCompleted
      ? courseProgress?.completedAt ?? null
      : null;

    const lessonDtos: LessonProgressDto[] = publishedLessons.map((l) => {
      const lp = lessonProgressMap.get(l.id);
      const isLessonCompleted =
        lp !== undefined &&
        (lp.status === "COMPLETED" || lp.completedAt !== null);
      return toLessonProgressDto({
        slug: l.slug,
        status: isLessonCompleted ? "COMPLETED" : (lp?.status ?? "NOT_STARTED"),
        completed: isLessonCompleted,
        completedAt: lp?.completedAt ?? null,
      });
    });

    return toCourseProgressDto({
      courseSlug: course.slug,
      completedLessons: completedPublishedLessons,
      totalLessons: totalPublishedLessons,
      progressPercent,
      status,
      completed,
      completedAt,
      lessons: lessonDtos,
    });
  }

  /**
   * Completes an informational lesson (lesson without a published quiz) for the authenticated learner.
   * If the lesson has a published quiz, rejects with 400 QUIZ_COMPLETION_REQUIRED.
   */
  async completeInformationalLesson(
    userId: string,
    courseSlug: string,
    lessonSlug: string,
    body: unknown,
  ): Promise<CompleteLessonResult> {
    // 1. Strict Zod validation: rejects extra/forged fields with 400 VALIDATION_ERROR
    const bodyParsed = CompleteLessonBodySchema.safeParse(body);
    if (!bodyParsed.success) {
      throw new AppError(
        "Validation failed",
        ERROR_CODES.VALIDATION_ERROR,
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    const paramParsed = completeLessonParamSchema.safeParse({
      courseSlug,
      lessonSlug,
    });
    if (!paramParsed.success) {
      throw new AppError(
        "Validation failed",
        ERROR_CODES.VALIDATION_ERROR,
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    // 2. Resolve published hierarchy
    const lesson = await this.progressRepo.findPublishedLessonWithCourse(
      courseSlug,
      lessonSlug,
    );
    if (!lesson) {
      throw new AppError(
        "Resource not found",
        ERROR_CODES.NOT_FOUND,
        HTTP_STATUS.NOT_FOUND,
      );
    }

    // 3. Quiz assessment guard: if published quiz exists, manual completion is forbidden
    const hasQuiz = await this.progressRepo.hasPublishedQuiz(lesson.id);
    if (hasQuiz) {
      throw new AppError(
        "Quiz completion required for this lesson",
        ERROR_CODES.QUIZ_COMPLETION_REQUIRED,
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    // 4. Atomic progression transaction coordinating lesson progress and course rollup
    return await this.txRunner.run(async (ctx) => {
      const repo = ctx.repositories.academyProgressRepo;
      const now = new Date();
      const facts: AcademyCompletionFact[] = [];

      // Upsert lesson progress safely with advisory lock & P2002 conflict handling
      const lessonResult = await repo.upsertLessonProgressSafe(
        userId,
        lesson.id,
        "COMPLETED",
        now,
      );

      if (lessonResult.isFirstCompletion) {
        facts.push({
          userId,
          resourceType: "LESSON",
          resourceId: lesson.id,
          isFirstCompletion: true,
          completedAt: lessonResult.progress.completedAt ?? now,
        });
      }

      // Course progress rollup within the same atomic boundary
      const publishedLessons = await repo.getPublishedLessonsForCourse(
        lesson.courseId,
      );
      const userLessonsProgress = await repo.listLessonProgressForUser(
        userId,
        publishedLessons.map((l) => l.id),
      );

      const completedCount = publishedLessons.filter((pl) =>
        userLessonsProgress.some(
          (ulp) =>
            ulp.lessonId === pl.id &&
            (ulp.status === "COMPLETED" || ulp.completedAt !== null),
        ),
      ).length;
      const totalCount = publishedLessons.length;

      if (totalCount > 0 && completedCount === totalCount) {
        const courseResult = await repo.upsertCourseProgressSafe(
          userId,
          lesson.courseId,
          "COMPLETED",
          now,
        );
        if (courseResult.isFirstCompletion) {
          facts.push({
            userId,
            resourceType: "COURSE",
            resourceId: lesson.courseId,
            isFirstCompletion: true,
            completedAt: courseResult.progress.completedAt ?? now,
          });
        }
      } else if (totalCount > 0 && completedCount > 0) {
        await repo.upsertCourseProgressSafe(
          userId,
          lesson.courseId,
          "IN_PROGRESS",
          null,
        );
      }

      return {
        progress: toLessonProgressDto({
          slug: lesson.slug,
          status: lessonResult.progress.status,
          completed: true,
          completedAt: lessonResult.progress.completedAt,
        }),
        facts,
      };
    });
  }

  /**
   * Post-grade progression reconciliation: consumes a durably persisted GRADED attempt.
   * Runs in its own separate transaction to preserve the FEAT-025 grading boundary.
   */
  async reconcileProgressFromGradedAttempt(
    userId: string,
    attemptId: string,
  ): Promise<ReconcileResult> {
    // 1. Load authoritative attempt state from PostgreSQL
    const attempt = await this.progressRepo.findGradedAttempt(attemptId, userId);
    if (!attempt || attempt.userId !== userId) {
      throw new AppError(
        "Quiz attempt not found",
        ERROR_CODES.QUIZ_ATTEMPT_NOT_FOUND,
        HTTP_STATUS.NOT_FOUND,
      );
    }

    if (attempt.status !== "GRADED") {
      throw new AppError(
        "Attempt is not graded",
        ERROR_CODES.INVALID_QUIZ_STATE,
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    // 2. If attempt failed, no progression mutation or downgrade occurs
    if (!attempt.passed) {
      return {
        lessonProgress: null,
        facts: [],
      };
    }

    // 3. Passing attempt: execute progression transaction
    return await this.txRunner.run(async (ctx) => {
      const repo = ctx.repositories.academyProgressRepo;
      const lessonId = attempt.quiz.lessonId;
      const courseId = attempt.quiz.lesson.courseId;
      const completedAt = attempt.gradedAt ?? new Date();
      const facts: AcademyCompletionFact[] = [];

      // Safe lesson progression upsert
      const lessonResult = await repo.upsertLessonProgressSafe(
        userId,
        lessonId,
        "COMPLETED",
        completedAt,
      );

      if (lessonResult.isFirstCompletion) {
        facts.push({
          userId,
          resourceType: "LESSON",
          resourceId: lessonId,
          isFirstCompletion: true,
          completedAt: lessonResult.progress.completedAt ?? completedAt,
        });
      }

      // Course progress rollup
      const publishedLessons = await repo.getPublishedLessonsForCourse(courseId);
      const userLessonsProgress = await repo.listLessonProgressForUser(
        userId,
        publishedLessons.map((l) => l.id),
      );

      const completedCount = publishedLessons.filter((pl) =>
        userLessonsProgress.some(
          (ulp) =>
            ulp.lessonId === pl.id &&
            (ulp.status === "COMPLETED" || ulp.completedAt !== null),
        ),
      ).length;
      const totalCount = publishedLessons.length;

      if (totalCount > 0 && completedCount === totalCount) {
        const courseResult = await repo.upsertCourseProgressSafe(
          userId,
          courseId,
          "COMPLETED",
          completedAt,
        );
        if (courseResult.isFirstCompletion) {
          facts.push({
            userId,
            resourceType: "COURSE",
            resourceId: courseId,
            isFirstCompletion: true,
            completedAt: courseResult.progress.completedAt ?? completedAt,
          });
        }
      } else if (totalCount > 0 && completedCount > 0) {
        await repo.upsertCourseProgressSafe(
          userId,
          courseId,
          "IN_PROGRESS",
          null,
        );
      }

      return {
        lessonProgress: toLessonProgressDto({
          slug: attempt.quiz.lesson.slug,
          status: lessonResult.progress.status,
          completed: true,
          completedAt: lessonResult.progress.completedAt,
        }),
        facts,
      };
    });
  }
}
