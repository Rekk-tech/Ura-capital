import type {
  PrismaClient,
  Prisma,
  CommunityPost,
  CommunityComment,
  CommunityPostLike,
} from "@prisma/client";

import type {
  CreateCommunityPostInput,
  ListCommunityPostsFilter,
  CreateCommunityCommentInput,
  ListCommunityCommentsFilter,
  CreateCommunityPostLikeInput,
  CommunityPostLikeStateDto,
  CommunityPostRecord,
  ListVisibleFeedParams,
  CommunityCommentRecord,
  ListVisibleCommentsParams,
} from "./community.types.js";

import { getPrismaClient } from "../../infrastructure/database/prisma.js";
import { mapDatabaseError } from "../../infrastructure/database/error-mapper.js";

type DbClient = PrismaClient | Prisma.TransactionClient;

// ============================================================================
// 1. Community Post Repository
// ============================================================================

export interface ICommunityPostRepository {
  createPost(data: CreateCommunityPostInput): Promise<CommunityPost>;
  findPostById(id: string): Promise<CommunityPost | null>;
  findVisiblePostDetail(id: string, currentUserId?: string): Promise<CommunityPostRecord | null>;
  listPosts(filter?: ListCommunityPostsFilter): Promise<CommunityPost[]>;
  listPostsByAuthor(authorId: string, limit?: number): Promise<CommunityPost[]>;
  listVisibleFeed(params: ListVisibleFeedParams): Promise<CommunityPostRecord[]>;
  markPostRemoved(id: string): Promise<CommunityPost>;
  removePostIfOwner(id: string, authorId: string): Promise<CommunityPost | null>;
  updatePostStatus(id: string, status: "VISIBLE" | "HIDDEN"): Promise<CommunityPost>;
}

export class PrismaCommunityPostRepository implements ICommunityPostRepository {
  private client: DbClient;

  constructor(client?: DbClient) {
    this.client = client || getPrismaClient();
  }

  async createPost(data: CreateCommunityPostInput): Promise<CommunityPost> {
    try {
      return await this.client.communityPost.create({
        data: {
          authorId: data.authorId,
          content: data.content,
          status: "VISIBLE",
          removedAt: null,
        },
      });
    } catch (err) {
      throw mapDatabaseError(err, "Failed to create community post");
    }
  }

  async findPostById(id: string): Promise<CommunityPost | null> {
    try {
      return await this.client.communityPost.findUnique({
        where: { id },
      });
    } catch (err) {
      throw mapDatabaseError(err, "Failed to find community post");
    }
  }

  async findVisiblePostDetail(id: string, currentUserId?: string): Promise<CommunityPostRecord | null> {
    try {
      const post = await this.client.communityPost.findFirst({
        where: {
          id,
          status: "VISIBLE",
        },
        select: {
          id: true,
          authorId: true,
          content: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          removedAt: true,
          author: {
            select: {
              displayName: true,
            },
          },
          _count: {
            select: {
              comments: {
                where: { status: "VISIBLE" },
              },
              likes: true,
            },
          },
          likes: currentUserId
            ? {
                where: { userId: currentUserId },
                select: { id: true },
                take: 1,
              }
            : false,
        },
      });

      return post as CommunityPostRecord | null;
    } catch (err) {
      throw mapDatabaseError(err, "Failed to find visible community post detail");
    }
  }

  async listPosts(filter?: ListCommunityPostsFilter): Promise<CommunityPost[]> {
    try {
      return await this.client.communityPost.findMany({
        where: {
          status: filter?.status,
          authorId: filter?.authorId,
        },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: filter?.limit,
      });
    } catch (err) {
      throw mapDatabaseError(err, "Failed to list community posts");
    }
  }

  async listPostsByAuthor(authorId: string, limit?: number): Promise<CommunityPost[]> {
    try {
      return await this.client.communityPost.findMany({
        where: { authorId },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: limit,
      });
    } catch (err) {
      throw mapDatabaseError(err, "Failed to list community posts by author");
    }
  }

  async listVisibleFeed(params: ListVisibleFeedParams): Promise<CommunityPostRecord[]> {
    try {
      const where: Prisma.CommunityPostWhereInput = {
        status: "VISIBLE",
      };

      if (params.cursor) {
        where.OR = [
          {
            createdAt: {
              lt: params.cursor.createdAt,
            },
          },
          {
            createdAt: params.cursor.createdAt,
            id: {
              lt: params.cursor.id,
            },
          },
        ];
      }

      const posts = await this.client.communityPost.findMany({
        where,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: params.limit,
        select: {
          id: true,
          authorId: true,
          content: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          removedAt: true,
          author: {
            select: {
              displayName: true,
            },
          },
          _count: {
            select: {
              comments: {
                where: { status: "VISIBLE" },
              },
              likes: true,
            },
          },
          likes: params.currentUserId
            ? {
                where: { userId: params.currentUserId },
                select: { id: true },
                take: 1,
              }
            : false,
        },
      });

      return posts as CommunityPostRecord[];
    } catch (err) {
      throw mapDatabaseError(err, "Failed to list visible community posts feed");
    }
  }

