import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LearningPathPage } from "./LearningPathPage";
import { AuthProvider } from "../../auth/context/AuthContext";
import { academyApi } from "../api/academyApi";
import { LearningPathResponseDto } from "../types/academy-ui.types";

const mockLearningPathData: LearningPathResponseDto = {
  tracks: [
    {
      id: "beginner-track",
      title: "Beginner Foundations",
      level: "BEGINNER",
      description: "Core market concepts and investment mechanics.",
      milestones: [
        {
          courseSlug: "intro-investing",
          courseTitle: "Introduction to Investing",
          description: "Learn fundamental principles.",
          level: "BEGINNER",
          order: 1,
          lessonCount: 4,
          prerequisites: [],
          status: "COMPLETED",
          completedLessons: 4,
          progressPercent: 100,
        },
        {
          courseSlug: "market-mechanics",
          courseTitle: "Market Mechanics",
          description: "Understand order books and liquidity.",
          level: "BEGINNER",
          order: 2,
          lessonCount: 5,
          prerequisites: ["intro-investing"],
          status: "IN_PROGRESS",
          completedLessons: 2,
          progressPercent: 40,
        },
      ],
    },
    {
      id: "intermediate-track",
      title: "Intermediate Strategies",
      level: "INTERMEDIATE",
      description: "Technical indicators and portfolio risk allocation.",
      milestones: [
        {
          courseSlug: "technical-analysis",
          courseTitle: "Technical Analysis",
          description: "Chart patterns and signals.",
          level: "INTERMEDIATE",
          order: 1,
          lessonCount: 6,
          prerequisites: ["market-mechanics"],
          status: "AVAILABLE",
          completedLessons: 0,
          progressPercent: 0,
        },
        {
          courseSlug: "risk-management",
          courseTitle: "Portfolio Risk Management",
          description: "Hedging and position sizing.",
          level: "INTERMEDIATE",
          order: 2,
          lessonCount: 4,
          prerequisites: ["technical-analysis"],
          status: "LOCKED",
          completedLessons: 0,
          progressPercent: 0,
        },
      ],
    },
    {
      id: "advanced-track",
      title: "Advanced Mastery",
      level: "ADVANCED",
      description: "Derivatives and institutional quantitative strategies.",
      milestones: [
        {
          courseSlug: "options-derivatives",
          courseTitle: "Options & Derivatives",
          description: "Complex contracts and Greek sensitivities.",
          level: "ADVANCED",
          order: 1,
          lessonCount: 8,
          prerequisites: ["risk-management"],
          status: "LOCKED",
          completedLessons: 0,
          progressPercent: 0,
        },
      ],
    },
  ],
  totalCourses: 5,
  completedCourses: 1,
  overallProgressPercent: 20,
  activeCourseSlug: "market-mechanics",
};

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

function renderLearningPath(isAuthenticated = true) {
  const queryClient = createTestQueryClient();
  const mockUser = isAuthenticated
    ? {
        id: "usr-1",
        email: "learner@auracapital.io",
        displayName: "Aura Learner",
        status: "ACTIVE" as const,
        role: "LEARNER",
      }
    : null;
  const mockToken = isAuthenticated ? "mock-jwt-token" : null;

  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider initialToken={mockToken} initialUser={mockUser}>
        <MemoryRouter initialEntries={["/academy/learning-path"]}>
          <LearningPathPage />
        </MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>,
  );
}

