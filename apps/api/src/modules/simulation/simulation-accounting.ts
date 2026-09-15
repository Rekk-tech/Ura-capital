import { Prisma } from "@prisma/client";
import { AppError } from "../../shared/errors/error-envelope.js";
import { ERROR_CODES, HTTP_STATUS } from "@aura/shared";
import { SIMULATION_CONSTANTS } from "./simulation.types.js";

export const DECIMAL_SCALE_CURRENCY = SIMULATION_CONSTANTS.DECIMAL_SCALE_CURRENCY; // 4
export const DECIMAL_SCALE_PRICE = SIMULATION_CONSTANTS.DECIMAL_SCALE_PRICE; // 6
const MAX_NUMERIC_PRECISION = 20;
const MAX_POSTGRES_INT = 2147483647;

/**
 * Normalizes negative zero values ("-0", "-0.0", etc.) to canonical zero.
 */
function normalizeNegativeZero(str: string): string {
  if (/^-[0.]*0+$/.test(str.trim()) || str.trim() === "-0") {
    return "0";
  }
  return str;
}

/**
 * Validates and converts a monetary input into a safe Prisma.Decimal.
 * Protects against:
 * - NaN, Infinity, -Infinity
 * - Scientific notation strings ("1e5", "1.2E-3")
 * - Precision overflow (> 20 digits)
 * - Scale overflow (> maxAllowedScale)
 * - Negative values when disallowed
 */
export function validateDecimalInput(
  raw: unknown,
  fieldName: string,
  options: {
    allowNegative?: boolean;
    allowZero?: boolean;
    maxScale?: number;
    maxIntegerDigits?: number;
  } = {},
): Prisma.Decimal {
  const {
    allowNegative = false,
    allowZero = true,
    maxScale = DECIMAL_SCALE_PRICE,
    maxIntegerDigits = MAX_NUMERIC_PRECISION - maxScale,
  } = options;

  if (raw === null || raw === undefined) {
    throw new AppError(
      `${fieldName} is required`,
      ERROR_CODES.VALIDATION_ERROR,
      HTTP_STATUS.BAD_REQUEST,
    );
  }

  // Reject scientific notation strings explicitly (AC-013)
  if (typeof raw === "string") {
    if (/[eE]/.test(raw)) {
      throw new AppError(
        `${fieldName} cannot use scientific notation`,
        ERROR_CODES.VALIDATION_ERROR,
        HTTP_STATUS.BAD_REQUEST,
      );
    }
  }

  // Reject JS floating point NaN / Infinity
  if (typeof raw === "number") {
    if (Number.isNaN(raw) || !Number.isFinite(raw)) {
      throw new AppError(
        `${fieldName} must be a valid finite number`,
        ERROR_CODES.VALIDATION_ERROR,
        HTTP_STATUS.BAD_REQUEST,
      );
    }
  }

  let dec: Prisma.Decimal;
  try {
    let strVal: string;
    if (raw instanceof Prisma.Decimal) {
      strVal = raw.toFixed();
    } else {
      strVal = String(raw).trim();
    }

    strVal = normalizeNegativeZero(strVal);

    dec = new Prisma.Decimal(strVal);
  } catch {
    throw new AppError(
      `${fieldName} must be a valid decimal number`,
      ERROR_CODES.VALIDATION_ERROR,
      HTTP_STATUS.BAD_REQUEST,
    );
  }

  if (dec.isNaN() || !dec.isFinite()) {
    throw new AppError(
      `${fieldName} must be a valid finite decimal`,
      ERROR_CODES.VALIDATION_ERROR,
      HTTP_STATUS.BAD_REQUEST,
    );
  }

  // Check scale constraint
  if (maxScale !== undefined && dec.decimalPlaces() > maxScale) {
    throw new AppError(
      `${fieldName} exceeds maximum allowed decimal precision of ${maxScale} places`,
      ERROR_CODES.VALIDATION_ERROR,
      HTTP_STATUS.BAD_REQUEST,
    );
  }

  // Check total precision / integer digits overflow against PostgreSQL NUMERIC(20, scale)
  const integerDigits = dec.trunc().abs().toFixed().length;
  if (integerDigits > maxIntegerDigits) {
    throw new AppError(
      `${fieldName} exceeds maximum supported numerical bounds`,
      ERROR_CODES.VALIDATION_ERROR,
      HTTP_STATUS.BAD_REQUEST,
    );
  }

  if (dec.precision(true) > MAX_NUMERIC_PRECISION) {
    throw new AppError(
      `${fieldName} exceeds maximum precision of ${MAX_NUMERIC_PRECISION} digits`,
      ERROR_CODES.VALIDATION_ERROR,
      HTTP_STATUS.BAD_REQUEST,
    );
  }

  if (!allowNegative && dec.isNegative()) {
    throw new AppError(
      `${fieldName} must not be negative`,
      ERROR_CODES.VALIDATION_ERROR,
      HTTP_STATUS.BAD_REQUEST,
    );
  }

  if (!allowZero && dec.isZero()) {
    throw new AppError(
      `${fieldName} must be strictly greater than zero`,
      ERROR_CODES.VALIDATION_ERROR,
      HTTP_STATUS.BAD_REQUEST,
    );
  }

  return dec;
}

