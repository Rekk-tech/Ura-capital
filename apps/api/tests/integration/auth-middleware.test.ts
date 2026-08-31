import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import { createApp } from "../../src/server.js";
import { accessTokenService } from "../../src/modules/auth/access-token.service.js";
import { getAuthConfig } from "../../src/infrastructure/config/auth.config.js";
import { PrismaUserRepository } from "../../src/modules/users/user.repository.js";
import { ERROR_CODES, HTTP_STATUS } from "@aura/shared";

describe("Access Token Authentication Middleware & /auth/me (Integration)", () => {
  const app = createApp();
  const authConfig = getAuthConfig();

  const sampleActiveUser = {
    id: "33333333-4444-5555-6666-777777777777",
    email: "active.user@auracapital.com",
    displayName: "Active User",
    status: "ACTIVE",
    createdAt: new Date("2026-08-25T12:00:00.000Z"),
    updatedAt: new Date("2026-08-25T12:00:00.000Z"),
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("successfully accesses GET /auth/me with a valid access token", async () => {
    vi.spyOn(PrismaUserRepository.prototype, "findById").mockResolvedValueOnce(sampleActiveUser);

    const { accessToken } = accessTokenService.issueAccessToken(sampleActiveUser.id);

    const res = await request(app)
      .get("/auth/me")
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(HTTP_STATUS.OK);

    expect(res.body).toEqual({
      user: {
        id: sampleActiveUser.id,
        email: sampleActiveUser.email,
        displayName: sampleActiveUser.displayName,
        status: sampleActiveUser.status,
        createdAt: "2026-08-25T12:00:00.000Z",
      },
    });

    // Check forbidden claims
    expect(res.body.user).not.toHaveProperty("password");
    expect(res.body.user).not.toHaveProperty("passwordHash");
    expect(res.body.user).not.toHaveProperty("roles");
  });

  it("supports alternative route GET /api/auth/me", async () => {
    vi.spyOn(PrismaUserRepository.prototype, "findById").mockResolvedValueOnce(sampleActiveUser);

    const { accessToken } = accessTokenService.issueAccessToken(sampleActiveUser.id);

    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(HTTP_STATUS.OK);

    expect(res.body.user.id).toBe(sampleActiveUser.id);
  });

  it("rejects request when Authorization header is missing", async () => {
    const res = await request(app)
      .get("/auth/me")
      .expect(HTTP_STATUS.UNAUTHORIZED);

    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe(ERROR_CODES.UNAUTHENTICATED);
    expect(res.body.error.message).toContain("Authorization header is required");
  });

  it("rejects request when Authorization scheme is not Bearer", async () => {
    const res = await request(app)
      .get("/auth/me")
      .set("Authorization", "Basic dXNlcjpwYXNz")
      .expect(HTTP_STATUS.UNAUTHORIZED);

    expect(res.body.error.code).toBe(ERROR_CODES.UNAUTHENTICATED);
    expect(res.body.error.message).toContain("Expected 'Bearer <token>'");
  });

  it("rejects request when Bearer token value is empty", async () => {
    const res = await request(app)
      .get("/auth/me")
      .set("Authorization", "Bearer ")
      .expect(HTTP_STATUS.UNAUTHORIZED);

    expect(res.body.error.code).toBe(ERROR_CODES.UNAUTHENTICATED);
  });

  it("rejects request when Authorization header is malformed (extra parts)", async () => {
    const res = await request(app)
      .get("/auth/me")
      .set("Authorization", "Bearer token extra-part")
      .expect(HTTP_STATUS.UNAUTHORIZED);

    expect(res.body.error.code).toBe(ERROR_CODES.UNAUTHENTICATED);
  });

  it("rejects forged access token", async () => {
    const { accessToken } = accessTokenService.issueAccessToken(sampleActiveUser.id);
    const forgedToken = accessToken.slice(0, -6) + "xyz123";

    const res = await request(app)
      .get("/auth/me")
      .set("Authorization", `Bearer ${forgedToken}`)
      .expect(HTTP_STATUS.UNAUTHORIZED);

    expect(res.body.error.code).toBe(ERROR_CODES.UNAUTHENTICATED);
    expect(res.body.error.message).toContain("Invalid or malformed access token");
  });

  it("rejects expired access token", async () => {
    const now = Math.floor(Date.now() / 1000);
    const expiredPayload = {
      sub: sampleActiveUser.id,
      iat: now - 3600,
      exp: now - 10,
      iss: authConfig.accessTokenIssuer,
      aud: authConfig.accessTokenAudience,
      typ: "access",
    };

    const expiredToken = jwt.sign(expiredPayload, authConfig.accessTokenSecret, { algorithm: "HS256" });

    const res = await request(app)
      .get("/auth/me")
      .set("Authorization", `Bearer ${expiredToken}`)
      .expect(HTTP_STATUS.UNAUTHORIZED);

    expect(res.body.error.code).toBe(ERROR_CODES.UNAUTHENTICATED);
    expect(res.body.error.message).toContain("expired");
  });

  it("rejects access token signed with 'none' or wrong algorithm", async () => {
    const payload = {
      sub: sampleActiveUser.id,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 900,
      iss: authConfig.accessTokenIssuer,
      aud: authConfig.accessTokenAudience,
      typ: "access",
    };

    const noneHeader = Buffer.from(JSON.stringify({ alg: "none", typ: "JWT" })).toString("base64url");
    const nonePayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
    const noneToken = `${noneHeader}.${nonePayload}.`;

    const res = await request(app)
      .get("/auth/me")
      .set("Authorization", `Bearer ${noneToken}`)
      .expect(HTTP_STATUS.UNAUTHORIZED);

    expect(res.body.error.code).toBe(ERROR_CODES.UNAUTHENTICATED);
  });

  it("rejects access token with wrong issuer or audience", async () => {
    const now = Math.floor(Date.now() / 1000);
    const wrongIssuerToken = jwt.sign(
      {
        sub: sampleActiveUser.id,
        iat: now,
        exp: now + 900,
        iss: "wrong-issuer",
        aud: authConfig.accessTokenAudience,
        typ: "access",
      },
      authConfig.accessTokenSecret,
      { algorithm: "HS256" },
    );

    const res = await request(app)
      .get("/auth/me")
      .set("Authorization", `Bearer ${wrongIssuerToken}`)
      .expect(HTTP_STATUS.UNAUTHORIZED);

    expect(res.body.error.code).toBe(ERROR_CODES.UNAUTHENTICATED);
  });

  it("rejects validly signed access token when subject user does not exist in database", async () => {
    vi.spyOn(PrismaUserRepository.prototype, "findById").mockResolvedValueOnce(null);

    const { accessToken } = accessTokenService.issueAccessToken("99999999-9999-9999-9999-999999999999");

    const res = await request(app)
      .get("/auth/me")
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(HTTP_STATUS.UNAUTHORIZED);

    expect(res.body.error.code).toBe(ERROR_CODES.UNAUTHENTICATED);
    expect(res.body.error.message).toContain("not active or no longer exists");
  });

  it("rejects validly signed access token when subject user is non-ACTIVE", async () => {
    const inactiveUser = {
      ...sampleActiveUser,
      status: "SUSPENDED",
    };
    vi.spyOn(PrismaUserRepository.prototype, "findById").mockResolvedValueOnce(inactiveUser);

    const { accessToken } = accessTokenService.issueAccessToken(inactiveUser.id);

    const res = await request(app)
      .get("/auth/me")
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(HTTP_STATUS.UNAUTHORIZED);

    expect(res.body.error.code).toBe(ERROR_CODES.UNAUTHENTICATED);
    expect(res.body.error.message).toContain("not active or no longer exists");
  });

  it("rejects validly signed access token containing extra/unapproved claims (DEF-001)", async () => {
    const now = Math.floor(Date.now() / 1000);
    const validBasePayload = {
      sub: sampleActiveUser.id,
      iat: now,
      exp: now + 900,
      iss: authConfig.accessTokenIssuer,
      aud: authConfig.accessTokenAudience,
      typ: "access",
    };

    // Extra claim: role: "ADMIN"
    const tokenWithRole = jwt.sign(
      { ...validBasePayload, role: "ADMIN" },
      authConfig.accessTokenSecret,
      { algorithm: "HS256" },
    );

    const resWithRole = await request(app)
      .get("/auth/me")
      .set("Authorization", `Bearer ${tokenWithRole}`)
      .expect(HTTP_STATUS.UNAUTHORIZED);

    expect(resWithRole.body.error.code).toBe(ERROR_CODES.UNAUTHENTICATED);
    expect(resWithRole.body.error.message).toBe("Invalid or malformed access token");

    // Extra claim: passwordHash
    const tokenWithHash = jwt.sign(
      { ...validBasePayload, passwordHash: "$argon2id$v=19$m=19456,t=2,p=1$leak..." },
      authConfig.accessTokenSecret,
      { algorithm: "HS256" },
    );

    const resWithHash = await request(app)
      .get("/auth/me")
      .set("Authorization", `Bearer ${tokenWithHash}`)
      .expect(HTTP_STATUS.UNAUTHORIZED);

    expect(resWithHash.body.error.code).toBe(ERROR_CODES.UNAUTHENTICATED);
    expect(resWithHash.body.error.message).toBe("Invalid or malformed access token");
  });

  it("ignores client-provided role/admin headers and derives authenticated identity strictly server-side", async () => {
    vi.spyOn(PrismaUserRepository.prototype, "findById").mockResolvedValueOnce(sampleActiveUser);

    const { accessToken } = accessTokenService.issueAccessToken(sampleActiveUser.id);

    const res = await request(app)
      .get("/auth/me")
      .set("Authorization", `Bearer ${accessToken}`)
      .set("X-User-Role", "ADMIN")
      .set("X-Is-Admin", "true")
      .expect(HTTP_STATUS.OK);

    // User context is strictly server-derived
    expect(res.body.user.id).toBe(sampleActiveUser.id);
    expect(res.body.user).not.toHaveProperty("role");
    expect(res.body.user).not.toHaveProperty("admin");
  });
});
