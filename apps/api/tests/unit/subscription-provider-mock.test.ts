import { describe, expect, it } from "vitest";

import { AppError } from "../../src/shared/errors/error-envelope.js";
import {
  MockSubscriptionProvider,
  SubscriptionProviderVerificationError,
  SubscriptionProviderConfigurationError,
  validateSubscriptionProviderEnvironment,
  type SafeMockProviderConfiguration,
  type MockSubscriptionFixture,
} from "../../src/modules/subscription/provider/index.js";

const USER_A = "b14822a5-a3f6-42e1-8379-e45cf53b7370";
const USER_B = "1d0ca26d-096f-482c-ad2f-80ed4c30600d";
const SECRET = "mock-webhook-secret-at-least-32-characters";
const NOW = new Date("2026-09-22T00:00:00.000Z");

function fixture(overrides: Partial<MockSubscriptionFixture> = {}): MockSubscriptionFixture {
  return {
    userId: USER_A,
    externalSubscriptionId: "subscription-a",
    planKey: "PREMIUM",
    status: "ACTIVE",
    currentPeriodStart: new Date("2026-09-01T00:00:00.000Z"),
    currentPeriodEnd: new Date("2026-10-01T00:00:00.000Z"),
    cancelAtPeriodEnd: false,
    providerSequence: "1",
    ...overrides,
  };
}

function provider(runId = "run-a", workerId = "worker-1") {
  const config = validateSubscriptionProviderEnvironment({
    nodeEnv: "test",
    providerMode: "mock",
    isCi: false,
    databaseUrl: "postgresql://localhost:5432/aura_capital_test_feat051",
    runId,
    workerId,
    mockWebhookSecret: SECRET,
  });
  return new MockSubscriptionProvider({
    config,
    fixtures: [fixture()],
    now: () => new Date(NOW),
  });
}

function webhookBody() {
  return {
    providerEventId: "event-001",
    eventType: "SUBSCRIPTION_ACTIVATED" as const,
    occurredAt: "2026-09-22T00:00:00.000Z",
    subscription: {
      userId: USER_A,
      externalSubscriptionId: "subscription-a",
      planKey: "PREMIUM" as const,
      status: "ACTIVE" as const,
      currentPeriodStart: "2026-09-01T00:00:00.000Z",
      currentPeriodEnd: "2026-10-01T00:00:00.000Z",
      cancelAtPeriodEnd: false,
      providerSequence: "2",
    },
  };
}

