import { describe, it, expect, vi, beforeEach } from "vitest";
import { Prisma } from "@prisma/client";
import { AppError } from "../../src/shared/errors/error-envelope.js";
import type { IRepositoryContainer } from "../../src/infrastructure/database/repository-factory.js";
import {
  submitOrderRequestSchema,
  assertNoOrderAuthorityFields,
  generateOrderFingerprint,
} from "../../src/modules/simulation/simulation-order.validation.js";
import {
  toSimulationOrderResponseDto,
} from "../../src/modules/simulation/simulation-order.dto.js";
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

describe("FEAT-035: Market Order Submission & Execution (Unit Tests)", () => {
  describe("T001 / AC-002, AC-003, AC-004: Strict Order Request Schema", () => {
    it("validates a canonical BUY order payload", () => {
      const payload = {
        side: "BUY",
        type: "MARKET",
        assetSymbol: "AURA",
        quantity: 10,
        idempotencyKey: "test-key-001",
      };

      const result = submitOrderRequestSchema.safeParse(payload);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.side).toBe("BUY");
        expect(result.data.type).toBe("MARKET");
        expect(result.data.assetSymbol).toBe("AURA");
        expect(result.data.quantity).toBe(10);
        expect(result.data.idempotencyKey).toBe("test-key-001");
      }
    });

    it("validates a canonical SELL order payload", () => {
      const payload = {
        side: "SELL",
        type: "MARKET",
        assetSymbol: "SOL",
        quantity: 5,
        idempotencyKey: "test-key-002",
      };

      const result = submitOrderRequestSchema.safeParse(payload);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.side).toBe("SELL");
        expect(result.data.quantity).toBe(5);
      }
    });

    it("rejects non-MARKET order types (e.g. LIMIT, STOP, STOP_LIMIT)", () => {
      const limitPayload = {
        side: "BUY",
        type: "LIMIT",
        assetSymbol: "AURA",
        quantity: 10,
        idempotencyKey: "test-key-003",
      };

      const result = submitOrderRequestSchema.safeParse(limitPayload);
      expect(result.success).toBe(false);
    });

    it("rejects invalid side values", () => {
      const payload = {
        side: "HOLD",
        type: "MARKET",
        assetSymbol: "AURA",
        quantity: 10,
        idempotencyKey: "test-key-004",
      };

      const result = submitOrderRequestSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });

    it("rejects zero quantity", () => {
      const payload = {
        side: "BUY",
        type: "MARKET",
        assetSymbol: "AURA",
        quantity: 0,
        idempotencyKey: "test-key-005",
      };

      const result = submitOrderRequestSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });

    it("rejects negative quantity", () => {
      const payload = {
        side: "BUY",
        type: "MARKET",
        assetSymbol: "AURA",
        quantity: -5,
        idempotencyKey: "test-key-006",
      };

      const result = submitOrderRequestSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });

    it("rejects fractional / floating point quantity", () => {
      const payload = {
        side: "BUY",
        type: "MARKET",
        assetSymbol: "AURA",
        quantity: 1.5,
        idempotencyKey: "test-key-007",
      };

      const result = submitOrderRequestSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });

    it("rejects empty or whitespace idempotency key", () => {
      const payload = {
        side: "BUY",
        type: "MARKET",
        assetSymbol: "AURA",
        quantity: 1,
        idempotencyKey: "   ",
      };

      const result = submitOrderRequestSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });

    it("rejects empty assetSymbol", () => {
      const payload = {
        side: "BUY",
        type: "MARKET",
        assetSymbol: "   ",
        quantity: 1,
        idempotencyKey: "test-key-008",
      };

      const result = submitOrderRequestSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });

    it("rejects unapproved additional fields with strict schema", () => {
      const payload = {
        side: "BUY",
        type: "MARKET",
        assetSymbol: "AURA",
        quantity: 1,
        idempotencyKey: "test-key-009",
        extraField: "sneaky",
      };

      const result = submitOrderRequestSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });
  });

  describe("T010 / AC-017: Forbidden Authority Field Assertions", () => {
    it("rejects client-provided executionPrice with 400 VALIDATION_ERROR", () => {
      expect(() => {
        assertNoOrderAuthorityFields({
          side: "BUY",
          type: "MARKET",
          assetSymbol: "AURA",
          quantity: 1,
          idempotencyKey: "k1",
          executionPrice: 100,
        });
      }).toThrowError(AppError);
    });

    it("rejects client-provided cashAfter with 400 VALIDATION_ERROR", () => {
      expect(() => {
        assertNoOrderAuthorityFields({
          side: "BUY",
          type: "MARKET",
          assetSymbol: "AURA",
          quantity: 1,
          idempotencyKey: "k2",
          cashAfter: 50000,
        });
      }).toThrowError(AppError);
    });

    it("rejects client-provided positionAfter with 400 VALIDATION_ERROR", () => {
      expect(() => {
        assertNoOrderAuthorityFields({
          side: "BUY",
          type: "MARKET",
          assetSymbol: "AURA",
          quantity: 1,
          idempotencyKey: "k3",
          positionAfter: 100,
        });
      }).toThrowError(AppError);
    });

    it("rejects client-provided status with 400 VALIDATION_ERROR", () => {
      expect(() => {
        assertNoOrderAuthorityFields({
          side: "BUY",
          type: "MARKET",
          assetSymbol: "AURA",
          quantity: 1,
          idempotencyKey: "k4",
          status: "FILLED",
        });
      }).toThrowError(AppError);
    });

    it("rejects client-provided userId with 400 VALIDATION_ERROR", () => {
      expect(() => {
        assertNoOrderAuthorityFields({
          side: "BUY",
          type: "MARKET",
          assetSymbol: "AURA",
          quantity: 1,
          idempotencyKey: "k5",
          userId: "hacker-user-id",
        });
      }).toThrowError(AppError);
    });

    it("rejects client-provided cycle with 400 VALIDATION_ERROR", () => {
      expect(() => {
        assertNoOrderAuthorityFields({
          side: "BUY",
          type: "MARKET",
          assetSymbol: "AURA",
          quantity: 1,
          idempotencyKey: "k6",
          currentCycle: 2,
        });
      }).toThrowError(AppError);
    });

    it("passes cleanly when no forbidden authority fields are present", () => {
      expect(() => {
        assertNoOrderAuthorityFields({
          side: "BUY",
          type: "MARKET",
          assetSymbol: "AURA",
          quantity: 1,
          idempotencyKey: "k7",
        });
      }).not.toThrow();
    });
  });

  describe("T002 / AC-005: Canonical Request Fingerprint Determinism", () => {
    it("produces identical SHA-256 fingerprint for identical intent parameters", () => {
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
      expect(typeof fp1).toBe("string");
      expect(fp1.length).toBe(64); // SHA-256 hex string
    });

    it("produces identical fingerprint regardless of case or whitespace in asset symbol", () => {
      const fp1 = generateOrderFingerprint({
        side: "BUY",
        type: "MARKET",
        assetSymbol: "aura",
        quantity: 10,
      });

      const fp2 = generateOrderFingerprint({
        side: "BUY",
        type: "MARKET",
        assetSymbol: " AURA ",
        quantity: 10,
      });

      expect(fp1).toBe(fp2);
    });

    it("produces different fingerprint when quantity differs", () => {
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
        quantity: 20,
      });

      expect(fp1).not.toBe(fp2);
    });

    it("produces different fingerprint when side differs", () => {
      const fp1 = generateOrderFingerprint({
        side: "BUY",
        type: "MARKET",
        assetSymbol: "AURA",
        quantity: 10,
      });

      const fp2 = generateOrderFingerprint({
        side: "SELL",
        type: "MARKET",
        assetSymbol: "AURA",
        quantity: 10,
      });

      expect(fp1).not.toBe(fp2);
    });

    it("produces different fingerprint when assetSymbol differs", () => {
      const fp1 = generateOrderFingerprint({
        side: "BUY",
        type: "MARKET",
        assetSymbol: "AURA",
        quantity: 10,
      });

      const fp2 = generateOrderFingerprint({
        side: "BUY",
        type: "MARKET",
        assetSymbol: "SOL",
        quantity: 10,
      });

      expect(fp1).not.toBe(fp2);
    });
  });

  describe("T009 / AC-016: Response DTO Serialization", () => {
    it("serializes a BUY order response with simulated: true and exact decimal strings", () => {
      const now = new Date("2026-09-16T10:00:00.000Z");
      const rawOrder = {
        id: "order-123",
        sessionId: "session-456",
        userId: "user-789",
        assetId: "asset-aura",
        side: "BUY",
        type: "MARKET",
        quantity: 10,
        status: "FILLED",
        idempotencyKey: "key-1",
        requestFingerprint: "fp-1",
        rejectionCode: null,
        executionPrice: new Prisma.Decimal("150.250000"),
        executedQuantity: 10,
        submittedAt: now,
        filledAt: now,
        createdAt: now,
        updatedAt: now,
        asset: {
          id: "asset-aura",
          symbol: "AURA",
          name: "Aura Network",
          assetType: "EQUITY",
          status: "ACTIVE",
          displayOrder: 1,
          createdAt: now,
          updatedAt: now,
        },
        trade: {
          id: "trade-1",
          orderId: "order-123",
          sessionId: "session-456",
          assetId: "asset-aura",
          side: "BUY",
          quantity: 10,
          executionPrice: new Prisma.Decimal("150.250000"),
          notional: new Prisma.Decimal("1502.5000"),
          realizedPnl: new Prisma.Decimal("0.0000"),
          executedAt: now,
          createdAt: now,
        },
      };

      const dto = toSimulationOrderResponseDto(rawOrder, "AURA", false);

      expect(dto).toEqual({
        id: "order-123",
        side: "BUY",
        type: "MARKET",
        assetSymbol: "AURA",
        quantity: 10,
        status: "FILLED",
        executionPrice: "150.250000",
        executedQuantity: 10,
        realizedPnl: "0.0000",
        submittedAt: "2026-09-16T10:00:00.000Z",
        filledAt: "2026-09-16T10:00:00.000Z",
        simulated: true,
      });
      expect(dto.isReplay).toBeUndefined();
    });

    it("serializes a SELL order response with realized PnL and replay indicator", () => {
      const now = new Date("2026-09-16T10:00:00.000Z");
      const rawOrder = {
        id: "order-sell-1",
        sessionId: "session-456",
        userId: "user-789",
        assetId: "asset-aura",
        side: "SELL",
        type: "MARKET",
        quantity: 5,
        status: "FILLED",
        idempotencyKey: "key-sell",
        requestFingerprint: "fp-sell",
        rejectionCode: null,
        executionPrice: new Prisma.Decimal("200.000000"),
        executedQuantity: 5,
        submittedAt: now,
        filledAt: now,
        createdAt: now,
        updatedAt: now,
        asset: {
          id: "asset-aura",
          symbol: "AURA",
          name: "Aura Network",
          assetType: "EQUITY",
          status: "ACTIVE",
          displayOrder: 1,
          createdAt: now,
          updatedAt: now,
        },
        trade: {
          id: "trade-sell-1",
          orderId: "order-sell-1",
          sessionId: "session-456",
          assetId: "asset-aura",
          side: "SELL",
          quantity: 5,
          executionPrice: new Prisma.Decimal("200.000000"),
          notional: new Prisma.Decimal("1000.0000"),
          realizedPnl: new Prisma.Decimal("250.0000"),
          executedAt: now,
          createdAt: now,
        },
      };

      const dto = toSimulationOrderResponseDto(rawOrder, "AURA", true);

      expect(dto.realizedPnl).toBe("250.0000");
      expect(dto.isReplay).toBe(true);
      expect(dto.simulated).toBe(true);
    });
  });

  describe("SimulationOrderService: Mock Unit Scenarios", () => {
    let mockOrderRepo: ISimulationOrderRepository;
    let mockTradeRepo: ISimulationTradeRepository;
    let mockPortfolioRepo: ISimulationPortfolioRepository;
    let mockSessionRepo: ISimulationSessionRepository;
    let mockAssetRepo: ISimulationAssetRepository;
    let mockSnapshotRepo: ISimulationMarketSnapshotRepository;
    let mockTxRunner: ITransactionRunner;
    let service: SimulationOrderService;

    const testUserId = "user-111";
    const testSessionId = "00000000-0000-0000-0000-000000000001";

    beforeEach(() => {
      mockOrderRepo = {
        createOrder: vi.fn(),
        findOrderById: vi.fn(),
        findOrderByUserSessionIdempotencyKey: vi.fn(),
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
        findPortfolioBySessionId: vi.fn(),
        findPortfolioById: vi.fn(),
        updateCashBalance: vi.fn(),
        updateRealizedPnl: vi.fn(),
        updatePortfolioAccounting: vi.fn(),
        createPosition: vi.fn(),
        findPosition: vi.fn(),
        listPositions: vi.fn(),
        upsertPosition: vi.fn(),
        findPortfolioBySessionIdForUpdate: vi.fn(),
        findPositionForUpdate: vi.fn(),
        deletePosition: vi.fn(),
      };

      mockSessionRepo = {
        createSession: vi.fn(),
        findSessionById: vi.fn(),
        findActiveSessionByUserId: vi.fn(),
        listSessionsByUserId: vi.fn(),
        updateSessionStatus: vi.fn(),
        advanceCycle: vi.fn(),
      };

      mockAssetRepo = {
        createAsset: vi.fn(),
        findAssetById: vi.fn(),
        findAssetBySymbol: vi.fn(),
        listAssets: vi.fn(),
      };

      mockSnapshotRepo = {
        createSnapshot: vi.fn(),
        findSnapshot: vi.fn(),
        listSnapshotsByScenarioCycle: vi.fn(),
      };

      mockTxRunner = {
        run: vi.fn().mockImplementation(async (callback) => {
          return callback({
            id: "mock-tx-id",
            tx: {} as unknown as Prisma.TransactionClient,
            repositories: {
              simulationOrderRepo: mockOrderRepo,
              simulationTradeRepo: mockTradeRepo,
              simulationPortfolioRepo: mockPortfolioRepo,
              simulationSessionRepo: mockSessionRepo,
              simulationAssetRepo: mockAssetRepo,
              simulationSnapshotRepo: mockSnapshotRepo,
            } as unknown as IRepositoryContainer,
            depth: 1,
            isCompleted: false,
          });
        }),
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

    it("rejects order when session is not found", async () => {
      vi.spyOn(mockOrderRepo, "findOrderByUserSessionIdempotencyKey").mockResolvedValue(null);
      vi.spyOn(mockSessionRepo, "findSessionById").mockResolvedValue(null);

      await expect(
        service.submitMarketOrder(testUserId, testSessionId, {
          side: "BUY",
          type: "MARKET",
          assetSymbol: "AURA",
          quantity: 1,
          idempotencyKey: "k-nf",
        }),
      ).rejects.toThrow("Simulation session not found");
    });

    it("rejects order when session is not in ACTIVE status", async () => {
      vi.spyOn(mockOrderRepo, "findOrderByUserSessionIdempotencyKey").mockResolvedValue(null);
      vi.spyOn(mockSessionRepo, "findSessionById").mockResolvedValue({
        id: testSessionId,
        userId: testUserId,
        scenarioId: "sc-1",
        status: "CREATED",
        startingCash: new Prisma.Decimal("100000.0000"),
        currentCycle: 1,
        startedAt: null,
        completedAt: null,
        cancelledAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await expect(
        service.submitMarketOrder(testUserId, testSessionId, {
          side: "BUY",
          type: "MARKET",
          assetSymbol: "AURA",
          quantity: 1,
          idempotencyKey: "k-not-active",
        }),
      ).rejects.toThrow("Cannot place orders on simulation session in status: CREATED");
    });

    it("rejects order when asset is unknown", async () => {
      vi.spyOn(mockOrderRepo, "findOrderByUserSessionIdempotencyKey").mockResolvedValue(null);
      vi.spyOn(mockSessionRepo, "findSessionById").mockResolvedValue({
        id: testSessionId,
        userId: testUserId,
        scenarioId: "sc-1",
        status: "ACTIVE",
        startingCash: new Prisma.Decimal("100000.0000"),
        currentCycle: 1,
        startedAt: new Date(),
        completedAt: null,
        cancelledAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      vi.spyOn(mockAssetRepo, "findAssetBySymbol").mockResolvedValue(null);

      await expect(
        service.submitMarketOrder(testUserId, testSessionId, {
          side: "BUY",
          type: "MARKET",
          assetSymbol: "UNKNOWN",
          quantity: 1,
          idempotencyKey: "k-unknown",
        }),
      ).rejects.toThrow("Asset 'UNKNOWN' is not available for trading");
    });

    it("replays existing order when same key and same payload are provided", async () => {
      const now = new Date();
      const existingOrder = {
        id: "order-existing",
        sessionId: testSessionId,
        userId: testUserId,
        assetId: "asset-aura",
        side: "BUY",
        type: "MARKET",
        quantity: 10,
        status: "FILLED",
        idempotencyKey: "k-replay",
        requestFingerprint: generateOrderFingerprint({
          side: "BUY",
          type: "MARKET",
          assetSymbol: "AURA",
          quantity: 10,
        }),
        rejectionCode: null,
        executionPrice: new Prisma.Decimal("100.000000"),
        executedQuantity: 10,
        submittedAt: now,
        filledAt: now,
        createdAt: now,
        updatedAt: now,
        asset: {
          id: "asset-aura",
          symbol: "AURA",
          name: "Aura Network",
          assetType: "EQUITY",
          status: "ACTIVE",
          displayOrder: 1,
          createdAt: now,
          updatedAt: now,
        },
        trade: null,
      };

      vi.spyOn(mockOrderRepo, "findOrderByUserSessionIdempotencyKey").mockResolvedValue(existingOrder);

      const result = await service.submitMarketOrder(testUserId, testSessionId, {
        side: "BUY",
        type: "MARKET",
        assetSymbol: "AURA",
        quantity: 10,
        idempotencyKey: "k-replay",
      });

      expect(result.id).toBe("order-existing");
      expect(result.isReplay).toBe(true);
      expect(mockTxRunner.run).not.toHaveBeenCalled();
    });

    it("throws 409 IDEMPOTENCY_CONFLICT when same key is reused with different payload", async () => {
      const now = new Date();
      const existingOrder = {
        id: "order-conflict",
        sessionId: testSessionId,
        userId: testUserId,
        assetId: "asset-aura",
        side: "BUY",
        type: "MARKET",
        quantity: 10,
        status: "FILLED",
        idempotencyKey: "k-conflict",
        requestFingerprint: generateOrderFingerprint({
          side: "BUY",
          type: "MARKET",
          assetSymbol: "AURA",
          quantity: 10,
        }),
        rejectionCode: null,
        executionPrice: new Prisma.Decimal("100.000000"),
        executedQuantity: 10,
        submittedAt: now,
        filledAt: now,
        createdAt: now,
        updatedAt: now,
      };

      vi.spyOn(mockOrderRepo, "findOrderByUserSessionIdempotencyKey").mockResolvedValue(existingOrder);

      await expect(
        service.submitMarketOrder(testUserId, testSessionId, {
          side: "BUY",
          type: "MARKET",
          assetSymbol: "AURA",
          quantity: 20, // Different quantity!
          idempotencyKey: "k-conflict",
        }),
      ).rejects.toThrow("Idempotency key has already been used with a different request payload");
    });
  });
});
