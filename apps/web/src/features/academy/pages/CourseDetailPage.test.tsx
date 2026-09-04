import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CourseDetailPage } from "./CourseDetailPage";
import { academyApi } from "../../../api/academy.api";
import { AcademyApiError } from "../types/academy-ui.types";

const mockCourseDetail = {
  data: {
    slug: "crypto-fundamentals",
    title: "Crypto Fundamentals",
    description: "Explore cryptographic currency mechanics and distributed consensus.",
    level: "INTERMEDIATE" as const,
    order: 3,
    lessons: [
      { slug: "blockchain-basics", title: "Blockchain Basics", order: 1 },
      { slug: "proof-of-work", title: "Proof of Work Consensus", order: 2 },
      { slug: "smart-contracts", title: "Smart Contracts Overview", order: 3 },
    ],
  },
};

function renderWithProviders(courseSlug = "crypto-fundamentals") {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/academy/courses/${courseSlug}`]}>
        <Routes>
          <Route path="/academy/courses/:courseSlug" element={<CourseDetailPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe("CourseDetailPage (Component & State - AC-005, AC-006, AC-013, AC-014, AC-015)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders the course hero with title, description, level badge, and derived lesson count", async () => {
    vi.spyOn(academyApi, "getCourseBySlug").mockResolvedValue(mockCourseDetail);

    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByRole("heading", { level: 1, name: "Crypto Fundamentals" })).toBeDefined();
    });

    expect(
      screen.getByText("Explore cryptographic currency mechanics and distributed consensus.")
    ).toBeDefined();
    expect(screen.getByText(/Level: Intermediate/i)).toBeDefined();
    // Verifies derived lessonCount = course.lessons.length (3 lessons)
    expect(screen.getByText("3 Lessons")).toBeDefined();
  });

  it("renders the numbered vertical lesson outline with titles and links", async () => {
    vi.spyOn(academyApi, "getCourseBySlug").mockResolvedValue(mockCourseDetail);

    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByRole("heading", { level: 2, name: /Course Outline/i })).toBeDefined();
    });

    expect(screen.getByText("Blockchain Basics")).toBeDefined();
    expect(screen.getByText("Proof of Work Consensus")).toBeDefined();
    expect(screen.getByText("Smart Contracts Overview")).toBeDefined();

    const lessonLinks = screen.getAllByRole("link", { name: /Lesson \d:/i });
    expect(lessonLinks).toHaveLength(3);
    expect(lessonLinks[0]?.getAttribute("href")).toBe(
      "/academy/courses/crypto-fundamentals/lessons/blockchain-basics"
    );
  });

  it("renders generic 'Course Unavailable' state on 404 response without status leakage", async () => {
    vi.spyOn(academyApi, "getCourseBySlug").mockRejectedValue(
      new AcademyApiError(404, "NOT_FOUND", "Course not found")
    );

    renderWithProviders("nonexistent-or-draft-course");

    await waitFor(() => {
      expect(screen.getByText("Course Unavailable")).toBeDefined();
      expect(
        screen.getByText("The requested course does not exist or is currently unavailable.")
      ).toBeDefined();
    });

    // Verify it doesn't leak status or internal words
    expect(screen.queryByText(/DRAFT/i)).toBeNull();
    expect(screen.queryByText(/ARCHIVED/i)).toBeNull();
    expect(screen.queryByText(/prisma/i)).toBeNull();
  });

  it("renders error state with working retry on unexpected server error", async () => {
    const getSpy = vi
      .spyOn(academyApi, "getCourseBySlug")
      .mockRejectedValueOnce(new AcademyApiError(500, "INTERNAL_ERROR", "Server error"))
      .mockResolvedValueOnce(mockCourseDetail);

    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeDefined();
      expect(screen.getByText(/Server error/i)).toBeDefined();
    });

    const retryBtn = screen.getByRole("button", { name: /Retry/i });
    fireEvent.click(retryBtn);

    await waitFor(() => {
      expect(screen.getByRole("heading", { level: 1, name: "Crypto Fundamentals" })).toBeDefined();
    });
    expect(getSpy).toHaveBeenCalledTimes(2);
  });
});
