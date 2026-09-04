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
});
