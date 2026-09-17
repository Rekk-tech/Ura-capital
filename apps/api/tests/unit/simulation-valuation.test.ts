import { describe, it, expect, vi, beforeEach } from "vitest";
import { Prisma } from "@prisma/client";
import { AppError } from "../../src/shared/errors/error-envelope.js";
import { ERROR_CODES, HTTP_STATUS } from "@aura/shared";
import { SimulationValuationService } from "../../src/modules/simulation/simulation-valuation.service.js";
import type {
  ISimulationSessionRepository,
  ISimulationPortfolioRepository,
  ISimulationMarketSnapshotRepository,
  ISimulationOrderRepository,
  ISimulationTradeRepository,
} from "../../src/modules/simulation/simulation.repository.js";
import type {
  SimulationPortfolio,
  SimulationPosition,
  SimulationOrder,
  SimulationTrade,
  SimulationAsset,
} from "@prisma/client";
import {
  toSimulationTradeResponseDto,
} from "../../src/modules/simulation/simulation-valuation.dto.js";

type MockPortfolioWithPositions = SimulationPortfolio & {
  positions: (SimulationPosition & { asset?: SimulationAsset | null })[];
};

type MockOrderWithDetails = SimulationOrder & {
  asset?: SimulationAsset | null;
  trade?: (SimulationTrade | { realizedPnl: Prisma.Decimal }) | null;
};

type MockTradeWithAsset = SimulationTrade & {
  asset?: SimulationAsset | null;
};

