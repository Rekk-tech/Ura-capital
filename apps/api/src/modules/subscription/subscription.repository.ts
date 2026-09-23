import {
  Prisma,
  type PrismaClient,
  type UserSubscription,
  type SubscriptionProviderEvent,
  type SubscriptionTransitionRecord,
} from "@prisma/client";

import type {
  ISubscriptionRepository,
  ISubscriptionProviderEventRepository,
  ISubscriptionAuditProviderEventRepository,
  ISubscriptionTransitionRepository,
  ISubscriptionAuditTransitionRepository,
  CreateUserSubscriptionInput,
  UpdateUserSubscriptionInput,
  CreateSubscriptionProviderEventInput,
  CreateSubscriptionTransitionInput,
  SubscriptionProviderEventOutcome,
} from "./subscription.types.js";

export type {
  ISubscriptionRepository,
  ISubscriptionProviderEventRepository,
  ISubscriptionTransitionRepository,
} from "./subscription.types.js";

import { getPrismaClient } from "../../infrastructure/database/prisma.js";
import { mapDatabaseError } from "../../infrastructure/database/error-mapper.js";

type DbClient = PrismaClient | Prisma.TransactionClient;

// ============================================================================
// 1. User Subscription Repository
// ============================================================================

export class PrismaSubscriptionRepository implements ISubscriptionRepository {
  private readonly client: DbClient;

  constructor(client?: DbClient) {
    this.client = client || getPrismaClient();
  }

  async findById(id: string): Promise<UserSubscription | null> {
    try {
      return await this.client.userSubscription.findUnique({
        where: { id },
      });
    } catch (err) {
      throw mapDatabaseError(err, `Failed to find subscription by id: ${id}`);
    }
  }

  async findActiveByUserId(userId: string): Promise<UserSubscription | null> {
    try {
      return await this.client.userSubscription.findFirst({
        where: {
          userId,
          status: { in: ["ACTIVE", "PAST_DUE"] },
        },
      });
    } catch (err) {
      throw mapDatabaseError(err, `Failed to find active subscription for user: ${userId}`);
    }
  }

  async findAllByUserId(userId: string): Promise<UserSubscription[]> {
    try {
      return await this.client.userSubscription.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
      });
    } catch (err) {
      throw mapDatabaseError(err, `Failed to find subscriptions for user: ${userId}`);
    }
  }

  async findByExternalSubscriptionId(
    providerKey: string,
    externalSubscriptionId: string,
  ): Promise<UserSubscription | null> {
    try {
      return await this.client.userSubscription.findFirst({
        where: {
          providerKey,
          externalSubscriptionId,
        },
      });
    } catch (err) {
      throw mapDatabaseError(
        err,
        `Failed to find subscription by external id: ${externalSubscriptionId}`,
      );
    }
  }

  async create(data: CreateUserSubscriptionInput): Promise<UserSubscription> {
    try {
      return await this.client.userSubscription.create({
        data: {
          userId: data.userId,
          planKey: data.planKey ?? "FREE",
          status: data.status ?? "ACTIVE",
          providerKey: data.providerKey ?? "INTERNAL",
          externalSubscriptionId: data.externalSubscriptionId ?? null,
          currentPeriodStart: data.currentPeriodStart,
          currentPeriodEnd: data.currentPeriodEnd,
          cancelAtPeriodEnd: data.cancelAtPeriodEnd ?? false,
          providerSequence: data.providerSequence ?? null,
        },
      });
    } catch (err) {
      throw mapDatabaseError(err, "Failed to create user subscription");
    }
  }

  async update(id: string, data: UpdateUserSubscriptionInput): Promise<UserSubscription> {
    try {
      return await this.client.userSubscription.update({
        where: { id },
        data: {
          ...(data.planKey !== undefined ? { planKey: data.planKey } : {}),
          ...(data.status !== undefined ? { status: data.status } : {}),
          ...(data.providerKey !== undefined ? { providerKey: data.providerKey } : {}),
          ...(data.externalSubscriptionId !== undefined
            ? { externalSubscriptionId: data.externalSubscriptionId }
            : {}),
          ...(data.currentPeriodStart !== undefined
            ? { currentPeriodStart: data.currentPeriodStart }
            : {}),
          ...(data.currentPeriodEnd !== undefined
            ? { currentPeriodEnd: data.currentPeriodEnd }
            : {}),
          ...(data.cancelAtPeriodEnd !== undefined
            ? { cancelAtPeriodEnd: data.cancelAtPeriodEnd }
            : {}),
          ...(data.providerSequence !== undefined
            ? { providerSequence: data.providerSequence }
            : {}),
        },
      });
    } catch (err) {
      throw mapDatabaseError(err, `Failed to update user subscription: ${id}`);
    }
  }
}

// ============================================================================
// 2. Subscription Provider Event Repository
// ============================================================================

