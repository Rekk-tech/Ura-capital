import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "../../src/server.js";
import { logoutService } from "../../src/modules/auth/logout.service.js";
import { accessTokenService } from "../../src/modules/auth/access-token.service.js";
import { userRepository } from "../../src/modules/users/user.repository.js";
import { ERROR_CODES, HTTP_STATUS } from "@aura/shared";

describe("Logout API Contract, Cookie Clearing & Error Safety (Integration)", () => {
  const app = createApp();

  const sampleUser = {
    id: "11111111-2222-3333-4444-555555555555",
    email: "test.logout@auracapital.local",
    displayName: "Test Logout User",
    status: "ACTIVE",
    createdAt: new Date("2026-08-25T12:00:00.000Z"),
    updatedAt: new Date("2026-08-25T12:00:00.000Z"),
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("successfully logs out current session on canonical POST /auth/logout and clears refresh cookie (204 No Content)", async () => {
    const logoutSpy = vi.spyOn(logoutService, "logout").mockResolvedValueOnce({
      revoked: true,
      sessionId: "session-123",
    });

    const res = await request(app)
      .post("/auth/logout")
      .set("Cookie", "aura_refresh_token=valid-raw-refresh-token-1234567890")
      .expect(HTTP_STATUS.NO_CONTENT);

    // 1. Verify response has no content body
    expect(res.body).toEqual({});
    expect(res.text).toBe("");

    // 2. Verify service called with cookie token
    expect(logoutSpy).toHaveBeenCalledWith(
      "valid-raw-refresh-token-1234567890",
      expect.objectContaining({ requestId: expect.any(String) }),
    );

    // 3. Verify Set-Cookie clears the refresh cookie with matching attributes (Path=/, HttpOnly, Expired)
    const cookies = res.headers["set-cookie"];
    expect(cookies).toBeDefined();
    const cookieHeader = Array.isArray(cookies) ? cookies.join("; ") : cookies;
    expect(cookieHeader).toContain("aura_refresh_token=");
    expect(cookieHeader.toLowerCase()).toContain("httponly");
    expect(cookieHeader).toContain("Path=/");
    expect(cookieHeader).toMatch(/(?:Expires=Thu, 01 Jan 1970|Max-Age=0)/i);
  });

  it("supports alternative endpoint route POST /api/auth/logout with identical clear-cookie behavior", async () => {
    vi.spyOn(logoutService, "logout").mockResolvedValueOnce({
      revoked: true,
      sessionId: "session-123",
    });

    const res = await request(app)
      .post("/api/auth/logout")
      .set("Cookie", "aura_refresh_token=valid-raw-refresh-token-1234567890")
      .expect(HTTP_STATUS.NO_CONTENT);

    expect(res.body).toEqual({});
    const cookies = res.headers["set-cookie"];
    expect(cookies).toBeDefined();
    const cookieHeader = Array.isArray(cookies) ? cookies.join("; ") : cookies;
    expect(cookieHeader).toContain("aura_refresh_token=");
    expect(cookieHeader).toContain("Path=/");
  });

  it("ignores client body userId, sessionId, familyId, role, and admin fields (derives authority solely from cookie)", async () => {
    const logoutSpy = vi.spyOn(logoutService, "logout").mockResolvedValueOnce({
      revoked: true,
      sessionId: "session-cookie-only",
    });

    await request(app)
      .post("/auth/logout")
      .set("Cookie", "aura_refresh_token=authoritative-cookie-token-1234567890")
      .send({
        userId: "malicious-user-id",
        sessionId: "malicious-session-id",
        familyId: "malicious-family-id",
        role: "ADMIN",
        isAdmin: true,
      })
      .expect(HTTP_STATUS.NO_CONTENT);

    expect(logoutSpy).toHaveBeenCalledWith(
      "authoritative-cookie-token-1234567890",
      expect.objectContaining({ requestId: expect.any(String) }),
    );
  });

  it("returns 204 No Content idempotently when refresh cookie is missing", async () => {
    const logoutSpy = vi.spyOn(logoutService, "logout").mockResolvedValueOnce({
      revoked: false,
    });

    const res = await request(app)
      .post("/auth/logout")
      .expect(HTTP_STATUS.NO_CONTENT);

    expect(logoutSpy).toHaveBeenCalledWith(
      undefined,
      expect.objectContaining({ requestId: expect.any(String) }),
    );
    expect(res.body).toEqual({});

    // Cookie is also cleared defensibly
    const cookies = res.headers["set-cookie"];
    expect(cookies).toBeDefined();
  });

  it("returns 204 No Content idempotently when refresh cookie is malformed, expired, or already inactive", async () => {
    const logoutSpy = vi.spyOn(logoutService, "logout").mockResolvedValueOnce({
      revoked: false,
    });

    const res = await request(app)
      .post("/auth/logout")
      .set("Cookie", "aura_refresh_token=already-revoked-or-unknown-token-12345")
      .expect(HTTP_STATUS.NO_CONTENT);

    expect(logoutSpy).toHaveBeenCalledWith(
      "already-revoked-or-unknown-token-12345",
      expect.objectContaining({ requestId: expect.any(String) }),
    );
    expect(res.body).toEqual({});
  });

  it("handles unexpected database failure during logout safely without returning 204 or leaking internal details", async () => {
    vi.spyOn(logoutService, "logout").mockRejectedValueOnce(
      new Error("PrismaClientInitializationError: Can't reach database server at `localhost:5432`"),
    );

    const res = await request(app)
      .post("/auth/logout")
      .set("Cookie", "aura_refresh_token=valid-token-during-outage-1234567890")
      .expect(HTTP_STATUS.INTERNAL_SERVER_ERROR);

    // 1. Must return safe standard error envelope (NOT 204)
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe(ERROR_CODES.INTERNAL_ERROR);
    expect(res.body.error.message).toBe("An unexpected internal server error occurred");

    // 2. Must not leak database connection details or stack traces
    const responseString = JSON.stringify(res.body);
    expect(responseString).not.toContain("PrismaClientInitializationError");
    expect(responseString).not.toContain("5432");
    expect(responseString).not.toContain("localhost");
    expect(responseString).not.toContain("stack");
  });

  it("preserves FEAT-004 stateless short-lived access token semantics after logout (access token remains valid until natural expiry)", async () => {
    vi.spyOn(userRepository, "findById").mockResolvedValue(sampleUser);

    // Issue a short-lived access token
    const { accessToken } = accessTokenService.issueAccessToken(sampleUser.id);

    // Perform logout
    vi.spyOn(logoutService, "logout").mockResolvedValueOnce({
      revoked: true,
      sessionId: "session-123",
    });

    await request(app)
      .post("/auth/logout")
      .set("Cookie", "aura_refresh_token=valid-cookie-token-1234567890")
      .expect(HTTP_STATUS.NO_CONTENT);

    // Protected endpoint GET /auth/me continues to accept the unexpired stateless JWT
    const meRes = await request(app)
      .get("/auth/me")
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(HTTP_STATUS.OK);

    expect(meRes.body.user.id).toBe(sampleUser.id);
  });
});
