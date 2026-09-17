import { AppError } from "../../shared/errors/error-envelope.js";
import { ERROR_CODES, HTTP_STATUS } from "@aura/shared";
import type {
  ISimulationSessionRepository,
  ISimulationPortfolioRepository,
  ISimulationMarketSnapshotRepository,
  ISimulationOrderRepository,
  ISimulationTradeRepository,
} from "./simulation.repository.js";
import {
  SIMULATION_CONSTANTS,
  type Decimal,
} from "./simulation.types.js";
import {
  toCurrencyDecimal,
  toPriceDecimal,
} from "./simulation-accounting.js";
import {
  type SimulationPortfolioValuationResponseDto,
  type SimulationPositionValuationDto,
  type SimulationTradeResponseDto,
  toSimulationTradeResponseDto,
  type RawPositionWithAsset,
  type RawTradeWithDetails,
} from "./simulation-valuation.dto.js";
import {
  type SimulationOrderResponseDto,
  toSimulationOrderResponseDto,
  type RawSimulationOrderWithDetails,
} from "./simulation-order.dto.js";
import { simulationIdParamSchema } from "./simulation-session.validation.js";

export class SimulationValuationService {
  constructor(
    private readonly sessionRepo: ISimulationSessionRepository,
    private readonly portfolioRepo: ISimulationPortfolioRepository,
    private readonly marketSnapshotRepo: ISimulationMarketSnapshotRepository,
    private readonly orderRepo: ISimulationOrderRepository,
    private readonly tradeRepo: ISimulationTradeRepository,
  ) {}

  /**
   * Validates simulationId UUID parameter string.
   */
  private validateSessionId(simulationId: string): string {
    const parseResult = simulationIdParamSchema.safeParse({ simulationId });
    if (!parseResult.success) {
      throw new AppError(
        "Invalid simulation session ID",
        ERROR_CODES.VALIDATION_ERROR,
        HTTP_STATUS.BAD_REQUEST,
      );
    }
    return simulationId;
  }

