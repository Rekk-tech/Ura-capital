import {
  SimulationPortfolioValuationDto,
  SimulationTradeDto,
  PortfolioEquitySummaryData,
  PnLAnalyticsData,
  AssetAllocationItem,
  EquityTrendPoint,
} from "../types/portfolio-ui.types";

/**
 * Formats a numeric or decimal string value into a currency format with thousands separator.
 * Safely handles negative values (e.g. -$1,234.56).
 */
export function formatCurrency(val: string | number | null | undefined, decimals = 2): string {
  if (val === null || val === undefined || val === "") return "$0.00";
  const num = typeof val === "number" ? val : parseFloat(val);
  if (isNaN(num)) return "$0.00";

  const isNegative = num < 0;
  const absFormatted = Math.abs(num).toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return isNegative ? `-$${absFormatted}` : `$${absFormatted}`;
}

/**
 * Formats a percentage value with optional sign indicator.
 */
export function formatPercentage(val: number | null | undefined, decimals = 2, showPlus = true): string {
  if (val === null || val === undefined || isNaN(val)) return "0.00%";
  const formatted = val.toFixed(decimals);
  if (val > 0 && showPlus) {
    return `+${formatted}%`;
  }
  return `${formatted}%`;
}

/**
 * Calculates portfolio equity summary metrics directly from authoritative valuation DTO.
 * Preserves server-provided strings for totalEquity, cashBalance, marketValue.
 */
export function calculatePortfolioSummary(
  valuation: SimulationPortfolioValuationDto
): PortfolioEquitySummaryData {
  const totalEquityNum = parseFloat(valuation.totalEquity || "0");
  const cashNum = parseFloat(valuation.cashBalance || "0");
  const marketValNum = parseFloat(valuation.marketValue || "0");

  let totalCostBasisNum = 0;
  if (valuation.positions && Array.isArray(valuation.positions)) {
    for (const pos of valuation.positions) {
      const avgCost = parseFloat(pos.averageCost || "0");
      totalCostBasisNum += pos.quantity * avgCost;
    }
  }

  const cashPercentage = totalEquityNum > 0 ? Number(((cashNum / totalEquityNum) * 100).toFixed(4)) : 100;
  const assetPercentage = totalEquityNum > 0 ? Number(((marketValNum / totalEquityNum) * 100).toFixed(4)) : 0;

  return {
    totalEquity: valuation.totalEquity,
    cashBalance: valuation.cashBalance,
    marketValue: valuation.marketValue,
    totalCostBasis: totalCostBasisNum.toFixed(4),
    netAssetValue: valuation.totalEquity,
    cashPercentage: Math.max(0, Math.min(100, cashPercentage)),
    assetPercentage: Math.max(0, Math.min(100, assetPercentage)),
  };
}

/**
 * Calculates PnL & trade performance analytics from server valuation DTO and trade history.
 */
export function calculatePnLAnalytics(
  valuation: SimulationPortfolioValuationDto,
  trades: SimulationTradeDto[] = [],
  startingCash = "100000.0000"
): PnLAnalyticsData {
  const realizedPnlNum = parseFloat(valuation.realizedPnl || "0");
  const unrealizedPnlNum = parseFloat(valuation.unrealizedPnl || "0");
  const totalPnlNum = realizedPnlNum + unrealizedPnlNum;

  const startingCashNum = parseFloat(startingCash) || 100000;
  const totalEquityNum = parseFloat(valuation.totalEquity || "0");
  const rawRoi = startingCashNum > 0 ? ((totalEquityNum - startingCashNum) / startingCashNum) * 100 : 0;
  const roiPercentage = Number(rawRoi.toFixed(4));

  let winCount = 0;
  let lossCount = 0;

  if (Array.isArray(trades)) {
    for (const trade of trades) {
      if (trade.side === "SELL") {
        const pnl = parseFloat(trade.realizedPnl || "0");
        if (pnl > 0) {
          winCount++;
        } else if (pnl < 0) {
          lossCount++;
        }
      }
    }
  }

  const closedTradesCount = winCount + lossCount;
  const winRatePercentage = closedTradesCount > 0 ? Number(((winCount / closedTradesCount) * 100).toFixed(4)) : 0;

  return {
    realizedPnl: valuation.realizedPnl,
    unrealizedPnl: valuation.unrealizedPnl,
    totalPnl: totalPnlNum.toFixed(4),
    roiPercentage,
    winCount,
    lossCount,
    totalTrades: trades.length,
    closedTradesCount,
    winRatePercentage,
  };
}

/**
 * Derives asset allocation items from positions and total equity.
 */
export function calculateAssetAllocation(
  valuation: SimulationPortfolioValuationDto
): AssetAllocationItem[] {
  if (!valuation.positions || !Array.isArray(valuation.positions) || valuation.positions.length === 0) {
    return [];
  }

  const totalEquityNum = parseFloat(valuation.totalEquity || "0");

  return valuation.positions.map((pos) => {
    const marketValNum = parseFloat(pos.marketValue || "0");
    const weightPercentage = totalEquityNum > 0 ? (marketValNum / totalEquityNum) * 100 : 0;

    return {
      assetId: pos.assetId,
      symbol: pos.symbol,
      name: pos.name,
      quantity: pos.quantity,
      currentPrice: pos.currentPrice,
      marketValue: pos.marketValue,
      weightPercentage: Math.max(0, Math.min(100, weightPercentage)),
      unrealizedPnl: pos.unrealizedPnl,
    };
  }).sort((a, b) => parseFloat(b.marketValue) - parseFloat(a.marketValue));
}

/**
 * Constructs an equity curve progression tracking milestones from baseline to current cycle.
 */
export function calculateEquityTrend(
  valuation: SimulationPortfolioValuationDto,
  trades: SimulationTradeDto[] = [],
  startingCash = "100000.0000"
): EquityTrendPoint[] {
  const points: EquityTrendPoint[] = [];

  // Point 0: Session Initial Baseline
  points.push({
    pointIndex: 0,
    label: "Session Start (Cycle 0)",
    cycle: 0,
    equity: parseFloat(startingCash).toFixed(2),
    cash: parseFloat(startingCash).toFixed(2),
    marketValue: "0.00",
  });

  // Intermediate trade milestones (if any trades executed)
  if (Array.isArray(trades) && trades.length > 0) {
    let cumulativeRealized = 0;
    trades.forEach((trade, idx) => {
      const tradePnl = parseFloat(trade.realizedPnl || "0");
      cumulativeRealized += tradePnl;
      if (idx === 0 || idx === Math.floor(trades.length / 2) || trade.side === "SELL") {
        const estEquity = (parseFloat(startingCash) + cumulativeRealized).toFixed(2);
        points.push({
          pointIndex: points.length,
          label: `Trade #${idx + 1} (${trade.assetSymbol})`,
          cycle: Math.max(1, valuation.currentCycle),
          equity: estEquity,
          cash: estEquity,
          marketValue: "0.00",
          timestamp: trade.executedAt,
        });
      }
    });
  }

  // Final Point: Current Authoritative Valuation
  const currentCycle = valuation.currentCycle || 1;
  points.push({
    pointIndex: points.length,
    label: `Current Valuation (Cycle ${currentCycle})`,
    cycle: currentCycle,
    equity: parseFloat(valuation.totalEquity || startingCash).toFixed(2),
    cash: parseFloat(valuation.cashBalance || startingCash).toFixed(2),
    marketValue: parseFloat(valuation.marketValue || "0").toFixed(2),
    timestamp: valuation.updatedAt,
  });

  return points;
}
