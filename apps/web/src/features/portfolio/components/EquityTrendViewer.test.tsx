import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { EquityTrendViewer } from "./EquityTrendViewer";
import { EquityTrendPoint } from "../types/portfolio-ui.types";

describe("EquityTrendViewer (FEAT-075 / AC-006)", () => {
  const mockTrendPoints: EquityTrendPoint[] = [
    {
      pointIndex: 0,
      label: "Session Start (Cycle 0)",
      cycle: 0,
      equity: "100000.00",
      cash: "100000.00",
      marketValue: "0.00",
    },
    {
      pointIndex: 1,
      label: "Trade #1 (AAPL)",
      cycle: 1,
      equity: "102500.00",
      cash: "87500.00",
      marketValue: "15000.00",
      timestamp: "2026-09-26T09:00:00Z",
    },
    {
      pointIndex: 2,
      label: "Current Valuation (Cycle 2)",
      cycle: 2,
      equity: "106000.00",
      cash: "81000.00",
      marketValue: "25000.00",
      timestamp: "2026-09-26T10:00:00Z",
    },
  ];

  it("renders milestone timeline cards and structured data table", () => {
    render(<EquityTrendViewer trendPoints={mockTrendPoints} />);

    expect(screen.getByTestId("equity-trend-viewer")).toBeInTheDocument();
    expect(screen.getByTestId("trend-step-0")).toHaveTextContent("Session Start (Cycle 0)");
    expect(screen.getByTestId("trend-step-0")).toHaveTextContent("$100,000.00");
    expect(screen.getByTestId("trend-step-2")).toHaveTextContent("Current Valuation (Cycle 2)");
    expect(screen.getByTestId("trend-step-2")).toHaveTextContent("$106,000.00");

    expect(screen.getByTestId("equity-trend-table")).toBeInTheDocument();
    expect(screen.getByTestId("trend-row-0")).toHaveTextContent("Session Start (Cycle 0)");
    expect(screen.getByTestId("trend-row-1")).toHaveTextContent("Trade #1 (AAPL)");
    expect(screen.getByTestId("trend-row-2")).toHaveTextContent("Current Valuation (Cycle 2)");
  });
});
