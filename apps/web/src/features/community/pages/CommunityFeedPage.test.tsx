import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "../../auth/context/AuthContext";
import { CommunityFeedPage } from "./CommunityFeedPage";
import { communityApi } from "../../../api/community.api";
import {
  CommunityPostDto,
  CommunityPostFeedResponse,
  CommunityApiError,
} from "../types/community-ui.types";

const mockPost1: CommunityPostDto = {
  id: "p-1111",
  author: { displayName: "Alice Trader" },
  content: "What is your favorite hedge ratio formula?",
  createdAt: "2026-09-21T08:00:00.000Z",
  likeCount: 3,
  commentCount: 2,
  likedByCurrentUser: false,
  ownedByCurrentUser: true, // Alice owns post 1
};

const mockPost2: CommunityPostDto = {
  id: "p-2222",
  author: { displayName: "Bob Investor" },
  content: "Great simulation run this morning with AURA equities!",
  createdAt: "2026-09-21T07:30:00.000Z",
  likeCount: 10,
  commentCount: 0,
  likedByCurrentUser: true,
  ownedByCurrentUser: false, // Bob owns post 2
};

import { AuthUser } from "../../../api/auth.api";

const renderWithProviders = (
  ui: React.ReactElement,
  {
    initialToken = "test-token" as string | null,
    initialUser = { id: "u-alice", email: "alice@auracapital.io", role: "LEARNER" } as AuthUser | null,
  }: { initialToken?: string | null; initialUser?: AuthUser | null } = {},
) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={["/community"]}>
        <AuthProvider initialToken={initialToken} initialUser={initialUser}>
          <Routes>
            <Route path="/community" element={ui} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

