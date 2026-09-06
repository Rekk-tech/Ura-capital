import { describe, it, expect, vi } from "vitest";
import { AcademyQuizReadService } from "../../src/modules/academy/academy-quiz-read.service.js";
import type { IAcademyQuizRepository } from "../../src/modules/academy/academy.repository.js";
import { AppError } from "../../src/shared/errors/error-envelope.js";
import { ERROR_CODES, HTTP_STATUS } from "@aura/shared";

describe("AcademyQuizReadService - Unit Tests (FEAT-023)", () => {
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
    ...overrides,
  });

  it("throws 404 NOT_FOUND AppError when quiz is not found or unavailable", async () => {
    const mockRepo = createMockRepo({
      findPublishedQuizByLesson: vi.fn().mockResolvedValue(null),
    });

    const service = new AcademyQuizReadService(mockRepo);

    await expect(service.getLessonQuiz("crypto-101", "missing-quiz-lesson")).rejects.toThrowError(
      new AppError("Resource not found", ERROR_CODES.NOT_FOUND, HTTP_STATUS.NOT_FOUND),
    );

    expect(mockRepo.findPublishedQuizByLesson).toHaveBeenCalledWith("crypto-101", "missing-quiz-lesson");
  });

  it("returns 200 with empty questions array and totalQuestions 0 when published quiz has zero questions", async () => {
    const mockRepo = createMockRepo({
      findPublishedQuizByLesson: vi.fn().mockResolvedValue({
        id: "quiz-empty-uuid",
        title: "Empty Quiz",
        description: "No questions yet",
        passingScore: 80,
        lesson: {
          title: "Introduction",
          slug: "intro",
          course: {
            slug: "crypto-101",
          },
        },
        questions: [],
      }),
    });

    const service = new AcademyQuizReadService(mockRepo);
    const result = await service.getLessonQuiz("crypto-101", "intro");

    expect(result).toEqual({
      data: {
        id: "quiz-empty-uuid",
        courseSlug: "crypto-101",
        lessonSlug: "intro",
        lessonTitle: "Introduction",
        title: "Empty Quiz",
        description: "No questions yet",
        passingScore: 80,
        totalQuestions: 0,
        questions: [],
      },
    });
  });

  it("returns strictly mapped QuizDefinitionDto with whitelist projection", async () => {
    const mockRecord = {
      id: "quiz-uuid-123",
      title: "Consensus Mechanisms Quiz",
      description: "Test your understanding",
      passingScore: 75,
      lesson: {
        title: "Proof of Work",
        slug: "proof-of-work",
        course: {
          slug: "blockchain-fundamentals",
        },
      },
      questions: [
        {
          id: "q-uuid-1",
          prompt: "What is the primary role of miners in Proof of Work?",
          type: "SINGLE_CHOICE",
          order: 1,
          options: [
            {
              id: "opt-uuid-1",
              text: "To validate and order transactions into blocks",
              order: 1,
            },
            {
              id: "opt-uuid-2",
              text: "To create new accounts for users",
              order: 2,
            },
          ],
        },
      ],
    };

    const mockRepo = createMockRepo({
      findPublishedQuizByLesson: vi.fn().mockResolvedValue(mockRecord),
    });

    const service = new AcademyQuizReadService(mockRepo);
    const result = await service.getLessonQuiz("blockchain-fundamentals", "proof-of-work");

    expect(result.data).toEqual({
      id: "quiz-uuid-123",
      courseSlug: "blockchain-fundamentals",
      lessonSlug: "proof-of-work",
      lessonTitle: "Proof of Work",
      title: "Consensus Mechanisms Quiz",
      description: "Test your understanding",
      passingScore: 75,
      totalQuestions: 1,
      questions: [
        {
          id: "q-uuid-1",
          prompt: "What is the primary role of miners in Proof of Work?",
          type: "SINGLE_CHOICE",
          order: 1,
          options: [
            {
              id: "opt-uuid-1",
              text: "To validate and order transactions into blocks",
              order: 1,
            },
            {
              id: "opt-uuid-2",
              text: "To create new accounts for users",
              order: 2,
            },
          ],
        },
      ],
    });

    // Verify exact keys on data
    expect(Object.keys(result.data).sort()).toEqual([
      "courseSlug",
      "description",
      "id",
      "lessonSlug",
      "lessonTitle",
      "passingScore",
      "questions",
      "title",
      "totalQuestions",
    ]);

    // Verify exact keys on question
    expect(Object.keys(result.data.questions[0]).sort()).toEqual([
      "id",
      "options",
      "order",
      "prompt",
      "type",
    ]);

    // Verify exact keys on option
    expect(Object.keys(result.data.questions[0].options[0]).sort()).toEqual([
      "id",
      "order",
      "text",
    ]);
  });
});
