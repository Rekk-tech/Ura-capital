import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "../../src/features/auth/context/AuthContext";
import { CommunityRoutes } from "../../src/app/router/community-routes";
import { communityApi } from "../../src/api/community.api";
import http from "node:http";
import path from "node:path";
import fs from "node:fs";
import { execSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import type { AddressInfo } from "node:net";

describe("Community Integrated Learner Journey (Real Runtime E2E - AC-029, AC-035)", () => {
  let server: http.Server;
  let apiBaseUrl: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let prisma: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let redis: any;
  let realToken: string;
  let realUser: { id: string; email: string; role: string };

  const testDbUrl =
    process.env.TEST_DATABASE_URL ||
    process.env.DATABASE_URL ||
    "postgresql://postgres:postgrespassword@localhost:5432/aura_capital_test_feat019_rework2_fresh";

  beforeAll(async () => {
    // Ensure test environment variables are set
    process.env.NODE_ENV = "test";
    process.env.TEST_DATABASE_URL = testDbUrl;
    process.env.DATABASE_URL = testDbUrl;
    process.env.JWT_SECRET =
      process.env.JWT_SECRET || "ci-test-jwt-secret-with-at-least-32-characters-length";
    process.env.AUTH_ACCESS_TOKEN_SECRET =
      process.env.AUTH_ACCESS_TOKEN_SECRET || "ci-test-jwt-secret-with-at-least-32-characters-length";
    process.env.AUTH_REFRESH_TOKEN_SECRET =
      process.env.AUTH_REFRESH_TOKEN_SECRET || "ci-test-jwt-secret-with-at-least-32-characters-length";
    process.env.COMMUNITY_RATE_LIMIT_ENABLED = "true";
    process.env.COMMUNITY_RATE_LIMIT_KEY_SECRET =
      process.env.COMMUNITY_RATE_LIMIT_KEY_SECRET || "ci-test-community-rate-limit-secret-32ch";
    process.env.REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

    // Path resolution for backend dist
    const distServerPath = path.resolve(__dirname, "../../../api/dist/server.js");
    const prismaPath = path.resolve(__dirname, "../../../api/dist/infrastructure/database/prisma.js");
    const redisPath = path.resolve(__dirname, "../../../api/dist/infrastructure/redis/redis.js");

    if (!fs.existsSync(distServerPath)) {
      const apiRoot = path.resolve(__dirname, "../../../api");
      execSync("npx tsc -b", { cwd: apiRoot, stdio: "pipe" });
    }

    const distModule = await import(pathToFileURL(distServerPath).href);
    const prismaModule = await import(pathToFileURL(prismaPath).href);
    const redisModule = await import(pathToFileURL(redisPath).href);

    const app = distModule.createApp();
    prisma = prismaModule.getPrismaClient();
    redis = redisModule.getRedisClient();

    // Start HTTP server on an available ephemeral port
    await new Promise<void>((resolve) => {
      server = http.createServer(app);
      server.listen(0, "127.0.0.1", () => {
        const addr = server.address() as AddressInfo;
        apiBaseUrl = `http://127.0.0.1:${addr.port}`;
        resolve();
      });
    });

    // Configure communityApi to hit this real running HTTP server
    communityApi.setBaseUrl(`${apiBaseUrl}/api/community`);

    // Register a real test learner in PostgreSQL through the real HTTP server
    const uniqueEmail = `e2e_learner_${Date.now()}_${Math.random().toString(36).substring(2, 7)}@auracapital.io`;
    const password = "ValidStrongPassword123!";

    const regRes = await fetch(`${apiBaseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: uniqueEmail,
        password,
        displayName: "Real E2E Learner",
      }),
    });

    if (!regRes.ok) {
      const errBody = await regRes.text();
      throw new Error(`Failed to register test user in E2E setup: ${regRes.status} ${errBody}`);
    }

    // Login to obtain a real in-memory access token
    const loginRes = await fetch(`${apiBaseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: uniqueEmail,
        password,
      }),
    });

    if (!loginRes.ok) {
      const errBody = await loginRes.text();
      throw new Error(`Failed to login test user in E2E setup: ${loginRes.status} ${errBody}`);
    }

    const loginData = await loginRes.json();
    realToken = loginData.accessToken;
    realUser = loginData.user;
  }, 30000);

  afterAll(async () => {
    // Restore default baseUrl
    communityApi.setBaseUrl("/api/community");

    // Clean up created test data from PostgreSQL
    if (prisma && realUser?.id) {
      try {
        await prisma.communityComment.deleteMany({ where: { authorId: realUser.id } });
        await prisma.communityPostLike.deleteMany({ where: { userId: realUser.id } });
        await prisma.communityPost.deleteMany({ where: { authorId: realUser.id } });
        await prisma.credential.deleteMany({ where: { userId: realUser.id } });
        await prisma.userRole.deleteMany({ where: { userId: realUser.id } });
        await prisma.user.deleteMany({ where: { id: realUser.id } });
      } catch {
        // Best effort cleanup
      }
    }

    // Close HTTP server
    if (server) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });

  it("traverses real browser -> API -> PostgreSQL -> Redis runtime: feed -> create post -> detail -> like -> unlike -> comment -> remove comment -> remove post (AC-029, AC-035)", async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={["/community"]}>
          <AuthProvider initialToken={realToken} initialUser={realUser}>
            <Routes>
              <Route path="/community/*" element={<CommunityRoutes />} />
            </Routes>
          </AuthProvider>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    // 1. Initial Community Feed loads from real API
    await waitFor(() => {
      expect(screen.getByRole("heading", { level: 1, name: "Community Discussions" })).toBeDefined();
    });

    // 2. Create Post through React composer -> Real POST /api/community/posts -> PostgreSQL
    const postContent = `Real E2E post content: Alpha-Beta neutrality test ${Date.now()}`;
    const textarea = screen.getByTestId("post-composer-textarea");
    fireEvent.change(textarea, { target: { value: postContent } });

    const submitBtn = screen.getByTestId("post-composer-submit-btn");
    fireEvent.click(submitBtn);

    // Wait for post to appear in feed
    let createdPostId = "";
    await waitFor(
      () => {
        const contentEls = document.querySelectorAll('div[data-testid^="post-content-"]');
        let foundId = "";
        contentEls.forEach((el) => {
          if (el.textContent?.includes(postContent)) {
            const testId = el.getAttribute("data-testid") || "";
            foundId = testId.replace("post-content-", "");
          }
        });
        expect(foundId).not.toBe("");
        createdPostId = foundId;
      },
      { timeout: 10000 },
    );

    expect(createdPostId).toMatch(/^[0-9a-f-]{36}$/i);

    // 3. Open created post detail via comment link
    const commentsLink = screen.getByTestId(`post-comments-link-${createdPostId}`);
    fireEvent.click(commentsLink);

    // Wait for post detail page to render
    await waitFor(
      () => {
        expect(screen.getByTestId("back-to-feed-link")).toBeDefined();
        expect(screen.getByRole("heading", { level: 2, name: /Comments/i })).toBeDefined();
      },
      { timeout: 10000 },
    );

    // 4. Like post -> Real PUT /api/community/posts/:postId/like -> PostgreSQL
    const likeBtn = screen.getByTestId(`post-like-btn-${createdPostId}`);
    expect(screen.getByTestId(`post-like-count-${createdPostId}`).textContent).toBe("0");

    fireEvent.click(likeBtn);

    // 5. Verify liked state and count == 1 after authoritative refetch
    await waitFor(
      () => {
        expect(screen.getByTestId(`post-like-count-${createdPostId}`).textContent).toBe("1");
        expect(likeBtn.getAttribute("aria-label")).toBe("Unlike post");
      },
      { timeout: 10000 },
    );

    // 6. Unlike post -> Real DELETE /api/community/posts/:postId/like -> PostgreSQL
    fireEvent.click(likeBtn);

    // 7. Verify unliked state and count == 0 after authoritative refetch
    await waitFor(
      () => {
        expect(screen.getByTestId(`post-like-count-${createdPostId}`).textContent).toBe("0");
        expect(likeBtn.getAttribute("aria-label")).toBe("Like post");
      },
      { timeout: 10000 },
    );

    // 8. Create comment -> Real POST /api/community/posts/:postId/comments -> PostgreSQL
    const commentContent = `Real E2E comment: Delta hedge factor ${Date.now()}`;
    const commentTextarea = screen.getByTestId("comment-composer-textarea");
    fireEvent.change(commentTextarea, { target: { value: commentContent } });

    const commentSubmitBtn = screen.getByTestId("comment-composer-submit-btn");
    fireEvent.click(commentSubmitBtn);

    // Wait for comment to render in flat list
    let createdCommentId = "";
    await waitFor(
      () => {
        const commentEls = document.querySelectorAll('div[data-testid^="comment-content-"]');
        let foundId = "";
        commentEls.forEach((el) => {
          if (el.textContent?.includes(commentContent)) {
            const testId = el.getAttribute("data-testid") || "";
            foundId = testId.replace("comment-content-", "");
          }
        });
        expect(foundId).not.toBe("");
        createdCommentId = foundId;
      },
      { timeout: 10000 },
    );

    // 9. Verify comment count updated
    await waitFor(
      () => {
        expect(screen.getByTestId(`post-comment-count-${createdPostId}`).textContent).toContain("1");
      },
      { timeout: 10000 },
    );

    // 10. Remove comment -> Real DELETE /api/community/comments/:commentId (204 No Content)
    vi.spyOn(window, "confirm").mockReturnValue(true);
    const removeCommentBtn = screen.getByTestId(`comment-remove-btn-${createdCommentId}`);
    fireEvent.click(removeCommentBtn);

    // 11. Verify comment is no longer visible in UI
    await waitFor(
      () => {
        expect(document.querySelector(`[data-testid="comment-content-${createdCommentId}"]`)).toBeNull();
      },
      { timeout: 10000 },
    );

    // 12. Remove post -> Real DELETE /api/community/posts/:postId (204 No Content)
    const removePostBtn = screen.getByTestId(`post-remove-btn-${createdPostId}`);
    fireEvent.click(removePostBtn);

    // 13. Verify post is no longer visible (navigates back to feed)
    await waitFor(
      () => {
        expect(document.querySelector(`[data-testid="post-content-${createdPostId}"]`)).toBeNull();
      },
      { timeout: 10000 },
    );

    // 14. Verify durable PostgreSQL final state
    const dbPost = await prisma.communityPost.findUnique({
      where: { id: createdPostId },
    });
    expect(dbPost).not.toBeNull();
    expect(dbPost.status).toBe("REMOVED");
    expect(dbPost.removedAt).toBeInstanceOf(Date);

    const dbComment = await prisma.communityComment.findUnique({
      where: { id: createdCommentId },
    });
    expect(dbComment).not.toBeNull();
    expect(dbComment.status).toBe("REMOVED");
    expect(dbComment.removedAt).toBeInstanceOf(Date);

    const dbLike = await prisma.communityPostLike.findUnique({
      where: {
        userId_postId: {
          userId: realUser.id,
          postId: createdPostId,
        },
      },
    });
    expect(dbLike).toBeNull();

    // 15. Verify Redis: used only for transient write rate-limit checks
    const redisKeys = await redis.keys("*community-rl*");
    expect(redisKeys.length).toBeGreaterThanOrEqual(1);

    // Zero raw user ID, email, or post ID in rate limit keys
    for (const key of redisKeys) {
      expect(key).not.toContain(realUser.id);
      expect(key).not.toContain(realUser.email);
    }
  }, 45000);
});
