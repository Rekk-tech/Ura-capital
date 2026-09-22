import { describe, it, expect, beforeEach, vi } from "vitest";
import request from "supertest";
import { HTTP_STATUS, ERROR_CODES } from "@aura/shared";
import { SubscriptionLifecycleService } from "../../src/modules/subscription/subscription-lifecycle.service.js";
import { createMockSubscriptionLifecycleHarnessApp } from "../../src/modules/subscription/subscription-lifecycle.routes.js";
import { MockSubscriptionProvider } from "../../src/modules/subscription/provider/mock-subscription-provider.js";
import { validateSubscriptionProviderEnvironment } from "../../src/modules/subscription/provider/subscription-provider.config.js";
import type {
  ISubscriptionRepository,
  ISubscriptionTransitionRepository,
  CreateUserSubscriptionInput,
  UpdateUserSubscriptionInput,
  CreateSubscriptionTransitionInput,
} from "../../src/modules/subscription/subscription.repository.js";
import type { Express } from "express";
import type {
  UserSubscription,
  SubscriptionTransitionRecord,
  User,
  Prisma,
} from "@prisma/client";
import type { ISubscriptionProvider } from "../../src/modules/subscription/provider/subscription-provider.types.js";
import type { ITransactionRunner } from "../../src/infrastructure/database/transaction-runner.js";
import type { TransactionContext } from "../../src/infrastructure/database/transaction-context.js";
import type { IRepositoryContainer } from "../../src/infrastructure/database/repository-factory.js";
import { accessTokenService } from "../../src/modules/auth/access-token.service.js";
import { userRepository } from "../../src/modules/users/user.repository.js";

const USER_1 = "11111111-1111-4111-8111-111111111111";
const USER_ACTIVE = "22222222-2222-4222-8222-222222222222";
const USER_RECONCILE = "33333333-3333-4333-8333-333333333333";
const CALLER_USER_ID = "44444444-4444-4444-8444-444444444444";
const UNKNOWN_USER = "99999999-9999-4999-8999-999999999999";

