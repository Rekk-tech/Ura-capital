import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { PortfolioEquitySummary } from "./PortfolioEquitySummary";
import { PortfolioEquitySummaryData } from "../types/portfolio-ui.types";

describe("PortfolioEquitySummary (FEAT-075 / AC-003)", () => {
  const mockSummary: PortfolioEquitySummaryData = {
    totalEquity: "107000.0000",
    cashBalance: "65000.0000",
    marketValue: "42000.0000",
    totalCostBasis: "37500.0000",
    netAssetValue: "107000.0000",
    cashPercentage: 60.75,
    assetPercentage: 39.25,
  };

  it("renders all key equity metrics with exact currency formatting", () => {
    render(<PortfolioEquitySummary summary={mockSummary} />);

    expect(screen.getByTestId("portfolio-equity-summary")).toBeInTheDocument();
    expect(screen.getByTestId("kpi-total-equity")).toHaveTextContent("$107,000.00");
    expect(screen.getByTestId("kpi-cash-balance")).toHaveTextContent("$65,000.00");
    expect(screen.getByTestId("kpi-market-value")).toHaveTextContent("$42,000.00");
    expect(screen.getByTestId("kpi-cost-basis")).toHaveTextContent("$37,500.00");
    expect(screen.getByTestId("nav-badge")).toHaveTextContent("NAV: $107,000.00");
  });

  it("renders accessible progress bar representing cash to asset ratio", () => {
    render(<PortfolioEquitySummary summary={mockSummary} />);

    const progressBar = screen.getByRole("progressbar", { name: /cash to assets ratio/i });
    expect(progressBar).toBeInTheDocument();
    expect(progressBar).toHaveAttribute("aria-valuenow", "61");
    expect(progressBar).toHaveAttribute("aria-valuemin", "0");
    expect(progressBar).toHaveAttribute("aria-valuemax", "100");
  });
});
