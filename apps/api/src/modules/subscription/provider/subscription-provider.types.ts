import type { SubscriptionPlan, SubscriptionStatus } from "../subscription.types.js";

export const SUBSCRIPTION_PROVIDER_MODES = ["mock", "production"] as const;
export type SubscriptionProviderMode = (typeof SUBSCRIPTION_PROVIDER_MODES)[number];

export const PROVIDER_EVENT_TYPES = [
  "SUBSCRIPTION_ACTIVATED",
  "SUBSCRIPTION_UPDATED",
  "SUBSCRIPTION_PAST_DUE",
  "SUBSCRIPTION_CANCELLED",
  "SUBSCRIPTION_EXPIRED",
] as const;
export type ProviderEventType = (typeof PROVIDER_EVENT_TYPES)[number];

export interface ProviderCheckoutCommand {
  requestId: string;
  userId: string;
  planKey: "PREMIUM";
  idempotencyKey: string;
}

export interface ProviderCheckoutSession {
  checkoutReference: string;
  state: "PENDING";
  expiresAt: Date;
}

export interface ProviderCancelCommand {
  requestId: string;
  userId: string;
  externalSubscriptionId: string;
  cancelAtPeriodEnd: boolean;
  idempotencyKey: string;
}

export interface ProviderSubscriptionReference {
  userId: string;
  externalSubscriptionId: string;
}

export interface ProviderSubscriptionSnapshot {
  userId: string;
  externalSubscriptionId: string;
  planKey: SubscriptionPlan;
  status: SubscriptionStatus;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  providerSequence: string | null;
}

export interface ProviderWebhookRequest {
  signature: string;
  body: unknown;
}

export interface VerifiedProviderWebhook {
  verified: true;
  providerEventId: string;
  eventType: ProviderEventType;
  occurredAt: Date;
  payloadDigest: string;
  payload: unknown;
}

export interface NormalizedProviderEvent {
  providerEventId: string;
  eventType: ProviderEventType;
  occurredAt: Date;
  payloadDigest: string;
  subscription: ProviderSubscriptionSnapshot;
}

export type MockSubscriptionFixture = ProviderSubscriptionSnapshot;

export interface ISubscriptionProvider {
  readonly providerKey: string;
  createCheckoutSession(command: ProviderCheckoutCommand): Promise<ProviderCheckoutSession>;
  cancelSubscription(command: ProviderCancelCommand): Promise<ProviderSubscriptionSnapshot>;
  fetchSubscription(
    reference: ProviderSubscriptionReference,
  ): Promise<ProviderSubscriptionSnapshot>;
  verifyWebhook(request: ProviderWebhookRequest): Promise<VerifiedProviderWebhook>;
  normalizeEvent(verifiedEvent: VerifiedProviderWebhook): NormalizedProviderEvent;
}
