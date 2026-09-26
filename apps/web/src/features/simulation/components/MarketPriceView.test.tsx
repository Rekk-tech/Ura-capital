import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { MarketPriceView } from "./MarketPriceView";
import { SimulationAssetDto, SimulationMarketSnapshotDto } from "../types/simulation-ui.types";

const mockAssets: SimulationAssetDto[] = [
  { id: "a1", symbol: "AAPL", name: "Apple Inc.", assetType: "EQUITY", status: "ACTIVE", displayOrder: 1 },
  { id: "a2", symbol: "MSFT", name: "Microsoft Corporation", assetType: "EQUITY", status: "ACTIVE", displayOrder: 2 },
];

const mockSnapshots: SimulationMarketSnapshotDto[] = [
  { id: "s1", scenarioId: "sc1", assetId: "a1", cycle: 1, price: "185.5000", occurredAt: "2026-09-26T00:00:00Z" },
  { id: "s2", scenarioId: "sc1", assetId: "a2", cycle: 1, price: "420.0000", occurredAt: "2026-09-26T00:00:00Z" },
];

describe("MarketPriceView (FEAT-074: AC-002, AC-007)", () => {
  it("renders market prices table with assets and snapshot values", () => {
    render(<MarketPriceView assets={mockAssets} snapshots={mockSnapshots} currentCycle={1} />);

    expect(screen.getByTestId("market-price-view")).toBeInTheDocument();
    expect(screen.getByTestId("market-cycle-badge")).toHaveTextContent("Cycle 1");
    expect(screen.getByTestId("asset-price-AAPL")).toHaveTextContent("$185.5000");
    expect(screen.getByTestId("asset-price-MSFT")).toHaveTextContent("$420.0000");
  });

  it("filters assets by search term", () => {
    render(<MarketPriceView assets={mockAssets} snapshots={mockSnapshots} currentCycle={1} />);

    const searchInput = screen.getByTestId("market-search-input");
    fireEvent.change(searchInput, { target: { value: "Apple" } });

    expect(screen.getByTestId("market-asset-row-AAPL")).toBeInTheDocument();
    expect(screen.queryByTestId("market-asset-row-MSFT")).not.toBeInTheDocument();
  });

  it("calls onSelectAsset with symbol and side when Buy or Sell button is clicked", () => {
    const onSelect = vi.fn();
    render(
      <MarketPriceView
        assets={mockAssets}
        snapshots={mockSnapshots}
        currentCycle={1}
        onSelectAsset={onSelect}
      />,
    );

    const buyBtn = screen.getByTestId("trade-buy-btn-AAPL");
    fireEvent.click(buyBtn);
    expect(onSelect).toHaveBeenCalledWith("AAPL", "BUY");

    const sellBtn = screen.getByTestId("trade-sell-btn-MSFT");
    fireEvent.click(sellBtn);
    expect(onSelect).toHaveBeenCalledWith("MSFT", "SELL");
  });

  it("renders empty state when no assets are provided", () => {
    render(<MarketPriceView assets={[]} snapshots={[]} />);
    expect(screen.getByTestId("market-empty-state")).toBeInTheDocument();
  });
});
