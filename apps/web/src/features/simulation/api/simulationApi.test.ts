import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { SimulationApiClient } from "./simulationApi";
import { SimulationApiError } from "../types/simulation-ui.types";

describe("SimulationApiClient", () => {
  let client: SimulationApiClient;
  const originalFetch = global.fetch;

  beforeEach(() => {
    client = new SimulationApiClient("/api/simulation");
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("listAssets forwards Authorization header and AbortSignal", async () => {
    const controller = new AbortController();
    const mockData = [{ id: "asset-1", symbol: "AAPL", name: "Apple Inc.", assetType: "EQUITY", status: "ACTIVE", displayOrder: 1 }];

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: mockData }),
    });

    const res = await client.listAssets("token-123", { signal: controller.signal });
    expect(res.data).toEqual(mockData);

    expect(global.fetch).toHaveBeenCalledWith("/api/simulation/assets", {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: "Bearer token-123",
      },
      signal: controller.signal,
    });
  });

  it("listSnapshots encodes scenarioKey and cycle correctly", async () => {
    const controller = new AbortController();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: [] }),
    });

    await client.listSnapshots("SCENARIO 1", 3, "token-abc", { signal: controller.signal });

    expect(global.fetch).toHaveBeenCalledWith("/api/simulation/scenarios/SCENARIO%201/snapshots/3", {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: "Bearer token-abc",
      },
      signal: controller.signal,
    });
  });

  it("listSessions forwards signal and handles successful response", async () => {
    const controller = new AbortController();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: [{ id: "sess-1", status: "ACTIVE" }] }),
    });

    const res = await client.listSessions(undefined, { signal: controller.signal });
    expect(res.data).toHaveLength(1);
    expect(global.fetch).toHaveBeenCalledWith("/api/simulation/sessions", {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      signal: controller.signal,
    });
  });

  it("createSession sends POST with empty object", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: { id: "sess-new", status: "CREATED" } }),
    });

    const res = await client.createSession(undefined, "tok-1");
    expect(res.data.id).toBe("sess-new");
    expect(global.fetch).toHaveBeenCalledWith("/api/simulation/sessions", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: "Bearer tok-1",
      },
      body: JSON.stringify({}),
      signal: undefined,
    });
  });

  it("submitOrder forwards approved fields strictly as MARKET type", async () => {
    const controller = new AbortController();
    const mockOrder = {
      id: "ord-1",
      sessionId: "sess-1",
      assetId: "a-1",
      assetSymbol: "VNM",
      side: "BUY" as const,
      type: "MARKET" as const,
      quantity: 100,
      status: "FILLED" as const,
      executionPrice: "75.5000",
      executedQuantity: 100,
      filledAt: "2026-09-26T10:00:00Z",
      realizedPnl: "0.0000",
      submittedAt: "2026-09-26T10:00:00Z",
      simulated: true,
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: mockOrder }),
    });

    const res = await client.submitOrder(
      "sess-1",
      {
        side: "BUY",
        type: "MARKET",
        assetSymbol: "VNM",
        quantity: 100,
        idempotencyKey: "idem-key-123",
        limitPrice: "70.0000", // should NOT be sent in payload
      },
      "tok-xyz",
      { signal: controller.signal },
    );

    expect(res.data).toEqual(mockOrder);
    expect(global.fetch).toHaveBeenCalledWith("/api/simulation/sessions/sess-1/orders", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: "Bearer tok-xyz",
      },
      body: JSON.stringify({
        side: "BUY",
        type: "MARKET",
        assetSymbol: "VNM",
        quantity: 100,
        idempotencyKey: "idem-key-123",
      }),
      signal: controller.signal,
    });
  });

  it("session lifecycle methods call corresponding endpoints", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: { id: "s1" } }),
    });

    await client.startSession("s1", "tok");
    expect(global.fetch).toHaveBeenCalledWith("/api/simulation/sessions/s1/start", expect.objectContaining({ method: "POST" }));

    await client.resetSession("s1", "tok");
    expect(global.fetch).toHaveBeenCalledWith("/api/simulation/sessions/s1/reset", expect.objectContaining({ method: "POST" }));

    await client.completeSession("s1", "tok");
    expect(global.fetch).toHaveBeenCalledWith("/api/simulation/sessions/s1/complete", expect.objectContaining({ method: "POST" }));

    await client.cancelSession("s1", "tok");
    expect(global.fetch).toHaveBeenCalledWith("/api/simulation/sessions/s1/cancel", expect.objectContaining({ method: "POST" }));
  });

  it("getPortfolioValuation, getOrders, getTrades fetch correctly", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: [] }),
    });

    await client.getPortfolioValuation("s1", "tok");
    expect(global.fetch).toHaveBeenCalledWith("/api/simulation/sessions/s1/portfolio", expect.objectContaining({ method: "GET" }));

    await client.getOrders("s1", "tok");
    expect(global.fetch).toHaveBeenCalledWith("/api/simulation/sessions/s1/orders", expect.objectContaining({ method: "GET" }));

    await client.getTrades("s1", "tok");
    expect(global.fetch).toHaveBeenCalledWith("/api/simulation/sessions/s1/trades", expect.objectContaining({ method: "GET" }));
  });

  it("throws SimulationApiError with parsed server code and message on 400 error", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({
        error: {
          code: "INSUFFICIENT_CASH",
          message: "Account lacks required purchasing power.",
        },
      }),
    });

    await expect(client.submitOrder("s1", {
      side: "BUY",
      type: "MARKET",
      assetSymbol: "VNM",
      quantity: 1000,
      idempotencyKey: "key-1",
    })).rejects.toThrow(SimulationApiError);
  });

  it("handles non-JSON error response gracefully", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => {
        throw new Error("Invalid JSON");
      },
    });

    try {
      await client.listAssets();
      expect.fail("Should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(SimulationApiError);
      const apiErr = err as SimulationApiError;
      expect(apiErr.status).toBe(500);
      expect(apiErr.code).toBe("INTERNAL_ERROR");
      expect(apiErr.message).toBe("An unexpected error occurred");
    }
  });

  it("maps 401, 403, 404, 409, 429 correctly when no body is provided", async () => {
    const statusCodes = [
      { status: 401, expectedCode: "UNAUTHENTICATED" },
      { status: 403, expectedCode: "FORBIDDEN" },
      { status: 404, expectedCode: "NOT_FOUND" },
      { status: 409, expectedCode: "CONFLICT" },
      { status: 429, expectedCode: "RATE_LIMITED" },
    ];

    for (const { status, expectedCode } of statusCodes) {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status,
        json: async () => ({}),
      });

      try {
        await client.listAssets();
        expect.fail(`Should have thrown for ${status}`);
      } catch (err) {
        expect(err).toBeInstanceOf(SimulationApiError);
        expect((err as SimulationApiError).code).toBe(expectedCode);
      }
    }
  });
});
