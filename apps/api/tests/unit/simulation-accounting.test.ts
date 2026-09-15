import { describe, it, expect, vi, beforeEach } from "vitest";
import { Prisma } from "@prisma/client";
import {
  calculateBuyAccounting,
  calculateSellAccounting,
  calculateValuationAccounting,
  reconstructPortfolioStateFromTrades,
  toCurrencyDecimal,
  toPriceDecimal,
  validateDecimalInput,
  validateQuantityInput,
  DECIMAL_SCALE_CURRENCY,
  DECIMAL_SCALE_PRICE,
} from "../../src/modules/simulation/simulation-accounting.js";
import { SimulationAccountingService } from "../../src/modules/simulation/simulation-accounting.service.js";
import { AppError } from "../../src/shared/errors/error-envelope.js";
import { ERROR_CODES, HTTP_STATUS } from "@aura/shared";
import type { ITransactionRunner, TransactionOptions } from "../../src/infrastructure/database/transaction-runner.js";
import type { TransactionContext } from "../../src/infrastructure/database/transaction-context.js";
import type { IRepositoryContainer } from "../../src/infrastructure/database/repository-factory.js";
import type {
  ISimulationPortfolioRepository,
  ISimulationSessionRepository,
} from "../../src/modules/simulation/simulation.repository.js";

