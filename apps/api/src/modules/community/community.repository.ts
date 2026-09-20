import type {
  PrismaClient,
  Prisma,
  CommunityPost,
  CommunityComment,
  CommunityPostLike,
} from "@prisma/client";

import type {
  CreateCommunityPostInput,
  UpdateCommunityPostStatusInput,
  ListCommunityPostsFilter,
  CreateCommunityCommentInput,
  UpdateCommunityCommentStatusInput,
  ListCommunityCommentsFilter,
  CreateCommunityPostLikeInput,
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
  listPosts(filter?: ListCommunityPostsFilter): Promise<CommunityPost[]>;
  listPostsByAuthor(authorId: string, limit?: number): Promise<CommunityPost[]>;
  updatePostStatus(id: string, data: UpdateCommunityPostStatusInput): Promise<CommunityPost>;
  deletePost(id: string): Promise<CommunityPost>;
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
          status: data.status ?? "VISIBLE",
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
        orderBy: [{ createdAt: "desc" }],
        take: limit,
      });
    } catch (err) {
      throw mapDatabaseError(err, "Failed to list community posts by author");
    }
  }

  async updatePostStatus(id: string, data: UpdateCommunityPostStatusInput): Promise<CommunityPost> {
    try {
      return await this.client.communityPost.update({
        where: { id },
        data: {
          status: data.status,
          removedAt: data.removedAt !== undefined ? data.removedAt : (data.status === "REMOVED" ? new Date() : null),
        },
      });
    } catch (err) {
      throw mapDatabaseError(err, "Failed to update community post status");
    }
  }

  async deletePost(id: string): Promise<CommunityPost> {
    try {
      return await this.client.communityPost.delete({
        where: { id },
      });
    } catch (err) {
      throw mapDatabaseError(err, "Failed to delete community post");
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
  updateCommentStatus(id: string, data: UpdateCommunityCommentStatusInput): Promise<CommunityComment>;
  deleteComment(id: string): Promise<CommunityComment>;
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
          status: data.status ?? "VISIBLE",
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
        orderBy: [{ createdAt: "desc" }],
        take: limit,
      });
    } catch (err) {
      throw mapDatabaseError(err, "Failed to list community comments by author");
    }
  }

  async updateCommentStatus(id: string, data: UpdateCommunityCommentStatusInput): Promise<CommunityComment> {
    try {
      return await this.client.communityComment.update({
        where: { id },
        data: {
          status: data.status,
          removedAt: data.removedAt !== undefined ? data.removedAt : (data.status === "REMOVED" ? new Date() : null),
        },
      });
    } catch (err) {
      throw mapDatabaseError(err, "Failed to update community comment status");
    }
  }

  async deleteComment(id: string): Promise<CommunityComment> {
    try {
      return await this.client.communityComment.delete({
        where: { id },
      });
    } catch (err) {
      throw mapDatabaseError(err, "Failed to delete community comment");
    }
  }
}

// ============================================================================
// 3. Community Post Like Repository
// ============================================================================

export interface ICommunityPostLikeRepository {
  createLike(data: CreateCommunityPostLikeInput): Promise<CommunityPostLike>;
  deleteLike(postId: string, userId: string): Promise<boolean>;
  findLike(postId: string, userId: string): Promise<CommunityPostLike | null>;
  countLikesByPost(postId: string): Promise<number>;
  hasUserLikedPost(postId: string, userId: string): Promise<boolean>;
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
      const like = await this.client.communityPostLike.findUnique({
        where: {
          userId_postId: {
            userId,
            postId,
          },
        },
        select: { id: true },
      });
      return like !== null;
    } catch (err) {
      throw mapDatabaseError(err, "Failed to check if user liked community post");
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
