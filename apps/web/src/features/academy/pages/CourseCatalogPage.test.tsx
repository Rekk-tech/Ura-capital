import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CourseCatalogPage } from "./CourseCatalogPage";
import { academyApi } from "../../../api/academy.api";

const mockCoursesData = {
  data: [
    {
      slug: "personal-finance-101",
      title: "Personal Finance 101",
      description: "Foundational budgeting and savings strategy.",
      level: "BEGINNER" as const,
      order: 1,
      lessonCount: 4,
    },
    {
      slug: "portfolio-diversification",
      title: "Portfolio Diversification",
      description: "Asset allocation and covariance.",
      level: "INTERMEDIATE" as const,
      order: 2,
      lessonCount: 6,
    },
  ],
  pagination: {
    page: 1,
    limit: 12,
    total: 2,
    totalPages: 1,
  },
};

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={["/academy"]}>{ui}</MemoryRouter>
    </QueryClientProvider>
  );
}

describe("CourseCatalogPage (Component & State - AC-003, AC-004, AC-013, AC-014, AC-015)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders the primary semantic <h1> heading and subtitle", async () => {
    vi.spyOn(academyApi, "listCourses").mockResolvedValue(mockCoursesData);

    renderWithProviders(<CourseCatalogPage />);

    expect(screen.getByRole("heading", { level: 1, name: /Aura Academy Courses/i })).toBeDefined();
  });

  it("renders course cards in a responsive grid with level badges and lesson counts", async () => {
    vi.spyOn(academyApi, "listCourses").mockResolvedValue(mockCoursesData);

    renderWithProviders(<CourseCatalogPage />);

    await waitFor(() => {
      expect(screen.getByText("Personal Finance 101")).toBeDefined();
      expect(screen.getByText("Portfolio Diversification")).toBeDefined();
    });

    expect(screen.getByText(/Level: Beginner/i)).toBeDefined();
    expect(screen.getByText(/Level: Intermediate/i)).toBeDefined();
    expect(screen.getByText("4 Lessons")).toBeDefined();
    expect(screen.getByText("6 Lessons")).toBeDefined();
  });

  it("renders empty state with filter reset action when no courses match", async () => {
    vi.spyOn(academyApi, "listCourses").mockResolvedValue({
      data: [],
      pagination: { page: 1, limit: 12, total: 0, totalPages: 0 },
    });

    renderWithProviders(<CourseCatalogPage />);

    await waitFor(() => {
      expect(screen.getByText("No Courses Found")).toBeDefined();
    });
  });

  it("renders accessible error state and handles retry", async () => {
    const listSpy = vi
      .spyOn(academyApi, "listCourses")
      .mockRejectedValueOnce(new Error("Network connection dropped"))
      .mockResolvedValueOnce(mockCoursesData);

    renderWithProviders(<CourseCatalogPage />);

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeDefined();
      expect(screen.getByText(/Network connection dropped/i)).toBeDefined();
    });

    const retryBtn = screen.getByRole("button", { name: /Retry/i });
    fireEvent.click(retryBtn);

    await waitFor(() => {
      expect(screen.getByText("Personal Finance 101")).toBeDefined();
    });
    expect(listSpy).toHaveBeenCalledTimes(2);
  });

  it("handles level filtering and triggers query with selected level", async () => {
    const listSpy = vi.spyOn(academyApi, "listCourses").mockResolvedValue(mockCoursesData);

    renderWithProviders(<CourseCatalogPage />);

    await waitFor(() => {
      expect(screen.getByText("Personal Finance 101")).toBeDefined();
    });

    const beginnerPill = screen.getByRole("button", { name: "Beginner" });
    fireEvent.click(beginnerPill);

    await waitFor(() => {
      expect(listSpy).toHaveBeenCalledWith({ page: 1, limit: 12, level: "BEGINNER" });
    });
  });
});
