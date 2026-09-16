import type {
  Prisma,
  SimulationScenario,
  SimulationAsset,
  SimulationMarketSnapshot,
  SimulationSession,
  SimulationPortfolio,
  SimulationPosition,
  SimulationOrder,
  SimulationTrade,
} from "@prisma/client";

export type Decimal = Prisma.Decimal;
export type {
  SimulationScenario,
  SimulationAsset,
  SimulationMarketSnapshot,
  SimulationSession,
  SimulationPortfolio,
  SimulationPosition,
  SimulationOrder,
  SimulationTrade,
};

// ============================================================================
// Phase 5: Simulation Domain Types & Closed-Set Constants (FEAT-031)
// ============================================================================

export const SIMULATION_SCENARIO_STATUS = {
  ACTIVE: "ACTIVE",
  ARCHIVED: "ARCHIVED",
} as const;
export type SimulationScenarioStatus =
  (typeof SIMULATION_SCENARIO_STATUS)[keyof typeof SIMULATION_SCENARIO_STATUS];

export const SIMULATION_ASSET_TYPE = {
  EQUITY: "EQUITY",
} as const;
export type SimulationAssetType =
  (typeof SIMULATION_ASSET_TYPE)[keyof typeof SIMULATION_ASSET_TYPE];

export const SIMULATION_ASSET_STATUS = {
  ACTIVE: "ACTIVE",
  ARCHIVED: "ARCHIVED",
} as const;
export type SimulationAssetStatus =
  (typeof SIMULATION_ASSET_STATUS)[keyof typeof SIMULATION_ASSET_STATUS];

export const SIMULATION_SESSION_STATUS = {
  CREATED: "CREATED",
  ACTIVE: "ACTIVE",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
} as const;
export type SimulationSessionStatus =
  (typeof SIMULATION_SESSION_STATUS)[keyof typeof SIMULATION_SESSION_STATUS];

export const SIMULATION_ORDER_SIDE = {
  BUY: "BUY",
  SELL: "SELL",
} as const;
export type SimulationOrderSide =
  (typeof SIMULATION_ORDER_SIDE)[keyof typeof SIMULATION_ORDER_SIDE];

export const SIMULATION_ORDER_TYPE = {
  MARKET: "MARKET",
} as const;
export type SimulationOrderType =
  (typeof SIMULATION_ORDER_TYPE)[keyof typeof SIMULATION_ORDER_TYPE];

export const SIMULATION_ORDER_STATUS = {
  RECEIVED: "RECEIVED",
  FILLED: "FILLED",
  REJECTED: "REJECTED",
} as const;
export type SimulationOrderStatus =
  (typeof SIMULATION_ORDER_STATUS)[keyof typeof SIMULATION_ORDER_STATUS];

export const SIMULATION_TRADE_SIDE = {
  BUY: "BUY",
  SELL: "SELL",
} as const;
export type SimulationTradeSide =
  (typeof SIMULATION_TRADE_SIDE)[keyof typeof SIMULATION_TRADE_SIDE];

// Human-Approved MVP Constants & Monetary Precision
export const SIMULATION_CONSTANTS = {
  STARTING_CASH_DEFAULT: "100000.0000",
  STARTING_CYCLE: 1,
  TRADING_FEE: "0.0000",
  SLIPPAGE: "0.0000",
  DEFAULT_REALIZED_PNL: "0.0000",
  DECIMAL_SCALE_CURRENCY: 4,
  DECIMAL_SCALE_PRICE: 6,
} as const;

// Input types for repositories
export interface CreateScenarioInput {
  key: string;
  name: string;
  status?: SimulationScenarioStatus;
}

export interface CreateAssetInput {
  symbol: string;
  name: string;
  assetType?: SimulationAssetType;
  status?: SimulationAssetStatus;
  displayOrder?: number;
}

export interface CreateSnapshotInput {
  scenarioId: string;
  assetId: string;
  cycle: number;
  price: Prisma.Decimal | string | number;
  occurredAt: Date;
}

export interface CreateSessionInput {
  userId: string;
  scenarioId: string;
  status?: SimulationSessionStatus;
  startingCash?: Prisma.Decimal | string | number;
  currentCycle?: number;
  startedAt?: Date | null;
}

export interface CreatePortfolioInput {
  sessionId: string;
  cashBalance: Prisma.Decimal | string | number;
  realizedPnl?: Prisma.Decimal | string | number;
}

export interface CreatePositionInput {
  portfolioId: string;
  assetId: string;
  quantity: number;
  averageCost: Prisma.Decimal | string | number;
}

export interface CreateOrderInput {
  sessionId: string;
  userId: string;
  assetId: string;
  side: SimulationOrderSide;
  type?: SimulationOrderType;
  quantity: number;
  status?: SimulationOrderStatus;
  idempotencyKey: string;
  requestFingerprint: string;
  executionPrice?: Prisma.Decimal | string | number | null;
  executedQuantity?: number | null;
  filledAt?: Date | null;
  rejectionCode?: string | null;
}

export interface CreateTradeInput {
  orderId: string;
  sessionId: string;
  assetId: string;
  side: SimulationTradeSide;
  quantity: number;
  executionPrice: Prisma.Decimal | string | number;
  notional: Prisma.Decimal | string | number;
  realizedPnl?: Prisma.Decimal | string | number;
  executedAt?: Date;
}
