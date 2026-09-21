import type { Response, NextFunction } from "express";
import type { AuthenticatedRequest } from "../auth/auth.types.js";
import type { ICommunityCommentService } from "./community-comment.service.js";
import {
  CreateCommunityCommentBodySchema,
  GetCommunityCommentsQuerySchema,
  CommunityCommentPostParamSchema,
  CommunityCommentParamSchema,
} from "./community-comment.validation.js";
import { HTTP_STATUS } from "@aura/shared";

export class CommunityCommentController {
  constructor(private readonly commentService: ICommunityCommentService) {}

  async listComments(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const params = CommunityCommentPostParamSchema.parse(req.params);
      const query = GetCommunityCommentsQuerySchema.parse(req.query);
      const user = req.user!;

      const result = await this.commentService.listComments({
        postId: params.postId,
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

  async createComment(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const params = CommunityCommentPostParamSchema.parse(req.params);
      const body = CreateCommunityCommentBodySchema.parse(req.body);
      const user = req.user!;

      const comment = await this.commentService.createComment({
        postId: params.postId,
        authorId: user.id,
        content: body.content,
        authorDisplayName: user.displayName,
      });

      res.status(HTTP_STATUS.CREATED).json({
        data: comment,
      });
    } catch (err) {
      next(err);
    }
  }

  async deleteComment(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const params = CommunityCommentParamSchema.parse(req.params);
      const user = req.user!;

      await this.commentService.removeComment(params.commentId, user.id);

      res.status(HTTP_STATUS.NO_CONTENT).send();
    } catch (err) {
      next(err);
    }
  }
}
