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
import { HTTP_STATUS } from "@aura/shared";

describe("Phase 6 Parallel Integration Sanity Gate (FEAT-043 + FEAT-044)", () => {
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
  async function createTestUser(emailPrefix = "user", displayName = "Community Learner") {
    return prisma.user.create({
      data: {
        email: `${emailPrefix}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}@example.com`,
        displayName,
        status: "ACTIVE",
      },
    });
  }

  function getAuthHeader(user: { id: string; email: string }) {
    const { accessToken } = accessTokenService.issueAccessToken(user.id);
    return `Bearer ${accessToken}`;
  }

  // ============================================================================
  // Section 8: Comment + Like Integrated Interaction
  // ============================================================================
  describe("Section 8: Comment + Like Interaction", () => {
    it("dynamically reflects both commentCount and likeCount in post DTO simultaneously", async () => {
      const author = await createTestUser("author", "Author User");
      const learnerA = await createTestUser("learnerA", "Learner Alpha");
      const learnerB = await createTestUser("learnerB", "Learner Beta");

      const authorAuth = getAuthHeader(author);
      const learnerAAuth = getAuthHeader(learnerA);
      const learnerBAuth = getAuthHeader(learnerB);

      // 1. Create visible post
      const createPostRes = await request(app)
        .post("/api/community/posts")
        .set("Authorization", authorAuth)
        .send({ content: "Integrated sanity check post" })
        .expect(HTTP_STATUS.CREATED);

      const postId = createPostRes.body.data.id;
      expect(createPostRes.body.data.commentCount).toBe(0);
      expect(createPostRes.body.data.likeCount).toBe(0);
      expect(createPostRes.body.data.likedByCurrentUser).toBe(false);
      expect(createPostRes.body.data.ownedByCurrentUser).toBe(true);

      // 2. Create comment by Learner A
      const createCommentRes = await request(app)
        .post(`/api/community/posts/${postId}/comments`)
        .set("Authorization", learnerAAuth)
        .send({ content: "First great comment on this post!" })
        .expect(HTTP_STATUS.CREATED);

      const commentId = createCommentRes.body.data.id;

      // 3. Verify commentCount increases relationally to 1
      const postDetailAfterComment = await request(app)
        .get(`/api/community/posts/${postId}`)
        .set("Authorization", learnerAAuth)
        .expect(HTTP_STATUS.OK);

      expect(postDetailAfterComment.body.data.commentCount).toBe(1);
      expect(postDetailAfterComment.body.data.likeCount).toBe(0);
      expect(postDetailAfterComment.body.data.likedByCurrentUser).toBe(false);

      // 4. Like post by Learner A
      const likeRes = await request(app)
        .put(`/api/community/posts/${postId}/like`)
        .set("Authorization", learnerAAuth)
        .send({})
        .expect(HTTP_STATUS.OK);

      expect(likeRes.body.data).toEqual({
        postId,
        likedByCurrentUser: true,
        likeCount: 1,
      });

      // Verify post DTO reflects likeCount = 1, commentCount = 1, likedByCurrentUser = true for Learner A
      const postDetailAfterLikeA = await request(app)
        .get(`/api/community/posts/${postId}`)
        .set("Authorization", learnerAAuth)
        .expect(HTTP_STATUS.OK);

      expect(postDetailAfterLikeA.body.data.commentCount).toBe(1);
      expect(postDetailAfterLikeA.body.data.likeCount).toBe(1);
      expect(postDetailAfterLikeA.body.data.likedByCurrentUser).toBe(true);
      expect(postDetailAfterLikeA.body.data.ownedByCurrentUser).toBe(false);

      // Verify post DTO reflects likeCount = 1, commentCount = 1, likedByCurrentUser = false for Learner B
      const postDetailAfterLikeB = await request(app)
        .get(`/api/community/posts/${postId}`)
        .set("Authorization", learnerBAuth)
        .expect(HTTP_STATUS.OK);

      expect(postDetailAfterLikeB.body.data.commentCount).toBe(1);
      expect(postDetailAfterLikeB.body.data.likeCount).toBe(1);
      expect(postDetailAfterLikeB.body.data.likedByCurrentUser).toBe(false);

      // 5. Unlike post by Learner A
      const unlikeRes = await request(app)
        .delete(`/api/community/posts/${postId}/like`)
        .set("Authorization", learnerAAuth)
        .expect(HTTP_STATUS.OK);

      expect(unlikeRes.body.data).toEqual({
        postId,
        likedByCurrentUser: false,
        likeCount: 0,
      });

      // Verify post detail reflects likeCount = 0, likedByCurrentUser = false
      const postDetailAfterUnlike = await request(app)
        .get(`/api/community/posts/${postId}`)
        .set("Authorization", learnerAAuth)
        .expect(HTTP_STATUS.OK);

      expect(postDetailAfterUnlike.body.data.likeCount).toBe(0);
      expect(postDetailAfterUnlike.body.data.likedByCurrentUser).toBe(false);
      expect(postDetailAfterUnlike.body.data.commentCount).toBe(1);

      // 6. Logically remove comment by Learner A
      await request(app)
        .delete(`/api/community/comments/${commentId}`)
        .set("Authorization", learnerAAuth)
        .expect(HTTP_STATUS.NO_CONTENT);

      // 7. Verify commentCount decreases according to visible-comment semantics
      const postDetailAfterRemoveComment = await request(app)
        .get(`/api/community/posts/${postId}`)
        .set("Authorization", learnerAAuth)
        .expect(HTTP_STATUS.OK);

      expect(postDetailAfterRemoveComment.body.data.commentCount).toBe(0);
      expect(postDetailAfterRemoveComment.body.data.likeCount).toBe(0);

      // Verify feed read model also reflects both 0 counts
      const feedRes = await request(app)
        .get("/api/community/posts")
        .set("Authorization", learnerAAuth)
        .expect(HTTP_STATUS.OK);

      const feedPost = feedRes.body.data.find((p: any) => p.id === postId);
      expect(feedPost).toBeDefined();
      expect(feedPost.commentCount).toBe(0);
      expect(feedPost.likeCount).toBe(0);
      expect(feedPost.likedByCurrentUser).toBe(false);
    });
  });

  // ============================================================================
  // Section 9: Concurrency Regression
  // ============================================================================
  describe("Section 9: Concurrency Regression", () => {
    it("converges 5 concurrent same-user likes to exactly one durable row and does not affect comments", async () => {
      const author = await createTestUser("author9");
      const learner = await createTestUser("learner9");
      const authorAuth = getAuthHeader(author);
      const learnerAuth = getAuthHeader(learner);

      const postRes = await request(app)
        .post("/api/community/posts")
        .set("Authorization", authorAuth)
        .send({ content: "Concurrency test post" })
        .expect(HTTP_STATUS.CREATED);
      const postId = postRes.body.data.id;

      // Add a comment to ensure comments are untouched
      await request(app)
        .post(`/api/community/posts/${postId}/comments`)
        .set("Authorization", learnerAuth)
        .send({ content: "Concurrency baseline comment" })
        .expect(HTTP_STATUS.CREATED);

      // Execute 5 concurrent same-user likes
      const results = await Promise.all(
        Array.from({ length: 5 }, () =>
          request(app)
            .put(`/api/community/posts/${postId}/like`)
            .set("Authorization", learnerAuth)
            .send({}),
        ),
      );

      results.forEach((res) => {
        expect(res.status).toBe(HTTP_STATUS.OK);
        expect(res.body.data.likedByCurrentUser).toBe(true);
        expect(res.body.data.likeCount).toBe(1);
      });

      // Verify exactly one durable like row in DB
      const likeRows = await prisma.communityPostLike.findMany({
        where: { postId, userId: learner.id },
      });
      expect(likeRows).toHaveLength(1);

      // Verify comment rows remain unaffected (exactly 1 comment)
      const commentRows = await prisma.communityComment.findMany({
        where: { postId },
      });
      expect(commentRows).toHaveLength(1);
    });

    it("keeps distinct users independent with one row per user", async () => {
      const author = await createTestUser("author9b");
      const users = await Promise.all([
        createTestUser("u1"),
        createTestUser("u2"),
        createTestUser("u3"),
      ]);

      const postRes = await request(app)
        .post("/api/community/posts")
        .set("Authorization", getAuthHeader(author))
        .send({ content: "Multi-user like post" })
        .expect(HTTP_STATUS.CREATED);
      const postId = postRes.body.data.id;

      await Promise.all(
        users.map((u) =>
          request(app)
            .put(`/api/community/posts/${postId}/like`)
            .set("Authorization", getAuthHeader(u))
            .send({})
            .expect(HTTP_STATUS.OK),
        ),
      );

      const likeCount = await prisma.communityPostLike.count({
        where: { postId },
      });
      expect(likeCount).toBe(3);
    });

    it("executes repeated unlikes deterministically", async () => {
      const author = await createTestUser("author9c");
      const learner = await createTestUser("learner9c");
      const learnerAuth = getAuthHeader(learner);

      const postRes = await request(app)
        .post("/api/community/posts")
        .set("Authorization", getAuthHeader(author))
        .send({ content: "Repeated unlike post" })
        .expect(HTTP_STATUS.CREATED);
      const postId = postRes.body.data.id;

      // First unlike on unliked post
      const unliked1 = await request(app)
        .delete(`/api/community/posts/${postId}/like`)
        .set("Authorization", learnerAuth)
        .expect(HTTP_STATUS.OK);
      expect(unliked1.body.data).toEqual({
        postId,
        likedByCurrentUser: false,
        likeCount: 0,
      });

      // Like post
      await request(app)
        .put(`/api/community/posts/${postId}/like`)
        .set("Authorization", learnerAuth)
        .send({})
        .expect(HTTP_STATUS.OK);

      // Unlike post
      const unliked2 = await request(app)
        .delete(`/api/community/posts/${postId}/like`)
        .set("Authorization", learnerAuth)
        .expect(HTTP_STATUS.OK);
      expect(unliked2.body.data.likeCount).toBe(0);

      // Repeated unlike
      const unliked3 = await request(app)
        .delete(`/api/community/posts/${postId}/like`)
        .set("Authorization", learnerAuth)
        .expect(HTTP_STATUS.OK);
      expect(unliked3.body.data.likeCount).toBe(0);
      expect(unliked3.body.data.likedByCurrentUser).toBe(false);
    });
  });

  // ============================================================================
  // Section 10: Visibility Regression
  // ============================================================================
  describe("Section 10: Visibility Regression", () => {
    it("prevents comment or like on HIDDEN post, returning safe uniform 404 NOT_FOUND", async () => {
      const author = await createTestUser("author10h");
      const learner = await createTestUser("learner10h");
      const learnerAuth = getAuthHeader(learner);

      const post = await prisma.communityPost.create({
        data: {
          authorId: author.id,
          content: "Hidden post content",
          status: "HIDDEN",
        },
      });

      // Comment attempt on HIDDEN post -> 404
      const commentRes = await request(app)
        .post(`/api/community/posts/${post.id}/comments`)
        .set("Authorization", learnerAuth)
        .send({ content: "Attempt comment on hidden post" })
        .expect(HTTP_STATUS.NOT_FOUND);
      expect(commentRes.body.error.message).toBe("Post not found");

      // Like attempt on HIDDEN post -> 404
      const likeRes = await request(app)
        .put(`/api/community/posts/${post.id}/like`)
        .set("Authorization", learnerAuth)
        .send({})
        .expect(HTTP_STATUS.NOT_FOUND);
      expect(likeRes.body.error.message).toBe("Post not found");

      // Unlike attempt on HIDDEN post -> 404
      const unlikeRes = await request(app)
        .delete(`/api/community/posts/${post.id}/like`)
        .set("Authorization", learnerAuth)
        .expect(HTTP_STATUS.NOT_FOUND);
      expect(unlikeRes.body.error.message).toBe("Post not found");
    });

    it("prevents comment or like on REMOVED post, returning safe uniform 404 NOT_FOUND", async () => {
      const author = await createTestUser("author10r");
      const learner = await createTestUser("learner10r");
      const learnerAuth = getAuthHeader(learner);

      const post = await prisma.communityPost.create({
        data: {
          authorId: author.id,
          content: "Removed post content",
          status: "REMOVED",
          removedAt: new Date(),
        },
      });

      // Comment attempt on REMOVED post -> 404
      const commentRes = await request(app)
        .post(`/api/community/posts/${post.id}/comments`)
        .set("Authorization", learnerAuth)
        .send({ content: "Attempt comment on removed post" })
        .expect(HTTP_STATUS.NOT_FOUND);
      expect(commentRes.body.error.message).toBe("Post not found");

      // Like attempt on REMOVED post -> 404
      const likeRes = await request(app)
        .put(`/api/community/posts/${post.id}/like`)
        .set("Authorization", learnerAuth)
        .send({})
        .expect(HTTP_STATUS.NOT_FOUND);
      expect(likeRes.body.error.message).toBe("Post not found");

      // Unlike attempt on REMOVED post -> 404
      const unlikeRes = await request(app)
        .delete(`/api/community/posts/${post.id}/like`)
        .set("Authorization", learnerAuth)
        .expect(HTTP_STATUS.NOT_FOUND);
      expect(unlikeRes.body.error.message).toBe("Post not found");
    });
  });

  // ============================================================================
  // Section 11: Ownership Regression
  // ============================================================================
  describe("Section 11: Ownership Regression", () => {
    it("prevents User A from deleting User B comment (returns 404 NOT_FOUND)", async () => {
      const author = await createTestUser("author11a");
      const userA = await createTestUser("user11a");
      const userB = await createTestUser("user11b");

      const post = await prisma.communityPost.create({
        data: {
          authorId: author.id,
          content: "Post for comment ownership test",
          status: "VISIBLE",
        },
      });

      // User B creates a comment
      const commentRes = await request(app)
        .post(`/api/community/posts/${post.id}/comments`)
        .set("Authorization", getAuthHeader(userB))
        .send({ content: "User B's authentic comment" })
        .expect(HTTP_STATUS.CREATED);

      const commentId = commentRes.body.data.id;

      // User A attempts to delete User B's comment -> 404 NOT_FOUND (anti-enumeration & IDOR protection)
      const deleteRes = await request(app)
        .delete(`/api/community/comments/${commentId}`)
        .set("Authorization", getAuthHeader(userA))
        .expect(HTTP_STATUS.NOT_FOUND);

      expect(deleteRes.body.error.message).toBe("Comment not found");

      // Verify comment remains VISIBLE in database
      const dbComment = await prisma.communityComment.findUnique({
        where: { id: commentId },
      });
      expect(dbComment?.status).toBe("VISIBLE");
    });

    it("prevents User A from manipulating User B like relation; unlike is caller-scoped", async () => {
      const author = await createTestUser("author11l");
      const userA = await createTestUser("user11la");
      const userB = await createTestUser("user11lb");

      const post = await prisma.communityPost.create({
        data: {
          authorId: author.id,
          content: "Post for like ownership test",
          status: "VISIBLE",
        },
      });

      // User B likes the post
      await request(app)
        .put(`/api/community/posts/${post.id}/like`)
        .set("Authorization", getAuthHeader(userB))
        .send({})
        .expect(HTTP_STATUS.OK);

      // User A sends unlike on the post
      const unlikeRes = await request(app)
        .delete(`/api/community/posts/${post.id}/like`)
        .set("Authorization", getAuthHeader(userA))
        .expect(HTTP_STATUS.OK);

      // User A's call should report likeCount = 1 (User B still likes it) and likedByCurrentUser = false
      expect(unlikeRes.body.data).toEqual({
        postId: post.id,
        likedByCurrentUser: false,
        likeCount: 1,
      });

      // Verify User B's like still exists in DB
      const bLike = await prisma.communityPostLike.findUnique({
        where: {
          userId_postId: {
            userId: userB.id,
            postId: post.id,
          },
        },
      });
      expect(bLike).not.toBeNull();
    });

    it("enforces post removal is owner-only (User B cannot remove User A post)", async () => {
      const userA = await createTestUser("author11p");
      const userB = await createTestUser("attacker11p");

      const post = await prisma.communityPost.create({
        data: {
          authorId: userA.id,
          content: "User A post for post ownership test",
          status: "VISIBLE",
        },
      });

      // User B attempts to delete User A's post -> 404 NOT_FOUND
      const deleteRes = await request(app)
        .delete(`/api/community/posts/${post.id}`)
        .set("Authorization", getAuthHeader(userB))
        .expect(HTTP_STATUS.NOT_FOUND);

      expect(deleteRes.body.error.message).toBe("Post not found");

      // Verify post remains VISIBLE in DB
      const dbPost = await prisma.communityPost.findUnique({
        where: { id: post.id },
      });
      expect(dbPost?.status).toBe("VISIBLE");
    });
  });
});
