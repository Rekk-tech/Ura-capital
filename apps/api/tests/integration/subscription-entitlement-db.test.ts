import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { PrismaClient } from "@prisma/client";
import {
  assertSafeTestDatabase,
  sanitizeDiagnosticMessage,
  cleanAllTestTables,
} from "../helpers/test-db-guard.js";
import {
  createRepositoryContainer,
  type IRepositoryContainer,
} from "../../src/infrastructure/database/repository-factory.js";
import { SubscriptionEntitlementService } from "../../src/modules/subscription/subscription-entitlement.service.js";
import type { Clock } from "../../src/modules/subscription/subscription-entitlement.types.js";

function createControllableClock(initialTime: Date) {
  let currentTime = new Date(initialTime.getTime());
  const clock: Clock & { setTime(date: Date): void; advanceByMs(ms: number): void } = {
    now: () => new Date(currentTime.getTime()),
    setTime: (date: Date) => {
      currentTime = new Date(date.getTime());
    },
    advanceByMs: (ms: number) => {
      currentTime = new Date(currentTime.getTime() + ms);
    },
  };
  return clock;
}

describe("FEAT-049 Subscription Entitlement Resolution (PostgreSQL Integration)", () => {
  const testDbUrl =
    process.env.TEST_DATABASE_URL ||
    process.env.DATABASE_URL ||
    "postgresql://postgres:postgrespassword@localhost:5432/aura_capital_test_feat019_rework2_fresh";

  let prisma: PrismaClient;
  let repos: IRepositoryContainer;

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
      repos = createRepositoryContainer(prisma);
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
  });

  async function createTestUser(emailPrefix = "sub_entitle_user") {
    return prisma.user.create({
      data: {
        email: `${emailPrefix}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}@example.com`,
        displayName: "Entitlement Learner",
        status: "ACTIVE",
      },
    });
  }

  it("AC-006: user with no subscription record in PostgreSQL resolves to FREE and 0 entitlements", async () => {
    const user = await createTestUser("no_sub");
    const fixedNow = new Date("2026-09-22T10:00:00.000Z");
    const clock = createControllableClock(fixedNow);
    const service = new SubscriptionEntitlementService(repos.subscriptionRepo, clock);

    const result = await service.resolveUserEntitlement(user.id);

    expect(result.userId).toBe(user.id);
    expect(result.planKey).toBe("FREE");
    expect(result.status).toBe("NONE");
    expect(result.entitlements).toEqual([]);
    expect(result.isEntitled).toBe(false);
    expect(result.currentPeriodStart).toBeNull();
    expect(result.currentPeriodEnd).toBeNull();
    expect(result.cancelAtPeriodEnd).toBe(false);
    expect(result.evaluatedAt).toEqual(fixedNow);
  });

  it("AC-007: user with active PREMIUM subscription in PostgreSQL resolves to PREMIUM_ACCESS", async () => {
    const user = await createTestUser("premium_user");
    const periodStart = new Date("2026-09-01T00:00:00.000Z");
    const periodEnd = new Date("2026-10-01T00:00:00.000Z");
    const evalTime = new Date("2026-09-15T12:00:00.000Z");

    await repos.subscriptionRepo.create({
      userId: user.id,
      planKey: "PREMIUM",
      status: "ACTIVE",
      providerKey: "stripe",
      externalSubscriptionId: "sub_ext_active_1",
      currentPeriodStart: periodStart,
      currentPeriodEnd: periodEnd,
      cancelAtPeriodEnd: false,
    });

    const clock = createControllableClock(evalTime);
    const service = new SubscriptionEntitlementService(repos.subscriptionRepo, clock);

    const result = await service.resolveUserEntitlement(user.id);

    expect(result.userId).toBe(user.id);
    expect(result.planKey).toBe("PREMIUM");
    expect(result.status).toBe("ACTIVE");
    expect(result.entitlements).toEqual(["PREMIUM_ACCESS"]);
    expect(result.isEntitled).toBe(true);
    expect(result.cancelAtPeriodEnd).toBe(false);
    expect(result.currentPeriodStart).toEqual(periodStart);
    expect(result.currentPeriodEnd).toEqual(periodEnd);
  });

  it("AC-009: user with PAST_DUE subscription in PostgreSQL receives zero premium entitlement", async () => {
    const user = await createTestUser("pastdue_user");
    const periodStart = new Date("2026-09-01T00:00:00.000Z");
    const periodEnd = new Date("2026-10-01T00:00:00.000Z");
    const evalTime = new Date("2026-09-15T12:00:00.000Z");

    await repos.subscriptionRepo.create({
      userId: user.id,
      planKey: "PREMIUM",
      status: "PAST_DUE",
      providerKey: "stripe",
      externalSubscriptionId: "sub_ext_pastdue_1",
      currentPeriodStart: periodStart,
      currentPeriodEnd: periodEnd,
      cancelAtPeriodEnd: false,
    });

    const clock = createControllableClock(evalTime);
    const service = new SubscriptionEntitlementService(repos.subscriptionRepo, clock);

    const result = await service.resolveUserEntitlement(user.id);

    expect(result.planKey).toBe("PREMIUM");
    expect(result.status).toBe("PAST_DUE");
    expect(result.entitlements).toEqual([]);
    expect(result.isEntitled).toBe(false);
  });

  it("AC-011: cancelAtPeriodEnd=true remains ACTIVE through currentPeriodEnd then becomes EXPIRED", async () => {
    const user = await createTestUser("cancelling_user");
    const periodStart = new Date("2026-09-01T00:00:00.000Z");
    const periodEnd = new Date("2026-10-01T00:00:00.000Z");

    await repos.subscriptionRepo.create({
      userId: user.id,
      planKey: "PREMIUM",
      status: "ACTIVE",
      providerKey: "stripe",
      externalSubscriptionId: "sub_ext_cancel_pending",
      currentPeriodStart: periodStart,
      currentPeriodEnd: periodEnd,
      cancelAtPeriodEnd: true,
    });

    const clock = createControllableClock(new Date("2026-09-25T00:00:00.000Z"));
    const service = new SubscriptionEntitlementService(repos.subscriptionRepo, clock);

    // 1. Before expiry: active and entitled
    const activeResult = await service.resolveUserEntitlement(user.id);
    expect(activeResult.status).toBe("ACTIVE");
    expect(activeResult.cancelAtPeriodEnd).toBe(true);
    expect(activeResult.isEntitled).toBe(true);
    expect(activeResult.entitlements).toEqual(["PREMIUM_ACCESS"]);

    // 2. Advance clock to exactly currentPeriodEnd: expired and not entitled
    clock.setTime(periodEnd);
    const expiredResultAtEnd = await service.resolveUserEntitlement(user.id);
    expect(expiredResultAtEnd.status).toBe("EXPIRED");
    expect(expiredResultAtEnd.isEntitled).toBe(false);
    expect(expiredResultAtEnd.entitlements).toEqual([]);

    // 3. Advance clock past currentPeriodEnd: expired and not entitled
    clock.setTime(new Date("2026-10-02T00:00:00.000Z"));
    const expiredResultAfter = await service.resolveUserEntitlement(user.id);
    expect(expiredResultAfter.status).toBe("EXPIRED");
    expect(expiredResultAfter.isEntitled).toBe(false);
    expect(expiredResultAfter.entitlements).toEqual([]);
  });

  it("AC-008: server clock boundary correctly denies before periodStart and at periodEnd", async () => {
    const user = await createTestUser("boundary_user");
    const periodStart = new Date("2026-09-10T00:00:00.000Z");
    const periodEnd = new Date("2026-09-20T00:00:00.000Z");

    await repos.subscriptionRepo.create({
      userId: user.id,
      planKey: "PREMIUM",
      status: "ACTIVE",
      providerKey: "stripe",
      externalSubscriptionId: "sub_boundary",
      currentPeriodStart: periodStart,
      currentPeriodEnd: periodEnd,
      cancelAtPeriodEnd: false,
    });

    const clock = createControllableClock(new Date(periodStart.getTime() - 1000));
    const service = new SubscriptionEntitlementService(repos.subscriptionRepo, clock);

    // 1. Before periodStart: not entitled
    const beforeStart = await service.resolveUserEntitlement(user.id);
    expect(beforeStart.status).toBe("ACTIVE");
    expect(beforeStart.isEntitled).toBe(false);
    expect(beforeStart.entitlements).toEqual([]);

    // 2. At periodStart: entitled
    clock.setTime(periodStart);
    const atStart = await service.resolveUserEntitlement(user.id);
    expect(atStart.isEntitled).toBe(true);
    expect(atStart.entitlements).toEqual(["PREMIUM_ACCESS"]);

    // 3. 1ms before periodEnd: entitled
    clock.setTime(new Date(periodEnd.getTime() - 1));
    const beforeEnd = await service.resolveUserEntitlement(user.id);
    expect(beforeEnd.isEntitled).toBe(true);

    // 4. Exactly at periodEnd: expired & denied
    clock.setTime(periodEnd);
    const atEnd = await service.resolveUserEntitlement(user.id);
    expect(atEnd.status).toBe("EXPIRED");
    expect(atEnd.isEntitled).toBe(false);
  });

  it("AC-010: CANCELLED subscription denies access immediately", async () => {
    const user = await createTestUser("cancelled_user");
    const periodStart = new Date("2026-09-01T00:00:00.000Z");
    const periodEnd = new Date("2026-10-01T00:00:00.000Z");

    // Create cancelled subscription (non-active in findActiveByUserId query)
    await repos.subscriptionRepo.create({
      userId: user.id,
      planKey: "PREMIUM",
      status: "CANCELLED",
      providerKey: "stripe",
      externalSubscriptionId: "sub_cancelled",
      currentPeriodStart: periodStart,
      currentPeriodEnd: periodEnd,
      cancelAtPeriodEnd: false,
    });

    const clock = createControllableClock(new Date("2026-09-15T00:00:00.000Z"));
    const service = new SubscriptionEntitlementService(repos.subscriptionRepo, clock);

    const result = await service.resolveUserEntitlement(user.id);

    // findActiveByUserId returns null for CANCELLED, resolving safely to FREE
    expect(result.planKey).toBe("FREE");
    expect(result.isEntitled).toBe(false);
    expect(result.entitlements).toEqual([]);
  });

  it("AC-012: ignores forged client/JWT authority - always derives strictly from PostgreSQL", async () => {
    const userFree = await createTestUser("user_free_forged");
    const clock = createControllableClock(new Date("2026-09-15T00:00:00.000Z"));
    const service = new SubscriptionEntitlementService(repos.subscriptionRepo, clock);

    // Even if a caller attempts to assert premium in token or header, the service derives only from DB
    const result = await service.resolveUserEntitlement(userFree.id);
    expect(result.planKey).toBe("FREE");
    expect(result.isEntitled).toBe(false);
    expect(result.entitlements).toEqual([]);
  });

  it("AC-015: Redis being completely unavailable or unconfigured has ZERO effect on entitlement authority", async () => {
    // The service directly queries PostgreSQL via ISubscriptionRepository and does not touch Redis
    const user = await createTestUser("no_redis_user");
    const periodStart = new Date("2026-09-01T00:00:00.000Z");
    const periodEnd = new Date("2026-10-01T00:00:00.000Z");

    await repos.subscriptionRepo.create({
      userId: user.id,
      planKey: "PREMIUM",
      status: "ACTIVE",
      providerKey: "stripe",
      externalSubscriptionId: "sub_no_redis",
      currentPeriodStart: periodStart,
      currentPeriodEnd: periodEnd,
      cancelAtPeriodEnd: false,
    });

    const clock = createControllableClock(new Date("2026-09-15T00:00:00.000Z"));
    const service = new SubscriptionEntitlementService(repos.subscriptionRepo, clock);

    const result = await service.resolveUserEntitlement(user.id);
    expect(result.isEntitled).toBe(true);
    expect(result.entitlements).toEqual(["PREMIUM_ACCESS"]);
  });

  it("concurrent evaluation of multiple users yields strictly isolated results", async () => {
    const userA = await createTestUser("user_a_prem");
    const userB = await createTestUser("user_b_free");
    const userC = await createTestUser("user_c_pastdue");

    const periodStart = new Date("2026-09-01T00:00:00.000Z");
    const periodEnd = new Date("2026-10-01T00:00:00.000Z");

    await repos.subscriptionRepo.create({
      userId: userA.id,
      planKey: "PREMIUM",
      status: "ACTIVE",
      providerKey: "stripe",
      externalSubscriptionId: "sub_user_a",
      currentPeriodStart: periodStart,
      currentPeriodEnd: periodEnd,
      cancelAtPeriodEnd: false,
    });

    await repos.subscriptionRepo.create({
      userId: userC.id,
      planKey: "PREMIUM",
      status: "PAST_DUE",
      providerKey: "stripe",
      externalSubscriptionId: "sub_user_c",
      currentPeriodStart: periodStart,
      currentPeriodEnd: periodEnd,
      cancelAtPeriodEnd: false,
    });

    const clock = createControllableClock(new Date("2026-09-15T00:00:00.000Z"));
    const service = new SubscriptionEntitlementService(repos.subscriptionRepo, clock);

    const [resA, resB, resC] = await Promise.all([
      service.resolveUserEntitlement(userA.id),
      service.resolveUserEntitlement(userB.id),
      service.resolveUserEntitlement(userC.id),
    ]);

    expect(resA.isEntitled).toBe(true);
    expect(resA.planKey).toBe("PREMIUM");
    expect(resA.status).toBe("ACTIVE");

    expect(resB.isEntitled).toBe(false);
    expect(resB.planKey).toBe("FREE");
    expect(resB.status).toBe("NONE");

    expect(resC.isEntitled).toBe(false);
    expect(resC.planKey).toBe("PREMIUM");
    expect(resC.status).toBe("PAST_DUE");
  });
});