/**
 * Validates a share quantity input.
 * Must be a strictly positive integer within PostgreSQL INTEGER bounds.
 */
export function validateQuantityInput(
  raw: unknown,
  fieldName = "quantity",
  options: { allowZero?: boolean } = {},
): number {
  const { allowZero = false } = options;

  if (raw === null || raw === undefined) {
    throw new AppError(
      `${fieldName} is required`,
      ERROR_CODES.VALIDATION_ERROR,
      HTTP_STATUS.BAD_REQUEST,
    );
  }

  // Reject string representations with scientific notation
  if (typeof raw === "string" && /[eE]/.test(raw)) {
    throw new AppError(
      `${fieldName} cannot use scientific notation`,
      ERROR_CODES.VALIDATION_ERROR,
      HTTP_STATUS.BAD_REQUEST,
    );
  }

  const num = typeof raw === "number" ? raw : Number(raw);

  if (Number.isNaN(num) || !Number.isFinite(num)) {
    throw new AppError(
      `${fieldName} must be a valid integer`,
      ERROR_CODES.VALIDATION_ERROR,
      HTTP_STATUS.BAD_REQUEST,
    );
  }

  if (!Number.isInteger(num)) {
    throw new AppError(
      `${fieldName} must be an integer`,
      ERROR_CODES.VALIDATION_ERROR,
      HTTP_STATUS.BAD_REQUEST,
    );
  }

  if (allowZero ? num < 0 : num <= 0) {
    throw new AppError(
      allowZero
        ? `${fieldName} must be non-negative`
        : `${fieldName} must be strictly positive`,
      ERROR_CODES.VALIDATION_ERROR,
      HTTP_STATUS.BAD_REQUEST,
    );
  }

  if (num > MAX_POSTGRES_INT) {
    throw new AppError(
      `${fieldName} exceeds maximum allowable quantity (${MAX_POSTGRES_INT})`,
      ERROR_CODES.VALIDATION_ERROR,
      HTTP_STATUS.BAD_REQUEST,
    );
  }

  return num;
}

/**
 * Converts value to Currency Decimal with exact scale of 4 (ROUND_HALF_UP).
 */
export function toCurrencyDecimal(val: Prisma.Decimal | string | number): Prisma.Decimal {
  const dec = val instanceof Prisma.Decimal ? val : new Prisma.Decimal(String(val));
  const rounded = dec.toFixed(DECIMAL_SCALE_CURRENCY, Prisma.Decimal.ROUND_HALF_UP);
  const normalized = normalizeNegativeZero(rounded);
  return new Prisma.Decimal(normalized);
}

/**
 * Converts value to Price Decimal with exact scale of 6 (ROUND_HALF_UP).
 */
export function toPriceDecimal(val: Prisma.Decimal | string | number): Prisma.Decimal {
  const dec = val instanceof Prisma.Decimal ? val : new Prisma.Decimal(String(val));
  const rounded = dec.toFixed(DECIMAL_SCALE_PRICE, Prisma.Decimal.ROUND_HALF_UP);
  const normalized = normalizeNegativeZero(rounded);
  return new Prisma.Decimal(normalized);
}

export interface BuyAccountingResult {
  buyNotional: Prisma.Decimal;
  newCashBalance: Prisma.Decimal;
  newQuantity: number;
  newAverageCost: Prisma.Decimal;
}

