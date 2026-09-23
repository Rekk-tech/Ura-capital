import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { PrismaClient, type Prisma } from "@prisma/client";

import {
  createRepositoryContainer,
  type IRepositoryContainer,
} from "../../src/infrastructure/database/repository-factory.js";
import { PrismaTransactionRunner } from "../../src/infrastructure/database/transaction-runner.js";
import {
  PrismaSubscriptionProviderEventRepository,
} from "../../src/modules/subscription/subscription.repository.js";
import { SubscriptionAuditReconciliationService } from "../../src/modules/subscription/subscription-audit-reconciliation.service.js";
import { SubscriptionEventProcessorService } from "../../src/modules/subscription/subscription-event-processor.service.js";
import { SubscriptionEntitlementService } from "../../src/modules/subscription/subscription-entitlement.service.js";
import { MockSubscriptionProvider } from "../../src/modules/subscription/provider/mock-subscription-provider.js";
import { validateSubscriptionProviderEnvironment } from "../../src/modules/subscription/provider/subscription-provider.config.js";
import type { ISubscriptionTransitionRepository } from "../../src/modules/subscription/subscription.types.js";
import {
  assertSafeTestDatabase,
  cleanAllTestTables,
  sanitizeDiagnosticMessage,
} from "../helpers/test-db-guard.js";