describe("FEAT-053 Subscription Lifecycle Service & Commands (Unit Tests)", () => {
  const mockSecret = "k".repeat(32);
  const safeConfig = validateSubscriptionProviderEnvironment({
    nodeEnv: "test",
    providerMode: "mock",
    isCi: false,
    databaseUrl: "postgresql://postgres:postgres@localhost:5432/aura_test?schema=test",
    runId: "run_life",
    workerId: "w_life",
    mockWebhookSecret: mockSecret,
  });

  let mockProvider: MockSubscriptionProvider;
  let mockSubRepo: ISubscriptionRepository;
  let mockTransitionRepo: ISubscriptionTransitionRepository;
  let mockTxRunner: ITransactionRunner;
  let service: SubscriptionLifecycleService;

  let subscriptions: UserSubscription[];
  let transitions: SubscriptionTransitionRecord[];

  beforeEach(() => {
    mockProvider = new MockSubscriptionProvider({ config: safeConfig });
    subscriptions = [];
    transitions = [];

    mockSubRepo = {
      findById: vi.fn(async (id: string) => subscriptions.find((s) => s.id === id) ?? null),
      findActiveByUserId: vi.fn(async (userId: string) =>
        subscriptions.find((s) => s.userId === userId && ["ACTIVE", "PAST_DUE"].includes(s.status)) ?? null,
      ),
      findAllByUserId: vi.fn(async (userId: string) => subscriptions.filter((s) => s.userId === userId)),
      findByExternalSubscriptionId: vi.fn(async (providerKey: string, extId: string) =>
        subscriptions.find((s) => s.providerKey === providerKey && s.externalSubscriptionId === extId) ?? null,
      ),
      create: vi.fn(async (data: CreateUserSubscriptionInput) => {
        const record: UserSubscription = {
          id: `sub_${subscriptions.length + 1}`,
          userId: data.userId,
          planKey: data.planKey ?? "FREE",
          status: data.status ?? "ACTIVE",
          providerKey: data.providerKey ?? "MOCK",
          externalSubscriptionId: data.externalSubscriptionId ?? null,
          currentPeriodStart: data.currentPeriodStart,
          currentPeriodEnd: data.currentPeriodEnd,
          cancelAtPeriodEnd: data.cancelAtPeriodEnd ?? false,
          providerSequence: data.providerSequence ?? null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        subscriptions.push(record);
        return record;
      }),
      update: vi.fn(async (id: string, data: UpdateUserSubscriptionInput) => {
        const idx = subscriptions.findIndex((s) => s.id === id);
        if (idx === -1) throw new Error("Subscription not found");
        const existing = subscriptions[idx]!;
        const updated: UserSubscription = {
          ...existing,
          ...(data.planKey !== undefined ? { planKey: data.planKey } : {}),
          ...(data.status !== undefined ? { status: data.status } : {}),
          ...(data.providerKey !== undefined ? { providerKey: data.providerKey } : {}),
          ...(data.externalSubscriptionId !== undefined ? { externalSubscriptionId: data.externalSubscriptionId } : {}),
          ...(data.currentPeriodStart !== undefined ? { currentPeriodStart: data.currentPeriodStart } : {}),
          ...(data.currentPeriodEnd !== undefined ? { currentPeriodEnd: data.currentPeriodEnd } : {}),
          ...(data.cancelAtPeriodEnd !== undefined ? { cancelAtPeriodEnd: data.cancelAtPeriodEnd } : {}),
          ...(data.providerSequence !== undefined ? { providerSequence: data.providerSequence } : {}),
          updatedAt: new Date(),
        };
        subscriptions[idx] = updated;
        return updated;
      }),
    };

    mockTransitionRepo = {
      create: vi.fn(async (data: CreateSubscriptionTransitionInput) => {
        const record: SubscriptionTransitionRecord = {
          id: `trans_${transitions.length + 1}`,
          subscriptionId: data.subscriptionId,
          userId: data.userId,
          fromStatus: data.fromStatus ?? null,
          toStatus: data.toStatus,
          fromPlan: data.fromPlan ?? null,
          toPlan: data.toPlan,
          source: data.source,
          transactionStrategy: data.transactionStrategy,
          reason: data.reason ?? null,
          providerEventId: data.providerEventId ?? null,
          actorId: data.actorId ?? null,
          subjectId: data.subjectId ?? null,
          requestId: data.requestId ?? null,
          correlationId: data.correlationId ?? null,
          metadata: (data.metadata ?? {}) as Prisma.JsonValue,
          createdAt: new Date(),
        };
        transitions.push(record);
        return record;
      }),
      findById: vi.fn(async (id: string) => transitions.find((t) => t.id === id) ?? null),
      findBySubscriptionId: vi.fn(async (subId: string) => transitions.filter((t) => t.subscriptionId === subId)),
      findByUserId: vi.fn(async (userId: string) => transitions.filter((t) => t.userId === userId)),
      findByCorrelationId: vi.fn(async (corrId: string) => transitions.filter((t) => t.correlationId === corrId)),
    };

    mockTxRunner = {
      run: vi.fn(async <T>(fn: (ctx: TransactionContext) => Promise<T>): Promise<T> => {
        const mockCtx: TransactionContext = {
          repositories: {
            subscriptionRepo: mockSubRepo,
            subscriptionTransitionRepo: mockTransitionRepo,
          } as unknown as IRepositoryContainer,
        };
        return fn(mockCtx);
      }),
    };

    service = new SubscriptionLifecycleService(
      mockSubRepo,
      mockTransitionRepo,
      mockTxRunner,
      () => mockProvider,
    );
  });

  describe("Checkout Intent (FR-003, FR-005; AC-006, AC-007, AC-008)", () => {
    it("creates a safe provider-neutral checkout session without database mutation", async () => {
      const result = await service.createCheckoutIntent({
        userId: USER_1,
        planKey: "PREMIUM",
        requestId: "req_test_1",
      });

      expect(result.checkoutReference).toMatch(/^mock_/);
      expect(result.state).toBe("PENDING");
      expect(result.expiresAt).toBeDefined();

      // STRICT INVARIANT: ZERO DB mutation, ZERO active subscriptions, ZERO transitions
      expect(mockSubRepo.create).not.toHaveBeenCalled();
      expect(mockSubRepo.update).not.toHaveBeenCalled();
      expect(mockTransitionRepo.create).not.toHaveBeenCalled();
      expect(subscriptions).toHaveLength(0);
    });

    it("rejects unknown or invalid plan intent with 400 Bad Request", async () => {
      await expect(
        service.createCheckoutIntent({
          userId: USER_1,
          planKey: "ENTERPRISE",
        }),
      ).rejects.toThrow("Invalid subscription plan");

      expect(subscriptions).toHaveLength(0);
    });

    it("returns retryable 503 error on provider outage with ZERO mutation", async () => {
      const failingService = new SubscriptionLifecycleService(
        mockSubRepo,
        mockTransitionRepo,
        mockTxRunner,
        () => {
          throw new Error("Provider network down");
        },
      );

      await expect(
        failingService.createCheckoutIntent({
          userId: USER_1,
          planKey: "PREMIUM",
        }),
      ).rejects.toThrow("Subscription provider is unavailable");

      expect(subscriptions).toHaveLength(0);
    });
  });

  describe("Cancellation Semantics (FR-006, FR-007; AC-009, AC-010, AC-011)", () => {
    beforeEach(() => {
      const start = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
      const end = new Date(Date.now() + 25 * 24 * 60 * 60 * 1000);

      mockProvider = new MockSubscriptionProvider({
        config: safeConfig,
        fixtures: [
          {
            userId: USER_ACTIVE,
            externalSubscriptionId: "ext_sub_active",
            planKey: "PREMIUM",
            status: "ACTIVE",
            currentPeriodStart: start,
            currentPeriodEnd: end,
            cancelAtPeriodEnd: false,
            providerSequence: "10",
          },
        ],
      });

      service = new SubscriptionLifecycleService(
        mockSubRepo,
        mockTransitionRepo,
        mockTxRunner,
        () => mockProvider,
      );

      subscriptions.push({
        id: "sub_local_active",
        userId: USER_ACTIVE,
        planKey: "PREMIUM",
        status: "ACTIVE",
        providerKey: "MOCK",
        externalSubscriptionId: "ext_sub_active",
        currentPeriodStart: start,
        currentPeriodEnd: end,
        cancelAtPeriodEnd: false,
        providerSequence: "10",
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    });

    it("cancels an active subscription at period end and maintains ACTIVE status", async () => {
      const result = await service.cancelSubscription({
        userId: USER_ACTIVE,
        reason: "Too expensive",
        requestId: "req_cancel_1",
      });

      expect(result.subscriptionId).toBe("sub_local_active");
      expect(result.status).toBe("ACTIVE"); // D5: remains ACTIVE until period end
      expect(result.cancelAtPeriodEnd).toBe(true);

      const updated = subscriptions.find((s) => s.id === "sub_local_active");
      expect(updated?.cancelAtPeriodEnd).toBe(true);
      expect(updated?.status).toBe("ACTIVE");

      // Verify D6 STATE_FIRST transition record
      expect(transitions).toHaveLength(1);
      expect(transitions[0]?.source).toBe("USER_ACTION");
      expect(transitions[0]?.transactionStrategy).toBe("STATE_FIRST");
      expect(transitions[0]?.fromStatus).toBe("ACTIVE");
      expect(transitions[0]?.toStatus).toBe("ACTIVE");
      expect(transitions[0]?.actorId).toBe(USER_ACTIVE);
    });

    it("is safely idempotent when repeating cancellation request", async () => {
      // First cancel
      await service.cancelSubscription({
        userId: USER_ACTIVE,
        reason: "First cancel",
      });

      expect(transitions).toHaveLength(1);

      // Repeat cancel
      const repeatResult = await service.cancelSubscription({
        userId: USER_ACTIVE,
        reason: "Second cancel attempt",
      });

      expect(repeatResult.cancelAtPeriodEnd).toBe(true);
      expect(repeatResult.status).toBe("ACTIVE");

      // Zero duplicate audit amplification on idempotent repeat (AC-011, AC-019)
      expect(transitions).toHaveLength(1);
    });

    it("rejects cancellation on terminal state with 409 Conflict", async () => {
      subscriptions[0]!.status = "EXPIRED";

      await expect(
        service.cancelSubscription({
          userId: USER_ACTIVE,
        }),
      ).rejects.toThrow("Subscription is in a terminal state (EXPIRED)");
    });

    it("returns 404 when user has no active subscription", async () => {
      await expect(
        service.cancelSubscription({
          userId: UNKNOWN_USER,
        }),
      ).rejects.toThrow("Active subscription not found for current user");
    });

    it("returns retryable 503 on provider outage with ZERO local state mutation", async () => {
      const outageProvider = {
        providerKey: "MOCK",
        createCheckoutSession: vi.fn(),
        cancelSubscription: vi.fn(async () => {
          throw new Error("Provider timeout");
        }),
        fetchSubscription: vi.fn(),
        verifyWebhook: vi.fn(),
        normalizeEvent: vi.fn(),
      };

      const failingService = new SubscriptionLifecycleService(
        mockSubRepo,
        mockTransitionRepo,
        mockTxRunner,
        () => outageProvider as unknown as ISubscriptionProvider,
      );

      await expect(
        failingService.cancelSubscription({
          userId: USER_ACTIVE,
        }),
      ).rejects.toThrow("Subscription provider is temporarily unavailable");

      // DB remains completely unchanged
      const sub = subscriptions.find((s) => s.id === "sub_local_active");
      expect(sub?.cancelAtPeriodEnd).toBe(false);
      expect(transitions).toHaveLength(0);
    });
  });

  describe("Internal Reconciliation (FR-010, FR-011; AC-016, AC-017, AC-018, AC-019)", () => {
    beforeEach(() => {
      const now = new Date();
      mockProvider = new MockSubscriptionProvider({
        config: safeConfig,
        fixtures: [
          {
            userId: USER_RECONCILE,
            externalSubscriptionId: "ext_reconcile_1",
            planKey: "PREMIUM",
            status: "PAST_DUE",
            currentPeriodStart: new Date(now.getTime() - 100000),
            currentPeriodEnd: new Date(now.getTime() + 100000),
            cancelAtPeriodEnd: false,
            providerSequence: "25",
          },
        ],
      });

      service = new SubscriptionLifecycleService(
        mockSubRepo,
        mockTransitionRepo,
        mockTxRunner,
        () => mockProvider,
      );

      subscriptions.push({
        id: "sub_reconcile",
        userId: USER_RECONCILE,
        planKey: "PREMIUM",
        status: "ACTIVE",
        providerKey: "MOCK",
        externalSubscriptionId: "ext_reconcile_1",
        currentPeriodStart: new Date(now.getTime() - 100000),
        currentPeriodEnd: new Date(now.getTime() + 100000),
        cancelAtPeriodEnd: false,
        providerSequence: "20",
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    });

    it("reconciles state transition from provider snapshot with source: RECONCILIATION", async () => {
      const result = await service.reconcileSubscription({
        userId: USER_RECONCILE,
        externalSubscriptionId: "ext_reconcile_1",
      });

      expect(result.reconciled).toBe(true);
      expect(result.status).toBe("PAST_DUE");

      expect(subscriptions[0]?.status).toBe("PAST_DUE");
      expect(transitions).toHaveLength(1);
      expect(transitions[0]?.source).toBe("RECONCILIATION");
      expect(transitions[0]?.fromStatus).toBe("ACTIVE");
      expect(transitions[0]?.toStatus).toBe("PAST_DUE");
    });

    it("rejects stale incoming sequence during reconciliation", async () => {
      subscriptions[0]!.providerSequence = "30";

      const result = await service.reconcileSubscription({
        userId: USER_RECONCILE,
        externalSubscriptionId: "ext_reconcile_1",
      });

      expect(result.reconciled).toBe(false);
      expect(result.reason).toBe("STALE_SEQUENCE");
      expect(subscriptions[0]?.status).toBe("ACTIVE");
      expect(transitions).toHaveLength(0);
    });

    it("prevents impossible revival of terminal states during reconciliation", async () => {
      subscriptions[0]!.status = "CANCELLED";

      const result = await service.reconcileSubscription({
        userId: USER_RECONCILE,
        externalSubscriptionId: "ext_reconcile_1",
      });

      expect(result.reconciled).toBe(false);
      expect(result.reason).toBe("IMPOSSIBLE_TERMINAL_REVIVAL");
      expect(subscriptions[0]?.status).toBe("CANCELLED");
      expect(transitions).toHaveLength(0);
    });
  });

  describe("HTTP Harness & Abuse Protection (AC-003, AC-004, AC-005, AC-020)", () => {
    let app: Express;
    let validToken: string;

    beforeEach(async () => {
      app = createMockSubscriptionLifecycleHarnessApp(service, {
        checkout: { enabled: false },
        cancel: { enabled: false },
      });

      vi.spyOn(userRepository, "findById").mockImplementation(async (id: string) => {
        if (id === CALLER_USER_ID) {
          return {
            id: CALLER_USER_ID,
            email: "caller@example.com",
            displayName: "Test Caller",
            status: "ACTIVE",
            createdAt: new Date(),
            updatedAt: new Date(),
          } as unknown as User;
        }
        return null;
      });

      validToken = accessTokenService.issueAccessToken(CALLER_USER_ID).accessToken;
    });

    it("rejects unauthenticated requests with 401 UNAUTHENTICATED", async () => {
      const res = await request(app).post("/api/subscriptions/checkout").send({});
      expect(res.status).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(res.body.error.code).toBe(ERROR_CODES.UNAUTHENTICATED);
    });

    it("rejects client authority tampering with 400 VALIDATION_ERROR (status injection)", async () => {
      const res = await request(app)
        .post("/api/subscriptions/checkout")
        .set("Authorization", `Bearer ${validToken}`)
        .send({
          status: "ACTIVE",
          plan: "PREMIUM",
        });

      expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(res.body.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
      expect(res.body.error.message).toContain("Client authority tampering detected");
    });

    it("rejects client authority tampering on cancel (cancelAtPeriodEnd injection)", async () => {
      const res = await request(app)
        .post("/api/subscriptions/cancel")
        .set("Authorization", `Bearer ${validToken}`)
        .send({
          cancelAtPeriodEnd: false,
          isPremium: true,
        });

      expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(res.body.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    });

    it("rejects client authority tampering with userId spoofing", async () => {
      const res = await request(app)
        .post("/api/subscriptions/checkout")
        .set("Authorization", `Bearer ${validToken}`)
        .send({
          userId: "55555555-5555-4555-8555-555555555555",
        });

      expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(res.body.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    });

    it("returns safe checkout session without exposing provider secrets or customer IDs", async () => {
      const res = await request(app)
        .post("/api/subscriptions/checkout")
        .set("Authorization", `Bearer ${validToken}`)
        .send({
          plan: "PREMIUM",
        });

      expect(res.status).toBe(HTTP_STATUS.OK);
      expect(res.body.data.checkoutReference).toBeDefined();
      expect(res.body.data.state).toBe("PENDING");
      expect(res.body.data.expiresAt).toBeDefined();

      // Zero sensitive fields exposed (AC-020)
      expect(res.body.data.secret).toBeUndefined();
      expect(res.body.data.verificationSecret).toBeUndefined();
      expect(res.body.data.customerId).toBeUndefined();
      expect(res.body.data.providerCustomerId).toBeUndefined();
    });

    it("fails closed with 404 in production environment", async () => {
      const originalNodeEnv = process.env.NODE_ENV;
      try {
        process.env.NODE_ENV = "production";
        const res = await request(app)
          .post("/api/subscriptions/checkout")
          .set("Authorization", `Bearer ${validToken}`)
          .send({});

        expect(res.status).toBe(HTTP_STATUS.NOT_FOUND);
        expect(res.body.error.code).toBe(ERROR_CODES.NOT_FOUND);
      } finally {
        process.env.NODE_ENV = originalNodeEnv;
      }
    });
  });
});