/**
 * FR-004, FR-006, FR-008, AC-001, AC-004:
 * Canonical Buy Accounting calculation using Decimal operations.
 * Phase 5 fee = 0, slippage = 0.
 *
 * Formula:
 * - notional = executionPrice * quantity
 * - newCashBalance = currentCash - notional (must be >= 0)
 * - newQuantity = currentQuantity + buyQuantity
 * - newAverageCost = (currentQuantity * currentAverageCost + notional) / newQuantity
 */
export function calculateBuyAccounting(params: {
  currentCash: Prisma.Decimal | string | number;
  currentQuantity: number;
  currentAverageCost: Prisma.Decimal | string | number;
  buyQuantity: number;
  executionPrice: Prisma.Decimal | string | number;
}): BuyAccountingResult {
  const currentCash = validateDecimalInput(params.currentCash, "currentCash", {
    allowNegative: false,
    allowZero: true,
    maxScale: DECIMAL_SCALE_CURRENCY,
  });
  const currentQuantity = validateQuantityInput(params.currentQuantity, "currentQuantity", {
    allowZero: true,
  });
  const currentAverageCost = validateDecimalInput(params.currentAverageCost, "currentAverageCost", {
    allowNegative: false,
    allowZero: true,
    maxScale: DECIMAL_SCALE_PRICE,
  });
  const buyQuantity = validateQuantityInput(params.buyQuantity, "buyQuantity", {
    allowZero: false,
  });
  const executionPrice = validateDecimalInput(params.executionPrice, "executionPrice", {
    allowNegative: false,
    allowZero: false,
    maxScale: DECIMAL_SCALE_PRICE,
  });

  // buyNotional = buyQuantity * executionPrice (scaled to 4 currency decimal places)
  const exactNotional = executionPrice.times(buyQuantity);
  const buyNotional = toCurrencyDecimal(exactNotional);

  // newCashBalance = currentCash - buyNotional
  const newCashBalance = toCurrencyDecimal(currentCash.minus(buyNotional));
  if (newCashBalance.isNegative()) {
    throw new AppError(
      "Insufficient cash balance for purchase",
      ERROR_CODES.CONFLICT,
      HTTP_STATUS.CONFLICT,
      {
        requiredCash: buyNotional.toFixed(DECIMAL_SCALE_CURRENCY),
        availableCash: currentCash.toFixed(DECIMAL_SCALE_CURRENCY),
      },
    );
  }

  // newQuantity = currentQuantity + buyQuantity
  const newQuantity = currentQuantity + buyQuantity;
  if (newQuantity > MAX_POSTGRES_INT) {
    throw new AppError(
      "Resulting position quantity exceeds maximum allowable bounds",
      ERROR_CODES.VALIDATION_ERROR,
      HTTP_STATUS.BAD_REQUEST,
    );
  }

  // newAverageCost = (currentQuantity * currentAverageCost + notional) / newQuantity
  let newAverageCost: Prisma.Decimal;
  if (currentQuantity === 0) {
    newAverageCost = toPriceDecimal(executionPrice);
  } else {
    const oldBasis = currentAverageCost.times(currentQuantity);
    const combinedBasis = oldBasis.plus(buyNotional);
    const exactAvgCost = combinedBasis.dividedBy(newQuantity);
    newAverageCost = toPriceDecimal(exactAvgCost);
  }

  return {
    buyNotional,
    newCashBalance,
    newQuantity,
    newAverageCost,
  };
}

export interface SellAccountingResult {
  sellNotional: Prisma.Decimal;
  tradeRealizedPnl: Prisma.Decimal;
  newCashBalance: Prisma.Decimal;
  newQuantity: number;
  newPortfolioRealizedPnl: Prisma.Decimal;
  remainingAverageCost: Prisma.Decimal;
}

/**
 * FR-004, FR-005, FR-007, AC-001, AC-005, AC-010:
 * Canonical Sell Accounting calculation using Decimal operations.
 * Phase 5 fee = 0, slippage = 0.
 *
 * Formula:
 * - sellNotional = executionPrice * quantity
 * - tradeRealizedPnl = (executionPrice - currentAverageCost) * quantity
 * - newCashBalance = currentCash + sellNotional
 * - newQuantity = currentQuantity - sellQuantity (must be >= 0)
 * - newPortfolioRealizedPnl = currentRealizedPnl + tradeRealizedPnl
 * - remainingAverageCost = currentAverageCost (selling does not mutate average cost)
 */
