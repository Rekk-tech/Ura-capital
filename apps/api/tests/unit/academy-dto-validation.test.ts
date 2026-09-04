import { describe, it, expect } from "vitest";
import {
  listCoursesQuerySchema,
  courseSlugParamSchema,
  lessonSlugParamSchema,
} from "../../src/modules/academy/academy.validation.js";
import {
  toCourseSummaryDto,
  toLessonSummaryDto,
  toCourseDetailDto,
  toLessonDetailDto,
} from "../../src/modules/academy/academy.dto.js";

describe("FEAT-020 Validation & DTO Unit Tests", () => {
  describe("Zod Validation Schemas", () => {
    describe("listCoursesQuerySchema", () => {
      it("accepts valid default and custom pagination parameters", () => {
        const defaults = listCoursesQuerySchema.parse({});
        expect(defaults).toEqual({ page: 1, limit: 20 });

        const custom = listCoursesQuerySchema.parse({
          page: "2",
          limit: "30",
          level: "INTERMEDIATE",
        });
        expect(custom).toEqual({ page: 2, limit: 30, level: "INTERMEDIATE" });
      });

      it("rejects page < 1", () => {
        expect(() => listCoursesQuerySchema.parse({ page: 0 })).toThrow();
        expect(() => listCoursesQuerySchema.parse({ page: -5 })).toThrow();
      });

      it("rejects limit < 1 or limit > 50", () => {
        expect(() => listCoursesQuerySchema.parse({ limit: 0 })).toThrow();
        expect(() => listCoursesQuerySchema.parse({ limit: 51 })).toThrow();
        expect(() => listCoursesQuerySchema.parse({ limit: 100 })).toThrow();
      });

      it("accepts limit = 50 as maximum allowed", () => {
        const result = listCoursesQuerySchema.parse({ limit: 50 });
        expect(result.limit).toBe(50);
      });

      it("accepts allowed level values and rejects invalid level", () => {
        expect(listCoursesQuerySchema.parse({ level: "BEGINNER" }).level).toBe("BEGINNER");
        expect(listCoursesQuerySchema.parse({ level: "INTERMEDIATE" }).level).toBe("INTERMEDIATE");
        expect(listCoursesQuerySchema.parse({ level: "ADVANCED" }).level).toBe("ADVANCED");

        expect(() => listCoursesQuerySchema.parse({ level: "EXPERT" })).toThrow();
        expect(() => listCoursesQuerySchema.parse({ level: "beginner" })).toThrow();
      });
    });

    describe("courseSlugParamSchema", () => {
      it("accepts valid lowercase alphanumeric slug with hyphens", () => {
        expect(courseSlugParamSchema.parse({ slug: "intro-to-finance" })).toEqual({
          slug: "intro-to-finance",
        });
        expect(courseSlugParamSchema.parse({ slug: "crypto101" })).toEqual({
          slug: "crypto101",
        });
      });

      it("rejects uppercase, spaces, and special characters", () => {
        expect(() => courseSlugParamSchema.parse({ slug: "Intro-Finance" })).toThrow();
        expect(() => courseSlugParamSchema.parse({ slug: "intro finance" })).toThrow();
        expect(() => courseSlugParamSchema.parse({ slug: "intro_finance" })).toThrow();
        expect(() => courseSlugParamSchema.parse({ slug: "slug!" })).toThrow();
        expect(() => courseSlugParamSchema.parse({ slug: "" })).toThrow();
      });
    });

    describe("lessonSlugParamSchema", () => {
      it("accepts valid courseSlug and lessonSlug pair", () => {
        const result = lessonSlugParamSchema.parse({
          courseSlug: "intro-to-finance",
          lessonSlug: "what-is-money",
        });
        expect(result).toEqual({
          courseSlug: "intro-to-finance",
          lessonSlug: "what-is-money",
        });
      });

      it("rejects invalid courseSlug or lessonSlug", () => {
        expect(() =>
          lessonSlugParamSchema.parse({
            courseSlug: "Invalid Course",
            lessonSlug: "what-is-money",
          }),
        ).toThrow();

        expect(() =>
          lessonSlugParamSchema.parse({
            courseSlug: "intro-to-finance",
            lessonSlug: "WHAT_IS_MONEY",
          }),
        ).toThrow();
      });
    });
  });

  describe("Safe DTO Mappers", () => {
    it("toCourseSummaryDto whitelists approved fields and excludes internal fields", () => {
      const entity = {
        id: "internal-uuid-1",
        slug: "intro-to-finance",
        title: "Introduction to Finance",
        description: "Course description",
        level: "BEGINNER",
        order: 1,
        status: "PUBLISHED",
        createdAt: new Date(),
        updatedAt: new Date(),
        _count: { lessons: 5 },
        secretKey: "hidden",
      };

      const dto = toCourseSummaryDto(entity);
      expect(dto).toEqual({
        slug: "intro-to-finance",
        title: "Introduction to Finance",
        description: "Course description",
        level: "BEGINNER",
        order: 1,
        lessonCount: 5,
      });

      expect(dto).not.toHaveProperty("id");
      expect(dto).not.toHaveProperty("status");
      expect(dto).not.toHaveProperty("createdAt");
      expect(dto).not.toHaveProperty("updatedAt");
      expect(dto).not.toHaveProperty("secretKey");
    });

    it("toLessonSummaryDto whitelists approved fields and excludes internal fields", () => {
      const entity = {
        id: "lesson-id-1",
        courseId: "course-id",
        slug: "lesson-1",
        title: "Lesson 1",
        order: 1,
        content: "Content",
        status: "PUBLISHED",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const dto = toLessonSummaryDto(entity);
      expect(dto).toEqual({
        slug: "lesson-1",
        title: "Lesson 1",
        order: 1,
      });

      expect(dto).not.toHaveProperty("id");
      expect(dto).not.toHaveProperty("courseId");
      expect(dto).not.toHaveProperty("content");
      expect(dto).not.toHaveProperty("status");
      expect(dto).not.toHaveProperty("createdAt");
      expect(dto).not.toHaveProperty("updatedAt");
    });

    it("toCourseDetailDto transforms lessons array using LessonSummaryDto", () => {
      const entity = {
        id: "course-id",
        slug: "intro-to-finance",
        title: "Introduction to Finance",
        description: "Description",
        level: "BEGINNER",
        order: 1,
        status: "PUBLISHED",
        createdAt: new Date(),
        updatedAt: new Date(),
        lessons: [
          {
            id: "lesson-id-1",
            courseId: "course-id",
            slug: "lesson-1",
            title: "Lesson 1",
            order: 1,
            content: "Full lesson text that must not appear in summary outline",
            status: "PUBLISHED",
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      };

      const dto = toCourseDetailDto(entity);
      expect(dto).toEqual({
        slug: "intro-to-finance",
        title: "Introduction to Finance",
        description: "Description",
        level: "BEGINNER",
        order: 1,
        lessons: [
          {
            slug: "lesson-1",
            title: "Lesson 1",
            order: 1,
          },
        ],
      });

      expect(dto.lessons[0]).not.toHaveProperty("content");
      expect(dto.lessons[0]).not.toHaveProperty("id");
      expect(dto.lessons[0]).not.toHaveProperty("courseId");
    });

    it("toLessonDetailDto whitelists content and excludes database IDs/timestamps", () => {
      const entity = {
        id: "lesson-uuid",
        courseId: "course-uuid",
        slug: "lesson-1",
        title: "Lesson 1",
        content: "# Heading\n\nEducational content",
        order: 1,
        status: "PUBLISHED",
        createdAt: new Date(),
        updatedAt: new Date(),
        course: { slug: "intro-finance" },
      };

      const dto = toLessonDetailDto(entity);
      expect(dto).toEqual({
        courseSlug: "intro-finance",
        slug: "lesson-1",
        title: "Lesson 1",
        content: "# Heading\n\nEducational content",
        order: 1,
      });

      expect(dto).not.toHaveProperty("id");
      expect(dto).not.toHaveProperty("courseId");
      expect(dto).not.toHaveProperty("createdAt");
      expect(dto).not.toHaveProperty("updatedAt");
      expect(dto).not.toHaveProperty("status");
    });
  });
});
