import { describe, it, expect } from "vitest";
import { Prisma } from "@prisma/client";
import {
  toSimulationOrderResponseDto,
  RawSimulationOrderWithDetails,
} from "../../src/modules/simulation/simulation-order.dto.js";
import {
  toSimulationTradeResponseDto,
  RawTradeWithDetails,
} from "../../src/modules/simulation/simulation-valuation.dto.js";
import {
  toSimulationSessionDto,
  RawSimulationSession,
} from "../../src/modules/simulation/simulation-session.dto.js";

describe("DEF-001: Decimal Serialization Precision & IEEE-754 Invariant", () => {
  const HIGH_MAGNITUDE_PRICE = "99999999999999.123456"; // NUMERIC(20, 6)
  const HIGH_MAGNITUDE_CURRENCY = "9999999999999999.1234"; // NUMERIC(20, 4)

  describe("toSimulationOrderResponseDto", () => {
    it("preserves exact NUMERIC(20,6) executionPrice without IEEE-754 precision loss (fresh execution)", () => {
      const rawOrder: RawSimulationOrderWithDetails = {
        id: "ord-test-1",
        userId: "user-1",
        sessionId: "sess-1",
        portfolioId: "port-1",
        assetId: "asset-1",
        side: "BUY",
        type: "MARKET",
        status: "FILLED",
        quantity: 1,
        executedQuantity: 1,
        executionPrice: new Prisma.Decimal(HIGH_MAGNITUDE_PRICE),
        idempotencyKey: "idem-1",
        submittedAt: new Date("2026-09-18T12:00:00.000Z"),
        filledAt: new Date("2026-09-18T12:00:01.000Z"),
        createdAt: new Date("2026-09-18T12:00:00.000Z"),
        updatedAt: new Date("2026-09-18T12:00:01.000Z"),
        asset: {
          id: "asset-1",
          symbol: "AURA",
          name: "Aura Capital",
          assetClass: "EQUITY",
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        trade: {
          id: "trd-test-1",
          orderId: "ord-test-1",
          portfolioId: "port-1",
          assetId: "asset-1",
          side: "BUY",
          quantity: 1,
          executionPrice: new Prisma.Decimal(HIGH_MAGNITUDE_PRICE),
          notional: new Prisma.Decimal("1000.0000"),
          realizedPnl: new Prisma.Decimal(HIGH_MAGNITUDE_CURRENCY),
          executedAt: new Date("2026-09-18T12:00:01.000Z"),
          createdAt: new Date("2026-09-18T12:00:01.000Z"),
          updatedAt: new Date("2026-09-18T12:00:01.000Z"),
        },
      };

      const dto = toSimulationOrderResponseDto(rawOrder, "AURA", false);

      // Verify exact serialization without floating point distortion
      expect(dto.executionPrice).toBe(HIGH_MAGNITUDE_PRICE);
      expect(dto.executionPrice).not.toBe("99999999999999.125000"); // Proves native Number rounding did not occur
      expect(dto.realizedPnl).toBe(HIGH_MAGNITUDE_CURRENCY);
      expect(dto.realizedPnl).not.toBe("10000000000000000.0000"); // Proves native Number rounding did not occur
      expect(dto.isReplay).toBeUndefined();
      expect(dto.simulated).toBe(true);
    });

    it("preserves exact NUMERIC(20,6) and NUMERIC(20,4) on idempotent replay response", () => {
      const rawOrder: RawSimulationOrderWithDetails = {
        id: "ord-test-replay",
        userId: "user-1",
        sessionId: "sess-1",
        portfolioId: "port-1",
        assetId: "asset-1",
        side: "SELL",
        type: "MARKET",
        status: "FILLED",
        quantity: 5,
        executedQuantity: 5,
        executionPrice: new Prisma.Decimal(HIGH_MAGNITUDE_PRICE),
        idempotencyKey: "idem-replay-key",
        submittedAt: new Date("2026-09-18T12:00:00.000Z"),
        filledAt: new Date("2026-09-18T12:00:01.000Z"),
        createdAt: new Date("2026-09-18T12:00:00.000Z"),
        updatedAt: new Date("2026-09-18T12:00:01.000Z"),
        asset: {
          id: "asset-1",
          symbol: "NVDA",
          name: "Nvidia",
          assetClass: "EQUITY",
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        trade: {
          id: "trd-test-replay",
          orderId: "ord-test-replay",
          portfolioId: "port-1",
          assetId: "asset-1",
          side: "SELL",
          quantity: 5,
          executionPrice: new Prisma.Decimal(HIGH_MAGNITUDE_PRICE),
          notional: new Prisma.Decimal(HIGH_MAGNITUDE_CURRENCY),
          realizedPnl: new Prisma.Decimal(HIGH_MAGNITUDE_CURRENCY),
          executedAt: new Date("2026-09-18T12:00:01.000Z"),
          createdAt: new Date("2026-09-18T12:00:01.000Z"),
          updatedAt: new Date("2026-09-18T12:00:01.000Z"),
        },
      };

      const dto = toSimulationOrderResponseDto(rawOrder, "NVDA", true);

      expect(dto.executionPrice).toBe(HIGH_MAGNITUDE_PRICE);
      expect(dto.realizedPnl).toBe(HIGH_MAGNITUDE_CURRENCY);
      expect(dto.isReplay).toBe(true);
      expect(dto.simulated).toBe(true);
    });

    it("serializes null execution price and zero realized PnL correctly", () => {
      const rawPendingOrder: RawSimulationOrderWithDetails = {
        id: "ord-pending",
        userId: "user-1",
        sessionId: "sess-1",
        portfolioId: "port-1",
        assetId: "asset-1",
        side: "BUY",
        type: "MARKET",
        status: "PENDING",
        quantity: 10,
        executedQuantity: null,
        executionPrice: null,
        idempotencyKey: "idem-pending",
        submittedAt: new Date("2026-09-18T12:00:00.000Z"),
        filledAt: null,
        createdAt: new Date("2026-09-18T12:00:00.000Z"),
        updatedAt: new Date("2026-09-18T12:00:00.000Z"),
      };

      const dto = toSimulationOrderResponseDto(rawPendingOrder, "AURA", false);

      expect(dto.executionPrice).toBeNull();
      expect(dto.executedQuantity).toBeNull();
      expect(dto.realizedPnl).toBe("0.0000");
    });
  });

  describe("toSimulationTradeResponseDto", () => {
    it("preserves exact NUMERIC(20,6) price and NUMERIC(20,4) notional and realized PnL", () => {
      const rawTrade: RawTradeWithDetails = {
        id: "trd-extreme",
        orderId: "ord-extreme",
        portfolioId: "port-1",
        assetId: "asset-1",
        side: "SELL",
        quantity: 10,
        executionPrice: new Prisma.Decimal(HIGH_MAGNITUDE_PRICE),
        notional: new Prisma.Decimal(HIGH_MAGNITUDE_CURRENCY),
        realizedPnl: new Prisma.Decimal(HIGH_MAGNITUDE_CURRENCY),
        executedAt: new Date("2026-09-18T12:05:00.000Z"),
        createdAt: new Date("2026-09-18T12:05:00.000Z"),
        updatedAt: new Date("2026-09-18T12:05:00.000Z"),
        asset: {
          id: "asset-1",
          symbol: "AURA",
          name: "Aura Capital",
          assetClass: "EQUITY",
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      };

      const dto = toSimulationTradeResponseDto(rawTrade);

      expect(dto.executionPrice).toBe(HIGH_MAGNITUDE_PRICE);
      expect(dto.notional).toBe(HIGH_MAGNITUDE_CURRENCY);
      expect(dto.realizedPnl).toBe(HIGH_MAGNITUDE_CURRENCY);
      expect(dto.simulated).toBe(true);
    });
  });

  describe("toSimulationSessionDto", () => {
    it("preserves exact NUMERIC(20,4) cash balance and realized PnL", () => {
      const rawSession: RawSimulationSession = {
        id: "sess-extreme",
        userId: "user-1",
        scenarioId: "scen-1",
        status: "ACTIVE",
        startingCash: new Prisma.Decimal(HIGH_MAGNITUDE_CURRENCY),
        currentCycle: 1,
        startedAt: new Date("2026-09-18T12:00:00.000Z"),
        completedAt: null,
        cancelledAt: null,
        createdAt: new Date("2026-09-18T12:00:00.000Z"),
        updatedAt: new Date("2026-09-18T12:00:00.000Z"),
        portfolio: {
          id: "port-extreme",
          cashBalance: new Prisma.Decimal(HIGH_MAGNITUDE_CURRENCY),
          realizedPnl: new Prisma.Decimal(HIGH_MAGNITUDE_CURRENCY),
        },
      };

      const dto = toSimulationSessionDto(rawSession);

      expect(dto.startingCash).toBe(HIGH_MAGNITUDE_CURRENCY);
      expect(dto.cashBalance).toBe(HIGH_MAGNITUDE_CURRENCY);
      expect(dto.realizedPnl).toBe(HIGH_MAGNITUDE_CURRENCY);
      expect(dto.simulated).toBe(true);
    });
  });
});