describe("FEAT-055 subscription audit reconciliation (live PostgreSQL)", () => {
  const databaseUrl = process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL ?? "";
  const webhookSecret = "f".repeat(32);

  let prisma: PrismaClient;
  let repos: IRepositoryContainer;
  let runner: PrismaTransactionRunner;
  let provider: MockSubscriptionProvider;
  let reconciliationService: SubscriptionAuditReconciliationService;

  beforeAll(async () => {
    assertSafeTestDatabase(databaseUrl, "test");
    prisma = new PrismaClient({ datasources: { db: { url: databaseUrl } } });

    try {
      await prisma.$connect();
      repos = createRepositoryContainer(prisma);
      runner = new PrismaTransactionRunner(prisma, createRepositoryContainer);
      provider = new MockSubscriptionProvider({
        config: validateSubscriptionProviderEnvironment({
          nodeEnv: "test",
          providerMode: "mock",
          isCi: false,
          databaseUrl,
          runId: "feat055-db",
          workerId: "worker-1",
          mockWebhookSecret: webhookSecret,
        }),
      });
      reconciliationService = new SubscriptionAuditReconciliationService(
        new PrismaSubscriptionProviderEventRepository(prisma),
        runner,
      );
    } catch (error: unknown) {
      throw new Error(
        `[DB_CONNECTION_FAILED] ${sanitizeDiagnosticMessage(error instanceof Error ? error.message : String(error))}`,
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

  async function createUser() {
    return prisma.user.create({
      data: {
        email: `feat055_${Date.now()}_${Math.random().toString(36).slice(2)}@example.com`,
        displayName: "FEAT-055 User",
        status: "ACTIVE",
      },
    });
  }

  function payload(
    userId: string,
    eventId: string,
    status: "ACTIVE" | "PAST_DUE" = "ACTIVE",
    sequence = "1",
  ) {
    return {
      providerEventId: eventId,
      eventType: status === "PAST_DUE" ? "SUBSCRIPTION_PAST_DUE" : "SUBSCRIPTION_ACTIVATED",
      occurredAt: new Date().toISOString(),
      subscription: {
        userId,
        externalSubscriptionId: `external_${userId}`,
        planKey: "PREMIUM",
        status,
        currentPeriodStart: new Date(Date.now() - 60_000).toISOString(),
        currentPeriodEnd: new Date(Date.now() + 86_400_000).toISOString(),
        cancelAtPeriodEnd: false,
        providerSequence: sequence,
      },
    };
  }

  async function createPendingAudit(userId: string, suffix: string) {
    const processor = new SubscriptionEventProcessorService(
      repos.subscriptionRepo,
      repos.subscriptionProviderEventRepo,
      repos.subscriptionTransitionRepo,
      runner,
      () => provider,
    );

    await processor.processWebhook({
      providerKey: "MOCK",
      signature: webhookSecret,
      rawBody: JSON.stringify(payload(userId, `evt_active_${suffix}`)),
    });

    const transitionRepo = repos.subscriptionTransitionRepo;
    const failingTransitionRepo: ISubscriptionTransitionRepository = {
      create: async () => {
        throw new Error("forced audit failure");
      },
      findById: (id) => transitionRepo.findById(id),
      findBySubscriptionId: (id) => transitionRepo.findBySubscriptionId(id),
      findByUserId: (id) => transitionRepo.findByUserId(id),
      findByCorrelationId: (id) => transitionRepo.findByCorrelationId(id),
    };
    const failingProcessor = new SubscriptionEventProcessorService(
      repos.subscriptionRepo,
      repos.subscriptionProviderEventRepo,
      failingTransitionRepo,
      runner,
      () => provider,
    );

    const pendingEventId = `evt_past_due_${suffix}`;
    const result = await failingProcessor.processWebhook({
      providerKey: "MOCK",
      signature: webhookSecret,
      rawBody: JSON.stringify(payload(userId, pendingEventId, "PAST_DUE", "2")),
    });
    expect(result.auditPending).toBe(true);

    const event = await prisma.subscriptionProviderEvent.findUniqueOrThrow({
      where: {
        providerKey_providerEventId: {
          providerKey: "MOCK",
          providerEventId: pendingEventId,
        },
      },
    });
    return event;
  }

  it("repairs pending evidence while the revoked subscription remains non-entitled", async () => {
    const user = await createUser();
    const event = await createPendingAudit(user.id, "repair");

    const before = await repos.subscriptionRepo.findActiveByUserId(user.id);
    expect(before?.status).toBe("PAST_DUE");

    const summary = await reconciliationService.reconcilePending({ limit: 10 });

    expect(summary).toEqual({ scanned: 1, repaired: 1, alreadyReconciled: 0, failed: 0 });
    const after = await repos.subscriptionRepo.findActiveByUserId(user.id);
    expect(after).toMatchObject({ id: before?.id, status: "PAST_DUE", planKey: "PREMIUM" });
    const entitlement = await new SubscriptionEntitlementService(
      repos.subscriptionRepo,
    ).resolveUserEntitlement(user.id);
    expect(entitlement.isEntitled).toBe(false);

    const transitions = await prisma.subscriptionTransitionRecord.findMany({
      where: { providerEventId: event.providerEventId, source: "RECONCILIATION" },
    });
    expect(transitions).toHaveLength(1);
    expect(transitions[0]).toMatchObject({
      reason: "SUBSCRIPTION_RECONCILED",
      transactionStrategy: "BEST_EFFORT",
      toStatus: "PAST_DUE",
    });
  });

  it("converges five concurrent workers to one durable reconciliation row", async () => {
    const user = await createUser();
    const event = await createPendingAudit(user.id, "concurrent");

    const results = await Promise.all(
      Array.from({ length: 5 }, () => reconciliationService.reconcileProviderEvent(event.id)),
    );

    expect(results.filter((result) => result.outcome === "REPAIRED")).toHaveLength(1);
    expect(
      results.filter((result) => result.outcome === "ALREADY_RECONCILED"),
    ).toHaveLength(4);
    await expect(
      prisma.subscriptionTransitionRecord.count({
        where: { providerEventId: event.providerEventId, source: "RECONCILIATION" },
      }),
    ).resolves.toBe(1);
  });

  it("repeated reconciliation is a safe no-op and historical rows remain append-only", async () => {
    const user = await createUser();
    const event = await createPendingAudit(user.id, "repeat");
    const originRows = await prisma.subscriptionTransitionRecord.findMany({
      where: { subscriptionId: event.subscriptionId! },
      orderBy: { createdAt: "asc" },
    });

    await reconciliationService.reconcileProviderEvent(event.id);
    const repeated = await reconciliationService.reconcileProviderEvent(event.id);

    expect(repeated.outcome).toBe("ALREADY_RECONCILED");
    const rows = await prisma.subscriptionTransitionRecord.findMany({
      where: { subscriptionId: event.subscriptionId! },
      orderBy: { createdAt: "asc" },
    });
    expect(rows).toHaveLength(originRows.length + 1);
    expect(rows.slice(0, originRows.length).map((row) => row.id)).toEqual(
      originRows.map((row) => row.id),
    );
  });

  it("rejects invalid provider linkage without synthesizing subscription state", async () => {
    const user = await createUser();
    const event = await createPendingAudit(user.id, "linkage");
    const metadata = event.metadata as Prisma.JsonObject;
    await prisma.subscriptionProviderEvent.update({
      where: { id: event.id },
      data: {
        metadata: { ...metadata, auditProviderEventId: "forged_event" },
      },
    });

    const before = await repos.subscriptionRepo.findById(event.subscriptionId!);
    const result = await reconciliationService.reconcileProviderEvent(event.id);
    const after = await repos.subscriptionRepo.findById(event.subscriptionId!);

    expect(result.outcome).toBe("INVALID_PENDING_EVIDENCE");
    expect(after).toEqual(before);
    await expect(
      prisma.subscriptionTransitionRecord.count({
        where: { providerEventId: event.providerEventId, source: "RECONCILIATION" },
      }),
    ).resolves.toBe(0);
  });

  it("rolls back partial reconciliation when audit persistence fails", async () => {
    const user = await createUser();
    const event = await createPendingAudit(user.id, "rollback");

    const failingRunner = new PrismaTransactionRunner(prisma, (client) => {
      const container = createRepositoryContainer(client);
      const transitionRepo = container.subscriptionTransitionRepo;
      return {
        ...container,
        subscriptionTransitionRepo: {
          create: async () => {
            throw new Error("forced reconciliation audit failure");
          },
          findById: (id) => transitionRepo.findById(id),
          findBySubscriptionId: (id) => transitionRepo.findBySubscriptionId(id),
          findByUserId: (id) => transitionRepo.findByUserId(id),
          findByCorrelationId: (id) => transitionRepo.findByCorrelationId(id),
        },
      };
    });
    const failingService = new SubscriptionAuditReconciliationService(
      new PrismaSubscriptionProviderEventRepository(prisma),
      failingRunner,
    );

    await expect(failingService.reconcileProviderEvent(event.id)).rejects.toThrow(
      "Database operation failed",
    );

    const durableEvent = await prisma.subscriptionProviderEvent.findUniqueOrThrow({
      where: { id: event.id },
    });
    expect(durableEvent.metadata).toMatchObject({ auditPending: true });
    await expect(
      prisma.subscriptionTransitionRecord.count({
        where: { providerEventId: event.providerEventId, source: "RECONCILIATION" },
      }),
    ).resolves.toBe(0);
  });
});
