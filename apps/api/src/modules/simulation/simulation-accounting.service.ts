import { AppError } from "../../shared/errors/error-envelope.js";
import { ERROR_CODES, HTTP_STATUS } from "@aura/shared";
import type {
  ISimulationPortfolioRepository,
  ISimulationSessionRepository,
} from "./simulation.repository.js";
import type { ITransactionRunner } from "../../infrastructure/database/transaction-runner.js";
import { transactionRunner as defaultTransactionRunner } from "../../infrastructure/database/transaction-runner.js";
import {
  SIMULATION_CONSTANTS,
  type SimulationPortfolio,
  type SimulationPosition,
  type Decimal,
} from "./simulation.types.js";
import {
  calculateBuyAccounting,
  calculateSellAccounting,
  calculateValuationAccounting,
  reconstructPortfolioStateFromTrades,
  toCurrencyDecimal,
  toPriceDecimal,
  validateDecimalInput,
  validateQuantityInput,
  type BuyAccountingResult,
  type SellAccountingResult,
  type ValuationAccountingResult,
  type ReconstructedTrade,
  DECIMAL_SCALE_CURRENCY,
  DECIMAL_SCALE_PRICE,
} from "./simulation-accounting.js";

export interface SimulationPortfolioWithPositions extends SimulationPortfolio {
  positions: SimulationPosition[];
}

export class SimulationAccountingService {
  constructor(
    private readonly portfolioRepo: ISimulationPortfolioRepository,
    private readonly sessionRepo: ISimulationSessionRepository,
    private readonly txRunner: ITransactionRunner = defaultTransactionRunner,
  ) {}

