import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { User } from "@prisma/client";
import { ERROR_CODES, HTTP_STATUS } from "@aura/shared";
import { accessTokenService } from "../../src/modules/auth/access-token.service.js";
import type { AccessTokenPayload } from "../../src/modules/auth/auth.types.js";
import { userRepository } from "../../src/modules/users/user.repository.js";
import { CommunityPostLikeController } from "../../src/modules/community/community-post-like.controller.js";
import type { ICommunityPostLikeService } from "../../src/modules/community/community-post-like.service.js";
import type { CommunityPostController } from "../../src/modules/community/community-post.controller.js";
import { createCommunityRouter } from "../../src/modules/community/community.routes.js";
import { errorHandlerMiddleware } from "../../src/middleware/error-handler.js";
import { AppError } from "../../src/shared/errors/error-envelope.js";

describe("FEAT-044 Community post-like HTTP contract", () => {
  const postId = "11111111-2222-4333-8444-555555555555";
  const userId = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
  const authHeader = "Bearer valid.mock.token";
  const likePost = vi.fn();
  const unlikePost = vi.fn();
  const likeService: ICommunityPostLikeService = { likePost, unlikePost };
  const likeController = new CommunityPostLikeController(likeService);
  const unusedPostController = {} as CommunityPostController;
  const app = express();
  app.use(express.json());
  app.use(createCommunityRouter(unusedPostController, undefined, likeController));
  app.use(errorHandlerMiddleware);

  beforeEach(() => {
    vi.restoreAllMocks();
    likePost.mockReset().mockResolvedValue({ postId, likedByCurrentUser: true, likeCount: 1 });
    unlikePost.mockReset().mockResolvedValue({ postId, likedByCurrentUser: false, likeCount: 0 });
    vi.spyOn(accessTokenService, "verifyAccessToken").mockReturnValue({
      sub: userId,
      type: "access",
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 600,
    } as AccessTokenPayload);
    vi.spyOn(userRepository, "findById").mockResolvedValue({
      id: userId,
      email: "like-user@example.invalid",
      status: "ACTIVE",
      displayName: "Like User",
      createdAt: new Date(),
      updatedAt: new Date(),
    } as User);
  });

  it("requires authentication for PUT and DELETE", async () => {
    for (const operation of [
      request(app).put(`/api/community/posts/${postId}/like`),
      request(app).delete(`/api/community/posts/${postId}/like`),
    ]) {
      const response = await operation.expect(HTTP_STATUS.UNAUTHORIZED);
      expect(response.body.error.code).toBe(ERROR_CODES.UNAUTHENTICATED);
    }
  });

  it("returns only canonical state for PUT and DELETE", async () => {
    const liked = await request(app)
      .put(`/api/community/posts/${postId}/like`)
      .set("Authorization", authHeader)
      .expect(HTTP_STATUS.OK);
    expect(liked.body).toEqual({ data: { postId, likedByCurrentUser: true, likeCount: 1 } });
    expect(likePost).toHaveBeenCalledWith(postId, userId);

    const unliked = await request(app)
      .delete(`/api/community/posts/${postId}/like`)
      .set("Authorization", authHeader)
      .expect(HTTP_STATUS.OK);
    expect(unliked.body).toEqual({ data: { postId, likedByCurrentUser: false, likeCount: 0 } });
    expect(unlikePost).toHaveBeenCalledWith(postId, userId);
  });

  it("rejects malformed IDs before service mutation", async () => {
    const response = await request(app)
      .put("/api/community/posts/not-a-uuid/like")
      .set("Authorization", authHeader)
      .expect(HTTP_STATUS.BAD_REQUEST);
    expect(response.body.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    expect(likePost).not.toHaveBeenCalled();
  });

  it("rejects every non-empty or forged body before mutation", async () => {
    for (const body of [
      { userId: "ffffffff-ffff-4fff-8fff-ffffffffffff" },
      { likeCount: 99 },
      { status: "VISIBLE" },
      { postId: "ffffffff-ffff-4fff-8fff-ffffffffffff" },
    ]) {
      const response = await request(app)
        .put(`/api/community/posts/${postId}/like`)
        .set("Authorization", authHeader)
        .send(body)
        .expect(HTTP_STATUS.BAD_REQUEST);
      expect(response.body.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    }
    expect(likePost).not.toHaveBeenCalled();
  });

  it("uses the same safe 404 contract for unavailable posts", async () => {
    likePost.mockRejectedValue(
      new AppError("Post not found", ERROR_CODES.NOT_FOUND, HTTP_STATUS.NOT_FOUND),
    );
    const response = await request(app)
      .put(`/api/community/posts/${postId}/like`)
      .set("Authorization", authHeader)
      .expect(HTTP_STATUS.NOT_FOUND);
    expect(response.body.error.code).toBe(ERROR_CODES.NOT_FOUND);
  });
});