  async markPostRemoved(id: string): Promise<CommunityPost> {
    try {
      return await this.client.communityPost.update({
        where: { id },
        data: {
          status: "REMOVED",
          removedAt: new Date(),
        },
      });
    } catch (err) {
      throw mapDatabaseError(err, "Failed to mark community post as removed");
    }
  }

  async removePostIfOwner(id: string, authorId: string): Promise<CommunityPost | null> {
    try {
      const post = await this.client.communityPost.findFirst({
        where: {
          id,
          authorId,
          status: "VISIBLE",
        },
      });

      if (!post) {
        return null;
      }

      return await this.client.communityPost.update({
        where: { id },
        data: {
          status: "REMOVED",
          removedAt: new Date(),
        },
      });
    } catch (err) {
      throw mapDatabaseError(err, "Failed to remove community post");
    }
  }

  async updatePostStatus(id: string, status: "VISIBLE" | "HIDDEN"): Promise<CommunityPost> {
    try {
      return await this.client.communityPost.update({
        where: { id },
        data: {
          status,
          removedAt: null,
        },
      });
    } catch (err) {
      throw mapDatabaseError(err, "Failed to update community post status");
    }
  }
}

// ============================================================================
// 2. Community Comment Repository
// ============================================================================

export interface ICommunityCommentRepository {
  createComment(data: CreateCommunityCommentInput): Promise<CommunityComment>;
  findCommentById(id: string): Promise<CommunityComment | null>;
  listCommentsByPost(postId: string, filter?: ListCommunityCommentsFilter): Promise<CommunityComment[]>;
  listCommentsByAuthor(authorId: string, limit?: number): Promise<CommunityComment[]>;
  listVisibleCommentsByPost(params: ListVisibleCommentsParams): Promise<CommunityCommentRecord[]>;
  markCommentRemoved(id: string): Promise<CommunityComment>;
  removeCommentIfOwner(commentId: string, authorId: string): Promise<CommunityComment | null>;
  updateCommentStatus(id: string, status: "VISIBLE" | "HIDDEN"): Promise<CommunityComment>;
}

export class PrismaCommunityCommentRepository implements ICommunityCommentRepository {
  private client: DbClient;

  constructor(client?: DbClient) {
    this.client = client || getPrismaClient();
  }

  async createComment(data: CreateCommunityCommentInput): Promise<CommunityComment> {
    try {
      return await this.client.communityComment.create({
        data: {
          postId: data.postId,
          authorId: data.authorId,
          content: data.content,
          status: "VISIBLE",
          removedAt: null,
        },
      });
    } catch (err) {
      throw mapDatabaseError(err, "Failed to create community comment");
    }
  }

  async findCommentById(id: string): Promise<CommunityComment | null> {
    try {
      return await this.client.communityComment.findUnique({
        where: { id },
      });
    } catch (err) {
      throw mapDatabaseError(err, "Failed to find community comment");
    }
  }

  async listCommentsByPost(postId: string, filter?: ListCommunityCommentsFilter): Promise<CommunityComment[]> {
    try {
      return await this.client.communityComment.findMany({
        where: {
          postId,
          status: filter?.status,
        },
        orderBy: [{ createdAt: "asc" }, { id: "asc" }],
        take: filter?.limit,
      });
    } catch (err) {
      throw mapDatabaseError(err, "Failed to list community comments by post");
    }
  }

  async listCommentsByAuthor(authorId: string, limit?: number): Promise<CommunityComment[]> {
    try {
      return await this.client.communityComment.findMany({
        where: { authorId },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: limit,
      });
    } catch (err) {
      throw mapDatabaseError(err, "Failed to list community comments by author");
    }
  }

  async listVisibleCommentsByPost(params: ListVisibleCommentsParams): Promise<CommunityCommentRecord[]> {
    try {
      const where: Prisma.CommunityCommentWhereInput = {
        postId: params.postId,
        status: "VISIBLE",
      };

      if (params.cursor) {
        where.OR = [
          {
            createdAt: {
              gt: params.cursor.createdAt,
            },
          },
          {
            createdAt: params.cursor.createdAt,
            id: {
              gt: params.cursor.id,
            },
          },
        ];
      }

      const comments = await this.client.communityComment.findMany({
        where,
        orderBy: [{ createdAt: "asc" }, { id: "asc" }],
        take: params.limit,
        select: {
          id: true,
          postId: true,
          authorId: true,
          content: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          removedAt: true,
          author: {
            select: {
              displayName: true,
            },
          },
        },
      });

      return comments as CommunityCommentRecord[];
    } catch (err) {
      throw mapDatabaseError(err, "Failed to list visible community comments");
    }
  }

