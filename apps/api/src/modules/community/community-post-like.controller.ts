import type { NextFunction, Response } from "express";
import { HTTP_STATUS } from "@aura/shared";
import type { AuthenticatedRequest } from "../auth/auth.types.js";
import type { ICommunityPostLikeService } from "./community-post-like.service.js";
import {
  CommunityPostParamSchema,
  EmptyCommunityMutationBodySchema,
} from "./community.validation.js";

export class CommunityPostLikeController {
  constructor(private readonly likeService: ICommunityPostLikeService) {}

  async likePost(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const params = CommunityPostParamSchema.parse(req.params);
      EmptyCommunityMutationBodySchema.parse(req.body ?? {});
      const state = await this.likeService.likePost(params.postId, req.user!.id);
      res.status(HTTP_STATUS.OK).json({ data: state });
    } catch (err) {
      next(err);
    }
  }

  async unlikePost(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const params = CommunityPostParamSchema.parse(req.params);
      EmptyCommunityMutationBodySchema.parse(req.body ?? {});
      const state = await this.likeService.unlikePost(params.postId, req.user!.id);
      res.status(HTTP_STATUS.OK).json({ data: state });
    } catch (err) {
      next(err);
    }
  }
}
