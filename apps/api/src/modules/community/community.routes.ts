import { Router } from "express";
import { authenticate } from "../auth/auth.middleware.js";
import { createRepositoryContainer } from "../../infrastructure/database/repository-factory.js";
import { transactionRunner } from "../../infrastructure/database/transaction-runner.js";
import { CommunityPostService } from "./community-post.service.js";
import { CommunityPostController } from "./community-post.controller.js";
import { CommunityPostLikeController } from "./community-post-like.controller.js";
import { CommunityPostLikeService } from "./community-post-like.service.js";

export function createCommunityRouter(
  postController?: CommunityPostController,
  postLikeController?: CommunityPostLikeController,
): Router {
  const router = Router();
  const repoContainer = createRepositoryContainer();

  const controller =
    postController ??
    new CommunityPostController(
      new CommunityPostService(
        repoContainer.communityPostRepo,
        transactionRunner,
      ),
    );
  const likeController =
    postLikeController ??
    new CommunityPostLikeController(
      new CommunityPostLikeService(transactionRunner),
    );

  // Canonical FEAT-042 post routes and FEAT-044 like routes are authenticated only.
  router.get("/api/community/posts", authenticate, (req, res, next) => {
    controller.listFeed(req, res, next);
  });

  router.post("/api/community/posts", authenticate, (req, res, next) => {
    controller.createPost(req, res, next);
  });

  router.get("/api/community/posts/:postId", authenticate, (req, res, next) => {
    controller.getPostById(req, res, next);
  });

  router.delete("/api/community/posts/:postId", authenticate, (req, res, next) => {
    controller.deletePost(req, res, next);
  });

  router.put("/api/community/posts/:postId/like", authenticate, (req, res, next) => {
    likeController.likePost(req, res, next);
  });

  router.delete("/api/community/posts/:postId/like", authenticate, (req, res, next) => {
    likeController.unlikePost(req, res, next);
  });

  return router;
}

export const communityRouter = createCommunityRouter();
