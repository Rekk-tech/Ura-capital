import { describe, it, expect, vi } from "vitest";
import { AcademyProgressionService } from "../../src/modules/academy/academy-progression.service.js";
import type { IAcademyProgressRepository } from "../../src/modules/academy/academy.repository.js";
import type { ITransactionRunner } from "../../src/infrastructure/database/transaction-runner.js";
import type { IRepositoryContainer } from "../../src/infrastructure/database/repository-factory.js";
import { ERROR_CODES, HTTP_STATUS, getCompletionKey } from "@aura/shared";
import type { Prisma } from "@prisma/client";

describe("AcademyProgressionService - Unit Tests (FEAT-026)", () => {
  const createMockProgressRepo = (
    overrides: Partial<IAcademyProgressRepository> = {},
  ): IAcademyProgressRepository => ({
    upsertCourseProgress: vi.fn(),
    findCourseProgress: vi.fn(),
    upsertLessonProgress: vi.fn(),
    findLessonProgress: vi.fn(),
    findCourseProgressBySlug: vi.fn().mockResolvedValue(null),
    findPublishedLessonWithCourse: vi.fn().mockResolvedValue(null),
    hasPublishedQuiz: vi.fn().mockResolvedValue(false),
    findGradedAttempt: vi.fn().mockResolvedValue(null),
    getPublishedLessonsForCourse: vi.fn().mockResolvedValue([]),
    listLessonProgressForUser: vi.fn().mockResolvedValue([]),
    upsertLessonProgressSafe: vi.fn().mockResolvedValue({
      progress: {
        id: "lp-1",
        userId: "user-1",
        lessonId: "lesson-1",
        status: "COMPLETED",
        startedAt: new Date(),
        completedAt: new Date("2026-09-10T10:00:00Z"),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      isFirstCompletion: true,
    }),
    upsertCourseProgressSafe: vi.fn().mockResolvedValue({
      progress: {
        id: "cp-1",
        userId: "user-1",
        courseId: "course-1",
        status: "COMPLETED",
        startedAt: new Date(),
        completedAt: new Date("2026-09-10T10:00:00Z"),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      isFirstCompletion: true,
    }),
    ...overrides,
  });

  const createMockTxRunner = (
    repo: IAcademyProgressRepository,
  ): ITransactionRunner => ({
    run: vi.fn().mockImplementation(async (operation) => {
      const ctx = {
        id: "mock-tx-id",
        tx: {} as unknown as Prisma.TransactionClient,
        repositories: {
          academyProgressRepo: repo,
        } as unknown as IRepositoryContainer,
        depth: 1,
        isCompleted: false,
      };
      return operation(ctx);
    }),
    getActiveContext: vi.fn().mockReturnValue(undefined),
    isInTransaction: vi.fn().mockReturnValue(false),
  });

  describe("AC-003: Strict Request Validation", () => {
    it("accepts empty object {} for informational lesson completion", async () => {
      const repo = createMockProgressRepo({
        findPublishedLessonWithCourse: vi.fn().mockResolvedValue({
          id: "lesson-1",
          slug: "intro-lesson",
          title: "Intro Lesson",
          courseId: "course-1",
          status: "PUBLISHED",
          course: { id: "course-1", slug: "crypto-101", status: "PUBLISHED" },
        }),
        hasPublishedQuiz: vi.fn().mockResolvedValue(false),
        getPublishedLessonsForCourse: vi.fn().mockResolvedValue([
          { id: "lesson-1", slug: "intro-lesson", title: "Intro Lesson", order: 1 },
        ]),
        listLessonProgressForUser: vi.fn().mockResolvedValue([
          { lessonId: "lesson-1", status: "COMPLETED", completedAt: new Date() },
        ]),
      });
      const txRunner = createMockTxRunner(repo);
      const service = new AcademyProgressionService(repo, txRunner);

      const result = await service.completeInformationalLesson(
        "user-1",
        "crypto-101",
        "intro-lesson",
        {},
      );

      expect(result.progress.completed).toBe(true);
      expect(result.progress.status).toBe("COMPLETED");
    });

    it("rejects client-asserted progress/reward fields with 400 VALIDATION_ERROR", async () => {
      const repo = createMockProgressRepo();
      const txRunner = createMockTxRunner(repo);
      const service = new AcademyProgressionService(repo, txRunner);

      const forgedBodies = [
        { completed: true },
        { status: "COMPLETED" },
        { completedAt: new Date().toISOString() },
        { progressPercent: 100 },
        { score: 100 },
        { passed: true },
        { xp: 50 },
        { userId: "forged-user-id" },
        { reward: 100 },
      ];

      for (const body of forgedBodies) {
        await expect(
          service.completeInformationalLesson(
            "user-1",
            "crypto-101",
            "intro-lesson",
            body,
          ),
        ).rejects.toThrow(
          expect.objectContaining({
            code: ERROR_CODES.VALIDATION_ERROR,
            statusCode: HTTP_STATUS.BAD_REQUEST,
          }),
        );
      }
    });

    it("rejects invalid slug format with 400 VALIDATION_ERROR", async () => {
      const repo = createMockProgressRepo();
      const txRunner = createMockTxRunner(repo);
      const service = new AcademyProgressionService(repo, txRunner);

      await expect(
        service.completeInformationalLesson(
          "user-1",
          "INVALID SLUG!",
          "intro-lesson",
          {},
        ),
      ).rejects.toThrow(
        expect.objectContaining({
          code: ERROR_CODES.VALIDATION_ERROR,
          statusCode: HTTP_STATUS.BAD_REQUEST,
        }),
      );

      await expect(
        service.getCourseProgress("user-1", "INVALID_COURSE!"),
      ).rejects.toThrow(
        expect.objectContaining({
          code: ERROR_CODES.VALIDATION_ERROR,
          statusCode: HTTP_STATUS.BAD_REQUEST,
        }),
      );
    });
  });

  describe("AC-009: Quiz Completion Guard", () => {
    it("rejects manual completion with 400 QUIZ_COMPLETION_REQUIRED if lesson has a published quiz", async () => {
      const repo = createMockProgressRepo({
        findPublishedLessonWithCourse: vi.fn().mockResolvedValue({
          id: "lesson-quiz-1",
          slug: "quiz-lesson",
          title: "Quiz Lesson",
          courseId: "course-1",
          status: "PUBLISHED",
          course: { id: "course-1", slug: "crypto-101", status: "PUBLISHED" },
        }),
        hasPublishedQuiz: vi.fn().mockResolvedValue(true), // published quiz exists
      });
      const txRunner = createMockTxRunner(repo);
      const service = new AcademyProgressionService(repo, txRunner);

      await expect(
        service.completeInformationalLesson(
          "user-1",
          "crypto-101",
          "quiz-lesson",
          {},
        ),
      ).rejects.toThrow(
        expect.objectContaining({
          code: ERROR_CODES.QUIZ_COMPLETION_REQUIRED,
          statusCode: HTTP_STATUS.BAD_REQUEST,
        }),
      );

      // Verify no transaction was started
      expect(txRunner.run).not.toHaveBeenCalled();
    });
  });

  describe("AC-008: Informational Lesson Completion & Idempotency", () => {
    it("completes informational lesson and returns completion fact on first completion", async () => {
      const firstCompletedAt = new Date("2026-09-10T08:00:00Z");
      const repo = createMockProgressRepo({
        findPublishedLessonWithCourse: vi.fn().mockResolvedValue({
          id: "lesson-info",
          slug: "info-lesson",
          title: "Info Lesson",
          courseId: "course-1",
          status: "PUBLISHED",
          course: { id: "course-1", slug: "crypto-101", status: "PUBLISHED" },
        }),
        hasPublishedQuiz: vi.fn().mockResolvedValue(false),
        upsertLessonProgressSafe: vi.fn().mockResolvedValue({
          progress: {
            id: "lp-info",
            userId: "user-1",
            lessonId: "lesson-info",
            status: "COMPLETED",
            startedAt: firstCompletedAt,
            completedAt: firstCompletedAt,
          },
          isFirstCompletion: true,
        }),
        getPublishedLessonsForCourse: vi.fn().mockResolvedValue([
          { id: "lesson-info", slug: "info-lesson", title: "Info Lesson", order: 1 },
          { id: "lesson-2", slug: "other-lesson", title: "Other Lesson", order: 2 },
        ]),
        listLessonProgressForUser: vi.fn().mockResolvedValue([
          { lessonId: "lesson-info", status: "COMPLETED", completedAt: firstCompletedAt },
        ]),
      });
      const txRunner = createMockTxRunner(repo);
      const service = new AcademyProgressionService(repo, txRunner);

      const result = await service.completeInformationalLesson(
        "user-1",
        "crypto-101",
        "info-lesson",
        {},
      );

      expect(result.progress.completed).toBe(true);
      expect(result.progress.lessonSlug).toBe("info-lesson");
      expect(result.facts).toHaveLength(1);
      expect(result.facts[0]).toEqual(
        expect.objectContaining({
          userId: "user-1",
          resourceType: "LESSON",
          resourceId: "lesson-info",
          isFirstCompletion: true,
        }),
      );
    });

    it("preserves original completedAt and emits isFirstCompletion=false on replay", async () => {
      const originalTime = new Date("2026-09-10T08:00:00Z");
      const repo = createMockProgressRepo({
        findPublishedLessonWithCourse: vi.fn().mockResolvedValue({
          id: "lesson-info",
          slug: "info-lesson",
          title: "Info Lesson",
          courseId: "course-1",
          status: "PUBLISHED",
          course: { id: "course-1", slug: "crypto-101", status: "PUBLISHED" },
        }),
        hasPublishedQuiz: vi.fn().mockResolvedValue(false),
        upsertLessonProgressSafe: vi.fn().mockResolvedValue({
          progress: {
            id: "lp-info",
            userId: "user-1",
            lessonId: "lesson-info",
            status: "COMPLETED",
            startedAt: originalTime,
            completedAt: originalTime,
          },
          isFirstCompletion: false, // Replay!
        }),
        getPublishedLessonsForCourse: vi.fn().mockResolvedValue([
          { id: "lesson-info", slug: "info-lesson", title: "Info Lesson", order: 1 },
        ]),
        listLessonProgressForUser: vi.fn().mockResolvedValue([
          { lessonId: "lesson-info", status: "COMPLETED", completedAt: originalTime },
        ]),
      });
      const txRunner = createMockTxRunner(repo);
      const service = new AcademyProgressionService(repo, txRunner);

      const result = await service.completeInformationalLesson(
        "user-1",
        "crypto-101",
        "info-lesson",
        {},
      );

      expect(result.progress.completed).toBe(true);
      expect(result.progress.completedAt).toBe(originalTime.toISOString());
      // No first completion fact emitted on replay
      const lessonFacts = result.facts.filter((f) => f.resourceType === "LESSON");
      expect(lessonFacts).toHaveLength(0);
    });
  });

  describe("AC-004 & AC-005 & AC-006: Quiz Attempt Reconciliation", () => {
    it("reconciles passing GRADED attempt into lesson completion", async () => {
      const gradedAt = new Date("2026-09-10T09:30:00Z");
      const repo = createMockProgressRepo({
        findGradedAttempt: vi.fn().mockResolvedValue({
          id: "attempt-pass-1",
          userId: "user-1",
          status: "GRADED",
          passed: true,
          score: 100,
          gradedAt,
          quiz: {
            id: "quiz-1",
            lessonId: "lesson-q-1",
            lesson: {
              id: "lesson-q-1",
              slug: "quiz-lesson",
              courseId: "course-1",
            },
          },
        }),
        getPublishedLessonsForCourse: vi.fn().mockResolvedValue([
          { id: "lesson-q-1", slug: "quiz-lesson", title: "Quiz Lesson", order: 1 },
        ]),
        listLessonProgressForUser: vi.fn().mockResolvedValue([
          { lessonId: "lesson-q-1", status: "COMPLETED", completedAt: gradedAt },
        ]),
      });
      const txRunner = createMockTxRunner(repo);
      const service = new AcademyProgressionService(repo, txRunner);

      const result = await service.reconcileProgressFromGradedAttempt(
        "user-1",
        "attempt-pass-1",
      );

      expect(result.lessonProgress).not.toBeNull();
      expect(result.lessonProgress?.completed).toBe(true);
      expect(result.lessonProgress?.lessonSlug).toBe("quiz-lesson");
      expect(result.facts.some((f) => f.resourceType === "LESSON" && f.isFirstCompletion)).toBe(true);
    });

    it("does not mutate or complete lesson when attempt passed=false", async () => {
      const repo = createMockProgressRepo({
        findGradedAttempt: vi.fn().mockResolvedValue({
          id: "attempt-fail-1",
          userId: "user-1",
          status: "GRADED",
          passed: false,
          score: 40,
          gradedAt: new Date(),
          quiz: {
            id: "quiz-1",
            lessonId: "lesson-q-1",
            lesson: { id: "lesson-q-1", slug: "quiz-lesson", courseId: "course-1" },
          },
        }),
      });
      const txRunner = createMockTxRunner(repo);
      const service = new AcademyProgressionService(repo, txRunner);

      const result = await service.reconcileProgressFromGradedAttempt(
        "user-1",
        "attempt-fail-1",
      );

      expect(result.lessonProgress).toBeNull();
      expect(result.facts).toHaveLength(0);
      expect(txRunner.run).not.toHaveBeenCalled();
    });
  });

  describe("AC-011 & AC-012: Course Progress Formula & Zero Published Lessons", () => {
    it("returns 0/0/0% without division by zero when course has 0 published lessons", async () => {
      const repo = createMockProgressRepo({
        findCourseProgressBySlug: vi.fn().mockResolvedValue({
          course: { id: "c-zero", slug: "empty-course", title: "Empty Course" },
          courseProgress: null,
          publishedLessons: [],
          lessonProgressMap: new Map(),
        }),
      });
      const txRunner = createMockTxRunner(repo);
      const service = new AcademyProgressionService(repo, txRunner);

      const result = await service.getCourseProgress("user-1", "empty-course");

      expect(result.totalLessons).toBe(0);
      expect(result.completedLessons).toBe(0);
      expect(result.progressPercent).toBe(0);
      expect(result.status).toBe("NOT_STARTED");
      expect(result.completed).toBe(false);
      expect(result.completedAt).toBeNull();
    });

    it("computes Math.round((completed / total) * 100) accurately", async () => {
      const p1 = { lessonId: "l1", status: "COMPLETED", completedAt: new Date() };
      const p2 = { lessonId: "l2", status: "COMPLETED", completedAt: new Date() };
      const map = new Map();
      map.set("l1", p1);
      map.set("l2", p2);

      const repo = createMockProgressRepo({
        findCourseProgressBySlug: vi.fn().mockResolvedValue({
          course: { id: "c-3", slug: "three-lessons", title: "Three Lessons" },
          courseProgress: { status: "IN_PROGRESS", completedAt: null },
          publishedLessons: [
            { id: "l1", slug: "lesson-1", title: "L1", order: 1 },
            { id: "l2", slug: "lesson-2", title: "L2", order: 2 },
            { id: "l3", slug: "lesson-3", title: "L3", order: 3 },
          ],
          lessonProgressMap: map,
        }),
      });
      const txRunner = createMockTxRunner(repo);
      const service = new AcademyProgressionService(repo, txRunner);

      const result = await service.getCourseProgress("user-1", "three-lessons");

      expect(result.completedLessons).toBe(2);
      expect(result.totalLessons).toBe(3);
      // Math.round((2/3) * 100) = 67
      expect(result.progressPercent).toBe(67);
      expect(result.status).toBe("IN_PROGRESS");
      expect(result.completed).toBe(false);
    });
  });

  describe("AC-013 & AC-014: Historical Completion & Curriculum Expansion", () => {
    it("preserves completed=true and original completedAt when active coverage is below 100%", async () => {
      const originalCompletedAt = new Date("2026-09-01T12:00:00Z");
      const map = new Map();
      map.set("l1", { lessonId: "l1", status: "COMPLETED", completedAt: originalCompletedAt });
      map.set("l2", { lessonId: "l2", status: "COMPLETED", completedAt: originalCompletedAt });

      const repo = createMockProgressRepo({
        findCourseProgressBySlug: vi.fn().mockResolvedValue({
          course: { id: "c-hist", slug: "expanded-course", title: "Expanded Course" },
          courseProgress: {
            status: "COMPLETED",
            completedAt: originalCompletedAt,
          },
          publishedLessons: [
            { id: "l1", slug: "lesson-1", title: "L1", order: 1 },
            { id: "l2", slug: "lesson-2", title: "L2", order: 2 },
            { id: "l3", slug: "lesson-3", title: "L3", order: 3 }, // newly published 3rd lesson
          ],
          lessonProgressMap: map,
        }),
      });
      const txRunner = createMockTxRunner(repo);
      const service = new AcademyProgressionService(repo, txRunner);

      const result = await service.getCourseProgress("user-1", "expanded-course");

      // Historical achievement preserved
      expect(result.completed).toBe(true);
      expect(result.status).toBe("COMPLETED");
      expect(result.completedAt).toBe(originalCompletedAt.toISOString());

      // Current curriculum coverage dynamically reflected
      expect(result.completedLessons).toBe(2);
      expect(result.totalLessons).toBe(3);
      expect(result.progressPercent).toBe(67);
    });
  });

  describe("AC-018 & AC-019: Secrecy & Completion Fact Contract", () => {
    it("exposes ZERO secret fields (score, pass, correct options, explanation) in progress DTO", async () => {
      const repo = createMockProgressRepo({
        findCourseProgressBySlug: vi.fn().mockResolvedValue({
          course: { id: "c-sec", slug: "secret-check", title: "Secret Check" },
          courseProgress: null,
          publishedLessons: [{ id: "l1", slug: "lesson-1", title: "L1", order: 1 }],
          lessonProgressMap: new Map(),
        }),
      });
      const txRunner = createMockTxRunner(repo);
      const service = new AcademyProgressionService(repo, txRunner);

      const result = await service.getCourseProgress("user-1", "secret-check");
      const json = JSON.stringify(result);

      expect(json).not.toContain("isCorrect");
      expect(json).not.toContain("correctOption");
      expect(json).not.toContain("explanation");
      expect(json).not.toContain("answerKey");
      expect(json).not.toContain("score");
      expect(json).not.toContain("passed");
      expect(json).not.toContain("xp");
      expect(json).not.toContain("reward");
    });

    it("verifies completion key determinism", () => {
      const lessonKey = getCompletionKey("user-123", "LESSON", "lesson-456");
      expect(lessonKey).toBe("user-123:LESSON:lesson-456");

      const courseKey = getCompletionKey("user-123", "COURSE", "course-789");
      expect(courseKey).toBe("user-123:COURSE:course-789");
    });
  });
});