describe("FEAT-034: Portfolio & Position Accounting Foundation", () => {
  describe("1. Monetary Precision & Decimal Utilities (AC-001, AC-012)", () => {
    it("formats currency to exactly 4 decimal places with ROUND_HALF_UP", () => {
      expect(toCurrencyDecimal("100.12344").toFixed(DECIMAL_SCALE_CURRENCY)).toBe("100.1234");
      expect(toCurrencyDecimal("100.12345").toFixed(DECIMAL_SCALE_CURRENCY)).toBe("100.1235");
      expect(toCurrencyDecimal("100.12346").toFixed(DECIMAL_SCALE_CURRENCY)).toBe("100.1235");
      expect(toCurrencyDecimal("100").toFixed(DECIMAL_SCALE_CURRENCY)).toBe("100.0000");
    });

    it("formats price to exactly 6 decimal places with ROUND_HALF_UP", () => {
      expect(toPriceDecimal("150.1234564").toFixed(DECIMAL_SCALE_PRICE)).toBe("150.123456");
      expect(toPriceDecimal("150.1234565").toFixed(DECIMAL_SCALE_PRICE)).toBe("150.123457");
      expect(toPriceDecimal("150.1234566").toFixed(DECIMAL_SCALE_PRICE)).toBe("150.123457");
      expect(toPriceDecimal("150").toFixed(DECIMAL_SCALE_PRICE)).toBe("150.000000");
    });

    it("normalizes negative zero to canonical positive zero (AC-012)", () => {
      const dec1 = toCurrencyDecimal("-0");
      expect(dec1.toFixed(DECIMAL_SCALE_CURRENCY)).toBe("0.0000");
      expect(dec1.isZero()).toBe(true);

      const dec2 = toCurrencyDecimal("-0.0000");
      expect(dec2.toFixed(DECIMAL_SCALE_CURRENCY)).toBe("0.0000");

      const dec3 = toPriceDecimal("-0.000000");
      expect(dec3.toFixed(DECIMAL_SCALE_PRICE)).toBe("0.000000");
    });
  });

  describe("2. Numeric Abuse Protection (AC-011, AC-012, AC-013, AC-014)", () => {
    it("rejects NaN and Infinity (AC-011)", () => {
      expect(() => validateDecimalInput(NaN, "price")).toThrowError(AppError);
      expect(() => validateDecimalInput(Infinity, "price")).toThrowError(AppError);
      expect(() => validateDecimalInput(-Infinity, "price")).toThrowError(AppError);
      expect(() => validateDecimalInput("NaN", "price")).toThrowError(AppError);
      expect(() => validateDecimalInput("Infinity", "price")).toThrowError(AppError);

      expect(() => validateQuantityInput(NaN, "quantity")).toThrowError(AppError);
      expect(() => validateQuantityInput(Infinity, "quantity")).toThrowError(AppError);
    });

    it("rejects scientific notation in public strings (AC-013)", () => {
      expect(() => validateDecimalInput("1e5", "price")).toThrowError(/cannot use scientific notation/);
      expect(() => validateDecimalInput("1.5E-3", "price")).toThrowError(/cannot use scientific notation/);
      expect(() => validateQuantityInput("1e2", "quantity")).toThrowError(/cannot use scientific notation/);
    });

    it("rejects negative and zero values where strictly positive is required", () => {
      expect(() => validateDecimalInput("-10.50", "executionPrice", { allowNegative: false })).toThrowError(
        /must not be negative/,
      );
      expect(() => validateDecimalInput("0", "executionPrice", { allowZero: false })).toThrowError(
        /must be strictly greater than zero/,
      );
      expect(() => validateQuantityInput(0, "buyQuantity", { allowZero: false })).toThrowError(
        /must be strictly positive/,
      );
      expect(() => validateQuantityInput(-5, "buyQuantity", { allowZero: false })).toThrowError(
        /must be strictly positive/,
      );
    });

    it("rejects non-integer quantities", () => {
      expect(() => validateQuantityInput(1.5, "quantity")).toThrowError(/must be an integer/);
      expect(() => validateQuantityInput("2.00001", "quantity")).toThrowError(/must be an integer/);
    });

    it("rejects integer overflow exceeding PostgreSQL 32-bit integer", () => {
      expect(() => validateQuantityInput(2147483648, "quantity")).toThrowError(/exceeds maximum allowable quantity/);
    });

    it("rejects scale overflow exceeding maximum allowed decimal places", () => {
      expect(() =>
        validateDecimalInput("100.1234567", "price", { maxScale: 6 }),
      ).toThrowError(/exceeds maximum allowed decimal precision/);

      expect(() =>
        validateDecimalInput("100.12345", "cash", { maxScale: 4 }),
      ).toThrowError(/exceeds maximum allowed decimal precision/);
    });

    it("rejects precision overflow exceeding PostgreSQL NUMERIC(20, scale) (AC-014)", () => {
      // NUMERIC(20, 6) allows at most 14 integer digits
      expect(() =>
        validateDecimalInput("123456789012345.123456", "price", { maxScale: 6, maxIntegerDigits: 14 }),
      ).toThrowError(/exceeds maximum supported numerical bounds/);
    });
  });

  describe("3. Canonical BUY Accounting (FR-004, FR-006, FR-008, AC-001, AC-004, AC-009)", () => {
    it("calculates initial buy from zero position correctly", () => {
      const result = calculateBuyAccounting({
        currentCash: "100000.0000",
        currentQuantity: 0,
        currentAverageCost: "0.000000",
        buyQuantity: 10,
        executionPrice: "150.250000",
      });

      expect(result.buyNotional.toFixed(4)).toBe("1502.5000");
      expect(result.newCashBalance.toFixed(4)).toBe("98497.5000");
      expect(result.newQuantity).toBe(10);
      expect(result.newAverageCost.toFixed(6)).toBe("150.250000");
    });

    it("calculates multiple BUY weighted average cost correctly (Canonical Spec Example)", () => {
      // Step 1: 10 shares @ 100
      const step1 = calculateBuyAccounting({
        currentCash: "100000.0000",
        currentQuantity: 0,
        currentAverageCost: "0.000000",
        buyQuantity: 10,
        executionPrice: "100.000000",
      });
      expect(step1.newCashBalance.toFixed(4)).toBe("99000.0000");
      expect(step1.newQuantity).toBe(10);
      expect(step1.newAverageCost.toFixed(6)).toBe("100.000000");

      // Step 2: 10 shares @ 120
      const step2 = calculateBuyAccounting({
        currentCash: step1.newCashBalance,
        currentQuantity: step1.newQuantity,
        currentAverageCost: step1.newAverageCost,
        buyQuantity: 10,
        executionPrice: "120.000000",
      });
      // (10 * 100 + 10 * 120) / 20 = 2200 / 20 = 110
      expect(step2.buyNotional.toFixed(4)).toBe("1200.0000");
      expect(step2.newCashBalance.toFixed(4)).toBe("97800.0000");
      expect(step2.newQuantity).toBe(20);
      expect(step2.newAverageCost.toFixed(6)).toBe("110.000000");

      // Step 3: 5 shares @ 150
      const step3 = calculateBuyAccounting({
        currentCash: step2.newCashBalance,
        currentQuantity: step2.newQuantity,
        currentAverageCost: step2.newAverageCost,
        buyQuantity: 5,
        executionPrice: "150.000000",
      });
      // (20 * 110 + 5 * 150) / 25 = (2200 + 750) / 25 = 2950 / 25 = 118
      expect(step3.buyNotional.toFixed(4)).toBe("750.0000");
      expect(step3.newCashBalance.toFixed(4)).toBe("97050.0000");
      expect(step3.newQuantity).toBe(25);
      expect(step3.newAverageCost.toFixed(6)).toBe("118.000000");
    });

    it("rejects buy when cash balance would become negative (AC-009)", () => {
      expect(() =>
        calculateBuyAccounting({
          currentCash: "1000.0000",
          currentQuantity: 0,
          currentAverageCost: "0.000000",
          buyQuantity: 10,
          executionPrice: "100.500000", // notional = 1005.0000 > 1000.0000
        }),
      ).toThrowError(/Insufficient cash balance for purchase/);
    });

    it("excludes fees and slippage from buy average cost basis (AC-004)", () => {
      // Phase 5 fee = 0, slippage = 0
      const result = calculateBuyAccounting({
        currentCash: "50000.0000",
        currentQuantity: 10,
        currentAverageCost: "100.000000",
        buyQuantity: 10,
        executionPrice: "200.000000",
      });
      // Exactly (1000 + 2000) / 20 = 150.000000, zero fee markup
      expect(result.newAverageCost.toFixed(6)).toBe("150.000000");
    });
  });

  describe("4. Canonical SELL Accounting (FR-005, FR-007, AC-005, AC-010)", () => {
    it("calculates partial SELL at profit and preserves remaining average cost (Canonical Example)", () => {
      // Given: 20 shares @ 110 avg cost, cash = 97000, realizedPnl = 0
      const result = calculateSellAccounting({
        currentCash: "97000.0000",
        currentQuantity: 20,
        currentAverageCost: "110.000000",
        currentRealizedPnl: "0.0000",
        sellQuantity: 5,
        executionPrice: "130.000000",
      });

      // notional = 5 * 130 = 650
      expect(result.sellNotional.toFixed(4)).toBe("650.0000");
      // cash = 97000 + 650 = 97650
      expect(result.newCashBalance.toFixed(4)).toBe("97650.0000");
      // remaining = 20 - 5 = 15
      expect(result.newQuantity).toBe(15);
      // realized PnL = (130 - 110) * 5 = 100
      expect(result.tradeRealizedPnl.toFixed(4)).toBe("100.0000");
      expect(result.newPortfolioRealizedPnl.toFixed(4)).toBe("100.0000");
      // average cost of remaining shares must NOT change
      expect(result.remainingAverageCost.toFixed(6)).toBe("110.000000");
    });

    it("calculates partial SELL at loss correctly", () => {
      // Given: 15 shares @ 110, cash = 97650, realizedPnl = 100
      const result = calculateSellAccounting({
        currentCash: "97650.0000",
        currentQuantity: 15,
        currentAverageCost: "110.000000",
        currentRealizedPnl: "100.0000",
        sellQuantity: 5,
        executionPrice: "90.000000",
      });

      // notional = 5 * 90 = 450
      expect(result.sellNotional.toFixed(4)).toBe("450.0000");
      // cash = 97650 + 450 = 98100
      expect(result.newCashBalance.toFixed(4)).toBe("98100.0000");
      expect(result.newQuantity).toBe(10);
      // realized PnL = (90 - 110) * 5 = -100
      expect(result.tradeRealizedPnl.toFixed(4)).toBe("-100.0000");
      // cumulative PnL = 100 + (-100) = 0
      expect(result.newPortfolioRealizedPnl.toFixed(4)).toBe("0.0000");
      expect(result.remainingAverageCost.toFixed(6)).toBe("110.000000");
    });

    it("calculates full SELL (quantity reaches 0) and retains zero row semantics", () => {
      const result = calculateSellAccounting({
        currentCash: "98100.0000",
        currentQuantity: 10,
        currentAverageCost: "110.000000",
        currentRealizedPnl: "0.0000",
        sellQuantity: 10,
        executionPrice: "125.000000",
      });

      expect(result.sellNotional.toFixed(4)).toBe("1250.0000");
      expect(result.newCashBalance.toFixed(4)).toBe("99350.0000");
      expect(result.newQuantity).toBe(0);
      expect(result.tradeRealizedPnl.toFixed(4)).toBe("150.0000");
      expect(result.newPortfolioRealizedPnl.toFixed(4)).toBe("150.0000");
      expect(result.remainingAverageCost.toFixed(6)).toBe("110.000000");
    });

    it("rejects overselling when sellQuantity exceeds owned position (AC-010)", () => {
      expect(() =>
        calculateSellAccounting({
          currentCash: "50000.0000",
          currentQuantity: 10,
          currentAverageCost: "100.000000",
          currentRealizedPnl: "0.0000",
          sellQuantity: 11,
          executionPrice: "150.000000",
        }),
      ).toThrowError(/Insufficient position quantity for sale/);
    });

    it("handles re-buying after full sell cleanly", () => {
      // Position quantity is 0 from previous full sell
      const buyAfterSell = calculateBuyAccounting({
        currentCash: "99350.0000",
        currentQuantity: 0,
        currentAverageCost: "110.000000", // previous average cost preserved
        buyQuantity: 10,
        executionPrice: "200.000000",
      });

      // New average cost must reset completely to execution price (200.000000)
      expect(buyAfterSell.newQuantity).toBe(10);
      expect(buyAfterSell.newAverageCost.toFixed(6)).toBe("200.000000");
      expect(buyAfterSell.newCashBalance.toFixed(4)).toBe("97350.0000");
    });
  });

  describe("5. Current Valuation & Equity Calculations (FR-004, AC-006, AC-007, AC-008)", () => {
    it("computes market value, unrealized PnL, and total equity accurately", () => {
      const valuation = calculateValuationAccounting({
        cashBalance: "50000.0000",
        positions: [
          {
            assetId: "asset-a",
            quantity: 10,
            averageCost: "100.000000",
            snapshotPrice: "120.500000",
          },
          {
            assetId: "asset-b",
            quantity: 5,
            averageCost: "250.000000",
            snapshotPrice: "230.000000",
          },
          {
            assetId: "asset-c",
            quantity: 0, // 0 quantity row
            averageCost: "75.000000",
            snapshotPrice: "90.000000",
          },
        ],
      });

      // Asset A: marketValue = 10 * 120.50 = 1205.0000, unrealized = (120.5 - 100) * 10 = 205.0000
      expect(valuation.positionsValuation[0].marketValue.toFixed(4)).toBe("1205.0000");
      expect(valuation.positionsValuation[0].unrealizedPnl.toFixed(4)).toBe("205.0000");

      // Asset B: marketValue = 5 * 230 = 1150.0000, unrealized = (230 - 250) * 5 = -100.0000
      expect(valuation.positionsValuation[1].marketValue.toFixed(4)).toBe("1150.0000");
      expect(valuation.positionsValuation[1].unrealizedPnl.toFixed(4)).toBe("-100.0000");

      // Asset C: marketValue = 0, unrealized = 0
      expect(valuation.positionsValuation[2].marketValue.toFixed(4)).toBe("0.0000");
      expect(valuation.positionsValuation[2].unrealizedPnl.toFixed(4)).toBe("0.0000");

      // Total Market Value: 1205 + 1150 + 0 = 2355.0000
      expect(valuation.totalMarketValue.toFixed(4)).toBe("2355.0000");

      // Total Unrealized PnL: 205 + (-100) + 0 = 105.0000
      expect(valuation.totalUnrealizedPnl.toFixed(4)).toBe("105.0000");

      // Total Equity: cash (50000) + totalMarketValue (2355) = 52355.0000
      expect(valuation.totalEquity.toFixed(4)).toBe("52355.0000");
    });
  });

  describe("6. Trade Reconciliation Reconstruction (FR-010, AC-015)", () => {
    it("reconstructs portfolio state across a multi-trade lifecycle with exact Decimal matches", () => {
      const trades = [
        { side: "BUY" as const, assetId: "AURA", quantity: 10, executionPrice: "100.000000" },
        { side: "BUY" as const, assetId: "AURA", quantity: 10, executionPrice: "120.000000" },
        { side: "SELL" as const, assetId: "AURA", quantity: 5, executionPrice: "130.000000" },
        { side: "BUY" as const, assetId: "BTC", quantity: 2, executionPrice: "30000.000000" },
        { side: "SELL" as const, assetId: "AURA", quantity: 15, executionPrice: "150.000000" },
        { side: "BUY" as const, assetId: "AURA", quantity: 5, executionPrice: "140.000000" },
      ];

      const reconstructed = reconstructPortfolioStateFromTrades({
        startingCash: "100000.0000",
        trades,
      });

      // Cash flow breakdown:
      // Start: 100,000.0000
      // 1. Buy 10 AURA @ 100 -> -1000 => 99,000.0000
      // 2. Buy 10 AURA @ 120 -> -1200 => 97,800.0000 (avgCost = 110)
      // 3. Sell 5 AURA @ 130 -> +650 => 98,450.0000 (realizedPnl = +100, remaining 15 @ 110)
      // 4. Buy 2 BTC @ 30000 -> -60,000 => 38,450.0000 (2 BTC @ 30000)
      // 5. Sell 15 AURA @ 150 -> +2250 => 40,700.0000 (realizedPnl = 100 + (150-110)*15 = 100 + 600 = 700, remaining 0 @ 110)
      // 6. Buy 5 AURA @ 140 -> -700 => 40,000.0000 (5 AURA @ 140)

      expect(reconstructed.cashBalance.toFixed(4)).toBe("40000.0000");
      expect(reconstructed.realizedPnl.toFixed(4)).toBe("700.0000");

      expect(reconstructed.positions["AURA"].quantity).toBe(5);
      expect(reconstructed.positions["AURA"].averageCost.toFixed(6)).toBe("140.000000");

      expect(reconstructed.positions["BTC"].quantity).toBe(2);
      expect(reconstructed.positions["BTC"].averageCost.toFixed(6)).toBe("30000.000000");
    });
  });

  describe("7. SimulationAccountingService Transactional Unit Flow", () => {
    let mockPortfolioRepo: Record<string, ReturnType<typeof vi.fn>>;
    let mockSessionRepo: Record<string, ReturnType<typeof vi.fn>>;
    let mockTxRunner: ITransactionRunner;
    let service: SimulationAccountingService;

    beforeEach(() => {
      mockPortfolioRepo = {
        createPortfolio: vi.fn(),
        findPortfolioBySessionId: vi.fn(),
        findPortfolioById: vi.fn(),
        updateCashBalance: vi.fn(),
        updateRealizedPnl: vi.fn(),
        updatePortfolioAccounting: vi.fn(),
        createPosition: vi.fn(),
        findPosition: vi.fn(),
        listPositions: vi.fn(),
        upsertPosition: vi.fn(),
        deletePosition: vi.fn(),
      };

      mockSessionRepo = {
        findSessionById: vi.fn(),
      };

      const mockAssetRepo = {
        findAssetById: vi.fn(),
      };

      mockTxRunner = {
        run: vi.fn(async <T>(operation: (ctx: TransactionContext) => Promise<T>, _options?: TransactionOptions): Promise<T> => {
          const fakeCtx: TransactionContext = {
            id: "fake-tx-1",
            tx: {} as unknown as TransactionContext["tx"],
            repositories: {
              simulationPortfolioRepo: mockPortfolioRepo,
              simulationSessionRepo: mockSessionRepo,
              simulationAssetRepo: mockAssetRepo,
            } as unknown as IRepositoryContainer,
            depth: 1,
            isCompleted: false,
          };
          return operation(fakeCtx);
        }),
        getActiveContext: vi.fn(),
        isInTransaction: vi.fn().mockReturnValue(false),
      };

      service = new SimulationAccountingService(
        mockPortfolioRepo as unknown as ISimulationPortfolioRepository,
        mockSessionRepo as unknown as ISimulationSessionRepository,
        mockTxRunner,
      );
    });

    it("initializes portfolio with canonical 100,000.0000 starting cash (AC-002)", () => {
      mockSessionRepo.findSessionById.mockResolvedValue({ id: "session-1" });
      mockPortfolioRepo.findPortfolioBySessionId.mockResolvedValue(null);
      mockPortfolioRepo.createPortfolio.mockResolvedValue({
        id: "portfolio-1",
        sessionId: "session-1",
        cashBalance: new Prisma.Decimal("100000.0000"),
        realizedPnl: new Prisma.Decimal("0.0000"),
      });

      return service.initializePortfolio("session-1").then((portfolio) => {
        expect(mockPortfolioRepo.createPortfolio).toHaveBeenCalledWith({
          sessionId: "session-1",
          cashBalance: new Prisma.Decimal("100000.0000"),
          realizedPnl: "0.0000",
        });
        expect(portfolio.cashBalance.toFixed(4)).toBe("100000.0000");
      });
    });

    it("rejects duplicate portfolio initialization with CONFLICT (AC-002)", async () => {
      mockSessionRepo.findSessionById.mockResolvedValue({ id: "session-1" });
      mockPortfolioRepo.findPortfolioBySessionId.mockResolvedValue({
        id: "existing-portfolio",
        sessionId: "session-1",
      });

      await expect(service.initializePortfolio("session-1")).rejects.toThrow(
        expect.objectContaining({
          code: ERROR_CODES.CONFLICT,
          statusCode: HTTP_STATUS.CONFLICT,
        }),
      );
    });

    it("rejects accounting operations if session is not ACTIVE", async () => {
      mockSessionRepo.findSessionById.mockResolvedValue({
        id: "session-1",
        status: "COMPLETED",
      });

      await expect(
        service.applyBuyAccounting({
          sessionId: "session-1",
          assetId: "asset-1",
          quantity: 10,
          executionPrice: "100.000000",
        }),
      ).rejects.toThrow(/Cannot execute accounting on session in status: COMPLETED/);
    });
  });
});