describe("FEAT-051 isolated mock subscription provider", () => {
  it("creates a deterministic pending checkout reference without granting premium", async () => {
    const mock = provider();
    const command = {
      requestId: "request-001",
      userId: USER_A,
      planKey: "PREMIUM" as const,
      idempotencyKey: "checkout-001",
    };

    const first = await mock.createCheckoutSession(command);
    const repeated = await mock.createCheckoutSession(command);

    expect(first).toEqual(repeated);
    expect(first.state).toBe("PENDING");
    expect(first).not.toHaveProperty("status");
    expect(first).not.toHaveProperty("entitlement");
    expect(first).not.toHaveProperty("checkoutUrl");
  });

  it("concurrent identical checkout requests converge to one deterministic result", async () => {
    const mock = provider();
    const command = {
      requestId: "request-001",
      userId: USER_A,
      planKey: "PREMIUM" as const,
      idempotencyKey: "checkout-concurrent",
    };

    const results = await Promise.all(
      Array.from({ length: 8 }, () => mock.createCheckoutSession(command)),
    );

    expect(new Set(results.map((result) => result.checkoutReference)).size).toBe(1);
  });

  it("uses run/worker namespace to prevent cross-run identifier collisions", async () => {
    const runA = provider("run-a", "worker-1");
    const runB = provider("run-b", "worker-1");
    const command = {
      requestId: "request-001",
      userId: USER_A,
      planKey: "PREMIUM" as const,
      idempotencyKey: "same-key",
    };

    const [resultA, resultB] = await Promise.all([
      runA.createCheckoutSession(command),
      runB.createCheckoutSession(command),
    ]);

    expect(resultA.checkoutReference).not.toBe(resultB.checkoutReference);
  });

  it("keeps fixture mutation isolated between provider instances", async () => {
    const runA = provider("run-a", "worker-1");
    const runB = provider("run-b", "worker-1");

    await runA.cancelSubscription({
      requestId: "request-001",
      userId: USER_A,
      externalSubscriptionId: "subscription-a",
      cancelAtPeriodEnd: true,
      idempotencyKey: "cancel-a",
    });

    const [snapshotA, snapshotB] = await Promise.all([
      runA.fetchSubscription({ userId: USER_A, externalSubscriptionId: "subscription-a" }),
      runB.fetchSubscription({ userId: USER_A, externalSubscriptionId: "subscription-a" }),
    ]);
    expect(snapshotA.cancelAtPeriodEnd).toBe(true);
    expect(snapshotB.cancelAtPeriodEnd).toBe(false);
  });

  it("returns idempotent cancellation results for the current fixture owner", async () => {
    const mock = provider();
    const command = {
      requestId: "request-001",
      userId: USER_A,
      externalSubscriptionId: "subscription-a",
      cancelAtPeriodEnd: true,
      idempotencyKey: "cancel-001",
    };

    const first = await mock.cancelSubscription(command);
    const repeated = await mock.cancelSubscription(command);

    expect(first).toEqual(repeated);
    expect(first.status).toBe("ACTIVE");
    expect(first.cancelAtPeriodEnd).toBe(true);
  });

  it("does not expose another user's fixture", async () => {
    const mock = provider();

    await expect(
      mock.fetchSubscription({ userId: USER_B, externalSubscriptionId: "subscription-a" }),
    ).rejects.toBeInstanceOf(AppError);
    await expect(
      mock.cancelSubscription({
        requestId: "request-002",
        userId: USER_B,
        externalSubscriptionId: "subscription-a",
        cancelAtPeriodEnd: true,
        idempotencyKey: "cancel-attacker",
      }),
    ).rejects.toMatchObject({ message: "Subscription not found" });
  });

  it("verifies and normalizes a signed mock event without returning raw payment data", async () => {
    const mock = provider();
    const verified = await mock.verifyWebhook({ signature: SECRET, body: webhookBody() });
    const normalized = mock.normalizeEvent(verified);

    expect(verified.verified).toBe(true);
    expect(verified.payloadDigest).toMatch(/^[a-f0-9]{64}$/);
    expect(normalized.subscription.status).toBe("ACTIVE");
    expect(normalized).not.toHaveProperty("signature");
    expect(normalized).not.toHaveProperty("rawPayload");
  });

  it("rejects invalid verification without leaking signature or payload", async () => {
    const rawSecret = "attacker-signature-must-not-leak";
    const rawPayload = { ...webhookBody(), password: "payment-secret-must-not-leak" };

    try {
      await provider().verifyWebhook({ signature: rawSecret, body: rawPayload });
      throw new Error("Expected verification failure");
    } catch (error) {
      expect(error).toBeInstanceOf(SubscriptionProviderVerificationError);
      expect((error as Error).message).toBe("Provider verification failed");
      expect((error as Error).message).not.toContain(rawSecret);
      expect((error as Error).message).not.toContain("payment-secret");
    }
  });

  it("rejects correctly signed but non-canonical payloads", async () => {
    await expect(
      provider().verifyWebhook({
        signature: SECRET,
        body: { ...webhookBody(), status: "ACTIVE", entitlement: "PREMIUM_ACCESS" },
      }),
    ).rejects.toBeInstanceOf(SubscriptionProviderVerificationError);
  });

  it("rejects a caller-constructed verified result", () => {
    const mock = provider();

    expect(() =>
      mock.normalizeEvent({
        verified: true,
        providerEventId: "forged-event",
        eventType: "SUBSCRIPTION_ACTIVATED",
        occurredAt: NOW,
        payloadDigest: "a".repeat(64),
        payload: webhookBody(),
      }),
    ).toThrow(SubscriptionProviderVerificationError);
  });

  it("rejects direct construction with a forged activation configuration", () => {
    const forged = {
      mode: "mock",
      environment: "test",
      isCi: false,
      namespace: "aura:test:subscription-provider:forged:worker-1",
      verificationSecret: SECRET,
      activationProof: Symbol("forged"),
    } as SafeMockProviderConfiguration;

    expect(
      () =>
        new MockSubscriptionProvider({
          config: forged,
        }),
    ).toThrow(SubscriptionProviderConfigurationError);
  });
});
