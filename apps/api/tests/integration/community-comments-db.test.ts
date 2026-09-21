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
import { ERROR_CODES, HTTP_STATUS } from "@aura/shared";

describe("FEAT-043 Community Comments API Live PostgreSQL (Integration)", () => {
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

  // Helpers
  async function createTestUser(emailPrefix = "commenter", displayName?: string | null) {
    return prisma.user.create({
      data: {
        email: `${emailPrefix}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}@example.com`,
        displayName: displayName !== undefined ? displayName : "Community Learner",
        status: "ACTIVE",
      },
    });
  }

  function getAuthHeaderForUser(userId: string): string {
    const { accessToken } = accessTokenService.issueAccessToken(userId);
    return `Bearer ${accessToken}`;
  }

  async function createTestPost(authorId: string, status: "VISIBLE" | "HIDDEN" | "REMOVED" = "VISIBLE") {
    return prisma.communityPost.create({
      data: {
        authorId,
        content: "Discussion post on portfolio diversification",
        status,
        removedAt: status === "REMOVED" ? new Date() : null,
      },
    });
  }

  // ============================================================================
  // 1. Comment Creation & Parent Post Visibility Gate
  // ============================================================================
  describe("Comment Creation & Parent Visibility Gate", () => {
    it("persists comment with server-derived author, VISIBLE status, and timestamps", async () => {
      const author = await createTestUser("alice", "Alice Learner");
      const post = await createTestPost(author.id, "VISIBLE");

      const commenter = await createTestUser("bob", "Bob Contributor");
      const authHeader = getAuthHeaderForUser(commenter.id);

      const content = "Very thoughtful analysis on defensive allocation.";
      const res = await request(app)
        .post(`/api/community/posts/${post.id}/comments`)
        .set("Authorization", authHeader)
        .send({ content })
        .expect(HTTP_STATUS.CREATED);

      expect(res.body.data).toBeDefined();
      const comment = res.body.data;
      expect(comment.id).toBeDefined();
      expect(comment.content).toBe(content);
      expect(comment.author.displayName).toBe("Bob Contributor");
      expect(comment.ownedByCurrentUser).toBe(true);
      expect(comment.createdAt).toBeDefined();

      // Direct PostgreSQL durability
      const dbComment = await prisma.communityComment.findUnique({
        where: { id: comment.id },
      });
      expect(dbComment).not.toBeNull();
      expect(dbComment!.postId).toBe(post.id);
      expect(dbComment!.authorId).toBe(commenter.id);
      expect(dbComment!.status).toBe("VISIBLE");
      expect(dbComment!.removedAt).toBeNull();
      expect(dbComment!.createdAt).toBeInstanceOf(Date);
    });

    it("increments post relational commentCount upon comment creation", async () => {
      const author = await createTestUser("author");
      const post = await createTestPost(author.id, "VISIBLE");
      const commenter = await createTestUser("commenter");
      const authHeader = getAuthHeaderForUser(commenter.id);

      // Check post detail has commentCount = 0 initially
      const initialPostRes = await request(app)
        .get(`/api/community/posts/${post.id}`)
        .set("Authorization", authHeader)
        .expect(HTTP_STATUS.OK);
      expect(initialPostRes.body.data.commentCount).toBe(0);

      // Post first comment
      await request(app)
        .post(`/api/community/posts/${post.id}/comments`)
        .set("Authorization", authHeader)
        .send({ content: "First comment" })
        .expect(HTTP_STATUS.CREATED);

      // Post second comment
      await request(app)
        .post(`/api/community/posts/${post.id}/comments`)
        .set("Authorization", authHeader)
        .send({ content: "Second comment" })
        .expect(HTTP_STATUS.CREATED);

      // Check post detail has commentCount = 2
      const updatedPostRes = await request(app)
        .get(`/api/community/posts/${post.id}`)
        .set("Authorization", authHeader)
        .expect(HTTP_STATUS.OK);
      expect(updatedPostRes.body.data.commentCount).toBe(2);
    });

    it("rejects comment creation on nonexistent postId with 404 NOT_FOUND", async () => {
      const commenter = await createTestUser("commenter");
      const authHeader = getAuthHeaderForUser(commenter.id);
      const fakePostId = "00000000-0000-0000-0000-000000000099";

      const res = await request(app)
        .post(`/api/community/posts/${fakePostId}/comments`)
        .set("Authorization", authHeader)
        .send({ content: "Comment on ghost post" })
        .expect(HTTP_STATUS.NOT_FOUND);

      expect(res.body.error.code).toBe(ERROR_CODES.NOT_FOUND);
    });

    it("rejects comment creation on HIDDEN post with safe 404 NOT_FOUND", async () => {
      const author = await createTestUser("author");
      const hiddenPost = await createTestPost(author.id, "HIDDEN");
      const commenter = await createTestUser("commenter");
      const authHeader = getAuthHeaderForUser(commenter.id);

      const res = await request(app)
        .post(`/api/community/posts/${hiddenPost.id}/comments`)
        .set("Authorization", authHeader)
        .send({ content: "Comment on hidden post" })
        .expect(HTTP_STATUS.NOT_FOUND);

      expect(res.body.error.code).toBe(ERROR_CODES.NOT_FOUND);
    });

    it("rejects comment creation on REMOVED post with safe 404 NOT_FOUND", async () => {
      const author = await createTestUser("author");
      const removedPost = await createTestPost(author.id, "REMOVED");
      const commenter = await createTestUser("commenter");
      const authHeader = getAuthHeaderForUser(commenter.id);

      const res = await request(app)
        .post(`/api/community/posts/${removedPost.id}/comments`)
        .set("Authorization", authHeader)
        .send({ content: "Comment on removed post" })
        .expect(HTTP_STATUS.NOT_FOUND);

      expect(res.body.error.code).toBe(ERROR_CODES.NOT_FOUND);
    });
  });

  // ============================================================================
  // 2. Ascending Deterministic Ordering, Filtering & Pagination
  // ============================================================================
  describe("Comment Feed Read, Ascending Order & Pagination", () => {
    it("returns comments strictly in createdAt ASC, id ASC chronological order", async () => {
      const author = await createTestUser("post_author");
      const post = await createTestPost(author.id, "VISIBLE");
      const commenter = await createTestUser("feed_reader");
      const authHeader = getAuthHeaderForUser(commenter.id);

      // Create 5 comments with sequential timestamps
      const baseTime = Date.now();
      const createdComments = [];
      for (let i = 1; i <= 5; i++) {
        const comment = await prisma.communityComment.create({
          data: {
            postId: post.id,
            authorId: commenter.id,
            content: `Comment ${i}`,
            status: "VISIBLE",
            createdAt: new Date(baseTime + i * 1000),
          },
        });
        createdComments.push(comment);
      }

      const res = await request(app)
        .get(`/api/community/posts/${post.id}/comments`)
        .set("Authorization", authHeader)
        .expect(HTTP_STATUS.OK);

      expect(res.body.data.length).toBe(5);
      expect(res.body.pageInfo.hasNextPage).toBe(false);
      expect(res.body.pageInfo.nextCursor).toBeNull();

      // Oldest first: Comment 1 first, Comment 5 last
      expect(res.body.data[0].id).toBe(createdComments[0].id);
      expect(res.body.data[0].content).toBe("Comment 1");
      expect(res.body.data[4].id).toBe(createdComments[4].id);
      expect(res.body.data[4].content).toBe("Comment 5");
    });

    it("paginates forward deterministically via opaque cursor across identical timestamps", async () => {
      const author = await createTestUser("author");
      const post = await createTestPost(author.id, "VISIBLE");
      const commenter = await createTestUser("paginator");
      const authHeader = getAuthHeaderForUser(commenter.id);

      const fixedDate = new Date("2026-09-20T16:00:00.000Z");

      // 4 comments at identical timestamp
      const comments = await Promise.all([
        prisma.communityComment.create({
          data: { postId: post.id, authorId: commenter.id, content: "Comment A", status: "VISIBLE", createdAt: fixedDate },
        }),
        prisma.communityComment.create({
          data: { postId: post.id, authorId: commenter.id, content: "Comment B", status: "VISIBLE", createdAt: fixedDate },
        }),
        prisma.communityComment.create({
          data: { postId: post.id, authorId: commenter.id, content: "Comment C", status: "VISIBLE", createdAt: fixedDate },
        }),
        prisma.communityComment.create({
          data: { postId: post.id, authorId: commenter.id, content: "Comment D", status: "VISIBLE", createdAt: fixedDate },
        }),
      ]);

      // Sorted by id ASC
      const sortedIds = comments.map((c) => c.id).sort();

      // Request page 1 with limit = 2
      const page1Res = await request(app)
        .get(`/api/community/posts/${post.id}/comments?limit=2`)
        .set("Authorization", authHeader)
        .expect(HTTP_STATUS.OK);

      expect(page1Res.body.data.length).toBe(2);
      expect(page1Res.body.pageInfo.hasNextPage).toBe(true);
      expect(page1Res.body.pageInfo.nextCursor).toBeTruthy();
      expect(page1Res.body.data[0].id).toBe(sortedIds[0]);
      expect(page1Res.body.data[1].id).toBe(sortedIds[1]);

      // Request page 2 using cursor
      const cursor = page1Res.body.pageInfo.nextCursor;
      const page2Res = await request(app)
        .get(`/api/community/posts/${post.id}/comments?limit=2&cursor=${cursor}`)
        .set("Authorization", authHeader)
        .expect(HTTP_STATUS.OK);

      expect(page2Res.body.data.length).toBe(2);
      expect(page2Res.body.pageInfo.hasNextPage).toBe(false);
      expect(page2Res.body.pageInfo.nextCursor).toBeNull();
      expect(page2Res.body.data[0].id).toBe(sortedIds[2]);
      expect(page2Res.body.data[1].id).toBe(sortedIds[3]);
    });

    it("filters out HIDDEN and REMOVED comments from the comments feed", async () => {
      const author = await createTestUser("author");
      const post = await createTestPost(author.id, "VISIBLE");
      const commenter = await createTestUser("commenter");
      const authHeader = getAuthHeaderForUser(commenter.id);

      // Create 1 visible, 1 hidden, 1 removed
      const visible = await prisma.communityComment.create({
        data: { postId: post.id, authorId: commenter.id, content: "Visible comment", status: "VISIBLE" },
      });
      await prisma.communityComment.create({
        data: { postId: post.id, authorId: commenter.id, content: "Hidden comment", status: "HIDDEN" },
      });
      await prisma.communityComment.create({
        data: { postId: post.id, authorId: commenter.id, content: "Removed comment", status: "REMOVED", removedAt: new Date() },
      });

      const res = await request(app)
        .get(`/api/community/posts/${post.id}/comments`)
        .set("Authorization", authHeader)
        .expect(HTTP_STATUS.OK);

      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].id).toBe(visible.id);
      expect(res.body.data[0].content).toBe("Visible comment");
    });

    it("returns 404 NOT_FOUND when requesting comments for a nonexistent or hidden post", async () => {
      const author = await createTestUser("author");
      const hiddenPost = await createTestPost(author.id, "HIDDEN");
      const commenter = await createTestUser("commenter");
      const authHeader = getAuthHeaderForUser(commenter.id);

      const res = await request(app)
        .get(`/api/community/posts/${hiddenPost.id}/comments`)
        .set("Authorization", authHeader)
        .expect(HTTP_STATUS.NOT_FOUND);

      expect(res.body.error.code).toBe(ERROR_CODES.NOT_FOUND);
    });
  });

  // ============================================================================
  // 3. Owner-Only Logical Removal & Relational Count Decrement
  // ============================================================================
  describe("Owner-Only Logical Removal & IDOR Protection", () => {
    it("allows comment author to logically remove their comment and decrements post commentCount", async () => {
      const postAuthor = await createTestUser("post_author");
      const post = await createTestPost(postAuthor.id, "VISIBLE");

      const commenter = await createTestUser("commenter_owner");
      const authHeader = getAuthHeaderForUser(commenter.id);

      const comment = await prisma.communityComment.create({
        data: {
          postId: post.id,
          authorId: commenter.id,
          content: "Original valuable observation",
          status: "VISIBLE",
        },
      });

      // Verify post has commentCount = 1
      const preDeletePost = await request(app)
        .get(`/api/community/posts/${post.id}`)
        .set("Authorization", authHeader)
        .expect(HTTP_STATUS.OK);
      expect(preDeletePost.body.data.commentCount).toBe(1);

      // Logically remove comment
      await request(app)
        .delete(`/api/community/comments/${comment.id}`)
        .set("Authorization", authHeader)
        .expect(HTTP_STATUS.NO_CONTENT);

      // Verify direct PostgreSQL state: status = REMOVED, removedAt != null, physical row preserved
      const dbComment = await prisma.communityComment.findUnique({
        where: { id: comment.id },
      });
      expect(dbComment).not.toBeNull();
      expect(dbComment!.status).toBe("REMOVED");
      expect(dbComment!.removedAt).toBeInstanceOf(Date);

      // Post commentCount is now 0
      const postDeletePost = await request(app)
        .get(`/api/community/posts/${post.id}`)
        .set("Authorization", authHeader)
        .expect(HTTP_STATUS.OK);
      expect(postDeletePost.body.data.commentCount).toBe(0);

      // Comment feed for the post now returns empty
      const feedRes = await request(app)
        .get(`/api/community/posts/${post.id}/comments`)
        .set("Authorization", authHeader)
        .expect(HTTP_STATUS.OK);
      expect(feedRes.body.data.length).toBe(0);
    });

    it("rejects non-owner attempt to delete comment with safe 404 NOT_FOUND (IDOR protection)", async () => {
      const postAuthor = await createTestUser("post_author");
      const post = await createTestPost(postAuthor.id, "VISIBLE");

      const legitimateOwner = await createTestUser("legit_owner");
      const attacker = await createTestUser("attacker");
      const attackerHeader = getAuthHeaderForUser(attacker.id);

      const comment = await prisma.communityComment.create({
        data: {
          postId: post.id,
          authorId: legitimateOwner.id,
          content: "Protected comment",
          status: "VISIBLE",
        },
      });

      // Attacker attempts delete
      const res = await request(app)
        .delete(`/api/community/comments/${comment.id}`)
        .set("Authorization", attackerHeader)
        .expect(HTTP_STATUS.NOT_FOUND);

      expect(res.body.error.code).toBe(ERROR_CODES.NOT_FOUND);

      // Verify comment remains VISIBLE in PostgreSQL
      const dbComment = await prisma.communityComment.findUnique({
        where: { id: comment.id },
      });
      expect(dbComment!.status).toBe("VISIBLE");
      expect(dbComment!.removedAt).toBeNull();
    });

    it("returns 404 NOT_FOUND on repeated deletion of already REMOVED comment", async () => {
      const postAuthor = await createTestUser("author");
      const post = await createTestPost(postAuthor.id, "VISIBLE");

      const commenter = await createTestUser("commenter");
      const authHeader = getAuthHeaderForUser(commenter.id);

      const comment = await prisma.communityComment.create({
        data: {
          postId: post.id,
          authorId: commenter.id,
          content: "To be removed twice",
          status: "VISIBLE",
        },
      });

      // First delete succeeds (204)
      await request(app)
        .delete(`/api/community/comments/${comment.id}`)
        .set("Authorization", authHeader)
        .expect(HTTP_STATUS.NO_CONTENT);

      // Second delete returns 404 NOT_FOUND
      const res2 = await request(app)
        .delete(`/api/community/comments/${comment.id}`)
        .set("Authorization", authHeader)
        .expect(HTTP_STATUS.NOT_FOUND);

      expect(res2.body.error.code).toBe(ERROR_CODES.NOT_FOUND);
    });

    it("returns 404 NOT_FOUND when attempting to delete a nonexistent commentId", async () => {
      const user = await createTestUser("user");
      const authHeader = getAuthHeaderForUser(user.id);
      const ghostCommentId = "00000000-0000-0000-0000-000000000999";

      const res = await request(app)
        .delete(`/api/community/comments/${ghostCommentId}`)
        .set("Authorization", authHeader)
        .expect(HTTP_STATUS.NOT_FOUND);

      expect(res.body.error.code).toBe(ERROR_CODES.NOT_FOUND);
    });
  });
});
