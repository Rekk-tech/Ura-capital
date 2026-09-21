import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "../../auth/context/AuthContext";
import { PostDetailPage } from "./PostDetailPage";
import { communityApi } from "../../../api/community.api";
import {
  CommunityPostDto,
  CommunityCommentDto,
  CommunityCommentFeedResponse,
  CommunityApiError,
} from "../types/community-ui.types";

const mockDetailPost: CommunityPostDto = {
  id: "post-100",
  author: { displayName: "Alice Trader" },
  content: "Deep dive into options pricing and volatility surfaces.",
  createdAt: "2026-09-21T08:30:00.000Z",
  likeCount: 5,
  commentCount: 2,
  likedByCurrentUser: false,
  ownedByCurrentUser: true,
};

const mockComment1: CommunityCommentDto = {
  id: "c-1",
  author: { displayName: "Charlie Quant" },
  content: "Great explanation of implied volatility skew!",
  createdAt: "2026-09-21T08:40:00.000Z",
  ownedByCurrentUser: false,
};

const mockComment2: CommunityCommentDto = {
  id: "c-2",
  author: { displayName: "Alice Trader" },
  content: "Thanks Charlie! We will cover Greeks tomorrow.",
  createdAt: "2026-09-21T08:45:00.000Z",
  ownedByCurrentUser: true,
};

import { AuthUser } from "../../../api/auth.api";

