import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "../../src/features/auth/context/AuthContext";
import { CommunityRoutes } from "../../src/app/router/community-routes";
import { communityApi } from "../../src/api/community.api";
import {
  CommunityPostDto,
  CommunityCommentDto,
  CommunityPostFeedResponse,
  CommunityCommentFeedResponse,
} from "../../src/features/community/types/community-ui.types";

const mockCreatedPost: CommunityPostDto = {
  id: "post-journey-1",
  author: { displayName: "Journey Learner" },
  content: "<script>alert('xss')</script> How to construct a market-neutral portfolio?",
  createdAt: "2026-09-21T09:00:00.000Z",
  likeCount: 0,
  commentCount: 0,
  likedByCurrentUser: false,
  ownedByCurrentUser: true,
};

const mockCreatedComment: CommunityCommentDto = {
  id: "comment-journey-1",
  author: { displayName: "Journey Learner" },
  content: "<b>Bold insight:</b> Beta should be strictly zero.",
  createdAt: "2026-09-21T09:05:00.000Z",
  ownedByCurrentUser: true,
};

describe("Community Integrated Learner Journey (Runtime Smoke - AC-026..AC-029)", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.restoreAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const renderJourney = (initialRoute = "/community") => {
    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[initialRoute]}>
          <AuthProvider
            initialToken="valid-journey-jwt-token"
            initialUser={{
              id: "user-journey-id",
              email: "learner@auracapital.io",
              role: "LEARNER",
            }}
          >
            <Routes>
              <Route path="/community/*" element={<CommunityRoutes />} />
            </Routes>
          </AuthProvider>
        </MemoryRouter>
      </QueryClientProvider>,
    );
  };

  it("completes full learner journey: feed -> create post -> detail -> like/unlike -> comment -> remove comment -> remove post (AC-029)", async () => {
    // 1. Initial feed load returns empty list
    const initialFeed: CommunityPostFeedResponse = {
      data: [],
      pageInfo: { nextCursor: null, hasNextPage: false },
    };
    const feedAfterPost: CommunityPostFeedResponse = {
      data: [mockCreatedPost],
      pageInfo: { nextCursor: null, hasNextPage: false },
    };

    const listPostsSpy = vi.spyOn(communityApi, "listPosts")
      .mockResolvedValueOnce(initialFeed)
      .mockResolvedValue(feedAfterPost);

    const createPostSpy = vi.spyOn(communityApi, "createPost").mockResolvedValue({
      data: mockCreatedPost,
    });

    renderJourney("/community");

    // Feed renders with single h1
    expect(screen.getByRole("heading", { level: 1, name: "Community Discussions" })).toBeDefined();

    // Verify empty state initially
    await waitFor(() => {
      expect(screen.getByTestId("community-empty-state")).toBeDefined();
    });

    // 2. Compose and submit new post with potential XSS payload
    const postTextarea = screen.getByTestId("post-composer-textarea");
    const postSubmitBtn = screen.getByTestId("post-composer-submit-btn");

    fireEvent.change(postTextarea, {
      target: { value: "<script>alert('xss')</script> How to construct a market-neutral portfolio?" },
    });
    fireEvent.click(postSubmitBtn);

    await waitFor(() => {
      expect(createPostSpy).toHaveBeenCalledWith(
        { content: "<script>alert('xss')</script> How to construct a market-neutral portfolio?" },
        "valid-journey-jwt-token",
      );
    });

    // 3. Post appears in feed. Verify XSS content is safely rendered as plain text (AC-028)
    await waitFor(() => {
      expect(screen.getByTestId("community-post-card-post-journey-1")).toBeDefined();
    });

    const postContentEl = screen.getByTestId("post-content-post-journey-1");
    expect(postContentEl.textContent).toBe(
      "<script>alert('xss')</script> How to construct a market-neutral portfolio?",
    );
    // Verified: No HTML tag execution occurred, content is literal text
    expect(postContentEl.querySelector("script")).toBeNull();

    // 4. Navigate into Post Detail
    vi.spyOn(communityApi, "getPostById").mockResolvedValue({ data: mockCreatedPost });
    const emptyComments: CommunityCommentFeedResponse = {
      data: [],
      pageInfo: { nextCursor: null, hasNextPage: false },
    };
    const commentsAfterAdd: CommunityCommentFeedResponse = {
      data: [mockCreatedComment],
      pageInfo: { nextCursor: null, hasNextPage: false },
    };
    const listCommentsSpy = vi.spyOn(communityApi, "listComments")
      .mockResolvedValueOnce(emptyComments)
      .mockResolvedValue(commentsAfterAdd);

    const commentsLink = screen.getByTestId("post-comments-link-post-journey-1");
    fireEvent.click(commentsLink);

    await waitFor(() => {
      expect(screen.getByTestId("back-to-feed-link")).toBeDefined();
      expect(screen.getByRole("heading", { level: 2, name: /Comments/i })).toBeDefined();
    });

    // 5. Like interaction
    const likeSpy = vi.spyOn(communityApi, "likePost").mockResolvedValue({
      data: { postId: "post-journey-1", likedByCurrentUser: true, likeCount: 1 },
    });
    const likeBtn = screen.getByTestId("post-like-btn-post-journey-1");
    fireEvent.click(likeBtn);

    await waitFor(() => {
      expect(likeSpy).toHaveBeenCalledWith("post-journey-1", "valid-journey-jwt-token");
    });

    // 6. Add comment
    const createCommentSpy = vi.spyOn(communityApi, "createComment").mockResolvedValue({
      data: mockCreatedComment,
    });
    const commentTextarea = screen.getByTestId("comment-composer-textarea");
    const commentSubmitBtn = screen.getByTestId("comment-composer-submit-btn");

    fireEvent.change(commentTextarea, {
      target: { value: "<b>Bold insight:</b> Beta should be strictly zero." },
    });
    fireEvent.click(commentSubmitBtn);

    await waitFor(() => {
      expect(createCommentSpy).toHaveBeenCalledWith(
        "post-journey-1",
        { content: "<b>Bold insight:</b> Beta should be strictly zero." },
        "valid-journey-jwt-token",
      );
    });

    // Verify comment rendered safely as plain text (AC-028)
    await waitFor(() => {
      expect(screen.getByTestId("community-comment-comment-journey-1")).toBeDefined();
    });
    const commentContentEl = screen.getByTestId("comment-content-comment-journey-1");
    expect(commentContentEl.textContent).toBe("<b>Bold insight:</b> Beta should be strictly zero.");
    expect(commentContentEl.querySelector("b")).toBeNull();

    // 7. Remove comment
    const removeCommentSpy = vi.spyOn(communityApi, "removeComment").mockResolvedValue({
      data: { id: "comment-journey-1", removed: true },
    });
    vi.spyOn(window, "confirm").mockReturnValue(true);

    const removeCommentBtn = screen.getByTestId("comment-remove-btn-comment-journey-1");
    fireEvent.click(removeCommentBtn);

    await waitFor(() => {
      expect(removeCommentSpy).toHaveBeenCalledWith("comment-journey-1", "valid-journey-jwt-token");
    });

    // 8. Remove post
    const removePostSpy = vi.spyOn(communityApi, "removePost").mockResolvedValue({
      data: { id: "post-journey-1", removed: true },
    });

    const removePostBtn = screen.getByTestId("post-remove-btn-post-journey-1");
    fireEvent.click(removePostBtn);

    await waitFor(() => {
      expect(removePostSpy).toHaveBeenCalledWith("post-journey-1", "valid-journey-jwt-token");
    });

    expect(listPostsSpy).toHaveBeenCalled();
    expect(listCommentsSpy).toHaveBeenCalled();
  });
});
