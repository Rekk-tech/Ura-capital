import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SubscriptionApiClient, subscriptionApi } from "./subscription.api";
import { SubscriptionApiError } from "../features/subscription/types/subscription-ui.types";

const plansResponse = {
  data: [
    {
      planKey: "FREE",
      name: "Free Plan",
      description: "Foundational access.",
      entitlements: [],
      available: true,
    },
    {
      planKey: "PREMIUM",
      name: "Premium Plan",
      description: "Advanced access.",
      entitlements: ["PREMIUM_ACCESS"],
      available: true,
    },
  ],
};

const currentResponse = {
  data: {
    plan: "PREMIUM",
    planKey: "PREMIUM",
    status: "ACTIVE",
    entitlements: ["PREMIUM_ACCESS"],
    isEntitled: true,
    currentPeriodStart: "2026-09-01T00:00:00.000Z",
    currentPeriodEnd: "2026-10-01T00:00:00.000Z",
    cancelAtPeriodEnd: false,
  },
};

describe("SubscriptionApiClient", () => {
  const originalFetch = globalThis.fetch;
  let client: SubscriptionApiClient;

  beforeEach(() => {
    client = new SubscriptionApiClient();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("exports the canonical singleton", () => {
    expect(subscriptionApi).toBeInstanceOf(SubscriptionApiClient);
  });

  it("loads plans through native fetch with the in-memory access token", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(plansResponse), { status: 200 }),
    );

    await expect(client.getPlans("access-token")).resolves.toEqual(plansResponse);
    expect(globalThis.fetch).toHaveBeenCalledWith("/api/subscriptions/plans", {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: "Bearer access-token",
      },
      signal: undefined,
    });
  });

  it("loads the authenticated current subscription using the exact FEAT-050 route", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(currentResponse), { status: 200 }),
    );

    await expect(client.getCurrent("access-token")).resolves.toEqual(currentResponse);
    expect(globalThis.fetch).toHaveBeenCalledWith("/api/subscriptions/me", {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: "Bearer access-token",
      },
      signal: undefined,
    });
  });

  it("fails closed when a read DTO includes a provider identifier", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          data: {
            ...currentResponse.data,
            providerSubscriptionId: "provider-secret-id",
          },
        }),
        { status: 200 },
      ),
    );

    await expect(client.getCurrent("access-token")).rejects.toMatchObject({
      status: 502,
      code: "INVALID_RESPONSE",
      message: "Subscription data is temporarily unavailable. Please try again.",
    });
  });

  it("sends only an empty cancellation intent and returns an allowlisted projection", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          data: {
            subscriptionId: "internal-subscription-id",
            status: "ACTIVE",
            planKey: "PREMIUM",
            cancelAtPeriodEnd: true,
            currentPeriodEnd: "2026-10-01T00:00:00.000Z",
          },
        }),
        { status: 200 },
      ),
    );

    const result = await client.cancel("access-token");

    expect(globalThis.fetch).toHaveBeenCalledWith("/api/subscriptions/cancel", {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: "Bearer access-token",
        "Content-Type": "application/json",
      },
      body: "{}",
      signal: undefined,
    });
    expect(result).toEqual({
      status: "ACTIVE",
      planKey: "PREMIUM",
      cancelAtPeriodEnd: true,
      currentPeriodEnd: "2026-10-01T00:00:00.000Z",
    });
    expect("subscriptionId" in result).toBe(false);
  });

  it("honors a bounded Retry-After value without exposing a raw server error", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          error: {
            code: "RAW_PROVIDER_FAILURE",
            message: "redis://user:password@127.0.0.1:6380 secret-token",
          },
        }),
        { status: 429, headers: { "Retry-After": "120" } },
      ),
    );

    const error = await client.cancel("access-token").catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(SubscriptionApiError);
    expect(error).toMatchObject({
      status: 429,
      code: "TOO_MANY_REQUESTS",
      retryAfter: 120,
    });
    expect((error as Error).message).not.toContain("redis://");
    expect((error as Error).message).not.toContain("secret-token");
  });

  it("uses a generic safe message for 503 and malformed JSON", async () => {
    globalThis.fetch = vi
      .fn()
      .mockResolvedValueOnce(new Response("provider stack trace", { status: 503 }))
      .mockResolvedValueOnce(new Response("not-json", { status: 200 }));

    await expect(client.getCurrent("access-token")).rejects.toMatchObject({
      status: 503,
      code: "SERVICE_UNAVAILABLE",
    });
    await expect(client.getPlans("access-token")).rejects.toMatchObject({
      status: 502,
      code: "INVALID_RESPONSE",
    });
  });

  it("does not expose a checkout operation", () => {
    expect("checkout" in client).toBe(false);
    expect("createCheckoutSession" in client).toBe(false);
  });
});
