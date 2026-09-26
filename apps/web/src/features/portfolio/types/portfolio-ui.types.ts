export type {
  SimulationSessionStatus,
  SimulationSessionDto,
  SimulationAssetDto,
  SimulationPositionValuationDto,
  SimulationPortfolioValuationDto,
  SimulationTradeDto,
  SimulationOrderDto,
} from "../../simulation/types/simulation-ui.types";

export interface PortfolioEquitySummaryData {
  totalEquity: string;
  cashBalance: string;
  marketValue: string;
  totalCostBasis: string;
  netAssetValue: string;
  cashPercentage: number;
  assetPercentage: number;
}

export interface PnLAnalyticsData {
  realizedPnl: string;
  unrealizedPnl: string;
  totalPnl: string;
  roiPercentage: number;
  winCount: number;
  lossCount: number;
  totalTrades: number;
  closedTradesCount: number;
  winRatePercentage: number;
}

export interface AssetAllocationItem {
  assetId: string;
  symbol: string;
  name: string;
  quantity: number;
  currentPrice: string;
  marketValue: string;
  weightPercentage: number;
  unrealizedPnl: string;
}

export interface EquityTrendPoint {
  pointIndex: number;
  label: string;
  cycle: number;
  equity: string;
  cash: string;
  marketValue: string;
  timestamp?: string;
}
