import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { MarketOrderTicket } from "./MarketOrderTicket";
import { SimulationAssetDto, SimulationMarketSnapshotDto, SimulationApiError } from "../types/simulation-ui.types";

const mockAssets: SimulationAssetDto[] = [
  { id: "a1", symbol: "AAPL", name: "Apple Inc.", assetType: "EQUITY", status: "ACTIVE", displayOrder: 1 },
  { id: "a2", symbol: "MSFT", name: "Microsoft Corporation", assetType: "EQUITY", status: "ACTIVE", displayOrder: 2 },
];

const mockSnapshots: SimulationMarketSnapshotDto[] = [
  { id: "s1", scenarioId: "sc1", assetId: "a1", cycle: 1, price: "150.0000", occurredAt: "2026-09-26T00:00:00Z" },
];

describe("MarketOrderTicket (FEAT-074: AC-003, AC-007)", () => {
  it("renders order ticket with cash balance, BUY/SELL and MARKET/LIMIT options", () => {
    render(
      <MarketOrderTicket
        simulationId="sess-1"
        sessionStatus="ACTIVE"
        assets={mockAssets}
        snapshots={mockSnapshots}
        onSubmitOrder={vi.fn()}
        cashBalance="50000.0000"
      />,
    );

    expect(screen.getByTestId("market-order-ticket")).toBeInTheDocument();
    expect(screen.getByTestId("ticket-cash-balance")).toHaveTextContent("$50000.0000");
    expect(screen.getByTestId("side-buy-button")).toBeInTheDocument();
    expect(screen.getByTestId("side-sell-button")).toBeInTheDocument();
    expect(screen.getByTestId("type-market-button")).toBeInTheDocument();
    expect(screen.getByTestId("type-limit-button")).toBeInTheDocument();
    expect(screen.getByTestId("ticket-price-preview")).toHaveTextContent("$150.0000");
  });

  it("toggles order action between BUY and SELL", () => {
    render(
      <MarketOrderTicket
        simulationId="sess-1"
        sessionStatus="ACTIVE"
        assets={mockAssets}
        snapshots={mockSnapshots}
        onSubmitOrder={vi.fn()}
      />,
    );

    const sellBtn = screen.getByTestId("side-sell-button");
    fireEvent.click(sellBtn);
    expect(sellBtn).toHaveClass("active");
    expect(screen.getByTestId("submit-order-button")).toHaveTextContent("Place SELL MARKET Order");
  });

  it("toggles order type to LIMIT and shows limit price input", () => {
    render(
      <MarketOrderTicket
        simulationId="sess-1"
        sessionStatus="ACTIVE"
        assets={mockAssets}
        snapshots={mockSnapshots}
        onSubmitOrder={vi.fn()}
      />,
    );

    const limitBtn = screen.getByTestId("type-limit-button");
    fireEvent.click(limitBtn);
    expect(limitBtn).toHaveClass("active");
    expect(screen.getByTestId("limit-price-group")).toBeInTheDocument();
    expect(screen.getByTestId("submit-order-button")).toHaveTextContent("Place BUY LIMIT Order");
  });

  it("calculates estimated notional and warns when exceeding cash balance", () => {
    render(
      <MarketOrderTicket
        simulationId="sess-1"
        sessionStatus="ACTIVE"
        assets={mockAssets}
        snapshots={mockSnapshots}
        onSubmitOrder={vi.fn()}
        cashBalance="1000.0000"
      />,
    );

    const qtyInput = screen.getByTestId("quantity-input");
    // 150 * 10 = 1500 > 1000 cash balance
    fireEvent.change(qtyInput, { target: { value: "10" } });

    expect(screen.getByTestId("estimated-notional-value")).toHaveTextContent("$1500.0000");
    expect(screen.getByTestId("cash-exceeded-warning")).toBeInTheDocument();
    expect(screen.getByTestId("submit-order-button")).toBeDisabled();
  });

  it("calls onSubmitOrder with generated idempotencyKey and parameters", async () => {
    const onSubmit = vi.fn().mockResolvedValue({
      id: "ord-new",
      sessionId: "sess-1",
      assetSymbol: "AAPL",
      side: "BUY",
      type: "MARKET",
      quantity: 5,
      status: "FILLED",
      executionPrice: "150.0000",
      executedQuantity: 5,
      filledAt: "2026-09-26T10:00:00Z",
      realizedPnl: "0.0000",
      submittedAt: "2026-09-26T10:00:00Z",
      simulated: true,
    });

    render(
      <MarketOrderTicket
        simulationId="sess-1"
        sessionStatus="ACTIVE"
        assets={mockAssets}
        snapshots={mockSnapshots}
        onSubmitOrder={onSubmit}
        cashBalance="50000.0000"
      />,
    );

    const qtyInput = screen.getByTestId("quantity-input");
    fireEvent.change(qtyInput, { target: { value: "5" } });

    const form = screen.getByTestId("order-form");
    fireEvent.submit(form);

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        "BUY",
        "AAPL",
        5,
        expect.any(String),
        "MARKET",
        undefined,
      );
    });

    expect(screen.getByTestId("order-success-banner")).toBeInTheDocument();
  });

  it("displays server error alert when submission fails with INSUFFICIENT_CASH", async () => {
    const onSubmit = vi.fn().mockRejectedValue(
      new SimulationApiError(400, "INSUFFICIENT_CASH", "Lacks cash"),
    );

    render(
      <MarketOrderTicket
        simulationId="sess-1"
        sessionStatus="ACTIVE"
        assets={mockAssets}
        snapshots={mockSnapshots}
        onSubmitOrder={onSubmit}
        cashBalance="50000.0000"
      />,
    );

    const form = screen.getByTestId("order-form");
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByTestId("order-error-banner")).toHaveTextContent(
        "Insufficient cash balance to place this market BUY order.",
      );
    });
  });

  it("disables order placement when session is not ACTIVE", () => {
    render(
      <MarketOrderTicket
        simulationId="sess-1"
        sessionStatus="CREATED"
        assets={mockAssets}
        snapshots={mockSnapshots}
        onSubmitOrder={vi.fn()}
      />,
    );

    expect(screen.getByTestId("ticket-inactive-banner")).toBeInTheDocument();
    expect(screen.getByTestId("submit-order-button")).toBeDisabled();
  });
});
