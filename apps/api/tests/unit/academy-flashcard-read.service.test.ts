import { describe, it, expect, vi } from "vitest";
import { AcademyCourseReadService } from "../../src/modules/academy/academy-course-read.service.js";
import type { IAcademyCourseRepository } from "../../src/modules/academy/academy.repository.js";
import { AppError } from "../../src/shared/errors/error-envelope.js";
import { ERROR_CODES, HTTP_STATUS } from "@aura/shared";

describe("AcademyCourseReadService - Flashcards Unit Tests (FEAT-022)", () => {
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
    findPublishedFlashcardsByLesson: vi.fn().mockResolvedValue(null),
    ...overrides,
  });

  it("throws 404 NOT_FOUND AppError when lesson/course is not found or unavailable", async () => {
    const mockRepo = createMockRepo({
      findPublishedFlashcardsByLesson: vi.fn().mockResolvedValue(null),
    });

    const service = new AcademyCourseReadService(mockRepo);

    await expect(service.getPublishedFlashcards("intro-to-crypto", "missing-lesson")).rejects.toThrowError(
      new AppError("Lesson not found", ERROR_CODES.NOT_FOUND, HTTP_STATUS.NOT_FOUND)
    );

    expect(mockRepo.findPublishedFlashcardsByLesson).toHaveBeenCalledWith("intro-to-crypto", "missing-lesson");
  });

  it("returns 200 with empty array and totalCount 0 when published lesson has zero flashcards", async () => {
    const mockRepo = createMockRepo({
      findPublishedFlashcardsByLesson: vi.fn().mockResolvedValue({
        lessonTitle: "Empty Lesson",
        flashcards: [],
      }),
    });

    const service = new AcademyCourseReadService(mockRepo);
    const result = await service.getPublishedFlashcards("intro-to-crypto", "empty-lesson");

    expect(result).toEqual({
      data: {
        courseSlug: "intro-to-crypto",
        lessonSlug: "empty-lesson",
        lessonTitle: "Empty Lesson",
        flashcards: [],
        totalCount: 0,
      },
    });
  });

  it("returns mapped flashcards with strict whitelist DTO omitting internal UUIDs and timestamps", async () => {
    const mockFlashcards = [
      {
        id: "internal-card-uuid-1",
        lessonId: "internal-lesson-uuid-1",
        front: "What is Bitcoin?",
        back: "A decentralized digital currency.",
        order: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "internal-card-uuid-2",
        lessonId: "internal-lesson-uuid-1",
        front: "What is Blockchain?",
        back: "A distributed immutable ledger.",
        order: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const mockRepo = createMockRepo({
      findPublishedFlashcardsByLesson: vi.fn().mockResolvedValue({
        lessonTitle: "Blockchain Basics",
        flashcards: mockFlashcards,
      }),
    });

    const service = new AcademyCourseReadService(mockRepo);
    const result = await service.getPublishedFlashcards("intro-to-crypto", "blockchain-basics");

    expect(result.data).toEqual({
      courseSlug: "intro-to-crypto",
      lessonSlug: "blockchain-basics",
      lessonTitle: "Blockchain Basics",
      flashcards: [
        {
          front: "What is Bitcoin?",
          back: "A decentralized digital currency.",
          order: 1,
        },
        {
          front: "What is Blockchain?",
          back: "A distributed immutable ledger.",
          order: 2,
        },
      ],
      totalCount: 2,
    });

    // Verify zero internal UUIDs or timestamps in DTO
    for (const card of result.data.flashcards) {
      expect(card).not.toHaveProperty("id");
      expect(card).not.toHaveProperty("lessonId");
      expect(card).not.toHaveProperty("courseId");
      expect(card).not.toHaveProperty("createdAt");
      expect(card).not.toHaveProperty("updatedAt");
      expect(card).not.toHaveProperty("status");
    }
  });
});
