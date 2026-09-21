import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { CommunityApiClient, communityApi } from "./community.api";
import { CommunityApiError } from "../features/community/types/community-ui.types";

describe("CommunityApiClient (Web API Client)", () => {
  let client: CommunityApiClient;
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    client = new CommunityApiClient("/api/community");
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("exports a default singleton instance", () => {
    expect(communityApi).toBeInstanceOf(CommunityApiClient);
  });

  describe("listPosts", () => {
    it("calls GET /api/community/posts with default headers and returns data", async () => {
      const mockResponse = {
        data: [{ id: "p1", content: "Post 1", author: { displayName: "Learner 1" } }],
        pageInfo: { nextCursor: null, hasNextPage: false },
      };
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const res = await client.listPosts(undefined, "test-token");
      expect(globalThis.fetch).toHaveBeenCalledWith("/api/community/posts", {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: "Bearer test-token",
        },
        signal: undefined,
      });
      expect(res).toEqual(mockResponse);
    });

    it("appends limit and cursor query parameters when provided", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ data: [], pageInfo: { nextCursor: null, hasNextPage: false } }),
      });

      await client.listPosts({ limit: 15, cursor: "cur-123" });
      expect(globalThis.fetch).toHaveBeenCalledWith("/api/community/posts?limit=15&cursor=cur-123", {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
        signal: undefined,
      });
    });
  });

  describe("createPost", () => {
    it("calls POST /api/community/posts with JSON body and Auth header", async () => {
      const mockResponse = {
        data: {
          id: "p-new",
          content: "Hello community!",
          author: { displayName: "Author A" },
          createdAt: new Date().toISOString(),
          likeCount: 0,
          commentCount: 0,
          likedByCurrentUser: false,
          ownedByCurrentUser: true,
        },
      };

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const res = await client.createPost({ content: "Hello community!" }, "jwt-token");
      expect(globalThis.fetch).toHaveBeenCalledWith("/api/community/posts", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: "Bearer jwt-token",
        },
        body: JSON.stringify({ content: "Hello community!" }),
        signal: undefined,
      });
      expect(res).toEqual(mockResponse);
    });
  });

  describe("getPostById", () => {
    it("calls GET /api/community/posts/:postId with proper encoding", async () => {
      const mockResponse = {
        data: {
          id: "post-123",
          content: "Post details",
        },
      };

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const res = await client.getPostById("post-123", "token");
      expect(globalThis.fetch).toHaveBeenCalledWith("/api/community/posts/post-123", {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: "Bearer token",
        },
        signal: undefined,
      });
      expect(res).toEqual(mockResponse);
    });
  });

  describe("removePost", () => {
    it("calls DELETE /api/community/posts/:postId with Auth header", async () => {
      const mockResponse = { data: { id: "p1", removed: true } };
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const res = await client.removePost("p1", "token");
      expect(globalThis.fetch).toHaveBeenCalledWith("/api/community/posts/p1", {
        method: "DELETE",
        headers: {
          Accept: "application/json",
          Authorization: "Bearer token",
        },
        signal: undefined,
      });
      expect(res).toEqual(mockResponse);
    });
  });

  describe("listComments", () => {
    it("calls GET /api/community/posts/:postId/comments with parameters", async () => {
      const mockResponse = {
        data: [{ id: "c1", content: "Great post!" }],
        pageInfo: { nextCursor: null, hasNextPage: false },
      };
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const res = await client.listComments("post-abc", { limit: 10, cursor: "c-cur" }, "token");
      expect(globalThis.fetch).toHaveBeenCalledWith(
        "/api/community/posts/post-abc/comments?limit=10&cursor=c-cur",
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            Authorization: "Bearer token",
          },
          signal: undefined,
        },
      );
      expect(res).toEqual(mockResponse);
    });
  });

  describe("createComment", () => {
    it("calls POST /api/community/posts/:postId/comments with JSON body", async () => {
      const mockResponse = {
        data: {
          id: "comment-new",
          content: "Nice comment",
          author: { displayName: "Learner 2" },
          createdAt: new Date().toISOString(),
          ownedByCurrentUser: true,
        },
      };

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const res = await client.createComment("post-1", { content: "Nice comment" }, "token");
      expect(globalThis.fetch).toHaveBeenCalledWith("/api/community/posts/post-1/comments", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: "Bearer token",
        },
        body: JSON.stringify({ content: "Nice comment" }),
        signal: undefined,
      });
      expect(res).toEqual(mockResponse);
    });
  });

  describe("removeComment", () => {
    it("calls DELETE /api/community/comments/:commentId", async () => {
      const mockResponse = { data: { id: "c1", removed: true } };
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const res = await client.removeComment("c1", "token");
      expect(globalThis.fetch).toHaveBeenCalledWith("/api/community/comments/c1", {
        method: "DELETE",
        headers: {
          Accept: "application/json",
          Authorization: "Bearer token",
        },
        signal: undefined,
      });
      expect(res).toEqual(mockResponse);
    });
  });

  describe("likePost and unlikePost", () => {
    it("calls PUT /api/community/posts/:postId/like for liking", async () => {
      const mockResponse = {
        data: {
          postId: "p-like",
          likedByCurrentUser: true,
          likeCount: 5,
        },
      };
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const res = await client.likePost("p-like", "token");
      expect(globalThis.fetch).toHaveBeenCalledWith("/api/community/posts/p-like/like", {
        method: "PUT",
        headers: {
          Accept: "application/json",
          Authorization: "Bearer token",
        },
        signal: undefined,
      });
      expect(res).toEqual(mockResponse);
    });

    it("calls DELETE /api/community/posts/:postId/like for unliking", async () => {
      const mockResponse = {
        data: {
          postId: "p-like",
          likedByCurrentUser: false,
          likeCount: 4,
        },
      };
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const res = await client.unlikePost("p-like", "token");
      expect(globalThis.fetch).toHaveBeenCalledWith("/api/community/posts/p-like/like", {
        method: "DELETE",
        headers: {
          Accept: "application/json",
          Authorization: "Bearer token",
        },
        signal: undefined,
      });
      expect(res).toEqual(mockResponse);
    });
  });

  describe("handleError & Error Mapping", () => {
    it("maps 400 VALIDATION_ERROR with server details", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        headers: new Headers(),
        json: async () => ({
          error: {
            code: "VALIDATION_ERROR",
            message: "Content cannot be empty",
            details: { field: "content" },
          },
        }),
      });

      await expect(client.createPost({ content: "" }, "token")).rejects.toMatchObject({
        name: "CommunityApiError",
        status: 400,
        code: "VALIDATION_ERROR",
        message: "Content cannot be empty",
      });
    });

    it("maps 401 UNAUTHENTICATED", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        headers: new Headers(),
        json: async () => ({
          error: { code: "UNAUTHENTICATED", message: "Token expired" },
        }),
      });

      await expect(client.getPostById("p1")).rejects.toMatchObject({
        status: 401,
        code: "UNAUTHENTICATED",
        message: "Token expired",
      });
    });

    it("maps 404 NOT_FOUND", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        headers: new Headers(),
        json: async () => ({
          error: { code: "NOT_FOUND", message: "Post not found" },
        }),
      });

      await expect(client.getPostById("non-existent")).rejects.toMatchObject({
        status: 404,
        code: "NOT_FOUND",
        message: "Post not found",
      });
    });

    it("maps 429 RATE_LIMITED and extracts Retry-After header", async () => {
      const headers = new Headers();
      headers.set("retry-after", "120");

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        headers,
        json: async () => ({
          error: {
            code: "RATE_LIMITED",
            message: "Rate limit exceeded. Please wait 120 seconds before retrying.",
          },
        }),
      });

      try {
        await client.likePost("p1", "token");
        expect.unreachable("Should have thrown CommunityApiError");
      } catch (err) {
        expect(err).toBeInstanceOf(CommunityApiError);
        const apiErr = err as CommunityApiError;
        expect(apiErr.status).toBe(429);
        expect(apiErr.code).toBe("RATE_LIMITED");
        expect(apiErr.retryAfter).toBe(120);
        expect(apiErr.message).toContain("120 seconds");
      }
    });

    it("maps 503 SERVICE_UNAVAILABLE during Redis outage", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
        headers: new Headers(),
        json: async () => ({
          error: {
            code: "SERVICE_UNAVAILABLE",
            message: "Service temporarily unavailable. Please try again shortly.",
          },
        }),
      });

      await expect(client.createPost({ content: "test" }, "token")).rejects.toMatchObject({
        status: 503,
        code: "SERVICE_UNAVAILABLE",
      });
    });

    it("handles non-JSON error responses gracefully", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        headers: new Headers(),
        json: async () => {
          throw new Error("Invalid JSON");
        },
      });

      await expect(client.getPostById("p1")).rejects.toMatchObject({
        status: 500,
        code: "INTERNAL_ERROR",
      });
    });
  });
});
