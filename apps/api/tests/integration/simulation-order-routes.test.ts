import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import type { User } from "@prisma/client";
import { createApp } from "../../src/server.js";
import { accessTokenService } from "../../src/modules/auth/access-token.service.js";
import { userRepository } from "../../src/modules/users/user.repository.js";
import type { AccessTokenPayload } from "../../src/modules/auth/auth.types.js";
import { ERROR_CODES, HTTP_STATUS } from "@aura/shared";

describe("FEAT-035 Simulation Order Submission HTTP Routes (Integration)", () => {
  const app = createApp();
  const testUserId = "00000000-0000-0000-0000-000000000001";
  const testSessionId = "11111111-1111-1111-1111-111111111111";
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

  describe("Authentication Requirements (POST /api/simulation/sessions/:simulationId/orders)", () => {
    it("returns 401 UNAUTHENTICATED without token", async () => {
      const res = await request(app)
        .post(`/api/simulation/sessions/${testSessionId}/orders`)
        .send({
          side: "BUY",
          type: "MARKET",
          assetSymbol: "AURA",
          quantity: 1,
          idempotencyKey: "k-auth-1",
        })
        .expect(HTTP_STATUS.UNAUTHORIZED);

      expect(res.body.error.code).toBe(ERROR_CODES.UNAUTHENTICATED);
    });

    it("returns 401 UNAUTHENTICATED with invalid token format", async () => {
      const res = await request(app)
        .post(`/api/simulation/sessions/${testSessionId}/orders`)
        .set("Authorization", "InvalidFormatToken")
        .send({
          side: "BUY",
          type: "MARKET",
          assetSymbol: "AURA",
          quantity: 1,
          idempotencyKey: "k-auth-2",
        })
        .expect(HTTP_STATUS.UNAUTHORIZED);

      expect(res.body.error.code).toBe(ERROR_CODES.UNAUTHENTICATED);
    });
  });

  describe("AC-001: Path Parameter Validation", () => {
    it("rejects non-UUID simulationId with 400 VALIDATION_ERROR", async () => {
      const res = await request(app)
        .post("/api/simulation/sessions/invalid-not-a-uuid/orders")
        .set("Authorization", authHeader)
        .send({
          side: "BUY",
          type: "MARKET",
          assetSymbol: "AURA",
          quantity: 1,
          idempotencyKey: "k-uuid",
        })
        .expect(HTTP_STATUS.BAD_REQUEST);

      expect(res.body.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
      expect(res.body.error.message).toContain("simulationId");
    });
  });

  describe("AC-017 / FR-003: Strict Schema Authority Rejections", () => {
    it("rejects client-provided executionPrice with 400 VALIDATION_ERROR", async () => {
      const res = await request(app)
        .post(`/api/simulation/sessions/${testSessionId}/orders`)
        .set("Authorization", authHeader)
        .send({
          side: "BUY",
          type: "MARKET",
          assetSymbol: "AURA",
          quantity: 1,
          idempotencyKey: "k-p",
          executionPrice: 150.25,
        })
        .expect(HTTP_STATUS.BAD_REQUEST);

      expect(res.body.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
      expect(res.body.error.message).toContain("executionPrice");
    });

    it("rejects client-provided cashAfter with 400 VALIDATION_ERROR", async () => {
      const res = await request(app)
        .post(`/api/simulation/sessions/${testSessionId}/orders`)
        .set("Authorization", authHeader)
        .send({
          side: "BUY",
          type: "MARKET",
          assetSymbol: "AURA",
          quantity: 1,
          idempotencyKey: "k-ca",
          cashAfter: 99000,
        })
        .expect(HTTP_STATUS.BAD_REQUEST);

      expect(res.body.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
      expect(res.body.error.message).toContain("cashAfter");
    });

    it("rejects client-provided positionAfter with 400 VALIDATION_ERROR", async () => {
      const res = await request(app)
        .post(`/api/simulation/sessions/${testSessionId}/orders`)
        .set("Authorization", authHeader)
        .send({
          side: "BUY",
          type: "MARKET",
          assetSymbol: "AURA",
          quantity: 1,
          idempotencyKey: "k-pa",
          positionAfter: 50,
        })
        .expect(HTTP_STATUS.BAD_REQUEST);

      expect(res.body.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
      expect(res.body.error.message).toContain("positionAfter");
    });

    it("rejects client-provided realizedPnl with 400 VALIDATION_ERROR", async () => {
      const res = await request(app)
        .post(`/api/simulation/sessions/${testSessionId}/orders`)
        .set("Authorization", authHeader)
        .send({
          side: "SELL",
          type: "MARKET",
          assetSymbol: "AURA",
          quantity: 1,
          idempotencyKey: "k-pnl",
          realizedPnl: 100,
        })
        .expect(HTTP_STATUS.BAD_REQUEST);

      expect(res.body.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
      expect(res.body.error.message).toContain("realizedPnl");
    });

    it("rejects client-provided status with 400 VALIDATION_ERROR", async () => {
      const res = await request(app)
        .post(`/api/simulation/sessions/${testSessionId}/orders`)
        .set("Authorization", authHeader)
        .send({
          side: "BUY",
          type: "MARKET",
          assetSymbol: "AURA",
          quantity: 1,
          idempotencyKey: "k-st",
          status: "FILLED",
        })
        .expect(HTTP_STATUS.BAD_REQUEST);

      expect(res.body.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    });

    it("rejects client-provided userId with 400 VALIDATION_ERROR", async () => {
      const res = await request(app)
        .post(`/api/simulation/sessions/${testSessionId}/orders`)
        .set("Authorization", authHeader)
        .send({
          side: "BUY",
          type: "MARKET",
          assetSymbol: "AURA",
          quantity: 1,
          idempotencyKey: "k-uid",
          userId: "arbitrary-user-id",
        })
        .expect(HTTP_STATUS.BAD_REQUEST);

      expect(res.body.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    });
  });

  describe("AC-002, AC-003, AC-004: Invalid Intent Rejections", () => {
    it("rejects non-MARKET orders (e.g. LIMIT) with 400 VALIDATION_ERROR", async () => {
      const res = await request(app)
        .post(`/api/simulation/sessions/${testSessionId}/orders`)
        .set("Authorization", authHeader)
        .send({
          side: "BUY",
          type: "LIMIT",
          assetSymbol: "AURA",
          quantity: 1,
          idempotencyKey: "k-limit",
        })
        .expect(HTTP_STATUS.BAD_REQUEST);

      expect(res.body.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    });

    it("rejects zero quantity with 400 VALIDATION_ERROR", async () => {
      const res = await request(app)
        .post(`/api/simulation/sessions/${testSessionId}/orders`)
        .set("Authorization", authHeader)
        .send({
          side: "BUY",
          type: "MARKET",
          assetSymbol: "AURA",
          quantity: 0,
          idempotencyKey: "k-zero",
        })
        .expect(HTTP_STATUS.BAD_REQUEST);

      expect(res.body.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    });

    it("rejects negative quantity with 400 VALIDATION_ERROR", async () => {
      const res = await request(app)
        .post(`/api/simulation/sessions/${testSessionId}/orders`)
        .set("Authorization", authHeader)
        .send({
          side: "BUY",
          type: "MARKET",
          assetSymbol: "AURA",
          quantity: -10,
          idempotencyKey: "k-neg",
        })
        .expect(HTTP_STATUS.BAD_REQUEST);

      expect(res.body.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    });

    it("rejects floating-point fractional quantity with 400 VALIDATION_ERROR", async () => {
      const res = await request(app)
        .post(`/api/simulation/sessions/${testSessionId}/orders`)
        .set("Authorization", authHeader)
        .send({
          side: "BUY",
          type: "MARKET",
          assetSymbol: "AURA",
          quantity: 2.75,
          idempotencyKey: "k-float",
        })
        .expect(HTTP_STATUS.BAD_REQUEST);

      expect(res.body.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    });

    it("rejects unexpected fields with 400 VALIDATION_ERROR", async () => {
      const res = await request(app)
        .post(`/api/simulation/sessions/${testSessionId}/orders`)
        .set("Authorization", authHeader)
        .send({
          side: "BUY",
          type: "MARKET",
          assetSymbol: "AURA",
          quantity: 1,
          idempotencyKey: "k-extra",
          unexpectedPayloadField: "attack",
        })
        .expect(HTTP_STATUS.BAD_REQUEST);

      expect(res.body.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    });
  });

  describe("AC-024 / Error Envelope Security", () => {
    it("ensures public error responses contain no stack traces or database internals", async () => {
      const res = await request(app)
        .post(`/api/simulation/sessions/${testSessionId}/orders`)
        .set("Authorization", authHeader)
        .send({
          side: "BUY",
          type: "MARKET",
          assetSymbol: "AURA",
          quantity: -1,
          idempotencyKey: "k-envelope",
        })
        .expect(HTTP_STATUS.BAD_REQUEST);

      expect(res.body).toHaveProperty("error");
      expect(res.body.error).toHaveProperty("code");
      expect(res.body.error).toHaveProperty("message");
      expect(res.body.error.stack).toBeUndefined();
      expect(JSON.stringify(res.body)).not.toContain("PrismaClient");
      expect(JSON.stringify(res.body)).not.toContain("SELECT");
    });
  });
});