describe("LearningPathPage (FEAT-079 / FR-004, FR-007, FR-008 / AC-004, AC-007, AC-008)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders the primary semantic H1 heading and breadcrumbs", async () => {
    vi.spyOn(academyApi, "getLearningPath").mockResolvedValue({
      data: mockLearningPathData,
    });

    renderLearningPath();

    const heading = await screen.findByRole("heading", { level: 1, name: /financial learning path/i });
    expect(heading).toBeDefined();

    expect(screen.getByRole("navigation", { name: /breadcrumb navigation/i })).toBeDefined();
    expect(screen.getByRole("link", { name: /academy/i })).toBeDefined();
  });

  it("renders the server authority disclosure notice prominently (AC-007)", async () => {
    vi.spyOn(academyApi, "getLearningPath").mockResolvedValue({
      data: mockLearningPathData,
    });

    renderLearningPath();

    const notice = await screen.findByTestId("server-authority-notice");
    expect(notice).toBeDefined();
    expect(notice.textContent).toMatch(/All course completions, module unlock states, and XP rewards are evaluated exclusively server-authoritatively/i);
  });

  it("renders tracks and milestone cards with correct status badges and progression (AC-004, AC-006)", async () => {
    vi.spyOn(academyApi, "getLearningPath").mockResolvedValue({
      data: mockLearningPathData,
    });

    renderLearningPath();

    // Check tracks rendered
    expect(await screen.findByRole("heading", { level: 2, name: /beginner foundations/i })).toBeDefined();
    expect(screen.getByRole("heading", { level: 2, name: /intermediate strategies/i })).toBeDefined();
    expect(screen.getByRole("heading", { level: 2, name: /advanced mastery/i })).toBeDefined();

    // Check milestones with scoped queries
    const introCard = screen.getByTestId("milestone-card-intro-investing");
    expect(within(introCard).getByText("Completed")).toBeDefined();

    const mechanicsCard = screen.getByTestId("milestone-card-market-mechanics");
    expect(within(mechanicsCard).getByText("In Progress")).toBeDefined();

    const techCard = screen.getByTestId("milestone-card-technical-analysis");
    expect(within(techCard).getByText("Available")).toBeDefined();

    // Check locked milestones with prerequisite indicators
    const riskCard = screen.getByTestId("milestone-card-risk-management");
    expect(within(riskCard).getByText("Locked")).toBeDefined();
    expect(screen.getByTestId("milestone-locked-notice-risk-management")).toBeDefined();
    expect(screen.getByTestId("milestone-locked-notice-risk-management").textContent).toContain("technical-analysis");
  });

  it("filters milestones by selected track level", async () => {
    vi.spyOn(academyApi, "getLearningPath").mockResolvedValue({
      data: mockLearningPathData,
    });

    renderLearningPath();

    await screen.findByRole("heading", { level: 1, name: /financial learning path/i });

    // Filter to Intermediate only
    const intermediateBtn = screen.getByRole("button", { name: /intermediate/i });
    fireEvent.click(intermediateBtn);

    expect(screen.getByRole("heading", { level: 2, name: /intermediate strategies/i })).toBeDefined();
    expect(screen.queryByRole("heading", { level: 2, name: /beginner foundations/i })).toBeNull();
    expect(screen.queryByRole("heading", { level: 2, name: /advanced mastery/i })).toBeNull();
  });

  it("renders guest progress prompt when learner is unauthenticated", async () => {
    vi.spyOn(academyApi, "getLearningPath").mockResolvedValue({
      data: mockLearningPathData,
    });

    renderLearningPath(false); // Unauthenticated

    expect(await screen.findByTestId("guest-progress-prompt")).toBeDefined();
    expect(screen.getByRole("link", { name: /sign in/i })).toBeDefined();
    expect(screen.getByRole("link", { name: /create account/i })).toBeDefined();
  });

  it("handles loading skeleton state (AC-004)", () => {
    vi.spyOn(academyApi, "getLearningPath").mockReturnValue(new Promise(() => {}));

    renderLearningPath();

    expect(screen.getByTestId("learning-path-loading")).toBeDefined();
    expect(screen.getByText(/loading learning path roadmap/i)).toBeDefined();
  });

  it("handles empty state when no curriculum tracks are published", async () => {
    vi.spyOn(academyApi, "getLearningPath").mockResolvedValue({
      data: {
        tracks: [],
        totalCourses: 0,
        completedCourses: 0,
        overallProgressPercent: 0,
        activeCourseSlug: null,
      },
    });

    renderLearningPath();

    expect(await screen.findByTestId("learning-path-empty")).toBeDefined();
    expect(screen.getByText(/no structured learning tracks are currently published/i)).toBeDefined();
  });

  it("handles error state with retry trigger", async () => {
    const errorSpy = vi.spyOn(academyApi, "getLearningPath").mockRejectedValue(new Error("Network connection lost"));

    renderLearningPath();

    expect(await screen.findByTestId("learning-path-error")).toBeDefined();
    expect(screen.getByText(/network connection lost/i)).toBeDefined();

    const retryBtn = screen.getByRole("button", { name: /retry/i });
    expect(retryBtn).toBeDefined();

    // Trigger retry
    fireEvent.click(retryBtn);
    expect(errorSpy).toHaveBeenCalled();
  });

  it("satisfies accessibility standards with exactly one H1 and valid ARIA progressbar (AC-008)", async () => {
    vi.spyOn(academyApi, "getLearningPath").mockResolvedValue({
      data: mockLearningPathData,
    });

    renderLearningPath();

    await screen.findByRole("heading", { level: 1, name: /financial learning path/i });

    // Single H1 assertion
    const h1Elements = screen.getAllByRole("heading", { level: 1 });
    expect(h1Elements).toHaveLength(1);

    // Accessible progressbar
    const progressbar = screen.getByRole("progressbar", { name: /overall curriculum progress/i });
    expect(progressbar).toBeDefined();
    expect(progressbar.getAttribute("aria-valuenow")).toBe("20");
    expect(progressbar.getAttribute("aria-valuemin")).toBe("0");
    expect(progressbar.getAttribute("aria-valuemax")).toBe("100");
  });
});