  /**
   * FR-001, FR-002, FR-006, FR-007, AC-003, AC-004, AC-005, AC-006, AC-007, AC-009, AC-010, AC-011, AC-012:
   * Computes and returns current server-authoritative portfolio valuation, unrealized PnL,
   * total equity, and position valuations against authoritative cycle market snapshots.
   *
   * Enforces owner isolation (returns 404 NOT_FOUND on foreign or nonexistent session).
   * Guaranteed strictly READ-ONLY (zero database mutations).
   */
  async getPortfolioValuation(
    userId: string,
    simulationId: string,
  ): Promise<SimulationPortfolioValuationResponseDto> {
    const validSessionId = this.validateSessionId(simulationId);

    // 1. Resolve session and enforce ownership
    const session = await this.sessionRepo.findSessionById(validSessionId);
    if (!session || session.userId !== userId) {
      throw new AppError(
        "Simulation session not found",
        ERROR_CODES.NOT_FOUND,
        HTTP_STATUS.NOT_FOUND,
      );
    }

    // 2. Resolve portfolio and positions
    const portfolio = await this.portfolioRepo.findPortfolioBySessionId(validSessionId);
    if (!portfolio) {
      throw new AppError(
        "Simulation portfolio not found for session",
        ERROR_CODES.NOT_FOUND,
        HTTP_STATUS.NOT_FOUND,
      );
    }

    // 3. Resolve authoritative cycle market snapshots for session (scenarioId, currentCycle)
    const snapshots = await this.marketSnapshotRepo.listSnapshotsByScenarioAndCycle(
      session.scenarioId,
      session.currentCycle,
    );

    const snapshotMap = new Map<string, Decimal>();
    for (const snap of snapshots) {
      snapshotMap.set(snap.assetId, toPriceDecimal(snap.price));
    }

    // 4. Calculate position valuations and accumulate portfolio aggregates using Decimal arithmetic
    let sumMarketValue = toCurrencyDecimal(0);
    let sumUnrealizedPnl = toCurrencyDecimal(0);

    const positionsValuation: SimulationPositionValuationDto[] = [];
    const rawPositions = (portfolio as { positions?: RawPositionWithAsset[] }).positions || [];

    for (const pos of rawPositions) {
      const quantity = pos.quantity;
      const averageCostDecimal = toPriceDecimal(pos.averageCost);
      const snapshotPrice = snapshotMap.get(pos.assetId);

      // Enforce snapshot authority: if user holds positive quantity, current cycle snapshot is required
      if (quantity > 0) {
        if (!snapshotPrice) {
          throw new AppError(
            `Missing snapshot price for asset ${pos.asset?.symbol || pos.assetId}`,
            ERROR_CODES.VALIDATION_ERROR,
            HTTP_STATUS.BAD_REQUEST,
          );
        }

        const marketValue = toCurrencyDecimal(snapshotPrice.times(quantity));
        const unrealizedPnl = toCurrencyDecimal(
          snapshotPrice.minus(averageCostDecimal).times(quantity),
        );

        sumMarketValue = sumMarketValue.plus(marketValue);
        sumUnrealizedPnl = sumUnrealizedPnl.plus(unrealizedPnl);

        positionsValuation.push({
          assetId: pos.assetId,
          symbol: pos.asset?.symbol || "",
          name: pos.asset?.name || "",
          quantity,
          averageCost: averageCostDecimal.toFixed(SIMULATION_CONSTANTS.DECIMAL_SCALE_PRICE),
          currentPrice: toPriceDecimal(snapshotPrice).toFixed(
            SIMULATION_CONSTANTS.DECIMAL_SCALE_PRICE,
          ),
          marketValue: marketValue.toFixed(SIMULATION_CONSTANTS.DECIMAL_SCALE_CURRENCY),
          unrealizedPnl: unrealizedPnl.toFixed(SIMULATION_CONSTANTS.DECIMAL_SCALE_CURRENCY),
        });
      } else {
        // Zero-quantity position semantics (AC-003, AC-011): retained row has 0 market value and 0 unrealized PnL
        const currentPriceDecimal = snapshotPrice ? toPriceDecimal(snapshotPrice) : averageCostDecimal;

        positionsValuation.push({
          assetId: pos.assetId,
          symbol: pos.asset?.symbol || "",
          name: pos.asset?.name || "",
          quantity: 0,
          averageCost: averageCostDecimal.toFixed(SIMULATION_CONSTANTS.DECIMAL_SCALE_PRICE),
          currentPrice: currentPriceDecimal.toFixed(SIMULATION_CONSTANTS.DECIMAL_SCALE_PRICE),
          marketValue: "0.0000",
          unrealizedPnl: "0.0000",
        });
      }
    }

    // 5. Total portfolio equity: cashBalance + totalMarketValue
    const cashBalanceDecimal = toCurrencyDecimal(portfolio.cashBalance);
    const totalMarketValue = toCurrencyDecimal(sumMarketValue);
    const totalUnrealizedPnl = toCurrencyDecimal(sumUnrealizedPnl);
    const totalEquity = toCurrencyDecimal(cashBalanceDecimal.plus(totalMarketValue));
    const realizedPnlDecimal = toCurrencyDecimal(portfolio.realizedPnl);

    return {
      sessionId: validSessionId,
      currentCycle: session.currentCycle,
      cashBalance: cashBalanceDecimal.toFixed(SIMULATION_CONSTANTS.DECIMAL_SCALE_CURRENCY),
      marketValue: totalMarketValue.toFixed(SIMULATION_CONSTANTS.DECIMAL_SCALE_CURRENCY),
      realizedPnl: realizedPnlDecimal.toFixed(SIMULATION_CONSTANTS.DECIMAL_SCALE_CURRENCY),
      unrealizedPnl: totalUnrealizedPnl.toFixed(SIMULATION_CONSTANTS.DECIMAL_SCALE_CURRENCY),
      totalEquity: totalEquity.toFixed(SIMULATION_CONSTANTS.DECIMAL_SCALE_CURRENCY),
      positions: positionsValuation,
      simulated: true,
      updatedAt:
        portfolio.updatedAt instanceof Date
          ? portfolio.updatedAt.toISOString()
          : new Date(portfolio.updatedAt).toISOString(),
    };
  }

  /**
   * FR-001, FR-006, FR-007, AC-008, AC-009, AC-010:
   * Returns owner-scoped orders list for a simulation session ordered submittedAt: "desc".
   */
  async getSessionOrders(
    userId: string,
    simulationId: string,
  ): Promise<SimulationOrderResponseDto[]> {
    const validSessionId = this.validateSessionId(simulationId);

    const session = await this.sessionRepo.findSessionById(validSessionId);
    if (!session || session.userId !== userId) {
      throw new AppError(
        "Simulation session not found",
        ERROR_CODES.NOT_FOUND,
        HTTP_STATUS.NOT_FOUND,
      );
    }

    const orders = await this.orderRepo.listOrdersBySessionId(validSessionId);

    return orders.map((order) =>
      toSimulationOrderResponseDto(order as RawSimulationOrderWithDetails),
    );
  }

  /**
   * FR-001, FR-006, FR-007, AC-008, AC-009, AC-010:
   * Returns owner-scoped trades list for a simulation session ordered executedAt: "desc".
   */
  async getSessionTrades(
    userId: string,
    simulationId: string,
  ): Promise<SimulationTradeResponseDto[]> {
    const validSessionId = this.validateSessionId(simulationId);

    const session = await this.sessionRepo.findSessionById(validSessionId);
    if (!session || session.userId !== userId) {
      throw new AppError(
        "Simulation session not found",
        ERROR_CODES.NOT_FOUND,
        HTTP_STATUS.NOT_FOUND,
      );
    }

    const trades = await this.tradeRepo.listTradesBySessionId(validSessionId);

    return trades.map((trade) =>
      toSimulationTradeResponseDto(trade as RawTradeWithDetails),
    );
  }
}
