import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { PrismaClient, type Prisma } from "@prisma/client";
import { createApp } from "../../src/server.js";
import { accessTokenService } from "../../src/modules/auth/access-token.service.js";
import { CommunityPostLikeService } from "../../src/modules/community/community-post-like.service.js";
import {
  createRepositoryContainer,
  type IRepositoryContainer,
} from "../../src/infrastructure/database/repository-factory.js";
import { PrismaTransactionRunner } from "../../src/infrastructure/database/transaction-runner.js";
import { AppError } from "../../src/shared/errors/error-envelope.js";
import {
  assertSafeTestDatabase,
  cleanAllTestTables,
  sanitizeDiagnosticMessage,
} from "../helpers/test-db-guard.js";

describe("FEAT-044 post like relational semantics (PostgreSQL)", () => {
  const testDbUrl = process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL ?? "";
  const prisma = new PrismaClient({ datasources: { db: { url: testDbUrl } } });
  const app = createApp();

  beforeAll(async () => {
    assertSafeTestDatabase(testDbUrl, "test");
    try {
      await prisma.$connect();
    } catch (error: unknown) {
      throw new Error(
        `[DB_CONNECTION_FAILED] ${sanitizeDiagnosticMessage(
          error instanceof Error ? error.message : String(error),
        )}`,
      );
    }
  });

  beforeEach(async () => {
    await cleanAllTestTables(prisma);
  });

  afterAll(async () => {
    await cleanAllTestTables(prisma);
    await prisma.$disconnect();
  });

  async function createUser(prefix: string) {
    return prisma.user.create({
      data: {
        email: `${prefix}_${crypto.randomUUID()}@example.com`,
        displayName: prefix,
        status: "ACTIVE",
      },
    });
  }

  async function createPost(authorId: string, status: "VISIBLE" | "HIDDEN" | "REMOVED" = "VISIBLE") {
    return prisma.communityPost.create({
      data: {
        authorId,
        content: `Post ${crypto.randomUUID()}`,
        status,
        removedAt: status === "REMOVED" ? new Date() : null,
      },
    });
  }

  function authorization(userId: string): string {
    return `Bearer ${accessTokenService.issueAccessToken(userId).accessToken}`;
  }

  it("makes first and repeated likes idempotent with one durable relation", async () => {
    const user = await createUser("idempotent");
    const post = await createPost(user.id);

    for (let attempt = 0; attempt < 2; attempt += 1) {
      const response = await request(app)
        .put(`/api/community/posts/${post.id}/like`)
        .set("Authorization", authorization(user.id))
        .send({})
        .expect(200);

      expect(response.body).toEqual({
        data: { postId: post.id, likedByCurrentUser: true, likeCount: 1 },
      });
    }

    expect(await prisma.communityPostLike.count({ where: { userId: user.id, postId: post.id } })).toBe(1);
  });

  it("converges five concurrent same-user likes to exactly one durable relation", async () => {
    const user = await createUser("concurrent_same");
    const post = await createPost(user.id);
    const auth = authorization(user.id);

    const responses = await Promise.all(
      Array.from({ length: 5 }, () =>
        request(app).put(`/api/community/posts/${post.id}/like`).set("Authorization", auth).send({}),
      ),
    );

    expect(responses.every((response) => response.status === 200)).toBe(true);
    expect(responses.every((response) => response.body.data.likedByCurrentUser === true)).toBe(true);
    expect(await prisma.communityPostLike.count({ where: { userId: user.id, postId: post.id } })).toBe(1);
  });

  it("keeps distinct users independent while deriving an accurate relational count", async () => {
    const author = await createUser("author");
    const users = await Promise.all([createUser("liker_a"), createUser("liker_b"), createUser("liker_c")]);
    const post = await createPost(author.id);

    await Promise.all(
      users.map((user) =>
        request(app)
          .put(`/api/community/posts/${post.id}/like`)
          .set("Authorization", authorization(user.id))
          .send({})
          .expect(200),
      ),
    );

    expect(await prisma.communityPostLike.count({ where: { postId: post.id } })).toBe(3);
    for (const user of users) {
      expect(await prisma.communityPostLike.count({ where: { postId: post.id, userId: user.id } })).toBe(1);
    }
  });

  it("unlikes only the authenticated user's relation and repeated unlike remains successful", async () => {
    const author = await createUser("unlike_author");
    const first = await createUser("unlike_first");
    const second = await createUser("unlike_second");
    const post = await createPost(author.id);
    await prisma.communityPostLike.createMany({
      data: [
        { postId: post.id, userId: first.id },
        { postId: post.id, userId: second.id },
      ],
    });

    for (let attempt = 0; attempt < 2; attempt += 1) {
      const response = await request(app)
        .delete(`/api/community/posts/${post.id}/like`)
        .set("Authorization", authorization(first.id))
        .send({})
        .expect(200);

      expect(response.body.data).toEqual({
        postId: post.id,
        likedByCurrentUser: false,
        likeCount: 1,
      });
    }

    expect(await prisma.communityPostLike.count({ where: { postId: post.id, userId: first.id } })).toBe(0);
    expect(await prisma.communityPostLike.count({ where: { postId: post.id, userId: second.id } })).toBe(1);
  });

  it("returns the same safe not-found contract for missing, hidden, and removed posts without mutation", async () => {
    const user = await createUser("visibility");
    const hidden = await createPost(user.id, "HIDDEN");
    const removed = await createPost(user.id, "REMOVED");
    const targets = [crypto.randomUUID(), hidden.id, removed.id];

    for (const postId of targets) {
      await request(app)
        .put(`/api/community/posts/${postId}/like`)
        .set("Authorization", authorization(user.id))
        .send({})
        .expect(404);
      await request(app)
        .delete(`/api/community/posts/${postId}/like`)
        .set("Authorization", authorization(user.id))
        .send({})
        .expect(404);
    }

    expect(await prisma.communityPostLike.count()).toBe(0);
  });

  it("rejects forged request bodies before any durable mutation", async () => {
    const author = await createUser("forged_author");
    const attacker = await createUser("forged_attacker");
    const post = await createPost(author.id);

    await request(app)
      .put(`/api/community/posts/${post.id}/like`)
      .set("Authorization", authorization(attacker.id))
      .send({ userId: author.id, likeCount: 999 })
      .expect(400);

    expect(await prisma.communityPostLike.count()).toBe(0);
  });

  it("reflects canonical relational like state immediately in feed and detail reads", async () => {
    const author = await createUser("read_author");
    const liker = await createUser("read_liker");
    const post = await createPost(author.id);
    const auth = authorization(liker.id);

    await request(app).put(`/api/community/posts/${post.id}/like`).set("Authorization", auth).send({}).expect(200);

    const detail = await request(app)
      .get(`/api/community/posts/${post.id}`)
      .set("Authorization", auth)
      .expect(200);
    const feed = await request(app).get("/api/community/posts").set("Authorization", auth).expect(200);

    expect(detail.body.data.likeCount).toBe(1);
    expect(detail.body.data.likedByCurrentUser).toBe(true);
    expect(feed.body.data[0].likeCount).toBe(1);
    expect(feed.body.data[0].likedByCurrentUser).toBe(true);
  });

  it("rolls back a created like when the canonical state read fails and exposes only a safe DB error", async () => {
    const user = await createUser("rollback");
    const post = await createPost(user.id);
    const runner = new PrismaTransactionRunner(
      prisma,
      (client: PrismaClient | Prisma.TransactionClient): IRepositoryContainer => {
        const repositories = createRepositoryContainer(client);
        const failingLikeRepository = new Proxy(repositories.communityPostLikeRepo, {
          get(target, property, receiver) {
            if (property === "getLikeState") {
              return async () => {
                throw new Error("postgresql://private:secret@internal:5432/hidden raw SQL");
              };
            }
            const value = Reflect.get(target, property, receiver);
            return typeof value === "function" ? value.bind(target) : value;
          },
        });

        return new Proxy(repositories, {
          get(target, property, receiver) {
            if (property === "communityPostLikeRepo") return failingLikeRepository;
            return Reflect.get(target, property, receiver);
          },
        });
      },
    );
    const service = new CommunityPostLikeService(runner);

    let thrown: unknown;
    try {
      await service.likePost(post.id, user.id);
    } catch (error: unknown) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(AppError);
    expect((thrown as AppError).message).toBe("Database operation failed");
    expect((thrown as AppError).message).not.toContain("postgresql://");
    expect((thrown as AppError).message).not.toContain("raw SQL");
    expect(await prisma.communityPostLike.count({ where: { postId: post.id, userId: user.id } })).toBe(0);
  });
});
