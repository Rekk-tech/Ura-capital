import { ERROR_CODES, HTTP_STATUS } from "@aura/shared";
import { AppError } from "../../shared/errors/error-envelope.js";
import type {
  ISimulationOrderRepository,
  ISimulationTradeRepository,
  ISimulationPortfolioRepository,
  ISimulationSessionRepository,
  ISimulationAssetRepository,
  ISimulationMarketSnapshotRepository,
} from "./simulation.repository.js";
import type { ITransactionRunner } from "../../infrastructure/database/transaction-runner.js";
import { transactionRunner as defaultTransactionRunner } from "../../infrastructure/database/transaction-runner.js";
import {
  calculateBuyAccounting,
  calculateSellAccounting,
  toCurrencyDecimal,
} from "./simulation-accounting.js";
import {
  assertNoOrderAuthorityFields,
  submitOrderRequestSchema,
  generateOrderFingerprint,
} from "./simulation-order.validation.js";
import {
  toSimulationOrderResponseDto,
  type SimulationOrderResponseDto,
} from "./simulation-order.dto.js";

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class SimulationOrderService {
  constructor(
    private readonly orderRepo: ISimulationOrderRepository,
    private readonly tradeRepo: ISimulationTradeRepository,
    private readonly portfolioRepo: ISimulationPortfolioRepository,
    private readonly sessionRepo: ISimulationSessionRepository,
    private readonly assetRepo: ISimulationAssetRepository,
    private readonly snapshotRepo: ISimulationMarketSnapshotRepository,
    private readonly txRunner: ITransactionRunner = defaultTransactionRunner,
  ) {}

  /**
   * FR-001..FR-014, AC-001..AC-021:
   * Submits and synchronously executes a MARKET order within an active simulation session.
   * Coordinates atomic order, trade, and accounting mutations with minimum row locking.
   * Enforces server-authoritative snapshot pricing, complete idempotency, and anti-overspend/oversell safety.
   */
  async submitMarketOrder(
    userId: string,
    sessionId: string,
    rawPayload: unknown,
  ): Promise<SimulationOrderResponseDto> {
    // 1. Session ID validation
    if (!sessionId || typeof sessionId !== "string" || !uuidRegex.test(sessionId)) {
      throw new AppError(
        "Invalid simulationId parameter. Must be a valid UUID",
        ERROR_CODES.VALIDATION_ERROR,
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    // 2. Strict authority field assertion
    assertNoOrderAuthorityFields(rawPayload);

    // 3. Schema validation
    const parseResult = submitOrderRequestSchema.safeParse(rawPayload);
    if (!parseResult.success) {
      const issue = parseResult.error.issues[0];
      const message = issue ? issue.message : "Validation failed";
      throw new AppError(message, ERROR_CODES.VALIDATION_ERROR, HTTP_STATUS.BAD_REQUEST);
    }

    const { side, type, assetSymbol, quantity, idempotencyKey } = parseResult.data;

    // 4. Canonical request fingerprint
    const requestFingerprint = generateOrderFingerprint({
      side,
      type,
      assetSymbol,
      quantity,
    });

    // 5. Fast pre-flight idempotency lookup
    const existingOrder = await this.orderRepo.findOrderByUserSessionIdempotencyKey(
      userId,
      sessionId,
      idempotencyKey,
    );

    if (existingOrder) {
      if (existingOrder.requestFingerprint !== requestFingerprint) {
        throw new AppError(
          "Idempotency key has already been used with a different request payload",
          ERROR_CODES.IDEMPOTENCY_CONFLICT,
          HTTP_STATUS.CONFLICT,
        );
      }
      return toSimulationOrderResponseDto(existingOrder, assetSymbol, true);
    }

    // 6. Fast pre-flight validations prior to opening database transaction
    const preSession = await this.sessionRepo.findSessionById(sessionId);
    if (!preSession || preSession.userId !== userId) {
      throw new AppError(
        "Simulation session not found",
        ERROR_CODES.NOT_FOUND,
        HTTP_STATUS.NOT_FOUND,
      );
    }

    if (preSession.status !== "ACTIVE") {
      throw new AppError(
        `Cannot place orders on simulation session in status: ${preSession.status}`,
        ERROR_CODES.SIMULATION_NOT_ACTIVE,
        HTTP_STATUS.CONFLICT,
      );
    }

    const preAsset = await this.assetRepo.findAssetBySymbol(assetSymbol);
    if (!preAsset || preAsset.status !== "ACTIVE") {
      throw new AppError(
        `Asset '${assetSymbol}' is not available for trading`,
        ERROR_CODES.ASSET_NOT_AVAILABLE,
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    const preSnapshot = await this.snapshotRepo.findSnapshot(
      preSession.scenarioId,
      preSession.currentCycle,
      preAsset.id,
    );
    if (!preSnapshot) {
      throw new AppError(
        `Market snapshot not available for asset '${assetSymbol}' at cycle ${preSession.currentCycle}`,
        ERROR_CODES.ASSET_NOT_AVAILABLE,
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    const prePortfolio = await this.portfolioRepo.findPortfolioBySessionId(sessionId);
    if (!prePortfolio) {
      throw new AppError(
        "Simulation portfolio not found for session",
        ERROR_CODES.NOT_FOUND,
        HTTP_STATUS.NOT_FOUND,
      );
    }

    // 6. Transactional execution with row-level locking
    try {
      return await this.txRunner.run(async (ctx) => {
        // Re-check idempotency inside transaction
        const txExistingOrder =
          await ctx.repositories.simulationOrderRepo.findOrderByUserSessionIdempotencyKey(
            userId,
            sessionId,
            idempotencyKey,
          );

        if (txExistingOrder) {
          if (txExistingOrder.requestFingerprint !== requestFingerprint) {
            throw new AppError(
              "Idempotency key has already been used with a different request payload",
              ERROR_CODES.IDEMPOTENCY_CONFLICT,
              HTTP_STATUS.CONFLICT,
            );
          }
          return toSimulationOrderResponseDto(txExistingOrder, assetSymbol, true);
        }

        // Validate session ownership and active state
        const session = await ctx.repositories.simulationSessionRepo.findSessionById(sessionId);
        if (!session || session.userId !== userId) {
          throw new AppError(
            "Simulation session not found",
            ERROR_CODES.NOT_FOUND,
            HTTP_STATUS.NOT_FOUND,
          );
        }

        if (session.status !== "ACTIVE") {
          throw new AppError(
            `Cannot place orders on simulation session in status: ${session.status}`,
            ERROR_CODES.SIMULATION_NOT_ACTIVE,
            HTTP_STATUS.CONFLICT,
          );
        }

        // Validate asset availability
        const asset = await ctx.repositories.simulationAssetRepo.findAssetBySymbol(assetSymbol);
        if (!asset || asset.status !== "ACTIVE") {
          throw new AppError(
            `Asset '${assetSymbol}' is not available for trading`,
            ERROR_CODES.ASSET_NOT_AVAILABLE,
            HTTP_STATUS.BAD_REQUEST,
          );
        }

        // Validate market snapshot execution price authority
        const snapshot = await ctx.repositories.simulationSnapshotRepo.findSnapshot(
          session.scenarioId,
          session.currentCycle,
          asset.id,
        );

        if (!snapshot) {
          throw new AppError(
            `Market snapshot not available for asset '${assetSymbol}' at cycle ${session.currentCycle}`,
            ERROR_CODES.ASSET_NOT_AVAILABLE,
            HTTP_STATUS.BAD_REQUEST,
          );
        }

        const executionPrice = snapshot.price;

        // Minimum locking order: 1. Portfolio FOR UPDATE, 2. Position FOR UPDATE
        const portfolio =
          await ctx.repositories.simulationPortfolioRepo.findPortfolioBySessionIdForUpdate(
            sessionId,
          );

        if (!portfolio) {
          throw new AppError(
            "Simulation portfolio not found for session",
            ERROR_CODES.NOT_FOUND,
            HTTP_STATUS.NOT_FOUND,
          );
        }

        const position = await ctx.repositories.simulationPortfolioRepo.findPositionForUpdate(
          portfolio.id,
          asset.id,
        );

        const currentQuantity = position ? position.quantity : 0;
        const currentAverageCost = position ? position.averageCost : 0;
        const now = new Date();

        if (side === "BUY") {
          let buyCalc;
          try {
            buyCalc = calculateBuyAccounting({
              currentCash: portfolio.cashBalance,
              currentQuantity,
              currentAverageCost,
              buyQuantity: quantity,
              executionPrice,
            });
          } catch (err: unknown) {
            if (err instanceof AppError && err.statusCode === HTTP_STATUS.CONFLICT) {
              throw new AppError(
                err.message,
                ERROR_CODES.INSUFFICIENT_CASH,
                HTTP_STATUS.CONFLICT,
                err.details,
              );
            }
            throw err;
          }

          // Atomically update portfolio cash
          await ctx.repositories.simulationPortfolioRepo.updateCashBalance(
            portfolio.id,
            buyCalc.newCashBalance,
          );

          // Atomically upsert position
          await ctx.repositories.simulationPortfolioRepo.upsertPosition(
            portfolio.id,
            asset.id,
            buyCalc.newQuantity,
            buyCalc.newAverageCost,
          );

          // Create order record
          const order = await ctx.repositories.simulationOrderRepo.createOrder({
            sessionId,
            userId,
            assetId: asset.id,
            side: "BUY",
            type: "MARKET",
            quantity,
            status: "FILLED",
            idempotencyKey,
            requestFingerprint,
            executionPrice,
            executedQuantity: quantity,
            filledAt: now,
          });

          // Create trade execution record
          const trade = await ctx.repositories.simulationTradeRepo.createTrade({
            orderId: order.id,
            sessionId,
            assetId: asset.id,
            side: "BUY",
            quantity,
            executionPrice,
            notional: buyCalc.buyNotional,
            realizedPnl: toCurrencyDecimal(0),
            executedAt: now,
          });

          return toSimulationOrderResponseDto(
            {
              ...order,
              asset,
              trade,
            },
            assetSymbol,
            false,
          );
        } else {
          // SELL execution
          if (quantity > currentQuantity) {
            throw new AppError(
              `Insufficient position quantity to sell: requested ${quantity}, owned ${currentQuantity}`,
              ERROR_CODES.INSUFFICIENT_POSITION,
              HTTP_STATUS.CONFLICT,
              {
                requestedQuantity: quantity,
                availableQuantity: currentQuantity,
              },
            );
          }

          const sellCalc = calculateSellAccounting({
            currentCash: portfolio.cashBalance,
            currentQuantity,
            currentAverageCost,
            sellQuantity: quantity,
            currentRealizedPnl: portfolio.realizedPnl,
            executionPrice,
          });

          // Atomically update portfolio cash and cumulative realized PnL
          await ctx.repositories.simulationPortfolioRepo.updatePortfolioAccounting(portfolio.id, {
            cashBalance: sellCalc.newCashBalance,
            realizedPnl: sellCalc.newPortfolioRealizedPnl,
          });

          // Atomically upsert position (preserves row with quantity 0 and cost basis if fully sold)
          await ctx.repositories.simulationPortfolioRepo.upsertPosition(
            portfolio.id,
            asset.id,
            sellCalc.newQuantity,
            sellCalc.remainingAverageCost,
          );

          // Create order record
          const order = await ctx.repositories.simulationOrderRepo.createOrder({
            sessionId,
            userId,
            assetId: asset.id,
            side: "SELL",
            type: "MARKET",
            quantity,
            status: "FILLED",
            idempotencyKey,
            requestFingerprint,
            executionPrice,
            executedQuantity: quantity,
            filledAt: now,
          });

          // Create trade execution record
          const trade = await ctx.repositories.simulationTradeRepo.createTrade({
            orderId: order.id,
            sessionId,
            assetId: asset.id,
            side: "SELL",
            quantity,
            executionPrice,
            notional: sellCalc.sellNotional,
            realizedPnl: sellCalc.tradeRealizedPnl,
            executedAt: now,
          });

          return toSimulationOrderResponseDto(
            {
              ...order,
              asset,
              trade,
            },
            assetSymbol,
            false,
          );
        }
      });
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      const message = String(err);
      if (
        code === "P2002" ||
        code === ERROR_CODES.CONFLICT ||
        message.includes("simulation_orders_user_id_session_id_idempotency_key_key") ||
        message.includes("unique constraint") ||
        message.includes("already exists")
      ) {
        let winningOrder = await this.orderRepo.findOrderByUserSessionIdempotencyKey(
          userId,
          sessionId,
          idempotencyKey,
        );
        let retries = 0;
        while (!winningOrder && retries < 3) {
          retries++;
          await new Promise((resolve) => setTimeout(resolve, 50 * retries));
          winningOrder = await this.orderRepo.findOrderByUserSessionIdempotencyKey(
            userId,
            sessionId,
            idempotencyKey,
          );
        }
        if (winningOrder) {
          if (winningOrder.requestFingerprint !== requestFingerprint) {
            throw new AppError(
              "Idempotency key has already been used with a different request payload",
              ERROR_CODES.IDEMPOTENCY_CONFLICT,
              HTTP_STATUS.CONFLICT,
            );
          }
          return toSimulationOrderResponseDto(winningOrder, assetSymbol, true);
        }
      }
      throw err;
    }
  }

  /**
   * Helper to retrieve trade execution details for an order.
   */
  async getTradeByOrderId(orderId: string) {
    return this.tradeRepo.findTradeByOrderId(orderId);
  }
}
