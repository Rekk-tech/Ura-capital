import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "../../src/server.js";
import { loginService } from "../../src/modules/auth/login.service.js";
import { AppError } from "../../src/shared/errors/error-envelope.js";
import { ERROR_CODES, HTTP_STATUS } from "@aura/shared";

describe("Login API Contract & Error Safety (Integration)", () => {
  const app = createApp();

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("successfully logs in with valid credentials and returns safe response (POST /auth/login)", async () => {
    const loginPayload = {
      email: "  ExistingUser@AuraCapital.COM  ",
      password: "valid-password-12345",
    };

    const mockResponse = {
      accessToken: "mock.access.token",
      tokenType: "Bearer" as const,
      expiresIn: 900,
      user: {
        id: "11111111-2222-3333-4444-555555555555",
        email: "existinguser@auracapital.com",
        displayName: "Existing User",
        status: "ACTIVE",
        createdAt: "2026-08-25T12:00:00.000Z",
      },
    };

    const loginSpy = vi
      .spyOn(loginService, "login")
      .mockResolvedValueOnce(mockResponse);

    const res = await request(app)
      .post("/auth/login")
      .send(loginPayload)
      .expect("Content-Type", /json/)
      .expect(HTTP_STATUS.OK);

    expect(res.body).toEqual(mockResponse);
    expect(loginSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "existinguser@auracapital.com", // verified normalization
        password: loginPayload.password,
      }),
      expect.anything(),
    );

    // Check response excludes all sensitive/forbidden fields
    const bodyKeys = Object.keys(res.body);
    expect(bodyKeys.sort()).toEqual(["accessToken", "expiresIn", "tokenType", "user"].sort());
    expect(bodyKeys).not.toContain("password");
    expect(bodyKeys).not.toContain("passwordHash");
    expect(bodyKeys).not.toContain("refreshToken");
    expect(bodyKeys).not.toContain("roles");

    const userKeys = Object.keys(res.body.user);
    expect(userKeys).not.toContain("password");
    expect(userKeys).not.toContain("passwordHash");
    expect(userKeys).not.toContain("roles");
  });

  it("supports alternative endpoint route (POST /api/auth/login)", async () => {
    const loginPayload = {
      email: "apiuser@auracapital.com",
      password: "valid-password-12345",
    };

    const mockResponse = {
      accessToken: "mock.api.access.token",
      tokenType: "Bearer" as const,
      expiresIn: 900,
      user: {
        id: "22222222-3333-4444-5555-666666666666",
        email: "apiuser@auracapital.com",
        displayName: null,
        status: "ACTIVE",
        createdAt: "2026-08-25T12:00:00.000Z",
      },
    };

    vi.spyOn(loginService, "login").mockResolvedValueOnce(mockResponse);

    const res = await request(app)
      .post("/api/auth/login")
      .send(loginPayload)
      .expect(HTTP_STATUS.OK);

    expect(res.body).toEqual(mockResponse);
  });

  it("rejects request when email is missing", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({
        password: "valid-password-12345",
      })
      .expect(HTTP_STATUS.BAD_REQUEST);

    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    expect(res.body.error.message).toContain("email");
  });

  it("rejects request when email format is invalid", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({
        email: "invalid-email-string",
        password: "valid-password-12345",
      })
      .expect(HTTP_STATUS.BAD_REQUEST);

    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    expect(res.body.error.message).toContain("Invalid email");
  });

  it("rejects request when password is missing", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({
        email: "user@auracapital.com",
      })
      .expect(HTTP_STATUS.BAD_REQUEST);

    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    expect(res.body.error.message).toContain("password");
  });

  it("returns identical external failure error for unknown user and wrong password", async () => {
    // 1. Unknown user failure simulation
    vi.spyOn(loginService, "login").mockRejectedValueOnce(
      new AppError(
        "Invalid email or password",
        ERROR_CODES.UNAUTHENTICATED,
        HTTP_STATUS.UNAUTHORIZED,
      ),
    );

    const unknownUserRes = await request(app)
      .post("/auth/login")
      .send({
        email: "unknown@auracapital.com",
        password: "any-password-value",
      })
      .expect(HTTP_STATUS.UNAUTHORIZED);

    // 2. Wrong password failure simulation
    vi.spyOn(loginService, "login").mockRejectedValueOnce(
      new AppError(
        "Invalid email or password",
        ERROR_CODES.UNAUTHENTICATED,
        HTTP_STATUS.UNAUTHORIZED,
      ),
    );

    const wrongPasswordRes = await request(app)
      .post("/auth/login")
      .send({
        email: "existing@auracapital.com",
        password: "incorrect-password",
      })
      .expect(HTTP_STATUS.UNAUTHORIZED);

    // Both status, error code, and message must match exactly
    expect(unknownUserRes.body.error.code).toBe(ERROR_CODES.UNAUTHENTICATED);
    expect(wrongPasswordRes.body.error.code).toBe(ERROR_CODES.UNAUTHENTICATED);

    expect(unknownUserRes.body.error.message).toBe("Invalid email or password");
    expect(wrongPasswordRes.body.error.message).toBe("Invalid email or password");

    expect(unknownUserRes.body.error.code).toEqual(wrongPasswordRes.body.error.code);
    expect(unknownUserRes.body.error.message).toEqual(wrongPasswordRes.body.error.message);

    // Ensure raw database, Prisma, or JWT errors are absent
    expect(JSON.stringify(unknownUserRes.body)).not.toContain("prisma");
    expect(JSON.stringify(wrongPasswordRes.body)).not.toContain("prisma");
  });
});
