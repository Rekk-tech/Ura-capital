import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import type { User } from "@prisma/client";
import { createApp } from "../../src/server.js";
import { accessTokenService } from "../../src/modules/auth/access-token.service.js";
import { userRepository } from "../../src/modules/users/user.repository.js";
import type { AccessTokenPayload } from "../../src/modules/auth/auth.types.js";
import { ERROR_CODES, HTTP_STATUS } from "@aura/shared";

describe("FEAT-042 Community Posts HTTP Routes (Integration)", () => {
  const app = createApp();
  const testUserId = "00000000-0000-0000-0000-000000000001";
  const validUuid = "11111111-2222-4333-8444-555555555555";
  const authHeader = "Bearer valid.mock.token";

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(accessTokenService, "verifyAccessToken").mockReturnValue({
      sub: testUserId,
      type: "access",
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
    } as AccessTokenPayload);

    vi.spyOn(userRepository, "findById").mockResolvedValue({
      id: testUserId,
      email: "learner@auracapital.com",
      status: "ACTIVE",
      displayName: "Verified Learner",
      createdAt: new Date(),
      updatedAt: new Date(),
    } as User);
  });

  // ============================================================================
  // AC-001, AC-002, AC-003: Authentication Requirements
  // ============================================================================
  describe("AC-002, AC-003: Authentication Enforcement", () => {
    it("returns 401 UNAUTHENTICATED on GET /api/community/posts without token", async () => {
      const res = await request(app)
        .get("/api/community/posts")
        .expect(HTTP_STATUS.UNAUTHORIZED);

      expect(res.body.error.code).toBe(ERROR_CODES.UNAUTHENTICATED);
    });

    it("returns 401 UNAUTHENTICATED on POST /api/community/posts without token", async () => {
      const res = await request(app)
        .post("/api/community/posts")
        .send({ content: "Unauthorized post" })
        .expect(HTTP_STATUS.UNAUTHORIZED);

      expect(res.body.error.code).toBe(ERROR_CODES.UNAUTHENTICATED);
    });

    it("returns 401 UNAUTHENTICATED on GET /api/community/posts/:postId without token", async () => {
      const res = await request(app)
        .get(`/api/community/posts/${validUuid}`)
        .expect(HTTP_STATUS.UNAUTHORIZED);

      expect(res.body.error.code).toBe(ERROR_CODES.UNAUTHENTICATED);
    });

    it("returns 401 UNAUTHENTICATED on DELETE /api/community/posts/:postId without token", async () => {
      const res = await request(app)
        .delete(`/api/community/posts/${validUuid}`)
        .expect(HTTP_STATUS.UNAUTHORIZED);

      expect(res.body.error.code).toBe(ERROR_CODES.UNAUTHENTICATED);
    });

    it("returns 401 UNAUTHENTICATED when bearer header is malformed", async () => {
      const res = await request(app)
        .get("/api/community/posts")
        .set("Authorization", "InvalidHeaderFormat")
        .expect(HTTP_STATUS.UNAUTHORIZED);

      expect(res.body.error.code).toBe(ERROR_CODES.UNAUTHENTICATED);
    });
  });

  // ============================================================================
  // AC-006, AC-007, AC-008, AC-025: Request Validation & Envelope Errors
  // ============================================================================
  describe("AC-006..AC-008, AC-025: Validation Contracts", () => {
    it("returns 400 VALIDATION_ERROR on empty content for POST /api/community/posts", async () => {
      const res = await request(app)
        .post("/api/community/posts")
        .set("Authorization", authHeader)
        .send({ content: "" })
        .expect(HTTP_STATUS.BAD_REQUEST);

      expect(res.body.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    });

    it("returns 400 VALIDATION_ERROR on whitespace-only content for POST /api/community/posts", async () => {
      const res = await request(app)
        .post("/api/community/posts")
        .set("Authorization", authHeader)
        .send({ content: "   \t\n   " })
        .expect(HTTP_STATUS.BAD_REQUEST);

      expect(res.body.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    });

    it("returns 400 VALIDATION_ERROR when content exceeds 5,000 characters", async () => {
      const res = await request(app)
        .post("/api/community/posts")
        .set("Authorization", authHeader)
        .send({ content: "A".repeat(5001) })
        .expect(HTTP_STATUS.BAD_REQUEST);

      expect(res.body.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    });

    it("returns 400 VALIDATION_ERROR when client attempts to inject unapproved properties (AC-006, AC-025)", async () => {
      const res = await request(app)
        .post("/api/community/posts")
        .set("Authorization", authHeader)
        .send({
          content: "Legitimate looking content",
          authorId: "99999999-9999-9999-9999-999999999999",
          status: "REMOVED",
          likeCount: 50,
        })
        .expect(HTTP_STATUS.BAD_REQUEST);

      expect(res.body.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    });

    it("returns 400 VALIDATION_ERROR on invalid UUID parameter for GET post detail", async () => {
      const res = await request(app)
        .get("/api/community/posts/not-a-valid-uuid")
        .set("Authorization", authHeader)
        .expect(HTTP_STATUS.BAD_REQUEST);

      expect(res.body.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    });

    it("returns 400 VALIDATION_ERROR on invalid UUID parameter for DELETE post", async () => {
      const res = await request(app)
        .delete("/api/community/posts/not-a-valid-uuid")
        .set("Authorization", authHeader)
        .expect(HTTP_STATUS.BAD_REQUEST);

      expect(res.body.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    });

    it("returns 400 VALIDATION_ERROR when limit is outside 1..50", async () => {
      const res0 = await request(app)
        .get("/api/community/posts?limit=0")
        .set("Authorization", authHeader)
        .expect(HTTP_STATUS.BAD_REQUEST);

      expect(res0.body.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);

      const res51 = await request(app)
        .get("/api/community/posts?limit=51")
        .set("Authorization", authHeader)
        .expect(HTTP_STATUS.BAD_REQUEST);

      expect(res51.body.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    });

    it("returns 400 VALIDATION_ERROR on corrupted / malformed cursor parameter", async () => {
      const res = await request(app)
        .get("/api/community/posts?cursor=corrupted_tampered_cursor_123")
        .set("Authorization", authHeader)
        .expect(HTTP_STATUS.BAD_REQUEST);

      expect(res.body.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    });
  });

  // ============================================================================
  // AC-001, AC-022: Disallowed Route Methods
  // ============================================================================
  describe("AC-001, AC-022: Unapproved Routes & Methods Disallowed", () => {
    it("returns 404 NOT_FOUND on PATCH /api/community/posts/:postId (no edit route)", async () => {
      const res = await request(app)
        .patch(`/api/community/posts/${validUuid}`)
        .set("Authorization", authHeader)
        .send({ content: "Updated content" })
        .expect(HTTP_STATUS.NOT_FOUND);

      expect(res.body.error.code).toBe(ERROR_CODES.NOT_FOUND);
    });

    it("returns 404 NOT_FOUND on PUT /api/community/posts/:postId", async () => {
      const res = await request(app)
        .put(`/api/community/posts/${validUuid}`)
        .set("Authorization", authHeader)
        .send({ content: "Updated content" })
        .expect(HTTP_STATUS.NOT_FOUND);

      expect(res.body.error.code).toBe(ERROR_CODES.NOT_FOUND);
    });
  });
});
