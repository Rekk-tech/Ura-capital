import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { AcademyApiClient } from "./academy.api";
import { AcademyApiError } from "../features/academy/types/academy-ui.types";

describe("AcademyApiClient (Unit/Contract - AC-002, AC-012)", () => {
  let client: AcademyApiClient;
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    client = new AcademyApiClient("/api/academy");
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  describe("listCourses", () => {
    it("calls GET /api/academy/courses with params and without Authorization header", async () => {
      const mockResponse = {
        data: [
          {
            slug: "course-1",
            title: "Course 1",
            description: "Description 1",
            level: "BEGINNER",
            order: 1,
            lessonCount: 5,
          },
        ],
        pagination: { page: 1, limit: 12, total: 1, totalPages: 1 },
      };

      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });
      globalThis.fetch = fetchMock;

      const result = await client.listCourses({ page: 1, limit: 12, level: "BEGINNER" });

      expect(fetchMock).toHaveBeenCalledTimes(1);
      const call = fetchMock.mock.calls[0] as [string, RequestInit];
      const [url, options] = call;
      expect(url).toBe("/api/academy/courses?page=1&limit=12&level=BEGINNER");
      expect(options.method).toBe("GET");
      expect((options.headers as Record<string, string>)["Authorization"]).toBeUndefined();
      expect(result).toEqual(mockResponse);
    });

    it("normalizes validation error (400) into AcademyApiError", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid page parameter",
          },
        }),
      });

      await expect(client.listCourses({ page: -1 })).rejects.toThrow(AcademyApiError);
      try {
        await client.listCourses({ page: -1 });
      } catch (err) {
        expect(err).toBeInstanceOf(AcademyApiError);
        const apiError = err as AcademyApiError;
        expect(apiError.status).toBe(400);
        expect(apiError.code).toBe("VALIDATION_ERROR");
        expect(apiError.message).toBe("Invalid page parameter");
      }
    });
  });

  describe("getCourseBySlug", () => {
    it("calls GET /api/academy/courses/:slug with encoded slug", async () => {
      const mockCourse = {
        data: {
          slug: "market-intro",
          title: "Introduction to Markets",
          description: "Learn market basics",
          level: "BEGINNER",
          order: 1,
          lessons: [
            { slug: "lesson-1", title: "What is a Market?", order: 1 },
            { slug: "lesson-2", title: "Order Books", order: 2 },
          ],
        },
      };

      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockCourse,
      });
      globalThis.fetch = fetchMock;

      const result = await client.getCourseBySlug("market-intro");
      expect(fetchMock).toHaveBeenCalledWith("/api/academy/courses/market-intro", {
        method: "GET",
        headers: { Accept: "application/json" },
      });
      expect(result).toEqual(mockCourse);
    });

    it("normalizes 404 response to NOT_FOUND AcademyApiError", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({
          error: {
            code: "NOT_FOUND",
            message: "Course not found",
          },
        }),
      });

      try {
        await client.getCourseBySlug("nonexistent");
        expect.unreachable("Should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(AcademyApiError);
        const apiError = err as AcademyApiError;
        expect(apiError.status).toBe(404);
        expect(apiError.code).toBe("NOT_FOUND");
      }
    });
  });

  describe("getLessonBySlug", () => {
    it("attaches Authorization: Bearer <token> when access token is provided", async () => {
      const mockLesson = {
        data: {
          courseSlug: "market-intro",
          slug: "lesson-1",
          title: "What is a Market?",
          content: "# Markets\nEducational content.",
          order: 1,
        },
      };

      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockLesson,
      });
      globalThis.fetch = fetchMock;

      const result = await client.getLessonBySlug("market-intro", "lesson-1", "mock-token-xyz");

      expect(fetchMock).toHaveBeenCalledWith("/api/academy/courses/market-intro/lessons/lesson-1", {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: "Bearer mock-token-xyz",
        },
      });
      expect(result).toEqual(mockLesson);
    });

    it("omits Authorization header when no access token is provided", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({
          error: {
            code: "UNAUTHENTICATED",
            message: "Authentication required",
          },
        }),
      });

      try {
        await client.getLessonBySlug("market-intro", "lesson-1");
        expect.unreachable("Should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(AcademyApiError);
        const apiError = err as AcademyApiError;
        expect(apiError.status).toBe(401);
        expect(apiError.code).toBe("UNAUTHENTICATED");
      }
    });
  });

  describe("getLessonQuiz (FEAT-023)", () => {
    it("calls GET /api/academy/courses/:courseSlug/lessons/:lessonSlug/quiz with auth header", async () => {
      const mockQuiz = {
        data: {
          id: "quiz-1",
          courseSlug: "market-intro",
          lessonSlug: "lesson-1",
          lessonTitle: "What is a Market?",
          title: "Market Quiz",
          description: "Test market basics",
          passingScore: 80,
          totalQuestions: 1,
          questions: [
            {
              id: "q-1",
              prompt: "What is a market?",
              type: "SINGLE_CHOICE" as const,
              order: 1,
              options: [
                { id: "opt-1", text: "A place to trade", order: 1 },
              ],
            },
          ],
        },
      };

      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockQuiz,
      });
      globalThis.fetch = fetchMock;

      const result = await client.getLessonQuiz("market-intro", "lesson-1", "mock-token-xyz");

      expect(fetchMock).toHaveBeenCalledWith("/api/academy/courses/market-intro/lessons/lesson-1/quiz", {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: "Bearer mock-token-xyz",
        },
      });
      expect(result).toEqual(mockQuiz);
    });

    it("throws AcademyApiError on 404 response", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({
          error: {
            code: "NOT_FOUND",
            message: "Resource not found",
          },
        }),
      });

      await expect(client.getLessonQuiz("market-intro", "lesson-1")).rejects.toThrow(AcademyApiError);
    });
  });

  describe("startQuizAttempt (FEAT-024)", () => {
    it("calls POST .../quiz/attempts with empty object body and Bearer token", async () => {
      const mockAttempt = {
        data: {
          id: "attempt-1",
          quizId: "quiz-1",
          attemptNumber: 1,
          status: "IN_PROGRESS" as const,
          startedAt: "2026-09-06T00:00:00.000Z",
          answers: [],
        },
      };

      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockAttempt,
      });
      globalThis.fetch = fetchMock;

      const result = await client.startQuizAttempt("crypto-basics", "pow", "token-abc");

      expect(fetchMock).toHaveBeenCalledWith(
        "/api/academy/courses/crypto-basics/lessons/pow/quiz/attempts",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: "Bearer token-abc",
          },
          body: JSON.stringify({}),
        },
      );
      expect(result).toEqual(mockAttempt);
    });
  });

  describe("getCurrentQuizAttempt (FEAT-024)", () => {
    it("calls GET .../quiz/attempts/current with Bearer token", async () => {
      const mockAttempt = {
        data: {
          id: "attempt-1",
          quizId: "quiz-1",
          attemptNumber: 1,
          status: "IN_PROGRESS" as const,
          startedAt: "2026-09-06T00:00:00.000Z",
          answers: [],
        },
      };

      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockAttempt,
      });
      globalThis.fetch = fetchMock;

      const result = await client.getCurrentQuizAttempt("crypto-basics", "pow", "token-abc");

      expect(fetchMock).toHaveBeenCalledWith(
        "/api/academy/courses/crypto-basics/lessons/pow/quiz/attempts/current",
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            Authorization: "Bearer token-abc",
          },
        },
      );
      expect(result).toEqual(mockAttempt);
    });
  });

  describe("saveDraftQuizAnswer (FEAT-024)", () => {
    it("calls PUT /api/academy/quiz-attempts/:attemptId/answers/:questionId with optionId", async () => {
      const mockAnswer = {
        data: {
          questionId: "q-1",
          selectedOptionId: "opt-1",
          updatedAt: "2026-09-06T00:00:00.000Z",
        },
      };

      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockAnswer,
      });
      globalThis.fetch = fetchMock;

      const result = await client.saveDraftQuizAnswer("attempt-1", "q-1", "opt-1", "token-abc");

      expect(fetchMock).toHaveBeenCalledWith(
        "/api/academy/quiz-attempts/attempt-1/answers/q-1",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: "Bearer token-abc",
          },
          body: JSON.stringify({ optionId: "opt-1" }),
        },
      );
      expect(result).toEqual(mockAnswer);
    });
  });
});