  /**
   * FR-001, FR-003, AC-002:
   * Initializes a new SimulationPortfolio linked to exactly one SimulationSession.
   * Enforces non-negative starting cash (canonical default 100,000.0000 USD) and 0 initial positions.
   * Concurrency is guarded by PostgreSQL unique constraint on sessionId.
   */
  async initializePortfolio(
    sessionId: string,
    startingCashInput?: Decimal | string | number,
  ): Promise<SimulationPortfolio> {
    if (!sessionId || typeof sessionId !== "string") {
      throw new AppError(
        "sessionId is required",
        ERROR_CODES.VALIDATION_ERROR,
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    const session = await this.sessionRepo.findSessionById(sessionId);
    if (!session) {
      throw new AppError(
        "Simulation session not found",
        ERROR_CODES.NOT_FOUND,
        HTTP_STATUS.NOT_FOUND,
      );
    }

    const startingCash = startingCashInput !== undefined
      ? validateDecimalInput(startingCashInput, "startingCash", {
          allowNegative: false,
          allowZero: false,
          maxScale: DECIMAL_SCALE_CURRENCY,
        })
      : toCurrencyDecimal(SIMULATION_CONSTANTS.STARTING_CASH_DEFAULT);

    const existingPortfolio = await this.portfolioRepo.findPortfolioBySessionId(sessionId);
    if (existingPortfolio) {
      throw new AppError(
        "Portfolio already exists for this simulation session",
        ERROR_CODES.CONFLICT,
        HTTP_STATUS.CONFLICT,
      );
    }

    try {
      return await this.txRunner.run(async (ctx) => {
        return ctx.repositories.simulationPortfolioRepo.createPortfolio({
          sessionId,
          cashBalance: startingCash,
          realizedPnl: SIMULATION_CONSTANTS.DEFAULT_REALIZED_PNL,
        });
      });
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      const message = String(err);
      if (
        code === "P2002" ||
        message.includes("simulation_portfolios_session_id_key") ||
        message.includes("unique constraint")
      ) {
        throw new AppError(
          "Portfolio already exists for this simulation session",
          ERROR_CODES.CONFLICT,
          HTTP_STATUS.CONFLICT,
        );
      }
      throw err;
    }
  }

  /**
   * FR-001, FR-003, FR-004, FR-005, FR-006, FR-008, AC-001, AC-002, AC-003, AC-004, AC-009, AC-017:
   * Applies Buy accounting atomically inside a TransactionRunner boundary:
   * 1. Validates session status and asset existence.
   * 2. Calculates new cash balance, new quantity, and new weighted-average cost.
   * 3. Atomically updates cash balance and upserts position.
   * 4. Guarantees rollback on failure.
   */
  async applyBuyAccounting(params: {
    sessionId: string;
    assetId: string;
    quantity: number;
    executionPrice: Decimal | string | number;
  }): Promise<BuyAccountingResult & { portfolio: SimulationPortfolio; position: SimulationPosition }> {
    const { sessionId, assetId, quantity, executionPrice } = params;

    const validatedQty = validateQuantityInput(quantity, "quantity", { allowZero: false });
    const validatedPrice = validateDecimalInput(executionPrice, "executionPrice", {
      allowNegative: false,
      allowZero: false,
      maxScale: DECIMAL_SCALE_PRICE,
    });

    return this.txRunner.run(async (ctx) => {
      // 1. Resolve session
      const session = await ctx.repositories.simulationSessionRepo.findSessionById(sessionId);
      if (!session) {
        throw new AppError(
          "Simulation session not found",
          ERROR_CODES.NOT_FOUND,
          HTTP_STATUS.NOT_FOUND,
        );
      }

      if (session.status !== "ACTIVE") {
        throw new AppError(
          `Cannot execute accounting on session in status: ${session.status}`,
          ERROR_CODES.CONFLICT,
          HTTP_STATUS.CONFLICT,
        );
      }

      // 2. Resolve asset
      const asset = await ctx.repositories.simulationAssetRepo.findAssetById(assetId);
      if (!asset) {
        throw new AppError(
          "Simulation asset not found",
          ERROR_CODES.NOT_FOUND,
          HTTP_STATUS.NOT_FOUND,
        );
      }

      // 3. Resolve portfolio
      const portfolio = await ctx.repositories.simulationPortfolioRepo.findPortfolioBySessionId(sessionId);
      if (!portfolio) {
        throw new AppError(
          "Simulation portfolio not found for session",
          ERROR_CODES.NOT_FOUND,
          HTTP_STATUS.NOT_FOUND,
        );
      }

      // 4. Resolve existing position if any
      const existingPosition = await ctx.repositories.simulationPortfolioRepo.findPosition(
        portfolio.id,
        assetId,
      );

      const currentQuantity = existingPosition ? existingPosition.quantity : 0;
      const currentAverageCost = existingPosition ? existingPosition.averageCost : 0;

      // 5. Calculate canonical buy accounting
      const buyResult = calculateBuyAccounting({
        currentCash: portfolio.cashBalance,
        currentQuantity,
        currentAverageCost,
        buyQuantity: validatedQty,
        executionPrice: validatedPrice,
      });

      // 6. Atomically persist portfolio cash and position
      const updatedPortfolio = await ctx.repositories.simulationPortfolioRepo.updateCashBalance(
        portfolio.id,
        buyResult.newCashBalance,
      );

      const updatedPosition = await ctx.repositories.simulationPortfolioRepo.upsertPosition(
        portfolio.id,
        assetId,
        buyResult.newQuantity,
        buyResult.newAverageCost,
      );

      return {
        ...buyResult,
        portfolio: updatedPortfolio,
        position: updatedPosition,
      };
    });
  }

  /**
   * FR-001, FR-003, FR-004, FR-005, FR-006, FR-007, AC-001, AC-002, AC-003, AC-005, AC-010, AC-017:
   * Applies Sell accounting atomically inside a TransactionRunner boundary:
   * 1. Validates session status, asset, and existing position quantity (rejection of oversell).
   * 2. Calculates sell notional, realized PnL, new cash balance, new quantity, and new portfolio cumulative realized PnL.
   * 3. Average cost remains unchanged for remaining shares.
   * 4. Atomically updates cash balance, realized PnL, and upserts position (retaining zero row if quantity reaches 0).
   * 5. Guarantees rollback on failure.
   */
  async applySellAccounting(params: {
    sessionId: string;
    assetId: string;
    quantity: number;
    executionPrice: Decimal | string | number;
  }): Promise<SellAccountingResult & { portfolio: SimulationPortfolio; position: SimulationPosition }> {
    const { sessionId, assetId, quantity, executionPrice } = params;

    const validatedQty = validateQuantityInput(quantity, "quantity", { allowZero: false });
    const validatedPrice = validateDecimalInput(executionPrice, "executionPrice", {
      allowNegative: false,
      allowZero: false,
      maxScale: DECIMAL_SCALE_PRICE,
    });

    return this.txRunner.run(async (ctx) => {
      // 1. Resolve session
      const session = await ctx.repositories.simulationSessionRepo.findSessionById(sessionId);
      if (!session) {
        throw new AppError(
          "Simulation session not found",
          ERROR_CODES.NOT_FOUND,
          HTTP_STATUS.NOT_FOUND,
        );
      }

      if (session.status !== "ACTIVE") {
        throw new AppError(
          `Cannot execute accounting on session in status: ${session.status}`,
          ERROR_CODES.CONFLICT,
          HTTP_STATUS.CONFLICT,
        );
      }

      // 2. Resolve asset
      const asset = await ctx.repositories.simulationAssetRepo.findAssetById(assetId);
      if (!asset) {
        throw new AppError(
          "Simulation asset not found",
          ERROR_CODES.NOT_FOUND,
          HTTP_STATUS.NOT_FOUND,
        );
      }

      // 3. Resolve portfolio
      const portfolio = await ctx.repositories.simulationPortfolioRepo.findPortfolioBySessionId(sessionId);
      if (!portfolio) {
        throw new AppError(
          "Simulation portfolio not found for session",
          ERROR_CODES.NOT_FOUND,
          HTTP_STATUS.NOT_FOUND,
        );
      }

      // 4. Resolve existing position
      const existingPosition = await ctx.repositories.simulationPortfolioRepo.findPosition(
        portfolio.id,
        assetId,
      );

      if (!existingPosition || existingPosition.quantity < validatedQty) {
        throw new AppError(
          "Insufficient position quantity for sale",
          ERROR_CODES.CONFLICT,
          HTTP_STATUS.CONFLICT,
          {
            requestedQuantity: validatedQty,
            availableQuantity: existingPosition ? existingPosition.quantity : 0,
          },
        );
      }

      // 5. Calculate canonical sell accounting
      const sellResult = calculateSellAccounting({
        currentCash: portfolio.cashBalance,
        currentQuantity: existingPosition.quantity,
        currentAverageCost: existingPosition.averageCost,
        currentRealizedPnl: portfolio.realizedPnl,
        sellQuantity: validatedQty,
        executionPrice: validatedPrice,
      });

      // 6. Atomically persist portfolio cash & realized PnL and position
      const updatedPortfolio = await ctx.repositories.simulationPortfolioRepo.updatePortfolioAccounting(
        portfolio.id,
        {
          cashBalance: sellResult.newCashBalance,
          realizedPnl: sellResult.newPortfolioRealizedPnl,
        },
      );

      // Retain zero row if quantity is 0, maintaining last average cost
      const updatedPosition = await ctx.repositories.simulationPortfolioRepo.upsertPosition(
        portfolio.id,
        assetId,
        sellResult.newQuantity,
        sellResult.remainingAverageCost,
      );

      return {
        ...sellResult,
        portfolio: updatedPortfolio,
        position: updatedPosition,
      };
    });
  }

  /**
   * Retrieves operational current state of portfolio and all positions for a session.
   */
  async getPortfolioState(sessionId: string): Promise<SimulationPortfolioWithPositions> {
    const portfolio = await this.portfolioRepo.findPortfolioBySessionId(sessionId);
    if (!portfolio) {
      throw new AppError(
        "Simulation portfolio not found for session",
        ERROR_CODES.NOT_FOUND,
        HTTP_STATUS.NOT_FOUND,
      );
    }

    const positions = await this.portfolioRepo.listPositions(portfolio.id);
    return {
      ...portfolio,
      positions,
    };
  }

  /**
   * FR-004, AC-006, AC-007, AC-008:
   * Internal helper to compute server-authoritative valuation, unrealized PnL, and equity.
   */
  async calculatePortfolioValuation(
    sessionId: string,
    assetPrices: Map<string, Decimal | string | number>,
  ): Promise<ValuationAccountingResult> {
    const portfolioState = await this.getPortfolioState(sessionId);

    const positionsWithPrices = portfolioState.positions.map((pos) => {
      const price = assetPrices.get(pos.assetId);
      if (price === undefined) {
        throw new AppError(
          `Missing snapshot price for asset ${pos.assetId}`,
          ERROR_CODES.VALIDATION_ERROR,
          HTTP_STATUS.BAD_REQUEST,
        );
      }
      return {
        assetId: pos.assetId,
        quantity: pos.quantity,
        averageCost: pos.averageCost,
        snapshotPrice: price,
      };
    });

    return calculateValuationAccounting({
      cashBalance: portfolioState.cashBalance,
      positions: positionsWithPrices,
    });
  }

  /**
   * FR-010, AC-015:
   * Reconciles materialized portfolio and position state against trade history.
   * Verifies that materialized state exactly matches the state reconstructed from trades.
   */
  async reconcilePortfolio(params: {
    sessionId: string;
    trades: ReconstructedTrade[];
    startingCash?: Decimal | string | number;
  }): Promise<{
    isReconciled: boolean;
    materialized: {
      cashBalance: string;
      realizedPnl: string;
      positions: Record<string, { quantity: number; averageCost: string }>;
    };
    reconstructed: {
      cashBalance: string;
      realizedPnl: string;
      positions: Record<string, { quantity: number; averageCost: string }>;
    };
    discrepancies: string[];
  }> {
    const { sessionId, trades, startingCash } = params;

    const portfolioState = await this.getPortfolioState(sessionId);
    const resolvedStartingCash = startingCash !== undefined
      ? startingCash
      : SIMULATION_CONSTANTS.STARTING_CASH_DEFAULT;

    const reconstructed = reconstructPortfolioStateFromTrades({
      startingCash: resolvedStartingCash,
      trades,
    });

    const discrepancies: string[] = [];

    // Check cash balance
    const matCash = toCurrencyDecimal(portfolioState.cashBalance).toFixed(DECIMAL_SCALE_CURRENCY);
    const recCash = reconstructed.cashBalance.toFixed(DECIMAL_SCALE_CURRENCY);
    if (matCash !== recCash) {
      discrepancies.push(`Cash mismatch: materialized=${matCash}, reconstructed=${recCash}`);
    }

    // Check realized PnL
    const matPnl = toCurrencyDecimal(portfolioState.realizedPnl).toFixed(DECIMAL_SCALE_CURRENCY);
    const recPnl = reconstructed.realizedPnl.toFixed(DECIMAL_SCALE_CURRENCY);
    if (matPnl !== recPnl) {
      discrepancies.push(`Realized PnL mismatch: materialized=${matPnl}, reconstructed=${recPnl}`);
    }

    // Check positions
    const matPositions: Record<string, { quantity: number; averageCost: string }> = {};
    for (const pos of portfolioState.positions) {
      matPositions[pos.assetId] = {
        quantity: pos.quantity,
        averageCost: toPriceDecimal(pos.averageCost).toFixed(DECIMAL_SCALE_PRICE),
      };
    }

    const recPositions: Record<string, { quantity: number; averageCost: string }> = {};
    for (const [assetId, pos] of Object.entries(reconstructed.positions)) {
      recPositions[assetId] = {
        quantity: pos.quantity,
        averageCost: toPriceDecimal(pos.averageCost).toFixed(DECIMAL_SCALE_PRICE),
      };
    }

    // Compare all assets in reconstructed positions
    for (const [assetId, rPos] of Object.entries(recPositions)) {
      const mPos = matPositions[assetId];
      if (!mPos) {
        if (rPos.quantity !== 0) {
          discrepancies.push(`Missing materialized position for asset ${assetId}`);
        }
      } else {
        if (mPos.quantity !== rPos.quantity) {
          discrepancies.push(
            `Quantity mismatch for asset ${assetId}: materialized=${mPos.quantity}, reconstructed=${rPos.quantity}`,
          );
        }
        if (rPos.quantity > 0 && mPos.averageCost !== rPos.averageCost) {
          discrepancies.push(
            `Average cost mismatch for asset ${assetId}: materialized=${mPos.averageCost}, reconstructed=${rPos.averageCost}`,
          );
        }
      }
    }

    // Also check any materialized positions not in reconstructed
    for (const [assetId, mPos] of Object.entries(matPositions)) {
      if (!recPositions[assetId] && mPos.quantity !== 0) {
        discrepancies.push(`Unexpected materialized position for asset ${assetId} with quantity ${mPos.quantity}`);
      }
    }

    return {
      isReconciled: discrepancies.length === 0,
      materialized: {
        cashBalance: matCash,
        realizedPnl: matPnl,
        positions: matPositions,
      },
      reconstructed: {
        cashBalance: recCash,
        realizedPnl: recPnl,
        positions: recPositions,
      },
      discrepancies,
    };
  }
}
