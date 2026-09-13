import { describe, it, expect } from "vitest";
import { createAcademyRouter } from "../../src/modules/academy/academy.routes.js";
import {
  toCourseSummaryDto,
  toCourseDetailDto,
  toLessonDetailDto,
  toQuizOptionDto,
  toQuizQuestionDto,
  toQuizDefinitionDto,
  toQuizDraftAnswerDto,
  toQuizAttemptDto,
  toLessonProgressDto,
  toCourseProgressDto,
  toLearnerXpDto,
} from "../../src/modules/academy/academy.dto.js";
import {
  startQuizAttemptBodySchema,
  saveDraftAnswerBodySchema,
  submitQuizAttemptBodySchema,
  CompleteLessonBodySchema,
  quizAttemptParamSchema,
  quizDraftAnswerParamSchema,
  courseSlugParamSchema,
  lessonSlugParamSchema,
  courseProgressParamSchema,
  completeLessonParamSchema,
} from "../../src/modules/academy/academy.validation.js";

describe("FEAT-028 Academy Endpoint Authorization Matrix & DTO Secrecy (Unit)", () => {
  describe("T002 / AC-002 / AC-017 / AC-018: Route Inventory & Classification", () => {
    it("verifies all Academy routes adhere strictly to canonical classification and zero admin routes exist", () => {
      const router = createAcademyRouter();
      const routes: Array<{ path: string; method: string; middlewareCount: number }> = [];

      for (const layer of router.stack) {
        if (layer.route) {
          const path = layer.route.path as string;
          const methods = Object.keys(layer.route.methods);
          for (const method of methods) {
            routes.push({
              path,
              method: method.toUpperCase(),
              middlewareCount: layer.route.stack.length,
            });
          }
        }
      }

      // Expected route inventory (both with and without /api prefix)
      const expectedPublicRoutes = [
        "GET /api/academy/courses",
        "GET /academy/courses",
        "GET /api/academy/courses/:slug",
        "GET /academy/courses/:slug",
      ];

      const expectedAuthenticatedRoutes = [
        "GET /api/academy/courses/:courseSlug/lessons/:lessonSlug",
        "GET /academy/courses/:courseSlug/lessons/:lessonSlug",
        "GET /api/academy/courses/:courseSlug/lessons/:lessonSlug/flashcards",
        "GET /academy/courses/:courseSlug/lessons/:lessonSlug/flashcards",
        "GET /api/academy/courses/:courseSlug/lessons/:lessonSlug/quiz",
        "GET /academy/courses/:courseSlug/lessons/:lessonSlug/quiz",
      ];

      const expectedOwnerScopedRoutes = [
        "POST /api/academy/courses/:courseSlug/lessons/:lessonSlug/quiz/attempts",
        "POST /academy/courses/:courseSlug/lessons/:lessonSlug/quiz/attempts",
        "GET /api/academy/courses/:courseSlug/lessons/:lessonSlug/quiz/attempts/current",
        "GET /academy/courses/:courseSlug/lessons/:lessonSlug/quiz/attempts/current",
        "GET /api/academy/quiz-attempts/:attemptId",
        "GET /academy/quiz-attempts/:attemptId",
        "PUT /api/academy/quiz-attempts/:attemptId/answers/:questionId",
        "PUT /academy/quiz-attempts/:attemptId/answers/:questionId",
        "POST /api/academy/quiz-attempts/:attemptId/submit",
        "POST /academy/quiz-attempts/:attemptId/submit",
        "GET /api/academy/quiz-attempts/:attemptId/result",
        "GET /academy/quiz-attempts/:attemptId/result",
        "GET /api/academy/courses/:courseSlug/progress",
        "GET /academy/courses/:courseSlug/progress",
        "POST /api/academy/courses/:courseSlug/lessons/:lessonSlug/complete",
        "POST /academy/courses/:courseSlug/lessons/:lessonSlug/complete",
        "GET /api/academy/me/xp",
        "GET /academy/me/xp",
      ];

      const allRegistered = routes.map((r) => `${r.method} ${r.path}`);

      // 1. All public routes are registered and have 1 handler (no auth middleware)
      for (const pub of expectedPublicRoutes) {
        expect(allRegistered).toContain(pub);
        const found = routes.find((r) => `${r.method} ${r.path}` === pub);
        expect(found?.middlewareCount).toBe(1);
      }

      // 2. All authenticated and owner-scoped routes have authenticate middleware (2 handlers: auth + ctrl)
      for (const auth of [...expectedAuthenticatedRoutes, ...expectedOwnerScopedRoutes]) {
        expect(allRegistered).toContain(auth);
        const found = routes.find((r) => `${r.method} ${r.path}` === auth);
        expect(found?.middlewareCount).toBe(2);
      }

      // 3. AC-017 / AC-018: Zero admin or support routes exist
      for (const route of allRegistered) {
        expect(route).not.toMatch(/admin/i);
        expect(route).not.toMatch(/support/i);
        expect(route).not.toMatch(/author/i);
      }

      // Exact route count: 4 public + 6 authenticated + 18 owner-scoped = 28 endpoints
      expect(routes.length).toBe(28);
    });
  });

  describe("T008 / AC-014 / AC-016: DTO Secrecy & Whitelisting", () => {
    it("toCourseSummaryDto exposes only whitelisted fields and no internal DB IDs", () => {
      const dto = toCourseSummaryDto({
        slug: "intro-course",
        title: "Intro Course",
        description: "Description",
        level: "BEGINNER",
        order: 1,
        _count: { lessons: 5 },
      });
      expect(Object.keys(dto).sort()).toEqual(
        ["description", "lessonCount", "level", "order", "slug", "title"].sort(),
      );
      expect((dto as Record<string, unknown>).id).toBeUndefined();
      expect((dto as Record<string, unknown>).userId).toBeUndefined();
    });

    it("toCourseDetailDto exposes only whitelisted fields and no internal DB IDs", () => {
      const dto = toCourseDetailDto({
        slug: "intro-course",
        title: "Intro Course",
        description: "Description",
        level: "BEGINNER",
        order: 1,
        lessons: [{ slug: "lesson-1", title: "Lesson 1", order: 1 }],
      });
      expect(Object.keys(dto).sort()).toEqual(
        ["description", "lessons", "level", "order", "slug", "title"].sort(),
      );
      expect((dto as Record<string, unknown>).id).toBeUndefined();
      expect((dto.lessons[0] as Record<string, unknown>).id).toBeUndefined();
    });

    it("toLessonDetailDto exposes only whitelisted fields and no internal DB IDs or correctness", () => {
      const dto = toLessonDetailDto({
        courseSlug: "intro-course",
        slug: "lesson-1",
        title: "Lesson 1",
        content: "# Markdown Content",
        order: 1,
      });
      expect(Object.keys(dto).sort()).toEqual(
        ["content", "courseSlug", "order", "slug", "title"].sort(),
      );
      expect((dto as Record<string, unknown>).id).toBeUndefined();
    });

    it("toQuizOptionDto exposes id, text, order and strictly omits isCorrect (AC-014)", () => {
      const dto = toQuizOptionDto({
        id: "b4d7c041-5df7-440d-b4b6-a4f6be599292",
        text: "Option A",
        order: 1,
      });
      expect(Object.keys(dto).sort()).toEqual(["id", "order", "text"].sort());
      expect((dto as Record<string, unknown>).isCorrect).toBeUndefined();
    });

    it("toQuizQuestionDto strictly omits explanation and correctOptionId (AC-014)", () => {
      const dto = toQuizQuestionDto({
        id: "721a3648-52fb-436f-b258-75c13f6eb7bf",
        prompt: "What is Bitcoin?",
        type: "SINGLE_CHOICE",
        order: 1,
        options: [{ id: "b4d7c041-5df7-440d-b4b6-a4f6be599292", text: "Option A", order: 1 }],
      });
      expect(Object.keys(dto).sort()).toEqual(["id", "options", "order", "prompt", "type"].sort());
      expect((dto as Record<string, unknown>).explanation).toBeUndefined();
      expect((dto as Record<string, unknown>).correctOptionId).toBeUndefined();
      expect((dto as Record<string, unknown>).solution).toBeUndefined();
    });

    it("toQuizDefinitionDto strictly omits any correct answers or explanations (AC-014)", () => {
      const dto = toQuizDefinitionDto({
        id: "d9e8673f-5fe3-4d40-9a3d-4c3111b2e65c",
        title: "Quiz 1",
        passingScore: 80,
        lesson: {
          title: "Lesson 1",
          slug: "lesson-1",
          course: { slug: "intro-course" },
        },
        questions: [],
      });
      expect(dto).not.toHaveProperty("correctAnswers");
      expect(dto).not.toHaveProperty("explanation");
      expect(dto).not.toHaveProperty("answers");
    });

    it("toQuizDraftAnswerDto strictly omits isCorrect and correctOptionId (AC-014)", () => {
      const dto = toQuizDraftAnswerDto({
        questionId: "721a3648-52fb-436f-b258-75c13f6eb7bf",
        selectedOptionId: "b4d7c041-5df7-440d-b4b6-a4f6be599292",
        updatedAt: new Date(),
      });
      expect(Object.keys(dto).sort()).toEqual(
        ["questionId", "selectedOptionId", "updatedAt"].sort(),
      );
      expect((dto as Record<string, unknown>).isCorrect).toBeUndefined();
      expect((dto as Record<string, unknown>).correctOptionId).toBeUndefined();
    });

    it("toQuizAttemptDto strictly omits userId, score, and passed (AC-014)", () => {
      const dto = toQuizAttemptDto({
        id: "c8e16f3d-5197-4b77-8df3-bf72e505ecf6",
        quizId: "d9e8673f-5fe3-4d40-9a3d-4c3111b2e65c",
        attemptNumber: 1,
        status: "IN_PROGRESS",
        startedAt: new Date(),
        answers: [],
      });
      expect(Object.keys(dto).sort()).toEqual(
        ["answers", "attemptNumber", "id", "quizId", "startedAt", "status"].sort(),
      );
      expect((dto as Record<string, unknown>).userId).toBeUndefined();
      expect((dto as Record<string, unknown>).score).toBeUndefined();
      expect((dto as Record<string, unknown>).passed).toBeUndefined();
    });

    it("toCourseProgressDto and toLessonProgressDto strictly omit userId and DB internal IDs (AC-016)", () => {
      const lessonDto = toLessonProgressDto({
        slug: "lesson-1",
        status: "COMPLETED",
        completed: true,
        completedAt: new Date(),
      });
      expect(Object.keys(lessonDto).sort()).toEqual(
        ["completed", "completedAt", "lessonSlug", "status"].sort(),
      );
      expect((lessonDto as Record<string, unknown>).userId).toBeUndefined();
      expect((lessonDto as Record<string, unknown>).id).toBeUndefined();

      const courseDto = toCourseProgressDto({
        courseSlug: "intro-course",
        completedLessons: 1,
        totalLessons: 1,
        progressPercent: 100,
        status: "COMPLETED",
        completed: true,
        completedAt: new Date(),
        lessons: [lessonDto],
      });
      expect((courseDto as Record<string, unknown>).userId).toBeUndefined();
      expect((courseDto as Record<string, unknown>).id).toBeUndefined();
    });

    it("toLearnerXpDto exposes totalXp ONLY, with zero userId or level leakage (AC-016)", () => {
      const dto = toLearnerXpDto({ totalXp: 120 });
      expect(Object.keys(dto)).toEqual(["totalXp"]);
      expect(dto.totalXp).toBe(120);
      expect((dto as Record<string, unknown>).userId).toBeUndefined();
      expect((dto as Record<string, unknown>).level).toBeUndefined();
      expect((dto as Record<string, unknown>).idempotencyKey).toBeUndefined();
    });
  });

  describe("T006 / AC-010 / AC-013: Validation Strictness & Client Authority Rejection", () => {
    it("startQuizAttemptBodySchema rejects any client-supplied body fields (AC-010)", () => {
      expect(startQuizAttemptBodySchema.safeParse({}).success).toBe(true);
      expect(startQuizAttemptBodySchema.safeParse({ userId: "attacker-id" }).success).toBe(false);
      expect(startQuizAttemptBodySchema.safeParse({ role: "ADMIN" }).success).toBe(false);
    });

    it("saveDraftAnswerBodySchema rejects client-supplied userId or extra properties (AC-010)", () => {
      expect(
        saveDraftAnswerBodySchema.safeParse({
          optionId: "b4d7c041-5df7-440d-b4b6-a4f6be599292",
        }).success,
      ).toBe(true);
      expect(
        saveDraftAnswerBodySchema.safeParse({
          optionId: "b4d7c041-5df7-440d-b4b6-a4f6be599292",
          userId: "attacker-id",
        }).success,
      ).toBe(false);
    });

    it("submitQuizAttemptBodySchema rejects client-supplied scores, answers, or userId (AC-010)", () => {
      expect(submitQuizAttemptBodySchema.safeParse({}).success).toBe(true);
      expect(submitQuizAttemptBodySchema.safeParse({ score: 100 }).success).toBe(false);
      expect(submitQuizAttemptBodySchema.safeParse({ userId: "attacker-id" }).success).toBe(false);
    });

    it("CompleteLessonBodySchema rejects client-supplied userId or extra properties (AC-010)", () => {
      expect(CompleteLessonBodySchema.safeParse({}).success).toBe(true);
      expect(CompleteLessonBodySchema.safeParse({ userId: "attacker-id" }).success).toBe(false);
      expect(CompleteLessonBodySchema.safeParse({ completed: true }).success).toBe(false);
    });

    it("quizAttemptParamSchema rejects malformed non-UUID identifiers (AC-013)", () => {
      expect(quizAttemptParamSchema.safeParse({ attemptId: "not-a-uuid" }).success).toBe(false);
      expect(
        quizAttemptParamSchema.safeParse({ attemptId: "c8e16f3d-5197-4b77-8df3-bf72e505ecf6" })
          .success,
      ).toBe(true);
    });

    it("quizDraftAnswerParamSchema rejects malformed attemptId or questionId (AC-013)", () => {
      expect(
        quizDraftAnswerParamSchema.safeParse({
          attemptId: "not-a-uuid",
          questionId: "b4d7c041-5df7-440d-b4b6-a4f6be599292",
        }).success,
      ).toBe(false);
      expect(
        quizDraftAnswerParamSchema.safeParse({
          attemptId: "c8e16f3d-5197-4b77-8df3-bf72e505ecf6",
          questionId: "not-a-uuid",
        }).success,
      ).toBe(false);
    });

    it("courseSlugParamSchema and lessonSlugParamSchema reject malformed slugs with uppercase or symbols (AC-013)", () => {
      expect(courseSlugParamSchema.safeParse({ slug: "INVALID_SLUG!" }).success).toBe(false);
      expect(courseSlugParamSchema.safeParse({ slug: "intro-course-101" }).success).toBe(true);

      expect(
        lessonSlugParamSchema.safeParse({
          courseSlug: "intro-course",
          lessonSlug: "INVALID_LESSON!",
        }).success,
      ).toBe(false);
      expect(
        lessonSlugParamSchema.safeParse({
          courseSlug: "intro-course",
          lessonSlug: "lesson-one",
        }).success,
      ).toBe(true);
    });

    it("courseProgressParamSchema and completeLessonParamSchema reject malformed slugs (AC-013)", () => {
      expect(courseProgressParamSchema.safeParse({ courseSlug: "BAD/SLUG" }).success).toBe(false);
      expect(courseProgressParamSchema.safeParse({ courseSlug: "valid-course" }).success).toBe(
        true,
      );

      expect(
        completeLessonParamSchema.safeParse({
          courseSlug: "valid-course",
          lessonSlug: "BAD LESSON",
        }).success,
      ).toBe(false);
      expect(
        completeLessonParamSchema.safeParse({
          courseSlug: "valid-course",
          lessonSlug: "valid-lesson",
        }).success,
      ).toBe(true);
    });
  });
});
