import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import type { User } from "@prisma/client";
import { createApp } from "../../src/server.js";
import { accessTokenService } from "../../src/modules/auth/access-token.service.js";
import { userRepository } from "../../src/modules/users/user.repository.js";
import type { AccessTokenPayload } from "../../src/modules/auth/auth.types.js";
import { ERROR_CODES, HTTP_STATUS } from "@aura/shared";

describe("FEAT-033 Simulation Session Lifecycle HTTP Routes (Integration)", () => {
  const app = createApp();
  const testUserId = "00000000-0000-0000-0000-000000000001";
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
      email: "test@auracapital.com",
      status: "ACTIVE",
      displayName: "Test User",
      createdAt: new Date(),
      updatedAt: new Date(),
    } as User);
  });

  describe("Authentication Requirements (All Routes)", () => {
    it("returns 401 UNAUTHENTICATED on GET /api/simulation/sessions without token", async () => {
      const res = await request(app)
        .get("/api/simulation/sessions")
        .expect(HTTP_STATUS.UNAUTHORIZED);

      expect(res.body.error.code).toBe(ERROR_CODES.UNAUTHENTICATED);
    });

    it("returns 401 UNAUTHENTICATED on POST /api/simulation/sessions without token", async () => {
      const res = await request(app)
        .post("/api/simulation/sessions")
        .send({})
        .expect(HTTP_STATUS.UNAUTHORIZED);

      expect(res.body.error.code).toBe(ERROR_CODES.UNAUTHENTICATED);
    });

    it("returns 401 UNAUTHENTICATED on GET /api/simulation/sessions/:id without token", async () => {
      const res = await request(app)
        .get("/api/simulation/sessions/00000000-0000-0000-0000-000000000001")
        .expect(HTTP_STATUS.UNAUTHORIZED);

      expect(res.body.error.code).toBe(ERROR_CODES.UNAUTHENTICATED);
    });

    it("returns 401 UNAUTHENTICATED on POST /api/simulation/sessions/:id/start without token", async () => {
      const res = await request(app)
        .post("/api/simulation/sessions/00000000-0000-0000-0000-000000000001/start")
        .expect(HTTP_STATUS.UNAUTHORIZED);

      expect(res.body.error.code).toBe(ERROR_CODES.UNAUTHENTICATED);
    });

    it("returns 401 UNAUTHENTICATED on POST /api/simulation/sessions/:id/complete without token", async () => {
      const res = await request(app)
        .post("/api/simulation/sessions/00000000-0000-0000-0000-000000000001/complete")
        .expect(HTTP_STATUS.UNAUTHORIZED);

      expect(res.body.error.code).toBe(ERROR_CODES.UNAUTHENTICATED);
    });

    it("returns 401 UNAUTHENTICATED on POST /api/simulation/sessions/:id/cancel without token", async () => {
      const res = await request(app)
        .post("/api/simulation/sessions/00000000-0000-0000-0000-000000000001/cancel")
        .expect(HTTP_STATUS.UNAUTHORIZED);

      expect(res.body.error.code).toBe(ERROR_CODES.UNAUTHENTICATED);
    });

    it("returns 401 UNAUTHENTICATED on POST /api/simulation/sessions/:id/reset without token", async () => {
      const res = await request(app)
        .post("/api/simulation/sessions/00000000-0000-0000-0000-000000000001/reset")
        .expect(HTTP_STATUS.UNAUTHORIZED);

      expect(res.body.error.code).toBe(ERROR_CODES.UNAUTHENTICATED);
    });
  });

  describe("AC-001: Strict Schema Authority Rejections (POST /api/simulation/sessions)", () => {
    it("rejects client-provided userId with 400 VALIDATION_ERROR", async () => {
      const res = await request(app)
        .post("/api/simulation/sessions")
        .set("Authorization", authHeader)
        .send({ userId: "attacker-user-id" })
        .expect(HTTP_STATUS.BAD_REQUEST);

      expect(res.body.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
      expect(res.body.error.message).toContain("userId");
    });

    it("rejects client-provided startingCash with 400 VALIDATION_ERROR", async () => {
      const res = await request(app)
        .post("/api/simulation/sessions")
        .set("Authorization", authHeader)
        .send({ startingCash: 500000 })
        .expect(HTTP_STATUS.BAD_REQUEST);

      expect(res.body.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    });

    it("rejects client-provided cash with 400 VALIDATION_ERROR", async () => {
      const res = await request(app)
        .post("/api/simulation/sessions")
        .set("Authorization", authHeader)
        .send({ cash: 500000 })
        .expect(HTTP_STATUS.BAD_REQUEST);

      expect(res.body.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    });

    it("rejects client-provided status with 400 VALIDATION_ERROR", async () => {
      const res = await request(app)
        .post("/api/simulation/sessions")
        .set("Authorization", authHeader)
        .send({ status: "ACTIVE" })
        .expect(HTTP_STATUS.BAD_REQUEST);

      expect(res.body.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    });

    it("rejects client-provided currentCycle with 400 VALIDATION_ERROR", async () => {
      const res = await request(app)
        .post("/api/simulation/sessions")
        .set("Authorization", authHeader)
        .send({ currentCycle: 5 })
        .expect(HTTP_STATUS.BAD_REQUEST);

      expect(res.body.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    });

    it("rejects client-provided scenarioId with 400 VALIDATION_ERROR", async () => {
      const res = await request(app)
        .post("/api/simulation/sessions")
        .set("Authorization", authHeader)
        .send({ scenarioId: "00000000-0000-0000-0000-000000000099" })
        .expect(HTTP_STATUS.BAD_REQUEST);

      expect(res.body.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    });

    it("rejects arbitrary unexpected keys with 400 VALIDATION_ERROR", async () => {
      const res = await request(app)
        .post("/api/simulation/sessions")
        .set("Authorization", authHeader)
        .send({ arbitraryKey: "arbitraryValue" })
        .expect(HTTP_STATUS.BAD_REQUEST);

      expect(res.body.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    });
  });

  describe("Validation on Parameters & Queries", () => {
    it("returns 400 VALIDATION_ERROR on invalid UUID simulationId parameter", async () => {
      const res = await request(app)
        .get("/api/simulation/sessions/not-a-uuid")
        .set("Authorization", authHeader)
        .expect(HTTP_STATUS.BAD_REQUEST);

      expect(res.body.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    });

    it("returns 400 VALIDATION_ERROR on invalid query status filter", async () => {
      const res = await request(app)
        .get("/api/simulation/sessions?status=INVALID_STATUS")
        .set("Authorization", authHeader)
        .expect(HTTP_STATUS.BAD_REQUEST);

      expect(res.body.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    });
  });
});
