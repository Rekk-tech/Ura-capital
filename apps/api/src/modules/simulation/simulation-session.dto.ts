import type { SimulationSessionStatus } from "./simulation.types.js";

type DecimalLike = {
  toFixed: (decimalPlaces?: number) => string;
  toString: () => string;
};

export interface SimulationSessionDto {
  id: string;
  userId: string;
  scenarioId: string;
  scenarioKey?: string;
  scenarioName?: string;
  status: SimulationSessionStatus;
  startingCash: string;
  currentCycle: number;
  portfolioId?: string | null;
  cashBalance?: string | null;
  realizedPnl?: string | null;
  startedAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
  simulated: true;
}

export interface ResetSessionResultDto {
  previousSession: SimulationSessionDto;
  newSession: SimulationSessionDto;
}

export interface RawSimulationSession {
  id: string;
  userId: string;
  scenarioId: string;
  status: string;
  startingCash: DecimalLike | number | string;
  currentCycle: number;
  startedAt: Date | null;
  completedAt: Date | null;
  cancelledAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  scenario?: {
    key: string;
    name: string;
  } | null;
  portfolio?: {
    id: string;
    cashBalance: DecimalLike | number | string;
    realizedPnl: DecimalLike | number | string;
  } | null;
}

function formatDecimal(val: DecimalLike | number | string | null | undefined, decimals = 4): string {
  if (val === null || val === undefined) return "0.0000";
  if (typeof val === "object" && typeof val.toFixed === "function") {
    return val.toFixed(decimals);
  }
  const num = Number(val);
  return isNaN(num) ? "0.0000" : num.toFixed(decimals);
}

export function toSimulationSessionDto(raw: RawSimulationSession): SimulationSessionDto {
  return {
    id: raw.id,
    userId: raw.userId,
    scenarioId: raw.scenarioId,
    scenarioKey: raw.scenario?.key,
    scenarioName: raw.scenario?.name,
    status: raw.status as SimulationSessionStatus,
    startingCash: formatDecimal(raw.startingCash, 4),
    currentCycle: raw.currentCycle,
    portfolioId: raw.portfolio?.id ?? null,
    cashBalance: raw.portfolio ? formatDecimal(raw.portfolio.cashBalance, 4) : null,
    realizedPnl: raw.portfolio ? formatDecimal(raw.portfolio.realizedPnl, 4) : null,
    startedAt: raw.startedAt ? raw.startedAt.toISOString() : null,
    completedAt: raw.completedAt ? raw.completedAt.toISOString() : null,
    cancelledAt: raw.cancelledAt ? raw.cancelledAt.toISOString() : null,
    createdAt: raw.createdAt.toISOString(),
    updatedAt: raw.updatedAt.toISOString(),
    simulated: true,
  };
}
