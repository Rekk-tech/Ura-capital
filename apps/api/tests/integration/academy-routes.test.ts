import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "../../src/server.js";
import { accessTokenService } from "../../src/modules/auth/access-token.service.js";
import { userRepository } from "../../src/modules/users/user.repository.js";
import { AppError } from "../../src/shared/errors/error-envelope.js";
import { ERROR_CODES, HTTP_STATUS } from "@aura/shared";

describe("FEAT-020 Academy HTTP Routes & Error Envelopes (Integration)", () => {
  const app = createApp();

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("GET /api/academy/courses", () => {
    it("returns 400 with VALIDATION_ERROR envelope on invalid page", async () => {
      const res = await request(app)
        .get("/api/academy/courses?page=0")
        .expect(HTTP_STATUS.BAD_REQUEST);

      expect(res.body).toHaveProperty("error");
      expect(res.body.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
      expect(res.body.error.message).toBe("Validation failed for request");
    });

    it("returns 400 with VALIDATION_ERROR envelope on invalid limit", async () => {
      const res = await request(app)
        .get("/api/academy/courses?limit=100")
        .expect(HTTP_STATUS.BAD_REQUEST);

      expect(res.body).toHaveProperty("error");
      expect(res.body.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    });

    it("returns 400 with VALIDATION_ERROR envelope on invalid level", async () => {
      const res = await request(app)
        .get("/api/academy/courses?level=IMPOSSIBLE")
        .expect(HTTP_STATUS.BAD_REQUEST);

      expect(res.body).toHaveProperty("error");
      expect(res.body.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    });
  });

  describe("GET /api/academy/courses/:slug", () => {
    it("returns 400 with VALIDATION_ERROR on invalid slug format (uppercase/symbols)", async () => {
      const res = await request(app)
        .get("/api/academy/courses/INVALID_SLUG!")
        .expect(HTTP_STATUS.BAD_REQUEST);

      expect(res.body).toHaveProperty("error");
      expect(res.body.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    });
  });

  describe("GET /api/academy/courses/:courseSlug/lessons/:lessonSlug", () => {
    it("returns 401 UNAUTHENTICATED when Authorization header is missing", async () => {
      const res = await request(app)
        .get("/api/academy/courses/intro-to-crypto/lessons/what-is-crypto")
        .expect(HTTP_STATUS.UNAUTHORIZED);

      expect(res.body).toHaveProperty("error");
      expect(res.body.error.code).toBe(ERROR_CODES.UNAUTHENTICATED);
    });

    it("returns 401 UNAUTHENTICATED when Authorization header is not Bearer", async () => {
      const res = await request(app)
        .get("/api/academy/courses/intro-to-crypto/lessons/what-is-crypto")
        .set("Authorization", "Basic abc123xyz")
        .expect(HTTP_STATUS.UNAUTHORIZED);

      expect(res.body).toHaveProperty("error");
      expect(res.body.error.code).toBe(ERROR_CODES.UNAUTHENTICATED);
    });

    it("returns 401 UNAUTHENTICATED when Bearer token is invalid", async () => {
      vi.spyOn(accessTokenService, "verifyAccessToken").mockImplementation(() => {
        throw new AppError("Invalid token", ERROR_CODES.UNAUTHENTICATED, HTTP_STATUS.UNAUTHORIZED);
      });

      const res = await request(app)
        .get("/api/academy/courses/intro-to-crypto/lessons/what-is-crypto")
        .set("Authorization", "Bearer bad-token")
        .expect(HTTP_STATUS.UNAUTHORIZED);

      expect(res.body).toHaveProperty("error");
      expect(res.body.error.code).toBe(ERROR_CODES.UNAUTHENTICATED);
    });

    it("returns 401 UNAUTHENTICATED when user is inactive or deleted", async () => {
      vi.spyOn(accessTokenService, "verifyAccessToken").mockReturnValue({
        sub: "user-123",
        iat: 1000,
        exp: 2000,
        iss: "aura-capital",
        aud: "aura-client",
        typ: "access",
      });
      vi.spyOn(userRepository, "findById").mockResolvedValue({
        id: "user-123",
        email: "user@auracapital.io",
        displayName: "User",
        status: "SUSPENDED",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const res = await request(app)
        .get("/api/academy/courses/intro-to-crypto/lessons/what-is-crypto")
        .set("Authorization", "Bearer valid-token-but-suspended")
        .expect(HTTP_STATUS.UNAUTHORIZED);

      expect(res.body).toHaveProperty("error");
      expect(res.body.error.code).toBe(ERROR_CODES.UNAUTHENTICATED);
    });

    it("returns 400 with VALIDATION_ERROR on invalid lesson slug format", async () => {
      vi.spyOn(accessTokenService, "verifyAccessToken").mockReturnValue({
        sub: "user-123",
        iat: 1000,
        exp: 2000,
        iss: "aura-capital",
        aud: "aura-client",
        typ: "access",
      });
      vi.spyOn(userRepository, "findById").mockResolvedValue({
        id: "user-123",
        email: "user@auracapital.io",
        displayName: "User",
        status: "ACTIVE",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const res = await request(app)
        .get("/api/academy/courses/intro-to-crypto/lessons/INVALID_LESSON!")
        .set("Authorization", "Bearer valid-token")
        .expect(HTTP_STATUS.BAD_REQUEST);

      expect(res.body).toHaveProperty("error");
      expect(res.body.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    });
  });

  describe("GET /api/academy/courses/:courseSlug/lessons/:lessonSlug/flashcards", () => {
    it("returns 401 UNAUTHENTICATED when Authorization header is missing", async () => {
      const res = await request(app)
        .get("/api/academy/courses/intro-to-crypto/lessons/what-is-crypto/flashcards")
        .expect(HTTP_STATUS.UNAUTHORIZED);

      expect(res.body).toHaveProperty("error");
      expect(res.body.error.code).toBe(ERROR_CODES.UNAUTHENTICATED);
    });

    it("returns 401 UNAUTHENTICATED when Authorization header is not Bearer", async () => {
      const res = await request(app)
        .get("/api/academy/courses/intro-to-crypto/lessons/what-is-crypto/flashcards")
        .set("Authorization", "Basic abc123xyz")
        .expect(HTTP_STATUS.UNAUTHORIZED);

      expect(res.body).toHaveProperty("error");
      expect(res.body.error.code).toBe(ERROR_CODES.UNAUTHENTICATED);
    });

    it("returns 401 UNAUTHENTICATED when Bearer token is invalid", async () => {
      vi.spyOn(accessTokenService, "verifyAccessToken").mockImplementation(() => {
        throw new AppError("Invalid token", ERROR_CODES.UNAUTHENTICATED, HTTP_STATUS.UNAUTHORIZED);
      });

      const res = await request(app)
        .get("/api/academy/courses/intro-to-crypto/lessons/what-is-crypto/flashcards")
        .set("Authorization", "Bearer bad-token")
        .expect(HTTP_STATUS.UNAUTHORIZED);

      expect(res.body).toHaveProperty("error");
      expect(res.body.error.code).toBe(ERROR_CODES.UNAUTHENTICATED);
    });

    it("returns 400 with VALIDATION_ERROR on invalid course slug format", async () => {
      vi.spyOn(accessTokenService, "verifyAccessToken").mockReturnValue({
        sub: "user-123",
        iat: 1000,
        exp: 2000,
        iss: "aura-capital",
        aud: "aura-client",
        typ: "access",
      });
      vi.spyOn(userRepository, "findById").mockResolvedValue({
        id: "user-123",
        email: "user@auracapital.io",
        displayName: "User",
        status: "ACTIVE",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const res = await request(app)
        .get("/api/academy/courses/INVALID_COURSE!/lessons/what-is-crypto/flashcards")
        .set("Authorization", "Bearer valid-token")
        .expect(HTTP_STATUS.BAD_REQUEST);

      expect(res.body).toHaveProperty("error");
      expect(res.body.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    });

    it("returns 400 with VALIDATION_ERROR on invalid lesson slug format", async () => {
      vi.spyOn(accessTokenService, "verifyAccessToken").mockReturnValue({
        sub: "user-123",
        iat: 1000,
        exp: 2000,
        iss: "aura-capital",
        aud: "aura-client",
        typ: "access",
      });
      vi.spyOn(userRepository, "findById").mockResolvedValue({
        id: "user-123",
        email: "user@auracapital.io",
        displayName: "User",
        status: "ACTIVE",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const res = await request(app)
        .get("/api/academy/courses/intro-to-crypto/lessons/INVALID_LESSON!/flashcards")
        .set("Authorization", "Bearer valid-token")
        .expect(HTTP_STATUS.BAD_REQUEST);

      expect(res.body).toHaveProperty("error");
      expect(res.body.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    });
  });
});

