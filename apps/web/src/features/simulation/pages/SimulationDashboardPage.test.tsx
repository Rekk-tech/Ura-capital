import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SimulationDashboardPage } from "./SimulationDashboardPage";
import { simulationApi } from "../../../api/simulation.api";
import {
  SimulationSessionDto,
  SimulationPortfolioValuationDto,
  SimulationAssetDto,
  SimulationMarketSnapshotDto,
  SimulationOrderDto,
  SimulationTradeDto,
  SimulationApiError,
} from "../types/simulation-ui.types";

const mockSessionActive: SimulationSessionDto = {
  id: "33333333-3333-4333-8333-333333333333",
  userId: "11111111-1111-4111-8111-111111111111",
  scenarioId: "44444444-4444-4444-8444-444444444444",
  status: "ACTIVE",
  startingCash: "100000.0000",
  currentCycle: 2,
  startedAt: "2026-09-17T10:00:00.000Z",
  completedAt: null,
  cancelledAt: null,
  createdAt: "2026-09-17T09:00:00.000Z",
  updatedAt: "2026-09-17T10:00:00.000Z",
  scenario: {
    name: "MVP Market Scenario",
    key: "MVP_SCENARIO",
  },
  simulated: true,
};

const mockSessionCreated: SimulationSessionDto = {
  ...mockSessionActive,
  status: "CREATED",
  startedAt: null,
};

const mockAssets: SimulationAssetDto[] = [
  { id: "a1", symbol: "AURA", name: "Aura Capital", assetType: "EQUITY", status: "ACTIVE", displayOrder: 1 },
  { id: "a2", symbol: "SOL", name: "Solana", assetType: "EQUITY", status: "ACTIVE", displayOrder: 2 },
];

const mockSnapshots: SimulationMarketSnapshotDto[] = [
  { id: "s1", scenarioId: "44444444-4444-4444-8444-444444444444", assetId: "a1", cycle: 2, price: "120.000000", occurredAt: "2026-09-17T10:00:00.000Z", asset: mockAssets[0] },
  { id: "s2", scenarioId: "44444444-4444-4444-8444-444444444444", assetId: "a2", cycle: 2, price: "150.000000", occurredAt: "2026-09-17T10:00:00.000Z", asset: mockAssets[1] },
];

const mockPortfolio: SimulationPortfolioValuationDto = {
  sessionId: "33333333-3333-4333-8333-333333333333",
  currentCycle: 2,
  cashBalance: "94000.0000",
  marketValue: "6000.0000",
  totalEquity: "100000.0000",
  realizedPnl: "0.0000",
  unrealizedPnl: "1000.0000",
  positions: [
    {
      assetId: "a1",
      symbol: "AURA",
      name: "Aura Capital",
      quantity: 50,
      averageCost: "100.000000",
      currentPrice: "120.000000",
      marketValue: "6000.0000",
      unrealizedPnl: "1000.0000",
      simulated: true,
    },
  ],
  simulated: true,
  updatedAt: "2026-09-17T10:05:00.000Z",
};

const mockOrders: SimulationOrderDto[] = [
  {
    id: "ord-1",
    sessionId: "33333333-3333-4333-8333-333333333333",
    assetId: "a1",
    assetSymbol: "AURA",
    side: "BUY",
    type: "MARKET",
    quantity: 50,
    status: "FILLED",
    executionPrice: "100.000000",
    executedQuantity: 50,
    filledAt: "2026-09-17T10:01:00.000Z",
    realizedPnl: "0.0000",
    submittedAt: "2026-09-17T10:01:00.000Z",
    simulated: true,
  },
];

const mockTrades: SimulationTradeDto[] = [
  {
    id: "trd-1",
    orderId: "ord-1",
    assetId: "a1",
    assetSymbol: "AURA",
    side: "BUY",
    quantity: 50,
    executionPrice: "100.000000",
    notional: "5000.0000",
    realizedPnl: "0.0000",
    executedAt: "2026-09-17T10:01:00.000Z",
    simulated: true,
  },
];

