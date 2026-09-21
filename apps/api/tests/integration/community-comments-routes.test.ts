import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import type { User } from "@prisma/client";
import { createApp } from "../../src/server.js";
import { accessTokenService } from "../../src/modules/auth/access-token.service.js";
import { userRepository } from "../../src/modules/users/user.repository.js";
import type { AccessTokenPayload } from "../../src/modules/auth/auth.types.js";
import { ERROR_CODES, HTTP_STATUS } from "@aura/shared";

describe("FEAT-043 Community Comments HTTP Routes (Integration)", () => {
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
  // 1. Authentication Requirements
  // ============================================================================
  describe("Authentication Enforcement", () => {
    it("returns 401 UNAUTHENTICATED on GET /api/community/posts/:postId/comments without token", async () => {
      const res = await request(app)
        .get(`/api/community/posts/${validUuid}/comments`)
        .expect(HTTP_STATUS.UNAUTHORIZED);

      expect(res.body.error.code).toBe(ERROR_CODES.UNAUTHENTICATED);
    });

    it("returns 401 UNAUTHENTICATED on POST /api/community/posts/:postId/comments without token", async () => {
      const res = await request(app)
        .post(`/api/community/posts/${validUuid}/comments`)
        .send({ content: "Unauthorized comment" })
        .expect(HTTP_STATUS.UNAUTHORIZED);

      expect(res.body.error.code).toBe(ERROR_CODES.UNAUTHENTICATED);
    });

    it("returns 401 UNAUTHENTICATED on DELETE /api/community/comments/:commentId without token", async () => {
      const res = await request(app)
        .delete(`/api/community/comments/${validUuid}`)
        .expect(HTTP_STATUS.UNAUTHORIZED);

      expect(res.body.error.code).toBe(ERROR_CODES.UNAUTHENTICATED);
    });

    it("returns 401 UNAUTHENTICATED when bearer header is malformed", async () => {
      const res = await request(app)
        .get(`/api/community/posts/${validUuid}/comments`)
        .set("Authorization", "InvalidHeaderFormat")
        .expect(HTTP_STATUS.UNAUTHORIZED);

      expect(res.body.error.code).toBe(ERROR_CODES.UNAUTHENTICATED);
    });
  });

  // ============================================================================
  // 2. Request Validation & Envelope Errors
  // ============================================================================
  describe("Validation Contracts", () => {
    it("returns 400 VALIDATION_ERROR on empty content for POST comments", async () => {
      const res = await request(app)
        .post(`/api/community/posts/${validUuid}/comments`)
        .set("Authorization", authHeader)
        .send({ content: "" })
        .expect(HTTP_STATUS.BAD_REQUEST);

      expect(res.body.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    });

    it("returns 400 VALIDATION_ERROR on whitespace-only content for POST comments", async () => {
      const res = await request(app)
        .post(`/api/community/posts/${validUuid}/comments`)
        .set("Authorization", authHeader)
        .send({ content: "   \t\n   " })
        .expect(HTTP_STATUS.BAD_REQUEST);

      expect(res.body.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    });

    it("returns 400 VALIDATION_ERROR when content exceeds 2,000 characters", async () => {
      const res = await request(app)
        .post(`/api/community/posts/${validUuid}/comments`)
        .set("Authorization", authHeader)
        .send({ content: "B".repeat(2001) })
        .expect(HTTP_STATUS.BAD_REQUEST);

      expect(res.body.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    });

    it("returns 400 VALIDATION_ERROR when client attempts to inject unapproved properties", async () => {
      const res = await request(app)
        .post(`/api/community/posts/${validUuid}/comments`)
        .set("Authorization", authHeader)
        .send({
          content: "Valid text",
          parentCommentId: "99999999-9999-9999-9999-999999999999",
          replyTo: "Alice",
        })
        .expect(HTTP_STATUS.BAD_REQUEST);

      expect(res.body.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    });

    it("returns 400 VALIDATION_ERROR on invalid UUID parameter for GET comments", async () => {
      const res = await request(app)
        .get("/api/community/posts/not-a-valid-uuid/comments")
        .set("Authorization", authHeader)
        .expect(HTTP_STATUS.BAD_REQUEST);

      expect(res.body.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    });

    it("returns 400 VALIDATION_ERROR on invalid UUID parameter for POST comments", async () => {
      const res = await request(app)
        .post("/api/community/posts/not-a-valid-uuid/comments")
        .set("Authorization", authHeader)
        .send({ content: "Hello world" })
        .expect(HTTP_STATUS.BAD_REQUEST);

      expect(res.body.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    });

    it("returns 400 VALIDATION_ERROR on invalid UUID parameter for DELETE comment", async () => {
      const res = await request(app)
        .delete("/api/community/comments/not-a-valid-uuid")
        .set("Authorization", authHeader)
        .expect(HTTP_STATUS.BAD_REQUEST);

      expect(res.body.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    });

    it("returns 400 VALIDATION_ERROR when limit is outside 1..50", async () => {
      const res0 = await request(app)
        .get(`/api/community/posts/${validUuid}/comments?limit=0`)
        .set("Authorization", authHeader)
        .expect(HTTP_STATUS.BAD_REQUEST);

      expect(res0.body.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);

      const res51 = await request(app)
        .get(`/api/community/posts/${validUuid}/comments?limit=51`)
        .set("Authorization", authHeader)
        .expect(HTTP_STATUS.BAD_REQUEST);

      expect(res51.body.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    });

    it("returns 400 VALIDATION_ERROR on corrupted / malformed cursor parameter", async () => {
      const res = await request(app)
        .get(`/api/community/posts/${validUuid}/comments?cursor=corrupted_tampered_cursor_123`)
        .set("Authorization", authHeader)
        .expect(HTTP_STATUS.BAD_REQUEST);

      expect(res.body.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    });
  });

  // ============================================================================
  // 3. Unapproved Routes & Methods Disallowed
  // ============================================================================
  describe("Unapproved Routes & Methods Disallowed", () => {
    it("returns 404 NOT_FOUND on PATCH /api/community/comments/:commentId (no comment edit route)", async () => {
      const res = await request(app)
        .patch(`/api/community/comments/${validUuid}`)
        .set("Authorization", authHeader)
        .send({ content: "Updated content" })
        .expect(HTTP_STATUS.NOT_FOUND);

      expect(res.body.error.code).toBe(ERROR_CODES.NOT_FOUND);
    });

    it("returns 404 NOT_FOUND on PUT /api/community/comments/:commentId", async () => {
      const res = await request(app)
        .put(`/api/community/comments/${validUuid}`)
        .set("Authorization", authHeader)
        .send({ content: "Updated content" })
        .expect(HTTP_STATUS.NOT_FOUND);

      expect(res.body.error.code).toBe(ERROR_CODES.NOT_FOUND);
    });

    it("returns 404 NOT_FOUND on GET /api/community/comments/:commentId (detail route not in spec)", async () => {
      const res = await request(app)
        .get(`/api/community/comments/${validUuid}`)
        .set("Authorization", authHeader)
        .expect(HTTP_STATUS.NOT_FOUND);

      expect(res.body.error.code).toBe(ERROR_CODES.NOT_FOUND);
    });

    it("returns 400 VALIDATION_ERROR on DELETE /api/community/comments/:commentId with non-empty body (DEF-001)", async () => {
      const res = await request(app)
        .delete(`/api/community/comments/${validUuid}`)
        .set("Authorization", authHeader)
        .send({ status: "REMOVED", moderatorId: "mod-1" })
        .expect(HTTP_STATUS.BAD_REQUEST);

      expect(res.body.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    });
  });
});