const renderWithProviders = (
  postId = "post-100",
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
      <MemoryRouter initialEntries={[`/community/posts/${postId}`]}>
        <AuthProvider initialToken={initialToken} initialUser={initialUser}>
          <Routes>
            <Route path="/community/posts/:postId" element={<PostDetailPage />} />
            <Route path="/community" element={<div>Community Feed Mock</div>} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

describe("PostDetailPage (Component & State - AC-001..AC-028)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders auth-required card when unauthenticated and issues no requests (AC-003)", async () => {
    const getPostSpy = vi.spyOn(communityApi, "getPostById");

    renderWithProviders("post-100", { initialToken: null, initialUser: null });

    await waitFor(() => {
      expect(screen.getByTestId("community-auth-card")).toBeDefined();
    });
    expect(getPostSpy).not.toHaveBeenCalled();
  });

  it("renders 404 Not Found card when post does not exist or was removed (AC-015, AC-023)", async () => {
    vi.spyOn(communityApi, "getPostById").mockRejectedValue(
      new CommunityApiError(404, "NOT_FOUND", "Post not found"),
    );

    renderWithProviders("post-unknown");

    await waitFor(() => {
      expect(screen.getByTestId("community-not-found-card")).toBeDefined();
      expect(screen.getByText("Post Not Found")).toBeDefined();
    });
  });

  it("renders post details and flat comments list in chronological order (AC-022, AC-028)", async () => {
    vi.spyOn(communityApi, "getPostById").mockResolvedValue({ data: mockDetailPost });
    const commentsResponse: CommunityCommentFeedResponse = {
      data: [mockComment1, mockComment2],
      pageInfo: { nextCursor: null, hasNextPage: false },
    };
    vi.spyOn(communityApi, "listComments").mockResolvedValue(commentsResponse);

    renderWithProviders("post-100");

    await waitFor(() => {
      expect(screen.getByText("Deep dive into options pricing and volatility surfaces.")).toBeDefined();
    });

    // Back to feed link
    expect(screen.getByTestId("back-to-feed-link")).toBeDefined();

    // Post details
    expect(screen.getAllByText("Alice Trader").length).toBe(2);
    expect(screen.getByTestId("post-like-count-post-100").textContent).toBe("5");

    // Comments heading and items
    expect(screen.getByText(/Comments \(2\)/i)).toBeDefined();
    expect(screen.getByTestId("community-comment-c-1")).toBeDefined();
    expect(screen.getByTestId("community-comment-c-2")).toBeDefined();
    expect(screen.getByText("Great explanation of implied volatility skew!")).toBeDefined();
    expect(screen.getByText("Thanks Charlie! We will cover Greeks tomorrow.")).toBeDefined();
  });

  it("shows remove comment control ONLY for the comment owner (AC-020)", async () => {
    vi.spyOn(communityApi, "getPostById").mockResolvedValue({ data: mockDetailPost });
    const commentsResponse: CommunityCommentFeedResponse = {
      data: [mockComment1, mockComment2],
      pageInfo: { nextCursor: null, hasNextPage: false },
    };
    vi.spyOn(communityApi, "listComments").mockResolvedValue(commentsResponse);

    renderWithProviders("post-100");

    await waitFor(() => {
      expect(screen.getByTestId("community-comment-c-1")).toBeDefined();
    });

    // c-1 is owned by Charlie: Alice must NOT see remove button
    expect(screen.queryByTestId("comment-remove-btn-c-1")).toBeNull();

    // c-2 is owned by Alice: Alice MUST see remove button
    expect(screen.getByTestId("comment-remove-btn-c-2")).toBeDefined();
  });

  it("calls removeComment when comment owner confirms removal (AC-020, AC-024)", async () => {
    vi.spyOn(communityApi, "getPostById").mockResolvedValue({ data: mockDetailPost });
    const commentsResponse: CommunityCommentFeedResponse = {
      data: [mockComment2],
      pageInfo: { nextCursor: null, hasNextPage: false },
    };
    vi.spyOn(communityApi, "listComments").mockResolvedValue(commentsResponse);
    const removeCommentSpy = vi.spyOn(communityApi, "removeComment").mockResolvedValue({
      data: { id: "c-2", removed: true },
    });
    vi.spyOn(window, "confirm").mockReturnValue(true);

    renderWithProviders("post-100");

    await waitFor(() => {
      expect(screen.getByTestId("comment-remove-btn-c-2")).toBeDefined();
    });

    fireEvent.click(screen.getByTestId("comment-remove-btn-c-2"));

    await waitFor(() => {
      expect(removeCommentSpy).toHaveBeenCalledWith("c-2", "test-token");
    });
  });

  it("submits a new comment and clears textarea on success (AC-018, AC-024)", async () => {
    vi.spyOn(communityApi, "getPostById").mockResolvedValue({ data: mockDetailPost });
    const commentsResponse: CommunityCommentFeedResponse = {
      data: [],
      pageInfo: { nextCursor: null, hasNextPage: false },
    };
    vi.spyOn(communityApi, "listComments").mockResolvedValue(commentsResponse);
    const createCommentSpy = vi.spyOn(communityApi, "createComment").mockResolvedValue({
      data: {
        id: "c-new",
        author: { displayName: "Alice Trader" },
        content: "First comment here!",
        createdAt: new Date().toISOString(),
        ownedByCurrentUser: true,
      },
    });

    renderWithProviders("post-100");

    await waitFor(() => {
      expect(screen.getByTestId("comment-composer-textarea")).toBeDefined();
    });

    const textarea = screen.getByTestId("comment-composer-textarea");
    const submitBtn = screen.getByTestId("comment-composer-submit-btn") as HTMLButtonElement;

    expect(submitBtn.disabled).toBe(true);

    fireEvent.change(textarea, { target: { value: "First comment here!" } });
    expect(submitBtn.disabled).toBe(false);

    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(createCommentSpy).toHaveBeenCalledWith("post-100", { content: "First comment here!" }, "test-token");
    });

    expect((textarea as HTMLTextAreaElement).value).toBe("");
  });

  it("handles explicit Load More comments pagination (AC-010)", async () => {
    vi.spyOn(communityApi, "getPostById").mockResolvedValue({ data: mockDetailPost });

    const page1: CommunityCommentFeedResponse = {
      data: [mockComment1],
      pageInfo: { nextCursor: "comment-cur-1", hasNextPage: true },
    };
    const page2: CommunityCommentFeedResponse = {
      data: [mockComment2],
      pageInfo: { nextCursor: null, hasNextPage: false },
    };

    const listSpy = vi.spyOn(communityApi, "listComments")
      .mockResolvedValueOnce(page1)
      .mockResolvedValueOnce(page2);

    renderWithProviders("post-100");

    await waitFor(() => {
      expect(screen.getByTestId("community-comment-c-1")).toBeDefined();
    });

    const loadMoreBtn = screen.getByTestId("comments-load-more-btn");
    expect(loadMoreBtn).toBeDefined();

    fireEvent.click(loadMoreBtn);

    await waitFor(() => {
      expect(screen.getByTestId("community-comment-c-2")).toBeDefined();
    });

    expect(screen.queryByTestId("comments-load-more-btn")).toBeNull();
    expect(listSpy).toHaveBeenCalledTimes(2);
  });
});
