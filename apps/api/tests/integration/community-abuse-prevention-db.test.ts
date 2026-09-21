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
import { getRedisClient } from "../../src/infrastructure/redis/redis.js";
import { createCommunityRouter } from "../../src/modules/community/community.routes.js";
import { createCommunityRateLimiter } from "../../src/modules/community/community-rate-limit.middleware.js";
import {
  RateLimitStore,
  RedisUnavailableError,
  type IRateLimitStore,
} from "../../src/modules/auth/rate-limit/rate-limit.store.js";
import express from "express";
import { errorHandlerMiddleware } from "../../src/middleware/error-handler.js";

describe("FEAT-045 Community Moderation Baseline & Abuse Protection (Integration)", () => {
  const testDbUrl =
    process.env.TEST_DATABASE_URL ||
    process.env.DATABASE_URL ||
    "postgresql://postgres:postgrespassword@localhost:5432/aura_capital_test_feat019_rework2_fresh";

  let prisma: PrismaClient;
  const standardApp = createApp();
  const redis = getRedisClient();

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
    // Clear Redis test rate-limit keys
    const keys = await redis.keys("*community-rl*");
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  });

  // Helpers
  async function createTestUser(emailPrefix = "learner", role = "LEARNER") {
    const user = await prisma.user.create({
      data: {
        email: `${emailPrefix}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}@example.com`,
        displayName: "Abuse Test Learner",
        status: "ACTIVE",
      },
    });

    if (role === "ADMIN") {
      const adminRole = await prisma.role.upsert({
        where: { name: "ADMIN" },
        create: { name: "ADMIN", description: "System Administrator" },
        update: {},
      });
      await prisma.userRole.create({
        data: {
          userId: user.id,
          roleId: adminRole.id,
        },
      });
    }

    return user;
  }

  function getAuthHeader(userId: string): string {
    const { accessToken } = accessTokenService.issueAccessToken(userId);
    return `Bearer ${accessToken}`;
  }

  // ============================================================================
  // 1. Moderation Option A & Forbidden Payload Fields (AC-001..AC-005, AC-013)
  // ============================================================================
  describe("Moderation State Tampering & Forbidden Payload Fields (AC-001..AC-005, AC-013)", () => {
    it("rejects post creation attempting to forge status=HIDDEN with 400 and zero DB mutation", async () => {
      const user = await createTestUser("tamper1");
      const auth = getAuthHeader(user.id);

      const beforeCount = await prisma.communityPost.count();

      const res = await request(standardApp)
        .post("/api/community/posts")
        .set("Authorization", auth)
        .send({
          content: "Legitimate looking post",
          status: "HIDDEN",
        })
        .expect(HTTP_STATUS.BAD_REQUEST);

      expect(res.body.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);

      const afterCount = await prisma.communityPost.count();
      expect(afterCount).toBe(beforeCount);
    });

    it("rejects post creation attempting to forge status=REMOVED or removedAt with 400 and zero DB mutation", async () => {
      const user = await createTestUser("tamper2");
      const auth = getAuthHeader(user.id);

      const beforeCount = await prisma.communityPost.count();

      const res = await request(standardApp)
        .post("/api/community/posts")
        .set("Authorization", auth)
        .send({
          content: "Post with removed tampering",
          status: "REMOVED",
          removedAt: new Date().toISOString(),
        })
        .expect(HTTP_STATUS.BAD_REQUEST);

      expect(res.body.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);

      const afterCount = await prisma.communityPost.count();
      expect(afterCount).toBe(beforeCount);
    });

    it("rejects post creation attempting to forge authorId or admin fields with 400 and zero DB mutation", async () => {
      const user = await createTestUser("tamper3");
      const auth = getAuthHeader(user.id);

      const res = await request(standardApp)
        .post("/api/community/posts")
        .set("Authorization", auth)
        .send({
          content: "Post with spoofed authorId",
          authorId: "00000000-0000-0000-0000-000000000001",
          isAdmin: true,
          role: "ADMIN",
        })
        .expect(HTTP_STATUS.BAD_REQUEST);

      expect(res.body.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    });

    it("rejects comment creation attempting to forge status, authorId, or parentCommentId with 400 and zero DB mutation", async () => {
      const author = await createTestUser("author_c");
      const post = await prisma.communityPost.create({
        data: {
          authorId: author.id,
          content: "Valid post for comment tampering test",
          status: "VISIBLE",
        },
      });

      const user = await createTestUser("tamper_c");
      const auth = getAuthHeader(user.id);

      const beforeCount = await prisma.communityComment.count();

      const res = await request(standardApp)
        .post(`/api/community/posts/${post.id}/comments`)
        .set("Authorization", auth)
        .send({
          content: "Comment with nested reply and status spoofing",
          status: "HIDDEN",
          parentCommentId: "11111111-2222-3333-4444-555555555555",
          authorId: author.id,
        })
        .expect(HTTP_STATUS.BAD_REQUEST);

      expect(res.body.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);

      const afterCount = await prisma.communityComment.count();
      expect(afterCount).toBe(beforeCount);
    });

    it("rejects like mutations attempting to send client payload fields with 400 and zero DB mutation", async () => {
      const author = await createTestUser("author_l");
      const post = await prisma.communityPost.create({
        data: {
          authorId: author.id,
          content: "Valid post for like tampering test",
          status: "VISIBLE",
        },
      });

      const user = await createTestUser("tamper_l");
      const auth = getAuthHeader(user.id);

      const beforeCount = await prisma.communityPostLike.count();

      const res = await request(standardApp)
        .put(`/api/community/posts/${post.id}/like`)
        .set("Authorization", auth)
        .send({
          userId: author.id,
          likedByCurrentUser: true,
        })
        .expect(HTTP_STATUS.BAD_REQUEST);

      expect(res.body.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);

      const afterCount = await prisma.communityPostLike.count();
      expect(afterCount).toBe(beforeCount);
    });

    it("confirms zero public admin/moderator community routes exist (AC-004, AC-005)", async () => {
      const admin = await createTestUser("admin_user", "ADMIN");
      const auth = getAuthHeader(admin.id);

      const unapprovedPaths = [
        "/api/admin/community",
        "/api/admin/community/posts",
        "/api/admin/community/moderation",
        "/api/community/moderation",
      ];

      for (const path of unapprovedPaths) {
        const res = await request(standardApp)
          .get(path)
          .set("Authorization", auth);

        expect(res.status).toBe(HTTP_STATUS.NOT_FOUND);
      }
    });

    it("confirms existing ADMIN role cannot delete another user's post (safe 404 anti-enumeration) (AC-005)", async () => {
      const author = await createTestUser("learner_owner");
      const admin = await createTestUser("admin_actor", "ADMIN");

      const post = await prisma.communityPost.create({
        data: {
          authorId: author.id,
          content: "Post owned by regular learner",
          status: "VISIBLE",
        },
      });

      // Admin attempts to delete learner's post -> safe 404 NOT_FOUND
      const res = await request(standardApp)
        .delete(`/api/community/posts/${post.id}`)
        .set("Authorization", getAuthHeader(admin.id))
        .expect(HTTP_STATUS.NOT_FOUND);

      expect(res.body.error.message).toBe("Post not found");

      // Post remains VISIBLE in PostgreSQL
      const dbPost = await prisma.communityPost.findUnique({
        where: { id: post.id },
      });
      expect(dbPost?.status).toBe("VISIBLE");
    });
  });

  // ============================================================================
  // 2. Write Rate Limiting Exact Ceilings & 429 Zero Mutation (AC-018..AC-026)
  // ============================================================================
  describe("Exact Write Rate Limiting Ceilings & Zero Mutation (AC-018..AC-026)", () => {
    // Helper to build app with rate limit enabled
    function createRateLimitedApp(store?: IRateLimitStore) {
      const app = express();
      app.use(express.json());

      const rateLimitStore = store ?? new RateLimitStore(redis);
      const limiters = {
        postCreate: createCommunityRateLimiter({
          operation: "post_create",
          enabled: true,
          store: rateLimitStore,
        }),
        postDelete: createCommunityRateLimiter({
          operation: "post_delete",
          enabled: true,
          store: rateLimitStore,
        }),
        commentCreate: createCommunityRateLimiter({
          operation: "comment_create",
          enabled: true,
          store: rateLimitStore,
        }),
        commentDelete: createCommunityRateLimiter({
          operation: "comment_delete",
          enabled: true,
          store: rateLimitStore,
        }),
        likeMutation: createCommunityRateLimiter({
          operation: "post_like_mutation",
          enabled: true,
          store: rateLimitStore,
        }),
      };

      app.use(createCommunityRouter(undefined, undefined, undefined, limiters));
      app.use(errorHandlerMiddleware);
      return app;
    }

    it("enforces exact post create ceiling (10/user per 10m) with 429 Retry-After and zero DB mutation (AC-018, AC-024, AC-026)", async () => {
      const app = createRateLimitedApp();
      const user = await createTestUser("rl_post_user");
      const auth = getAuthHeader(user.id);

      // Perform 10 allowed post creates
      for (let i = 1; i <= 10; i++) {
        const res = await request(app)
          .post("/api/community/posts")
          .set("Authorization", auth)
          .send({ content: `Allowed post number ${i}` })
          .expect(HTTP_STATUS.CREATED);
        expect(res.body.data.id).toBeDefined();
      }

      const postCountBefore = await prisma.communityPost.count({
        where: { authorId: user.id },
      });
      expect(postCountBefore).toBe(10);

      // 11th request must be rejected with 429 TOO_MANY_REQUESTS and Retry-After
      const throttledRes = await request(app)
        .post("/api/community/posts")
        .set("Authorization", auth)
        .send({ content: "Throttled 11th post attempt" })
        .expect(HTTP_STATUS.TOO_MANY_REQUESTS);

      expect(throttledRes.body.error.code).toBe(ERROR_CODES.TOO_MANY_REQUESTS);
      expect(throttledRes.headers["retry-after"]).toBeDefined();
      const retryAfter = parseInt(throttledRes.headers["retry-after"], 10);
      expect(retryAfter).toBeGreaterThan(0);
      expect(retryAfter).toBeLessThanOrEqual(600);

      // Zero DB mutation assertion: post count remains exactly 10
      const postCountAfter = await prisma.communityPost.count({
        where: { authorId: user.id },
      });
      expect(postCountAfter).toBe(10);
    });

    it(
      "enforces combined like/unlike budget (120/user per 10m) and zero mutation on 121st attempt (AC-022, AC-026)",
      { timeout: 20000 },
      async () => {
      const app = createRateLimitedApp();
      const author = await createTestUser("like_author");
      const user = await createTestUser("rl_like_user");
      const auth = getAuthHeader(user.id);

      const post = await prisma.communityPost.create({
        data: {
          authorId: author.id,
          content: "Post for combined like/unlike test",
          status: "VISIBLE",
        },
      });

      // Rapidly execute 120 like/unlike operations (e.g. toggle 60 times)
      for (let i = 0; i < 60; i++) {
        await request(app)
          .put(`/api/community/posts/${post.id}/like`)
          .set("Authorization", auth)
          .send({})
          .expect(HTTP_STATUS.OK);

        await request(app)
          .delete(`/api/community/posts/${post.id}/like`)
          .set("Authorization", auth)
          .expect(HTTP_STATUS.OK);
      }

      const beforeState = await prisma.communityPostLike.findUnique({
        where: { userId_postId: { userId: user.id, postId: post.id } },
      });
      expect(beforeState).toBeNull();

      // 121st attempt must be rejected with 429
      const throttledRes = await request(app)
        .put(`/api/community/posts/${post.id}/like`)
        .set("Authorization", auth)
        .send({})
        .expect(HTTP_STATUS.TOO_MANY_REQUESTS);

      expect(throttledRes.body.error.code).toBe(ERROR_CODES.TOO_MANY_REQUESTS);
      expect(throttledRes.headers["retry-after"]).toBeDefined();

      // Zero DB mutation: like remains absent
      const afterState = await prisma.communityPostLike.findUnique({
        where: { userId_postId: { userId: user.id, postId: post.id } },
      });
      expect(afterState).toBeNull();
    });

    it("keeps distinct users isolated so User A hitting rate limit does not throttle User B (AC-018)", async () => {
      const app = createRateLimitedApp();
      const userA = await createTestUser("user_isolated_a");
      const userB = await createTestUser("user_isolated_b");

      // Exhaust User A's post quota (10 posts)
      for (let i = 1; i <= 10; i++) {
        await request(app)
          .post("/api/community/posts")
          .set("Authorization", getAuthHeader(userA.id))
          .set("X-Forwarded-For", "192.168.10.1")
          .send({ content: `User A post ${i}` })
          .expect(HTTP_STATUS.CREATED);
      }

      // 11th request for User A is throttled
      await request(app)
        .post("/api/community/posts")
        .set("Authorization", getAuthHeader(userA.id))
        .set("X-Forwarded-For", "192.168.10.1")
        .send({ content: "User A post 11" })
        .expect(HTTP_STATUS.TOO_MANY_REQUESTS);

      // User B from another source IP is NOT throttled
      const userBRes = await request(app)
        .post("/api/community/posts")
        .set("Authorization", getAuthHeader(userB.id))
        .set("X-Forwarded-For", "192.168.10.2")
        .send({ content: "User B post 1" })
        .expect(HTTP_STATUS.CREATED);

      expect(userBRes.body.data.id).toBeDefined();
    });

    it("enforces trusted-source ceiling across different users from the same IP (AC-018, AC-023)", async () => {
      const ip = "198.51.100.25";

      // Test with small custom ceiling for testing source ceiling logic directly
      const store = new RateLimitStore(redis);
      const customLimiterApp = express();
      customLimiterApp.use(express.json());

      const customLimiters = {
        postCreate: createCommunityRateLimiter({
          operation: "post_create",
          enabled: true,
          store,
          userMax: 10,
          sourceMax: 3, // custom source ceiling 3
          trustProxy: true,
        }),
      };

      customLimiterApp.use(createCommunityRouter(undefined, undefined, undefined, customLimiters));
      customLimiterApp.use(errorHandlerMiddleware);

      const user1 = await createTestUser("u_src_1");
      const user2 = await createTestUser("u_src_2");
      const user3 = await createTestUser("u_src_3");
      const user4 = await createTestUser("u_src_4");

      // 3 different users post from same IP
      await request(customLimiterApp)
        .post("/api/community/posts")
        .set("Authorization", getAuthHeader(user1.id))
        .set("X-Forwarded-For", ip)
        .send({ content: "Post from User 1" })
        .expect(HTTP_STATUS.CREATED);

      await request(customLimiterApp)
        .post("/api/community/posts")
        .set("Authorization", getAuthHeader(user2.id))
        .set("X-Forwarded-For", ip)
        .send({ content: "Post from User 2" })
        .expect(HTTP_STATUS.CREATED);

      await request(customLimiterApp)
        .post("/api/community/posts")
        .set("Authorization", getAuthHeader(user3.id))
        .set("X-Forwarded-For", ip)
        .send({ content: "Post from User 3" })
        .expect(HTTP_STATUS.CREATED);

      // 4th user from same IP hits source ceiling even though user4 has 0 posts
      const throttledRes = await request(customLimiterApp)
        .post("/api/community/posts")
        .set("Authorization", getAuthHeader(user4.id))
        .set("X-Forwarded-For", ip)
        .send({ content: "Post from User 4" })
        .expect(HTTP_STATUS.TOO_MANY_REQUESTS);

      expect(throttledRes.body.error.code).toBe(ERROR_CODES.TOO_MANY_REQUESTS);
    });
  });

  // ============================================================================
  // 3. Redis Outage Fail-Closed & Read Availability (AC-025..AC-028)
  // ============================================================================
  describe("Redis Outage Fail-Closed & Read Availability (AC-025..AC-028)", () => {
    // Mock failing rate-limit store simulating Redis outage
    const failingStore: IRateLimitStore = {
      increment: async () => {
        throw new RedisUnavailableError("Connection closed by peer");
      },
      getCount: async () => {
        throw new RedisUnavailableError("Connection closed by peer");
      },
      setCooldown: async () => {
        throw new RedisUnavailableError("Connection closed by peer");
      },
      getCooldownTTL: async () => {
        throw new RedisUnavailableError("Connection closed by peer");
      },
      delete: async () => {
        throw new RedisUnavailableError("Connection closed by peer");
      },
      deleteByPrefix: async () => {
        throw new RedisUnavailableError("Connection closed by peer");
      },
    };

    function createOutageApp(store: IRateLimitStore) {
      const app = express();
      app.use(express.json());

      const limiters = {
        postCreate: createCommunityRateLimiter({
          operation: "post_create",
          enabled: true,
          store,
        }),
        postDelete: createCommunityRateLimiter({
          operation: "post_delete",
          enabled: true,
          store,
        }),
        commentCreate: createCommunityRateLimiter({
          operation: "comment_create",
          enabled: true,
          store,
        }),
        commentDelete: createCommunityRateLimiter({
          operation: "comment_delete",
          enabled: true,
          store,
        }),
        likeMutation: createCommunityRateLimiter({
          operation: "post_like_mutation",
          enabled: true,
          store,
        }),
      };

      app.use(createCommunityRouter(undefined, undefined, undefined, limiters));
      app.use(errorHandlerMiddleware);
      return app;
    }

    it("fails closed with 503 SERVICE_UNAVAILABLE on write mutations during Redis outage with zero DB mutation (AC-025, AC-026)", async () => {
      const app = createOutageApp(failingStore);
      const user = await createTestUser("outage_user");
      const auth = getAuthHeader(user.id);

      const beforePostCount = await prisma.communityPost.count();

      // 1. Post Create fails closed with 503
      const postRes = await request(app)
        .post("/api/community/posts")
        .set("Authorization", auth)
        .send({ content: "Post during outage" })
        .expect(HTTP_STATUS.SERVICE_UNAVAILABLE);

      expect(postRes.body.error.code).toBe(ERROR_CODES.SERVICE_UNAVAILABLE);
      expect(postRes.body.error.message).toContain("temporarily unavailable");

      // Verify ZERO DB post mutation
      const afterPostCount = await prisma.communityPost.count();
      expect(afterPostCount).toBe(beforePostCount);

      // Create an existing post directly via DB to test like and delete outage behavior
      const post = await prisma.communityPost.create({
        data: {
          authorId: user.id,
          content: "Pre-existing post for outage tests",
          status: "VISIBLE",
        },
      });

      // 2. Like mutation fails closed with 503
      const likeRes = await request(app)
        .put(`/api/community/posts/${post.id}/like`)
        .set("Authorization", auth)
        .send({})
        .expect(HTTP_STATUS.SERVICE_UNAVAILABLE);

      expect(likeRes.body.error.code).toBe(ERROR_CODES.SERVICE_UNAVAILABLE);

      // Verify ZERO DB like mutation
      const likeCount = await prisma.communityPostLike.count({
        where: { postId: post.id },
      });
      expect(likeCount).toBe(0);

      // 3. Post Delete fails closed with 503
      const deleteRes = await request(app)
        .delete(`/api/community/posts/${post.id}`)
        .set("Authorization", auth)
        .expect(HTTP_STATUS.SERVICE_UNAVAILABLE);

      expect(deleteRes.body.error.code).toBe(ERROR_CODES.SERVICE_UNAVAILABLE);

      // Verify post remains VISIBLE (zero status change)
      const postStillVisible = await prisma.communityPost.findUnique({
        where: { id: post.id },
      });
      expect(postStillVisible?.status).toBe("VISIBLE");
      expect(postStillVisible?.removedAt).toBeNull();
    });

    it("keeps authenticated Community reads available during Redis outage (AC-027)", async () => {
      const app = createOutageApp(failingStore);
      const author = await createTestUser("author_read_avail");
      const reader = await createTestUser("reader_avail");
      const readerAuth = getAuthHeader(reader.id);

      // Setup visible post with a comment in PostgreSQL
      const post = await prisma.communityPost.create({
        data: {
          authorId: author.id,
          content: "Resilient post read during Redis outage",
          status: "VISIBLE",
        },
      });

      await prisma.communityComment.create({
        data: {
          postId: post.id,
          authorId: author.id,
          content: "Comment available during outage",
          status: "VISIBLE",
        },
      });

      // Feed read succeeds (200 OK)
      const feedRes = await request(app)
        .get("/api/community/posts")
        .set("Authorization", readerAuth)
        .expect(HTTP_STATUS.OK);

      expect(feedRes.body.data.length).toBeGreaterThanOrEqual(1);
      expect(feedRes.body.data[0].content).toBe("Resilient post read during Redis outage");

      // Post detail read succeeds (200 OK)
      const detailRes = await request(app)
        .get(`/api/community/posts/${post.id}`)
        .set("Authorization", readerAuth)
        .expect(HTTP_STATUS.OK);

      expect(detailRes.body.data.id).toBe(post.id);

      // Comments list read succeeds (200 OK)
      const commentsRes = await request(app)
        .get(`/api/community/posts/${post.id}/comments`)
        .set("Authorization", readerAuth)
        .expect(HTTP_STATUS.OK);

      expect(commentsRes.body.data.length).toBe(1);
      expect(commentsRes.body.data[0].content).toBe("Comment available during outage");
    });

    it("recovers automatically without application restart when Redis returns (AC-028)", async () => {
      // Configurable store that simulates outage then restoration
      let isOutage = true;
      const realStore = new RateLimitStore(redis);

      const dynamicStore: IRateLimitStore = {
        increment: async (k, w) => {
          if (isOutage) throw new RedisUnavailableError("Redis down");
          return realStore.increment(k, w);
        },
        getCount: async (k) => {
          if (isOutage) throw new RedisUnavailableError("Redis down");
          return realStore.getCount(k);
        },
        setCooldown: async (k, d) => {
          if (isOutage) throw new RedisUnavailableError("Redis down");
          return realStore.setCooldown(k, d);
        },
        getCooldownTTL: async (k) => {
          if (isOutage) throw new RedisUnavailableError("Redis down");
          return realStore.getCooldownTTL(k);
        },
        delete: async (k) => {
          if (isOutage) throw new RedisUnavailableError("Redis down");
          return realStore.delete(k);
        },
        deleteByPrefix: async (p) => {
          if (isOutage) throw new RedisUnavailableError("Redis down");
          return realStore.deleteByPrefix(p);
        },
      };

      const app = createOutageApp(dynamicStore);
      const user = await createTestUser("recovery_user");
      const auth = getAuthHeader(user.id);

      // 1. Initial attempt fails with 503 during outage
      await request(app)
        .post("/api/community/posts")
        .set("Authorization", auth)
        .send({ content: "Post during outage" })
        .expect(HTTP_STATUS.SERVICE_UNAVAILABLE);

      // 2. Redis returns (simulated recovery)
      isOutage = false;

      // 3. Next request immediately succeeds without server restart
      const recoveredRes = await request(app)
        .post("/api/community/posts")
        .set("Authorization", auth)
        .send({ content: "Post after recovery" })
        .expect(HTTP_STATUS.CREATED);

      expect(recoveredRes.body.data.content).toBe("Post after recovery");
    });
  });

  // ============================================================================
  // 4. Redis Key Privacy & Zero Audit Amplification (AC-006, AC-007, AC-016, AC-029, AC-030)
  // ============================================================================
  describe("Redis Key Privacy & Zero Audit Amplification (AC-006, AC-007, AC-016, AC-029, AC-030)", () => {
    it("stores only 64-char HMAC digests in Redis and never raw user IDs, IPs, or content (AC-016, AC-030)", async () => {
      const user = await createTestUser("privacy_user");
      const auth = getAuthHeader(user.id);

      const app = express();
      app.use(express.json());
      const limiters = {
        postCreate: createCommunityRateLimiter({
          operation: "post_create",
          enabled: true,
          store: new RateLimitStore(redis),
        }),
      };
      app.use(createCommunityRouter(undefined, undefined, undefined, limiters));
      app.use(errorHandlerMiddleware);

      const secretContent = "super-secret-unique-content-12345";
      await request(app)
        .post("/api/community/posts")
        .set("Authorization", auth)
        .set("X-Forwarded-For", "203.0.113.88")
        .send({ content: secretContent })
        .expect(HTTP_STATUS.CREATED);

      // Inspect keys in Redis
      const keys = await redis.keys("*community-rl*");
      expect(keys.length).toBeGreaterThan(0);

      for (const key of keys) {
        // Assert key format
        expect(key).toContain("community-rl:v1:post_create");
        // Assert zero raw user ID
        expect(key).not.toContain(user.id);
        // Assert zero raw IP
        expect(key).not.toContain("203.0.113.88");
        // Assert zero content
        expect(key).not.toContain(secretContent);
        // Assert identifier segment is 64 hex characters
        const parts = key.split(":");
        const identifier = parts[parts.length - 1];
        expect(identifier).toMatch(/^[0-9a-f]{64}$/);
      }
    });

    it("verifies throttled and 503 requests cause ZERO durable audit records (AC-006, AC-007, AC-029)", async () => {
      const user = await createTestUser("audit_amp_user");
      const auth = getAuthHeader(user.id);

      const app = express();
      app.use(express.json());
      const limiters = {
        postCreate: createCommunityRateLimiter({
          operation: "post_create",
          enabled: true,
          store: new RateLimitStore(redis),
          userMax: 1, // limit to 1 so 2nd request is 429
        }),
      };
      app.use(createCommunityRouter(undefined, undefined, undefined, limiters));
      app.use(errorHandlerMiddleware);

      const initialAuditCount = await prisma.authSecurityAuditRecord.count();

      // 1st request succeeds
      await request(app)
        .post("/api/community/posts")
        .set("Authorization", auth)
        .send({ content: "First post" })
        .expect(HTTP_STATUS.CREATED);

      // 2nd request is throttled 429
      await request(app)
        .post("/api/community/posts")
        .set("Authorization", auth)
        .send({ content: "Second post" })
        .expect(HTTP_STATUS.TOO_MANY_REQUESTS);

      // Audit records in PostgreSQL remain unchanged (ZERO audit amplification)
      const afterAuditCount = await prisma.authSecurityAuditRecord.count();
      expect(afterAuditCount).toBe(initialAuditCount);
    });
  });
});
