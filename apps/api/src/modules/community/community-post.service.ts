import type { ICommunityPostRepository } from "./community.repository.js";
import type { ITransactionRunner } from "../../infrastructure/database/transaction-runner.js";
import type {
  CommunityPostDto,
  CommunityPostFeedResponse,
  CommunityPostRecord,
} from "./community.types.js";
import { decodeCursor, encodeCursor } from "./community-cursor.js";
import { toCommunityPostDto } from "./community.dto.js";
import { AppError } from "../../shared/errors/error-envelope.js";
import { ERROR_CODES, HTTP_STATUS } from "@aura/shared";

export interface ICommunityPostService {
  createPost(
    authorId: string,
    content: string,
    authorDisplayName?: string | null,
  ): Promise<CommunityPostDto>;
  getFeed(params: {
    limit: number;
    cursor?: string;
    currentUserId: string;
  }): Promise<CommunityPostFeedResponse>;
  getPostDetail(postId: string, currentUserId: string): Promise<CommunityPostDto>;
  removePost(postId: string, userId: string): Promise<void>;
}

export class CommunityPostService implements ICommunityPostService {
  constructor(
    private readonly postRepo: ICommunityPostRepository,
    private readonly txRunner: ITransactionRunner,
  ) {}

  async createPost(
    authorId: string,
    content: string,
    authorDisplayName?: string | null,
  ): Promise<CommunityPostDto> {
    const post = await this.postRepo.createPost({
      authorId,
      content,
    });

    const postRecord: CommunityPostRecord = {
      id: post.id,
      authorId: post.authorId,
      content: post.content,
      status: post.status,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      removedAt: post.removedAt,
      author: {
        displayName: authorDisplayName ?? null,
      },
      _count: {
        comments: 0,
        likes: 0,
      },
      likes: [],
    };

    return toCommunityPostDto(postRecord, authorId);
  }

  async getFeed(params: {
    limit: number;
    cursor?: string;
    currentUserId: string;
  }): Promise<CommunityPostFeedResponse> {
    let decodedCursor: { createdAt: Date; id: string } | undefined;

    if (params.cursor) {
      decodedCursor = decodeCursor(params.cursor);
    }

    const fetchLimit = params.limit + 1;
    const records = await this.postRepo.listVisibleFeed({
      limit: fetchLimit,
      cursor: decodedCursor,
      currentUserId: params.currentUserId,
    });

    const hasNextPage = records.length > params.limit;
    const pageItems = hasNextPage ? records.slice(0, params.limit) : records;

    const nextCursor =
      hasNextPage && pageItems.length > 0
        ? encodeCursor(pageItems[pageItems.length - 1]!)
        : null;

    const data = pageItems.map((item) =>
      toCommunityPostDto(item, params.currentUserId),
    );

    return {
      data,
      pageInfo: {
        nextCursor,
        hasNextPage,
      },
    };
  }

  async getPostDetail(postId: string, currentUserId: string): Promise<CommunityPostDto> {
    const post = await this.postRepo.findVisiblePostDetail(postId, currentUserId);

    if (!post) {
      throw new AppError("Post not found", ERROR_CODES.NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }

    return toCommunityPostDto(post, currentUserId);
  }

  async removePost(postId: string, userId: string): Promise<void> {
    await this.txRunner.run(async (ctx) => {
      const removed = await ctx.repositories.communityPostRepo.removePostIfOwner(
        postId,
        userId,
      );

      if (!removed) {
        throw new AppError("Post not found", ERROR_CODES.NOT_FOUND, HTTP_STATUS.NOT_FOUND);
      }
    });
  }
}