describe("FEAT-037 Unit: Current Portfolio Valuation & PnL Read Model", () => {
  let mockSessionRepo: Partial<ISimulationSessionRepository>;
  let mockPortfolioRepo: Partial<ISimulationPortfolioRepository>;
  let mockSnapshotRepo: Partial<ISimulationMarketSnapshotRepository>;
  let mockOrderRepo: Partial<ISimulationOrderRepository>;
  let mockTradeRepo: Partial<ISimulationTradeRepository>;
  let service: SimulationValuationService;

  const validUserId = "11111111-1111-4111-8111-111111111111";
  const foreignUserId = "22222222-2222-4222-8222-222222222222";
  const validSessionId = "33333333-3333-4333-8333-333333333333";
  const scenarioId = "44444444-4444-4444-8444-444444444444";
  const asset1Id = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
  const asset2Id = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

  beforeEach(() => {
    mockSessionRepo = {
      findSessionById: vi.fn(),
    };
    mockPortfolioRepo = {
      findPortfolioBySessionId: vi.fn(),
    };
    mockSnapshotRepo = {
      listSnapshotsByScenarioAndCycle: vi.fn(),
    };
    mockOrderRepo = {
      listOrdersBySessionId: vi.fn(),
    };
    mockTradeRepo = {
      listTradesBySessionId: vi.fn(),
    };

    service = new SimulationValuationService(
      mockSessionRepo as ISimulationSessionRepository,
      mockPortfolioRepo as ISimulationPortfolioRepository,
      mockSnapshotRepo as ISimulationMarketSnapshotRepository,
      mockOrderRepo as ISimulationOrderRepository,
      mockTradeRepo as ISimulationTradeRepository,
    );
  });

  describe("1. Portfolio Valuation Calculations & Formulas (AC-003, AC-004, AC-006, AC-007)", () => {
    it("evaluates empty portfolio with zero positions (cash = equity, marketValue = 0)", async () => {
      vi.mocked(mockSessionRepo.findSessionById!).mockResolvedValue({
        id: validSessionId,
        userId: validUserId,
        scenarioId,
        currentCycle: 1,
        status: "ACTIVE",
        startingCash: new Prisma.Decimal("100000.0000"),
        startedAt: new Date(),
        completedAt: null,
        cancelledAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      vi.mocked(mockPortfolioRepo.findPortfolioBySessionId!).mockResolvedValue({
        id: "port-1",
        sessionId: validSessionId,
        cashBalance: new Prisma.Decimal("100000.0000"),
        realizedPnl: new Prisma.Decimal("0.0000"),
        createdAt: new Date(),
        updatedAt: new Date("2026-09-17T10:00:00.000Z"),
        positions: [],
      } as unknown as MockPortfolioWithPositions);

      vi.mocked(mockSnapshotRepo.listSnapshotsByScenarioAndCycle!).mockResolvedValue([]);

      const result = await service.getPortfolioValuation(validUserId, validSessionId);

      expect(result.cashBalance).toBe("100000.0000");
      expect(result.marketValue).toBe("0.0000");
      expect(result.realizedPnl).toBe("0.0000");
      expect(result.unrealizedPnl).toBe("0.0000");
      expect(result.totalEquity).toBe("100000.0000");
      expect(result.positions).toHaveLength(0);
      expect(result.simulated).toBe(true);
      expect(result.currentCycle).toBe(1);
    });

    it("evaluates single position with positive unrealized PnL (price > averageCost)", async () => {
      vi.mocked(mockSessionRepo.findSessionById!).mockResolvedValue({
        id: validSessionId,
        userId: validUserId,
        scenarioId,
        currentCycle: 2,
        status: "ACTIVE",
        startingCash: new Prisma.Decimal("100000.0000"),
        startedAt: new Date(),
        completedAt: null,
        cancelledAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      vi.mocked(mockPortfolioRepo.findPortfolioBySessionId!).mockResolvedValue({
        id: "port-1",
        sessionId: validSessionId,
        cashBalance: new Prisma.Decimal("95000.0000"),
        realizedPnl: new Prisma.Decimal("0.0000"),
        createdAt: new Date(),
        updatedAt: new Date(),
        positions: [
          {
            id: "pos-1",
            portfolioId: "port-1",
            assetId: asset1Id,
            quantity: 50,
            averageCost: new Prisma.Decimal("100.000000"),
            createdAt: new Date(),
            updatedAt: new Date(),
            asset: { id: asset1Id, symbol: "AURA", name: "Aura Capital", assetType: "EQUITY", status: "ACTIVE", displayOrder: 1, createdAt: new Date(), updatedAt: new Date() },
          },
        ],
      } as unknown as MockPortfolioWithPositions);

      vi.mocked(mockSnapshotRepo.listSnapshotsByScenarioAndCycle!).mockResolvedValue([
        {
          id: "snap-1",
          scenarioId,
          assetId: asset1Id,
          cycle: 2,
          price: new Prisma.Decimal("120.000000"),
          occurredAt: new Date(),
          createdAt: new Date(),
          asset: { id: asset1Id, symbol: "AURA", name: "Aura Capital", assetType: "EQUITY", status: "ACTIVE", displayOrder: 1, createdAt: new Date(), updatedAt: new Date() },
        },
      ]);

      const result = await service.getPortfolioValuation(validUserId, validSessionId);

      // marketValue = 50 * 120 = 6000.0000
      // unrealizedPnl = (120 - 100) * 50 = 1000.0000
      // totalEquity = 95000 + 6000 = 101000.0000
      expect(result.marketValue).toBe("6000.0000");
      expect(result.unrealizedPnl).toBe("1000.0000");
      expect(result.totalEquity).toBe("101000.0000");
      expect(result.positions).toHaveLength(1);
      expect(result.positions[0].symbol).toBe("AURA");
      expect(result.positions[0].quantity).toBe(50);
      expect(result.positions[0].averageCost).toBe("100.000000");
      expect(result.positions[0].currentPrice).toBe("120.000000");
      expect(result.positions[0].marketValue).toBe("6000.0000");
      expect(result.positions[0].unrealizedPnl).toBe("1000.0000");
    });

    it("evaluates single position with negative unrealized PnL (price < averageCost)", async () => {
      vi.mocked(mockSessionRepo.findSessionById!).mockResolvedValue({
        id: validSessionId,
        userId: validUserId,
        scenarioId,
        currentCycle: 3,
        status: "ACTIVE",
        startingCash: new Prisma.Decimal("100000.0000"),
        startedAt: new Date(),
        completedAt: null,
        cancelledAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      vi.mocked(mockPortfolioRepo.findPortfolioBySessionId!).mockResolvedValue({
        id: "port-1",
        sessionId: validSessionId,
        cashBalance: new Prisma.Decimal("80000.0000"),
        realizedPnl: new Prisma.Decimal("0.0000"),
        createdAt: new Date(),
        updatedAt: new Date(),
        positions: [
          {
            id: "pos-1",
            portfolioId: "port-1",
            assetId: asset1Id,
            quantity: 100,
            averageCost: new Prisma.Decimal("200.000000"),
            createdAt: new Date(),
            updatedAt: new Date(),
            asset: { id: asset1Id, symbol: "AURA", name: "Aura Capital", assetType: "EQUITY", status: "ACTIVE", displayOrder: 1, createdAt: new Date(), updatedAt: new Date() },
          },
        ],
      } as unknown as MockPortfolioWithPositions);

      vi.mocked(mockSnapshotRepo.listSnapshotsByScenarioAndCycle!).mockResolvedValue([
        {
          id: "snap-1",
          scenarioId,
          assetId: asset1Id,
          cycle: 3,
          price: new Prisma.Decimal("175.500000"),
          occurredAt: new Date(),
          createdAt: new Date(),
          asset: { id: asset1Id, symbol: "AURA", name: "Aura Capital", assetType: "EQUITY", status: "ACTIVE", displayOrder: 1, createdAt: new Date(), updatedAt: new Date() },
        },
      ]);

      const result = await service.getPortfolioValuation(validUserId, validSessionId);

      // marketValue = 100 * 175.5 = 17550.0000
      // unrealizedPnl = (175.5 - 200) * 100 = -2450.0000
      // totalEquity = 80000 + 17550 = 97550.0000
      expect(result.marketValue).toBe("17550.0000");
      expect(result.unrealizedPnl).toBe("-2450.0000");
      expect(result.totalEquity).toBe("97550.0000");
      expect(result.positions[0].unrealizedPnl).toBe("-2450.0000");
    });

    it("evaluates multiple positions aggregating positive and negative unrealized PnL", async () => {
      vi.mocked(mockSessionRepo.findSessionById!).mockResolvedValue({
        id: validSessionId,
        userId: validUserId,
        scenarioId,
        currentCycle: 2,
        status: "ACTIVE",
        startingCash: new Prisma.Decimal("100000.0000"),
        startedAt: new Date(),
        completedAt: null,
        cancelledAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      vi.mocked(mockPortfolioRepo.findPortfolioBySessionId!).mockResolvedValue({
        id: "port-1",
        sessionId: validSessionId,
        cashBalance: new Prisma.Decimal("70000.0000"),
        realizedPnl: new Prisma.Decimal("500.0000"),
        createdAt: new Date(),
        updatedAt: new Date(),
        positions: [
          {
            id: "pos-1",
            portfolioId: "port-1",
            assetId: asset1Id,
            quantity: 100,
            averageCost: new Prisma.Decimal("150.000000"),
            createdAt: new Date(),
            updatedAt: new Date(),
            asset: { id: asset1Id, symbol: "AURA", name: "Aura Capital", assetType: "EQUITY", status: "ACTIVE", displayOrder: 1, createdAt: new Date(), updatedAt: new Date() },
          },
          {
            id: "pos-2",
            portfolioId: "port-1",
            assetId: asset2Id,
            quantity: 50,
            averageCost: new Prisma.Decimal("300.000000"),
            createdAt: new Date(),
            updatedAt: new Date(),
            asset: { id: asset2Id, symbol: "SOL", name: "Solana", assetType: "EQUITY", status: "ACTIVE", displayOrder: 2, createdAt: new Date(), updatedAt: new Date() },
          },
        ],
      } as unknown as MockPortfolioWithPositions);

      vi.mocked(mockSnapshotRepo.listSnapshotsByScenarioAndCycle!).mockResolvedValue([
        {
          id: "snap-1",
          scenarioId,
          assetId: asset1Id,
          cycle: 2,
          price: new Prisma.Decimal("165.000000"), // +15.000000/share * 100 = +1500.0000
          occurredAt: new Date(),
          createdAt: new Date(),
          asset: { id: asset1Id, symbol: "AURA", name: "Aura Capital", assetType: "EQUITY", status: "ACTIVE", displayOrder: 1, createdAt: new Date(), updatedAt: new Date() },
        },
        {
          id: "snap-2",
          scenarioId,
          assetId: asset2Id,
          cycle: 2,
          price: new Prisma.Decimal("280.000000"), // -20.000000/share * 50 = -1000.0000
          occurredAt: new Date(),
          createdAt: new Date(),
          asset: { id: asset2Id, symbol: "SOL", name: "Solana", assetType: "EQUITY", status: "ACTIVE", displayOrder: 2, createdAt: new Date(), updatedAt: new Date() },
        },
      ]);

      const result = await service.getPortfolioValuation(validUserId, validSessionId);

      // pos 1 marketValue = 165 * 100 = 16500.0000; unrealized = +1500.0000
      // pos 2 marketValue = 280 * 50 = 14000.0000; unrealized = -1000.0000
      // totalMarketValue = 16500 + 14000 = 30500.0000
      // totalUnrealizedPnl = 1500 - 1000 = 500.0000
      // totalEquity = 70000 + 30500 = 100500.0000
      expect(result.cashBalance).toBe("70000.0000");
      expect(result.realizedPnl).toBe("500.0000");
      expect(result.marketValue).toBe("30500.0000");
      expect(result.unrealizedPnl).toBe("500.0000");
      expect(result.totalEquity).toBe("100500.0000");
      expect(result.positions).toHaveLength(2);
    });

    it("evaluates retained zero-quantity position (AC-003, AC-011)", async () => {
      vi.mocked(mockSessionRepo.findSessionById!).mockResolvedValue({
        id: validSessionId,
        userId: validUserId,
        scenarioId,
        currentCycle: 1,
        status: "ACTIVE",
        startingCash: new Prisma.Decimal("100000.0000"),
        startedAt: new Date(),
        completedAt: null,
        cancelledAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      vi.mocked(mockPortfolioRepo.findPortfolioBySessionId!).mockResolvedValue({
        id: "port-1",
        sessionId: validSessionId,
        cashBalance: new Prisma.Decimal("100000.0000"),
        realizedPnl: new Prisma.Decimal("250.0000"),
        createdAt: new Date(),
        updatedAt: new Date(),
        positions: [
          {
            id: "pos-1",
            portfolioId: "port-1",
            assetId: asset1Id,
            quantity: 0,
            averageCost: new Prisma.Decimal("142.500000"),
            createdAt: new Date(),
            updatedAt: new Date(),
            asset: { id: asset1Id, symbol: "AURA", name: "Aura Capital", assetType: "EQUITY", status: "ACTIVE", displayOrder: 1, createdAt: new Date(), updatedAt: new Date() },
          },
        ],
      } as unknown as MockPortfolioWithPositions);

      vi.mocked(mockSnapshotRepo.listSnapshotsByScenarioAndCycle!).mockResolvedValue([
        {
          id: "snap-1",
          scenarioId,
          assetId: asset1Id,
          cycle: 1,
          price: new Prisma.Decimal("150.000000"),
          occurredAt: new Date(),
          createdAt: new Date(),
          asset: { id: asset1Id, symbol: "AURA", name: "Aura Capital", assetType: "EQUITY", status: "ACTIVE", displayOrder: 1, createdAt: new Date(), updatedAt: new Date() },
        },
      ]);

      const result = await service.getPortfolioValuation(validUserId, validSessionId);

      expect(result.marketValue).toBe("0.0000");
      expect(result.unrealizedPnl).toBe("0.0000");
      expect(result.totalEquity).toBe("100000.0000");
      expect(result.positions[0].quantity).toBe(0);
      expect(result.positions[0].averageCost).toBe("142.500000");
      expect(result.positions[0].marketValue).toBe("0.0000");
      expect(result.positions[0].unrealizedPnl).toBe("0.0000");
    });

    it("verifies ROUND_HALF_UP boundary and high-precision price and cost (AC-001, AC-011)", async () => {
      vi.mocked(mockSessionRepo.findSessionById!).mockResolvedValue({
        id: validSessionId,
        userId: validUserId,
        scenarioId,
        currentCycle: 1,
        status: "ACTIVE",
        startingCash: new Prisma.Decimal("100000.0000"),
        startedAt: new Date(),
        completedAt: null,
        cancelledAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      vi.mocked(mockPortfolioRepo.findPortfolioBySessionId!).mockResolvedValue({
        id: "port-1",
        sessionId: validSessionId,
        cashBalance: new Prisma.Decimal("10000.0000"),
        realizedPnl: new Prisma.Decimal("0.0000"),
        createdAt: new Date(),
        updatedAt: new Date(),
        positions: [
          {
            id: "pos-1",
            portfolioId: "port-1",
            assetId: asset1Id,
            quantity: 3,
            // 33.333333 * 3 = 99.999999
            averageCost: new Prisma.Decimal("33.333333"),
            createdAt: new Date(),
            updatedAt: new Date(),
            asset: { id: asset1Id, symbol: "AURA", name: "Aura Capital", assetType: "EQUITY", status: "ACTIVE", displayOrder: 1, createdAt: new Date(), updatedAt: new Date() },
          },
        ],
      } as unknown as MockPortfolioWithPositions);

      // Price with high precision 6 decimals: 33.333455
      // marketValue = 3 * 33.333455 = 100.000365 -> rounds to 100.0004
      // unrealizedPnl = (33.333455 - 33.333333) * 3 = 0.000122 * 3 = 0.000366 -> rounds to 0.0004
      vi.mocked(mockSnapshotRepo.listSnapshotsByScenarioAndCycle!).mockResolvedValue([
        {
          id: "snap-1",
          scenarioId,
          assetId: asset1Id,
          cycle: 1,
          price: new Prisma.Decimal("33.333455"),
          occurredAt: new Date(),
          createdAt: new Date(),
          asset: { id: asset1Id, symbol: "AURA", name: "Aura Capital", assetType: "EQUITY", status: "ACTIVE", displayOrder: 1, createdAt: new Date(), updatedAt: new Date() },
        },
      ]);

      const result = await service.getPortfolioValuation(validUserId, validSessionId);

      expect(result.positions[0].marketValue).toBe("100.0004");
      expect(result.positions[0].unrealizedPnl).toBe("0.0004");
      expect(result.marketValue).toBe("100.0004");
      expect(result.totalEquity).toBe("10100.0004");
    });

    it("rejects when snapshot price is missing for a held position (AC-004)", async () => {
      vi.mocked(mockSessionRepo.findSessionById!).mockResolvedValue({
        id: validSessionId,
        userId: validUserId,
        scenarioId,
        currentCycle: 1,
        status: "ACTIVE",
        startingCash: new Prisma.Decimal("100000.0000"),
        startedAt: new Date(),
        completedAt: null,
        cancelledAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      vi.mocked(mockPortfolioRepo.findPortfolioBySessionId!).mockResolvedValue({
        id: "port-1",
        sessionId: validSessionId,
        cashBalance: new Prisma.Decimal("90000.0000"),
        realizedPnl: new Prisma.Decimal("0.0000"),
        createdAt: new Date(),
        updatedAt: new Date(),
        positions: [
          {
            id: "pos-1",
            portfolioId: "port-1",
            assetId: asset1Id,
            quantity: 10,
            averageCost: new Prisma.Decimal("100.000000"),
            createdAt: new Date(),
            updatedAt: new Date(),
            asset: { id: asset1Id, symbol: "AURA", name: "Aura Capital", assetType: "EQUITY", status: "ACTIVE", displayOrder: 1, createdAt: new Date(), updatedAt: new Date() },
          },
        ],
      } as unknown as MockPortfolioWithPositions);

      // Return empty snapshots list
      vi.mocked(mockSnapshotRepo.listSnapshotsByScenarioAndCycle!).mockResolvedValue([]);

      await expect(
        service.getPortfolioValuation(validUserId, validSessionId),
      ).rejects.toThrowError(AppError);

      await expect(
        service.getPortfolioValuation(validUserId, validSessionId),
      ).rejects.toMatchObject({
        code: ERROR_CODES.VALIDATION_ERROR,
        statusCode: HTTP_STATUS.BAD_REQUEST,
      });
    });
  });

  describe("2. Security & IDOR Isolation (AC-008, AC-009)", () => {
    it("rejects foreign user attempting to read portfolio with 404 NOT_FOUND (AC-009)", async () => {
      vi.mocked(mockSessionRepo.findSessionById!).mockResolvedValue({
        id: validSessionId,
        userId: validUserId, // owned by validUserId, caller is foreignUserId
        scenarioId,
        currentCycle: 1,
        status: "ACTIVE",
        startingCash: new Prisma.Decimal("100000.0000"),
        startedAt: new Date(),
        completedAt: null,
        cancelledAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await expect(
        service.getPortfolioValuation(foreignUserId, validSessionId),
      ).rejects.toMatchObject({
        code: ERROR_CODES.NOT_FOUND,
        statusCode: HTTP_STATUS.NOT_FOUND,
      });
    });

    it("rejects nonexistent session ID with 404 NOT_FOUND", async () => {
      vi.mocked(mockSessionRepo.findSessionById!).mockResolvedValue(null);

      await expect(
        service.getPortfolioValuation(validUserId, validSessionId),
      ).rejects.toMatchObject({
        code: ERROR_CODES.NOT_FOUND,
        statusCode: HTTP_STATUS.NOT_FOUND,
      });
    });

    it("rejects invalid non-UUID simulationId with 400 BAD_REQUEST", async () => {
      await expect(
        service.getPortfolioValuation(validUserId, "invalid-uuid"),
      ).rejects.toMatchObject({
        code: ERROR_CODES.VALIDATION_ERROR,
        statusCode: HTTP_STATUS.BAD_REQUEST,
      });
    });
  });

  describe("3. Orders and Trades Reads (AC-008, AC-011, AC-012)", () => {
    it("returns owner orders with safe DTO projection and simulated: true", async () => {
      vi.mocked(mockSessionRepo.findSessionById!).mockResolvedValue({
        id: validSessionId,
        userId: validUserId,
        scenarioId,
        currentCycle: 1,
        status: "ACTIVE",
        startingCash: new Prisma.Decimal("100000.0000"),
        startedAt: new Date(),
        completedAt: null,
        cancelledAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      vi.mocked(mockOrderRepo.listOrdersBySessionId!).mockResolvedValue([
        {
          id: "order-1",
          sessionId: validSessionId,
          userId: validUserId,
          assetId: asset1Id,
          side: "BUY",
          type: "MARKET",
          quantity: 10,
          status: "FILLED",
          idempotencyKey: "idem-key-1",
          requestFingerprint: "fingerprint-1",
          rejectionCode: null,
          executionPrice: new Prisma.Decimal("100.000000"),
          executedQuantity: 10,
          submittedAt: new Date("2026-09-17T10:00:00.000Z"),
          filledAt: new Date("2026-09-17T10:00:01.000Z"),
          createdAt: new Date(),
          updatedAt: new Date(),
          asset: { symbol: "AURA" } as unknown as SimulationAsset,
          trade: { realizedPnl: new Prisma.Decimal("0.0000") } as unknown as SimulationTrade,
        } as unknown as MockOrderWithDetails,
      ]);

      const orders = await service.getSessionOrders(validUserId, validSessionId);

      expect(orders).toHaveLength(1);
      expect(orders[0].id).toBe("order-1");
      expect(orders[0].assetSymbol).toBe("AURA");
      expect(orders[0].executionPrice).toBe("100.000000");
      expect(orders[0].realizedPnl).toBe("0.0000");
      expect(orders[0].simulated).toBe(true);
      expect(orders[0]).not.toHaveProperty("requestFingerprint");
      expect(orders[0]).not.toHaveProperty("userId");
    });

    it("rejects foreign user attempting to read orders with 404 NOT_FOUND (AC-008, AC-009)", async () => {
      vi.mocked(mockSessionRepo.findSessionById!).mockResolvedValue({
        id: validSessionId,
        userId: validUserId,
        scenarioId,
        currentCycle: 1,
        status: "ACTIVE",
        startingCash: new Prisma.Decimal("100000.0000"),
        startedAt: new Date(),
        completedAt: null,
        cancelledAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await expect(
        service.getSessionOrders(foreignUserId, validSessionId),
      ).rejects.toMatchObject({
        code: ERROR_CODES.NOT_FOUND,
        statusCode: HTTP_STATUS.NOT_FOUND,
      });
    });

    it("returns owner trades with safe DTO projection and simulated: true", async () => {
      vi.mocked(mockSessionRepo.findSessionById!).mockResolvedValue({
        id: validSessionId,
        userId: validUserId,
        scenarioId,
        currentCycle: 1,
        status: "ACTIVE",
        startingCash: new Prisma.Decimal("100000.0000"),
        startedAt: new Date(),
        completedAt: null,
        cancelledAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      vi.mocked(mockTradeRepo.listTradesBySessionId!).mockResolvedValue([
        {
          id: "trade-1",
          orderId: "order-1",
          sessionId: validSessionId,
          assetId: asset1Id,
          side: "SELL",
          quantity: 5,
          executionPrice: new Prisma.Decimal("150.000000"),
          notional: new Prisma.Decimal("750.0000"),
          realizedPnl: new Prisma.Decimal("250.0000"),
          executedAt: new Date("2026-09-17T10:05:00.000Z"),
          createdAt: new Date(),
          asset: { symbol: "AURA" } as unknown as SimulationAsset,
        } as unknown as MockTradeWithAsset,
      ]);

      const trades = await service.getSessionTrades(validUserId, validSessionId);

      expect(trades).toHaveLength(1);
      expect(trades[0].id).toBe("trade-1");
      expect(trades[0].side).toBe("SELL");
      expect(trades[0].assetSymbol).toBe("AURA");
      expect(trades[0].executionPrice).toBe("150.000000");
      expect(trades[0].notional).toBe("750.0000");
      expect(trades[0].realizedPnl).toBe("250.0000");
      expect(trades[0].simulated).toBe(true);
      expect(trades[0]).not.toHaveProperty("sessionId");
    });

    it("rejects foreign user attempting to read trades with 404 NOT_FOUND (AC-008, AC-009)", async () => {
      vi.mocked(mockSessionRepo.findSessionById!).mockResolvedValue({
        id: validSessionId,
        userId: validUserId,
        scenarioId,
        currentCycle: 1,
        status: "ACTIVE",
        startingCash: new Prisma.Decimal("100000.0000"),
        startedAt: new Date(),
        completedAt: null,
        cancelledAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await expect(
        service.getSessionTrades(foreignUserId, validSessionId),
      ).rejects.toMatchObject({
        code: ERROR_CODES.NOT_FOUND,
        statusCode: HTTP_STATUS.NOT_FOUND,
      });
    });
  });

  describe("4. Trade DTO Formatting Helper", () => {
    it("correctly formats trade DTO fields with fixed scale decimals", () => {
      const dto = toSimulationTradeResponseDto({
        id: "t1",
        orderId: "o1",
        sessionId: "s1",
        assetId: "a1",
        side: "BUY",
        quantity: 10,
        executionPrice: new Prisma.Decimal("123.45"),
        notional: new Prisma.Decimal("1234.5"),
        realizedPnl: new Prisma.Decimal("0"),
        executedAt: new Date("2026-09-17T12:00:00.000Z"),
        createdAt: new Date(),
        asset: { symbol: "BTC" } as unknown as SimulationAsset,
      });

      expect(dto.executionPrice).toBe("123.450000");
      expect(dto.notional).toBe("1234.5000");
      expect(dto.realizedPnl).toBe("0.0000");
      expect(dto.simulated).toBe(true);
      expect(dto.assetSymbol).toBe("BTC");
    });
  });
});
