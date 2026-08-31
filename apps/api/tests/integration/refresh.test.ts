import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "../../src/server.js";
import { refreshTokenService } from "../../src/modules/auth/refresh-token.service.js";
import { loginService } from "../../src/modules/auth/login.service.js";
import { ERROR_CODES, HTTP_STATUS } from "@aura/shared";

describe("Refresh API Contract, Browser Cookie Path & Error Safety (Integration)", () => {
  const app = createApp();

  const sampleUser = {
    id: "11111111-2222-3333-4444-555555555555",
    email: "test.user@auracapital.local",
    displayName: "Test User",
    status: "ACTIVE",
    createdAt: "2026-08-25T12:00:00.000Z",
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("sets HttpOnly refresh cookie on successful login with Path=/ without returning raw token in JSON", async () => {
    vi.spyOn(loginService, "login").mockResolvedValueOnce({
      accessToken: "mock.access.token",
      tokenType: "Bearer",
      expiresIn: 900,
      rawRefreshToken: "mock-raw-refresh-token-12345678901234567890",
      user: sampleUser,
    });

    const res = await request(app)
      .post("/auth/login")
      .send({
        email: "test.user@auracapital.local",
        password: "valid-password-12345",
      })
      .expect(HTTP_STATUS.OK);

    // 1. Verify JSON response strictly excludes rawRefreshToken and verifier
    expect(res.body).toEqual({
      accessToken: "mock.access.token",
      tokenType: "Bearer",
      expiresIn: 900,
      user: sampleUser,
    });
    expect(res.body).not.toHaveProperty("rawRefreshToken");
    expect(res.body).not.toHaveProperty("tokenHash");

    // 2. Verify Set-Cookie header is present, HttpOnly, and has Path=/
    const cookies = res.headers["set-cookie"];
    expect(cookies).toBeDefined();
    const cookieHeader = Array.isArray(cookies) ? cookies.join("; ") : cookies;
    expect(cookieHeader).toContain("aura_refresh_token=mock-raw-refresh-token-12345678901234567890");
    expect(cookieHeader.toLowerCase()).toContain("httponly");
    expect(cookieHeader).toContain("Path=/");
  });

  it("successfully rotates refresh token and returns new access token on canonical POST /auth/refresh", async () => {
    vi.spyOn(refreshTokenService, "refresh").mockResolvedValueOnce({
      accessToken: "new.rotated.access.token",
      tokenType: "Bearer",
      expiresIn: 900,
      newRawToken: "new-rotated-raw-refresh-token-98765432109876543210",
      user: sampleUser,
    });

    const res = await request(app)
      .post("/auth/refresh")
      .set("Cookie", "aura_refresh_token=existing-raw-token-12345678901234567890")
      .expect(HTTP_STATUS.OK);

    expect(res.body).toEqual({
      accessToken: "new.rotated.access.token",
      tokenType: "Bearer",
      expiresIn: 900,
      user: sampleUser,
    });

    // Check response excludes raw token and token verifier
    expect(res.body).not.toHaveProperty("newRawToken");
    expect(res.body).not.toHaveProperty("tokenHash");

    // Check new rotated cookie is set with Path=/
    const cookies = res.headers["set-cookie"];
    expect(cookies).toBeDefined();
    const cookieHeader = Array.isArray(cookies) ? cookies.join("; ") : cookies;
    expect(cookieHeader).toContain("aura_refresh_token=new-rotated-raw-refresh-token-98765432109876543210");
    expect(cookieHeader.toLowerCase()).toContain("httponly");
    expect(cookieHeader).toContain("Path=/");
  });

  it("supports alternative endpoint route POST /api/auth/refresh under browser Path=/ semantics", async () => {
    vi.spyOn(refreshTokenService, "refresh").mockResolvedValueOnce({
      accessToken: "api.rotated.access.token",
      tokenType: "Bearer",
      expiresIn: 900,
      newRawToken: "new-api-rotated-token-12345678901234567890",
      user: sampleUser,
    });

    const res = await request(app)
      .post("/api/auth/refresh")
      .set("Cookie", "aura_refresh_token=existing-raw-token-12345678901234567890")
      .expect(HTTP_STATUS.OK);

    expect(res.body.accessToken).toBe("api.rotated.access.token");
  });

  it("rejects refresh request when refresh cookie is missing", async () => {
    const res = await request(app)
      .post("/auth/refresh")
      .expect(HTTP_STATUS.UNAUTHORIZED);

    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe(ERROR_CODES.UNAUTHENTICATED);
    expect(res.body.error.message).toContain("Refresh token cookie is required");
  });

  it("ignores any client body role/admin/user fields and relies solely on cookie", async () => {
    const refreshSpy = vi.spyOn(refreshTokenService, "refresh").mockResolvedValueOnce({
      accessToken: "new.access.token",
      tokenType: "Bearer",
      expiresIn: 900,
      newRawToken: "new-token-12345678901234567890",
      user: sampleUser,
    });

    await request(app)
      .post("/auth/refresh")
      .set("Cookie", "aura_refresh_token=valid-cookie-token-12345678901234567890")
      .send({
        userId: "malicious-user-id",
        role: "ADMIN",
        isAdmin: true,
      })
      .expect(HTTP_STATUS.OK);

    expect(refreshSpy).toHaveBeenCalledWith(
      "valid-cookie-token-12345678901234567890",
      expect.anything(),
    );
  });

  it("handles unexpected database failure during refresh safely without leaking internal details in responses or logs (DEF-004)", async () => {
    const errorLogs: string[] = [];
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation((msg: string) => {
      errorLogs.push(msg);
    });

    vi.spyOn(refreshTokenService, "refresh").mockRejectedValueOnce(
      new Error("PrismaClientInitializationError: Can't reach database server at `localhost:5432` with postgresql://postgres:pass@localhost:5432/aura_capital_test"),
    );

    const res = await request(app)
      .post("/auth/refresh")
      .set("Cookie", "aura_refresh_token=valid-token-during-outage-1234567890")
      .expect(HTTP_STATUS.INTERNAL_SERVER_ERROR);

    // 1. Safe generic response envelope
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe(ERROR_CODES.INTERNAL_ERROR);
    expect(res.body.error.message).toBe("An unexpected internal server error occurred");

    // 2. Response body sanitization
    const responseString = JSON.stringify(res.body);
    expect(responseString).not.toContain("PrismaClientInitializationError");
    expect(responseString).not.toContain("5432");
    expect(responseString).not.toContain("localhost");
    expect(responseString).not.toContain("postgresql");
    expect(responseString).not.toContain("stack");

    // 3. Log output sanitization (DEF-004)
    expect(errorLogs.length).toBeGreaterThanOrEqual(1);
    const logString = errorLogs.join("\n");
    expect(logString).not.toContain("PrismaClientInitializationError");
    expect(logString).not.toContain("localhost:5432");
    expect(logString).not.toContain("5432");
    expect(logString).not.toContain("localhost");
    expect(logString).not.toContain("postgresql://");
    expect(logString).not.toContain("stack");
    expect(logString).toContain("DATABASE_ERROR");

    consoleErrorSpy.mockRestore();
  });
});
