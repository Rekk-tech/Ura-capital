import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PostLikeButton } from "./PostLikeButton";
import { communityApi } from "../../../api/community.api";
import { CommunityApiError } from "../types/community-ui.types";

const renderWithClient = (ui: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>,
  );
};

describe("PostLikeButton Component (AC-006)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders with correct initial state, count, and accessible labels", () => {
    renderWithClient(
      <PostLikeButton
        postId="p-10"
        likedByCurrentUser={false}
        likeCount={7}
        accessToken="test-token"
      />,
    );

    const btn = screen.getByTestId("post-like-btn-p-10");
    expect(btn.getAttribute("aria-pressed")).toBe("false");
    expect(btn.getAttribute("aria-label")).toContain("Like post");
    expect(screen.getByTestId("post-like-count-p-10").textContent).toBe("7");
  });

  it("handles like toggle when clicked and updates atomic server count", async () => {
    const likeSpy = vi.spyOn(communityApi, "likePost").mockResolvedValue({
      data: { postId: "p-10", likedByCurrentUser: true, likeCount: 8 },
    });
    const onLikeChanged = vi.fn();

    renderWithClient(
      <PostLikeButton
        postId="p-10"
        likedByCurrentUser={false}
        likeCount={7}
        accessToken="test-token"
        onLikeChanged={onLikeChanged}
      />,
    );

    const btn = screen.getByTestId("post-like-btn-p-10");
    fireEvent.click(btn);

    await waitFor(() => {
      expect(likeSpy).toHaveBeenCalledWith("p-10", "test-token");
      expect(screen.getByTestId("post-like-count-p-10").textContent).toBe("8");
      expect(btn.getAttribute("aria-pressed")).toBe("true");
      expect(onLikeChanged).toHaveBeenCalledWith(true, 8);
    });
  });

  it("handles unlike toggle when already liked", async () => {
    const unlikeSpy = vi.spyOn(communityApi, "unlikePost").mockResolvedValue({
      data: { postId: "p-10", likedByCurrentUser: false, likeCount: 7 },
    });

    renderWithClient(
      <PostLikeButton
        postId="p-10"
        likedByCurrentUser={true}
        likeCount={8}
        accessToken="test-token"
      />,
    );

    const btn = screen.getByTestId("post-like-btn-p-10");
    expect(btn.getAttribute("aria-pressed")).toBe("true");

    fireEvent.click(btn);

    await waitFor(() => {
      expect(unlikeSpy).toHaveBeenCalledWith("p-10", "test-token");
      expect(screen.getByTestId("post-like-count-p-10").textContent).toBe("7");
      expect(btn.getAttribute("aria-pressed")).toBe("false");
    });
  });

  it("safely prompts unauthenticated user to sign in without triggering page error", async () => {
    const likeSpy = vi.spyOn(communityApi, "likePost");

    renderWithClient(
      <PostLikeButton
        postId="p-10"
        likedByCurrentUser={false}
        likeCount={3}
        accessToken={undefined}
      />,
    );

    const btn = screen.getByTestId("post-like-btn-p-10");
    fireEvent.click(btn);

    expect(likeSpy).not.toHaveBeenCalled();
    expect(screen.getByTestId("like-auth-notice-p-10")).toBeDefined();
    expect(screen.getByText(/Please sign in to like this post/i)).toBeDefined();
  });

  it("displays rate limit notice when server returns 429", async () => {
    vi.spyOn(communityApi, "likePost").mockRejectedValue(
      new CommunityApiError(429, "RATE_LIMITED", "Too many requests", 30),
    );

    renderWithClient(
      <PostLikeButton
        postId="p-10"
        likedByCurrentUser={false}
        likeCount={5}
        accessToken="test-token"
      />,
    );

    fireEvent.click(screen.getByTestId("post-like-btn-p-10"));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeDefined();
      expect(screen.getByText(/wait 30s/i)).toBeDefined();
    });
  });
});
