import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { CommunityApiClient } from "./community.api";
import { CommunityApiError } from "../features/community/types/community-ui.types";

describe("CommunityApiClient Unit Tests (AC-002)", () => {
  let client: CommunityApiClient;
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    client = new CommunityApiClient("/api/community");
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.clearAllMocks();
  });

  it("listPosts forwards query parameters and AbortSignal", async () => {
    const mockResponse = {
      data: [
        {
          id: "p-1",
          author: { displayName: "Alice" },
          content: "Post 1",
          createdAt: "2026-09-26T00:00:00Z",
          likeCount: 5,
          commentCount: 2,
          likedByCurrentUser: false,
          ownedByCurrentUser: false,
        },
      ],
      pageInfo: { nextCursor: null, hasNextPage: false },
    };

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });
    globalThis.fetch = fetchMock;

    const controller = new AbortController();
    const result = await client.listPosts(
      { limit: 10, cursor: "cursor-1" },
      "test-token",
      { signal: controller.signal },
    );

    expect(result).toEqual(mockResponse);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/community/posts?limit=10&cursor=cursor-1",
      expect.objectContaining({
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: "Bearer test-token",
        },
        signal: controller.signal,
      }),
    );
  });

  it("listPosts sorts posts by engagement in memory when sort=POPULAR", async () => {
    const post1 = {
      id: "p-1",
      author: { displayName: "Alice" },
      content: "Post 1",
      createdAt: "2026-09-26T00:00:00Z",
      likeCount: 2,
      commentCount: 1,
      likedByCurrentUser: false,
      ownedByCurrentUser: false,
    };
    const post2 = {
      id: "p-2",
      author: { displayName: "Bob" },
      content: "Post 2",
      createdAt: "2026-09-26T01:00:00Z",
      likeCount: 10,
      commentCount: 4,
      likedByCurrentUser: false,
      ownedByCurrentUser: false,
    };

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: [post1, post2], pageInfo: { nextCursor: null, hasNextPage: false } }),
    });

    const result = await client.listPosts({ sort: "POPULAR" }, "test-token");
    expect(result.data[0]?.id).toBe("p-2"); // Higher score: 14 vs 3
    expect(result.data[1]?.id).toBe("p-1");
  });

  it("createPost formats title and content safely", async () => {
    const createdPost = {
      id: "p-new",
      author: { displayName: "Alice" },
      content: "# Heading\n\nBody content",
      createdAt: "2026-09-26T00:00:00Z",
      likeCount: 0,
      commentCount: 0,
      likedByCurrentUser: false,
      ownedByCurrentUser: true,
    };

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: createdPost }),
    });
    globalThis.fetch = fetchMock;

    const result = await client.createPost(
      { title: "Heading", content: "Body content" },
      "test-token",
    );

    expect(result.data).toEqual(createdPost);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/community/posts",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ content: "# Heading\n\nBody content" }),
      }),
    );
  });

  it("toggleLike delegates to likePost when isLiked is false", async () => {
    const likeSpy = vi.spyOn(client, "likePost").mockResolvedValue({
      data: { postId: "p-1", likedByCurrentUser: true, likeCount: 5 },
    });

    const result = await client.toggleLike("p-1", false, "test-token");
    expect(likeSpy).toHaveBeenCalledWith("p-1", "test-token", undefined);
    expect(result.data.likedByCurrentUser).toBe(true);
  });

  it("toggleLike delegates to unlikePost when isLiked is true", async () => {
    const unlikeSpy = vi.spyOn(client, "unlikePost").mockResolvedValue({
      data: { postId: "p-1", likedByCurrentUser: false, likeCount: 4 },
    });

    const result = await client.toggleLike("p-1", true, "test-token");
    expect(unlikeSpy).toHaveBeenCalledWith("p-1", "test-token", undefined);
    expect(result.data.likedByCurrentUser).toBe(false);
  });

  it("throws CommunityApiError on 401 Unauthorized", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      headers: new Headers(),
      json: () => Promise.resolve({ error: { code: "UNAUTHENTICATED", message: "Token required" } }),
    });

    await expect(client.getPostById("p-1", undefined)).rejects.toThrowError(CommunityApiError);
  });

  it("throws CommunityApiError on 404 Not Found", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      headers: new Headers(),
      json: () => Promise.resolve({ error: { code: "NOT_FOUND", message: "Post not found" } }),
    });

    await expect(client.getPostById("p-missing", "token")).rejects.toThrowError(CommunityApiError);
  });

  it("throws CommunityApiError with retryAfter on 429 Rate Limit", async () => {
    const headers = new Headers();
    headers.set("retry-after", "45");

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      headers,
      json: () => Promise.resolve({ error: { code: "RATE_LIMITED", message: "Too many requests" } }),
    });

    try {
      await client.createPost({ content: "Spam" }, "token");
      expect.fail("Should have thrown");
    } catch (err: unknown) {
      expect(err).toBeInstanceOf(CommunityApiError);
      const apiErr = err as CommunityApiError;
      expect(apiErr.status).toBe(429);
      expect(apiErr.retryAfter).toBe(45);
    }
  });
});
