import type { Response, NextFunction } from "express";
import type { AuthenticatedRequest } from "../auth/auth.types.js";
import type { ICommunityPostService } from "./community-post.service.js";
import {
  CreateCommunityPostBodySchema,
  GetCommunityPostsQuerySchema,
  CommunityPostParamSchema,
} from "./community.validation.js";
import { HTTP_STATUS } from "@aura/shared";

export class CommunityPostController {
  constructor(private readonly postService: ICommunityPostService) {}

  async createPost(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const body = CreateCommunityPostBodySchema.parse(req.body);
      const user = req.user!;

      const post = await this.postService.createPost(
        user.id,
        body.content,
        user.displayName,
      );

      res.status(HTTP_STATUS.CREATED).json({
        data: post,
      });
    } catch (err) {
      next(err);
    }
  }

  async listFeed(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const query = GetCommunityPostsQuerySchema.parse(req.query);
      const user = req.user!;

      const result = await this.postService.getFeed({
        limit: query.limit,
        cursor: query.cursor,
        currentUserId: user.id,
      });

      res.status(HTTP_STATUS.OK).json({
        data: result.data,
        pageInfo: result.pageInfo,
      });
    } catch (err) {
      next(err);
    }
  }

  async getPostById(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const params = CommunityPostParamSchema.parse(req.params);
      const user = req.user!;

      const post = await this.postService.getPostDetail(params.postId, user.id);

      res.status(HTTP_STATUS.OK).json({
        data: post,
      });
    } catch (err) {
      next(err);
    }
  }

  async deletePost(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const params = CommunityPostParamSchema.parse(req.params);
      const user = req.user!;

      await this.postService.removePost(params.postId, user.id);

      res.status(HTTP_STATUS.NO_CONTENT).send();
    } catch (err) {
      next(err);
    }
  }
}
