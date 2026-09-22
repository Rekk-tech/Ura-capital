import { describe, it, expect, vi } from "vitest";
import { SubscriptionEntitlementService } from "../../src/modules/subscription/subscription-entitlement.service.js";
import type {
  ISubscriptionRepository,
} from "../../src/modules/subscription/subscription.types.js";
import type { Clock } from "../../src/modules/subscription/subscription-entitlement.types.js";
import type { UserSubscription } from "@prisma/client";

function createMockRepo(
  activeSub: UserSubscription | null = null,
  throwError: Error | null = null,
): ISubscriptionRepository {
  return {
    findById: vi.fn(),
    findActiveByUserId: vi.fn().mockImplementation(() => {
      if (throwError) throw throwError;
      return Promise.resolve(activeSub);
    }),
    findAllByUserId: vi.fn(),
    findByExternalSubscriptionId: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  };
}

function createMockClock(currentTime: Date): Clock {
  return {
    now: () => new Date(currentTime.getTime()),
  };
}

describe("FEAT-049 Subscription Entitlement Resolution Unit Tests", () => {
  const baseDate = new Date("2026-09-22T10:00:00.000Z");
  const periodStart = new Date("2026-09-01T00:00:00.000Z");
  const periodEnd = new Date("2026-10-01T00:00:00.000Z");

  it("fails on invalid or empty userId input", async () => {
    const service = new SubscriptionEntitlementService(createMockRepo());

    await expect(service.resolveUserEntitlement("")).rejects.toThrow(
      /Invalid user identifier/,
    );
    await expect(service.resolveUserEntitlement("   ")).rejects.toThrow(
      /Invalid user identifier/,
    );
  });

  it("AC-006: missing subscription resolves to FREE with zero premium entitlement", async () => {
    const clock = createMockClock(baseDate);
    const repo = createMockRepo(null);
    const service = new SubscriptionEntitlementService(repo, clock);

    const result = await service.resolveUserEntitlement("user-123");

    expect(result.userId).toBe("user-123");
    expect(result.planKey).toBe("FREE");
    expect(result.status).toBe("NONE");
    expect(result.entitlements).toEqual([]);
    expect(result.isEntitled).toBe(false);
    expect(result.currentPeriodStart).toBeNull();
    expect(result.currentPeriodEnd).toBeNull();
    expect(result.cancelAtPeriodEnd).toBe(false);
    expect(result.evaluatedAt).toEqual(baseDate);
    expect(Object.isFrozen(result)).toBe(true);
  });

  it("AC-007: valid ACTIVE PREMIUM subscription grants exactly PREMIUM_ACCESS", async () => {
    const clock = createMockClock(baseDate);
    const sub: UserSubscription = {
      id: "sub-1",
      userId: "user-premium",
      planKey: "PREMIUM",
      status: "ACTIVE",
      providerKey: "stripe",
      externalSubscriptionId: "sub_ext_1",
      currentPeriodStart: periodStart,
      currentPeriodEnd: periodEnd,
      cancelAtPeriodEnd: false,
      providerSequence: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const service = new SubscriptionEntitlementService(createMockRepo(sub), clock);

    const result = await service.resolveUserEntitlement("user-premium");

    expect(result.userId).toBe("user-premium");
    expect(result.planKey).toBe("PREMIUM");
    expect(result.status).toBe("ACTIVE");
    expect(result.entitlements).toEqual(["PREMIUM_ACCESS"]);
    expect(result.isEntitled).toBe(true);
    expect(result.cancelAtPeriodEnd).toBe(false);
    expect(result.currentPeriodStart).toEqual(periodStart);
    expect(result.currentPeriodEnd).toEqual(periodEnd);
    expect(result.evaluatedAt).toEqual(baseDate);
  });

  it("FREE plan with ACTIVE status grants zero entitlements", async () => {
    const clock = createMockClock(baseDate);
    const sub: UserSubscription = {
      id: "sub-free",
      userId: "user-free",
      planKey: "FREE",
      status: "ACTIVE",
      providerKey: "system",
      externalSubscriptionId: null,
      currentPeriodStart: periodStart,
      currentPeriodEnd: periodEnd,
      cancelAtPeriodEnd: false,
      providerSequence: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const service = new SubscriptionEntitlementService(createMockRepo(sub), clock);

    const result = await service.resolveUserEntitlement("user-free");

    expect(result.planKey).toBe("FREE");
    expect(result.status).toBe("ACTIVE");
    expect(result.entitlements).toEqual([]);
    expect(result.isEntitled).toBe(false);
  });

  describe("AC-008: Server Clock & Period Boundary Evaluation", () => {
    const sub: UserSubscription = {
      id: "sub-boundary",
      userId: "user-boundary",
      planKey: "PREMIUM",
      status: "ACTIVE",
      providerKey: "stripe",
      externalSubscriptionId: "sub_b",
      currentPeriodStart: periodStart,
      currentPeriodEnd: periodEnd,
      cancelAtPeriodEnd: false,
      providerSequence: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it("denies access 1 millisecond before currentPeriodStart", async () => {
      const beforeStart = new Date(periodStart.getTime() - 1);
      const clock = createMockClock(beforeStart);
      const service = new SubscriptionEntitlementService(createMockRepo(sub), clock);

      const result = await service.resolveUserEntitlement("user-boundary");

      expect(result.status).toBe("ACTIVE");
      expect(result.entitlements).toEqual([]);
      expect(result.isEntitled).toBe(false);
    });

    it("grants access exactly at currentPeriodStart", async () => {
      const atStart = new Date(periodStart.getTime());
      const clock = createMockClock(atStart);
      const service = new SubscriptionEntitlementService(createMockRepo(sub), clock);

      const result = await service.resolveUserEntitlement("user-boundary");

      expect(result.status).toBe("ACTIVE");
      expect(result.entitlements).toEqual(["PREMIUM_ACCESS"]);
      expect(result.isEntitled).toBe(true);
    });

    it("grants access 1 millisecond before currentPeriodEnd", async () => {
      const beforeEnd = new Date(periodEnd.getTime() - 1);
      const clock = createMockClock(beforeEnd);
      const service = new SubscriptionEntitlementService(createMockRepo(sub), clock);

      const result = await service.resolveUserEntitlement("user-boundary");

      expect(result.status).toBe("ACTIVE");
      expect(result.entitlements).toEqual(["PREMIUM_ACCESS"]);
      expect(result.isEntitled).toBe(true);
    });

    it("denies access exactly at currentPeriodEnd and marks EXPIRED", async () => {
      const atEnd = new Date(periodEnd.getTime());
      const clock = createMockClock(atEnd);
      const service = new SubscriptionEntitlementService(createMockRepo(sub), clock);

      const result = await service.resolveUserEntitlement("user-boundary");

      expect(result.status).toBe("EXPIRED");
      expect(result.entitlements).toEqual([]);
      expect(result.isEntitled).toBe(false);
    });

    it("denies access after currentPeriodEnd and marks EXPIRED", async () => {
      const afterEnd = new Date(periodEnd.getTime() + 1000 * 60);
      const clock = createMockClock(afterEnd);
      const service = new SubscriptionEntitlementService(createMockRepo(sub), clock);

      const result = await service.resolveUserEntitlement("user-boundary");

      expect(result.status).toBe("EXPIRED");
      expect(result.entitlements).toEqual([]);
      expect(result.isEntitled).toBe(false);
    });
  });

  it("AC-009: PAST_DUE grants no premium access and has no grace period", async () => {
    const clock = createMockClock(baseDate);
    const sub: UserSubscription = {
      id: "sub-pastdue",
      userId: "user-pastdue",
      planKey: "PREMIUM",
      status: "PAST_DUE",
      providerKey: "stripe",
      externalSubscriptionId: "sub_pd",
      currentPeriodStart: periodStart,
      currentPeriodEnd: periodEnd,
      cancelAtPeriodEnd: false,
      providerSequence: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const service = new SubscriptionEntitlementService(createMockRepo(sub), clock);

    const result = await service.resolveUserEntitlement("user-pastdue");

    expect(result.planKey).toBe("PREMIUM");
    expect(result.status).toBe("PAST_DUE");
    expect(result.entitlements).toEqual([]);
    expect(result.isEntitled).toBe(false);
  });

  describe("AC-011: Cancellation & Terminal States", () => {
    it("ACTIVE + cancelAtPeriodEnd=true remains entitled before currentPeriodEnd", async () => {
      const clock = createMockClock(baseDate);
      const sub: UserSubscription = {
        id: "sub-pending-cancel",
        userId: "user-cancel-pending",
        planKey: "PREMIUM",
        status: "ACTIVE",
        providerKey: "stripe",
        externalSubscriptionId: "sub_pc",
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
        cancelAtPeriodEnd: true,
        providerSequence: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const service = new SubscriptionEntitlementService(createMockRepo(sub), clock);

      const result = await service.resolveUserEntitlement("user-cancel-pending");

      expect(result.planKey).toBe("PREMIUM");
      expect(result.status).toBe("ACTIVE");
      expect(result.cancelAtPeriodEnd).toBe(true);
      expect(result.entitlements).toEqual(["PREMIUM_ACCESS"]);
      expect(result.isEntitled).toBe(true);
    });

    it("ACTIVE + cancelAtPeriodEnd=true becomes EXPIRED at/after currentPeriodEnd", async () => {
      const clock = createMockClock(new Date(periodEnd.getTime() + 100));
      const sub: UserSubscription = {
        id: "sub-pending-cancel",
        userId: "user-cancel-pending",
        planKey: "PREMIUM",
        status: "ACTIVE",
        providerKey: "stripe",
        externalSubscriptionId: "sub_pc",
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
        cancelAtPeriodEnd: true,
        providerSequence: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const service = new SubscriptionEntitlementService(createMockRepo(sub), clock);

      const result = await service.resolveUserEntitlement("user-cancel-pending");

      expect(result.planKey).toBe("PREMIUM");
      expect(result.status).toBe("EXPIRED");
      expect(result.cancelAtPeriodEnd).toBe(true);
      expect(result.entitlements).toEqual([]);
      expect(result.isEntitled).toBe(false);
    });

    it("CANCELLED subscription is terminal and denies access immediately", async () => {
      const clock = createMockClock(baseDate);
      const sub: UserSubscription = {
        id: "sub-cancelled",
        userId: "user-cancelled",
        planKey: "PREMIUM",
        status: "CANCELLED",
        providerKey: "stripe",
        externalSubscriptionId: "sub_c",
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
        cancelAtPeriodEnd: false,
        providerSequence: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const service = new SubscriptionEntitlementService(createMockRepo(sub), clock);

      const result = await service.resolveUserEntitlement("user-cancelled");

      expect(result.status).toBe("CANCELLED");
      expect(result.entitlements).toEqual([]);
      expect(result.isEntitled).toBe(false);
    });

    it("EXPIRED subscription is terminal and denies access immediately", async () => {
      const clock = createMockClock(baseDate);
      const sub: UserSubscription = {
        id: "sub-expired",
        userId: "user-expired",
        planKey: "PREMIUM",
        status: "EXPIRED",
        providerKey: "stripe",
        externalSubscriptionId: "sub_e",
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
        cancelAtPeriodEnd: false,
        providerSequence: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const service = new SubscriptionEntitlementService(createMockRepo(sub), clock);

      const result = await service.resolveUserEntitlement("user-expired");

      expect(result.status).toBe("EXPIRED");
      expect(result.entitlements).toEqual([]);
      expect(result.isEntitled).toBe(false);
    });
  });

  it("AC-012: ignores client/JWT authority because resolver accepts only userId", async () => {
    const clock = createMockClock(baseDate);
    // User in DB is FREE
    const repo = createMockRepo(null);
    const service = new SubscriptionEntitlementService(repo, clock);

    // Any caller passing claims cannot override DB facts
    const result = await service.resolveUserEntitlement("user-forged-claims");

    expect(result.planKey).toBe("FREE");
    expect(result.isEntitled).toBe(false);
    expect(result.entitlements).toEqual([]);
  });

  it("AC-013: fails closed on repository or database error", async () => {
    const clock = createMockClock(baseDate);
    const repo = createMockRepo(null, new Error("PostgreSQL connection timeout"));
    const service = new SubscriptionEntitlementService(repo, clock);

    await expect(service.resolveUserEntitlement("user-db-err")).rejects.toThrow(
      /Failed to resolve subscription entitlement due to persistence error/,
    );
  });

  describe("AC-014: Fail Closed on Corrupted Durable State", () => {
    it("fails closed if planKey in DB is unknown", async () => {
      const clock = createMockClock(baseDate);
      const sub = {
        id: "sub-corrupted-plan",
        userId: "user-bad",
        planKey: "ENTERPRISE_UNAPPROVED",
        status: "ACTIVE",
        providerKey: "stripe",
        externalSubscriptionId: "sub_x",
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
        cancelAtPeriodEnd: false,
        providerSequence: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as unknown as UserSubscription;

      const service = new SubscriptionEntitlementService(createMockRepo(sub), clock);

      await expect(service.resolveUserEntitlement("user-bad")).rejects.toThrow(
        /Invalid subscription durable state/,
      );
    });

    it("fails closed if status in DB is unknown", async () => {
      const clock = createMockClock(baseDate);
      const sub = {
        id: "sub-corrupted-status",
        userId: "user-bad",
        planKey: "PREMIUM",
        status: "TRIALING_UNAPPROVED",
        providerKey: "stripe",
        externalSubscriptionId: "sub_x",
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
        cancelAtPeriodEnd: false,
        providerSequence: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as unknown as UserSubscription;

      const service = new SubscriptionEntitlementService(createMockRepo(sub), clock);

      await expect(service.resolveUserEntitlement("user-bad")).rejects.toThrow(
        /Invalid subscription durable state/,
      );
    });

    it("fails closed if period dates are inverted (start > end)", async () => {
      const clock = createMockClock(baseDate);
      const sub: UserSubscription = {
        id: "sub-inverted-dates",
        userId: "user-bad",
        planKey: "PREMIUM",
        status: "ACTIVE",
        providerKey: "stripe",
        externalSubscriptionId: "sub_x",
        currentPeriodStart: periodEnd, // inverted!
        currentPeriodEnd: periodStart,
        cancelAtPeriodEnd: false,
        providerSequence: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const service = new SubscriptionEntitlementService(createMockRepo(sub), clock);

      await expect(service.resolveUserEntitlement("user-bad")).rejects.toThrow(
        /Invalid subscription durable state/,
      );
    });
  });
});
