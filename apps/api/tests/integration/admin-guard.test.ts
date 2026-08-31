import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import { createApp } from "../../src/server.js";
import { accessTokenService } from "../../src/modules/auth/access-token.service.js";
import { userRepository } from "../../src/modules/users/user.repository.js";
import { roleRepository } from "../../src/modules/auth/role.repository.js";
import { getAuthConfig } from "../../src/infrastructure/config/auth.config.js";
import { ERROR_CODES, HTTP_STATUS } from "@aura/shared";

describe("Admin Authorization Guard & GET /admin/ping (Integration)", () => {
  const sampleUser = {
    id: "44444444-5555-6666-7777-888888888888",
    email: "admin.integration@auracapital.local",
    displayName: "Admin Integration User",
    status: "ACTIVE",
    createdAt: new Date("2026-08-26T12:00:00.000Z"),
    updatedAt: new Date("2026-08-26T12:00:00.000Z"),
  };

  const app = createApp();
  const authConfig = getAuthConfig();

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns 401 UNAUTHENTICATED on GET /admin/ping when unauthenticated", async () => {
    const res = await request(app)
      .get("/admin/ping")
      .expect(HTTP_STATUS.UNAUTHORIZED);

    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe(ERROR_CODES.UNAUTHENTICATED);
  });

  it("denies authenticated zero-role user on GET /admin/ping with 403 FORBIDDEN", async () => {
    vi.spyOn(userRepository, "findById").mockResolvedValue(sampleUser);
    vi.spyOn(roleRepository, "getUserRoleCodes").mockResolvedValue([]); // Zero roles

    const { accessToken } = accessTokenService.issueAccessToken(sampleUser.id);

    const res = await request(app)
      .get("/admin/ping")
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(HTTP_STATUS.FORBIDDEN);

    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe(ERROR_CODES.FORBIDDEN);
    expect(res.body.error.message).toBe("Insufficient permissions");
  });

  it("denies authenticated USER-only user on GET /admin/ping with 403 FORBIDDEN", async () => {
    vi.spyOn(userRepository, "findById").mockResolvedValue(sampleUser);
    vi.spyOn(roleRepository, "getUserRoleCodes").mockResolvedValue(["USER"]);

    const { accessToken } = accessTokenService.issueAccessToken(sampleUser.id);

    const res = await request(app)
      .get("/admin/ping")
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(HTTP_STATUS.FORBIDDEN);

    expect(res.body.error.code).toBe(ERROR_CODES.FORBIDDEN);
  });

  it("allows authenticated ADMIN user on GET /admin/ping returning minimal safe payload", async () => {
    vi.spyOn(userRepository, "findById").mockResolvedValue(sampleUser);
    vi.spyOn(roleRepository, "getUserRoleCodes").mockResolvedValue(["ADMIN"]);

    const { accessToken } = accessTokenService.issueAccessToken(sampleUser.id);

    const res = await request(app)
      .get("/admin/ping")
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(HTTP_STATUS.OK);

    expect(res.body).toEqual({
      status: "ok",
      scope: "admin",
    });

    // Verify response body is minimal and does NOT expose internal state
    expect(res.body).not.toHaveProperty("user");
    expect(res.body).not.toHaveProperty("email");
    expect(res.body).not.toHaveProperty("roles");
    expect(res.body).not.toHaveProperty("roleIds");
    expect(res.body).not.toHaveProperty("token");
    expect(res.body).not.toHaveProperty("database");
  });

  it("allows authenticated multi-role USER+ADMIN user on GET /admin/ping", async () => {
    vi.spyOn(userRepository, "findById").mockResolvedValue(sampleUser);
    vi.spyOn(roleRepository, "getUserRoleCodes").mockResolvedValue(["USER", "ADMIN"]);

    const { accessToken } = accessTokenService.issueAccessToken(sampleUser.id);

    const res = await request(app)
      .get("/admin/ping")
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(HTTP_STATUS.OK);

    expect(res.body).toEqual({
      status: "ok",
      scope: "admin",
    });
  });

  it("strictly ignores client-supplied spoofing attempts (body, query, headers) for admin access", async () => {
    vi.spyOn(userRepository, "findById").mockResolvedValue(sampleUser);
    vi.spyOn(roleRepository, "getUserRoleCodes").mockResolvedValue(["USER"]); // Server-side has only USER

    const { accessToken } = accessTokenService.issueAccessToken(sampleUser.id);

    // Attacker sends various spoofing vectors
    const res = await request(app)
      .get("/admin/ping?admin=true&role=ADMIN")
      .set("Authorization", `Bearer ${accessToken}`)
      .set("X-Admin", "true")
      .set("X-Role", "ADMIN")
      .send({ admin: true, role: "ADMIN" })
      .expect(HTTP_STATUS.FORBIDDEN);

    expect(res.body.error.code).toBe(ERROR_CODES.FORBIDDEN);
  });

  it("prohibits access tokens with spoofed role/admin claims via strict FEAT-004 verification", async () => {
    const now = Math.floor(Date.now() / 1000);
    const spoofedToken = jwt.sign(
      {
        sub: sampleUser.id,
        iat: now,
        exp: now + 900,
        iss: authConfig.accessTokenIssuer,
        aud: authConfig.accessTokenAudience,
        typ: "access",
        role: "ADMIN",
        isAdmin: true,
      },
      authConfig.accessTokenSecret,
      { algorithm: "HS256" },
    );

    const res = await request(app)
      .get("/admin/ping")
      .set("Authorization", `Bearer ${spoofedToken}`)
      .expect(HTTP_STATUS.UNAUTHORIZED);

    expect(res.body.error.code).toBe(ERROR_CODES.UNAUTHENTICATED);
    expect(res.body.error.message).toBe("Invalid or malformed access token");
  });

  it("denies direct API requests by non-admin callers even when UI controls are bypassed", async () => {
    vi.spyOn(userRepository, "findById").mockResolvedValue(sampleUser);
    vi.spyOn(roleRepository, "getUserRoleCodes").mockResolvedValue(["USER"]);

    const { accessToken } = accessTokenService.issueAccessToken(sampleUser.id);

    // Direct API request bypassing browser UI
    const res = await request(app)
      .get("/admin/ping")
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(HTTP_STATUS.FORBIDDEN);

    expect(res.body.error.code).toBe(ERROR_CODES.FORBIDDEN);
  });

  it("handles malformed persisted role codes correctly: ROOT-only gets 403, ROOT+ADMIN gets 200", async () => {
    vi.spyOn(userRepository, "findById").mockResolvedValue(sampleUser);
    const { accessToken } = accessTokenService.issueAccessToken(sampleUser.id);

    // Case 1: Only unknown role in DB ("ROOT") -> canonicalizes to [] -> 403
    vi.spyOn(roleRepository, "getUserRoleCodes").mockResolvedValueOnce(["ROOT"]);
    const res1 = await request(app)
      .get("/admin/ping")
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(HTTP_STATUS.FORBIDDEN);
    expect(res1.body.error.code).toBe(ERROR_CODES.FORBIDDEN);

    // Case 2: Unknown role + valid ADMIN in DB ("ROOT", "ADMIN") -> canonicalizes to ["ADMIN"] -> 200
    vi.spyOn(roleRepository, "getUserRoleCodes").mockResolvedValueOnce(["ROOT", "ADMIN"]);
    const res2 = await request(app)
      .get("/admin/ping")
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(HTTP_STATUS.OK);
    expect(res2.body.status).toBe("ok");
    expect(res2.body.scope).toBe("admin");
  });

  it("handles real authorization-path database failure safely with 500 INTERNAL_ERROR (not misreported as 403)", async () => {
    // 1. Authenticate succeeds
    vi.spyOn(userRepository, "findById").mockResolvedValue(sampleUser);
    // 2. FEAT-007 role lookup fails with DB error
    vi.spyOn(roleRepository, "getUserRoleCodes").mockRejectedValue(
      new Error("PrismaClientInitializationError: Connection to postgresql refused"),
    );

    const { accessToken } = accessTokenService.issueAccessToken(sampleUser.id);

    const res = await request(app)
      .get("/admin/ping")
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(HTTP_STATUS.INTERNAL_SERVER_ERROR);

    expect(res.body.error.code).toBe(ERROR_CODES.INTERNAL_ERROR);
    expect(res.body.error.message).toBe("An unexpected internal server error occurred");

    // No leakage of database error internals
    const resString = JSON.stringify(res.body);
    expect(resString).not.toContain("PrismaClientInitializationError");
    expect(resString).not.toContain("postgresql");
  });
});