function renderWithProviders(initialRoute = "/simulation") {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialRoute]}>
        <Routes>
          <Route path="/simulation" element={<SimulationDashboardPage />} />
          <Route path="/simulation/sessions/:simulationId" element={<SimulationDashboardPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe("SimulationDashboardPage (FEAT-038: AC-001..AC-016)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(simulationApi, "listSessions").mockResolvedValue({ data: [mockSessionActive] });
    vi.spyOn(simulationApi, "getSessionById").mockResolvedValue({ data: mockSessionActive });
    vi.spyOn(simulationApi, "listAssets").mockResolvedValue({ data: mockAssets });
    vi.spyOn(simulationApi, "listSnapshots").mockResolvedValue({ data: mockSnapshots });
    vi.spyOn(simulationApi, "getPortfolioValuation").mockResolvedValue({ data: mockPortfolio });
    vi.spyOn(simulationApi, "getOrders").mockResolvedValue({ data: mockOrders });
    vi.spyOn(simulationApi, "getTrades").mockResolvedValue({ data: mockTrades });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // AC-008, AC-009, AC-010: Mandatory Simulation Disclosures
  it("renders mandatory simulation disclosures: SIMULATION ONLY, NO REAL MONEY, NO BROKERAGE EXECUTION (AC-008, AC-009, AC-010)", async () => {
    renderWithProviders();

    expect(await screen.findByTestId("simulation-disclosure-banner")).toBeDefined();
    expect(screen.getByText(/SIMULATION ONLY/i)).toBeDefined();
    expect(screen.getByText(/NO REAL MONEY/i)).toBeDefined();
    expect(screen.getByText(/NO BROKERAGE EXECUTION/i)).toBeDefined();
  });

  // AC-001: Session Management UI
  it("renders session management header with cycle, status, and scenario name (AC-001)", async () => {
    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText("MVP Market Scenario")).toBeDefined();
      expect(screen.getByTestId("session-status-badge")).toBeDefined();
      expect(screen.getByTestId("session-cycle-value").textContent).toBe("Cycle 2");
      expect(screen.getByTestId("session-starting-cash").textContent).toBe("$100000.0000");
    });
  });

  // AC-005, AC-007, AC-011: Portfolio Valuation Summary
  it("renders server-authoritative portfolio summary with exact Decimal string amounts (AC-005, AC-007, AC-011)", async () => {
    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByTestId("portfolio-total-equity").textContent).toBe("$100000.0000");
      expect(screen.getByTestId("portfolio-cash-balance").textContent).toBe("$94000.0000");
      expect(screen.getByTestId("portfolio-market-value").textContent).toBe("$6000.0000");
      expect(screen.getByTestId("portfolio-unrealized-pnl").textContent).toBe("+$1000.0000");
      expect(screen.getByTestId("portfolio-realized-pnl").textContent).toBe("$0.0000");
    });
  });

  // AC-005: Positions Table Rendering
  it("renders open positions table with symbol, quantity, average cost, current price, and unrealized PnL (AC-005)", async () => {
    renderWithProviders();

    await waitFor(() => {
      const posRow = screen.getByTestId("position-row-AURA");
      expect(posRow).toBeDefined();
      expect(within(posRow).getByText("AURA")).toBeDefined();
      expect(within(posRow).getByText("Aura Capital")).toBeDefined();
      expect(within(posRow).getByText("$100.000000")).toBeDefined();
      expect(within(posRow).getByText("$120.000000")).toBeDefined();
      expect(within(posRow).getByText("$6000.0000")).toBeDefined();
      expect(within(posRow).getByText("+$1000.0000")).toBeDefined();
    });
  });

  // Empty Positions State
  it("renders clean empty positions state when portfolio holds 100% cash (AC-005)", async () => {
    vi.spyOn(simulationApi, "getPortfolioValuation").mockResolvedValue({
      data: {
        ...mockPortfolio,
        marketValue: "0.0000",
        positions: [],
      },
    });

    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByTestId("positions-empty-state")).toBeDefined();
      expect(screen.getByText("No Open Positions")).toBeDefined();
    });
  });

  // AC-002, AC-003, AC-004: MARKET Order Ticket
  it("renders MARKET order ticket with only trade intent fields and rejects editable price/fee/status (AC-002, AC-003, AC-004)", async () => {
    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByTestId("market-order-ticket")).toBeDefined();
      expect(screen.getByTestId("side-buy-button")).toBeDefined();
      expect(screen.getByTestId("side-sell-button")).toBeDefined();
      expect(screen.getByTestId("asset-select")).toBeDefined();
      expect(screen.getByTestId("quantity-input")).toBeDefined();
      expect(screen.getByTestId("submit-order-button")).toBeDefined();
    });

    // Verify absence of client authoritative inputs (AC-004)
    expect(screen.queryByLabelText(/execution price/i)).toBeNull();
    expect(screen.queryByLabelText(/trading fee/i)).toBeNull();
    expect(screen.queryByLabelText(/order status/i)).toBeNull();
    expect(screen.queryByLabelText(/cash after/i)).toBeNull();
    expect(screen.queryByLabelText(/position after/i)).toBeNull();
  });

  // AC-003, AC-005: Order Submission & Post-Order Invalidation
  it("submits MARKET BUY order with auto-generated idempotencyKey and displays filled feedback (AC-003, AC-005)", async () => {
    const submitSpy = vi.spyOn(simulationApi, "submitOrder").mockResolvedValue({
      data: {
        id: "ord-new",
        sessionId: mockSessionActive.id,
        assetId: "a1",
        assetSymbol: "AURA",
        side: "BUY",
        type: "MARKET",
        quantity: 10,
        status: "FILLED",
        executionPrice: "120.000000",
        executedQuantity: 10,
        filledAt: "2026-09-17T10:10:00.000Z",
        realizedPnl: "0.0000",
        submittedAt: "2026-09-17T10:10:00.000Z",
        simulated: true,
      },
    });

    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByTestId("submit-order-button")).toBeDefined();
    });

    fireEvent.change(screen.getByTestId("quantity-input"), { target: { value: "10" } });
    fireEvent.click(screen.getByTestId("submit-order-button"));

    await waitFor(() => {
      expect(submitSpy).toHaveBeenCalledWith(
        mockSessionActive.id,
        expect.objectContaining({
          side: "BUY",
          type: "MARKET",
          assetSymbol: "AURA",
          quantity: 10,
          idempotencyKey: expect.any(String),
        }),
        undefined,
      );
      expect(screen.getByTestId("order-success-banner")).toBeDefined();
      expect(screen.getByText(/Order FILLED!/i)).toBeDefined();
    });
  });

  // Error Feedback: INSUFFICIENT_CASH
  it("handles INSUFFICIENT_CASH domain rejection safely in the order ticket (AC-011)", async () => {
    vi.spyOn(simulationApi, "submitOrder").mockRejectedValue(
      new SimulationApiError(409, "INSUFFICIENT_CASH", "Insufficient cash balance to place buy order"),
    );

    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByTestId("submit-order-button")).toBeDefined();
    });

    fireEvent.click(screen.getByTestId("submit-order-button"));

    await waitFor(() => {
      expect(screen.getByTestId("order-error-banner")).toBeDefined();
      expect(screen.getByText(/Insufficient cash balance to place this market BUY order/i)).toBeDefined();
    });
  });

  // Error Feedback: INSUFFICIENT_POSITION
  it("handles INSUFFICIENT_POSITION domain rejection safely in the order ticket (AC-011)", async () => {
    vi.spyOn(simulationApi, "submitOrder").mockRejectedValue(
      new SimulationApiError(409, "INSUFFICIENT_POSITION", "Insufficient position quantity to place sell order"),
    );

    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByTestId("side-sell-button")).toBeDefined();
    });

    fireEvent.click(screen.getByTestId("side-sell-button"));
    fireEvent.click(screen.getByTestId("submit-order-button"));

    await waitFor(() => {
      expect(screen.getByTestId("order-error-banner")).toBeDefined();
      expect(screen.getByText(/Insufficient position quantity to place this market SELL order/i)).toBeDefined();
    });
  });

  // AC-013: Session Inactive Enforcement
  it("disables order submission when simulation session status is not ACTIVE (AC-013)", async () => {
    vi.spyOn(simulationApi, "listSessions").mockResolvedValue({ data: [mockSessionCreated] });
    vi.spyOn(simulationApi, "getSessionById").mockResolvedValue({ data: mockSessionCreated });

    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByTestId("ticket-inactive-banner")).toBeDefined();
      const submitBtn = screen.getByTestId("submit-order-button") as HTMLButtonElement;
      expect(submitBtn.disabled).toBe(true);
      expect(screen.getByTestId("start-session-button")).toBeDefined();
    });
  });

  // Orders Table & Safe Whitelist
  it("renders orders table omitting sensitive internal fields (AC-005, AC-011)", async () => {
    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByTestId("orders-table")).toBeDefined();
      expect(screen.getByTestId("order-row-ord-1")).toBeDefined();
      expect(screen.getByText("FILLED")).toBeDefined();
    });

    // Confirm no internal DB leak
    expect(screen.queryByText(/fingerprint/i)).toBeNull();
    expect(screen.queryByText(/idempotencyKey/i)).toBeNull();
  });

  // Trades Table
  it("renders executed trades log with execution price, notional, and realized PnL (AC-005)", async () => {
    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByTestId("trades-table")).toBeDefined();
      expect(screen.getByTestId("trade-row-trd-1")).toBeDefined();
      expect(screen.getByText("$5000.0000")).toBeDefined();
    });
  });

  // AC-006: Historical Valuation Chart Strictly Absent
  it("strictly omits historical valuation charts or time-series endpoints (AC-006)", async () => {
    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByTestId("simulation-page")).toBeDefined();
    });

    expect(screen.queryByTestId("historical-valuation-chart")).toBeNull();
    expect(screen.queryByTestId("valuation-chart")).toBeNull();
    expect(screen.queryByTestId("equity-chart")).toBeNull();
    expect(document.querySelector("canvas")).toBeNull();
  });

  // AC-009: IDOR / Session 404 Handling
  it("renders safe not-found state without resource enumeration when session returns 404 (AC-009, AC-011)", async () => {
    vi.spyOn(simulationApi, "getSessionById").mockRejectedValue(
      new SimulationApiError(404, "NOT_FOUND", "Simulation session not found"),
    );

    renderWithProviders("/simulation/sessions/foreign-id-1234");

    await waitFor(() => {
      expect(screen.getByTestId("simulation-not-found-card")).toBeDefined();
      expect(screen.getByText("Simulation Session Not Found")).toBeDefined();
    });
  });

  // AC-011: Auth Required (401)
  it("renders auth-required card when session request returns 401 UNAUTHENTICATED (AC-011)", async () => {
    vi.spyOn(simulationApi, "listSessions").mockRejectedValue(
      new SimulationApiError(401, "UNAUTHENTICATED", "Authentication required"),
    );

    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByTestId("simulation-auth-card")).toBeDefined();
      expect(screen.getByText("Authentication Required")).toBeDefined();
    });
  });

  // AC-012: Semantic HTML & Accessibility Baseline
  it("preserves semantic headings h1 and h2, labels, and accessible table structures (AC-012)", async () => {
    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByRole("heading", { level: 1, name: /Simulation Trading Cockpit/i })).toBeDefined();
      expect(screen.getByRole("heading", { level: 2, name: /Portfolio Valuation & Equity/i })).toBeDefined();
      expect(screen.getByRole("table", { name: /Open Positions/i })).toBeDefined();
      expect(screen.getByRole("table", { name: /Order History/i })).toBeDefined();
      expect(screen.getByRole("table", { name: /Executed Trades Log/i })).toBeDefined();
    });
  });
});
