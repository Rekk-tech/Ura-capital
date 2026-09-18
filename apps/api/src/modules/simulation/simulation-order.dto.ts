import type { SimulationOrder, SimulationTrade, SimulationAsset } from "@prisma/client";
import { SIMULATION_CONSTANTS, type SimulationOrderSide, type SimulationOrderType, type SimulationOrderStatus } from "./simulation.types.js";
import { toPriceDecimal, toCurrencyDecimal } from "./simulation-accounting.js";

export interface SubmitOrderRequestDto {
  side: SimulationOrderSide;
  type: SimulationOrderType;
  assetSymbol: string;
  quantity: number;
  idempotencyKey: string;
}

export interface SimulationOrderResponseDto {
  id: string;
  side: SimulationOrderSide;
  type: SimulationOrderType;
  assetSymbol: string;
  quantity: number;
  status: SimulationOrderStatus;
  executionPrice: string | null;
  executedQuantity: number | null;
  realizedPnl: string;
  submittedAt: string;
  filledAt: string | null;
  isReplay?: boolean;
  simulated: true;
}

export type RawSimulationOrderWithDetails = SimulationOrder & {
  asset?: SimulationAsset | null;
  trade?: SimulationTrade | null;
};

/**
 * Maps a persisted SimulationOrder with its optional trade and asset to a safe client response DTO.
 * Excludes internal foreign keys, user IDs, scenario IDs, and DB metadata.
 * Ensures simulated: true and exact decimal string formatting.
 */
export function toSimulationOrderResponseDto(
  order: RawSimulationOrderWithDetails,
  assetSymbolFallback?: string,
  isReplay = false,
): SimulationOrderResponseDto {
  const assetSymbol = order.asset?.symbol ?? assetSymbolFallback ?? "";
  
  let executionPriceStr: string | null = null;
  if (order.executionPrice !== null && order.executionPrice !== undefined) {
    executionPriceStr = toPriceDecimal(order.executionPrice).toFixed(
      SIMULATION_CONSTANTS.DECIMAL_SCALE_PRICE,
    );
  }

  let realizedPnlStr = "0.0000";
  if (order.trade?.realizedPnl !== null && order.trade?.realizedPnl !== undefined) {
    realizedPnlStr = toCurrencyDecimal(order.trade.realizedPnl).toFixed(
      SIMULATION_CONSTANTS.DECIMAL_SCALE_CURRENCY,
    );
  }

  const dto: SimulationOrderResponseDto = {
    id: order.id,
    side: order.side as SimulationOrderSide,
    type: order.type as SimulationOrderType,
    assetSymbol,
    quantity: order.quantity,
    status: order.status as SimulationOrderStatus,
    executionPrice: executionPriceStr,
    executedQuantity: order.executedQuantity ?? null,
    realizedPnl: realizedPnlStr,
    submittedAt: order.submittedAt instanceof Date ? order.submittedAt.toISOString() : new Date(order.submittedAt).toISOString(),
    filledAt: order.filledAt ? (order.filledAt instanceof Date ? order.filledAt.toISOString() : new Date(order.filledAt).toISOString()) : null,
    simulated: true,
  };

  if (isReplay) {
    dto.isReplay = true;
  }

  return dto;
}