  async markCommentRemoved(id: string): Promise<CommunityComment> {
    try {
      return await this.client.communityComment.update({
        where: { id },
        data: {
          status: "REMOVED",
          removedAt: new Date(),
        },
      });
    } catch (err) {
      throw mapDatabaseError(err, "Failed to mark community comment as removed");
    }
  }

  async removeCommentIfOwner(commentId: string, authorId: string): Promise<CommunityComment | null> {
    try {
      const comment = await this.client.communityComment.findFirst({
        where: {
          id: commentId,
          authorId,
          status: "VISIBLE",
        },
      });

      if (!comment) {
        return null;
      }

      return await this.client.communityComment.update({
        where: { id: commentId },
        data: {
          status: "REMOVED",
          removedAt: new Date(),
        },
      });
    } catch (err) {
      throw mapDatabaseError(err, "Failed to remove community comment");
    }
  }

  async updateCommentStatus(id: string, status: "VISIBLE" | "HIDDEN"): Promise<CommunityComment> {
    try {
      return await this.client.communityComment.update({
        where: { id },
        data: {
          status,
          removedAt: null,
        },
      });
    } catch (err) {
      throw mapDatabaseError(err, "Failed to update community comment status");
    }
  }
}

// ============================================================================
// 3. Community Post Like Repository
// ============================================================================

export interface ICommunityPostLikeRepository {
  createLike(data: CreateCommunityPostLikeInput): Promise<CommunityPostLike>;
  ensureLike(postId: string, userId: string): Promise<void>;
  deleteLike(postId: string, userId: string): Promise<boolean>;
  findLike(postId: string, userId: string): Promise<CommunityPostLike | null>;
  countLikesByPost(postId: string): Promise<number>;
  hasUserLikedPost(postId: string, userId: string): Promise<boolean>;
  getLikeState(postId: string, userId: string): Promise<CommunityPostLikeStateDto>;
  listLikesByPost(postId: string, limit?: number): Promise<CommunityPostLike[]>;
}

export class PrismaCommunityPostLikeRepository implements ICommunityPostLikeRepository {
  private client: DbClient;

  constructor(client?: DbClient) {
    this.client = client || getPrismaClient();
  }

  async createLike(data: CreateCommunityPostLikeInput): Promise<CommunityPostLike> {
    try {
      return await this.client.communityPostLike.create({
        data: {
          postId: data.postId,
          userId: data.userId,
        },
      });
    } catch (err) {
      throw mapDatabaseError(err, "Failed to create community post like");
    }
  }

  async ensureLike(postId: string, userId: string): Promise<void> {
    try {
      await this.client.communityPostLike.upsert({
        where: {
          userId_postId: {
            userId,
            postId,
          },
        },
        create: {
          userId,
          postId,
        },
        update: {},
      });
    } catch (err) {
      throw mapDatabaseError(err, "Failed to ensure community post like");
    }
  }

  async deleteLike(postId: string, userId: string): Promise<boolean> {
    try {
      const result = await this.client.communityPostLike.deleteMany({
        where: {
          postId,
          userId,
        },
      });
      return result.count > 0;
    } catch (err) {
      throw mapDatabaseError(err, "Failed to delete community post like");
    }
  }

  async findLike(postId: string, userId: string): Promise<CommunityPostLike | null> {
    try {
      return await this.client.communityPostLike.findUnique({
        where: {
          userId_postId: {
            userId,
            postId,
          },
        },
      });
    } catch (err) {
      throw mapDatabaseError(err, "Failed to find community post like");
    }
  }

  async countLikesByPost(postId: string): Promise<number> {
    try {
      return await this.client.communityPostLike.count({
        where: { postId },
      });
    } catch (err) {
      throw mapDatabaseError(err, "Failed to count community post likes");
    }
  }

  async hasUserLikedPost(postId: string, userId: string): Promise<boolean> {
    try {
      const count = await this.client.communityPostLike.count({
        where: {
          postId,
          userId,
        },
      });
      return count > 0;
    } catch (err) {
      throw mapDatabaseError(err, "Failed to check if user liked community post");
    }
  }

  async getLikeState(postId: string, userId: string): Promise<CommunityPostLikeStateDto> {
    try {
      const [likeCount, currentUserLike] = await Promise.all([
        this.client.communityPostLike.count({
          where: { postId },
        }),
        this.client.communityPostLike.findUnique({
          where: {
            userId_postId: {
              userId,
              postId,
            },
          },
          select: { id: true },
        }),
      ]);

      return {
        postId,
        likedByCurrentUser: currentUserLike !== null,
        likeCount,
      };
    } catch (err) {
      throw mapDatabaseError(err, "Failed to read community post like state");
    }
  }

  async listLikesByPost(postId: string, limit?: number): Promise<CommunityPostLike[]> {
    try {
      return await this.client.communityPostLike.findMany({
        where: { postId },
        orderBy: [{ createdAt: "desc" }],
        take: limit,
      });
    } catch (err) {
      throw mapDatabaseError(err, "Failed to list community post likes");
    }
  }
}
