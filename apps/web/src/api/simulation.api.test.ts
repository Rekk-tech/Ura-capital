import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { SimulationApiClient, simulationApi } from "./simulation.api";
import { SimulationApiError } from "../features/simulation/types/simulation-ui.types";

describe("SimulationApiClient (Web API Client)", () => {
  let client: SimulationApiClient;
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    client = new SimulationApiClient("/api/simulation");
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("exports a default singleton instance", () => {
    expect(simulationApi).toBeInstanceOf(SimulationApiClient);
  });

  describe("listAssets", () => {
    it("calls GET /api/simulation/assets with correct headers", async () => {
      const mockResponse = { data: [{ id: "a1", symbol: "AURA", name: "Aura Capital" }] };
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const res = await client.listAssets("test-token");
      expect(globalThis.fetch).toHaveBeenCalledWith("/api/simulation/assets", {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: "Bearer test-token",
        },
      });
      expect(res).toEqual(mockResponse);
    });
  });

  describe("listSnapshots", () => {
    it("calls GET /api/simulation/scenarios/:scenarioKey/snapshots/:cycle", async () => {
      const mockResponse = { data: [{ id: "snap1", price: "100.000000" }] };
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const res = await client.listSnapshots("MVP_SCENARIO", 2);
      expect(globalThis.fetch).toHaveBeenCalledWith("/api/simulation/scenarios/MVP_SCENARIO/snapshots/2", {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      });
      expect(res).toEqual(mockResponse);
    });
  });

  describe("sessions", () => {
    it("calls GET /api/simulation/sessions", async () => {
      const mockResponse = { data: [] };
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const res = await client.listSessions();
      expect(globalThis.fetch).toHaveBeenCalledWith("/api/simulation/sessions", {
        method: "GET",
        headers: { Accept: "application/json" },
      });
      expect(res).toEqual(mockResponse);
    });

    it("calls POST /api/simulation/sessions", async () => {
      const mockResponse = { data: { id: "sess-1", status: "CREATED" } };
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const res = await client.createSession({ startingCash: "100000.0000" }, "token-1");
      expect(globalThis.fetch).toHaveBeenCalledWith("/api/simulation/sessions", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: "Bearer token-1",
        },
        body: JSON.stringify({ startingCash: "100000.0000" }),
      });
      expect(res).toEqual(mockResponse);
    });

    it("calls POST /api/simulation/sessions/:id/start", async () => {
      const mockResponse = { data: { id: "sess-1", status: "ACTIVE" } };
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const res = await client.startSession("sess-1");
      expect(globalThis.fetch).toHaveBeenCalledWith("/api/simulation/sessions/sess-1/start", {
        method: "POST",
        headers: { Accept: "application/json" },
      });
      expect(res).toEqual(mockResponse);
    });

    it("calls POST /api/simulation/sessions/:id/reset", async () => {
      const mockResponse = { data: { id: "sess-1", status: "ACTIVE" } };
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const res = await client.resetSession("sess-1");
      expect(globalThis.fetch).toHaveBeenCalledWith("/api/simulation/sessions/sess-1/reset", {
        method: "POST",
        headers: { Accept: "application/json" },
      });
      expect(res).toEqual(mockResponse);
    });
  });

  describe("orders and valuation", () => {
    it("calls POST /api/simulation/sessions/:id/orders with trade intent payload", async () => {
      const orderPayload = {
        side: "BUY" as const,
        type: "MARKET" as const,
        assetSymbol: "AURA",
        quantity: 10,
        idempotencyKey: "idem-123",
      };
      const mockResponse = { data: { id: "ord-1", status: "FILLED" } };
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const res = await client.submitOrder("sess-1", orderPayload, "tok");
      expect(globalThis.fetch).toHaveBeenCalledWith("/api/simulation/sessions/sess-1/orders", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: "Bearer tok",
        },
        body: JSON.stringify(orderPayload),
      });
      expect(res).toEqual(mockResponse);
    });

    it("calls GET /api/simulation/sessions/:id/portfolio", async () => {
      const mockResponse = {
        data: {
          sessionId: "sess-1",
          cashBalance: "100000.0000",
          marketValue: "0.0000",
          totalEquity: "100000.0000",
          realizedPnl: "0.0000",
          unrealizedPnl: "0.0000",
          positions: [],
          simulated: true,
        },
      };
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const res = await client.getPortfolioValuation("sess-1");
      expect(globalThis.fetch).toHaveBeenCalledWith("/api/simulation/sessions/sess-1/portfolio", {
        method: "GET",
        headers: { Accept: "application/json" },
      });
      expect(res).toEqual(mockResponse);
    });

    it("calls GET /api/simulation/sessions/:id/orders", async () => {
      const mockResponse = { data: [] };
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const res = await client.getOrders("sess-1");
      expect(globalThis.fetch).toHaveBeenCalledWith("/api/simulation/sessions/sess-1/orders", {
        method: "GET",
        headers: { Accept: "application/json" },
      });
      expect(res).toEqual(mockResponse);
    });

    it("calls GET /api/simulation/sessions/:id/trades", async () => {
      const mockResponse = { data: [] };
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const res = await client.getTrades("sess-1");
      expect(globalThis.fetch).toHaveBeenCalledWith("/api/simulation/sessions/sess-1/trades", {
        method: "GET",
        headers: { Accept: "application/json" },
      });
      expect(res).toEqual(mockResponse);
    });
  });

  describe("error handling", () => {
    it("parses structured error response and throws SimulationApiError", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 409,
        json: async () => ({
          error: {
            code: "INSUFFICIENT_CASH",
            message: "Insufficient cash balance to place buy order",
          },
        }),
      });

      await expect(client.submitOrder("s1", {
        side: "BUY",
        type: "MARKET",
        assetSymbol: "AURA",
        quantity: 1000,
        idempotencyKey: "k1",
      })).rejects.toMatchObject({
        name: "SimulationApiError",
        status: 409,
        code: "INSUFFICIENT_CASH",
        message: "Insufficient cash balance to place buy order",
      });
    });

    it("handles non-JSON error response with default fallback", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => { throw new Error("Invalid JSON"); },
      });

      await expect(client.listAssets()).rejects.toThrowError(SimulationApiError);
    });
  });
});
