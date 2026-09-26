import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { PnLAnalyticsCard } from "./PnLAnalyticsCard";
import { PnLAnalyticsData } from "../types/portfolio-ui.types";

describe("PnLAnalyticsCard (FEAT-075 / AC-004)", () => {
  const mockPositiveAnalytics: PnLAnalyticsData = {
    realizedPnl: "2500.0000",
    unrealizedPnl: "4500.0000",
    totalPnl: "7000.0000",
    roiPercentage: 7.0,
    winCount: 3,
    lossCount: 1,
    totalTrades: 5,
    closedTradesCount: 4,
    winRatePercentage: 75.0,
  };

  const mockNegativeAnalytics: PnLAnalyticsData = {
    realizedPnl: "-1200.0000",
    unrealizedPnl: "-800.0000",
    totalPnl: "-2000.0000",
    roiPercentage: -2.0,
    winCount: 0,
    lossCount: 2,
    totalTrades: 3,
    closedTradesCount: 2,
    winRatePercentage: 0.0,
  };

  it("renders positive PnL metrics with appropriate success formatting and ROI badge", () => {
    render(<PnLAnalyticsCard analytics={mockPositiveAnalytics} />);

    expect(screen.getByTestId("pnl-analytics-card")).toBeInTheDocument();
    expect(screen.getByTestId("roi-badge")).toHaveTextContent("ROI: +7.00%");
    expect(screen.getByTestId("metric-realized-pnl")).toHaveTextContent("$2,500.00");
    expect(screen.getByTestId("metric-unrealized-pnl")).toHaveTextContent("$4,500.00");
    expect(screen.getByTestId("metric-total-pnl")).toHaveTextContent("$7,000.00");
    expect(screen.getByTestId("metric-win-loss")).toHaveTextContent("75.00%");
    expect(screen.getByTestId("metric-win-loss")).toHaveTextContent("3 Wins");
    expect(screen.getByTestId("metric-win-loss")).toHaveTextContent("1 Losses");
  });

  it("renders negative PnL metrics with appropriate negative formatting and error badge", () => {
    render(<PnLAnalyticsCard analytics={mockNegativeAnalytics} />);

    expect(screen.getByTestId("roi-badge")).toHaveTextContent("ROI: -2.00%");
    expect(screen.getByTestId("metric-realized-pnl")).toHaveTextContent("-$1,200.00");
    expect(screen.getByTestId("metric-unrealized-pnl")).toHaveTextContent("-$800.00");
    expect(screen.getByTestId("metric-total-pnl")).toHaveTextContent("-$2,000.00");
    expect(screen.getByTestId("metric-win-loss")).toHaveTextContent("0.00%");
    expect(screen.getByTestId("metric-win-loss")).toHaveTextContent("2 Losses");
  });
});
