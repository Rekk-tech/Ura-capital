import { describe, expect, it } from "vitest";

import { ERROR_CODES, HTTP_STATUS } from "@aura/shared";

import {
  MockProviderWebhookBodySchema,
  ProviderCheckoutCommandSchema,
  ProviderSubscriptionSnapshotSchema,
  SubscriptionProviderResponseError,
  SubscriptionProviderUnavailableError,
  mapSubscriptionProviderFailure,
  normalizeVerifiedWebhook,
  parseCheckoutSession,
  type VerifiedProviderWebhook,
} from "../../src/modules/subscription/provider/index.js";

const USER_ID = "b14822a5-a3f6-42e1-8379-e45cf53b7370";

function validWebhookBody(): unknown {
  return {
    providerEventId: "event-001",
    eventType: "SUBSCRIPTION_ACTIVATED",
    occurredAt: "2026-09-22T00:00:00.000Z",
    subscription: {
      userId: USER_ID,
      externalSubscriptionId: "subscription-001",
      planKey: "PREMIUM",
      status: "ACTIVE",
      currentPeriodStart: "2026-09-22T00:00:00.000Z",
      currentPeriodEnd: "2026-10-22T00:00:00.000Z",
      cancelAtPeriodEnd: false,
      providerSequence: "1",
    },
  };
}

describe("FEAT-051 provider-neutral contract validation", () => {
  it("accepts only the canonical checkout command and rejects authority fields", () => {
    const base = {
      requestId: "request-001",
      userId: USER_ID,
      planKey: "PREMIUM",
      idempotencyKey: "checkout-001",
    };

    expect(ProviderCheckoutCommandSchema.safeParse(base).success).toBe(true);
    expect(ProviderCheckoutCommandSchema.safeParse({ ...base, status: "ACTIVE" }).success).toBe(
      false,
    );
    expect(
      ProviderCheckoutCommandSchema.safeParse({ ...base, entitlement: "PREMIUM_ACCESS" }).success,
    ).toBe(false);
    expect(ProviderCheckoutCommandSchema.safeParse({ ...base, verified: true }).success).toBe(
      false,
    );
  });

  it("rejects FREE checkout and unsupported plan values", () => {
    expect(
      ProviderCheckoutCommandSchema.safeParse({
        requestId: "request-001",
        userId: USER_ID,
        planKey: "FREE",
        idempotencyKey: "checkout-001",
      }).success,
    ).toBe(false);
  });

  it("validates normalized period and closed lifecycle values", () => {
    const base = {
      userId: USER_ID,
      externalSubscriptionId: "subscription-001",
      planKey: "PREMIUM",
      status: "ACTIVE",
      currentPeriodStart: new Date("2026-09-22T00:00:00.000Z"),
      currentPeriodEnd: new Date("2026-10-22T00:00:00.000Z"),
      cancelAtPeriodEnd: false,
      providerSequence: "1",
    };

    expect(ProviderSubscriptionSnapshotSchema.safeParse(base).success).toBe(true);
    expect(
      ProviderSubscriptionSnapshotSchema.safeParse({ ...base, status: "TRIALING" }).success,
    ).toBe(false);
    expect(
      ProviderSubscriptionSnapshotSchema.safeParse({
        ...base,
        currentPeriodEnd: base.currentPeriodStart,
      }).success,
    ).toBe(false);
  });

  it("rejects raw payment, customer, and arbitrary payload fields", () => {
    const body = validWebhookBody() as Record<string, unknown>;
    expect(MockProviderWebhookBodySchema.safeParse(body).success).toBe(true);

    for (const field of ["cardNumber", "cvv", "customer", "paymentMethod", "rawPayload"]) {
      expect(MockProviderWebhookBodySchema.safeParse({ ...body, [field]: "sensitive" }).success).toBe(
        false,
      );
    }
  });

  it("normalizes a verified event into canonical domain types", () => {
    const verified: VerifiedProviderWebhook = {
      verified: true,
      providerEventId: "event-001",
      eventType: "SUBSCRIPTION_ACTIVATED",
      occurredAt: new Date("2026-09-22T00:00:00.000Z"),
      payloadDigest: "a".repeat(64),
      payload: validWebhookBody(),
    };

    const normalized = normalizeVerifiedWebhook(verified);

    expect(normalized.subscription.planKey).toBe("PREMIUM");
    expect(normalized.subscription.status).toBe("ACTIVE");
    expect(normalized.subscription.currentPeriodEnd).toEqual(
      new Date("2026-10-22T00:00:00.000Z"),
    );
  });

  it("rejects malformed verified payload without leaking provider values", () => {
    const verified: VerifiedProviderWebhook = {
      verified: true,
      providerEventId: "event-001",
      eventType: "SUBSCRIPTION_ACTIVATED",
      occurredAt: new Date("2026-09-22T00:00:00.000Z"),
      payloadDigest: "a".repeat(64),
      payload: { rawSecret: "must-not-leak", status: "ROOT" },
    };

    expect(() => normalizeVerifiedWebhook(verified)).toThrow(SubscriptionProviderResponseError);
    try {
      normalizeVerifiedWebhook(verified);
    } catch (error) {
      expect((error as Error).message).toBe("Subscription provider returned an invalid response");
      expect((error as Error).message).not.toContain("must-not-leak");
    }
  });

  it("rejects mismatched verified envelope and payload facts", () => {
    const verified: VerifiedProviderWebhook = {
      verified: true,
      providerEventId: "different-event",
      eventType: "SUBSCRIPTION_ACTIVATED",
      occurredAt: new Date("2026-09-22T00:00:00.000Z"),
      payloadDigest: "a".repeat(64),
      payload: validWebhookBody(),
    };

    expect(() => normalizeVerifiedWebhook(verified)).toThrow(SubscriptionProviderResponseError);
  });

  it("maps arbitrary timeout and SDK errors to one retryable safe error", () => {
    const mapped = mapSubscriptionProviderFailure(
      new Error(
        "timeout https://billing.internal?apiKey=raw-secret C:\\Users\\dev\\provider.ts",
      ),
    );

    expect(mapped).toBeInstanceOf(SubscriptionProviderUnavailableError);
    expect(mapped.code).toBe(ERROR_CODES.SERVICE_UNAVAILABLE);
    expect(mapped.statusCode).toBe(HTTP_STATUS.SERVICE_UNAVAILABLE);
    expect(mapped.message).toBe("Subscription provider is temporarily unavailable");
    expect(mapped.message).not.toContain("billing.internal");
    expect(mapped.message).not.toContain("raw-secret");
    expect(mapped.message).not.toContain("C:\\Users");
  });

  it("rejects an invalid adapter checkout response through a stable safe error", () => {
    expect(() =>
      parseCheckoutSession({
        checkoutReference: "checkout-001",
        state: "ACTIVE",
        expiresAt: new Date(),
      }),
    ).toThrow(SubscriptionProviderResponseError);
  });
});
