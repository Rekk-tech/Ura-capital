import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { AssetAllocationBreakdown } from "./AssetAllocationBreakdown";
import { AssetAllocationItem } from "../types/portfolio-ui.types";

describe("AssetAllocationBreakdown (FEAT-075 / AC-005)", () => {
  const mockItems: AssetAllocationItem[] = [
    {
      assetId: "ast-1",
      symbol: "AAPL",
      name: "Apple Inc.",
      quantity: 100,
      currentPrice: "175.0000",
      marketValue: "17500.0000",
      weightPercentage: 25.0,
      unrealizedPnl: "2500.0000",
    },
    {
      assetId: "ast-2",
      symbol: "MSFT",
      name: "Microsoft Corp.",
      quantity: 50,
      currentPrice: "245.0000",
      marketValue: "12250.0000",
      weightPercentage: 17.5,
      unrealizedPnl: "1000.0000",
    },
  ];

  it("renders 100% cash empty state when there are no open positions", () => {
    render(
      <AssetAllocationBreakdown
        items={[]}
        cashBalance="100000.0000"
        cashPercentage={100}
      />
    );

    expect(screen.getByTestId("allocation-empty-state")).toBeInTheDocument();
    expect(screen.getByText("100% Cash Portfolio")).toBeInTheDocument();
    expect(screen.getByText(/Your entire portfolio is held in cash/i)).toBeInTheDocument();
    expect(screen.queryByTestId("allocation-table")).not.toBeInTheDocument();
  });

  it("renders table and distribution bar when open positions exist", () => {
    render(
      <AssetAllocationBreakdown
        items={mockItems}
        cashBalance="40250.0000"
        cashPercentage={57.5}
      />
    );

    expect(screen.getByTestId("allocation-table")).toBeInTheDocument();
    expect(screen.getByTestId("allocation-row-CASH")).toHaveTextContent("CASH");
    expect(screen.getByTestId("allocation-row-CASH")).toHaveTextContent("57.5%");
    expect(screen.getByTestId("allocation-row-AAPL")).toHaveTextContent("AAPL");
    expect(screen.getByTestId("allocation-row-AAPL")).toHaveTextContent("25.0%");
    expect(screen.getByTestId("allocation-row-MSFT")).toHaveTextContent("MSFT");
    expect(screen.getByTestId("allocation-row-MSFT")).toHaveTextContent("17.5%");
  });
});
