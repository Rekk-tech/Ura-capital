import { describe, expect, it, vi } from "vitest";
import { ERROR_CODES, HTTP_STATUS } from "@aura/shared";
import type { ITransactionRunner } from "../../src/infrastructure/database/transaction-runner.js";
import type { TransactionContext } from "../../src/infrastructure/database/transaction-context.js";
import { AppError } from "../../src/shared/errors/error-envelope.js";
import { CommunityPostLikeService } from "../../src/modules/community/community-post-like.service.js";
import { EmptyCommunityMutationBodySchema } from "../../src/modules/community/community.validation.js";

function createHarness(options?: { visiblePost?: boolean; likeCount?: number }) {
  const visiblePost = options?.visiblePost ?? true;
  const likeCount = options?.likeCount ?? 1;
  const postRepo = {
    findVisiblePostDetail: vi.fn().mockResolvedValue(
      visiblePost
        ? {
            id: "11111111-2222-4333-8444-555555555555",
            status: "VISIBLE",
          }
        : null,
    ),
  };
  const likeRepo = {
    ensureLike: vi.fn().mockResolvedValue(undefined),
    deleteLike: vi.fn().mockResolvedValue(true),
    getLikeState: vi.fn().mockResolvedValue({
      postId: "11111111-2222-4333-8444-555555555555",
      likedByCurrentUser: true,
      likeCount,
    }),
  };
  const context = {
    repositories: {
      communityPostRepo: postRepo,
      communityPostLikeRepo: likeRepo,
    },
  } as unknown as TransactionContext;
  const txRunner: ITransactionRunner = {
    run: vi.fn(async (operation) => operation(context)),
    getActiveContext: vi.fn(),
    isInTransaction: vi.fn().mockReturnValue(false),
  };

  return {
    service: new CommunityPostLikeService(txRunner),
    postRepo,
    likeRepo,
    txRunner,
  };
}

describe("FEAT-044 Community post-like service and validation", () => {
  const postId = "11111111-2222-4333-8444-555555555555";
  const userId = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";

  it("accepts only an empty object body", () => {
    expect(EmptyCommunityMutationBodySchema.parse({})).toEqual({});
    expect(() => EmptyCommunityMutationBodySchema.parse({ userId })).toThrow();
    expect(() => EmptyCommunityMutationBodySchema.parse({ likeCount: 99 })).toThrow();
    expect(() => EmptyCommunityMutationBodySchema.parse({ status: "VISIBLE" })).toThrow();
  });

  it("likes a visible post and returns the canonical repository state", async () => {
    const { service, likeRepo, txRunner } = createHarness({ likeCount: 4 });

    await expect(service.likePost(postId, userId)).resolves.toEqual({
      postId,
      likedByCurrentUser: true,
      likeCount: 4,
    });
    expect(likeRepo.ensureLike).toHaveBeenCalledWith(postId, userId);
    expect(likeRepo.getLikeState).toHaveBeenCalledWith(postId, userId);
    expect(txRunner.run).toHaveBeenCalledTimes(1);
  });

  it("unlikes only the caller/post relation and returns canonical unliked state", async () => {
    const { service, likeRepo } = createHarness({ likeCount: 2 });
    likeRepo.getLikeState.mockResolvedValue({
      postId,
      likedByCurrentUser: false,
      likeCount: 2,
    });

    await expect(service.unlikePost(postId, userId)).resolves.toEqual({
      postId,
      likedByCurrentUser: false,
      likeCount: 2,
    });
    expect(likeRepo.deleteLike).toHaveBeenCalledWith(postId, userId);
  });

  it("returns the same safe 404 for missing, hidden, or removed posts", async () => {
    const { service, likeRepo } = createHarness({ visiblePost: false });

    for (const operation of [service.likePost(postId, userId), service.unlikePost(postId, userId)]) {
      await expect(operation).rejects.toMatchObject({
        code: ERROR_CODES.NOT_FOUND,
        statusCode: HTTP_STATUS.NOT_FOUND,
        message: "Post not found",
      });
    }
    expect(likeRepo.ensureLike).not.toHaveBeenCalled();
    expect(likeRepo.deleteLike).not.toHaveBeenCalled();
  });

  it("propagates sanitized AppError failures without returning permissive state", async () => {
    const { service, likeRepo } = createHarness();
    likeRepo.ensureLike.mockRejectedValue(
      new AppError("Database operation failed", ERROR_CODES.INTERNAL_ERROR, HTTP_STATUS.INTERNAL_SERVER_ERROR),
    );

    await expect(service.likePost(postId, userId)).rejects.toMatchObject({
      message: "Database operation failed",
      code: ERROR_CODES.INTERNAL_ERROR,
    });
    expect(likeRepo.getLikeState).not.toHaveBeenCalled();
  });
});
