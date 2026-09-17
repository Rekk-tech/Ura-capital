import type { SimulationAsset, SimulationTrade, SimulationPosition } from "@prisma/client";
import { SIMULATION_CONSTANTS } from "./simulation.types.js";
import { toCurrencyDecimal, toPriceDecimal } from "./simulation-accounting.js";
import type { SimulationOrderResponseDto } from "./simulation-order.dto.js";

export interface SimulationPositionValuationDto {
  assetId: string;
  symbol: string;
  name: string;
  quantity: number;
  averageCost: string;
  currentPrice: string;
  marketValue: string;
  unrealizedPnl: string;
}

export interface SimulationPortfolioValuationResponseDto {
  sessionId: string;
  currentCycle: number;
  cashBalance: string;
  marketValue: string;
  realizedPnl: string;
  unrealizedPnl: string;
  totalEquity: string;
  positions: SimulationPositionValuationDto[];
  simulated: true;
  updatedAt: string;
}

export interface SimulationTradeResponseDto {
  id: string;
  orderId: string;
  side: "BUY" | "SELL";
  assetSymbol: string;
  quantity: number;
  executionPrice: string;
  notional: string;
  realizedPnl: string;
  executedAt: string;
  simulated: true;
}

export interface SimulationPortfolioValuationResponse {
  data: SimulationPortfolioValuationResponseDto;
}

export interface SimulationOrderListResponse {
  data: SimulationOrderResponseDto[];
}

export interface SimulationTradeListResponse {
  data: SimulationTradeResponseDto[];
}

export type RawPositionWithAsset = SimulationPosition & {
  asset: SimulationAsset;
};

export type RawTradeWithDetails = SimulationTrade & {
  asset?: SimulationAsset | null;
};

/**
 * Maps a persisted SimulationTrade with its asset to a safe client response DTO.
 * Excludes internal session ID, foreign keys, and DB metadata.
 */
export function toSimulationTradeResponseDto(
  trade: RawTradeWithDetails,
  assetSymbolFallback?: string,
): SimulationTradeResponseDto {
  const assetSymbol = trade.asset?.symbol ?? assetSymbolFallback ?? "";

  const executionPriceStr = toPriceDecimal(trade.executionPrice).toFixed(
    SIMULATION_CONSTANTS.DECIMAL_SCALE_PRICE,
  );
  const notionalStr = toCurrencyDecimal(trade.notional).toFixed(
    SIMULATION_CONSTANTS.DECIMAL_SCALE_CURRENCY,
  );
  const realizedPnlStr = toCurrencyDecimal(trade.realizedPnl).toFixed(
    SIMULATION_CONSTANTS.DECIMAL_SCALE_CURRENCY,
  );

  return {
    id: trade.id,
    orderId: trade.orderId,
    side: trade.side as "BUY" | "SELL",
    assetSymbol,
    quantity: trade.quantity,
    executionPrice: executionPriceStr,
    notional: notionalStr,
    realizedPnl: realizedPnlStr,
    executedAt:
      trade.executedAt instanceof Date
        ? trade.executedAt.toISOString()
        : new Date(trade.executedAt).toISOString(),
    simulated: true,
  };
}
