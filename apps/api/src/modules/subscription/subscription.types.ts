import type {
  UserSubscription,
  SubscriptionProviderEvent,
  SubscriptionTransitionRecord,
  Prisma,
} from "@prisma/client";

// ============================================================================
// Phase 7 — Closed Taxonomy Types & Domain Constants
// ============================================================================

export type SubscriptionPlan = "FREE" | "PREMIUM";

export type SubscriptionStatus = "ACTIVE" | "PAST_DUE" | "CANCELLED" | "EXPIRED";

export type SubscriptionProviderEventOutcome =
  | "RECEIVED"
  | "PROCESSED"
  | "DUPLICATE"
  | "IGNORED"
  | "FAILED";

export type SubscriptionOperationSource =
  | "USER_ACTION"
  | "PROVIDER_WEBHOOK"
  | "ADMIN_ACTION"
  | "SYSTEM_JOB"
  | "RECONCILIATION";

export type SubscriptionTransactionStrategy =
  | "TRANSACTIONALLY_COUPLED"
  | "STATE_FIRST"
  | "BEST_EFFORT";

export const SUBSCRIPTION_PLANS: readonly SubscriptionPlan[] = Object.freeze(["FREE", "PREMIUM"]);

export const SUBSCRIPTION_STATUSES: readonly SubscriptionStatus[] = Object.freeze([
  "ACTIVE",
  "PAST_DUE",
  "CANCELLED",
  "EXPIRED",
]);

export const NON_TERMINAL_STATUSES: readonly SubscriptionStatus[] = Object.freeze([
  "ACTIVE",
  "PAST_DUE",
]);

export const TERMINAL_STATUSES: readonly SubscriptionStatus[] = Object.freeze([
  "CANCELLED",
  "EXPIRED",
]);

// ============================================================================
// Input DTOs
// ============================================================================

export interface CreateUserSubscriptionInput {
  userId: string;
  planKey?: SubscriptionPlan;
  status?: SubscriptionStatus;
  providerKey?: string;
  externalSubscriptionId?: string | null;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd?: boolean;
  providerSequence?: string | null;
}

export interface UpdateUserSubscriptionInput {
  planKey?: SubscriptionPlan;
  status?: SubscriptionStatus;
  providerKey?: string;
  externalSubscriptionId?: string | null;
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
  cancelAtPeriodEnd?: boolean;
  providerSequence?: string | null;
}

export interface CreateSubscriptionProviderEventInput {
  providerKey: string;
  providerEventId: string;
  eventType: string;
  outcome?: SubscriptionProviderEventOutcome;
  occurredAt: Date;
  receivedAt?: Date;
  processedAt?: Date | null;
  payloadDigest?: string | null;
  metadata?: Prisma.InputJsonValue;
  subscriptionId?: string | null;
}

export interface CreateSubscriptionTransitionInput {
  subscriptionId: string;
  userId: string;
  fromStatus?: SubscriptionStatus | null;
  toStatus: SubscriptionStatus;
  fromPlan?: SubscriptionPlan | null;
  toPlan: SubscriptionPlan;
  source: SubscriptionOperationSource;
  transactionStrategy: SubscriptionTransactionStrategy;
  reason?: string | null;
  providerEventId?: string | null;
  actorId?: string | null;
  subjectId?: string | null;
  requestId?: string | null;
  correlationId?: string | null;
  metadata?: Prisma.InputJsonValue;
}

// ============================================================================
// Repository Interfaces
// ============================================================================

export interface ISubscriptionRepository {
  findById(id: string): Promise<UserSubscription | null>;
  findActiveByUserId(userId: string): Promise<UserSubscription | null>;
  findAllByUserId(userId: string): Promise<UserSubscription[]>;
  findByExternalSubscriptionId(
    providerKey: string,
    externalSubscriptionId: string,
  ): Promise<UserSubscription | null>;
  create(data: CreateUserSubscriptionInput): Promise<UserSubscription>;
  update(id: string, data: UpdateUserSubscriptionInput): Promise<UserSubscription>;
}

export interface ISubscriptionProviderEventRepository {
  create(data: CreateSubscriptionProviderEventInput): Promise<SubscriptionProviderEvent>;
  findById(id: string): Promise<SubscriptionProviderEvent | null>;
  findByProviderEventId(
    providerKey: string,
    providerEventId: string,
  ): Promise<SubscriptionProviderEvent | null>;
  updateOutcome(
    id: string,
    outcome: SubscriptionProviderEventOutcome,
    metadata?: Prisma.InputJsonValue,
    processedAt?: Date | null,
  ): Promise<SubscriptionProviderEvent>;
}

export interface ISubscriptionTransitionRepository {
  create(data: CreateSubscriptionTransitionInput): Promise<SubscriptionTransitionRecord>;
  findById(id: string): Promise<SubscriptionTransitionRecord | null>;
  findBySubscriptionId(subscriptionId: string): Promise<SubscriptionTransitionRecord[]>;
  findByUserId(userId: string): Promise<SubscriptionTransitionRecord[]>;
  findByCorrelationId(correlationId: string): Promise<SubscriptionTransitionRecord[]>;
}
