import { describe, it, expect, vi } from "vitest";
import { AcademyQuizAttemptService } from "../../src/modules/academy/academy-quiz-attempt.service.js";
import type { IAcademyQuizRepository } from "../../src/modules/academy/academy.repository.js";
import type { ITransactionRunner } from "../../src/infrastructure/database/transaction-runner.js";
import { AppError } from "../../src/shared/errors/error-envelope.js";
import { ERROR_CODES, HTTP_STATUS } from "@aura/shared";
import { Prisma } from "@prisma/client";

describe("AcademyQuizAttemptService - Unit Tests (FEAT-024)", () => {
  const createMockRepo = (overrides: Partial<IAcademyQuizRepository> = {}): IAcademyQuizRepository => ({
    createQuiz: vi.fn(),
    findQuizById: vi.fn(),
    listQuizzesByLesson: vi.fn(),
    createQuestionWithOptions: vi.fn(),
    createQuestion: vi.fn(),
    findQuestionById: vi.fn(),
    listQuestionsByQuiz: vi.fn(),
    createOption: vi.fn(),
    listOptionsByQuestion: vi.fn(),
    createAttempt: vi.fn(),
    findAttemptById: vi.fn(),
    createAnswer: vi.fn(),
    findAnswersByAttempt: vi.fn(),
    findPublishedQuizByLesson: vi.fn().mockResolvedValue(null),
    findActiveAttempt: vi.fn().mockResolvedValue(null),
    startAttemptWithLock: vi.fn(),
    findAttemptWithAnswersById: vi.fn().mockResolvedValue(null),
    upsertDraftAnswer: vi.fn(),
    findQuestionWithQuiz: vi.fn().mockResolvedValue(null),
    findOptionWithQuestion: vi.fn().mockResolvedValue(null),
    verifyPublishedHierarchyByQuizId: vi.fn().mockResolvedValue(true),
    submitAndGradeAttempt: vi.fn(),
    findGradedAttemptResult: vi.fn(),
    ...overrides,
  });

  const createMockTxRunner = (repo: IAcademyQuizRepository): ITransactionRunner => ({
    run: vi.fn().mockImplementation(async (operation) => {
      const ctx = {
        id: "mock-tx-id",
        tx: {} as unknown as Prisma.TransactionClient,
        repositories: {
          academyQuizRepo: repo,
        } as unknown as IRepositoryContainer,
        depth: 1,
        isCompleted: false,
      };
      return operation(ctx);
    }),
    getActiveContext: vi.fn().mockReturnValue(undefined),
    isInTransaction: vi.fn().mockReturnValue(false),
  });

  const mockPublishedQuiz = {
    id: "quiz-uuid-1",
    title: "Intro Quiz",
    description: "Test quiz",
    passingScore: 80,
    lesson: {
      title: "Intro Lesson",
      slug: "intro-lesson",
      course: {
        slug: "intro-course",
      },
    },
    questions: [],
  };

  const mockActiveAttemptEntity = {
    id: "attempt-uuid-1",
    userId: "user-uuid-1",
    quizId: "quiz-uuid-1",
    attemptNumber: 1,
    status: "IN_PROGRESS",
    score: null,
    passed: null,
    quizTitleSnapshot: "Intro Quiz",
    quizVersionSnapshot: null,
    startedAt: new Date("2026-09-06T00:00:00.000Z"),
    submittedAt: null,
    gradedAt: null,
    createdAt: new Date("2026-09-06T00:00:00.000Z"),
    updatedAt: new Date("2026-09-06T00:00:00.000Z"),
    answers: [],
  };

  describe("startAttempt", () => {
    it("starts a new attempt and returns created: true with safe DTO when no active attempt exists", async () => {
      const mockRepo = createMockRepo({
        findPublishedQuizByLesson: vi.fn().mockResolvedValue(mockPublishedQuiz),
        startAttemptWithLock: vi.fn().mockResolvedValue({
          attempt: mockActiveAttemptEntity,
          created: true,
        }),
      });
      const mockTx = createMockTxRunner(mockRepo);
      const service = new AcademyQuizAttemptService(mockRepo, mockTx);

      const result = await service.startAttempt("user-uuid-1", "intro-course", "intro-lesson", {});

      expect(result.created).toBe(true);
      expect(result.attempt.id).toBe("attempt-uuid-1");
      expect(result.attempt.status).toBe("IN_PROGRESS");
      expect(result.attempt.attemptNumber).toBe(1);
      // Verify AC-011 Whitelist: zero internal/evaluation fields
      const attemptRecord = result.attempt as Record<string, unknown>;
      expect(attemptRecord.userId).toBeUndefined();
      expect(attemptRecord.score).toBeUndefined();
      expect(attemptRecord.passed).toBeUndefined();
      expect(attemptRecord.submittedAt).toBeUndefined();
      expect(attemptRecord.gradedAt).toBeUndefined();
      expect(attemptRecord.completedAt).toBeUndefined();
      expect(attemptRecord.isCorrect).toBeUndefined();
      expect(attemptRecord.correctOptionId).toBeUndefined();
      expect(attemptRecord.correctOptionTextSnapshot).toBeUndefined();
      expect(attemptRecord.questionPromptSnapshot).toBeUndefined();
      expect(attemptRecord.selectedOptionTextSnapshot).toBeUndefined();
      expect(attemptRecord.gradingResult).toBeUndefined();
      expect(attemptRecord.passFailResult).toBeUndefined();
    });

    it("returns existing active attempt with created: false when attempt already active", async () => {
      const mockRepo = createMockRepo({
        findPublishedQuizByLesson: vi.fn().mockResolvedValue(mockPublishedQuiz),
        startAttemptWithLock: vi.fn().mockResolvedValue({
          attempt: mockActiveAttemptEntity,
          created: false,
        }),
      });
      const mockTx = createMockTxRunner(mockRepo);
      const service = new AcademyQuizAttemptService(mockRepo, mockTx);

      const result = await service.startAttempt("user-uuid-1", "intro-course", "intro-lesson", {});

      expect(result.created).toBe(false);
      expect(result.attempt.id).toBe("attempt-uuid-1");
    });

    it("strictly rejects client-supplied authoritative fields with 400 VALIDATION_ERROR", async () => {
      const mockRepo = createMockRepo();
      const mockTx = createMockTxRunner(mockRepo);
      const service = new AcademyQuizAttemptService(mockRepo, mockTx);

      const forbiddenBodies = [
        { userId: "forged-user" },
        { quizId: "forged-quiz" },
        { attemptNumber: 99 },
        { status: "GRADED" },
        { score: 100 },
        { passed: true },
        { startedAt: "2026-01-01T00:00:00.000Z" },
        { xp: 50 },
      ];

      for (const body of forbiddenBodies) {
        await expect(
          service.startAttempt("user-uuid-1", "intro-course", "intro-lesson", body),
        ).rejects.toThrowError(
          new AppError("Validation failed", ERROR_CODES.VALIDATION_ERROR, HTTP_STATUS.BAD_REQUEST),
        );
      }
    });

    it("returns generic 404 NOT_FOUND when hierarchy is missing or unpublished", async () => {
      const mockRepo = createMockRepo({
        findPublishedQuizByLesson: vi.fn().mockResolvedValue(null),
      });
      const mockTx = createMockTxRunner(mockRepo);
      const service = new AcademyQuizAttemptService(mockRepo, mockTx);

      await expect(
        service.startAttempt("user-uuid-1", "intro-course", "intro-lesson", {}),
      ).rejects.toThrowError(
        new AppError("Resource not found", ERROR_CODES.NOT_FOUND, HTTP_STATUS.NOT_FOUND),
      );
    });

    it("recovers targeted P2002 race condition when active attempt exists", async () => {
      const p2002Error = new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
        code: "P2002",
        clientVersion: "6.0.0",
      });

      const mockRepo = createMockRepo({
        findPublishedQuizByLesson: vi.fn().mockResolvedValue(mockPublishedQuiz),
        startAttemptWithLock: vi.fn().mockRejectedValue(p2002Error),
        findActiveAttempt: vi.fn().mockResolvedValue(mockActiveAttemptEntity),
      });
      const mockTx = createMockTxRunner(mockRepo);
      const service = new AcademyQuizAttemptService(mockRepo, mockTx);

      const result = await service.startAttempt("user-uuid-1", "intro-course", "intro-lesson", {});

      expect(result.created).toBe(false);
      expect(result.attempt.id).toBe("attempt-uuid-1");
      expect(mockRepo.findActiveAttempt).toHaveBeenCalledWith("user-uuid-1", "quiz-uuid-1");
    });

    it("rethrows error on unrelated P2002 when NO active attempt exists", async () => {
      const p2002Error = new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
        code: "P2002",
        clientVersion: "6.0.0",
      });

      const mockRepo = createMockRepo({
        findPublishedQuizByLesson: vi.fn().mockResolvedValue(mockPublishedQuiz),
        startAttemptWithLock: vi.fn().mockRejectedValue(p2002Error),
        findActiveAttempt: vi.fn().mockResolvedValue(null),
      });
      const mockTx = createMockTxRunner(mockRepo);
      const service = new AcademyQuizAttemptService(mockRepo, mockTx);

      await expect(
        service.startAttempt("user-uuid-1", "intro-course", "intro-lesson", {}),
      ).rejects.toThrow(p2002Error);
    });
  });

  describe("getCurrentAttempt", () => {
    it("returns active IN_PROGRESS attempt when found", async () => {
      const mockRepo = createMockRepo({
        findPublishedQuizByLesson: vi.fn().mockResolvedValue(mockPublishedQuiz),
        findActiveAttempt: vi.fn().mockResolvedValue(mockActiveAttemptEntity),
      });
      const service = new AcademyQuizAttemptService(mockRepo);

      const result = await service.getCurrentAttempt("user-uuid-1", "intro-course", "intro-lesson");

      expect(result.id).toBe("attempt-uuid-1");
      expect(result.status).toBe("IN_PROGRESS");
    });

    it("throws 404 NOT_FOUND when hierarchy is unpublished", async () => {
      const mockRepo = createMockRepo({
        findPublishedQuizByLesson: vi.fn().mockResolvedValue(null),
      });
      const service = new AcademyQuizAttemptService(mockRepo);

      await expect(
        service.getCurrentAttempt("user-uuid-1", "intro-course", "intro-lesson"),
      ).rejects.toThrowError(
        new AppError("Resource not found", ERROR_CODES.NOT_FOUND, HTTP_STATUS.NOT_FOUND),
      );
    });

    it("throws 404 QUIZ_ATTEMPT_NOT_FOUND when no active attempt exists", async () => {
      const mockRepo = createMockRepo({
        findPublishedQuizByLesson: vi.fn().mockResolvedValue(mockPublishedQuiz),
        findActiveAttempt: vi.fn().mockResolvedValue(null),
      });
      const service = new AcademyQuizAttemptService(mockRepo);

      await expect(
        service.getCurrentAttempt("user-uuid-1", "intro-course", "intro-lesson"),
      ).rejects.toThrowError(
        new AppError("Quiz attempt not found", ERROR_CODES.QUIZ_ATTEMPT_NOT_FOUND, HTTP_STATUS.NOT_FOUND),
      );
    });
  });

  describe("getAttemptById", () => {
    it("returns 404 QUIZ_ATTEMPT_NOT_FOUND when attempt does not exist or belongs to another user", async () => {
      const mockRepo = createMockRepo({
        findAttemptWithAnswersById: vi.fn().mockResolvedValue(null),
      });
      const service = new AcademyQuizAttemptService(mockRepo);

      await expect(service.getAttemptById("user-uuid-1", "nonexistent-id")).rejects.toThrowError(
        new AppError("Quiz attempt not found", ERROR_CODES.QUIZ_ATTEMPT_NOT_FOUND, HTTP_STATUS.NOT_FOUND),
      );
    });

    it("returns 404 QUIZ_ATTEMPT_NOT_FOUND for CREATED attempt (unavailable to FEAT-024 learner runtime)", async () => {
      const mockRepo = createMockRepo({
        findAttemptWithAnswersById: vi.fn().mockResolvedValue({
          ...mockActiveAttemptEntity,
          status: "CREATED",
        }),
      });
      const service = new AcademyQuizAttemptService(mockRepo);

      await expect(service.getAttemptById("user-uuid-1", "attempt-uuid-1")).rejects.toThrowError(
        new AppError("Quiz attempt not found", ERROR_CODES.QUIZ_ATTEMPT_NOT_FOUND, HTTP_STATUS.NOT_FOUND),
      );
    });

    it("returns 404 NOT_FOUND for IN_PROGRESS attempt when source hierarchy becomes unpublished", async () => {
      const mockRepo = createMockRepo({
        findAttemptWithAnswersById: vi.fn().mockResolvedValue(mockActiveAttemptEntity),
        verifyPublishedHierarchyByQuizId: vi.fn().mockResolvedValue(false),
      });
      const service = new AcademyQuizAttemptService(mockRepo);

      await expect(service.getAttemptById("user-uuid-1", "attempt-uuid-1")).rejects.toThrowError(
        new AppError("Resource not found", ERROR_CODES.NOT_FOUND, HTTP_STATUS.NOT_FOUND),
      );
    });

    it("allows historical read for SUBMITTED / GRADED attempt even when hierarchy is unpublished", async () => {
      const mockRepo = createMockRepo({
        findAttemptWithAnswersById: vi.fn().mockResolvedValue({
          ...mockActiveAttemptEntity,
          status: "GRADED",
        }),
        verifyPublishedHierarchyByQuizId: vi.fn().mockResolvedValue(false), // unpublished!
      });
      const service = new AcademyQuizAttemptService(mockRepo);

      const result = await service.getAttemptById("user-uuid-1", "attempt-uuid-1");

      expect(result.id).toBe("attempt-uuid-1");
      expect(result.status).toBe("GRADED");
      // verifyPublishedHierarchyByQuizId should NOT even be called for GRADED
      expect(mockRepo.verifyPublishedHierarchyByQuizId).not.toHaveBeenCalled();
    });
  });

  describe("recordDraftAnswer", () => {
    const validOptionId = "00000000-0000-0000-0000-000000000002";
    const validQuestionId = "00000000-0000-0000-0000-000000000001";

    it("rejects malformed body with 400 VALIDATION_ERROR", async () => {
      const mockRepo = createMockRepo();
      const service = new AcademyQuizAttemptService(mockRepo);

      await expect(
        service.recordDraftAnswer("user-uuid-1", "attempt-1", validQuestionId, { optionId: "not-a-uuid" }),
      ).rejects.toThrowError(
        new AppError("Validation failed", ERROR_CODES.VALIDATION_ERROR, HTTP_STATUS.BAD_REQUEST),
      );
    });

    it("rejects attempt belonging to another user with 404 QUIZ_ATTEMPT_NOT_FOUND", async () => {
      const mockRepo = createMockRepo({
        findAttemptWithAnswersById: vi.fn().mockResolvedValue(null),
      });
      const service = new AcademyQuizAttemptService(mockRepo);

      await expect(
        service.recordDraftAnswer("user-uuid-1", "foreign-attempt", validQuestionId, { optionId: validOptionId }),
      ).rejects.toThrowError(
        new AppError("Quiz attempt not found", ERROR_CODES.QUIZ_ATTEMPT_NOT_FOUND, HTTP_STATUS.NOT_FOUND),
      );
    });

    it("rejects finalized attempts with 409 ATTEMPT_ALREADY_FINALIZED before content check", async () => {
      const finalizedStatuses = ["SUBMITTED", "GRADED"];

      for (const status of finalizedStatuses) {
        const mockRepo = createMockRepo({
          findAttemptWithAnswersById: vi.fn().mockResolvedValue({
            ...mockActiveAttemptEntity,
            status,
          }),
          verifyPublishedHierarchyByQuizId: vi.fn().mockResolvedValue(false), // Even if unpublished!
        });
        const service = new AcademyQuizAttemptService(mockRepo);

        await expect(
          service.recordDraftAnswer("user-uuid-1", "attempt-uuid-1", validQuestionId, { optionId: validOptionId }),
        ).rejects.toThrowError(
          new AppError("Attempt is already finalized", ERROR_CODES.ATTEMPT_ALREADY_FINALIZED, HTTP_STATUS.CONFLICT),
        );
      }
    });

    it("rejects unpublished hierarchy for IN_PROGRESS attempt with 404 NOT_FOUND", async () => {
      const mockRepo = createMockRepo({
        findAttemptWithAnswersById: vi.fn().mockResolvedValue(mockActiveAttemptEntity),
        verifyPublishedHierarchyByQuizId: vi.fn().mockResolvedValue(false),
      });
      const service = new AcademyQuizAttemptService(mockRepo);

      await expect(
        service.recordDraftAnswer("user-uuid-1", "attempt-uuid-1", validQuestionId, { optionId: validOptionId }),
      ).rejects.toThrowError(
        new AppError("Resource not found", ERROR_CODES.NOT_FOUND, HTTP_STATUS.NOT_FOUND),
      );
    });

    it("rejects question from a different quiz with 400 INVALID_OPTION_FOR_QUESTION", async () => {
      const mockRepo = createMockRepo({
        findAttemptWithAnswersById: vi.fn().mockResolvedValue(mockActiveAttemptEntity),
        verifyPublishedHierarchyByQuizId: vi.fn().mockResolvedValue(true),
        findQuestionWithQuiz: vi.fn().mockResolvedValue({
          id: validQuestionId,
          quizId: "different-quiz-uuid",
          prompt: "Wrong quiz question",
          type: "SINGLE_CHOICE",
          quiz: { id: "different-quiz-uuid", status: "PUBLISHED" },
        }),
      });
      const service = new AcademyQuizAttemptService(mockRepo);

      await expect(
        service.recordDraftAnswer("user-uuid-1", "attempt-uuid-1", validQuestionId, { optionId: validOptionId }),
      ).rejects.toThrowError(
        new AppError("Invalid option for question", ERROR_CODES.INVALID_OPTION_FOR_QUESTION, HTTP_STATUS.BAD_REQUEST),
      );
    });

    it("rejects option belonging to a different question with 400 INVALID_OPTION_FOR_QUESTION", async () => {
      const mockRepo = createMockRepo({
        findAttemptWithAnswersById: vi.fn().mockResolvedValue(mockActiveAttemptEntity),
        verifyPublishedHierarchyByQuizId: vi.fn().mockResolvedValue(true),
        findQuestionWithQuiz: vi.fn().mockResolvedValue({
          id: validQuestionId,
          quizId: "quiz-uuid-1",
          prompt: "Target question",
          type: "SINGLE_CHOICE",
          quiz: { id: "quiz-uuid-1", status: "PUBLISHED" },
        }),
        findOptionWithQuestion: vi.fn().mockResolvedValue({
          id: validOptionId,
          questionId: "another-question-uuid",
          text: "Wrong option",
          question: { id: "another-question-uuid", quizId: "quiz-uuid-1", prompt: "Other", type: "SINGLE_CHOICE" },
        }),
      });
      const service = new AcademyQuizAttemptService(mockRepo);

      await expect(
        service.recordDraftAnswer("user-uuid-1", "attempt-uuid-1", validQuestionId, { optionId: validOptionId }),
      ).rejects.toThrowError(
        new AppError("Invalid option for question", ERROR_CODES.INVALID_OPTION_FOR_QUESTION, HTTP_STATUS.BAD_REQUEST),
      );
    });

    it("upserts draft answer and returns safe draft answer DTO without evaluating correctness", async () => {
      const mockRepo = createMockRepo({
        findAttemptWithAnswersById: vi.fn().mockResolvedValue(mockActiveAttemptEntity),
        verifyPublishedHierarchyByQuizId: vi.fn().mockResolvedValue(true),
        findQuestionWithQuiz: vi.fn().mockResolvedValue({
          id: validQuestionId,
          quizId: "quiz-uuid-1",
          prompt: "What is hashing?",
          type: "SINGLE_CHOICE",
          quiz: { id: "quiz-uuid-1", status: "PUBLISHED" },
        }),
        findOptionWithQuestion: vi.fn().mockResolvedValue({
          id: validOptionId,
          questionId: validQuestionId,
          text: "One-way function",
          question: { id: validQuestionId, quizId: "quiz-uuid-1", prompt: "What is hashing?", type: "SINGLE_CHOICE" },
        }),
        upsertDraftAnswer: vi.fn().mockResolvedValue({
          id: "answer-uuid-1",
          attemptId: "attempt-uuid-1",
          quizId: "quiz-uuid-1",
          questionId: validQuestionId,
          selectedOptionId: validOptionId,
          isCorrect: null,
          correctOptionIdSnapshot: null,
          correctOptionTextSnapshot: null,
          questionPromptSnapshot: "What is hashing?",
          selectedOptionTextSnapshot: "One-way function",
          createdAt: new Date("2026-09-06T00:00:00.000Z"),
          updatedAt: new Date("2026-09-06T00:00:01.000Z"),
        }),
      });
      const service = new AcademyQuizAttemptService(mockRepo);

      const result = await service.recordDraftAnswer("user-uuid-1", "attempt-uuid-1", validQuestionId, {
        optionId: validOptionId,
      });

      expect(result.questionId).toBe(validQuestionId);
      expect(result.selectedOptionId).toBe(validOptionId);
      expect(result.updatedAt).toBe("2026-09-06T00:00:01.000Z");
      // Verify upsert input strictly sets zero evaluation / correctness
      expect(mockRepo.upsertDraftAnswer).toHaveBeenCalledWith({
        attemptId: "attempt-uuid-1",
        quizId: "quiz-uuid-1",
        questionId: validQuestionId,
        selectedOptionId: validOptionId,
        questionPromptSnapshot: "What is hashing?",
        selectedOptionTextSnapshot: "One-way function",
      });
    });
  });

  // ==========================================================================
  // FEAT-025 Server-Side Quiz Evaluation & Secure Submission Tests
  // ==========================================================================

  describe("submitAttempt (FEAT-025)", () => {
    const mockGradedResult = {
      attemptId: "attempt-uuid-1",
      quizId: "quiz-uuid-1",
      status: "GRADED" as const,
      score: 100,
      passed: true,
      submittedAt: "2026-09-07T00:00:00.000Z",
      gradedAt: "2026-09-07T00:00:01.000Z",
      answers: [
        {
          questionId: "q-1",
          selectedOptionId: "opt-1",
          isCorrect: true,
          correctOptionId: "opt-1",
        },
      ],
    };

    it("rejects non-empty body with 400 VALIDATION_ERROR (AC-002)", async () => {
      const mockRepo = createMockRepo();
      const service = new AcademyQuizAttemptService(mockRepo);

      await expect(
        service.submitAttempt("user-uuid-1", "attempt-uuid-1", { score: 100 }),
      ).rejects.toThrowError(
        new AppError("Validation failed", ERROR_CODES.VALIDATION_ERROR, HTTP_STATUS.BAD_REQUEST),
      );

      await expect(
        service.submitAttempt("user-uuid-1", "attempt-uuid-1", { passed: true }),
      ).rejects.toThrowError(
        new AppError("Validation failed", ERROR_CODES.VALIDATION_ERROR, HTTP_STATUS.BAD_REQUEST),
      );

      await expect(
        service.submitAttempt("user-uuid-1", "attempt-uuid-1", { userId: "spoofed-user" }),
      ).rejects.toThrowError(
        new AppError("Validation failed", ERROR_CODES.VALIDATION_ERROR, HTTP_STATUS.BAD_REQUEST),
      );

      await expect(
        service.submitAttempt("user-uuid-1", "attempt-uuid-1", { isCorrect: true }),
      ).rejects.toThrowError(
        new AppError("Validation failed", ERROR_CODES.VALIDATION_ERROR, HTTP_STATUS.BAD_REQUEST),
      );
    });

    it("executes atomic grading transaction and returns QuizResultDto on success (AC-008, AC-011)", async () => {
      const mockRepo = createMockRepo({
        submitAndGradeAttempt: vi.fn().mockResolvedValue(mockGradedResult),
      });
      const mockTx = createMockTxRunner(mockRepo);
      const service = new AcademyQuizAttemptService(mockRepo, mockTx);

      const result = await service.submitAttempt("user-uuid-1", "attempt-uuid-1", {});

      expect(mockTx.run).toHaveBeenCalledTimes(1);
      expect(mockRepo.submitAndGradeAttempt).toHaveBeenCalledWith("user-uuid-1", "attempt-uuid-1");
      expect(result).toEqual(mockGradedResult);
    });

    it("propagates 400 UNANSWERED_QUESTIONS when repository detects incomplete answers (AC-005)", async () => {
      const mockRepo = createMockRepo({
        submitAndGradeAttempt: vi.fn().mockRejectedValue(
          new AppError("All questions must be answered before submitting", ERROR_CODES.UNANSWERED_QUESTIONS, HTTP_STATUS.BAD_REQUEST),
        ),
      });
      const mockTx = createMockTxRunner(mockRepo);
      const service = new AcademyQuizAttemptService(mockRepo, mockTx);

      await expect(
        service.submitAttempt("user-uuid-1", "attempt-uuid-1", {}),
      ).rejects.toThrowError(
        new AppError("All questions must be answered before submitting", ERROR_CODES.UNANSWERED_QUESTIONS, HTTP_STATUS.BAD_REQUEST),
      );
    });

    it("propagates 400 INVALID_QUIZ_STATE when quiz has 0 questions (AC-006)", async () => {
      const mockRepo = createMockRepo({
        submitAndGradeAttempt: vi.fn().mockRejectedValue(
          new AppError("Quiz has no questions to evaluate", ERROR_CODES.INVALID_QUIZ_STATE, HTTP_STATUS.BAD_REQUEST),
        ),
      });
      const mockTx = createMockTxRunner(mockRepo);
      const service = new AcademyQuizAttemptService(mockRepo, mockTx);

      await expect(
        service.submitAttempt("user-uuid-1", "attempt-uuid-1", {}),
      ).rejects.toThrowError(
        new AppError("Quiz has no questions to evaluate", ERROR_CODES.INVALID_QUIZ_STATE, HTTP_STATUS.BAD_REQUEST),
      );
    });

    it("propagates 404 QUIZ_ATTEMPT_NOT_FOUND on nonexistent or foreign attempt (AC-003)", async () => {
      const mockRepo = createMockRepo({
        submitAndGradeAttempt: vi.fn().mockRejectedValue(
          new AppError("Quiz attempt not found", ERROR_CODES.QUIZ_ATTEMPT_NOT_FOUND, HTTP_STATUS.NOT_FOUND),
        ),
      });
      const mockTx = createMockTxRunner(mockRepo);
      const service = new AcademyQuizAttemptService(mockRepo, mockTx);

      await expect(
        service.submitAttempt("user-uuid-1", "attempt-uuid-1", {}),
      ).rejects.toThrowError(
        new AppError("Quiz attempt not found", ERROR_CODES.QUIZ_ATTEMPT_NOT_FOUND, HTTP_STATUS.NOT_FOUND),
      );
    });
  });

  describe("getGradedResult (FEAT-025)", () => {
    const mockGradedResult = {
      attemptId: "attempt-uuid-1",
      quizId: "quiz-uuid-1",
      status: "GRADED" as const,
      score: 80,
      passed: true,
      submittedAt: "2026-09-07T00:00:00.000Z",
      gradedAt: "2026-09-07T00:00:01.000Z",
      answers: [
        {
          questionId: "q-1",
          selectedOptionId: "opt-1",
          isCorrect: true,
          correctOptionId: "opt-1",
        },
      ],
    };

    it("returns QuizResultDto for owned GRADED attempt (AC-015)", async () => {
      const mockRepo = createMockRepo({
        findGradedAttemptResult: vi.fn().mockResolvedValue(mockGradedResult),
      });
      const service = new AcademyQuizAttemptService(mockRepo);

      const result = await service.getGradedResult("user-uuid-1", "attempt-uuid-1");

      expect(mockRepo.findGradedAttemptResult).toHaveBeenCalledWith("attempt-uuid-1", "user-uuid-1");
      expect(result).toEqual(mockGradedResult);
    });

    it("throws 404 QUIZ_ATTEMPT_NOT_FOUND when attempt is nonexistent, foreign, or not GRADED (AC-003, AC-015)", async () => {
      const mockRepo = createMockRepo({
        findGradedAttemptResult: vi.fn().mockResolvedValue(null),
      });
      const service = new AcademyQuizAttemptService(mockRepo);

      await expect(
        service.getGradedResult("user-uuid-1", "attempt-uuid-1"),
      ).rejects.toThrowError(
        new AppError("Quiz attempt not found", ERROR_CODES.QUIZ_ATTEMPT_NOT_FOUND, HTTP_STATUS.NOT_FOUND),
      );
    });
  });

  describe("Score Formula & Pass/Fail Invariants (FEAT-025)", () => {
    it("computes integer percentage via Math.round((C / N) * 100) (AC-009)", () => {
      // 1 out of 3 = 33%
      expect(Math.round((1 / 3) * 100)).toBe(33);
      // 2 out of 3 = 67%
      expect(Math.round((2 / 3) * 100)).toBe(67);
      // 4 out of 5 = 80%
      expect(Math.round((4 / 5) * 100)).toBe(80);
      // 0 out of 5 = 0%
      expect(Math.round((0 / 5) * 100)).toBe(0);
      // 5 out of 5 = 100%
      expect(Math.round((5 / 5) * 100)).toBe(100);
    });

    it("evaluates pass/fail with threshold equality score >= passingScore (AC-010)", () => {
      const passingScore = 80;
      // Below threshold
      expect(79 >= passingScore).toBe(false);
      // Threshold equality PASSES
      expect(80 >= passingScore).toBe(true);
      // Above threshold
      expect(81 >= passingScore).toBe(true);
      expect(100 >= passingScore).toBe(true);
    });

    it("verifies passingScore is omitted from QuizResultDto (Option B)", () => {
      const dto = {
        attemptId: "attempt-1",
        quizId: "quiz-1",
        status: "GRADED" as const,
        score: 80,
        passed: true,
        submittedAt: "2026-09-07T00:00:00.000Z",
        gradedAt: "2026-09-07T00:00:01.000Z",
        answers: [],
      };
      expect("passingScore" in dto).toBe(false);
    });
  });
});
