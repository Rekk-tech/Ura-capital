import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PostCard } from "./PostCard";
import { communityApi } from "../../../api/community.api";
import { CommunityPostDto } from "../types/community-ui.types";

const mockPost: CommunityPostDto = {
  id: "p-abc",
  author: { displayName: "Sarah Trader" },
  content: "Analyzing momentum signals on tech equities.",
  createdAt: "2026-09-26T02:00:00.000Z",
  likeCount: 4,
  commentCount: 1,
  likedByCurrentUser: false,
  ownedByCurrentUser: true,
};

const renderWithProviders = (ui: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        {ui}
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

describe("PostCard Component (AC-005)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders author, date, plain content, and interactive links", () => {
    renderWithProviders(<PostCard post={mockPost} accessToken="token" />);

    expect(screen.getByText("Sarah Trader")).toBeDefined();
    expect(screen.getByText("Analyzing momentum signals on tech equities.")).toBeDefined();
    expect(screen.getByTestId("post-like-btn-p-abc")).toBeDefined();
    expect(screen.getByTestId("post-comments-link-p-abc")).toBeDefined();
    expect(screen.getByTestId("post-remove-btn-p-abc")).toBeDefined();
  });

  it("extracts and renders markdown title when present in content", () => {
    const titledPost: CommunityPostDto = {
      ...mockPost,
      id: "p-title",
      content: "# Macro Outlook\n\nInterest rate projections for Q4.",
    };

    renderWithProviders(<PostCard post={titledPost} accessToken="token" />);

    expect(screen.getByTestId("post-title-p-title")).toBeDefined();
    expect(screen.getByText("Macro Outlook")).toBeDefined();
    expect(screen.getByText("Interest rate projections for Q4.")).toBeDefined();
  });

  it("opens ReportDialog when flag button is clicked", async () => {
    renderWithProviders(<PostCard post={mockPost} accessToken="token" />);

    const reportBtn = screen.getByTestId("post-report-btn-p-abc");
    fireEvent.click(reportBtn);

    expect(await screen.findByTestId("report-dialog")).toBeDefined();
    expect(screen.getByText("Report Content")).toBeDefined();
  });

  it("calls removePost when owner confirms removal", async () => {
    const removeSpy = vi.spyOn(communityApi, "removePost").mockResolvedValue(undefined);
    vi.spyOn(window, "confirm").mockReturnValue(true);
    const onRemoved = vi.fn();

    renderWithProviders(
      <PostCard post={mockPost} accessToken="token" onPostRemoved={onRemoved} />,
    );

    const removeBtn = screen.getByTestId("post-remove-btn-p-abc");
    fireEvent.click(removeBtn);

    await waitFor(() => {
      expect(removeSpy).toHaveBeenCalledWith("p-abc", "token");
      expect(onRemoved).toHaveBeenCalledWith("p-abc");
    });
  });
});
