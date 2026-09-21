import { Router } from "express";
import { authenticate } from "../auth/auth.middleware.js";
import { createRepositoryContainer } from "../../infrastructure/database/repository-factory.js";
import { transactionRunner } from "../../infrastructure/database/transaction-runner.js";
import { CommunityPostService } from "./community-post.service.js";
import { CommunityPostController } from "./community-post.controller.js";
import { CommunityCommentService } from "./community-comment.service.js";
import { CommunityCommentController } from "./community-comment.controller.js";

export function createCommunityRouter(
  postController?: CommunityPostController,
  commentController?: CommunityCommentController,
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

  // FEAT-042 Posts routes — Authenticated only
  router.get("/api/community/posts", authenticate, (req, res, next) => {
    posts.listFeed(req, res, next);
  });

  router.post("/api/community/posts", authenticate, (req, res, next) => {
    posts.createPost(req, res, next);
  });

  router.get("/api/community/posts/:postId", authenticate, (req, res, next) => {
    posts.getPostById(req, res, next);
  });

  router.delete("/api/community/posts/:postId", authenticate, (req, res, next) => {
    posts.deletePost(req, res, next);
  });

  // FEAT-043 Comments routes — Authenticated only
  router.get("/api/community/posts/:postId/comments", authenticate, (req, res, next) => {
    comments.listComments(req, res, next);
  });

  router.post("/api/community/posts/:postId/comments", authenticate, (req, res, next) => {
    comments.createComment(req, res, next);
  });

  router.delete("/api/community/comments/:commentId", authenticate, (req, res, next) => {
    comments.deleteComment(req, res, next);
  });

  return router;
}

export const communityRouter = createCommunityRouter();
