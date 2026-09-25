import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { AcademyApiClient } from "./academyApi";

describe("AcademyApiClient (FEAT-073 API Contract - AC-002, AC-003, AC-005)", () => {
  let client: AcademyApiClient;
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    client = new AcademyApiClient("/api/academy");
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("passes AbortSignal to fetch calls when provided", async () => {
    const controller = new AbortController();
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: [], pagination: { page: 1, limit: 12, total: 0, totalPages: 0 } }),
    });
    globalThis.fetch = fetchMock;

    await client.listCourses({}, { signal: controller.signal });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/academy/courses",
      expect.objectContaining({ signal: controller.signal }),
    );
  });

  it("getProjectedQuiz requests safe quiz projection with answer secrecy", async () => {
    const mockProjectedQuiz = {
      data: {
        id: "quiz-123",
        courseSlug: "personal-finance",
        lessonSlug: "savings",
        lessonTitle: "Savings Basics",
        title: "Savings Quiz",
        description: null,
        passingScore: 80,
        totalQuestions: 1,
        questions: [
          {
            id: "q1",
            prompt: "What is an emergency fund?",
            type: "SINGLE_CHOICE" as const,
            order: 1,
            options: [
              { id: "opt-1", text: "3-6 months of living expenses", order: 1 },
              { id: "opt-2", text: "Money for luxury vacations", order: 2 },
            ],
          },
        ],
      },
    };

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockProjectedQuiz,
    });
    globalThis.fetch = fetchMock;

    const result = await client.getProjectedQuiz("quiz-123", "test-token");

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/academy/quizzes/quiz-123/projected",
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({
          Authorization: "Bearer test-token",
        }),
      }),
    );

    // Verify no answer keys leaked in projection
    const jsonStr = JSON.stringify(result);
    expect(jsonStr).not.toContain("isCorrect");
    expect(jsonStr).not.toContain("correctOptionId");
  });

  it("startQuizAttempt calls POST on the approved quiz attempt endpoint", async () => {
    const mockAttempt = {
      data: {
        id: "att-123",
        quizId: "quiz-123",
        attemptNumber: 1,
        status: "IN_PROGRESS" as const,
        startedAt: "2026-09-25T10:00:00Z",
        answers: [],
      },
    };

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockAttempt,
    });
    globalThis.fetch = fetchMock;

    const result = await client.startQuizAttempt("c1", "l1", "tok");

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/academy/courses/c1/lessons/l1/quiz/attempts",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer tok",
        }),
      }),
    );
    expect(result.data.id).toBe("att-123");
  });

  it("submitQuizAttempt sends attempt for authoritative server evaluation", async () => {
    const mockResult = {
      data: {
        attemptId: "att-123",
        quizId: "quiz-123",
        status: "GRADED" as const,
        score: 100,
        passed: true,
        submittedAt: "2026-09-25T10:05:00Z",
        gradedAt: "2026-09-25T10:05:01Z",
        answers: [
          { questionId: "q1", selectedOptionId: "opt-1", isCorrect: true, correctOptionId: "opt-1" },
        ],
      },
    };

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResult,
    });
    globalThis.fetch = fetchMock;

    const result = await client.submitQuizAttempt("att-123", "tok");

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/academy/quiz-attempts/att-123/submit",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer tok",
        }),
      }),
    );
    expect(result.data.score).toBe(100);
    expect(result.data.passed).toBe(true);
  });

  it("completeLesson marks lesson complete and returns authoritative progress", async () => {
    const mockProgress = {
      data: {
        lessonSlug: "intro-lesson",
        status: "COMPLETED" as const,
        completed: true,
        completedAt: "2026-09-25T10:00:00Z",
      },
    };

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockProgress,
    });
    globalThis.fetch = fetchMock;

    const result = await client.completeLesson("c1", "intro-lesson", "tok");

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/academy/courses/c1/lessons/intro-lesson/complete",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer tok",
        }),
      }),
    );
    expect(result.data.completed).toBe(true);
  });
});
