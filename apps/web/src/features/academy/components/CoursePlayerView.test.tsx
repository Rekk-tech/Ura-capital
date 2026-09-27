import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CoursePlayerView } from "./CoursePlayerView";
import { AuthProvider } from "../../auth/context/AuthContext";
import { academyApi } from "../api/academyApi";
import { AcademyApiError } from "../types/academy-ui.types";

const mockCourseData = {
  data: {
    slug: "investing-101",
    title: "Investing 101: Fundamentals",
    description: "Introductory course to financial markets.",
    level: "BEGINNER" as const,
    order: 1,
    lessons: [
      { slug: "lesson-1", title: "Assets & Liabilities", order: 1 },
      { slug: "lesson-2", title: "Compound Interest", order: 2 },
      { slug: "lesson-3", title: "Risk vs Return", order: 3 },
    ],
  },
};

const mockLessonsOutline = {
  data: {
    courseSlug: "investing-101",
    courseTitle: "Investing 101: Fundamentals",
    lessons: [
      {
        slug: "lesson-1",
        title: "Assets & Liabilities",
        order: 1,
        isCompleted: true,
        isLocked: false,
        prerequisiteLessonSlug: null,
      },
      {
        slug: "lesson-2",
        title: "Compound Interest",
        order: 2,
        isCompleted: false,
        isLocked: false,
        prerequisiteLessonSlug: "lesson-1",
      },
      {
        slug: "lesson-3",
        title: "Risk vs Return",
        order: 3,
        isCompleted: false,
        isLocked: true,
        prerequisiteLessonSlug: "lesson-2",
      },
    ],
    completedCount: 1,
    totalCount: 3,
    progressPercent: 33,
  },
};

const mockLessonContentUnlocked = {
  data: {
    courseSlug: "investing-101",
    slug: "lesson-2",
    title: "Compound Interest",
    content: "## The Power of Compounding\nAlbert Einstein reportedly called compound interest the eighth wonder of the world.",
    order: 2,
    progress: {
      lessonSlug: "lesson-2",
      status: "IN_PROGRESS" as const,
      completed: false,
      completedAt: null,
    },
  },
};

const mockLessonContentLocked = {
  data: {
    courseSlug: "investing-101",
    slug: "lesson-3",
    title: "Risk vs Return",
    content: "## Risk and Return Mechanics\nExpected returns scale with underlying risk factors.",
    order: 3,
    progress: null,
  },
};

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

function renderCoursePlayer(courseSlug = "investing-101", lessonSlug = "lesson-2", isAuthenticated = true) {
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
        <MemoryRouter initialEntries={[`/academy/courses/${courseSlug}/player/${lessonSlug}`]}>
          <Routes>
            <Route path="/academy/courses/:courseSlug/player/:lessonSlug" element={<CoursePlayerView />} />
            <Route path="/academy/courses/:courseSlug" element={<div data-testid="course-outline-page">Course Outline</div>} />
            <Route path="/academy/learning-path" element={<div data-testid="learning-path-page">Learning Path</div>} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>,
  );
}

