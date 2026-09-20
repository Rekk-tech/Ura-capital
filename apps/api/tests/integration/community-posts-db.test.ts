import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import { PrismaClient } from "@prisma/client";
import { createApp } from "../../src/server.js";
import { accessTokenService } from "../../src/modules/auth/access-token.service.js";
import {
  assertSafeTestDatabase,
  sanitizeDiagnosticMessage,
  cleanAllTestTables,
} from "../helpers/test-db-guard.js";
import { PrismaTransactionRunner } from "../../src/infrastructure/database/transaction-runner.js";
import { ERROR_CODES, HTTP_STATUS } from "@aura/shared";

describe("FEAT-042 Community Posts API Live PostgreSQL (Integration)", () => {
  const testDbUrl =
    process.env.TEST_DATABASE_URL ||
    process.env.DATABASE_URL ||
    "postgresql://postgres:postgrespassword@localhost:5432/aura_capital_test_feat019_rework2_fresh";

  let prisma: PrismaClient;
  const app = createApp();

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
    } catch (err: unknown) {
      const errorMessage = sanitizeDiagnosticMessage(
        err instanceof Error ? err.message : String(err),
      );
      throw new Error(
        `[DB_CONNECTION_FAILED] Required PostgreSQL test database unreachable: ${errorMessage}`,
      );
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
  async function createTestUser(emailPrefix = "post_learner", displayName?: string | null) {
    return prisma.user.create({
      data: {
        email: `${emailPrefix}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}@example.com`,
        displayName: displayName !== undefined ? displayName : "Community Learner",
        status: "ACTIVE",
      },
    });
  }

  // Helper to create an authorization header for a test user
  function getAuthHeaderForUser(userId: string): string {
    const { accessToken } = accessTokenService.issueAccessToken(userId);
    return `Bearer ${accessToken}`;
  }

  // ============================================================================
  // AC-015, AC-023: Post Creation
  // ============================================================================
  describe("Post Creation (AC-015, AC-023)", () => {
    it("persists post with server-derived author, VISIBLE status, and timestamps", async () => {
      const user = await createTestUser("alice", "Alice Learner");
      const authHeader = getAuthHeaderForUser(user.id);

      const content = "First investment thesis on clean tech";
      const res = await request(app)
        .post("/api/community/posts")
        .set("Authorization", authHeader)
        .send({ content })
        .expect(HTTP_STATUS.CREATED);

      expect(res.body.data).toBeDefined();
      const post = res.body.data;
      expect(post.id).toBeDefined();
      expect(post.content).toBe(content);
      expect(post.author.displayName).toBe("Alice Learner");
      expect(post.likeCount).toBe(0);
      expect(post.commentCount).toBe(0);
      expect(post.likedByCurrentUser).toBe(false);
      expect(post.ownedByCurrentUser).toBe(true);

      // Verify direct PostgreSQL durability
      const dbPost = await prisma.communityPost.findUnique({
        where: { id: post.id },
      });
      expect(dbPost).not.toBeNull();
      expect(dbPost!.authorId).toBe(user.id);
      expect(dbPost!.status).toBe("VISIBLE");
      expect(dbPost!.removedAt).toBeNull();
      expect(dbPost!.createdAt).toBeInstanceOf(Date);
    });

    it("falls back to 'Aura Learner' when user displayName is null", async () => {
      const user = await createTestUser("noname", null);
      const authHeader = getAuthHeaderForUser(user.id);

      const res = await request(app)
        .post("/api/community/posts")
        .set("Authorization", authHeader)
        .send({ content: "Anonymous thoughts" })
        .expect(HTTP_STATUS.CREATED);

      expect(res.body.data.author.displayName).toBe("Aura Learner");
    });
  });

  // ============================================================================
  // AC-004, AC-005, AC-009, AC-010: Feed Read, Deterministic Ordering & Pagination
  // ============================================================================
  describe("Feed Ordering & Cursor Pagination (AC-004, AC-005, AC-009, AC-010)", () => {
    it("returns feed ordered by createdAt DESC, id DESC with default limit 20", async () => {
      const user = await createTestUser("feed_user");
      const authHeader = getAuthHeaderForUser(user.id);

      // Create 5 posts at different times
      const postIds: string[] = [];
      for (let i = 1; i <= 5; i++) {
        const post = await prisma.communityPost.create({
          data: {
            authorId: user.id,
            content: `Post ${i}`,
            status: "VISIBLE",
            createdAt: new Date(Date.now() + i * 1000),
          },
        });
        postIds.push(post.id);
      }

      const res = await request(app)
        .get("/api/community/posts")
        .set("Authorization", authHeader)
        .expect(HTTP_STATUS.OK);

      expect(res.body.data.length).toBe(5);
      expect(res.body.pageInfo.hasNextPage).toBe(false);
      expect(res.body.pageInfo.nextCursor).toBeNull();

      // Verify createdAt DESC ordering (Post 5 first, Post 1 last)
      expect(res.body.data[0].id).toBe(postIds[4]);
      expect(res.body.data[4].id).toBe(postIds[0]);
    });

    it("traverses pages deterministically across identical createdAt timestamps (tie-breaker)", async () => {
      const user = await createTestUser("tiebreaker_user");
      const authHeader = getAuthHeaderForUser(user.id);

      const fixedDate = new Date("2026-09-20T15:00:00.000Z");

      // Create 4 posts with the exact same createdAt timestamp
      const posts = await Promise.all([
        prisma.communityPost.create({
          data: {
            authorId: user.id,
            content: "Equal Time Post A",
            status: "VISIBLE",
            createdAt: fixedDate,
          },
        }),
        prisma.communityPost.create({
          data: {
            authorId: user.id,
            content: "Equal Time Post B",
            status: "VISIBLE",
            createdAt: fixedDate,
          },
        }),
        prisma.communityPost.create({
          data: {
            authorId: user.id,
            content: "Equal Time Post C",
            status: "VISIBLE",
            createdAt: fixedDate,
          },
        }),
        prisma.communityPost.create({
          data: {
            authorId: user.id,
            content: "Equal Time Post D",
            status: "VISIBLE",
            createdAt: fixedDate,
          },
        }),
      ]);

      // Expected order by (createdAt DESC, id DESC)
      const expectedOrderedIds = posts
        .map((p) => p.id)
        .sort()
        .reverse();

      // Page 1: limit 2
      const page1 = await request(app)
        .get("/api/community/posts?limit=2")
        .set("Authorization", authHeader)
        .expect(HTTP_STATUS.OK);

      expect(page1.body.data.length).toBe(2);
      expect(page1.body.pageInfo.hasNextPage).toBe(true);
      expect(page1.body.pageInfo.nextCursor).toBeDefined();

      expect(page1.body.data[0].id).toBe(expectedOrderedIds[0]);
      expect(page1.body.data[1].id).toBe(expectedOrderedIds[1]);

      // Page 2: use cursor from page 1, limit 2
      const cursor = page1.body.pageInfo.nextCursor;
      const page2 = await request(app)
        .get(`/api/community/posts?limit=2&cursor=${encodeURIComponent(cursor)}`)
        .set("Authorization", authHeader)
        .expect(HTTP_STATUS.OK);

      expect(page2.body.data.length).toBe(2);
      expect(page2.body.data[0].id).toBe(expectedOrderedIds[2]);
      expect(page2.body.data[1].id).toBe(expectedOrderedIds[3]);
      expect(page2.body.pageInfo.hasNextPage).toBe(false);

      // Verify zero duplicates and zero missing rows across pagination
      const allFetchedIds = [
        page1.body.data[0].id,
        page1.body.data[1].id,
        page2.body.data[0].id,
        page2.body.data[1].id,
      ];
      expect(allFetchedIds).toEqual(expectedOrderedIds);
      expect(new Set(allFetchedIds).size).toBe(4);
    });
  });

  // ============================================================================
  // AC-011, AC-012: Moderation Visibility (VISIBLE vs HIDDEN vs REMOVED)
  // ============================================================================
  describe("Moderation Visibility (AC-011, AC-012)", () => {
    it("excludes HIDDEN and REMOVED posts from feed", async () => {
      const user = await createTestUser("mod_user");
      const authHeader = getAuthHeaderForUser(user.id);

      const visible = await prisma.communityPost.create({
        data: {
          authorId: user.id,
          content: "Visible post",
          status: "VISIBLE",
        },
      });

      await prisma.communityPost.create({
        data: {
          authorId: user.id,
          content: "Hidden post",
          status: "HIDDEN",
        },
      });

      await prisma.communityPost.create({
        data: {
          authorId: user.id,
          content: "Removed post",
          status: "REMOVED",
          removedAt: new Date(),
        },
      });

      const res = await request(app)
        .get("/api/community/posts")
        .set("Authorization", authHeader)
        .expect(HTTP_STATUS.OK);

      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].id).toBe(visible.id);
      expect(res.body.data[0].content).toBe("Visible post");
    });

    it("returns 404 NOT_FOUND on post detail for HIDDEN or REMOVED posts", async () => {
      const user = await createTestUser("detail_user");
      const authHeader = getAuthHeaderForUser(user.id);

      const hiddenPost = await prisma.communityPost.create({
        data: {
          authorId: user.id,
          content: "Hidden post detail",
          status: "HIDDEN",
        },
      });

      const removedPost = await prisma.communityPost.create({
        data: {
          authorId: user.id,
          content: "Removed post detail",
          status: "REMOVED",
          removedAt: new Date(),
        },
      });

      // Hidden detail returns safe 404
      const resHidden = await request(app)
        .get(`/api/community/posts/${hiddenPost.id}`)
        .set("Authorization", authHeader)
        .expect(HTTP_STATUS.NOT_FOUND);

      expect(resHidden.body.error.code).toBe(ERROR_CODES.NOT_FOUND);

      // Removed detail returns safe 404
      const resRemoved = await request(app)
        .get(`/api/community/posts/${removedPost.id}`)
        .set("Authorization", authHeader)
        .expect(HTTP_STATUS.NOT_FOUND);

      expect(resRemoved.body.error.code).toBe(ERROR_CODES.NOT_FOUND);

      // Nonexistent post returns safe 404
      const resMissing = await request(app)
        .get("/api/community/posts/00000000-0000-0000-0000-000000000099")
        .set("Authorization", authHeader)
        .expect(HTTP_STATUS.NOT_FOUND);

      expect(resMissing.body.error.code).toBe(ERROR_CODES.NOT_FOUND);
    });
  });

  // ============================================================================
  // AC-013, AC-014, AC-024: Relational Counts & User State
  // ============================================================================
  describe("Relational Counts & likedByCurrentUser (AC-013, AC-014, AC-024)", () => {
    it("derives relational likeCount, commentCount, and likedByCurrentUser correctly", async () => {
      const author = await createTestUser("author", "Author User");
      const liker = await createTestUser("liker", "Liker User");
      const commenter = await createTestUser("commenter", "Commenter User");

      const authorAuth = getAuthHeaderForUser(author.id);
      const likerAuth = getAuthHeaderForUser(liker.id);

      const post = await prisma.communityPost.create({
        data: {
          authorId: author.id,
          content: "Post with relational interactions",
          status: "VISIBLE",
        },
      });

      // Add a like from liker
      await prisma.communityPostLike.create({
        data: {
          postId: post.id,
          userId: liker.id,
        },
      });

      // Add visible comments
      await prisma.communityComment.create({
        data: {
          postId: post.id,
          authorId: commenter.id,
          content: "Insightful post!",
          status: "VISIBLE",
        },
      });
      await prisma.communityComment.create({
        data: {
          postId: post.id,
          authorId: author.id,
          content: "Thank you!",
          status: "VISIBLE",
        },
      });
      // Add a hidden comment (should not be counted)
      await prisma.communityComment.create({
        data: {
          postId: post.id,
          authorId: commenter.id,
          content: "Spam comment",
          status: "HIDDEN",
        },
      });

      // Read as Author (has not liked, is owner)
      const resAuthor = await request(app)
        .get(`/api/community/posts/${post.id}`)
        .set("Authorization", authorAuth)
        .expect(HTTP_STATUS.OK);

      expect(resAuthor.body.data.likeCount).toBe(1);
      expect(resAuthor.body.data.commentCount).toBe(2);
      expect(resAuthor.body.data.likedByCurrentUser).toBe(false);
      expect(resAuthor.body.data.ownedByCurrentUser).toBe(true);

      // Read as Liker (has liked, is not owner)
      const resLiker = await request(app)
        .get(`/api/community/posts/${post.id}`)
        .set("Authorization", likerAuth)
        .expect(HTTP_STATUS.OK);

      expect(resLiker.body.data.likeCount).toBe(1);
      expect(resLiker.body.data.commentCount).toBe(2);
      expect(resLiker.body.data.likedByCurrentUser).toBe(true);
      expect(resLiker.body.data.ownedByCurrentUser).toBe(false);
    });
  });

  // ============================================================================
  // AC-016, AC-017, AC-018: Owner Logical Removal & IDOR Protection
  // ============================================================================
  describe("Owner Logical Removal & Anti-Enumeration (AC-016..AC-018)", () => {
    it("allows owner to logically remove own post; transitions to REMOVED atomically", async () => {
      const user = await createTestUser("owner", "Post Owner");
      const authHeader = getAuthHeaderForUser(user.id);

      const post = await prisma.communityPost.create({
        data: {
          authorId: user.id,
          content: "Post to be logically removed",
          status: "VISIBLE",
        },
      });

      // Delete endpoint returns 204 No Content
      await request(app)
        .delete(`/api/community/posts/${post.id}`)
        .set("Authorization", authHeader)
        .expect(HTTP_STATUS.NO_CONTENT);

      // Verify row is NOT physically deleted, but logically marked REMOVED
      const dbPost = await prisma.communityPost.findUnique({
        where: { id: post.id },
      });
      expect(dbPost).not.toBeNull();
      expect(dbPost!.status).toBe("REMOVED");
      expect(dbPost!.removedAt).toBeInstanceOf(Date);

      // Subsequent detail read returns 404
      await request(app)
        .get(`/api/community/posts/${post.id}`)
        .set("Authorization", authHeader)
        .expect(HTTP_STATUS.NOT_FOUND);

      // Subsequent delete attempt returns safe 404
      await request(app)
        .delete(`/api/community/posts/${post.id}`)
        .set("Authorization", authHeader)
        .expect(HTTP_STATUS.NOT_FOUND);
    });

    it("rejects cross-user deletion attempt with safe 404 NOT_FOUND (IDOR protection)", async () => {
      const owner = await createTestUser("post_owner");
      const attacker = await createTestUser("attacker");

      const attackerAuth = getAuthHeaderForUser(attacker.id);

      const post = await prisma.communityPost.create({
        data: {
          authorId: owner.id,
          content: "Protected post",
          status: "VISIBLE",
        },
      });

      // Attacker attempts delete -> receives safe 404 NOT_FOUND
      const res = await request(app)
        .delete(`/api/community/posts/${post.id}`)
        .set("Authorization", attackerAuth)
        .expect(HTTP_STATUS.NOT_FOUND);

      expect(res.body.error.code).toBe(ERROR_CODES.NOT_FOUND);

      // Verify post was NOT modified in PostgreSQL
      const dbPost = await prisma.communityPost.findUnique({
        where: { id: post.id },
      });
      expect(dbPost!.status).toBe("VISIBLE");
      expect(dbPost!.removedAt).toBeNull();
    });

    it("rolls back atomic removal on forced transaction failure (AC-017, AC-020)", async () => {
      const user = await createTestUser("rollback_user");
      const post = await prisma.communityPost.create({
        data: {
          authorId: user.id,
          content: "Rollback verification post",
          status: "VISIBLE",
        },
      });

      const txRunner = new PrismaTransactionRunner(prisma);

      await expect(
        txRunner.run(async (ctx) => {
          await ctx.repositories.communityPostRepo.removePostIfOwner(post.id, user.id);
          throw new Error("Forced transaction failure for rollback testing");
        }),
      ).rejects.toThrow();

      // Verify post was rolled back to VISIBLE and removedAt remains null
      const dbPost = await prisma.communityPost.findUnique({
        where: { id: post.id },
      });
      expect(dbPost!.status).toBe("VISIBLE");
      expect(dbPost!.removedAt).toBeNull();
    });
  });
});
