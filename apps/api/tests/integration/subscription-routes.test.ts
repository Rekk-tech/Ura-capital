import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import type { User } from "@prisma/client";
import { createApp } from "../../src/server.js";
import { accessTokenService } from "../../src/modules/auth/access-token.service.js";
import { userRepository } from "../../src/modules/users/user.repository.js";
import { PrismaSubscriptionRepository } from "../../src/modules/subscription/subscription.repository.js";
import type { AccessTokenPayload } from "../../src/modules/auth/auth.types.js";
import {
  ERROR_CODES,
  HTTP_STATUS,
  SubscriptionPlansResponseSchema,
  SubscriptionMeResponseSchema,
} from "@aura/shared";

describe("FEAT-050 Subscription Read Routes (HTTP Integration)", () => {
  const app = createApp();
  const testUserId = "11111111-1111-4111-8111-111111111111";
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
  // 1. GET /api/subscriptions/plans (Public Safe Read - FR-001, AC-001, AC-004)
  // ============================================================================
  describe("GET /api/subscriptions/plans", () => {
    it("returns 200 OK with server-owned plans without authentication", async () => {
      const res = await request(app)
        .get("/api/subscriptions/plans")
        .expect(HTTP_STATUS.OK);

      expect(res.body).toHaveProperty("data");
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data).toHaveLength(2);

      // Verify schema adherence (AC-004)
      const parseResult = SubscriptionPlansResponseSchema.safeParse(res.body);
      expect(parseResult.success).toBe(true);

      const [freePlan, premiumPlan] = res.body.data;
      expect(freePlan.planKey).toBe("FREE");
      expect(freePlan.available).toBe(true);
      expect(freePlan.entitlements).toEqual([]);

      expect(premiumPlan.planKey).toBe("PREMIUM");
      expect(premiumPlan.available).toBe(true);
      expect(premiumPlan.entitlements).toEqual(["PREMIUM_ACCESS"]);

      // Verify absolute absence of provider secrets / price IDs
      for (const plan of res.body.data) {
        expect(plan).not.toHaveProperty("providerKey");
        expect(plan).not.toHaveProperty("providerPriceId");
        expect(plan).not.toHaveProperty("secret");
        expect(plan).not.toHaveProperty("id");
      }
    });

    it("also supports the unprefixed /subscriptions/plans route", async () => {
      const res = await request(app)
        .get("/subscriptions/plans")
        .expect(HTTP_STATUS.OK);

      expect(res.body.data).toHaveLength(2);
    });

    it("rejects unexpected query parameters (AC-003, AC-010)", async () => {
      const res = await request(app)
        .get("/api/subscriptions/plans?userId=malicious-id")
        .expect(HTTP_STATUS.BAD_REQUEST);

      expect(res.body.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    });

    it("rejects non-empty body payload on GET (AC-003, AC-011)", async () => {
      const res = await request(app)
        .get("/api/subscriptions/plans")
        .send({ plan: "PREMIUM" })
        .expect(HTTP_STATUS.BAD_REQUEST);

      expect(res.body.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    });
  });

  // ============================================================================
  // 2. GET /api/subscriptions/me (Authenticated Current-User Read - FR-002, AC-002)
  // ============================================================================
  describe("GET /api/subscriptions/me", () => {
    it("returns 401 UNAUTHENTICATED when Authorization header is absent", async () => {
      const res = await request(app)
        .get("/api/subscriptions/me")
        .expect(HTTP_STATUS.UNAUTHORIZED);

      expect(res.body.error.code).toBe(ERROR_CODES.UNAUTHENTICATED);
    });

    it("returns 401 UNAUTHENTICATED on invalid bearer token format", async () => {
      const res = await request(app)
        .get("/api/subscriptions/me")
        .set("Authorization", "Basic invalid")
        .expect(HTTP_STATUS.UNAUTHORIZED);

      expect(res.body.error.code).toBe(ERROR_CODES.UNAUTHENTICATED);
    });

    it("rejects unexpected query parameters on /me (AC-003, AC-009)", async () => {
      const res = await request(app)
        .get("/api/subscriptions/me?userId=victim-user-id")
        .set("Authorization", authHeader)
        .expect(HTTP_STATUS.BAD_REQUEST);

      expect(res.body.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    });

    it("rejects non-empty body payload on /me (AC-003, AC-010)", async () => {
      const res = await request(app)
        .get("/api/subscriptions/me")
        .set("Authorization", authHeader)
        .send({ userId: "hacked", isPremium: true })
        .expect(HTTP_STATUS.BAD_REQUEST);

      expect(res.body.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    });

    it("returns canonical FREE projection when user has no subscription record (AC-008)", async () => {
      vi.spyOn(PrismaSubscriptionRepository.prototype, "findActiveByUserId").mockResolvedValueOnce(null);

      const res = await request(app)
        .get("/api/subscriptions/me")
        .set("Authorization", authHeader)
        .expect(HTTP_STATUS.OK);

      expect(res.body.data).toEqual({
        plan: "FREE",
        planKey: "FREE",
        status: "NONE",
        entitlements: [],
        isEntitled: false,
        currentPeriodStart: null,
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
      });

      // Strict schema check
      const parseResult = SubscriptionMeResponseSchema.safeParse(res.body);
      expect(parseResult.success).toBe(true);

      // Sensitive field check
      expect(res.body.data).not.toHaveProperty("userId");
      expect(res.body.data).not.toHaveProperty("providerKey");
      expect(res.body.data).not.toHaveProperty("providerEventId");
    });

    it("returns ACTIVE PREMIUM projection with PREMIUM_ACCESS within valid period (AC-007)", async () => {
      const now = new Date();
      const periodStart = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      vi.spyOn(PrismaSubscriptionRepository.prototype, "findActiveByUserId").mockResolvedValueOnce({
        id: "sub-uuid-1",
        userId: testUserId,
        planKey: "PREMIUM",
        status: "ACTIVE",
        providerKey: "MOCK",
        externalSubscriptionId: "ext-sub-1",
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
        cancelAtPeriodEnd: false,
        providerSyncMarker: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const res = await request(app)
        .get("/api/subscriptions/me")
        .set("Authorization", authHeader)
        .expect(HTTP_STATUS.OK);

      expect(res.body.data).toEqual({
        plan: "PREMIUM",
        planKey: "PREMIUM",
        status: "ACTIVE",
        entitlements: ["PREMIUM_ACCESS"],
        isEntitled: true,
        currentPeriodStart: periodStart.toISOString(),
        currentPeriodEnd: periodEnd.toISOString(),
        cancelAtPeriodEnd: false,
      });

      expect(res.body.data).not.toHaveProperty("userId");
      expect(res.body.data).not.toHaveProperty("externalSubscriptionId");
    });

    it("returns PAST_DUE projection with no PREMIUM_ACCESS (D4, AC-007)", async () => {
      const now = new Date();
      const periodStart = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      vi.spyOn(PrismaSubscriptionRepository.prototype, "findActiveByUserId").mockResolvedValueOnce({
        id: "sub-uuid-2",
        userId: testUserId,
        planKey: "PREMIUM",
        status: "PAST_DUE",
        providerKey: "MOCK",
        externalSubscriptionId: "ext-sub-2",
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
        cancelAtPeriodEnd: false,
        providerSyncMarker: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const res = await request(app)
        .get("/api/subscriptions/me")
        .set("Authorization", authHeader)
        .expect(HTTP_STATUS.OK);

      expect(res.body.data.status).toBe("PAST_DUE");
      expect(res.body.data.isEntitled).toBe(false);
      expect(res.body.data.entitlements).toEqual([]);
    });

    it("returns EXPIRED projection when period end is past (AC-007)", async () => {
      const now = new Date();
      const periodStart = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
      const periodEnd = new Date(now.getTime() - 1000); // 1s ago

      vi.spyOn(PrismaSubscriptionRepository.prototype, "findActiveByUserId").mockResolvedValueOnce({
        id: "sub-uuid-3",
        userId: testUserId,
        planKey: "PREMIUM",
        status: "ACTIVE",
        providerKey: "MOCK",
        externalSubscriptionId: "ext-sub-3",
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
        cancelAtPeriodEnd: true,
        providerSyncMarker: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const res = await request(app)
        .get("/api/subscriptions/me")
        .set("Authorization", authHeader)
        .expect(HTTP_STATUS.OK);

      expect(res.body.data.status).toBe("EXPIRED");
      expect(res.body.data.isEntitled).toBe(false);
      expect(res.body.data.entitlements).toEqual([]);
    });

    it("sanitizes unexpected persistence errors with 500 envelope (AC-012)", async () => {
      vi.spyOn(PrismaSubscriptionRepository.prototype, "findActiveByUserId").mockRejectedValueOnce(
        new Error("Connection terminated unexpectedly"),
      );

      const res = await request(app)
        .get("/api/subscriptions/me")
        .set("Authorization", authHeader)
        .expect(HTTP_STATUS.INTERNAL_SERVER_ERROR);

      expect(res.body).toHaveProperty("error");
      expect(res.body.error.code).toBe(ERROR_CODES.INTERNAL_ERROR);
      expect(res.body.error.message).not.toContain("Connection terminated");
    });
  });
});
