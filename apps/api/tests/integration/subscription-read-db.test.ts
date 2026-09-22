import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import { PrismaClient } from "@prisma/client";
import {
  assertSafeTestDatabase,
  sanitizeDiagnosticMessage,
  cleanAllTestTables,
} from "../helpers/test-db-guard.js";
import { createApp } from "../../src/server.js";
import { accessTokenService } from "../../src/modules/auth/access-token.service.js";
import { HTTP_STATUS, ERROR_CODES } from "@aura/shared";

describe("FEAT-050 Subscription Read APIs (PostgreSQL Live Database Integration)", () => {
  const testDbUrl =
    process.env.TEST_DATABASE_URL ||
    process.env.DATABASE_URL ||
    "postgresql://postgres:postgrespassword@localhost:5432/aura_capital_test_feat019_rework2_fresh";

  let prisma: PrismaClient;
  const app = createApp();

  let userA: { id: string; email: string };
  let userB: { id: string; email: string };
  let userAToken: string;
  let userBToken: string;

  beforeAll(async () => {
    assertSafeTestDatabase(testDbUrl, "test");
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: testDbUrl,
        },
      },
    });

    try {
      await prisma.$connect();
    } catch (err: unknown) {
      const errorMessage = sanitizeDiagnosticMessage(
        err instanceof Error ? err.message : String(err),
      );
      throw new Error(
        `[DB_CONNECTION_FAILED] Required PostgreSQL test database unreachable: ${errorMessage}`,
      );
    }
  });

  afterAll(async () => {
    if (prisma) {
      await cleanAllTestTables(prisma);
      await prisma.$disconnect();
    }
  });

  beforeEach(async () => {
    await cleanAllTestTables(prisma);

    // Seed 2 distinct active users
    const createdA = await prisma.user.create({
      data: {
        email: "read_user_a@test.aura.capital",
        displayName: "Learner A",
        status: "ACTIVE",
      },
    });
    userA = { id: createdA.id, email: createdA.email };
    userAToken = accessTokenService.issueAccessToken(userA.id).accessToken;

    const createdB = await prisma.user.create({
      data: {
        email: "read_user_b@test.aura.capital",
        displayName: "Learner B",
        status: "ACTIVE",
      },
    });
    userB = { id: createdB.id, email: createdB.email };
    userBToken = accessTokenService.issueAccessToken(userB.id).accessToken;
  });

  // ============================================================================
  // 1. GET /api/subscriptions/plans (Public Safe Read against PostgreSQL runtime)
  // ============================================================================
  describe("GET /api/subscriptions/plans", () => {
    it("returns public plan catalog with zero DB mutations (AC-004, AC-011)", async () => {
      const subsCountBefore = await prisma.userSubscription.count();

      const res = await request(app)
        .get("/api/subscriptions/plans")
        .expect(HTTP_STATUS.OK);

      expect(res.body.data).toHaveLength(2);
      expect(res.body.data[0].planKey).toBe("FREE");
      expect(res.body.data[0].available).toBe(true);
      expect(res.body.data[1].planKey).toBe("PREMIUM");
      expect(res.body.data[1].available).toBe(true);

      const subsCountAfter = await prisma.userSubscription.count();
      expect(subsCountAfter).toBe(subsCountBefore);
    });

    it("rejects malicious query params attempting to inspect users (AC-003, AC-009)", async () => {
      const res = await request(app)
        .get(`/api/subscriptions/plans?targetUserId=${userA.id}`)
        .expect(HTTP_STATUS.BAD_REQUEST);

      expect(res.body.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    });
  });

  // ============================================================================
  // 2. GET /api/subscriptions/me (PostgreSQL Authoritative Reads)
  // ============================================================================
  describe("GET /api/subscriptions/me (PostgreSQL Authority)", () => {
    it("returns FREE projection when user has no subscription in PostgreSQL (AC-008)", async () => {
      const res = await request(app)
        .get("/api/subscriptions/me")
        .set("Authorization", `Bearer ${userAToken}`)
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

      // No sensitive internals leaked
      expect(res.body.data).not.toHaveProperty("userId");
      expect(res.body.data).not.toHaveProperty("id");
    });

    it("returns ACTIVE PREMIUM when PostgreSQL has valid active subscription (AC-007)", async () => {
      const now = new Date();
      const periodStart = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      await prisma.userSubscription.create({
        data: {
          userId: userA.id,
          planKey: "PREMIUM",
          status: "ACTIVE",
          providerKey: "MOCK",
          externalSubscriptionId: "ext-sub-a-1",
          currentPeriodStart: periodStart,
          currentPeriodEnd: periodEnd,
          cancelAtPeriodEnd: false,
        },
      });

      const res = await request(app)
        .get("/api/subscriptions/me")
        .set("Authorization", `Bearer ${userAToken}`)
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
    });

    it("proves IDOR isolation: User B cannot see User A's PREMIUM subscription (AC-009)", async () => {
      // User A is PREMIUM
      const now = new Date();
      await prisma.userSubscription.create({
        data: {
          userId: userA.id,
          planKey: "PREMIUM",
          status: "ACTIVE",
          providerKey: "MOCK",
          externalSubscriptionId: "ext-sub-a-idor",
          currentPeriodStart: new Date(now.getTime() - 1000),
          currentPeriodEnd: new Date(now.getTime() + 86400000),
          cancelAtPeriodEnd: false,
        },
      });

      // User B has no subscription -> must receive FREE
      const resB = await request(app)
        .get("/api/subscriptions/me")
        .set("Authorization", `Bearer ${userBToken}`)
        .expect(HTTP_STATUS.OK);

      expect(resB.body.data.plan).toBe("FREE");
      expect(resB.body.data.status).toBe("NONE");
      expect(resB.body.data.isEntitled).toBe(false);

      // User B attempts IDOR via query param -> rejected with 400
      const resIdorQuery = await request(app)
        .get(`/api/subscriptions/me?userId=${userA.id}`)
        .set("Authorization", `Bearer ${userBToken}`)
        .expect(HTTP_STATUS.BAD_REQUEST);

      expect(resIdorQuery.body.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);

      // User B attempts IDOR via body -> rejected with 400
      const resIdorBody = await request(app)
        .get("/api/subscriptions/me")
        .set("Authorization", `Bearer ${userBToken}`)
        .send({ userId: userA.id, plan: "PREMIUM" })
        .expect(HTTP_STATUS.BAD_REQUEST);

      expect(resIdorBody.body.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    });

    it("proves dynamic PostgreSQL authority: state transitions immediately reflect without token change", async () => {
      const now = new Date();
      const periodStart = new Date(now.getTime() - 1000);
      const periodEnd = new Date(now.getTime() + 86400000);

      const sub = await prisma.userSubscription.create({
        data: {
          userId: userA.id,
          planKey: "PREMIUM",
          status: "ACTIVE",
          providerKey: "MOCK",
          externalSubscriptionId: "ext-sub-dynamic",
          currentPeriodStart: periodStart,
          currentPeriodEnd: periodEnd,
          cancelAtPeriodEnd: false,
        },
      });

      // 1. Initial read -> ACTIVE PREMIUM
      const res1 = await request(app)
        .get("/api/subscriptions/me")
        .set("Authorization", `Bearer ${userAToken}`)
        .expect(HTTP_STATUS.OK);
      expect(res1.body.data.status).toBe("ACTIVE");
      expect(res1.body.data.isEntitled).toBe(true);

      // 2. Direct PostgreSQL update to PAST_DUE (e.g. downstream payment failure)
      await prisma.userSubscription.update({
        where: { id: sub.id },
        data: { status: "PAST_DUE" },
      });

      // Next request with EXACT SAME TOKEN immediately reflects PAST_DUE & loses entitlement
      const res2 = await request(app)
        .get("/api/subscriptions/me")
        .set("Authorization", `Bearer ${userAToken}`)
        .expect(HTTP_STATUS.OK);
      expect(res2.body.data.status).toBe("PAST_DUE");
      expect(res2.body.data.isEntitled).toBe(false);
      expect(res2.body.data.entitlements).toEqual([]);

      // 3. Direct PostgreSQL update to CANCELLED (terminal state)
      await prisma.userSubscription.update({
        where: { id: sub.id },
        data: { status: "CANCELLED" },
      });

      // Terminal subscription means no active subscription row -> reverts to canonical FREE
      const res3 = await request(app)
        .get("/api/subscriptions/me")
        .set("Authorization", `Bearer ${userAToken}`)
        .expect(HTTP_STATUS.OK);
      expect(res3.body.data.plan).toBe("FREE");
      expect(res3.body.data.status).toBe("NONE");
      expect(res3.body.data.isEntitled).toBe(false);
      expect(res3.body.data.entitlements).toEqual([]);
    });

    it("proves cancelAtPeriodEnd semantics: entitled before period end, denied after (D5, AC-007)", async () => {
      const now = new Date();
      const periodStart = new Date(now.getTime() - 10 * 86400000);
      const futurePeriodEnd = new Date(now.getTime() + 10 * 86400000);

      const sub = await prisma.userSubscription.create({
        data: {
          userId: userA.id,
          planKey: "PREMIUM",
          status: "ACTIVE",
          providerKey: "MOCK",
          externalSubscriptionId: "ext-sub-cancel-period",
          currentPeriodStart: periodStart,
          currentPeriodEnd: futurePeriodEnd,
          cancelAtPeriodEnd: true,
        },
      });

      // Before period end: status is ACTIVE, cancelAtPeriodEnd=true, isEntitled=true
      const resBefore = await request(app)
        .get("/api/subscriptions/me")
        .set("Authorization", `Bearer ${userAToken}`)
        .expect(HTTP_STATUS.OK);
      expect(resBefore.body.data.status).toBe("ACTIVE");
      expect(resBefore.body.data.cancelAtPeriodEnd).toBe(true);
      expect(resBefore.body.data.isEntitled).toBe(true);

      // Period has now passed
      const pastPeriodEnd = new Date(now.getTime() - 1000);
      await prisma.userSubscription.update({
        where: { id: sub.id },
        data: { currentPeriodEnd: pastPeriodEnd },
      });

      // After period end: status resolves to EXPIRED, isEntitled=false
      const resAfter = await request(app)
        .get("/api/subscriptions/me")
        .set("Authorization", `Bearer ${userAToken}`)
        .expect(HTTP_STATUS.OK);
      expect(resAfter.body.data.status).toBe("EXPIRED");
      expect(resAfter.body.data.isEntitled).toBe(false);
      expect(resAfter.body.data.entitlements).toEqual([]);
    });

    it("proves zero database mutations during GET /me (AC-011)", async () => {
      const now = new Date();
      await prisma.userSubscription.create({
        data: {
          userId: userA.id,
          planKey: "PREMIUM",
          status: "ACTIVE",
          providerKey: "MOCK",
          externalSubscriptionId: "ext-sub-nomutation",
          currentPeriodStart: new Date(now.getTime() - 1000),
          currentPeriodEnd: new Date(now.getTime() + 86400000),
          cancelAtPeriodEnd: false,
        },
      });

      const subBefore = await prisma.userSubscription.findFirst({ where: { userId: userA.id } });
      const countBefore = await prisma.userSubscription.count();

      await request(app)
        .get("/api/subscriptions/me")
        .set("Authorization", `Bearer ${userAToken}`)
        .expect(HTTP_STATUS.OK);

      const subAfter = await prisma.userSubscription.findFirst({ where: { userId: userA.id } });
      const countAfter = await prisma.userSubscription.count();

      expect(countAfter).toBe(countBefore);
      expect(subAfter?.updatedAt).toEqual(subBefore?.updatedAt);
    });
  });
});