export function calculateSellAccounting(params: {
  currentCash: Prisma.Decimal | string | number;
  currentQuantity: number;
  currentAverageCost: Prisma.Decimal | string | number;
  currentRealizedPnl: Prisma.Decimal | string | number;
  sellQuantity: number;
  executionPrice: Prisma.Decimal | string | number;
}): SellAccountingResult {
  const currentCash = validateDecimalInput(params.currentCash, "currentCash", {
    allowNegative: false,
    allowZero: true,
    maxScale: DECIMAL_SCALE_CURRENCY,
  });
  const currentQuantity = validateQuantityInput(params.currentQuantity, "currentQuantity", {
    allowZero: true,
  });
  const currentAverageCost = validateDecimalInput(params.currentAverageCost, "currentAverageCost", {
    allowNegative: false,
    allowZero: true,
    maxScale: DECIMAL_SCALE_PRICE,
  });
  const currentRealizedPnl = validateDecimalInput(params.currentRealizedPnl, "currentRealizedPnl", {
    allowNegative: true,
    allowZero: true,
    maxScale: DECIMAL_SCALE_CURRENCY,
  });
  const sellQuantity = validateQuantityInput(params.sellQuantity, "sellQuantity", {
    allowZero: false,
  });
  const executionPrice = validateDecimalInput(params.executionPrice, "executionPrice", {
    allowNegative: false,
    allowZero: false,
    maxScale: DECIMAL_SCALE_PRICE,
  });

  // Check oversell invariant
  if (sellQuantity > currentQuantity) {
    throw new AppError(
      "Insufficient position quantity for sale",
      ERROR_CODES.CONFLICT,
      HTTP_STATUS.CONFLICT,
      {
        requestedQuantity: sellQuantity,
        availableQuantity: currentQuantity,
      },
    );
  }

  // sellNotional = sellQuantity * executionPrice (4 decimal places)
  const exactNotional = executionPrice.times(sellQuantity);
  const sellNotional = toCurrencyDecimal(exactNotional);

  // tradeRealizedPnl = (executionPrice - currentAverageCost) * sellQuantity
  const exactTradePnl = executionPrice.minus(currentAverageCost).times(sellQuantity);
  const tradeRealizedPnl = toCurrencyDecimal(exactTradePnl);

  // newCashBalance = currentCash + sellNotional
  const newCashBalance = toCurrencyDecimal(currentCash.plus(sellNotional));

  // newQuantity = currentQuantity - sellQuantity
  const newQuantity = currentQuantity - sellQuantity;

  // newPortfolioRealizedPnl = currentRealizedPnl + tradeRealizedPnl
  const newPortfolioRealizedPnl = toCurrencyDecimal(currentRealizedPnl.plus(tradeRealizedPnl));

  // Remaining average cost is preserved unchanged
  const remainingAverageCost = toPriceDecimal(currentAverageCost);

  return {
    sellNotional,
    tradeRealizedPnl,
    newCashBalance,
    newQuantity,
    newPortfolioRealizedPnl,
    remainingAverageCost,
  };
}

export interface PositionValuation {
  assetId: string;
  quantity: number;
  averageCost: Prisma.Decimal;
  snapshotPrice: Prisma.Decimal;
  marketValue: Prisma.Decimal;
  unrealizedPnl: Prisma.Decimal;
}

export interface ValuationAccountingResult {
  positionsValuation: PositionValuation[];
  totalMarketValue: Prisma.Decimal;
  totalUnrealizedPnl: Prisma.Decimal;
  totalEquity: Prisma.Decimal;
}

/**
 * FR-004, AC-006, AC-007, AC-008:
 * Canonical Current Valuation & Equity calculations using Decimal operations.
 *
 * Formula:
 * - marketValue = quantity * currentSnapshotPrice
 * - unrealizedPnl = (currentSnapshotPrice - averageCost) * quantity
 * - totalMarketValue = sum(marketValue)
 * - totalUnrealizedPnl = sum(unrealizedPnl)
 * - equity = cashBalance + sum(marketValue)
 */
