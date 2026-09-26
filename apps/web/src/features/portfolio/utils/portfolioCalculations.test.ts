import { describe, it, expect } from "vitest";
import {
  formatCurrency,
  formatPercentage,
  calculatePortfolioSummary,
  calculatePnLAnalytics,
  calculateAssetAllocation,
  calculateEquityTrend,
} from "./portfolioCalculations";
import {
  SimulationPortfolioValuationDto,
  SimulationTradeDto,
} from "../types/portfolio-ui.types";

describe("portfolioCalculations (FEAT-075 / AC-003, AC-004, AC-005, AC-006)", () => {
  const mockValuation: SimulationPortfolioValuationDto = {
    sessionId: "sim-session-1",
    currentCycle: 3,
    cashBalance: "65000.0000",
    marketValue: "42000.0000",
    totalEquity: "107000.0000",
    realizedPnl: "2500.0000",
    unrealizedPnl: "4500.0000",
    updatedAt: "2026-09-26T10:00:00Z",
    simulated: true,
    positions: [
      {
        assetId: "ast-1",
        symbol: "AAPL",
        name: "Apple Inc.",
        quantity: 100,
        averageCost: "150.0000",
        currentPrice: "175.0000",
        marketValue: "17500.0000",
        unrealizedPnl: "2500.0000",
        simulated: true,
      },
      {
        assetId: "ast-2",
        symbol: "MSFT",
        name: "Microsoft Corp.",
        quantity: 100,
        averageCost: "225.0000",
        currentPrice: "245.0000",
        marketValue: "24500.0000",
        unrealizedPnl: "2000.0000",
        simulated: true,
      },
    ],
  };

  const mockTrades: SimulationTradeDto[] = [
    {
      id: "trd-1",
      orderId: "ord-1",
      assetId: "ast-1",
      assetSymbol: "AAPL",
      side: "BUY",
      quantity: 100,
      executionPrice: "150.0000",
      notional: "15000.0000",
      realizedPnl: "0.0000",
      executedAt: "2026-09-26T09:00:00Z",
      simulated: true,
    },
    {
      id: "trd-2",
      orderId: "ord-2",
      assetId: "ast-3",
      assetSymbol: "NVDA",
      side: "SELL",
      quantity: 50,
      executionPrice: "300.0000",
      notional: "15000.0000",
      realizedPnl: "3000.0000",
      executedAt: "2026-09-26T09:30:00Z",
      simulated: true,
    },
    {
      id: "trd-3",
      orderId: "ord-3",
      assetId: "ast-4",
      assetSymbol: "TSLA",
      side: "SELL",
      quantity: 20,
      executionPrice: "200.0000",
      notional: "4000.0000",
      realizedPnl: "-500.0000",
      executedAt: "2026-09-26T09:45:00Z",
      simulated: true,
    },
  ];

  describe("formatCurrency", () => {
    it("formats positive numbers with dollar sign and commas", () => {
      expect(formatCurrency(107000)).toBe("$107,000.00");
      expect(formatCurrency("65000.5")).toBe("$65,000.50");
    });

    it("formats negative numbers with leading minus before dollar sign", () => {
      expect(formatCurrency(-500)).toBe("-$500.00");
      expect(formatCurrency("-1250.75")).toBe("-$1,250.75");
    });

    it("handles zero, null, undefined, or empty values safely", () => {
      expect(formatCurrency(0)).toBe("$0.00");
      expect(formatCurrency("0.0000")).toBe("$0.00");
      expect(formatCurrency(null)).toBe("$0.00");
      expect(formatCurrency(undefined)).toBe("$0.00");
      expect(formatCurrency("")).toBe("$0.00");
    });
  });

  describe("formatPercentage", () => {
    it("formats positive percentage with plus sign by default", () => {
      expect(formatPercentage(7.5)).toBe("+7.50%");
    });

    it("formats negative percentage with minus sign", () => {
      expect(formatPercentage(-3.25)).toBe("-3.25%");
    });

    it("formats zero percentage cleanly", () => {
      expect(formatPercentage(0)).toBe("0.00%");
    });
  });

  describe("calculatePortfolioSummary", () => {
    it("calculates exact metrics from authoritative DTO without mutating values", () => {
      const summary = calculatePortfolioSummary(mockValuation);

      expect(summary.totalEquity).toBe("107000.0000");
      expect(summary.cashBalance).toBe("65000.0000");
      expect(summary.marketValue).toBe("42000.0000");
      // Total cost basis = (100 * 150) + (100 * 225) = 15000 + 22500 = 37500
      expect(summary.totalCostBasis).toBe("37500.0000");
      expect(summary.netAssetValue).toBe("107000.0000");
      expect(summary.cashPercentage).toBeCloseTo((65000 / 107000) * 100, 1);
      expect(summary.assetPercentage).toBeCloseTo((42000 / 107000) * 100, 1);
    });

    it("handles 100% cash portfolio safely", () => {
      const cashValuation: SimulationPortfolioValuationDto = {
        sessionId: "sim-session-2",
        currentCycle: 1,
        cashBalance: "100000.0000",
        marketValue: "0.0000",
        totalEquity: "100000.0000",
        realizedPnl: "0.0000",
        unrealizedPnl: "0.0000",
        updatedAt: "2026-09-26T10:00:00Z",
        simulated: true,
        positions: [],
      };

      const summary = calculatePortfolioSummary(cashValuation);
      expect(summary.cashPercentage).toBe(100);
      expect(summary.assetPercentage).toBe(0);
      expect(summary.totalCostBasis).toBe("0.0000");
    });
  });

  describe("calculatePnLAnalytics", () => {
    it("computes PnL breakdown and win/loss distribution from trade history", () => {
      const pnl = calculatePnLAnalytics(mockValuation, mockTrades, "100000.0000");

      expect(pnl.realizedPnl).toBe("2500.0000");
      expect(pnl.unrealizedPnl).toBe("4500.0000");
      expect(pnl.totalPnl).toBe("7000.0000");
      // ROI = ((107000 - 100000) / 100000) * 100 = 7%
      expect(pnl.roiPercentage).toBe(7);
      // Trades: 1 BUY, 1 SELL with profit (+3000), 1 SELL with loss (-500)
      expect(pnl.totalTrades).toBe(3);
      expect(pnl.closedTradesCount).toBe(2);
      expect(pnl.winCount).toBe(1);
      expect(pnl.lossCount).toBe(1);
      expect(pnl.winRatePercentage).toBe(50);
    });

    it("handles zero trades gracefully", () => {
      const pnl = calculatePnLAnalytics(mockValuation, [], "100000.0000");
      expect(pnl.totalTrades).toBe(0);
      expect(pnl.winCount).toBe(0);
      expect(pnl.lossCount).toBe(0);
      expect(pnl.winRatePercentage).toBe(0);
    });
  });

  describe("calculateAssetAllocation", () => {
    it("sorts positions by market value descending and calculates weight percentage", () => {
      const allocation = calculateAssetAllocation(mockValuation);

      expect(allocation.length).toBe(2);
      expect(allocation[0]!.symbol).toBe("MSFT"); // 24500 > 17500
      expect(allocation[1]!.symbol).toBe("AAPL");
      expect(allocation[0]!.weightPercentage).toBeCloseTo((24500 / 107000) * 100, 1);
      expect(allocation[1]!.weightPercentage).toBeCloseTo((17500 / 107000) * 100, 1);
    });

    it("returns empty array for empty positions", () => {
      const emptyValuation = { ...mockValuation, positions: [] };
      const allocation = calculateAssetAllocation(emptyValuation);
      expect(allocation).toEqual([]);
    });
  });

  describe("calculateEquityTrend", () => {
    it("generates progression timeline from baseline through current cycle", () => {
      const points = calculateEquityTrend(mockValuation, mockTrades, "100000.0000");

      expect(points.length).toBeGreaterThanOrEqual(2);
      expect(points[0]!.cycle).toBe(0);
      expect(points[0]!.equity).toBe("100000.00");
      const lastPoint = points[points.length - 1];
      expect(lastPoint!.cycle).toBe(3);
      expect(lastPoint!.equity).toBe("107000.00");
    });
  });
});
