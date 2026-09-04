import { describe, it, expect, vi } from "vitest";
import type { PrismaClient, Prisma } from "@prisma/client";
import { createRepositoryContainer } from "../../src/infrastructure/database/repository-factory.js";
import {
  PrismaAcademyCourseRepository,
  PrismaAcademyQuizRepository,
  PrismaAcademyProgressRepository,
  PrismaAcademyRewardRepository,
} from "../../src/modules/academy/academy.repository.js";
import {
  ACADEMY_CONTENT_STATUS,
  ACADEMY_PROGRESS_STATUS,
  QUIZ_ATTEMPT_STATUS,
  REWARD_LEDGER_STATUS,
  QUIZ_QUESTION_TYPES,
} from "../../src/modules/academy/academy.constants.js";

describe("FEAT-019 Academy Repositories & Factory Unit Tests", () => {
  describe("Repository Factory Container Integration", () => {
    it("instantiates all Academy repositories bound to root PrismaClient", () => {
      const mockPrisma = {} as unknown as PrismaClient;
      const container = createRepositoryContainer(mockPrisma);

      expect(container.academyCourseRepo).toBeInstanceOf(
        PrismaAcademyCourseRepository,
      );
      expect(container.academyQuizRepo).toBeInstanceOf(
        PrismaAcademyQuizRepository,
      );
      expect(container.academyProgressRepo).toBeInstanceOf(
        PrismaAcademyProgressRepository,
      );
      expect(container.academyRewardRepo).toBeInstanceOf(
        PrismaAcademyRewardRepository,
      );
    });

    it("instantiates all Academy repositories bound to a transaction client for Unit of Work", () => {
      const mockTx = {
        $transaction: vi.fn(),
      } as unknown as Prisma.TransactionClient;
      const container = createRepositoryContainer(mockTx);

      expect(container.academyCourseRepo).toBeInstanceOf(
        PrismaAcademyCourseRepository,
      );
      expect(container.academyQuizRepo).toBeInstanceOf(
        PrismaAcademyQuizRepository,
      );
      expect(container.academyProgressRepo).toBeInstanceOf(
        PrismaAcademyProgressRepository,
      );
      expect(container.academyRewardRepo).toBeInstanceOf(
        PrismaAcademyRewardRepository,
      );
    });
  });

  describe("Academy Constants & Closed-Set Statuses", () => {
    it("exports correct closed-set status enums and question types", () => {
      expect(ACADEMY_CONTENT_STATUS).toEqual({
        DRAFT: "DRAFT",
        PUBLISHED: "PUBLISHED",
        ARCHIVED: "ARCHIVED",
      });

      expect(ACADEMY_PROGRESS_STATUS).toEqual({
        NOT_STARTED: "NOT_STARTED",
        IN_PROGRESS: "IN_PROGRESS",
        COMPLETED: "COMPLETED",
      });

      expect(QUIZ_ATTEMPT_STATUS).toEqual({
        CREATED: "CREATED",
        IN_PROGRESS: "IN_PROGRESS",
        SUBMITTED: "SUBMITTED",
        GRADED: "GRADED",
      });

      expect(REWARD_LEDGER_STATUS).toEqual({
        PENDING: "PENDING",
        APPLIED: "APPLIED",
        REVERSED: "REVERSED",
      });

      expect(QUIZ_QUESTION_TYPES).toEqual({
        SINGLE_CHOICE: "SINGLE_CHOICE",
      });
    });
  });

  describe("Quiz Answer Security Boundary (AC-025, AC-037)", () => {
    it("verifies isCorrect is a server-only persistence field and not stripped unexpectedly", async () => {
      const mockCreate = vi.fn().mockResolvedValue({
        id: "opt-1",
        questionId: "q-1",
        text: "Capital gains tax",
        isCorrect: true,
        order: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const mockPrisma = {
        academyQuizOption: {
          create: mockCreate,
        },
      } as unknown as PrismaClient;

      const repo = new PrismaAcademyQuizRepository(mockPrisma);
      const result = await repo.createOption({
        questionId: "q-1",
        text: "Capital gains tax",
        isCorrect: true,
        order: 1,
      });

      expect(mockCreate).toHaveBeenCalledWith({
        data: {
          questionId: "q-1",
          text: "Capital gains tax",
          isCorrect: true,
          order: 1,
        },
      });
      expect(result.isCorrect).toBe(true);
    });
  });

  describe("Atomic Question & Options Creation (DEF-011, AC-021, AC-022)", () => {
    it("creates question and options atomically via createQuestionWithOptions", async () => {
      const mockQuestionCreate = vi.fn().mockResolvedValue({
        id: "q-1",
        quizId: "quiz-1",
        prompt: "What is compound interest?",
        type: "SINGLE_CHOICE",
        order: 1,
      });
      const mockOptionCreate = vi.fn()
        .mockResolvedValueOnce({
          id: "opt-1",
          questionId: "q-1",
          text: "Interest on principal only",
          isCorrect: false,
          order: 1,
        })
        .mockResolvedValueOnce({
          id: "opt-2",
          questionId: "q-1",
          text: "Interest on principal plus accumulated interest",
          isCorrect: true,
          order: 2,
        });

      const mockPrisma = {
        $transaction: vi.fn().mockImplementation(async (callback) => {
          return callback({
            academyQuizQuestion: { create: mockQuestionCreate },
            academyQuizOption: { create: mockOptionCreate },
          });
        }),
      } as unknown as PrismaClient;

      const repo = new PrismaAcademyQuizRepository(mockPrisma);
      const result = await repo.createQuestionWithOptions({
        quizId: "quiz-1",
        prompt: "What is compound interest?",
        order: 1,
        options: [
          { text: "Interest on principal only", isCorrect: false, order: 1 },
          { text: "Interest on principal plus accumulated interest", isCorrect: true, order: 2 },
        ],
      });

      expect(result.question.id).toBe("q-1");
      expect(result.options).toHaveLength(2);
      expect(result.options[1]?.isCorrect).toBe(true);
      expect(mockQuestionCreate).toHaveBeenCalledWith({
        data: {
          quizId: "quiz-1",
          prompt: "What is compound interest?",
          explanation: undefined,
          type: "SINGLE_CHOICE",
          order: 1,
        },
      });
      expect(mockOptionCreate).toHaveBeenCalledTimes(2);
    });
  });

  describe("Attempt & Answer Immutable Snapshot Mapping (AC-038)", () => {
    it("records immutable snapshots when creating attempt and answers", async () => {
      const mockAttemptCreate = vi.fn().mockResolvedValue({
        id: "attempt-1",
        userId: "user-1",
        quizId: "quiz-1",
        quizTitleSnapshot: "Investing 101 Quiz",
        quizVersionSnapshot: "v1.0",
        status: "CREATED",
      });

      const mockAnswerCreate = vi.fn().mockResolvedValue({
        id: "ans-1",
        attemptId: "attempt-1",
        quizId: "quiz-1",
        questionId: "q-1",
        selectedOptionId: "opt-1",
        isCorrect: true,
        questionPromptSnapshot: "What is an ETF?",
        selectedOptionTextSnapshot: "Exchange Traded Fund",
        correctOptionIdSnapshot: "opt-1",
        correctOptionTextSnapshot: "Exchange Traded Fund",
      });

      const mockPrisma = {
        academyQuizAttempt: { create: mockAttemptCreate },
        academyQuizAnswer: { create: mockAnswerCreate },
      } as unknown as PrismaClient;

      const repo = new PrismaAcademyQuizRepository(mockPrisma);

      const attempt = await repo.createAttempt({
        userId: "user-1",
        quizId: "quiz-1",
        quizTitleSnapshot: "Investing 101 Quiz",
        quizVersionSnapshot: "v1.0",
      });

      expect(attempt.quizTitleSnapshot).toBe("Investing 101 Quiz");

      const answer = await repo.createAnswer({
        attemptId: "attempt-1",
        quizId: "quiz-1",
        questionId: "q-1",
        selectedOptionId: "opt-1",
        isCorrect: true,
        questionPromptSnapshot: "What is an ETF?",
        selectedOptionTextSnapshot: "Exchange Traded Fund",
        correctOptionIdSnapshot: "opt-1",
        correctOptionTextSnapshot: "Exchange Traded Fund",
      });

      expect(answer.questionPromptSnapshot).toBe("What is an ETF?");
      expect(answer.selectedOptionTextSnapshot).toBe("Exchange Traded Fund");
    });
  });

  describe("Reward Ledger Idempotency & XP Aggregation (AC-014, AC-040)", () => {
    it("records reward with semantic tuple and supports deterministic idempotency key lookup", async () => {
      const mockRecordCreate = vi.fn().mockResolvedValue({
        id: "rew-1",
        userId: "user-1",
        sourceType: "QUIZ_PASS",
        sourceId: "quiz-1",
        rewardType: "XP",
        amount: 100,
        idempotencyKey: "user-1:QUIZ_PASS:quiz-1:XP",
        status: "APPLIED",
        metadata: { score: 100 },
        createdAt: new Date(),
      });

      const mockFindUnique = vi.fn().mockResolvedValue({
        id: "rew-1",
        idempotencyKey: "user-1:QUIZ_PASS:quiz-1:XP",
      });

      const mockUpsertXp = vi.fn().mockResolvedValue({
        id: "xp-1",
        userId: "user-1",
        totalXp: 100,
        level: 1,
      });

      const mockPrisma = {
        academyRewardLedger: {
          create: mockRecordCreate,
          findUnique: mockFindUnique,
        },
        academyUserXp: {
          upsert: mockUpsertXp,
        },
      } as unknown as PrismaClient;

      const repo = new PrismaAcademyRewardRepository(mockPrisma);

      const reward = await repo.recordReward({
        userId: "user-1",
        sourceType: "QUIZ_PASS",
        sourceId: "quiz-1",
        rewardType: "XP",
        amount: 100,
        idempotencyKey: "user-1:QUIZ_PASS:quiz-1:XP",
        metadata: { score: 100 },
      });

      expect(reward.amount).toBe(100);

      const found = await repo.findRewardByIdempotencyKey(
        "user-1:QUIZ_PASS:quiz-1:XP",
      );
      expect(found).not.toBeNull();

      const xp = await repo.upsertUserXp("user-1", 100);
      expect(xp.totalXp).toBe(100);
    });
  });

  describe("FEAT-020 Course & Lesson Read Operations", () => {
    it("listPublishedCourses applies PUBLISHED filter, pagination, and includes lesson count", async () => {
      const mockFindMany = vi.fn().mockResolvedValue([
        {
          id: "c-1",
          slug: "course-1",
          title: "Course 1",
          description: "Desc 1",
          level: "BEGINNER",
          status: "PUBLISHED",
          order: 1,
          _count: { lessons: 3 },
        },
      ]);
      const mockCount = vi.fn().mockResolvedValue(1);

      const mockPrisma = {
        academyCourse: {
          findMany: mockFindMany,
          count: mockCount,
        },
      } as unknown as PrismaClient;

      const repo = new PrismaAcademyCourseRepository(mockPrisma);
      const result = await repo.listPublishedCourses({ skip: 0, take: 20, level: "BEGINNER" });

      expect(mockFindMany).toHaveBeenCalledWith({
        where: { status: "PUBLISHED", level: "BEGINNER" },
        skip: 0,
        take: 20,
        orderBy: [{ order: "asc" }, { title: "asc" }, { id: "asc" }],
        include: {
          _count: {
            select: { lessons: { where: { status: "PUBLISHED" } } },
          },
        },
      });
      expect(mockCount).toHaveBeenCalledWith({
        where: { status: "PUBLISHED", level: "BEGINNER" },
      });
      expect(result.courses).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.courses[0]._count.lessons).toBe(3);
    });

    it("findPublishedCourseBySlug applies slug + PUBLISHED filter and orders lessons", async () => {
      const mockFindFirst = vi.fn().mockResolvedValue({
        id: "c-1",
        slug: "intro-finance",
        title: "Intro Finance",
        description: "Desc",
        level: "BEGINNER",
        status: "PUBLISHED",
        order: 1,
        lessons: [
          { slug: "lesson-1", title: "Lesson 1", order: 1 },
          { slug: "lesson-2", title: "Lesson 2", order: 2 },
        ],
      });

      const mockPrisma = {
        academyCourse: {
          findFirst: mockFindFirst,
        },
      } as unknown as PrismaClient;

      const repo = new PrismaAcademyCourseRepository(mockPrisma);
      const result = await repo.findPublishedCourseBySlug("intro-finance");

      expect(mockFindFirst).toHaveBeenCalledWith({
        where: { slug: "intro-finance", status: "PUBLISHED" },
        include: {
          lessons: {
            where: { status: "PUBLISHED" },
            select: { slug: true, title: true, order: true },
            orderBy: [{ order: "asc" }, { title: "asc" }, { id: "asc" }],
          },
        },
      });
      expect(result).not.toBeNull();
      expect(result?.lessons).toHaveLength(2);
    });

    it("findPublishedLessonByCourseAndSlug joins course and enforces published status", async () => {
      const mockFindFirst = vi.fn().mockResolvedValue({
        id: "l-1",
        courseId: "c-1",
        slug: "lesson-1",
        title: "Lesson 1",
        content: "Content text",
        order: 1,
        status: "PUBLISHED",
        course: { slug: "intro-finance" },
      });

      const mockPrisma = {
        academyLesson: {
          findFirst: mockFindFirst,
        },
      } as unknown as PrismaClient;

      const repo = new PrismaAcademyCourseRepository(mockPrisma);
      const result = await repo.findPublishedLessonByCourseAndSlug("intro-finance", "lesson-1");

      expect(mockFindFirst).toHaveBeenCalledWith({
        where: {
          slug: "lesson-1",
          status: "PUBLISHED",
          course: {
            slug: "intro-finance",
            status: "PUBLISHED",
          },
        },
        include: {
          course: {
            select: { slug: true },
          },
        },
      });
      expect(result?.content).toBe("Content text");
      expect(result?.course.slug).toBe("intro-finance");
    });
  });
});

