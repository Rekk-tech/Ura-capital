import { ERROR_CODES, HTTP_STATUS } from "@aura/shared";
import { AppError } from "../../shared/errors/error-envelope.js";
import type { IAcademyQuizRepository } from "./academy.repository.js";
import type { ITransactionRunner } from "../../infrastructure/database/transaction-runner.js";
import { transactionRunner as defaultTransactionRunner } from "../../infrastructure/database/transaction-runner.js";
import {
  toQuizAttemptDto,
  type QuizAttemptDto,
  type StartAttemptResult,
  type QuizResultDto,
} from "./academy.dto.js";
import {
  startQuizAttemptBodySchema,
  saveDraftAnswerBodySchema,
  submitQuizAttemptBodySchema,
} from "./academy.validation.js";

export class AcademyQuizAttemptService {
  constructor(
    private readonly quizRepo: IAcademyQuizRepository,
    private readonly txRunner: ITransactionRunner = defaultTransactionRunner,
  ) {}

  /**
   * Start a new quiz attempt or idempotently return existing active attempt.
   */
  async startAttempt(
    userId: string,
    courseSlug: string,
    lessonSlug: string,
    body: unknown,
  ): Promise<StartAttemptResult> {
    // 1. Strict Zod validation: rejects forged fields with 400 VALIDATION_ERROR
    const parsedBody = startQuizAttemptBodySchema.safeParse(body);
    if (!parsedBody.success) {
      throw new AppError(
        "Validation failed",
        ERROR_CODES.VALIDATION_ERROR,
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    // 2. Resolve published hierarchy: Course, Lesson, Quiz must all be PUBLISHED
    const quiz = await this.quizRepo.findPublishedQuizByLesson(courseSlug, lessonSlug);
    if (!quiz) {
      throw new AppError(
        "Resource not found",
        ERROR_CODES.NOT_FOUND,
        HTTP_STATUS.NOT_FOUND,
      );
    }

    // 3. Coordinate transactional attempt start with advisory lock & targeted P2002 recovery
    try {
      const result = await this.txRunner.run(async (ctx) => {
        return await ctx.repositories.academyQuizRepo.startAttemptWithLock(
          userId,
          quiz.id,
          quiz.title,
        );
      });

      return {
        attempt: toQuizAttemptDto(result.attempt),
        created: result.created,
      };
    } catch (err: unknown) {
      // Targeted P2002 race recovery: re-query exact (userId, quizId) active attempt
      if (this.isP2002Error(err)) {
        const active = await this.quizRepo.findActiveAttempt(userId, quiz.id);
        if (active) {
          return {
            attempt: toQuizAttemptDto(active),
            created: false,
          };
        }
      }
      throw err;
    }
  }

  /**
   * Read currently active IN_PROGRESS attempt for a published lesson quiz.
   */
  async getCurrentAttempt(
    userId: string,
    courseSlug: string,
    lessonSlug: string,
  ): Promise<QuizAttemptDto> {
    // Verify published hierarchy
    const quiz = await this.quizRepo.findPublishedQuizByLesson(courseSlug, lessonSlug);
    if (!quiz) {
      throw new AppError(
        "Resource not found",
        ERROR_CODES.NOT_FOUND,
        HTTP_STATUS.NOT_FOUND,
      );
    }

    // Query active IN_PROGRESS attempt
    const active = await this.quizRepo.findActiveAttempt(userId, quiz.id);
    if (!active) {
      throw new AppError(
        "Quiz attempt not found",
        ERROR_CODES.QUIZ_ATTEMPT_NOT_FOUND,
        HTTP_STATUS.NOT_FOUND,
      );
    }

    return toQuizAttemptDto(active);
  }

  /**
   * Read owned attempt by ID with status-aware continuation and historical read policy.
   */
  async getAttemptById(userId: string, attemptId: string): Promise<QuizAttemptDto> {
    // Query scoped by authenticated ownership
    const attempt = await this.quizRepo.findAttemptWithAnswersById(attemptId, userId);
    if (!attempt) {
      throw new AppError(
        "Quiz attempt not found",
        ERROR_CODES.QUIZ_ATTEMPT_NOT_FOUND,
        HTTP_STATUS.NOT_FOUND,
      );
    }

    // CREATED is unavailable to FEAT-024 learner runtime
    if (attempt.status === "CREATED") {
      throw new AppError(
        "Quiz attempt not found",
        ERROR_CODES.QUIZ_ATTEMPT_NOT_FOUND,
        HTTP_STATUS.NOT_FOUND,
      );
    }

    // IN_PROGRESS requires active published hierarchy continuation
    if (attempt.status === "IN_PROGRESS") {
      const isPublished = await this.quizRepo.verifyPublishedHierarchyByQuizId(attempt.quizId);
      if (!isPublished) {
        throw new AppError(
          "Resource not found",
          ERROR_CODES.NOT_FOUND,
          HTTP_STATUS.NOT_FOUND,
        );
      }
    }

    // SUBMITTED or GRADED permits historical safe read even if unpublished
    return toQuizAttemptDto(attempt);
  }

  /**
   * Persist durable draft answer selection for an IN_PROGRESS attempt.
   */
  async recordDraftAnswer(
    userId: string,
    attemptId: string,
    questionId: string,
    body: unknown,
  ): Promise<{ questionId: string; selectedOptionId: string; updatedAt: string }> {
    // 1. Validate request body
    const parsedBody = saveDraftAnswerBodySchema.safeParse(body);
    if (!parsedBody.success) {
      throw new AppError(
        "Validation failed",
        ERROR_CODES.VALIDATION_ERROR,
        HTTP_STATUS.BAD_REQUEST,
      );
    }
    const { optionId } = parsedBody.data;

    // 2. Ownership lookup
    const attempt = await this.quizRepo.findAttemptWithAnswersById(attemptId, userId);
    if (!attempt) {
      throw new AppError(
        "Quiz attempt not found",
        ERROR_CODES.QUIZ_ATTEMPT_NOT_FOUND,
        HTTP_STATUS.NOT_FOUND,
      );
    }

    // 3. State machine check (evaluated before content check)
    if (attempt.status === "SUBMITTED" || attempt.status === "GRADED") {
      throw new AppError(
        "Attempt is already finalized",
        ERROR_CODES.ATTEMPT_ALREADY_FINALIZED,
        HTTP_STATUS.CONFLICT,
      );
    }
    if (attempt.status !== "IN_PROGRESS") {
      throw new AppError(
        "Quiz attempt not found",
        ERROR_CODES.QUIZ_ATTEMPT_NOT_FOUND,
        HTTP_STATUS.NOT_FOUND,
      );
    }

    // 4. Unpublished continuation check
    const isPublished = await this.quizRepo.verifyPublishedHierarchyByQuizId(attempt.quizId);
    if (!isPublished) {
      throw new AppError(
        "Resource not found",
        ERROR_CODES.NOT_FOUND,
        HTTP_STATUS.NOT_FOUND,
      );
    }

    // 5. Relational tree validation
    const question = await this.quizRepo.findQuestionWithQuiz(questionId);
    if (!question || question.quizId !== attempt.quizId || question.type !== "SINGLE_CHOICE") {
      throw new AppError(
        "Invalid option for question",
        ERROR_CODES.INVALID_OPTION_FOR_QUESTION,
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    const option = await this.quizRepo.findOptionWithQuestion(optionId);
    if (
      !option ||
      option.questionId !== question.id ||
      option.question.quizId !== attempt.quizId
    ) {
      throw new AppError(
        "Invalid option for question",
        ERROR_CODES.INVALID_OPTION_FOR_QUESTION,
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    // 6. Upsert draft answer with zero evaluation
    const answer = await this.quizRepo.upsertDraftAnswer({
      attemptId,
      quizId: attempt.quizId,
      questionId,
      selectedOptionId: option.id,
      questionPromptSnapshot: question.prompt,
      selectedOptionTextSnapshot: option.text,
    });

    return {
      questionId: answer.questionId,
      selectedOptionId: answer.selectedOptionId ?? option.id,
      updatedAt: answer.updatedAt.toISOString(),
    };
  }

  /**
   * FEAT-025: Submit and grade quiz attempt server-authoritatively.
   */
  async submitAttempt(
    userId: string,
    attemptId: string,
    body: unknown,
  ): Promise<QuizResultDto> {
    // 1. Strict Zod validation: rejects forged fields or non-empty body with 400 VALIDATION_ERROR
    const parsedBody = submitQuizAttemptBodySchema.safeParse(body);
    if (!parsedBody.success) {
      throw new AppError(
        "Validation failed",
        ERROR_CODES.VALIDATION_ERROR,
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    // 2. Coordinate atomic evaluation transaction within TransactionRunner
    return await this.txRunner.run(async (ctx) => {
      return await ctx.repositories.academyQuizRepo.submitAndGradeAttempt(
        userId,
        attemptId,
      );
    });
  }

  /**
   * FEAT-025: Read historical graded result for an owned attempt.
   */
  async getGradedResult(
    userId: string,
    attemptId: string,
  ): Promise<QuizResultDto> {
    const result = await this.quizRepo.findGradedAttemptResult(attemptId, userId);
    if (!result) {
      throw new AppError(
        "Quiz attempt not found",
        ERROR_CODES.QUIZ_ATTEMPT_NOT_FOUND,
        HTTP_STATUS.NOT_FOUND,
      );
    }
    return result;
  }

  private isP2002Error(err: unknown): boolean {
    if (!err || typeof err !== "object") return false;
    const errObj = err as Record<string, unknown>;
    if (errObj.code === "P2002") return true;
    if (errObj.cause && typeof errObj.cause === "object" && (errObj.cause as Record<string, unknown>).code === "P2002") return true;
    return false;
  }
}
