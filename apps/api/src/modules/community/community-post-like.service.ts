import { ERROR_CODES, HTTP_STATUS } from "@aura/shared";
import type { ITransactionRunner } from "../../infrastructure/database/transaction-runner.js";
import { AppError } from "../../shared/errors/error-envelope.js";
import type { CommunityPostLikeStateDto } from "./community.types.js";

export interface ICommunityPostLikeService {
  likePost(postId: string, userId: string): Promise<CommunityPostLikeStateDto>;
  unlikePost(postId: string, userId: string): Promise<CommunityPostLikeStateDto>;
}

export class CommunityPostLikeService implements ICommunityPostLikeService {
  constructor(private readonly txRunner: ITransactionRunner) {}

  async likePost(postId: string, userId: string): Promise<CommunityPostLikeStateDto> {
    try {
      return await this.txRunner.run(async (ctx) => {
        await this.assertVisiblePost(ctx.repositories.communityPostRepo, postId, userId);
        await ctx.repositories.communityPostLikeRepo.ensureLike(postId, userId);
        return ctx.repositories.communityPostLikeRepo.getLikeState(postId, userId);
      });
    } catch (err) {
      if (err instanceof AppError && err.statusCode === HTTP_STATUS.CONFLICT) {
        // Unique race: concurrent request already inserted the like relation
        // Safely map the unique race and query canonical count afterward (FEAT-044 AC-022, Section 14)
        return this.txRunner.run(async (ctx) => {
          return ctx.repositories.communityPostLikeRepo.getLikeState(postId, userId);
        });
      }
      throw err;
    }
  }

  async unlikePost(postId: string, userId: string): Promise<CommunityPostLikeStateDto> {
    return this.txRunner.run(async (ctx) => {
      await this.assertVisiblePost(ctx.repositories.communityPostRepo, postId, userId);
      await ctx.repositories.communityPostLikeRepo.deleteLike(postId, userId);
      return ctx.repositories.communityPostLikeRepo.getLikeState(postId, userId);
    });
  }

  private async assertVisiblePost(
    postRepo: {
      findVisiblePostDetail(id: string, currentUserId?: string): Promise<unknown | null>;
    },
    postId: string,
    userId: string,
  ): Promise<void> {
    const post = await postRepo.findVisiblePostDetail(postId, userId);
    if (!post) {
      throw new AppError("Post not found", ERROR_CODES.NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }
  }
}