export function calculateValuationAccounting(params: {
  cashBalance: Prisma.Decimal | string | number;
  positions: Array<{
    assetId: string;
    quantity: number;
    averageCost: Prisma.Decimal | string | number;
    snapshotPrice: Prisma.Decimal | string | number;
  }>;
}): ValuationAccountingResult {
  const cashBalance = validateDecimalInput(params.cashBalance, "cashBalance", {
    allowNegative: false,
    allowZero: true,
    maxScale: DECIMAL_SCALE_CURRENCY,
  });

  let sumMarketValue = new Prisma.Decimal(0);
  let sumUnrealizedPnl = new Prisma.Decimal(0);

  const positionsValuation: PositionValuation[] = [];

  for (const pos of params.positions) {
    const quantity = validateQuantityInput(pos.quantity, "quantity", { allowZero: true });
    const averageCost = validateDecimalInput(pos.averageCost, "averageCost", {
      allowNegative: false,
      allowZero: true,
      maxScale: DECIMAL_SCALE_PRICE,
    });
    const snapshotPrice = validateDecimalInput(pos.snapshotPrice, "snapshotPrice", {
      allowNegative: false,
      allowZero: false,
      maxScale: DECIMAL_SCALE_PRICE,
    });

    const marketValue = toCurrencyDecimal(snapshotPrice.times(quantity));
    const unrealizedPnl = toCurrencyDecimal(snapshotPrice.minus(averageCost).times(quantity));

    sumMarketValue = sumMarketValue.plus(marketValue);
    sumUnrealizedPnl = sumUnrealizedPnl.plus(unrealizedPnl);

    positionsValuation.push({
      assetId: pos.assetId,
      quantity,
      averageCost: toPriceDecimal(averageCost),
      snapshotPrice: toPriceDecimal(snapshotPrice),
      marketValue,
      unrealizedPnl,
    });
  }

  const totalMarketValue = toCurrencyDecimal(sumMarketValue);
  const totalUnrealizedPnl = toCurrencyDecimal(sumUnrealizedPnl);
  const totalEquity = toCurrencyDecimal(cashBalance.plus(totalMarketValue));

  return {
    positionsValuation,
    totalMarketValue,
    totalUnrealizedPnl,
    totalEquity,
  };
}

export interface ReconstructedTrade {
  side: "BUY" | "SELL";
  assetId: string;
  quantity: number;
  executionPrice: Prisma.Decimal | string | number;
}

export interface ReconstructedPositionState {
  quantity: number;
  averageCost: Prisma.Decimal;
}

export interface ReconstructedPortfolioState {
  cashBalance: Prisma.Decimal;
  realizedPnl: Prisma.Decimal;
  positions: Record<string, ReconstructedPositionState>;
}

/**
 * FR-010, AC-015:
 * Deterministically reconstructs materialized portfolio and position state from trade history.
 * Used for reconciliation tests and audit verification.
 */
export function reconstructPortfolioStateFromTrades(params: {
  startingCash: Prisma.Decimal | string | number;
  trades: ReconstructedTrade[];
}): ReconstructedPortfolioState {
  let currentCash = toCurrencyDecimal(params.startingCash);
  let currentRealizedPnl = toCurrencyDecimal(0);
  const positions: Record<string, ReconstructedPositionState> = {};

  for (const trade of params.trades) {
    const existing = positions[trade.assetId] || {
      quantity: 0,
      averageCost: toPriceDecimal(0),
    };

    if (trade.side === "BUY") {
      const buyResult = calculateBuyAccounting({
        currentCash,
        currentQuantity: existing.quantity,
        currentAverageCost: existing.averageCost,
        buyQuantity: trade.quantity,
        executionPrice: trade.executionPrice,
      });

      currentCash = buyResult.newCashBalance;
      positions[trade.assetId] = {
        quantity: buyResult.newQuantity,
        averageCost: buyResult.newAverageCost,
      };
    } else if (trade.side === "SELL") {
      const sellResult = calculateSellAccounting({
        currentCash,
        currentQuantity: existing.quantity,
        currentAverageCost: existing.averageCost,
        currentRealizedPnl,
        sellQuantity: trade.quantity,
        executionPrice: trade.executionPrice,
      });

      currentCash = sellResult.newCashBalance;
      currentRealizedPnl = sellResult.newPortfolioRealizedPnl;
      positions[trade.assetId] = {
        quantity: sellResult.newQuantity,
        averageCost: sellResult.remainingAverageCost,
      };
    }
  }

  return {
    cashBalance: currentCash,
    realizedPnl: currentRealizedPnl,
    positions,
  };
}