describe("CoursePlayerView (FEAT-079 / FR-005, FR-006, FR-007, FR-008 / AC-005, AC-006, AC-007, AC-008)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders player layout with syllabus sidebar, course title, and reading panel (AC-005)", async () => {
    vi.spyOn(academyApi, "getCourseBySlug").mockResolvedValue(mockCourseData);
    vi.spyOn(academyApi, "getCourseLessons").mockResolvedValue(mockLessonsOutline);
    vi.spyOn(academyApi, "getLessonBySlug").mockResolvedValue(mockLessonContentUnlocked);

    renderCoursePlayer();

    expect(await screen.findByTestId("course-player-view")).toBeDefined();
    expect(screen.getByTestId("player-syllabus-sidebar")).toBeDefined();
    expect(screen.getByRole("heading", { level: 2, name: /investing 101: fundamentals/i })).toBeDefined();

    // Check active lesson title in single H1
    const title = screen.getByTestId("player-lesson-title");
    expect(title.tagName).toBe("H1");
    expect(title.textContent).toBe("Compound Interest");

    // Check syllabus items
    expect(screen.getByTestId("player-nav-item-lesson-1")).toBeDefined();
    expect(screen.getByTestId("player-nav-item-lesson-2")).toBeDefined();
    expect(screen.getByTestId("player-nav-locked-lesson-3")).toBeDefined();
  });

  it("renders server authority disclosure notice prominently (AC-007)", async () => {
    vi.spyOn(academyApi, "getCourseBySlug").mockResolvedValue(mockCourseData);
    vi.spyOn(academyApi, "getCourseLessons").mockResolvedValue(mockLessonsOutline);
    vi.spyOn(academyApi, "getLessonBySlug").mockResolvedValue(mockLessonContentUnlocked);

    renderCoursePlayer();

    const notice = await screen.findByTestId("player-server-authority-notice");
    expect(notice).toBeDefined();
    expect(notice.textContent).toMatch(/All course completions, module unlock states, and XP rewards are evaluated exclusively server-authoritatively/i);
  });

  it("renders sanitized educational markdown content safely via DOMPurify (AC-005)", async () => {
    vi.spyOn(academyApi, "getCourseBySlug").mockResolvedValue(mockCourseData);
    vi.spyOn(academyApi, "getCourseLessons").mockResolvedValue(mockLessonsOutline);
    vi.spyOn(academyApi, "getLessonBySlug").mockResolvedValue({
      data: {
        ...mockLessonContentUnlocked.data,
        content: "## Compounding Formula\n\nSafe educational content.\n\n<script>alert('xss')</script>",
      },
    });

    renderCoursePlayer();

    await screen.findByTestId("course-player-view");

    // Verify safe content rendered
    expect(screen.getByText(/Safe educational content/i)).toBeDefined();
    expect(screen.getByRole("heading", { level: 3, name: /compounding formula/i })).toBeDefined();
    // Verify script tag neutralized
    expect(document.querySelector("script")).toBeNull();
  });

  it("handles locked lesson state when navigating to locked lesson URL (AC-006)", async () => {
    vi.spyOn(academyApi, "getCourseBySlug").mockResolvedValue(mockCourseData);
    vi.spyOn(academyApi, "getCourseLessons").mockResolvedValue(mockLessonsOutline);
    vi.spyOn(academyApi, "getLessonBySlug").mockResolvedValue(mockLessonContentLocked);

    // Navigating directly to locked lesson-3
    renderCoursePlayer("investing-101", "lesson-3");

    expect(await screen.findByTestId("locked-lesson-state")).toBeDefined();
    expect(screen.getByRole("heading", { level: 2, name: /lesson locked/i })).toBeDefined();
    expect(screen.getByText(/please complete prior lessons before accessing this material/i)).toBeDefined();

    // Verify link to prior lesson exists
    expect(screen.getByRole("link", { name: /go to prior lesson/i })).toBeDefined();

    // "Complete & Continue" button should NOT be rendered when locked
    expect(screen.queryByTestId("player-complete-continue-button")).toBeNull();
  });

  it("triggers authoritative lesson completion on Complete & Continue click (AC-006)", async () => {
    vi.spyOn(academyApi, "getCourseBySlug").mockResolvedValue(mockCourseData);
    vi.spyOn(academyApi, "getCourseLessons").mockResolvedValue(mockLessonsOutline);
    vi.spyOn(academyApi, "getLessonBySlug").mockResolvedValue(mockLessonContentUnlocked);
    const completeSpy = vi.spyOn(academyApi, "completeLesson").mockResolvedValue({
      data: {
        lessonSlug: "lesson-2",
        status: "COMPLETED",
        completed: true,
        completedAt: "2026-09-27T00:00:00Z",
      },
    });

    renderCoursePlayer();

    const completeBtn = await screen.findByTestId("player-complete-continue-button");
    expect(completeBtn).toBeDefined();
    expect(completeBtn.textContent).toContain("Complete & Continue");

    fireEvent.click(completeBtn);

    await waitFor(() => {
      expect(completeSpy).toHaveBeenCalledWith("investing-101", "lesson-2", "mock-jwt-token", undefined);
    });
  });

  it("handles loading skeleton state (AC-005)", () => {
    vi.spyOn(academyApi, "getCourseBySlug").mockReturnValue(new Promise(() => {}));
    vi.spyOn(academyApi, "getCourseLessons").mockReturnValue(new Promise(() => {}));
    vi.spyOn(academyApi, "getLessonBySlug").mockReturnValue(new Promise(() => {}));

    renderCoursePlayer();

    expect(screen.getByTestId("course-player-loading")).toBeDefined();
    expect(screen.getByText(/loading lesson and player content/i)).toBeDefined();
  });

  it("handles 401 unauthenticated state with AuthRequiredCard (AC-005)", async () => {
    vi.spyOn(academyApi, "getCourseBySlug").mockResolvedValue(mockCourseData);
    vi.spyOn(academyApi, "getCourseLessons").mockResolvedValue(mockLessonsOutline);
    vi.spyOn(academyApi, "getLessonBySlug").mockRejectedValue(
      new AcademyApiError(401, "UNAUTHENTICATED", "Authentication required"),
    );

    renderCoursePlayer();

    expect(await screen.findByTestId("course-player-auth-required")).toBeDefined();
    expect(screen.getByText(/authentication required/i)).toBeDefined();
  });

  it("handles 404 not found state with NotFoundState (AC-005)", async () => {
    vi.spyOn(academyApi, "getCourseBySlug").mockRejectedValue(
      new AcademyApiError(404, "NOT_FOUND", "Course not found"),
    );
    vi.spyOn(academyApi, "getCourseLessons").mockRejectedValue(
      new AcademyApiError(404, "NOT_FOUND", "Course not found"),
    );
    vi.spyOn(academyApi, "getLessonBySlug").mockRejectedValue(
      new AcademyApiError(404, "NOT_FOUND", "Lesson not found"),
    );

    renderCoursePlayer();

    expect(await screen.findByTestId("course-player-not-found")).toBeDefined();
    expect(screen.getByText(/the requested lesson or course could not be located/i)).toBeDefined();
  });

  it("collapses and expands the syllabus sidebar via toggle buttons (AC-008)", async () => {
    vi.spyOn(academyApi, "getCourseBySlug").mockResolvedValue(mockCourseData);
    vi.spyOn(academyApi, "getCourseLessons").mockResolvedValue(mockLessonsOutline);
    vi.spyOn(academyApi, "getLessonBySlug").mockResolvedValue(mockLessonContentUnlocked);

    renderCoursePlayer();

    await screen.findByTestId("course-player-view");

    // Initially sidebar is visible
    const sidebar = screen.getByTestId("player-syllabus-sidebar");
    expect(sidebar.style.display).toBe("flex");

    // Click collapse button
    const collapseBtn = screen.getByRole("button", { name: /collapse course syllabus/i });
    fireEvent.click(collapseBtn);

    // Sidebar is collapsed
    expect(sidebar.style.display).toBe("none");

    // Open button appears
    const openBtn = screen.getByRole("button", { name: /open course syllabus/i });
    expect(openBtn).toBeDefined();

    // Click open button
    fireEvent.click(openBtn);
    expect(sidebar.style.display).toBe("flex");
  });
});