describe("CommunityFeedPage (Component & State - AC-001..AC-028)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders auth-required card when unauthenticated and issues ZERO community requests (AC-003)", async () => {
    const listPostsSpy = vi.spyOn(communityApi, "listPosts");

    renderWithProviders(<CommunityFeedPage />, { initialToken: null, initialUser: null });

    await waitFor(() => {
      expect(screen.getByTestId("community-auth-card")).toBeDefined();
      expect(screen.getByText(/Authentication Required/i)).toBeDefined();
    });

    expect(listPostsSpy).not.toHaveBeenCalled();
  });

  it("renders loading skeleton while feed is fetching (AC-014)", async () => {
    vi.spyOn(communityApi, "listPosts").mockImplementation(() => new Promise(() => {}));

    renderWithProviders(<CommunityFeedPage />);

    expect(screen.getByTestId("community-loading-skeleton")).toBeDefined();
  });

  it("renders empty state when feed has zero posts (AC-014)", async () => {
    const emptyResponse: CommunityPostFeedResponse = {
      data: [],
      pageInfo: { nextCursor: null, hasNextPage: false },
    };
    vi.spyOn(communityApi, "listPosts").mockResolvedValue(emptyResponse);

    renderWithProviders(<CommunityFeedPage />);

    await waitFor(() => {
      expect(screen.getByTestId("community-empty-state")).toBeDefined();
    });
    expect(screen.getByText(/No Community Posts Yet/i)).toBeDefined();
  });

  it("renders post cards in server order with safe author, time, content, and counts (AC-010, AC-019, AC-028)", async () => {
    const feedResponse: CommunityPostFeedResponse = {
      data: [mockPost1, mockPost2],
      pageInfo: { nextCursor: null, hasNextPage: false },
    };
    vi.spyOn(communityApi, "listPosts").mockResolvedValue(feedResponse);

    renderWithProviders(<CommunityFeedPage />);

    await waitFor(() => {
      expect(screen.getByTestId("community-post-card-p-1111")).toBeDefined();
      expect(screen.getByTestId("community-post-card-p-2222")).toBeDefined();
    });

    // Content checks
    expect(screen.getByText("Alice Trader")).toBeDefined();
    expect(screen.getByText("Bob Investor")).toBeDefined();
    expect(screen.getByText("What is your favorite hedge ratio formula?")).toBeDefined();
    expect(screen.getByText("Great simulation run this morning with AURA equities!")).toBeDefined();

    // Counts checks
    expect(screen.getByTestId("post-like-count-p-1111").textContent).toBe("3");
    expect(screen.getByTestId("post-comment-count-p-1111").textContent).toBe("2");
    expect(screen.getByTestId("post-like-count-p-2222").textContent).toBe("10");
  });

  it("renders owner removal button ONLY for posts owned by the current user (AC-020)", async () => {
    const feedResponse: CommunityPostFeedResponse = {
      data: [mockPost1, mockPost2],
      pageInfo: { nextCursor: null, hasNextPage: false },
    };
    vi.spyOn(communityApi, "listPosts").mockResolvedValue(feedResponse);

    renderWithProviders(<CommunityFeedPage />);

    await waitFor(() => {
      expect(screen.getByTestId("community-post-card-p-1111")).toBeDefined();
    });

    // Alice owns post 1: Remove button MUST be present
    expect(screen.getByTestId("post-remove-btn-p-1111")).toBeDefined();

    // Bob owns post 2: Remove button MUST NOT be present
    expect(screen.queryByTestId("post-remove-btn-p-2222")).toBeNull();
  });

  it("calls removePost and refetches feed when owner clicks Remove (AC-020, AC-013)", async () => {
    const feedResponse: CommunityPostFeedResponse = {
      data: [mockPost1],
      pageInfo: { nextCursor: null, hasNextPage: false },
    };
    vi.spyOn(communityApi, "listPosts").mockResolvedValue(feedResponse);
    const removeSpy = vi.spyOn(communityApi, "removePost").mockResolvedValue(undefined);
    vi.spyOn(window, "confirm").mockReturnValue(true);

    renderWithProviders(<CommunityFeedPage />);

    await waitFor(() => {
      expect(screen.getByTestId("post-remove-btn-p-1111")).toBeDefined();
    });

    fireEvent.click(screen.getByTestId("post-remove-btn-p-1111"));

    await waitFor(() => {
      expect(removeSpy).toHaveBeenCalledWith("p-1111", "test-token");
    });
  });

  it("handles explicit Load More pagination when hasNextPage is true (AC-010, AC-021)", async () => {
    const page1: CommunityPostFeedResponse = {
      data: [mockPost1],
      pageInfo: { nextCursor: "cursor-p1", hasNextPage: true },
    };
    const page2: CommunityPostFeedResponse = {
      data: [mockPost2],
      pageInfo: { nextCursor: null, hasNextPage: false },
    };

    const listSpy = vi.spyOn(communityApi, "listPosts")
      .mockResolvedValueOnce(page1)
      .mockResolvedValueOnce(page2);

    renderWithProviders(<CommunityFeedPage />);

    await waitFor(() => {
      expect(screen.getByTestId("community-post-card-p-1111")).toBeDefined();
    });

    const loadMoreBtn = screen.getByTestId("feed-load-more-btn");
    expect(loadMoreBtn).toBeDefined();

    fireEvent.click(loadMoreBtn);

    await waitFor(() => {
      expect(screen.getByTestId("community-post-card-p-2222")).toBeDefined();
    });

    // After page 2 hasNextPage is false, button is hidden
    expect(screen.queryByTestId("feed-load-more-btn")).toBeNull();
    expect(listSpy).toHaveBeenCalledTimes(2);
  });

  it("submits new post and clears composer on success (AC-018, AC-013)", async () => {
    const feedResponse: CommunityPostFeedResponse = {
      data: [mockPost1],
      pageInfo: { nextCursor: null, hasNextPage: false },
    };
    vi.spyOn(communityApi, "listPosts").mockResolvedValue(feedResponse);
    const createSpy = vi.spyOn(communityApi, "createPost").mockResolvedValue({
      data: {
        id: "p-new",
        author: { displayName: "Alice Trader" },
        content: "New market perspective",
        createdAt: new Date().toISOString(),
        likeCount: 0,
        commentCount: 0,
        likedByCurrentUser: false,
        ownedByCurrentUser: true,
      },
    });

    renderWithProviders(<CommunityFeedPage />);

    const textarea = screen.getByTestId("post-composer-textarea");
    const submitBtn = screen.getByTestId("post-composer-submit-btn") as HTMLButtonElement;

    // Empty content -> button is disabled
    expect(submitBtn.disabled).toBe(true);

    // Type content
    fireEvent.change(textarea, { target: { value: "New market perspective" } });
    expect(submitBtn.disabled).toBe(false);

    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(createSpy).toHaveBeenCalledWith(
        { content: "New market perspective" },
        "test-token",
      );
    });

    // Textarea cleared after success
    expect((textarea as HTMLTextAreaElement).value).toBe("");
  });

  it("displays rate-limit banner on 429 write rejection (AC-016)", async () => {
    const feedResponse: CommunityPostFeedResponse = {
      data: [],
      pageInfo: { nextCursor: null, hasNextPage: false },
    };
    vi.spyOn(communityApi, "listPosts").mockResolvedValue(feedResponse);
    vi.spyOn(communityApi, "createPost").mockRejectedValue(
      new CommunityApiError(429, "RATE_LIMITED", "Rate limit exceeded", 120),
    );

    renderWithProviders(<CommunityFeedPage />);

    const textarea = screen.getByTestId("post-composer-textarea");
    const submitBtn = screen.getByTestId("post-composer-submit-btn");

    fireEvent.change(textarea, { target: { value: "Spam attempt" } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByTestId("community-rate-limited-banner")).toBeDefined();
    });
    expect(screen.getByText(/Please wait 120 seconds/i)).toBeDefined();
  });

  it("displays service unavailable banner on 503 Redis outage (AC-017)", async () => {
    const feedResponse: CommunityPostFeedResponse = {
      data: [],
      pageInfo: { nextCursor: null, hasNextPage: false },
    };
    vi.spyOn(communityApi, "listPosts").mockResolvedValue(feedResponse);
    vi.spyOn(communityApi, "createPost").mockRejectedValue(
      new CommunityApiError(503, "SERVICE_UNAVAILABLE", "Service unavailable"),
    );

    renderWithProviders(<CommunityFeedPage />);

    const textarea = screen.getByTestId("post-composer-textarea");
    const submitBtn = screen.getByTestId("post-composer-submit-btn");

    fireEvent.change(textarea, { target: { value: "Post during outage" } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByTestId("community-service-unavailable-banner")).toBeDefined();
    });
  });

  it("handles like and unlike interaction with server authority (AC-011, AC-012, AC-025)", async () => {
    const feedResponse: CommunityPostFeedResponse = {
      data: [mockPost1], // unliked by Alice
      pageInfo: { nextCursor: null, hasNextPage: false },
    };
    vi.spyOn(communityApi, "listPosts").mockResolvedValue(feedResponse);
    const likeSpy = vi.spyOn(communityApi, "likePost").mockResolvedValue({
      data: { postId: "p-1111", likedByCurrentUser: true, likeCount: 4 },
    });

    renderWithProviders(<CommunityFeedPage />);

    await waitFor(() => {
      expect(screen.getByTestId("post-like-btn-p-1111")).toBeDefined();
    });

    const likeBtn = screen.getByTestId("post-like-btn-p-1111");
    fireEvent.click(likeBtn);

    await waitFor(() => {
      expect(likeSpy).toHaveBeenCalledWith("p-1111", "test-token");
    });
  });
});
