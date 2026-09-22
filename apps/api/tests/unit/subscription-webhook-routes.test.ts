import { describe, it, expect, beforeEach, vi } from "vitest";
import request from "supertest";
import { createMockWebhookHarnessApp } from "../../src/modules/subscription/subscription-webhook.routes.js";
import { SubscriptionEventProcessorService } from "../../src/modules/subscription/subscription-event-processor.service.js";
import { MockSubscriptionProvider } from "../../src/modules/subscription/provider/mock-subscription-provider.js";
import { validateSubscriptionProviderEnvironment } from "../../src/modules/subscription/provider/subscription-provider.config.js";
import type {
  ISubscriptionRepository,
  ISubscriptionProviderEventRepository,
  ISubscriptionTransitionRepository,
} from "../../src/modules/subscription/subscription.repository.js";
import type { ITransactionRunner } from "../../src/infrastructure/database/transaction-runner.js";

describe("Subscription Webhook Routes & Harness (HTTP Unit)", () => {
  const mockSecret = "b".repeat(32);
  const safeConfig = validateSubscriptionProviderEnvironment({
    nodeEnv: "test",
    providerMode: "mock",
    isCi: false,
    databaseUrl: "postgresql://postgres:postgres@localhost:5432/aura_test?schema=test",
    runId: "run2",
    workerId: "w2",
    mockWebhookSecret: mockSecret,
  });

  let mockProvider: MockSubscriptionProvider;
  let mockSubRepo: ISubscriptionRepository;
  let mockEventRepo: ISubscriptionProviderEventRepository;
  let mockTransitionRepo: ISubscriptionTransitionRepository;
  let mockTxRunner: ITransactionRunner;
  let service: SubscriptionEventProcessorService;
  let app: ReturnType<typeof createMockWebhookHarnessApp>;

  beforeEach(() => {
    mockProvider = new MockSubscriptionProvider({ config: safeConfig });

    mockSubRepo = {
      findById: vi.fn(),
      findActiveByUserId: vi.fn().mockResolvedValue(null),
      findAllByUserId: vi.fn().mockResolvedValue([]),
      findByExternalSubscriptionId: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockImplementation(async (d) => ({ id: "sub_1", ...d, createdAt: new Date(), updatedAt: new Date() })),
      update: vi.fn().mockImplementation(async (id, d) => ({ id, ...d, updatedAt: new Date() })),
    };

    mockEventRepo = {
      create: vi.fn().mockImplementation(async (d) => ({ id: "evt_1", ...d, createdAt: new Date(), updatedAt: new Date() })),
      findById: vi.fn(),
      findByProviderEventId: vi.fn().mockResolvedValue(null),
      updateOutcome: vi.fn(),
    };

    mockTransitionRepo = {
      create: vi.fn().mockImplementation(async (d) => ({ id: "tr_1", ...d, createdAt: new Date() })),
      findById: vi.fn(),
      findBySubscriptionId: vi.fn().mockResolvedValue([]),
      findByUserId: vi.fn().mockResolvedValue([]),
      findByCorrelationId: vi.fn().mockResolvedValue([]),
    };

    mockTxRunner = {
      run: vi.fn(async (op) => {
        const ctx = {
          id: "test-tx",
          tx: {} as unknown as import("@prisma/client").Prisma.TransactionClient,
          repositories: {
            subscriptionRepo: mockSubRepo,
            subscriptionProviderEventRepo: mockEventRepo,
            subscriptionTransitionRepo: mockTransitionRepo,
          } as unknown as import("../../src/infrastructure/database/repository-factory.js").IRepositoryContainer,
          depth: 1,
          isCompleted: false,
        };
        return await op(ctx);
      }),
      getActiveContext: vi.fn(() => undefined),
      isInTransaction: vi.fn(() => false),
    };

    service = new SubscriptionEventProcessorService(
      mockSubRepo,
      mockEventRepo,
      mockTransitionRepo,
      mockTxRunner,
      () => mockProvider,
    );

    app = createMockWebhookHarnessApp(service);
  });

  const validPayload = {
    providerEventId: "evt_http_1",
    eventType: "SUBSCRIPTION_ACTIVATED",
    occurredAt: "2026-09-22T10:00:00.000Z",
    subscription: {
      userId: "123e4567-e89b-12d3-a456-426614174000",
      externalSubscriptionId: "sub_http_1",
      planKey: "PREMIUM",
      status: "ACTIVE",
      currentPeriodStart: "2026-09-22T10:00:00.000Z",
      currentPeriodEnd: "2026-10-22T10:00:00.000Z",
      cancelAtPeriodEnd: false,
      providerSequence: "1",
    },
  };

  it("returns 401 when signature header is missing or invalid (AC-006)", async () => {
    const res = await request(app)
      .post("/api/subscriptions/providers/mock/events")
      .send(JSON.stringify(validPayload))
      .set("Content-Type", "application/json");

    expect(res.status).toBe(401);
    expect(res.body.error).toBeDefined();
    expect(mockSubRepo.create).not.toHaveBeenCalled();
  });

  it("returns 200 with sanitized envelope on valid verified webhook (AC-008, AC-023)", async () => {
    const res = await request(app)
      .post("/api/subscriptions/providers/mock/events")
      .set("x-mock-signature", mockSecret)
      .set("Content-Type", "application/json")
      .send(JSON.stringify(validPayload));

    expect(res.status).toBe(200);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.outcome).toBe("PROCESSED");
    expect(res.body.data.duplicate).toBe(false);
    expect(res.body.data.providerEventId).toBe("evt_http_1");

    // Secret and payment information is not in the response
    expect(JSON.stringify(res.body)).not.toContain(mockSecret);
  });

  it("returns 200 duplicate when event was already committed (AC-020)", async () => {
    mockEventRepo.findByProviderEventId = vi.fn().mockResolvedValue({
      id: "evt_committed",
      providerEventId: "evt_http_1",
      providerKey: "MOCK",
      subscriptionId: "sub_1",
      payloadDigest: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855", // will match or mock
    });

    // Mock verifyWebhook and normalizeEvent to return the same payloadDigest
    mockProvider.verifyWebhook = vi.fn().mockResolvedValue({
      verified: true,
      providerEventId: "evt_http_1",
      eventType: "SUBSCRIPTION_ACTIVATED",
      occurredAt: new Date(),
      payloadDigest: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      payload: validPayload,
    });
    mockProvider.normalizeEvent = vi.fn().mockReturnValue({
      providerEventId: "evt_http_1",
      eventType: "SUBSCRIPTION_ACTIVATED",
      occurredAt: new Date(),
      payloadDigest: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      subscription: {
        ...validPayload.subscription,
        currentPeriodStart: new Date(validPayload.subscription.currentPeriodStart),
        currentPeriodEnd: new Date(validPayload.subscription.currentPeriodEnd),
      },
    });

    const res = await request(app)
      .post("/api/subscriptions/providers/mock/events")
      .set("x-mock-signature", mockSecret)
      .set("Content-Type", "application/json")
      .send(JSON.stringify(validPayload));

    expect(res.status).toBe(200);
    expect(res.body.data.outcome).toBe("DUPLICATE");
    expect(res.body.data.duplicate).toBe(true);
    expect(mockSubRepo.create).not.toHaveBeenCalled();
    expect(mockSubRepo.update).not.toHaveBeenCalled();
  });
});
