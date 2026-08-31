import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "../../src/server.js";
import { registrationService } from "../../src/modules/auth/registration.service.js";
import { AppError } from "../../src/shared/errors/error-envelope.js";
import { ERROR_CODES, HTTP_STATUS } from "@aura/shared";

describe("Registration API Contract & Validation (Integration)", () => {
  const app = createApp();

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("successfully registers a new account and returns safe user fields only (POST /auth/register)", async () => {
    const registerPayload = {
      email: "  NewUser@AuraCapital.COM  ",
      password: "valid-secure-password-12345",
      displayName: "New User",
    };

    const mockResponse = {
      user: {
        id: "11111111-2222-3333-4444-555555555555",
        email: "newuser@auracapital.com",
        displayName: "New User",
        status: "ACTIVE",
        createdAt: "2026-08-25T12:00:00.000Z",
      },
    };

    const registerSpy = vi
      .spyOn(registrationService, "register")
      .mockResolvedValueOnce(mockResponse);

    const res = await request(app)
      .post("/auth/register")
      .send(registerPayload)
      .expect("Content-Type", /json/)
      .expect(HTTP_STATUS.CREATED);

    expect(res.body).toEqual(mockResponse);
    expect(registerSpy).toHaveBeenCalledWith(
      {
        email: "newuser@auracapital.com", // verified normalization to lowercase trimmed
        password: registerPayload.password,
        displayName: "New User",
      },
      expect.objectContaining({
        requestId: expect.any(String),
      }),
    );

    // Check response excludes all forbidden fields
    const bodyKeys = Object.keys(res.body);
    expect(bodyKeys).toEqual(["user"]);
    const userKeys = Object.keys(res.body.user);
    expect(userKeys).not.toContain("password");
    expect(userKeys).not.toContain("passwordHash");
    expect(userKeys).not.toContain("token");
    expect(userKeys).not.toContain("accessToken");
    expect(userKeys).not.toContain("refreshToken");
    expect(userKeys).not.toContain("roles");
  });

  it("supports alternative endpoint route (POST /api/auth/register)", async () => {
    const registerPayload = {
      email: "apiuser@auracapital.com",
      password: "valid-secure-password-12345",
    };

    const mockResponse = {
      user: {
        id: "22222222-3333-4444-5555-666666666666",
        email: "apiuser@auracapital.com",
        displayName: null,
        status: "ACTIVE",
        createdAt: "2026-08-25T12:00:00.000Z",
      },
    };

    vi.spyOn(registrationService, "register").mockResolvedValueOnce(mockResponse);

    const res = await request(app)
      .post("/api/auth/register")
      .send(registerPayload)
      .expect(HTTP_STATUS.CREATED);

    expect(res.body).toEqual(mockResponse);
  });

  it("rejects request when email is missing", async () => {
    const res = await request(app)
      .post("/auth/register")
      .send({
        password: "valid-secure-password-12345",
      })
      .expect(HTTP_STATUS.BAD_REQUEST);

    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    expect(res.body.error.message).toContain("email");
  });

  it("rejects request when email format is invalid", async () => {
    const res = await request(app)
      .post("/auth/register")
      .send({
        email: "not-an-email",
        password: "valid-secure-password-12345",
      })
      .expect(HTTP_STATUS.BAD_REQUEST);

    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    expect(res.body.error.message).toContain("Invalid email");
  });

  it("rejects request when password is missing", async () => {
    const res = await request(app)
      .post("/auth/register")
      .send({
        email: "test@auracapital.com",
      })
      .expect(HTTP_STATUS.BAD_REQUEST);

    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    expect(res.body.error.message).toContain("password");
  });

  it("rejects request when password is shorter than 12 characters", async () => {
    const res = await request(app)
      .post("/auth/register")
      .send({
        email: "test@auracapital.com",
        password: "short12345",
      })
      .expect(HTTP_STATUS.BAD_REQUEST);

    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    expect(res.body.error.message).toContain("at least 12 characters long");
  });

  it("rejects request when password matches common/demo denylist", async () => {
    const res = await request(app)
      .post("/auth/register")
      .send({
        email: "test@auracapital.com",
        password: "password1234",
      })
      .expect(HTTP_STATUS.BAD_REQUEST);

    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    expect(res.body.error.message).toContain("too common");
  });

  it("returns stable 409 Conflict error when email is already registered", async () => {
    const registerPayload = {
      email: "duplicate@auracapital.com",
      password: "valid-secure-password-12345",
    };

    vi.spyOn(registrationService, "register").mockRejectedValueOnce(
      new AppError(
        "An account with this email address already exists.",
        ERROR_CODES.AUTH_EMAIL_ALREADY_EXISTS,
        HTTP_STATUS.CONFLICT,
      ),
    );

    const res = await request(app)
      .post("/auth/register")
      .send(registerPayload)
      .expect(HTTP_STATUS.CONFLICT);

    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe(ERROR_CODES.AUTH_EMAIL_ALREADY_EXISTS);
    expect(res.body.error.message).toBe("An account with this email address already exists.");
    // Ensure raw Prisma/database errors are NOT leaked in response
    expect(JSON.stringify(res.body)).not.toContain("P2002");
    expect(JSON.stringify(res.body)).not.toContain("prisma");
    expect(JSON.stringify(res.body)).not.toContain("postgres");
  });
});
