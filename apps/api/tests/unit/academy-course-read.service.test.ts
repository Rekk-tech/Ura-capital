import { describe, it, expect, vi } from "vitest";
import { AcademyCourseReadService } from "../../src/modules/academy/academy-course-read.service.js";
import type { IAcademyCourseRepository } from "../../src/modules/academy/academy.repository.js";
import { AppError } from "../../src/shared/errors/error-envelope.js";
import { ERROR_CODES, HTTP_STATUS } from "@aura/shared";

describe("AcademyCourseReadService Unit Tests", () => {
  const createMockRepo = (overrides: Partial<IAcademyCourseRepository> = {}): IAcademyCourseRepository => ({
    createCourse: vi.fn(),
    findCourseById: vi.fn(),
    findCourseBySlug: vi.fn(),
    listCourses: vi.fn(),
    createLesson: vi.fn(),
    findLessonById: vi.fn(),
    findLessonByCourseAndSlug: vi.fn(),
    listLessonsByCourse: vi.fn(),
    createFlashcard: vi.fn(),
    listFlashcardsByLesson: vi.fn(),
    listPublishedCourses: vi.fn().mockResolvedValue({ courses: [], total: 0 }),
    findPublishedCourseBySlug: vi.fn().mockResolvedValue(null),
    findPublishedLessonByCourseAndSlug: vi.fn().mockResolvedValue(null),
    ...overrides,
  });

  describe("listCourses", () => {
    it("returns paginated published courses with safe DTO projection", async () => {
      const mockCourse = {
        id: "internal-id-1",
        slug: "investing-101",
        title: "Investing 101",
        description: "Beginner investing",
        level: "BEGINNER",
        order: 1,
        status: "PUBLISHED",
        createdAt: new Date(),
        updatedAt: new Date(),
        _count: { lessons: 4 },
      };

      const mockRepo = createMockRepo({
        listPublishedCourses: vi.fn().mockResolvedValue({
          courses: [mockCourse],
          total: 1,
        }),
      });

      const service = new AcademyCourseReadService(mockRepo);
      const result = await service.listCourses({ page: 1, limit: 20 });

      expect(mockRepo.listPublishedCourses).toHaveBeenCalledWith({
        skip: 0,
        take: 20,
        level: undefined,
      });

      expect(result.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1,
      });

      expect(result.data).toHaveLength(1);
      const courseDto = result.data[0];
      expect(courseDto).toEqual({
        slug: "investing-101",
        title: "Investing 101",
        description: "Beginner investing",
        level: "BEGINNER",
        order: 1,
        lessonCount: 4,
      });

      // Assert zero leakage of internal UUIDs or timestamps
      expect(courseDto).not.toHaveProperty("id");
      expect(courseDto).not.toHaveProperty("createdAt");
      expect(courseDto).not.toHaveProperty("updatedAt");
      expect(courseDto).not.toHaveProperty("status");
    });

    it("calculates totalPages = 0 when total is 0", async () => {
      const mockRepo = createMockRepo({
        listPublishedCourses: vi.fn().mockResolvedValue({
          courses: [],
          total: 0,
        }),
      });

      const service = new AcademyCourseReadService(mockRepo);
      const result = await service.listCourses({ page: 1, limit: 20 });

      expect(result.pagination.total).toBe(0);
      expect(result.pagination.totalPages).toBe(0);
      expect(result.data).toEqual([]);
    });

    it("handles custom pagination and level filter", async () => {
      const mockRepo = createMockRepo({
        listPublishedCourses: vi.fn().mockResolvedValue({
          courses: [],
          total: 45,
        }),
      });

      const service = new AcademyCourseReadService(mockRepo);
      const result = await service.listCourses({ page: 3, limit: 10, level: "INTERMEDIATE" });

      expect(mockRepo.listPublishedCourses).toHaveBeenCalledWith({
        skip: 20,
        take: 10,
        level: "INTERMEDIATE",
      });

      expect(result.pagination).toEqual({
        page: 3,
        limit: 10,
        total: 45,
        totalPages: 5,
      });
    });
  });

  describe("getCourseBySlug", () => {
    it("returns course detail with ordered lesson summaries", async () => {
      const mockCourse = {
        id: "internal-id-1",
        slug: "investing-101",
        title: "Investing 101",
        description: "Course summary",
        level: "BEGINNER",
        order: 1,
        status: "PUBLISHED",
        createdAt: new Date(),
        updatedAt: new Date(),
        lessons: [
          { slug: "lesson-1", title: "Lesson 1", order: 1 },
          { slug: "lesson-2", title: "Lesson 2", order: 2 },
        ],
      };

      const mockRepo = createMockRepo({
        findPublishedCourseBySlug: vi.fn().mockResolvedValue(mockCourse),
      });

      const service = new AcademyCourseReadService(mockRepo);
      const result = await service.getCourseBySlug("investing-101");

      expect(result.data).toEqual({
        slug: "investing-101",
        title: "Investing 101",
        description: "Course summary",
        level: "BEGINNER",
        order: 1,
        lessons: [
          { slug: "lesson-1", title: "Lesson 1", order: 1 },
          { slug: "lesson-2", title: "Lesson 2", order: 2 },
        ],
      });

      expect(result.data).not.toHaveProperty("id");
      expect(result.data).not.toHaveProperty("createdAt");
      expect(result.data).not.toHaveProperty("updatedAt");
      expect(result.data.lessons[0]).not.toHaveProperty("id");
      expect(result.data.lessons[0]).not.toHaveProperty("courseId");
    });

    it("throws 404 AppError when course is not found or not published", async () => {
      const mockRepo = createMockRepo({
        findPublishedCourseBySlug: vi.fn().mockResolvedValue(null),
      });

      const service = new AcademyCourseReadService(mockRepo);

      await expect(service.getCourseBySlug("nonexistent")).rejects.toThrow(AppError);
      await expect(service.getCourseBySlug("nonexistent")).rejects.toMatchObject({
        code: ERROR_CODES.NOT_FOUND,
        statusCode: HTTP_STATUS.NOT_FOUND,
        message: "Course not found",
      });
    });
  });

  describe("getLessonBySlug", () => {
    it("returns lesson detail with content and parent course slug", async () => {
      const mockLesson = {
        id: "internal-lesson-id",
        courseId: "internal-course-id",
        slug: "lesson-1",
        title: "Lesson 1",
        content: "# Introduction\n\nLesson content here",
        order: 1,
        status: "PUBLISHED",
        createdAt: new Date(),
        updatedAt: new Date(),
        course: {
          slug: "investing-101",
        },
      };

      const mockRepo = createMockRepo({
        findPublishedLessonByCourseAndSlug: vi.fn().mockResolvedValue(mockLesson),
      });

      const service = new AcademyCourseReadService(mockRepo);
      const result = await service.getLessonBySlug("investing-101", "lesson-1");

      expect(result.data).toEqual({
        courseSlug: "investing-101",
        slug: "lesson-1",
        title: "Lesson 1",
        content: "# Introduction\n\nLesson content here",
        order: 1,
      });

      expect(result.data).not.toHaveProperty("id");
      expect(result.data).not.toHaveProperty("courseId");
      expect(result.data).not.toHaveProperty("createdAt");
      expect(result.data).not.toHaveProperty("updatedAt");
      expect(result.data).not.toHaveProperty("status");
    });

    it("throws 404 AppError when lesson is not found, not published, or cross-course mismatch", async () => {
      const mockRepo = createMockRepo({
        findPublishedLessonByCourseAndSlug: vi.fn().mockResolvedValue(null),
      });

      const service = new AcademyCourseReadService(mockRepo);

      await expect(service.getLessonBySlug("course-a", "lesson-b")).rejects.toThrow(AppError);
      await expect(service.getLessonBySlug("course-a", "lesson-b")).rejects.toMatchObject({
        code: ERROR_CODES.NOT_FOUND,
        statusCode: HTTP_STATUS.NOT_FOUND,
        message: "Lesson not found",
      });
    });
  });
});