export class PrismaSubscriptionProviderEventRepository
  implements ISubscriptionProviderEventRepository, ISubscriptionAuditProviderEventRepository
{
  private readonly client: DbClient;

  constructor(client?: DbClient) {
    this.client = client || getPrismaClient();
  }

  async create(
    data: CreateSubscriptionProviderEventInput,
  ): Promise<SubscriptionProviderEvent> {
    try {
      return await this.client.subscriptionProviderEvent.create({
        data: {
          providerKey: data.providerKey,
          providerEventId: data.providerEventId,
          eventType: data.eventType,
          outcome: data.outcome ?? "RECEIVED",
          occurredAt: data.occurredAt,
          receivedAt: data.receivedAt ?? new Date(),
          processedAt: data.processedAt ?? null,
          payloadDigest: data.payloadDigest ?? null,
          metadata: data.metadata ?? Prisma.JsonNull,
          subscriptionId: data.subscriptionId ?? null,
        },
      });
    } catch (err) {
      throw mapDatabaseError(err, "Failed to create subscription provider event");
    }
  }

  async findById(id: string): Promise<SubscriptionProviderEvent | null> {
    try {
      return await this.client.subscriptionProviderEvent.findUnique({
        where: { id },
      });
    } catch (err) {
      throw mapDatabaseError(err, `Failed to find provider event by id: ${id}`);
    }
  }

  async findByProviderEventId(
    providerKey: string,
    providerEventId: string,
  ): Promise<SubscriptionProviderEvent | null> {
    try {
      return await this.client.subscriptionProviderEvent.findUnique({
        where: {
          providerKey_providerEventId: {
            providerKey,
            providerEventId,
          },
        },
      });
    } catch (err) {
      throw mapDatabaseError(
        err,
        `Failed to find provider event by providerEventId: ${providerKey}:${providerEventId}`,
      );
    }
  }

  async updateOutcome(
    id: string,
    outcome: SubscriptionProviderEventOutcome,
    metadata?: Prisma.InputJsonValue,
    processedAt?: Date | null,
  ): Promise<SubscriptionProviderEvent> {
    try {
      return await this.client.subscriptionProviderEvent.update({
        where: { id },
        data: {
          outcome,
          ...(metadata !== undefined ? { metadata: metadata ?? Prisma.JsonNull } : {}),
          ...(processedAt !== undefined ? { processedAt } : {}),
        },
      });
    } catch (err) {
      throw mapDatabaseError(err, `Failed to update provider event outcome: ${id}`);
    }
  }

  async findAuditPending(limit: number): Promise<SubscriptionProviderEvent[]> {
    try {
      return await this.client.subscriptionProviderEvent.findMany({
        where: {
          metadata: {
            path: ["auditPending"],
            equals: true,
          },
        },
        orderBy: { createdAt: "asc" },
        take: Math.max(1, Math.min(limit, 100)),
      });
    } catch (err) {
      throw mapDatabaseError(err, "Failed to discover pending subscription audit evidence");
    }
  }

  async lockById(id: string): Promise<SubscriptionProviderEvent | null> {
    try {
      await this.client.$queryRaw(
        Prisma.sql`SELECT id FROM subscription_provider_events WHERE id = ${id} FOR UPDATE`,
      );
      return await this.client.subscriptionProviderEvent.findUnique({ where: { id } });
    } catch (err) {
      throw mapDatabaseError(err, "Failed to lock subscription audit reconciliation target");
    }
  }
}

// ============================================================================
// 3. Subscription Transition Repository (Strictly Append-Only)
// ============================================================================

export class PrismaSubscriptionTransitionRepository
  implements ISubscriptionTransitionRepository, ISubscriptionAuditTransitionRepository
{
  private readonly client: DbClient;

  constructor(client?: DbClient) {
    this.client = client || getPrismaClient();
  }

  async create(
    data: CreateSubscriptionTransitionInput,
  ): Promise<SubscriptionTransitionRecord> {
    try {
      return await this.client.subscriptionTransitionRecord.create({
        data: {
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
          metadata: data.metadata ?? Prisma.JsonNull,
        },
      });
    } catch (err) {
      throw mapDatabaseError(err, "Failed to create subscription transition record");
    }
  }

  async findById(id: string): Promise<SubscriptionTransitionRecord | null> {
    try {
      return await this.client.subscriptionTransitionRecord.findUnique({
        where: { id },
      });
    } catch (err) {
      throw mapDatabaseError(err, `Failed to find subscription transition by id: ${id}`);
    }
  }

  async findBySubscriptionId(
    subscriptionId: string,
  ): Promise<SubscriptionTransitionRecord[]> {
    try {
      return await this.client.subscriptionTransitionRecord.findMany({
        where: { subscriptionId },
        orderBy: { createdAt: "asc" },
      });
    } catch (err) {
      throw mapDatabaseError(
        err,
        `Failed to find subscription transitions for subscription: ${subscriptionId}`,
      );
    }
  }

  async findByUserId(userId: string): Promise<SubscriptionTransitionRecord[]> {
    try {
      return await this.client.subscriptionTransitionRecord.findMany({
        where: { userId },
        orderBy: { createdAt: "asc" },
      });
    } catch (err) {
      throw mapDatabaseError(
        err,
        `Failed to find subscription transitions for user: ${userId}`,
      );
    }
  }

  async findByCorrelationId(
    correlationId: string,
  ): Promise<SubscriptionTransitionRecord[]> {
    try {
      return await this.client.subscriptionTransitionRecord.findMany({
        where: { correlationId },
        orderBy: { createdAt: "asc" },
      });
    } catch (err) {
      throw mapDatabaseError(
        err,
        `Failed to find subscription transitions for correlationId: ${correlationId}`,
      );
    }
  }

  async findReconciliationByProviderEventId(
    providerEventId: string,
  ): Promise<SubscriptionTransitionRecord | null> {
    try {
      return await this.client.subscriptionTransitionRecord.findFirst({
        where: {
          providerEventId,
          source: "RECONCILIATION",
          reason: "SUBSCRIPTION_RECONCILED",
        },
        orderBy: { createdAt: "asc" },
      });
    } catch (err) {
      throw mapDatabaseError(
        err,
        "Failed to find subscription audit reconciliation evidence",
      );
    }
  }
}
