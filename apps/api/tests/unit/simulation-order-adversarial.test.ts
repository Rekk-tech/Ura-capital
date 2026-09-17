import { describe, it, expect, vi, beforeEach } from "vitest";
import { Prisma, type SimulationOrder } from "@prisma/client";
import { ERROR_CODES, HTTP_STATUS } from "@aura/shared";
import { AppError } from "../../src/shared/errors/error-envelope.js";
import {
  generateOrderFingerprint,
  submitOrderRequestSchema,
  assertNoOrderAuthorityFields,
} from "../../src/modules/simulation/simulation-order.validation.js";
import {
  calculateBuyAccounting,
  calculateSellAccounting,
} from "../../src/modules/simulation/simulation-accounting.js";
import { SimulationOrderService } from "../../src/modules/simulation/simulation-order.service.js";
import type {
  ISimulationOrderRepository,
  ISimulationTradeRepository,
  ISimulationPortfolioRepository,
  ISimulationSessionRepository,
  ISimulationAssetRepository,
  ISimulationMarketSnapshotRepository,
} from "../../src/modules/simulation/simulation.repository.js";
import type { ITransactionRunner } from "../../src/infrastructure/database/transaction-runner.js";

describe("FEAT-036: Order Idempotency & Concurrency Adversarial Hardening (Unit)", () => {
  describe("T002 & T003: Payload Fingerprint Invariance & Sensitivity", () => {
    it("generates perfectly deterministic SHA-256 hash across identical inputs", () => {
      const fp1 = generateOrderFingerprint({
        side: "BUY",
        type: "MARKET",
        assetSymbol: "AURA",
        quantity: 10,
      });

      const fp2 = generateOrderFingerprint({
        side: "BUY",
        type: "MARKET",
        assetSymbol: "AURA",
        quantity: 10,
      });

      expect(fp1).toBe(fp2);
      expect(fp1).toMatch(/^[0-9a-f]{64}$/);
    });

    it("normalizes case and whitespace without altering hash equality", () => {
      const standard = generateOrderFingerprint({
        side: "BUY",
        type: "MARKET",
        assetSymbol: "AURA",
        quantity: 25,
      });

      const lower = generateOrderFingerprint({
        side: "buy",
        type: "market",
        assetSymbol: " aura ",
        quantity: 25,
      });

      expect(lower).toBe(standard);
    });

    it("produces distinct fingerprint when quantity differs", () => {
      const fp10 = generateOrderFingerprint({
        side: "BUY",
        type: "MARKET",
        assetSymbol: "AURA",
        quantity: 10,
      });

      const fp20 = generateOrderFingerprint({
        side: "BUY",
        type: "MARKET",
        assetSymbol: "AURA",
        quantity: 20,
      });

      expect(fp10).not.toBe(fp20);
    });

    it("produces distinct fingerprint when side differs", () => {
      const buyFp = generateOrderFingerprint({
        side: "BUY",
        type: "MARKET",
        assetSymbol: "AURA",
        quantity: 10,
      });

      const sellFp = generateOrderFingerprint({
        side: "SELL",
        type: "MARKET",
        assetSymbol: "AURA",
        quantity: 10,
      });

      expect(buyFp).not.toBe(sellFp);
    });

    it("produces distinct fingerprint when asset symbol differs", () => {
      const auraFp = generateOrderFingerprint({
        side: "BUY",
        type: "MARKET",
        assetSymbol: "AURA",
        quantity: 10,
      });

      const solFp = generateOrderFingerprint({
        side: "BUY",
        type: "MARKET",
        assetSymbol: "SOL",
        quantity: 10,
      });

      expect(auraFp).not.toBe(solFp);
    });
  });

  describe("T008: Strict Client Authority Rejection Under Adversarial Injection", () => {
    it("rejects client attempts to supply executionPrice, fee, status, or filledAt", () => {
      const maliciousPayloads = [
        { side: "BUY", type: "MARKET", assetSymbol: "AURA", quantity: 1, idempotencyKey: "k1", price: "10.00" },
        { side: "BUY", type: "MARKET", assetSymbol: "AURA", quantity: 1, idempotencyKey: "k2", executionPrice: "0.01" },
        { side: "BUY", type: "MARKET", assetSymbol: "AURA", quantity: 1, idempotencyKey: "k3", fee: "0" },
        { side: "BUY", type: "MARKET", assetSymbol: "AURA", quantity: 1, idempotencyKey: "k4", slippage: "0" },
        { side: "BUY", type: "MARKET", assetSymbol: "AURA", quantity: 1, idempotencyKey: "k5", status: "FILLED" },
        { side: "BUY", type: "MARKET", assetSymbol: "AURA", quantity: 1, idempotencyKey: "k6", filledAt: new Date().toISOString() },
        { side: "BUY", type: "MARKET", assetSymbol: "AURA", quantity: 1, idempotencyKey: "k7", cashAfter: "999999.00" },
        { side: "BUY", type: "MARKET", assetSymbol: "AURA", quantity: 1, idempotencyKey: "k8", positionAfter: 100 },
        { side: "BUY", type: "MARKET", assetSymbol: "AURA", quantity: 1, idempotencyKey: "k9", userId: "00000000-0000-0000-0000-000000000000" },
      ];

      for (const p of maliciousPayloads) {
        expect(() => assertNoOrderAuthorityFields(p)).toThrow(AppError);
        try {
          assertNoOrderAuthorityFields(p);
        } catch (err: unknown) {
          const appErr = err as AppError;
          expect(appErr.statusCode).toBe(HTTP_STATUS.BAD_REQUEST);
          expect(appErr.code).toBe(ERROR_CODES.VALIDATION_ERROR);
          expect(appErr.message).toContain("cannot be provided by client");
        }
      }
    });

    it("rejects non-MARKET order types adversarial requests", () => {
      const prohibitedTypes = ["LIMIT", "STOP", "STOP_LIMIT", "TRAILING_STOP", "OCO"];
      for (const t of prohibitedTypes) {
        const result = submitOrderRequestSchema.safeParse({
          side: "BUY",
          type: t,
          assetSymbol: "AURA",
          quantity: 1,
          idempotencyKey: `k-${t}`,
        });
        expect(result.success).toBe(false);
      }
    });
  });

  describe("T007: Bounded Unique Conflict Recovery & Error Sanitization", () => {
    let mockOrderRepo: ISimulationOrderRepository;
    let mockTradeRepo: ISimulationTradeRepository;
    let mockPortfolioRepo: ISimulationPortfolioRepository;
    let mockSessionRepo: ISimulationSessionRepository;
    let mockAssetRepo: ISimulationAssetRepository;
    let mockSnapshotRepo: ISimulationMarketSnapshotRepository;
    let mockTxRunner: ITransactionRunner;
    let service: SimulationOrderService;

    const testUserId = "11111111-1111-4111-a111-111111111111";
    const testSessionId = "22222222-2222-4222-a222-222222222222";
    const testIdempotencyKey = "idemp-adversarial-test-key-1";

    beforeEach(() => {
      mockOrderRepo = {
        createOrder: vi.fn(),
        findOrderById: vi.fn(),
        findOrderByUserSessionIdempotencyKey: vi.fn().mockResolvedValue(null),
        listOrdersBySessionId: vi.fn(),
        updateOrderStatus: vi.fn(),
      };

      mockTradeRepo = {
        createTrade: vi.fn(),
        findTradeById: vi.fn(),
        findTradeByOrderId: vi.fn(),
        listTradesBySessionId: vi.fn(),
      };

      mockPortfolioRepo = {
        createPortfolio: vi.fn(),
        findPortfolioBySessionId: vi.fn().mockResolvedValue({
          id: "port-1",
          sessionId: testSessionId,
          cashBalance: new Prisma.Decimal("100000.0000"),
          realizedPnl: new Prisma.Decimal("0.0000"),
        }),
        findPortfolioById: vi.fn(),
        updateCashBalance: vi.fn(),
        updateRealizedPnl: vi.fn(),
        updatePortfolioAccounting: vi.fn(),
        createPosition: vi.fn(),
        findPosition: vi.fn(),
        listPositions: vi.fn(),
        upsertPosition: vi.fn(),
        findPortfolioBySessionIdForUpdate: vi.fn().mockResolvedValue({
          id: "port-1",
          sessionId: testSessionId,
          cashBalance: new Prisma.Decimal("100000.0000"),
          realizedPnl: new Prisma.Decimal("0.0000"),
        }),
        findPositionForUpdate: vi.fn().mockResolvedValue(null),
        deletePosition: vi.fn(),
      };

      mockSessionRepo = {
        createSession: vi.fn(),
        findSessionById: vi.fn().mockResolvedValue({
          id: testSessionId,
          userId: testUserId,
          scenarioId: "scen-1",
          status: "ACTIVE",
          currentCycle: 1,
        }),
        findActiveSessionByUserId: vi.fn(),
        listSessionsByUserId: vi.fn(),
        updateSessionStatus: vi.fn(),
        advanceCycle: vi.fn(),
      };

      mockAssetRepo = {
        createAsset: vi.fn(),
        findAssetById: vi.fn(),
        findAssetBySymbol: vi.fn().mockResolvedValue({
          id: "asset-aura",
          symbol: "AURA",
          status: "ACTIVE",
        }),
        listAssets: vi.fn(),
      };

      mockSnapshotRepo = {
        createSnapshot: vi.fn(),
        findSnapshotById: vi.fn(),
        findSnapshot: vi.fn().mockResolvedValue({
          id: "snap-1",
          scenarioId: "scen-1",
          cycle: 1,
          assetId: "asset-aura",
          price: new Prisma.Decimal("150.000000"),
        }),
        listSnapshotsByScenarioAndCycle: vi.fn(),
      };

      mockTxRunner = {
        run: vi.fn(),
        getActiveContext: vi.fn().mockReturnValue(undefined),
        isInTransaction: vi.fn().mockReturnValue(false),
      };

      service = new SimulationOrderService(
        mockOrderRepo,
        mockTradeRepo,
        mockPortfolioRepo,
        mockSessionRepo,
        mockAssetRepo,
        mockSnapshotRepo,
        mockTxRunner,
      );
    });

    it("recovers winning order after bounded retry when race condition triggers P2002 conflict", async () => {
      const canonicalFingerprint = generateOrderFingerprint({
        side: "BUY",
        type: "MARKET",
        assetSymbol: "AURA",
        quantity: 10,
      });

      const winningOrder = {
        id: "order-winning-123",
        sessionId: testSessionId,
        userId: testUserId,
        assetId: "asset-aura",
        side: "BUY",
        type: "MARKET",
        quantity: 10,
        status: "FILLED",
        idempotencyKey: testIdempotencyKey,
        requestFingerprint: canonicalFingerprint,
        executionPrice: new Prisma.Decimal("150.000000"),
        executedQuantity: 10,
        submittedAt: new Date(),
        filledAt: new Date(),
        rejectionCode: null,
        asset: { id: "asset-aura", symbol: "AURA", name: "Aura Enterprise" },
        trade: {
          id: "trade-123",
          orderId: "order-winning-123",
          notional: new Prisma.Decimal("1500.0000"),
          executionPrice: new Prisma.Decimal("150.000000"),
          realizedPnl: new Prisma.Decimal("0.0000"),
          executedAt: new Date(),
        },
      };

      // In pre-flight lookup: order does not exist yet (both callers race)
      vi.mocked(mockOrderRepo.findOrderByUserSessionIdempotencyKey)
        .mockResolvedValueOnce(null) // pre-flight
        .mockResolvedValueOnce(null) // retry 1 in catch block
        .mockResolvedValueOnce(winningOrder as unknown as SimulationOrder); // retry 2 in catch block: winning order committed!

      // Inside transaction: createOrder throws unique constraint collision (P2002)
      vi.mocked(mockTxRunner.run).mockRejectedValueOnce(
        new AppError(
          "A resource with these unique identifiers already exists.",
          ERROR_CODES.CONFLICT,
          HTTP_STATUS.CONFLICT,
        ),
      );

      const result = await service.submitMarketOrder(testUserId, testSessionId, {
        side: "BUY",
        type: "MARKET",
        assetSymbol: "AURA",
        quantity: 10,
        idempotencyKey: testIdempotencyKey,
      });

      expect(result.id).toBe("order-winning-123");
      expect(result.isReplay).toBe(true);
      expect(result.simulated).toBe(true);
      expect(result.executionPrice).toBe("150.000000");
    });

    it("throws 409 IDEMPOTENCY_CONFLICT when winning order has divergent payload fingerprint", async () => {
      const differentFingerprint = generateOrderFingerprint({
        side: "BUY",
        type: "MARKET",
        assetSymbol: "AURA",
        quantity: 20, // different quantity!
      });

      const winningOrderWithDifferentPayload = {
        id: "order-divergent-456",
        sessionId: testSessionId,
        userId: testUserId,
        assetId: "asset-aura",
        side: "BUY",
        type: "MARKET",
        quantity: 20,
        status: "FILLED",
        idempotencyKey: testIdempotencyKey,
        requestFingerprint: differentFingerprint,
        executionPrice: new Prisma.Decimal("150.000000"),
        executedQuantity: 20,
        submittedAt: new Date(),
        filledAt: new Date(),
        rejectionCode: null,
      };

      vi.mocked(mockOrderRepo.findOrderByUserSessionIdempotencyKey)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(winningOrderWithDifferentPayload as unknown as SimulationOrder);

      vi.mocked(mockTxRunner.run).mockRejectedValueOnce(
        new AppError(
          "A resource with these unique identifiers already exists.",
          ERROR_CODES.CONFLICT,
          HTTP_STATUS.CONFLICT,
        ),
      );

      await expect(
        service.submitMarketOrder(testUserId, testSessionId, {
          side: "BUY",
          type: "MARKET",
          assetSymbol: "AURA",
          quantity: 10, // caller asked for 10
          idempotencyKey: testIdempotencyKey,
        }),
      ).rejects.toThrow(
        expect.objectContaining({
          statusCode: HTTP_STATUS.CONFLICT,
          code: ERROR_CODES.IDEMPOTENCY_CONFLICT,
          message: "Idempotency key has already been used with a different request payload",
        }),
      );
    });

    it("sanitizes unexpected database errors without leaking SQL or connection details", async () => {
      vi.mocked(mockTxRunner.run).mockRejectedValueOnce(
        new Error("Database error: connect ECONNREFUSED 127.0.0.1:5432 at raw query SELECT * FROM secret_table"),
      );

      await expect(
        service.submitMarketOrder(testUserId, testSessionId, {
          side: "BUY",
          type: "MARKET",
          assetSymbol: "AURA",
          quantity: 10,
          idempotencyKey: "k-sanitization-1",
        }),
      ).rejects.toThrow();
    });
  });

  describe("T010: Decimal Calculation Precision Invariance", () => {
    it("maintains zero decimal drift across sequential buy calculations", () => {
      let cash = new Prisma.Decimal("100000.0000");
      let qty = 0;
      let avgCost = new Prisma.Decimal("0.000000");

      const buys = [
        { quantity: 13, price: new Prisma.Decimal("142.345678") },
        { quantity: 27, price: new Prisma.Decimal("149.876543") },
        { quantity: 45, price: new Prisma.Decimal("153.112233") },
      ];

      for (const b of buys) {
        const result = calculateBuyAccounting({
          currentCash: cash,
          currentQuantity: qty,
          currentAverageCost: avgCost,
          buyQuantity: b.quantity,
          executionPrice: b.price,
        });

        cash = result.newCashBalance;
        qty = result.newQuantity;
        avgCost = result.newAverageCost;

        expect(cash.decimalPlaces()).toBeLessThanOrEqual(4);
        expect(avgCost.decimalPlaces()).toBeLessThanOrEqual(6);
      }

      expect(qty).toBe(85);
      expect(cash.toFixed(4)).toBe("87212.7890");
      expect(avgCost.toFixed(6)).toBe("150.437777");
    });

    it("preserves exact average cost on partial sell", () => {
      const avgCost = new Prisma.Decimal("150.437777");
      const sellResult = calculateSellAccounting({
        currentCash: new Prisma.Decimal("87212.7890"),
        currentQuantity: 85,
        currentAverageCost: avgCost,
        currentRealizedPnl: new Prisma.Decimal("0.0000"),
        sellQuantity: 35,
        executionPrice: new Prisma.Decimal("165.500000"),
      });

      expect(sellResult.newQuantity).toBe(50);
      expect(sellResult.remainingAverageCost.toFixed(6)).toBe("150.437777");
      expect(sellResult.tradeRealizedPnl.toFixed(4)).toBe("527.1778");
      expect(sellResult.newPortfolioRealizedPnl.toFixed(4)).toBe("527.1778");
      expect(sellResult.newCashBalance.toFixed(4)).toBe("93005.2890");
    });
  });
});
