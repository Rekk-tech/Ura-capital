import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LessonDetailPage } from "./LessonDetailPage";
import { academyApi } from "../../../api/academy.api";
import { AcademyApiError } from "../types/academy-ui.types";

const mockCourseDetail = {
  data: {
    slug: "crypto-fundamentals",
    title: "Crypto Fundamentals",
    description: "Explore cryptographic currency mechanics.",
    level: "INTERMEDIATE" as const,
    order: 3,
    lessons: [
      { slug: "blockchain-basics", title: "Blockchain Basics", order: 10 },
      { slug: "proof-of-work", title: "Proof of Work Consensus", order: 25 },
      { slug: "smart-contracts", title: "Smart Contracts Overview", order: 99 },
    ],
  },
};

const mockLessonDetail = {
  data: {
    courseSlug: "crypto-fundamentals",
    slug: "proof-of-work",
    title: "Proof of Work Consensus",
    content: `
# Proof of Work
Consensus mechanism used in decentralized ledgers.

- Miners compete to solve hashes
- Difficulty adjusts dynamically
    `.trim(),
    order: 25,
  },
};

function renderWithProviders(courseSlug = "crypto-fundamentals", lessonSlug = "proof-of-work") {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/academy/courses/${courseSlug}/lessons/${lessonSlug}`]}>
        <Routes>
          <Route
            path="/academy/courses/:courseSlug/lessons/:lessonSlug"
            element={<LessonDetailPage />}
          />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe("LessonDetailPage (Dual-Query, Navigation, Auth, Security - AC-007..AC-012, AC-017)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders authenticated lesson content, position badge, and course breadcrumb (Query A + B)", async () => {
    vi.spyOn(academyApi, "getLessonBySlug").mockResolvedValue(mockLessonDetail);
    vi.spyOn(academyApi, "getCourseBySlug").mockResolvedValue(mockCourseDetail);

    renderWithProviders();

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { level: 1, name: "Proof of Work Consensus" })
      ).toBeDefined();
    });

    expect(screen.getByText("Lesson 2 of 3")).toBeDefined();
    expect(screen.getByText("Crypto Fundamentals")).toBeDefined();
    expect(screen.getByTestId("lesson-content-body")).toBeDefined();
    expect(screen.getByText("Consensus mechanism used in decentralized ledgers.")).toBeDefined();
  });

  it("preserves strict single-h1 page hierarchy when Markdown content begins with # Heading (DEF-021-02)", async () => {
    vi.spyOn(academyApi, "getLessonBySlug").mockResolvedValue(mockLessonDetail);
    vi.spyOn(academyApi, "getCourseBySlug").mockResolvedValue(mockCourseDetail);

    const { container } = renderWithProviders();

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { level: 1, name: "Proof of Work Consensus" })
      ).toBeDefined();
    });

    // Critical assertion: Only page title is <h1>
    const h1Elements = container.querySelectorAll("h1");
    expect(h1Elements.length).toBe(1);
    expect(h1Elements[0]?.textContent).toBe("Proof of Work Consensus");


    // Markdown # Proof of Work was transformed to <h2>
    expect(
      screen.getByRole("heading", { level: 2, name: "Proof of Work" })
    ).toBeDefined();
  });


  it("derives previous and next navigation from adjacent array elements with non-contiguous orders", async () => {
    vi.spyOn(academyApi, "getLessonBySlug").mockResolvedValue(mockLessonDetail);
    vi.spyOn(academyApi, "getCourseBySlug").mockResolvedValue(mockCourseDetail);

    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText("Blockchain Basics")).toBeDefined();
      expect(screen.getByText("Smart Contracts Overview")).toBeDefined();
    });

    const prevLink = screen.getByRole("link", { name: /Previous lesson: Blockchain Basics/i });
    const nextLink = screen.getByRole("link", { name: /Next lesson: Smart Contracts Overview/i });

    expect(prevLink.getAttribute("href")).toBe(
      "/academy/courses/crypto-fundamentals/lessons/blockchain-basics"
    );
    expect(nextLink.getAttribute("href")).toBe(
      "/academy/courses/crypto-fundamentals/lessons/smart-contracts"
    );
  });

  it("safely renders lesson content when course outline query (Query B) fails without fatal crash", async () => {
    vi.spyOn(academyApi, "getLessonBySlug").mockResolvedValue(mockLessonDetail);
    // Query B fails with network error
    vi.spyOn(academyApi, "getCourseBySlug").mockRejectedValue(new Error("Course metadata unavailable"));

    renderWithProviders();

    await waitFor(() => {
      // Lesson content still renders safely!
      expect(
        screen.getByRole("heading", { level: 1, name: "Proof of Work Consensus" })
      ).toBeDefined();
      expect(screen.getByTestId("lesson-content-body")).toBeDefined();
    });

    // Top breadcrumb gracefully falls back to "Course"
    expect(screen.getByRole("link", { name: "Course" })).toBeDefined();

    // Previous/Next adjacent buttons are safely omitted without throwing an unhandled error
    expect(screen.queryByRole("link", { name: /Previous lesson/i })).toBeNull();
    expect(screen.queryByRole("link", { name: /Next lesson/i })).toBeNull();
  });

  it("renders in-place AUTH_REQUIRED card on 401 response with safe internal redirect URL", async () => {
    vi.spyOn(academyApi, "getLessonBySlug").mockRejectedValue(
      new AcademyApiError(401, "UNAUTHENTICATED", "Authentication required")
    );
    vi.spyOn(academyApi, "getCourseBySlug").mockResolvedValue(mockCourseDetail);

    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText("Authentication Required")).toBeDefined();
      expect(
        screen.getByText(/This lesson is available exclusively to registered Aura Capital learners/i)
      ).toBeDefined();
    });

    const signInLink = screen.getByRole("link", { name: /Sign In to Continue/i });
    const createAccountLink = screen.getByRole("link", { name: /Create Free Account/i });

    // Verify safe internal return URL parameter
    expect(signInLink.getAttribute("href")).toBe(
      "/login?redirect=%2Facademy%2Fcourses%2Fcrypto-fundamentals%2Flessons%2Fproof-of-work"
    );
    expect(createAccountLink.getAttribute("href")).toBe(
      "/register?redirect=%2Facademy%2Fcourses%2Fcrypto-fundamentals%2Flessons%2Fproof-of-work"
    );

    // Verify educational content was NOT rendered
    expect(screen.queryByTestId("lesson-content-body")).toBeNull();
  });

  it("renders generic 'Lesson Unavailable' state on 404 response without leaking draft/archived status", async () => {
    vi.spyOn(academyApi, "getLessonBySlug").mockRejectedValue(
      new AcademyApiError(404, "NOT_FOUND", "Lesson not found")
    );
    vi.spyOn(academyApi, "getCourseBySlug").mockResolvedValue(mockCourseDetail);

    renderWithProviders("crypto-fundamentals", "draft-or-missing-lesson");

    await waitFor(() => {
      expect(screen.getByText("Lesson Unavailable")).toBeDefined();
      expect(
        screen.getByText("The requested lesson could not be found or is not currently available.")
      ).toBeDefined();
    });

    // Zero leakage of draft/archived/internal status
    expect(screen.queryByText(/DRAFT/i)).toBeNull();
    expect(screen.queryByText(/ARCHIVED/i)).toBeNull();
    expect(screen.queryByText(/prisma/i)).toBeNull();

    const backBtn = screen.getByRole("link", { name: /Back to Course Outline/i });
    expect(backBtn.getAttribute("href")).toBe("/academy/courses/crypto-fundamentals");
  });

  it("renders error state with working retry on unexpected 500 error", async () => {
    const lessonSpy = vi
      .spyOn(academyApi, "getLessonBySlug")
      .mockRejectedValueOnce(new AcademyApiError(500, "INTERNAL_ERROR", "Server error"))
      .mockResolvedValueOnce(mockLessonDetail);
    vi.spyOn(academyApi, "getCourseBySlug").mockResolvedValue(mockCourseDetail);

    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeDefined();
      expect(screen.getByText(/Server error/i)).toBeDefined();
    });

    const retryBtn = screen.getByRole("button", { name: /Retry/i });
    fireEvent.click(retryBtn);

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { level: 1, name: "Proof of Work Consensus" })
      ).toBeDefined();
    });
    expect(lessonSpy).toHaveBeenCalledTimes(2);
  });
});
