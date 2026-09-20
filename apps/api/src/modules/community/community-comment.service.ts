import type {
  ICommunityCommentRepository,
  ICommunityPostRepository,
} from "./community.repository.js";
import type { ITransactionRunner } from "../../infrastructure/database/transaction-runner.js";
import type {
  CommunityCommentDto,
  CommunityCommentFeedResponse,
  CommunityCommentRecord,
} from "./community.types.js";
import { decodeCommentCursor, encodeCommentCursor } from "./community-comment-cursor.js";
import { toCommunityCommentDto } from "./community-comment.dto.js";
import { AppError } from "../../shared/errors/error-envelope.js";
import { ERROR_CODES, HTTP_STATUS } from "@aura/shared";

export interface ICommunityCommentService {
  listComments(params: {
    postId: string;
    limit: number;
    cursor?: string;
    currentUserId: string;
  }): Promise<CommunityCommentFeedResponse>;

  createComment(params: {
    postId: string;
    authorId: string;
    content: string;
    authorDisplayName?: string | null;
  }): Promise<CommunityCommentDto>;

  removeComment(commentId: string, userId: string): Promise<void>;
}

export class CommunityCommentService implements ICommunityCommentService {
  constructor(
    private readonly commentRepo: ICommunityCommentRepository,
    private readonly postRepo: ICommunityPostRepository,
    private readonly txRunner: ITransactionRunner,
  ) {}

  async listComments(params: {
    postId: string;
    limit: number;
    cursor?: string;
    currentUserId: string;
  }): Promise<CommunityCommentFeedResponse> {
    // 1. Decode and validate cursor if provided
    let decodedCursor: { createdAt: Date; id: string } | undefined;
    if (params.cursor) {
      decodedCursor = decodeCommentCursor(params.cursor);
    }

    // 2. Parent post visibility gate: parent must exist and have status = 'VISIBLE'
    const post = await this.postRepo.findVisiblePostDetail(
      params.postId,
      params.currentUserId,
    );

    if (!post) {
      throw new AppError(
        "Post not found",
        ERROR_CODES.NOT_FOUND,
        HTTP_STATUS.NOT_FOUND,
      );
    }

    // 3. Fetch limit + 1 items to determine if hasNextPage
    const fetchLimit = params.limit + 1;
    const records = await this.commentRepo.listVisibleCommentsByPost({
      postId: params.postId,
      limit: fetchLimit,
      cursor: decodedCursor,
    });

    const hasNextPage = records.length > params.limit;
    const pageItems = hasNextPage ? records.slice(0, params.limit) : records;

    const nextCursor =
      hasNextPage && pageItems.length > 0
        ? encodeCommentCursor(pageItems[pageItems.length - 1]!)
        : null;

    const data = pageItems.map((item) =>
      toCommunityCommentDto(item, params.currentUserId),
    );

    return {
      data,
      pageInfo: {
        nextCursor,
        hasNextPage,
      },
    };
  }

  async createComment(params: {
    postId: string;
    authorId: string;
    content: string;
    authorDisplayName?: string | null;
  }): Promise<CommunityCommentDto> {
    const comment = await this.txRunner.run(async (ctx) => {
      // 1. Parent post visibility gate inside transaction
      const post = await ctx.repositories.communityPostRepo.findVisiblePostDetail(
        params.postId,
        params.authorId,
      );

      if (!post) {
        throw new AppError(
          "Post not found",
          ERROR_CODES.NOT_FOUND,
          HTTP_STATUS.NOT_FOUND,
        );
      }

      // 2. Persist comment with VISIBLE status
      return await ctx.repositories.communityCommentRepo.createComment({
        postId: params.postId,
        authorId: params.authorId,
        content: params.content,
      });
    });

    const commentRecord: CommunityCommentRecord = {
      id: comment.id,
      postId: comment.postId,
      authorId: comment.authorId,
      content: comment.content,
      status: comment.status as "VISIBLE",
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      removedAt: comment.removedAt,
      author: {
        displayName: params.authorDisplayName ?? null,
      },
    };

    return toCommunityCommentDto(commentRecord, params.authorId);
  }

  async removeComment(commentId: string, userId: string): Promise<void> {
    await this.txRunner.run(async (ctx) => {
      const removed = await ctx.repositories.communityCommentRepo.removeCommentIfOwner(
        commentId,
        userId,
      );

      if (!removed) {
        throw new AppError(
          "Comment not found",
          ERROR_CODES.NOT_FOUND,
          HTTP_STATUS.NOT_FOUND,
        );
      }
    });
  }
}
