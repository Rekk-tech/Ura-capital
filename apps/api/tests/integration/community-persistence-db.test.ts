import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { PrismaClient } from "@prisma/client";
import { assertSafeTestDatabase, sanitizeDiagnosticMessage, cleanAllTestTables } from "../helpers/test-db-guard.js";
import {
  createRepositoryContainer,
  type IRepositoryContainer,
} from "../../src/infrastructure/database/repository-factory.js";
import { PrismaTransactionRunner } from "../../src/infrastructure/database/transaction-runner.js";
import { AppError } from "../../src/shared/errors/error-envelope.js";

describe("FEAT-041 Community Domain Schema & Persistence Foundation (Integration)", () => {
  const testDbUrl =
    process.env.TEST_DATABASE_URL ||
    process.env.DATABASE_URL ||
    "postgresql://postgres:postgrespassword@localhost:5432/aura_capital_test_feat019_rework2_fresh";

  let prisma: PrismaClient;
  let repos: IRepositoryContainer;

  beforeAll(async () => {
    assertSafeTestDatabase(testDbUrl, "test");
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: testDbUrl,
        },
      },
    });

    try {
      await prisma.$connect();
      repos = createRepositoryContainer(prisma);
    } catch (err: unknown) {
      const errorMessage = sanitizeDiagnosticMessage(err instanceof Error ? err.message : String(err));
      throw new Error(`[DB_CONNECTION_FAILED] Required PostgreSQL test database unreachable: ${errorMessage}`);
    }
  });

  afterAll(async () => {
    if (prisma) {
      await cleanAllTestTables(prisma);
      await prisma.$disconnect();
    }
  });

  beforeEach(async () => {
    await cleanAllTestTables(prisma);
  });

  // Helper to create an active test user
  async function createTestUser(emailPrefix = "community_user") {
    return prisma.user.create({
      data: {
        email: `${emailPrefix}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}@example.com`,
        displayName: "Community Learner",
        status: "ACTIVE",
      },
    });
  }

  // ============================================================================
  // AC-003, AC-004, AC-005: Model Primitives & Server-Generated UUIDs
  // ============================================================================
  describe("AC-003..AC-005: Community Model Primitives & UUID Primary Keys", () => {
    it("creates a CommunityPost with server-generated UUID, server timestamps, and VISIBLE status", async () => {
      const user = await createTestUser("post_author");
      const post = await repos.communityPostRepo.createPost({
        authorId: user.id,
        content: "First community post for financial learners.",
      });

      expect(post.id).toBeDefined();
      expect(post.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
      expect(post.authorId).toBe(user.id);
      expect(post.content).toBe("First community post for financial learners.");
      expect(post.status).toBe("VISIBLE");
      expect(post.createdAt).toBeInstanceOf(Date);
      expect(post.updatedAt).toBeInstanceOf(Date);
      expect(post.removedAt).toBeNull();
    });

    it("creates a CommunityComment with server-generated UUID, server timestamps, and VISIBLE status", async () => {
      const author = await createTestUser("post_author");
      const commenter = await createTestUser("comment_author");
      const post = await repos.communityPostRepo.createPost({
        authorId: author.id,
        content: "Discussing long-term value investing principles.",
      });

      const comment = await repos.communityCommentRepo.createComment({
        postId: post.id,
        authorId: commenter.id,
        content: "Compounding interest is indeed the eighth wonder of the world.",
      });

      expect(comment.id).toBeDefined();
      expect(comment.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
      expect(comment.postId).toBe(post.id);
      expect(comment.authorId).toBe(commenter.id);
      expect(comment.content).toBe("Compounding interest is indeed the eighth wonder of the world.");
      expect(comment.status).toBe("VISIBLE");
      expect(comment.createdAt).toBeInstanceOf(Date);
      expect(comment.updatedAt).toBeInstanceOf(Date);
      expect(comment.removedAt).toBeNull();
    });

    it("creates a CommunityPostLike with server-generated UUID and timestamp", async () => {
      const author = await createTestUser("post_author");
      const liker = await createTestUser("post_liker");
      const post = await repos.communityPostRepo.createPost({
        authorId: author.id,
        content: "Deep dive into DCF analysis.",
      });

      const like = await repos.communityPostLikeRepo.createLike({
        postId: post.id,
        userId: liker.id,
      });

      expect(like.id).toBeDefined();
      expect(like.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
      expect(like.postId).toBe(post.id);
      expect(like.userId).toBe(liker.id);
      expect(like.createdAt).toBeInstanceOf(Date);
    });
  });

  // ============================================================================
  // AC-009, AC-010: Post Content Check Constraints
  // ============================================================================
  describe("AC-009, AC-010: Post Content Constraints (DB Check)", () => {
    it("rejects blank or empty post content at database level", async () => {
      const user = await createTestUser("post_author");

      await expect(
        repos.communityPostRepo.createPost({
          authorId: user.id,
          content: "",
        }),
      ).rejects.toThrow(AppError);
    });

    it("rejects whitespace-only post content at database level", async () => {
      const user = await createTestUser("post_author");

      await expect(
        repos.communityPostRepo.createPost({
          authorId: user.id,
          content: "   \t\n   ",
        }),
      ).rejects.toThrow(AppError);
    });

    it("accepts minimum 1-character trimmed post content", async () => {
      const user = await createTestUser("post_author");

      const post = await repos.communityPostRepo.createPost({
        authorId: user.id,
        content: "  X  ",
      });

      expect(post.id).toBeDefined();
    });

    it("accepts maximum 5,000 Unicode characters in post content", async () => {
      const user = await createTestUser("post_author");
      const content5000 = "📈".repeat(2500); // 2500 surrogate pairs / 5000 UTF-16 code units or chars

      const post = await repos.communityPostRepo.createPost({
        authorId: user.id,
        content: content5000,
      });

      expect(post.id).toBeDefined();
    });

    it("rejects post content exceeding 5,000 characters at database level", async () => {
      const user = await createTestUser("post_author");
      const content5001 = "a".repeat(5001);

      await expect(
        repos.communityPostRepo.createPost({
          authorId: user.id,
          content: content5001,
        }),
      ).rejects.toThrow(AppError);
    });
  });

  // ============================================================================
  // AC-011: Comment Content Check Constraints
  // ============================================================================
  describe("AC-011: Comment Content Constraints (DB Check)", () => {
    it("rejects blank or whitespace-only comment content at database level", async () => {
      const user = await createTestUser("comment_author");
      const post = await repos.communityPostRepo.createPost({
        authorId: user.id,
        content: "Valid post",
      });

      await expect(
        repos.communityCommentRepo.createComment({
          postId: post.id,
          authorId: user.id,
          content: "   ",
        }),
      ).rejects.toThrow(AppError);
    });

    it("accepts maximum 2,000 characters in comment content", async () => {
      const user = await createTestUser("comment_author");
      const post = await repos.communityPostRepo.createPost({
        authorId: user.id,
        content: "Valid post",
      });

      const content2000 = "c".repeat(2000);
      const comment = await repos.communityCommentRepo.createComment({
        postId: post.id,
        authorId: user.id,
        content: content2000,
      });

      expect(comment.id).toBeDefined();
    });

    it("rejects comment content exceeding 2,000 characters at database level", async () => {
      const user = await createTestUser("comment_author");
      const post = await repos.communityPostRepo.createPost({
        authorId: user.id,
        content: "Valid post",
      });

      const content2001 = "c".repeat(2001);
      await expect(
        repos.communityCommentRepo.createComment({
          postId: post.id,
          authorId: user.id,
          content: content2001,
        }),
      ).rejects.toThrow(AppError);
    });
  });

  // ============================================================================
  // AC-012: Moderation Status Closed Set & Logical Removal (DEF-002)
  // ============================================================================
  describe("AC-012: Moderation Status Closed Set & Removal Transitions (DEF-002)", () => {
    it("accepts exact status values VISIBLE, HIDDEN, and REMOVED through governed lifecycle", async () => {
      const user = await createTestUser("status_tester");

      // Post 1: Default VISIBLE with removedAt null
      const pVisible = await repos.communityPostRepo.createPost({
        authorId: user.id,
        content: "Visible content",
      });
      expect(pVisible.status).toBe("VISIBLE");
      expect(pVisible.removedAt).toBeNull();

      // Post 2: Transition to HIDDEN with removedAt null
      const pHidden = await repos.communityPostRepo.createPost({
        authorId: user.id,
        content: "Hidden content",
      });
      const updatedHidden = await repos.communityPostRepo.updatePostStatus(pHidden.id, "HIDDEN");
      expect(updatedHidden.status).toBe("HIDDEN");
      expect(updatedHidden.removedAt).toBeNull();

      // Post 3: Transition to REMOVED with atomic server timestamp
      const pRemoved = await repos.communityPostRepo.createPost({
        authorId: user.id,
        content: "Removed content",
      });
      const updatedRemoved = await repos.communityPostRepo.markPostRemoved(pRemoved.id);
      expect(updatedRemoved.status).toBe("REMOVED");
      expect(updatedRemoved.removedAt).toBeInstanceOf(Date);
    });

    it("rejects invalid status values outside the closed set via database check", async () => {
      const user = await createTestUser("status_check_tester");

      await expect(
        prisma.$executeRaw`
          INSERT INTO "community_posts" ("id", "author_id", "content", "status", "updated_at", "removed_at")
          VALUES (gen_random_uuid()::text, ${user.id}, 'Invalid status post', 'ARCHIVED', NOW(), NULL)
        `,
      ).rejects.toThrow();
    });

    it("rejects REMOVED posts with removed_at = NULL via PostgreSQL check constraint (DEF-002)", async () => {
      const user = await createTestUser("removed_null_post_tester");

      await expect(
        prisma.$executeRaw`
          INSERT INTO "community_posts" ("id", "author_id", "content", "status", "updated_at", "removed_at")
          VALUES (gen_random_uuid()::text, ${user.id}, 'Removed post without timestamp', 'REMOVED', NOW(), NULL)
        `,
      ).rejects.toThrow();
    });

    it("rejects non-REMOVED posts with removed_at != NULL via PostgreSQL check constraint (DEF-002)", async () => {
      const user = await createTestUser("non_removed_ts_post_tester");

      // VISIBLE with removed_at must be rejected
      await expect(
        prisma.$executeRaw`
          INSERT INTO "community_posts" ("id", "author_id", "content", "status", "updated_at", "removed_at")
          VALUES (gen_random_uuid()::text, ${user.id}, 'Visible post with timestamp', 'VISIBLE', NOW(), NOW())
        `,
      ).rejects.toThrow();

      // HIDDEN with removed_at must be rejected
      await expect(
        prisma.$executeRaw`
          INSERT INTO "community_posts" ("id", "author_id", "content", "status", "updated_at", "removed_at")
          VALUES (gen_random_uuid()::text, ${user.id}, 'Hidden post with timestamp', 'HIDDEN', NOW(), NOW())
        `,
      ).rejects.toThrow();
    });

    it("rejects REMOVED comments with removed_at = NULL via PostgreSQL check constraint (DEF-002)", async () => {
      const user = await createTestUser("removed_null_comment_tester");
      const post = await repos.communityPostRepo.createPost({
        authorId: user.id,
        content: "Post for comment check test",
      });

      await expect(
        prisma.$executeRaw`
          INSERT INTO "community_comments" ("id", "post_id", "author_id", "content", "status", "updated_at", "removed_at")
          VALUES (gen_random_uuid()::text, ${post.id}, ${user.id}, 'Removed comment without timestamp', 'REMOVED', NOW(), NULL)
        `,
      ).rejects.toThrow();
    });

    it("rejects non-REMOVED comments with removed_at != NULL via PostgreSQL check constraint (DEF-002)", async () => {
      const user = await createTestUser("non_removed_ts_comment_tester");
      const post = await repos.communityPostRepo.createPost({
        authorId: user.id,
        content: "Post for comment check test",
      });

      // VISIBLE with removed_at must be rejected
      await expect(
        prisma.$executeRaw`
          INSERT INTO "community_comments" ("id", "post_id", "author_id", "content", "status", "updated_at", "removed_at")
          VALUES (gen_random_uuid()::text, ${post.id}, ${user.id}, 'Visible comment with timestamp', 'VISIBLE', NOW(), NOW())
        `,
      ).rejects.toThrow();

      // HIDDEN with removed_at must be rejected
      await expect(
        prisma.$executeRaw`
          INSERT INTO "community_comments" ("id", "post_id", "author_id", "content", "status", "updated_at", "removed_at")
          VALUES (gen_random_uuid()::text, ${post.id}, ${user.id}, 'Hidden comment with timestamp', 'HIDDEN', NOW(), NOW())
        `,
      ).rejects.toThrow();
    });

    it("supports atomic logical removal with server timestamp via repositories (DEF-001, DEF-002)", async () => {
      const user = await createTestUser("removal_repo_tester");
      const post = await repos.communityPostRepo.createPost({
        authorId: user.id,
        content: "Post to be removed logically",
      });
      const comment = await repos.communityCommentRepo.createComment({
        postId: post.id,
        authorId: user.id,
        content: "Comment to be removed logically",
      });

      const removedPost = await repos.communityPostRepo.markPostRemoved(post.id);
      expect(removedPost.status).toBe("REMOVED");
      expect(removedPost.removedAt).toBeInstanceOf(Date);

      const removedComment = await repos.communityCommentRepo.markCommentRemoved(comment.id);
      expect(removedComment.status).toBe("REMOVED");
      expect(removedComment.removedAt).toBeInstanceOf(Date);
    });
  });

  // ============================================================================
  // AC-006, AC-007, AC-008, AC-022: Foreign Keys & Delete Policies
  // ============================================================================
  describe("AC-006..AC-008, AC-022: Foreign Keys & Delete Policies", () => {
    it("rejects post creation with non-existent authorId (FK error)", async () => {
      await expect(
        repos.communityPostRepo.createPost({
          authorId: "00000000-0000-0000-0000-000000000000",
          content: "Post with non-existent user",
        }),
      ).rejects.toThrow(AppError);
    });

    it("rejects comment creation with non-existent postId (FK error)", async () => {
      const user = await createTestUser("comment_author");
      await expect(
        repos.communityCommentRepo.createComment({
          postId: "00000000-0000-0000-0000-000000000000",
          authorId: user.id,
          content: "Comment on non-existent post",
        }),
      ).rejects.toThrow(AppError);
    });

    it("restricts deletion of User who has authored CommunityPost (ON DELETE RESTRICT)", async () => {
      const user = await createTestUser("author_restricted");
      await repos.communityPostRepo.createPost({
        authorId: user.id,
        content: "Authored post prevents user physical deletion",
      });

      // Attempting to physically delete user must fail due to ON DELETE RESTRICT
      await expect(
        prisma.user.delete({
          where: { id: user.id },
        }),
      ).rejects.toThrow();
    });

    it("restricts deletion of User who has authored CommunityComment (ON DELETE RESTRICT)", async () => {
      const author = await createTestUser("post_author");
      const commenter = await createTestUser("commenter_restricted");
      const post = await repos.communityPostRepo.createPost({
        authorId: author.id,
        content: "Post for comment test",
      });

      await repos.communityCommentRepo.createComment({
        postId: post.id,
        authorId: commenter.id,
        content: "Comment prevents commenter physical deletion",
      });

      await expect(
        prisma.user.delete({
          where: { id: commenter.id },
        }),
      ).rejects.toThrow();
    });

    it("restricts deletion of CommunityPost that has comments (ON DELETE RESTRICT)", async () => {
      const author = await createTestUser("post_author");
      const commenter = await createTestUser("comment_author");
      const post = await repos.communityPostRepo.createPost({
        authorId: author.id,
        content: "Post with comment thread",
      });

      await repos.communityCommentRepo.createComment({
        postId: post.id,
        authorId: commenter.id,
        content: "Comment protects post from deletion",
      });

      await expect(
        prisma.communityPost.delete({
          where: { id: post.id },
        }),
      ).rejects.toThrow();
    });

    it("cascades deletion when CommunityPost is deleted: post likes are cascade-deleted (ON DELETE CASCADE)", async () => {
      const author = await createTestUser("post_author");
      const liker = await createTestUser("post_liker");
      const post = await repos.communityPostRepo.createPost({
        authorId: author.id,
        content: "Post with likes only",
      });

      await repos.communityPostLikeRepo.createLike({
        postId: post.id,
        userId: liker.id,
      });

      expect(await repos.communityPostLikeRepo.hasUserLikedPost(post.id, liker.id)).toBe(true);

      // Delete post directly
      await prisma.communityPost.delete({
        where: { id: post.id },
      });

      // Like should have been cascaded and no longer exist
      const remainingLikes = await prisma.communityPostLike.findMany({
        where: { postId: post.id },
      });
      expect(remainingLikes).toHaveLength(0);
    });

    it("cascades deletion when User is deleted: user likes are cascade-deleted (ON DELETE CASCADE)", async () => {
      const author = await createTestUser("post_author");
      const liker = await createTestUser("liker_only");
      const post = await repos.communityPostRepo.createPost({
        authorId: author.id,
        content: "Post liked by user who authored nothing",
      });

      await repos.communityPostLikeRepo.createLike({
        postId: post.id,
        userId: liker.id,
      });

      // Liker authored no post and no comment, only liked
      await prisma.user.delete({
        where: { id: liker.id },
      });

      const likeAfterUserDelete = await prisma.communityPostLike.findUnique({
        where: {
          userId_postId: {
            userId: liker.id,
            postId: post.id,
          },
        },
      });
      expect(likeAfterUserDelete).toBeNull();
    });
  });

  // ============================================================================
  // AC-014, AC-023: Post Likes Uniqueness & Concurrency Convergence
  // ============================================================================
  describe("AC-014, AC-023: Unique (userId, postId) & Concurrent Convergence", () => {
    it("enforces unique (userId, postId) rejecting duplicate like sequentially", async () => {
      const author = await createTestUser("author");
      const liker = await createTestUser("liker");
      const post = await repos.communityPostRepo.createPost({
        authorId: author.id,
        content: "Post for unique like test",
      });

      const like1 = await repos.communityPostLikeRepo.createLike({
        postId: post.id,
        userId: liker.id,
      });
      expect(like1.id).toBeDefined();

      await expect(
        repos.communityPostLikeRepo.createLike({
          postId: post.id,
          userId: liker.id,
        }),
      ).rejects.toThrow(AppError);
    });

    it("converges 5 concurrent duplicate likes into exactly 1 durable row without corruption (AC-023)", async () => {
      const author = await createTestUser("author");
      const liker = await createTestUser("concurrent_liker");
      const post = await repos.communityPostRepo.createPost({
        authorId: author.id,
        content: "Post for high-concurrency duplicate like race",
      });

      // Launch 5 concurrent like creation attempts
      const attempts = await Promise.allSettled([
        repos.communityPostLikeRepo.createLike({ postId: post.id, userId: liker.id }),
        repos.communityPostLikeRepo.createLike({ postId: post.id, userId: liker.id }),
        repos.communityPostLikeRepo.createLike({ postId: post.id, userId: liker.id }),
        repos.communityPostLikeRepo.createLike({ postId: post.id, userId: liker.id }),
        repos.communityPostLikeRepo.createLike({ postId: post.id, userId: liker.id }),
      ]);

      const fulfilled = attempts.filter((r) => r.status === "fulfilled");
      const rejected = attempts.filter((r) => r.status === "rejected");

      // Exactly 1 must succeed; the remaining 4 must fail due to unique constraint
      expect(fulfilled).toHaveLength(1);
      expect(rejected).toHaveLength(4);

      // Verify database state: exactly 1 durable like row exists
      const totalLikesInDb = await prisma.communityPostLike.count({
        where: { postId: post.id, userId: liker.id },
      });
      expect(totalLikesInDb).toBe(1);
    });

    it("deletes like caller-scoped without affecting other users' likes", async () => {
      const author = await createTestUser("author");
      const liker1 = await createTestUser("liker_one");
      const liker2 = await createTestUser("liker_two");
      const post = await repos.communityPostRepo.createPost({
        authorId: author.id,
        content: "Post with multiple likers",
      });

      await repos.communityPostLikeRepo.createLike({ postId: post.id, userId: liker1.id });
      await repos.communityPostLikeRepo.createLike({ postId: post.id, userId: liker2.id });

      expect(await repos.communityPostLikeRepo.countLikesByPost(post.id)).toBe(2);

      const removed = await repos.communityPostLikeRepo.deleteLike(post.id, liker1.id);
      expect(removed).toBe(true);

      // Liker 1's like is removed, Liker 2's like remains
      expect(await repos.communityPostLikeRepo.hasUserLikedPost(post.id, liker1.id)).toBe(false);
      expect(await repos.communityPostLikeRepo.hasUserLikedPost(post.id, liker2.id)).toBe(true);
      expect(await repos.communityPostLikeRepo.countLikesByPost(post.id)).toBe(1);
    });
  });

  // ============================================================================
  // AC-013, AC-015: Ordering, Relational Aggregates, & Counter Prohibition
  // ============================================================================
  describe("AC-013, AC-015: Feed/Comment Ordering & Relational Aggregates", () => {
    it("orders posts feed by (status, createdAt DESC, id DESC)", async () => {
      const user = await createTestUser("feed_poster");

      const p1 = await repos.communityPostRepo.createPost({ authorId: user.id, content: "Post 1" });
      const p2 = await repos.communityPostRepo.createPost({ authorId: user.id, content: "Post 2" });
      const p3 = await repos.communityPostRepo.createPost({ authorId: user.id, content: "Post 3" });

      const posts = await repos.communityPostRepo.listPosts({ status: "VISIBLE" });
      expect(posts.length).toBeGreaterThanOrEqual(3);

      const feedOrder = posts.filter((p) => [p1.id, p2.id, p3.id].includes(p.id));
      // Latest created comes first
      expect(feedOrder[0].id).toBe(p3.id);
      expect(feedOrder[1].id).toBe(p2.id);
      expect(feedOrder[2].id).toBe(p1.id);
    });

    it("orders comments by (postId, createdAt ASC, id ASC) for chronological flat comments", async () => {
      const author = await createTestUser("post_author");
      const commenter = await createTestUser("comment_author");
      const post = await repos.communityPostRepo.createPost({ authorId: author.id, content: "Post for comments" });

      const c1 = await repos.communityCommentRepo.createComment({ postId: post.id, authorId: commenter.id, content: "First comment" });
      const c2 = await repos.communityCommentRepo.createComment({ postId: post.id, authorId: commenter.id, content: "Second comment" });
      const c3 = await repos.communityCommentRepo.createComment({ postId: post.id, authorId: commenter.id, content: "Third comment" });

      const comments = await repos.communityCommentRepo.listCommentsByPost(post.id);
      expect(comments).toHaveLength(3);
      // Chronological: first created comes first
      expect(comments[0].id).toBe(c1.id);
      expect(comments[1].id).toBe(c2.id);
      expect(comments[2].id).toBe(c3.id);
    });

    it("proves relational counts without materialized likeCount/commentCount columns", async () => {
      const author = await createTestUser("author");
      const userA = await createTestUser("user_a");
      const userB = await createTestUser("user_b");

      const post = await repos.communityPostRepo.createPost({ authorId: author.id, content: "Post with counts" });

      // Add likes
      await repos.communityPostLikeRepo.createLike({ postId: post.id, userId: userA.id });
      await repos.communityPostLikeRepo.createLike({ postId: post.id, userId: userB.id });

      // Add comment
      await repos.communityCommentRepo.createComment({ postId: post.id, authorId: userA.id, content: "Comment" });

      // Derived relational like count
      const likeCount = await repos.communityPostLikeRepo.countLikesByPost(post.id);
      expect(likeCount).toBe(2);

      // Verify no materialized count columns exist on CommunityPost entity
      const rawPost = await prisma.communityPost.findUnique({ where: { id: post.id } });
      expect((rawPost as unknown as Record<string, unknown>).likeCount).toBeUndefined();
      expect((rawPost as unknown as Record<string, unknown>).commentCount).toBeUndefined();
      expect((rawPost as unknown as Record<string, unknown>).likedByUser).toBeUndefined();
    });

    it("verifies exact canonical PostgreSQL index metadata and ordering (DEF-003, AC-013)", async () => {
      interface IndexDefRow {
        index_name: string;
        table_name: string;
        is_unique: boolean;
        index_def: string;
      }

      const rows = await prisma.$queryRaw<IndexDefRow[]>`
        SELECT
          c.relname AS index_name,
          t.relname AS table_name,
          ix.indisunique AS is_unique,
          pg_get_indexdef(c.oid) AS index_def
        FROM pg_class c
        JOIN pg_index ix ON c.oid = ix.indexrelid
        JOIN pg_class t ON ix.indrelid = t.oid
        JOIN pg_namespace n ON t.relnamespace = n.oid
        WHERE n.nspname = 'public'
          AND t.relname IN ('community_posts', 'community_comments', 'community_post_likes')
        ORDER BY t.relname, c.relname;
      `;

      const indexMap = new Map(rows.map((r) => [r.index_name, r]));

      // 1. community_posts feed index: (status, created_at DESC, id DESC)
      const postFeed = indexMap.get("community_posts_status_created_at_id_idx");
      expect(postFeed).toBeDefined();
      expect(postFeed!.index_def).toMatch(/status.*created_at.*DESC.*id.*DESC/i);

      // 2. community_posts author index: (author_id, created_at DESC, id DESC)
      const postAuthor = indexMap.get("community_posts_author_id_created_at_id_idx");
      expect(postAuthor).toBeDefined();
      expect(postAuthor!.index_def).toMatch(/author_id.*created_at.*DESC.*id.*DESC/i);

      // 3. community_comments post index: (post_id, created_at ASC, id ASC)
      const commentPost = indexMap.get("community_comments_post_id_created_at_id_idx");
      expect(commentPost).toBeDefined();
      expect(commentPost!.index_def).toMatch(/post_id.*created_at.*id/i);

      // 4. community_comments author index: (author_id, created_at DESC, id DESC)
      const commentAuthor = indexMap.get("community_comments_author_id_created_at_id_idx");
      expect(commentAuthor).toBeDefined();
      expect(commentAuthor!.index_def).toMatch(/author_id.*created_at.*DESC.*id.*DESC/i);

      // 5. community_post_likes unique constraint: (user_id, post_id)
      const likeUnique = indexMap.get("community_post_likes_user_id_post_id_key");
      expect(likeUnique).toBeDefined();
      expect(likeUnique!.is_unique).toBe(true);
      expect(likeUnique!.index_def).toMatch(/user_id.*post_id/i);

      // 6. community_post_likes post index: (post_id, created_at DESC)
      const likePost = indexMap.get("community_post_likes_post_id_created_at_idx");
      expect(likePost).toBeDefined();
      expect(likePost!.index_def).toMatch(/post_id.*created_at.*DESC/i);

      // 7. community_post_likes user index: (user_id, created_at DESC)
      const likeUser = indexMap.get("community_post_likes_user_id_created_at_idx");
      expect(likeUser).toBeDefined();
      expect(likeUser!.index_def).toMatch(/user_id.*created_at.*DESC/i);
    });

    it("verifies exact PostgreSQL check constraints metadata (DEF-002)", async () => {
      interface ConstraintRow {
        constraint_name: string;
        table_name: string;
        constraint_def: string;
      }

      const rows = await prisma.$queryRaw<ConstraintRow[]>`
        SELECT
          con.conname AS constraint_name,
          rel.relname AS table_name,
          pg_get_constraintdef(con.oid) AS constraint_def
        FROM pg_constraint con
        JOIN pg_class rel ON con.conrelid = rel.oid
        JOIN pg_namespace nsp ON rel.relnamespace = nsp.oid
        WHERE nsp.nspname = 'public'
          AND rel.relname IN ('community_posts', 'community_comments')
          AND con.contype = 'c'
        ORDER BY con.conname;
      `;

      const constraintNames = rows.map((r) => r.constraint_name);
      expect(constraintNames).toContain("community_posts_status_check");
      expect(constraintNames).toContain("community_posts_content_length_check");
      expect(constraintNames).toContain("community_posts_removed_at_check");
      expect(constraintNames).toContain("community_comments_status_check");
      expect(constraintNames).toContain("community_comments_content_length_check");
      expect(constraintNames).toContain("community_comments_removed_at_check");

      const postRemovedCheck = rows.find((r) => r.constraint_name === "community_posts_removed_at_check");
      expect(postRemovedCheck!.constraint_def).toContain("REMOVED");
      expect(postRemovedCheck!.constraint_def).toContain("removed_at");

      const commentRemovedCheck = rows.find((r) => r.constraint_name === "community_comments_removed_at_check");
      expect(commentRemovedCheck!.constraint_def).toContain("REMOVED");
      expect(commentRemovedCheck!.constraint_def).toContain("removed_at");
    });

    it("proves ordinary repositories isolate physical delete and expose only logical removal (DEF-001, AC-018)", () => {
      // Ordinary post repository must NOT have physical delete methods
      expect("deletePost" in repos.communityPostRepo).toBe(false);
      expect("delete" in repos.communityPostRepo).toBe(false);
      expect((repos.communityPostRepo as unknown as Record<string, unknown>).deletePost).toBeUndefined();
      expect((repos.communityPostRepo as unknown as Record<string, unknown>).delete).toBeUndefined();

      // Ordinary comment repository must NOT have physical delete methods
      expect("deleteComment" in repos.communityCommentRepo).toBe(false);
      expect("delete" in repos.communityCommentRepo).toBe(false);
      expect((repos.communityCommentRepo as unknown as Record<string, unknown>).deleteComment).toBeUndefined();
      expect((repos.communityCommentRepo as unknown as Record<string, unknown>).delete).toBeUndefined();

      // Logical removal methods must exist
      expect(typeof repos.communityPostRepo.markPostRemoved).toBe("function");
      expect(typeof repos.communityCommentRepo.markCommentRemoved).toBe("function");
    });
  });

  // ============================================================================
  // AC-019, AC-020: Transaction Runner / Unit of Work Atomic Compatibility
  // ============================================================================
  describe("AC-019, AC-020: Transaction Runner / Unit of Work Compatibility", () => {
    it("executes community repository operations inside atomic transaction", async () => {
      const user = await createTestUser("tx_user");
      const txRunner = new PrismaTransactionRunner(prisma);

      const result = await txRunner.run(async (ctx) => {
        const post = await ctx.repositories.communityPostRepo.createPost({
          authorId: user.id,
          content: "Post inside transaction",
        });

        const comment = await ctx.repositories.communityCommentRepo.createComment({
          postId: post.id,
          authorId: user.id,
          content: "Comment inside same transaction",
        });

        return { post, comment };
      });

      expect(result.post.id).toBeDefined();
      expect(result.comment.id).toBeDefined();

      const persistedPost = await repos.communityPostRepo.findPostById(result.post.id);
      expect(persistedPost).not.toBeNull();
    });

    it("rolls back all community operations if transaction fails", async () => {
      const user = await createTestUser("tx_fail_user");
      const txRunner = new PrismaTransactionRunner(prisma);
      let createdPostId: string | undefined;

      await expect(
        txRunner.run(async (ctx) => {
          const post = await ctx.repositories.communityPostRepo.createPost({
            authorId: user.id,
            content: "Post that must roll back",
          });
          createdPostId = post.id;

          // Intentionally throw error to trigger rollback
          throw new AppError("Deliberate transaction failure");
        }),
      ).rejects.toThrow("Deliberate transaction failure");

      expect(createdPostId).toBeDefined();
      const rolledBackPost = await repos.communityPostRepo.findPostById(createdPostId!);
      expect(rolledBackPost).toBeNull();
    });
  });

  // ============================================================================
  // AC-024: Cross-Phase Domain Isolation
  // ============================================================================
  describe("AC-024: Domain Boundary Preservation", () => {
    it("preserves Academy, Simulation, and Auth boundaries without interference", async () => {
      const user = await createTestUser("isolated_user");

      // Verify Auth relations work
      const credential = await prisma.credential.create({
        data: {
          userId: user.id,
          type: "PASSWORD",
          passwordHash: "$argon2id$v=19$m=65536,t=3,p=4$dummyhash",
        },
      });
      expect(credential.userId).toBe(user.id);

      // Verify Academy relations work
      const xp = await prisma.academyUserXp.create({
        data: {
          userId: user.id,
          totalXp: 100,
          level: 1,
        },
      });
      expect(xp.totalXp).toBe(100);

      // Verify Simulation relations work
      const scenario = await repos.simulationScenarioRepo.createScenario({
        key: `COMM_ISO_${Date.now()}`,
        name: "Isolation Scenario",
        status: "ACTIVE",
      });
      const session = await repos.simulationSessionRepo.createSession({
        userId: user.id,
        scenarioId: scenario.id,
        startingCash: "50000.0000",
      });
      expect(session.userId).toBe(user.id);

      // Verify Community post works independently
      const post = await repos.communityPostRepo.createPost({
        authorId: user.id,
        content: "Community works alongside all domains cleanly",
      });
      expect(post.authorId).toBe(user.id);
    });
  });
});
