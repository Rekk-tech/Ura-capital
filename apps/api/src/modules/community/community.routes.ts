import { Router, type RequestHandler } from "express";
import { authenticate } from "../auth/auth.middleware.js";
import { createRepositoryContainer } from "../../infrastructure/database/repository-factory.js";
import { transactionRunner } from "../../infrastructure/database/transaction-runner.js";
import { CommunityPostService } from "./community-post.service.js";
import { CommunityPostController } from "./community-post.controller.js";
import { CommunityCommentService } from "./community-comment.service.js";
import { CommunityCommentController } from "./community-comment.controller.js";
import { CommunityPostLikeController } from "./community-post-like.controller.js";
import { CommunityPostLikeService } from "./community-post-like.service.js";
import { createCommunityRateLimiter } from "./community-rate-limit.middleware.js";

export interface CommunityRateLimiters {
  postCreate?: RequestHandler;
  postDelete?: RequestHandler;
  commentCreate?: RequestHandler;
  commentDelete?: RequestHandler;
  likeMutation?: RequestHandler;
}

export function createCommunityRouter(
  postController?: CommunityPostController,
  commentController?: CommunityCommentController,
  postLikeController?: CommunityPostLikeController,
  rateLimiters?: CommunityRateLimiters,
): Router {
  const router = Router();
  const repoContainer = createRepositoryContainer();

  const posts =
    postController ??
    new CommunityPostController(
      new CommunityPostService(
        repoContainer.communityPostRepo,
        transactionRunner,
      ),
    );

  const comments =
    commentController ??
    new CommunityCommentController(
      new CommunityCommentService(
        repoContainer.communityCommentRepo,
        repoContainer.communityPostRepo,
        transactionRunner,
      ),
    );

  const likeController =
    postLikeController ??
    new CommunityPostLikeController(
      new CommunityPostLikeService(transactionRunner),
    );

  // FEAT-045: Write rate limiters (fail-closed, Redis-backed, dual user/source ceilings)
  const postCreateRateLimit =
    rateLimiters?.postCreate ?? createCommunityRateLimiter({ operation: "post_create" });
  const postDeleteRateLimit =
    rateLimiters?.postDelete ?? createCommunityRateLimiter({ operation: "post_delete" });
  const commentCreateRateLimit =
    rateLimiters?.commentCreate ?? createCommunityRateLimiter({ operation: "comment_create" });
  const commentDeleteRateLimit =
    rateLimiters?.commentDelete ?? createCommunityRateLimiter({ operation: "comment_delete" });
  const likeMutationRateLimit =
    rateLimiters?.likeMutation ?? createCommunityRateLimiter({ operation: "post_like_mutation" });

  // FEAT-042 Posts routes — Authenticated only
  // GET feed remains unbounded by Redis write limits (available during Redis outages)
  router.get("/api/community/posts", authenticate, (req, res, next) => {
    posts.listFeed(req, res, next);
  });

  router.post("/api/community/posts", authenticate, postCreateRateLimit, (req, res, next) => {
    posts.createPost(req, res, next);
  });

  // GET detail remains unbounded by Redis write limits
  router.get("/api/community/posts/:postId", authenticate, (req, res, next) => {
    posts.getPostById(req, res, next);
  });

  router.delete("/api/community/posts/:postId", authenticate, postDeleteRateLimit, (req, res, next) => {
    posts.deletePost(req, res, next);
  });

  // FEAT-043 Comments routes — Authenticated only
  // GET comments list remains unbounded by Redis write limits
  router.get("/api/community/posts/:postId/comments", authenticate, (req, res, next) => {
    comments.listComments(req, res, next);
  });

  router.post("/api/community/posts/:postId/comments", authenticate, commentCreateRateLimit, (req, res, next) => {
    comments.createComment(req, res, next);
  });

  router.delete("/api/community/comments/:commentId", authenticate, commentDeleteRateLimit, (req, res, next) => {
    comments.deleteComment(req, res, next);
  });

  // FEAT-044 Likes routes — Authenticated only
  // Combined like/unlike budget enforced via shared likeMutationRateLimit
  router.put("/api/community/posts/:postId/like", authenticate, likeMutationRateLimit, (req, res, next) => {
    likeController.likePost(req, res, next);
  });

  router.delete("/api/community/posts/:postId/like", authenticate, likeMutationRateLimit, (req, res, next) => {
    likeController.unlikePost(req, res, next);
  });

  return router;
}

export const communityRouter = createCommunityRouter();
