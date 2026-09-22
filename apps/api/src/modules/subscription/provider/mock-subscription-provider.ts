import { createHash, timingSafeEqual } from "node:crypto";

import { ERROR_CODES, HTTP_STATUS } from "@aura/shared";

import { AppError } from "../../../shared/errors/error-envelope.js";
import {
  MockProviderWebhookBodySchema,
  normalizeVerifiedWebhook,
  parseCancelCommand,
  parseCheckoutCommand,
  parseCheckoutSession,
  parseSubscriptionReference,
  parseSubscriptionSnapshot,
} from "./subscription-provider.schemas.js";
import { SubscriptionProviderVerificationError } from "./subscription-provider.errors.js";
import {
  assertSafeMockProviderConfiguration,
  type SafeMockProviderConfiguration,
} from "./subscription-provider.config.js";
import type {
  ISubscriptionProvider,
  MockSubscriptionFixture,
  NormalizedProviderEvent,
  ProviderCancelCommand,
  ProviderCheckoutCommand,
  ProviderCheckoutSession,
  ProviderSubscriptionReference,
  ProviderSubscriptionSnapshot,
  ProviderWebhookRequest,
  VerifiedProviderWebhook,
} from "./subscription-provider.types.js";

export interface MockSubscriptionProviderOptions {
  config: SafeMockProviderConfiguration;
  fixtures?: readonly MockSubscriptionFixture[];
  now?: () => Date;
}

function digest(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function safeEqual(left: string, right: string): boolean {
  const leftDigest = createHash("sha256").update(left).digest();
  const rightDigest = createHash("sha256").update(right).digest();
  return timingSafeEqual(leftDigest, rightDigest);
}

function cloneSnapshot(snapshot: ProviderSubscriptionSnapshot): ProviderSubscriptionSnapshot {
  return {
    ...snapshot,
    currentPeriodStart: new Date(snapshot.currentPeriodStart),
    currentPeriodEnd: new Date(snapshot.currentPeriodEnd),
  };
}

export class MockSubscriptionProvider implements ISubscriptionProvider {
  readonly providerKey = "MOCK";

  private readonly namespace: string;
  private readonly verificationSecret: string;
  private readonly now: () => Date;
  private readonly checkoutSessions = new Map<string, ProviderCheckoutSession>();
  private readonly subscriptions = new Map<string, ProviderSubscriptionSnapshot>();
  private readonly cancelResults = new Map<string, ProviderSubscriptionSnapshot>();
  private readonly verifiedEvents = new WeakSet<object>();

  constructor(options: MockSubscriptionProviderOptions) {
    assertSafeMockProviderConfiguration(options.config);
    this.namespace = options.config.namespace;
    this.verificationSecret = options.config.verificationSecret;
    this.now = options.now ?? (() => new Date());

    for (const fixture of options.fixtures ?? []) {
      const validated = parseSubscriptionSnapshot(fixture);
      this.subscriptions.set(validated.externalSubscriptionId, cloneSnapshot(validated));
    }
  }

  async createCheckoutSession(command: ProviderCheckoutCommand): Promise<ProviderCheckoutSession> {
    const validated = parseCheckoutCommand(command);
    const existing = this.checkoutSessions.get(validated.idempotencyKey);
    if (existing) {
      return { ...existing, expiresAt: new Date(existing.expiresAt) };
    }

    const now = this.now();
    const session = parseCheckoutSession({
      checkoutReference: `mock_${digest(`${this.namespace}:checkout:${validated.idempotencyKey}`).slice(0, 32)}`,
      state: "PENDING",
      expiresAt: new Date(now.getTime() + 15 * 60 * 1000),
    });
    this.checkoutSessions.set(validated.idempotencyKey, session);
    return { ...session, expiresAt: new Date(session.expiresAt) };
  }

  async cancelSubscription(command: ProviderCancelCommand): Promise<ProviderSubscriptionSnapshot> {
    const validated = parseCancelCommand(command);
    const existingResult = this.cancelResults.get(validated.idempotencyKey);
    if (existingResult) {
      return cloneSnapshot(existingResult);
    }

    const current = this.subscriptions.get(validated.externalSubscriptionId);
    if (!current || current.userId !== validated.userId) {
      throw new AppError("Subscription not found", ERROR_CODES.NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }

    const next = parseSubscriptionSnapshot({
      ...current,
      cancelAtPeriodEnd: validated.cancelAtPeriodEnd,
      status: validated.cancelAtPeriodEnd ? current.status : "CANCELLED",
    });
    this.subscriptions.set(next.externalSubscriptionId, next);
    this.cancelResults.set(validated.idempotencyKey, next);
    return cloneSnapshot(next);
  }

  async fetchSubscription(
    reference: ProviderSubscriptionReference,
  ): Promise<ProviderSubscriptionSnapshot> {
    const validated = parseSubscriptionReference(reference);
    const snapshot = this.subscriptions.get(validated.externalSubscriptionId);
    if (!snapshot || snapshot.userId !== validated.userId) {
      throw new AppError("Subscription not found", ERROR_CODES.NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }
    return cloneSnapshot(snapshot);
  }

  async verifyWebhook(request: ProviderWebhookRequest): Promise<VerifiedProviderWebhook> {
    if (!request.signature || !safeEqual(request.signature, this.verificationSecret)) {
      throw new SubscriptionProviderVerificationError();
    }

    const bodyResult = MockProviderWebhookBodySchema.safeParse(request.body);
    if (!bodyResult.success) {
      throw new SubscriptionProviderVerificationError();
    }

    const body = bodyResult.data;
    const verified: VerifiedProviderWebhook = {
      verified: true,
      providerEventId: body.providerEventId,
      eventType: body.eventType,
      occurredAt: new Date(body.occurredAt),
      payloadDigest: digest(JSON.stringify(body)),
      payload: body,
    };
    this.verifiedEvents.add(verified);
    return verified;
  }

  normalizeEvent(verifiedEvent: VerifiedProviderWebhook): NormalizedProviderEvent {
    if (!this.verifiedEvents.has(verifiedEvent)) {
      throw new SubscriptionProviderVerificationError();
    }
    return normalizeVerifiedWebhook(verifiedEvent);
  }
}
