import { type PrismaClient, Prisma } from "@prisma/client";
import { describe, it, expect, vi } from "vitest";
import { createRepositoryContainer } from "../../src/infrastructure/database/repository-factory.js";
import {
  PrismaCommunityPostRepository,
  PrismaCommunityCommentRepository,
  PrismaCommunityPostLikeRepository,
} from "../../src/modules/community/community.repository.js";
import { AppError } from "../../src/shared/errors/error-envelope.js";
import { ERROR_CODES, HTTP_STATUS } from "@aura/shared";

describe("FEAT-041 Community Repositories & Factory Unit Tests", () => {
  describe("Repository Factory Container Integration (AC-018, AC-020)", () => {
    it("instantiates all Community repositories bound to root PrismaClient", () => {
      const mockPrisma = {} as unknown as PrismaClient;
      const container = createRepositoryContainer(mockPrisma);

      expect(container.communityPostRepo).toBeInstanceOf(PrismaCommunityPostRepository);
      expect(container.communityCommentRepo).toBeInstanceOf(PrismaCommunityCommentRepository);
      expect(container.communityPostLikeRepo).toBeInstanceOf(PrismaCommunityPostLikeRepository);
    });

    it("instantiates all Community repositories bound to a transaction client for Unit of Work (AC-019)", () => {
      const mockTx = {
        $transaction: vi.fn(),
      } as unknown as Prisma.TransactionClient;
      const container = createRepositoryContainer(mockTx);

      expect(container.communityPostRepo).toBeInstanceOf(PrismaCommunityPostRepository);
      expect(container.communityCommentRepo).toBeInstanceOf(PrismaCommunityCommentRepository);
      expect(container.communityPostLikeRepo).toBeInstanceOf(PrismaCommunityPostLikeRepository);
    });

    it("proves ordinary Community repositories expose zero physical post/comment delete capability (DEF-001, AC-018)", () => {
      const mockPrisma = {} as unknown as PrismaClient;
      const container = createRepositoryContainer(mockPrisma);

      // Ordinary post repo must NOT have physical delete methods
      expect("deletePost" in container.communityPostRepo).toBe(false);
      expect("delete" in container.communityPostRepo).toBe(false);
      expect(typeof (container.communityPostRepo as Record<string, unknown>).deletePost).toBe("undefined");
      expect(typeof (container.communityPostRepo as Record<string, unknown>).delete).toBe("undefined");

      // Ordinary comment repo must NOT have physical delete methods
      expect("deleteComment" in container.communityCommentRepo).toBe(false);
      expect("delete" in container.communityCommentRepo).toBe(false);
      expect(typeof (container.communityCommentRepo as Record<string, unknown>).deleteComment).toBe("undefined");
      expect(typeof (container.communityCommentRepo as Record<string, unknown>).delete).toBe("undefined");
    });
  });

  describe("Community Post Repository (AC-018, AC-019, AC-021)", () => {
    it("creates a post successfully and defaults status to VISIBLE and removedAt to null", async () => {
      const mockPost = {
        id: "post-uuid-1",
        authorId: "author-uuid-1",
        content: "Hello community!",
        status: "VISIBLE",
        createdAt: new Date(),
        updatedAt: new Date(),
        removedAt: null,
      };

      const mockClient = {
        communityPost: {
          create: vi.fn().mockResolvedValue(mockPost),
        },
      } as unknown as PrismaClient;

      const repo = new PrismaCommunityPostRepository(mockClient);
      const result = await repo.createPost({
        authorId: "author-uuid-1",
        content: "Hello community!",
      });

      expect(result).toEqual(mockPost);
      expect(mockClient.communityPost.create).toHaveBeenCalledWith({
        data: {
          authorId: "author-uuid-1",
          content: "Hello community!",
          status: "VISIBLE",
          removedAt: null,
        },
      });
    });

    it("maps database errors safely to AppError without exposing raw SQL or credentials (AC-019, AC-021)", async () => {
      const dbError = new Prisma.PrismaClientKnownRequestError("FK constraint failed", {
        code: "P2003",
        clientVersion: "6.4.1",
      });

      const mockClient = {
        communityPost: {
          create: vi.fn().mockRejectedValue(dbError),
        },
      } as unknown as PrismaClient;

      const repo = new PrismaCommunityPostRepository(mockClient);

      await expect(
        repo.createPost({
          authorId: "nonexistent-author",
          content: "test",
        }),
      ).rejects.toThrow(AppError);

      try {
        await repo.createPost({
          authorId: "nonexistent-author",
          content: "test",
        });
      } catch (err: unknown) {
        expect(err).toBeInstanceOf(AppError);
        const appErr = err as AppError;
        expect(appErr.statusCode).toBe(HTTP_STATUS.BAD_REQUEST);
        expect(appErr.code).toBe(ERROR_CODES.VALIDATION_ERROR);
        expect(appErr.message).not.toContain("SELECT");
        expect(appErr.message).not.toContain("INSERT");
        expect(appErr.message).not.toContain("password");
        expect(appErr.message).not.toContain("postgresql://");
      }
    });

    it("marks post as removed with atomic server timestamp (DEF-001, DEF-002, AC-018)", async () => {
      const now = new Date();
      const mockUpdated = {
        id: "post-uuid-1",
        authorId: "author-uuid-1",
        content: "Hello community!",
        status: "REMOVED",
        createdAt: new Date(),
        updatedAt: now,
        removedAt: now,
      };

      const mockClient = {
        communityPost: {
          update: vi.fn().mockResolvedValue(mockUpdated),
        },
      } as unknown as PrismaClient;

      const repo = new PrismaCommunityPostRepository(mockClient);
      const result = await repo.markPostRemoved("post-uuid-1");

      expect(result.status).toBe("REMOVED");
      expect(result.removedAt).toEqual(now);
      expect(mockClient.communityPost.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "post-uuid-1" },
          data: {
            status: "REMOVED",
            removedAt: expect.any(Date),
          },
        }),
      );
    });

    it("updates post status to HIDDEN or VISIBLE and ensures removedAt is null (DEF-002)", async () => {
      const mockUpdated = {
        id: "post-uuid-1",
        authorId: "author-uuid-1",
        content: "Hello community!",
        status: "HIDDEN",
        createdAt: new Date(),
        updatedAt: new Date(),
        removedAt: null,
      };

      const mockClient = {
        communityPost: {
          update: vi.fn().mockResolvedValue(mockUpdated),
        },
      } as unknown as PrismaClient;

      const repo = new PrismaCommunityPostRepository(mockClient);
      const result = await repo.updatePostStatus("post-uuid-1", "HIDDEN");

      expect(result.status).toBe("HIDDEN");
      expect(result.removedAt).toBeNull();
      expect(mockClient.communityPost.update).toHaveBeenCalledWith({
        where: { id: "post-uuid-1" },
        data: {
          status: "HIDDEN",
          removedAt: null,
        },
      });
    });
  });

  describe("Community Comment Repository (AC-018, AC-019)", () => {
    it("creates a flat comment successfully defaulting status to VISIBLE and removedAt to null", async () => {
      const mockComment = {
        id: "comment-uuid-1",
        postId: "post-uuid-1",
        authorId: "author-uuid-2",
        content: "Nice post!",
        status: "VISIBLE",
        createdAt: new Date(),
        updatedAt: new Date(),
        removedAt: null,
      };

      const mockClient = {
        communityComment: {
          create: vi.fn().mockResolvedValue(mockComment),
        },
      } as unknown as PrismaClient;

      const repo = new PrismaCommunityCommentRepository(mockClient);
      const result = await repo.createComment({
        postId: "post-uuid-1",
        authorId: "author-uuid-2",
        content: "Nice post!",
      });

      expect(result).toEqual(mockComment);
      expect(mockClient.communityComment.create).toHaveBeenCalledWith({
        data: {
          postId: "post-uuid-1",
          authorId: "author-uuid-2",
          content: "Nice post!",
          status: "VISIBLE",
          removedAt: null,
        },
      });
    });

    it("marks comment as removed with atomic server timestamp (DEF-001, DEF-002)", async () => {
      const now = new Date();
      const mockUpdated = {
        id: "comment-uuid-1",
        postId: "post-uuid-1",
        authorId: "author-uuid-2",
        content: "Nice post!",
        status: "REMOVED",
        createdAt: new Date(),
        updatedAt: now,
        removedAt: now,
      };

      const mockClient = {
        communityComment: {
          update: vi.fn().mockResolvedValue(mockUpdated),
        },
      } as unknown as PrismaClient;

      const repo = new PrismaCommunityCommentRepository(mockClient);
      const result = await repo.markCommentRemoved("comment-uuid-1");

      expect(result.status).toBe("REMOVED");
      expect(result.removedAt).toEqual(now);
      expect(mockClient.communityComment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "comment-uuid-1" },
          data: {
            status: "REMOVED",
            removedAt: expect.any(Date),
          },
        }),
      );
    });

    it("finds a comment by id and returns null when not found", async () => {
      const mockClient = {
        communityComment: {
          findUnique: vi.fn().mockResolvedValue(null),
        },
      } as unknown as PrismaClient;

      const repo = new PrismaCommunityCommentRepository(mockClient);
      const result = await repo.findCommentById("unknown-id");
      expect(result).toBeNull();
    });
  });

  describe("Community Post Like Repository (AC-014, AC-018, AC-019)", () => {
    it("creates a post like successfully", async () => {
      const mockLike = {
        id: "like-uuid-1",
        postId: "post-uuid-1",
        userId: "user-uuid-1",
        createdAt: new Date(),
      };

      const mockClient = {
        communityPostLike: {
          create: vi.fn().mockResolvedValue(mockLike),
        },
      } as unknown as PrismaClient;

      const repo = new PrismaCommunityPostLikeRepository(mockClient);
      const result = await repo.createLike({
        postId: "post-uuid-1",
        userId: "user-uuid-1",
      });

      expect(result).toEqual(mockLike);
    });

    it("maps duplicate like P2002 error to safe CONFLICT AppError (AC-014, AC-021)", async () => {
      const uniqueError = new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
        code: "P2002",
        clientVersion: "6.4.1",
        meta: { target: ["user_id", "post_id"] },
      });

      const mockClient = {
        communityPostLike: {
          create: vi.fn().mockRejectedValue(uniqueError),
        },
      } as unknown as PrismaClient;

      const repo = new PrismaCommunityPostLikeRepository(mockClient);

      await expect(
        repo.createLike({
          postId: "post-uuid-1",
          userId: "user-uuid-1",
        }),
      ).rejects.toThrow(AppError);

      try {
        await repo.createLike({
          postId: "post-uuid-1",
          userId: "user-uuid-1",
        });
      } catch (err: unknown) {
        expect(err).toBeInstanceOf(AppError);
        const appErr = err as AppError;
        expect(appErr.statusCode).toBe(HTTP_STATUS.CONFLICT);
        expect(appErr.code).toBe(ERROR_CODES.CONFLICT);
      }
    });

    it("deletes a like and returns boolean status", async () => {
      const mockClient = {
        communityPostLike: {
          deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
        },
      } as unknown as PrismaClient;

      const repo = new PrismaCommunityPostLikeRepository(mockClient);
      const deleted = await repo.deleteLike("post-uuid-1", "user-uuid-1");
      expect(deleted).toBe(true);
      expect(mockClient.communityPostLike.deleteMany).toHaveBeenCalledWith({
        where: {
          postId: "post-uuid-1",
          userId: "user-uuid-1",
        },
      });
    });

    it("counts likes for a post using relational count", async () => {
      const mockClient = {
        communityPostLike: {
          count: vi.fn().mockResolvedValue(42),
        },
      } as unknown as PrismaClient;

      const repo = new PrismaCommunityPostLikeRepository(mockClient);
      const count = await repo.countLikesByPost("post-uuid-1");
      expect(count).toBe(42);
      expect(mockClient.communityPostLike.count).toHaveBeenCalledWith({
        where: { postId: "post-uuid-1" },
      });
    });

    it("checks if user has liked a post", async () => {
      const mockClient = {
        communityPostLike: {
          count: vi.fn().mockResolvedValue(1),
        },
      } as unknown as PrismaClient;

      const repo = new PrismaCommunityPostLikeRepository(mockClient);
      const hasLiked = await repo.hasUserLikedPost("post-uuid-1", "user-uuid-1");
      expect(hasLiked).toBe(true);
    });
  });
});
