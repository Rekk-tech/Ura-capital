export type SimulationSessionStatus = "CREATED" | "PENDING" | "ACTIVE" | "COMPLETED" | "CANCELLED";

export interface SimulationSessionDto {
  id: string;
  userId: string;
  scenarioId: string;
  status: SimulationSessionStatus;
  startingCash: string;
  currentCycle: number;
  startedAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
  scenario?: {
    name: string;
    key: string;
  };
  simulated?: boolean;
}

export interface SimulationAssetDto {
  id: string;
  symbol: string;
  name: string;
  assetType: string;
  status: string;
  displayOrder: number;
}

export interface SimulationMarketSnapshotDto {
  id: string;
  scenarioId: string;
  assetId: string;
  cycle: number;
  price: string;
  occurredAt: string;
  asset?: SimulationAssetDto;
}

export interface SimulationPositionValuationDto {
  assetId: string;
  symbol: string;
  name: string;
  quantity: number;
  averageCost: string;
  currentPrice: string;
  marketValue: string;
  unrealizedPnl: string;
  simulated: boolean;
}

export interface SimulationPortfolioValuationDto {
  sessionId: string;
  currentCycle: number;
  cashBalance: string;
  marketValue: string;
  totalEquity: string;
  realizedPnl: string;
  unrealizedPnl: string;
  positions: SimulationPositionValuationDto[];
  simulated: boolean;
  updatedAt: string;
}

export type SimulationOrderSide = "BUY" | "SELL";
export type SimulationOrderType = "MARKET" | "LIMIT";
export type SimulationOrderStatus = "RECEIVED" | "FILLED" | "REJECTED";

export interface SimulationOrderDto {
  id: string;
  sessionId: string;
  assetId: string;
  assetSymbol: string;
  side: SimulationOrderSide;
  type: SimulationOrderType;
  quantity: number;
  status: SimulationOrderStatus;
  executionPrice: string | null;
  executedQuantity: number | null;
  filledAt: string | null;
  realizedPnl: string | null;
  submittedAt: string;
  simulated: boolean;
}

export interface SimulationTradeDto {
  id: string;
  orderId: string;
  assetId: string;
  assetSymbol: string;
  side: SimulationOrderSide;
  quantity: number;
  executionPrice: string;
  notional: string;
  realizedPnl: string;
  executedAt: string;
  simulated: boolean;
}

export interface SubmitOrderRequestDto {
  side: SimulationOrderSide;
  type: SimulationOrderType;
  assetSymbol: string;
  quantity: number;
  idempotencyKey: string;
  limitPrice?: string;
}

export interface AppErrorResponse {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export class SimulationApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "SimulationApiError";
  }
}
