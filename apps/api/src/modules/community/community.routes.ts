import { Router } from "express";
import { authenticate } from "../auth/auth.middleware.js";
import { createRepositoryContainer } from "../../infrastructure/database/repository-factory.js";
import { transactionRunner } from "../../infrastructure/database/transaction-runner.js";
import { CommunityPostService } from "./community-post.service.js";
import { CommunityPostController } from "./community-post.controller.js";

export function createCommunityRouter(
  postController?: CommunityPostController,
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

  // Exact 4 canonical FEAT-042 routes — Authenticated only
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

  return router;
}

export const communityRouter = createCommunityRouter();
