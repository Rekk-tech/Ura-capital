import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { PrismaClient, Prisma } from "@prisma/client";
import { assertSafeTestDatabase, sanitizeDiagnosticMessage, cleanAllTestTables } from "../helpers/test-db-guard.js";
import {
  createRepositoryContainer,
  type IRepositoryContainer,
} from "../../src/infrastructure/database/repository-factory.js";
import { SimulationOrderService } from "../../src/modules/simulation/simulation-order.service.js";
import { SimulationAccountingService } from "../../src/modules/simulation/simulation-accounting.service.js";
import { transactionRunner } from "../../src/infrastructure/database/transaction-runner.js";
import { AppError } from "../../src/shared/errors/error-envelope.js";
import { ERROR_CODES, HTTP_STATUS } from "@aura/shared";

describe("FEAT-035: Market Order Submission & Execution (Live PostgreSQL)", () => {
  const testDbUrl =
    process.env.TEST_DATABASE_URL ||
    process.env.DATABASE_URL ||
    "postgresql://postgres:postgrespassword@localhost:5432/aura_capital_test_feat019_rework2_fresh";

  let prisma: PrismaClient;
  let repos: IRepositoryContainer;
  let orderService: SimulationOrderService;
  let accountingService: SimulationAccountingService;

  let testUser: { id: string; email: string };
  let otherUser: { id: string; email: string };
  let scenario: { id: string; key: string };
  let assetAura: { id: string; symbol: string };
  let assetSol: { id: string; symbol: string };

  beforeAll(async () => {
    assertSafeTestDatabase(testDbUrl, "test");
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: testDbUrl,
        },
      },
    });

    try {
      await prisma.$connect();
      repos = createRepositoryContainer(prisma);
      accountingService = new SimulationAccountingService(
        repos.simulationPortfolioRepo,
        repos.simulationSessionRepo,
        transactionRunner,
      );
      orderService = new SimulationOrderService(
        repos.simulationOrderRepo,
        repos.simulationTradeRepo,
        repos.simulationPortfolioRepo,
        repos.simulationSessionRepo,
        repos.simulationAssetRepo,
        repos.simulationMarketSnapshotRepo,
        transactionRunner,
      );
    } catch (err: unknown) {
      const errorMessage = sanitizeDiagnosticMessage(err instanceof Error ? err.message : String(err));
      throw new Error(`[DB_CONNECTION_FAILED] Required PostgreSQL test database unreachable: ${errorMessage}`);
    }
  });

  afterAll(async () => {
    if (prisma) {
      await cleanAllTestTables(prisma);
      await prisma.$disconnect();
    }
  });

  beforeEach(async () => {
    await cleanAllTestTables(prisma);

    testUser = await prisma.user.create({
      data: {
        email: `trader-${Date.now()}-${Math.random()}@test.com`,
        displayName: "Test Trader",
        status: "ACTIVE",
      },
    });

    otherUser = await prisma.user.create({
      data: {
        email: `other-${Date.now()}-${Math.random()}@test.com`,
        displayName: "Other Trader",
        status: "ACTIVE",
      },
    });

    scenario = await repos.simulationScenarioRepo.createScenario({
      key: "DEFAULT",
      name: "Default Simulation Scenario",
      status: "ACTIVE",
    });

    assetAura = await repos.simulationAssetRepo.createAsset({
      symbol: "AURA",
      name: "Aura Network",
      assetType: "EQUITY",
      status: "ACTIVE",
      displayOrder: 1,
    });

    assetSol = await repos.simulationAssetRepo.createAsset({
      symbol: "SOL",
      name: "Solana",
      assetType: "EQUITY",
      status: "ACTIVE",
      displayOrder: 2,
    });

    // Market snapshots for Cycle 1
    await repos.simulationMarketSnapshotRepo.createSnapshot({
      scenarioId: scenario.id,
      assetId: assetAura.id,
      cycle: 1,
      price: new Prisma.Decimal("100.000000"),
      occurredAt: new Date(),
    });

    await repos.simulationMarketSnapshotRepo.createSnapshot({
      scenarioId: scenario.id,
      assetId: assetSol.id,
      cycle: 1,
      price: new Prisma.Decimal("50.000000"),
      occurredAt: new Date(),
    });
  });

  async function createActiveSessionWithCash(userId: string, startingCash = "100000.0000") {
    const session = await repos.simulationSessionRepo.createSession({
      userId,
      scenarioId: scenario.id,
      status: "ACTIVE",
      startingCash,
      currentCycle: 1,
      startedAt: new Date(),
    });

    const portfolio = await accountingService.initializePortfolio(session.id, startingCash);
    return { session, portfolio };
  }

  describe("AC-009, AC-010: BUY Order Execution & Atomic Accounting", () => {
    it("executes valid MARKET BUY atomically: writes order, trade, decreases cash, updates position & average cost", async () => {
      const { session, portfolio } = await createActiveSessionWithCash(testUser.id, "10000.0000");

      const response = await orderService.submitMarketOrder(testUser.id, session.id, {
        side: "BUY",
        type: "MARKET",
        assetSymbol: "AURA",
        quantity: 10,
        idempotencyKey: "buy-key-1",
      });

      expect(response.id).toBeDefined();
      expect(response.side).toBe("BUY");
      expect(response.type).toBe("MARKET");
      expect(response.status).toBe("FILLED");
      expect(response.executionPrice).toBe("100.000000"); // Authoritative snapshot price
      expect(response.executedQuantity).toBe(10);
      expect(response.realizedPnl).toBe("0.0000");
      expect(response.simulated).toBe(true);

      // Verify PostgreSQL DB state
      const updatedPortfolio = await repos.simulationPortfolioRepo.findPortfolioById(portfolio.id);
      expect(updatedPortfolio).not.toBeNull();
      // Cash: 10000.0000 - (10 * 100.000000) = 9000.0000
      expect(updatedPortfolio!.cashBalance.toFixed(4)).toBe("9000.0000");

      const position = await repos.simulationPortfolioRepo.findPosition(portfolio.id, assetAura.id);
      expect(position).not.toBeNull();
      expect(position!.quantity).toBe(10);
      expect(position!.averageCost.toFixed(6)).toBe("100.000000");

      // Verify Order record in DB
      const orderInDb = await repos.simulationOrderRepo.findOrderById(response.id);
      expect(orderInDb).not.toBeNull();
      expect(orderInDb!.status).toBe("FILLED");
      expect(orderInDb!.executionPrice?.toFixed(6)).toBe("100.000000");
      expect(orderInDb!.executedQuantity).toBe(10);
      expect(orderInDb!.filledAt).not.toBeNull();

      // Verify Trade record in DB
      const tradeInDb = await repos.simulationTradeRepo.findTradeByOrderId(response.id);
      expect(tradeInDb).not.toBeNull();
      expect(tradeInDb!.side).toBe("BUY");
      expect(tradeInDb!.quantity).toBe(10);
      expect(tradeInDb!.notional.toFixed(4)).toBe("1000.0000");
      expect(tradeInDb!.realizedPnl.toFixed(4)).toBe("0.0000");
    });

    it("updates weighted-average cost correctly on multiple BUY executions", async () => {
      const { session, portfolio } = await createActiveSessionWithCash(testUser.id, "50000.0000");

      // 1st BUY: 10 shares @ 100.000000
      await orderService.submitMarketOrder(testUser.id, session.id, {
        side: "BUY",
        type: "MARKET",
        assetSymbol: "AURA",
        quantity: 10,
        idempotencyKey: "buy-weighted-1",
      });

      // Advance cycle or update snapshot price to 200.000000
      await prisma.simulationMarketSnapshot.update({
        where: {
          scenarioId_cycle_assetId: {
            scenarioId: scenario.id,
            cycle: 1,
            assetId: assetAura.id,
          },
        },
        data: { price: new Prisma.Decimal("200.000000") },
      });

      // 2nd BUY: 10 shares @ 200.000000
      await orderService.submitMarketOrder(testUser.id, session.id, {
        side: "BUY",
        type: "MARKET",
        assetSymbol: "AURA",
        quantity: 10,
        idempotencyKey: "buy-weighted-2",
      });

      const pos = await repos.simulationPortfolioRepo.findPosition(portfolio.id, assetAura.id);
      expect(pos).not.toBeNull();
      expect(pos!.quantity).toBe(20);
      // (10 * 100 + 10 * 200) / 20 = 3000 / 20 = 150.000000
      expect(pos!.averageCost.toFixed(6)).toBe("150.000000");

      const port = await repos.simulationPortfolioRepo.findPortfolioById(portfolio.id);
      // 50000 - 1000 - 2000 = 47000.0000
      expect(port!.cashBalance.toFixed(4)).toBe("47000.0000");
    });
  });

  describe("AC-011: BUY Rejection Scenarios", () => {
    it("rejects BUY with 409 CONFLICT INSUFFICIENT_CASH when cash is inadequate", async () => {
      const { session, portfolio } = await createActiveSessionWithCash(testUser.id, "500.0000");

      // 10 AURA @ 100 = 1000 > 500
      await expect(
        orderService.submitMarketOrder(testUser.id, session.id, {
          side: "BUY",
          type: "MARKET",
          assetSymbol: "AURA",
          quantity: 10,
          idempotencyKey: "buy-insufficient-cash",
        }),
      ).rejects.toThrowError(AppError);

      try {
        await orderService.submitMarketOrder(testUser.id, session.id, {
          side: "BUY",
          type: "MARKET",
          assetSymbol: "AURA",
          quantity: 10,
          idempotencyKey: "buy-insufficient-cash",
        });
      } catch (err) {
        expect(err).toBeInstanceOf(AppError);
        const appErr = err as AppError;
        expect(appErr.code).toBe(ERROR_CODES.INSUFFICIENT_CASH);
        expect(appErr.statusCode).toBe(HTTP_STATUS.CONFLICT);
      }

      // Assert zero mutation
      const port = await repos.simulationPortfolioRepo.findPortfolioById(portfolio.id);
      expect(port!.cashBalance.toFixed(4)).toBe("500.0000");

      const orders = await repos.simulationOrderRepo.listOrdersBySessionId(session.id);
      expect(orders).toHaveLength(0);
    });

    it("rejects BUY when session status is not ACTIVE (SIMULATION_NOT_ACTIVE)", async () => {
      const session = await repos.simulationSessionRepo.createSession({
        userId: testUser.id,
        scenarioId: scenario.id,
        status: "COMPLETED",
        startingCash: "100000.0000",
        currentCycle: 1,
      });
      await accountingService.initializePortfolio(session.id);

      try {
        await orderService.submitMarketOrder(testUser.id, session.id, {
          side: "BUY",
          type: "MARKET",
          assetSymbol: "AURA",
          quantity: 1,
          idempotencyKey: "buy-inactive",
        });
        expect.unreachable("Should have thrown SIMULATION_NOT_ACTIVE");
      } catch (err) {
        expect(err).toBeInstanceOf(AppError);
        const appErr = err as AppError;
        expect(appErr.code).toBe(ERROR_CODES.SIMULATION_NOT_ACTIVE);
        expect(appErr.statusCode).toBe(HTTP_STATUS.CONFLICT);
      }
    });

    it("rejects BUY when asset or market snapshot does not exist", async () => {
      const { session } = await createActiveSessionWithCash(testUser.id);

      try {
        await orderService.submitMarketOrder(testUser.id, session.id, {
          side: "BUY",
          type: "MARKET",
          assetSymbol: "NONEXISTENT",
          quantity: 1,
          idempotencyKey: "buy-no-asset",
        });
        expect.unreachable("Should have thrown ASSET_NOT_AVAILABLE");
      } catch (err) {
        expect(err).toBeInstanceOf(AppError);
        const appErr = err as AppError;
        expect(appErr.code).toBe(ERROR_CODES.ASSET_NOT_AVAILABLE);
        expect(appErr.statusCode).toBe(HTTP_STATUS.BAD_REQUEST);
      }
    });

    it("rejects BUY when User B attempts to place order on User A session (404 NOT_FOUND)", async () => {
      const { session } = await createActiveSessionWithCash(testUser.id);

      await expect(
        orderService.submitMarketOrder(otherUser.id, session.id, {
          side: "BUY",
          type: "MARKET",
          assetSymbol: "AURA",
          quantity: 1,
          idempotencyKey: "buy-stealth",
        }),
      ).rejects.toThrow("Simulation session not found");
    });
  });

  describe("AC-013, AC-014: SELL Order Execution & Realized PnL", () => {
    it("executes partial SELL at profit: updates cash, quantity, realized PnL, preserves average cost", async () => {
      const { session, portfolio } = await createActiveSessionWithCash(testUser.id, "10000.0000");

      // First BUY 10 AURA @ 100.000000 (cost basis = 100.000000, cash = 9000.0000)
      await orderService.submitMarketOrder(testUser.id, session.id, {
        side: "BUY",
        type: "MARKET",
        assetSymbol: "AURA",
        quantity: 10,
        idempotencyKey: "sell-setup-buy",
      });

      // Update snapshot price to 150.000000
      await prisma.simulationMarketSnapshot.update({
        where: {
          scenarioId_cycle_assetId: {
            scenarioId: scenario.id,
            cycle: 1,
            assetId: assetAura.id,
          },
        },
        data: { price: new Prisma.Decimal("150.000000") },
      });

      // Partial SELL: 4 shares @ 150.000000
      // notional = 4 * 150 = 600.0000
      // realizedPnl = (150 - 100) * 4 = 200.0000
      const sellResponse = await orderService.submitMarketOrder(testUser.id, session.id, {
        side: "SELL",
        type: "MARKET",
        assetSymbol: "AURA",
        quantity: 4,
        idempotencyKey: "sell-profit-1",
      });

      expect(sellResponse.status).toBe("FILLED");
      expect(sellResponse.executionPrice).toBe("150.000000");
      expect(sellResponse.executedQuantity).toBe(4);
      expect(sellResponse.realizedPnl).toBe("200.0000");

      // Verify DB Portfolio
      const port = await repos.simulationPortfolioRepo.findPortfolioById(portfolio.id);
      // Cash: 9000 + 600 = 9600.0000
      expect(port!.cashBalance.toFixed(4)).toBe("9600.0000");
      expect(port!.realizedPnl.toFixed(4)).toBe("200.0000");

      // Verify DB Position: 6 remaining, average cost remains 100.000000
      const pos = await repos.simulationPortfolioRepo.findPosition(portfolio.id, assetAura.id);
      expect(pos!.quantity).toBe(6);
      expect(pos!.averageCost.toFixed(6)).toBe("100.000000");

      // Verify DB Trade
      const trade = await repos.simulationTradeRepo.findTradeByOrderId(sellResponse.id);
      expect(trade!.side).toBe("SELL");
      expect(trade!.notional.toFixed(4)).toBe("600.0000");
      expect(trade!.realizedPnl.toFixed(4)).toBe("200.0000");
    });

    it("executes full SELL: retains row with quantity = 0 and preserved cost basis", async () => {
      const { session, portfolio } = await createActiveSessionWithCash(testUser.id, "10000.0000");

      // Buy 5 AURA @ 100.000000
      await orderService.submitMarketOrder(testUser.id, session.id, {
        side: "BUY",
        type: "MARKET",
        assetSymbol: "AURA",
        quantity: 5,
        idempotencyKey: "buy-for-full-sell",
      });

      // Full sell: 5 shares @ 100.000000
      const sellResponse = await orderService.submitMarketOrder(testUser.id, session.id, {
        side: "SELL",
        type: "MARKET",
        assetSymbol: "AURA",
        quantity: 5,
        idempotencyKey: "full-sell-key",
      });

      expect(sellResponse.status).toBe("FILLED");
      expect(sellResponse.realizedPnl).toBe("0.0000");

      const pos = await repos.simulationPortfolioRepo.findPosition(portfolio.id, assetAura.id);
      expect(pos).not.toBeNull();
      expect(pos!.quantity).toBe(0);
      expect(pos!.averageCost.toFixed(6)).toBe("100.000000");
    });

    it("rejects SELL with 409 CONFLICT INSUFFICIENT_POSITION on oversell", async () => {
      const { session, portfolio } = await createActiveSessionWithCash(testUser.id, "10000.0000");

      // Buy 5 shares
      await orderService.submitMarketOrder(testUser.id, session.id, {
        side: "BUY",
        type: "MARKET",
        assetSymbol: "AURA",
        quantity: 5,
        idempotencyKey: "buy-5-shares",
      });

      // Attempt to sell 8 shares (5 owned)
      try {
        await orderService.submitMarketOrder(testUser.id, session.id, {
          side: "SELL",
          type: "MARKET",
          assetSymbol: "AURA",
          quantity: 8,
          idempotencyKey: "oversell-key",
        });
        expect.unreachable("Should have thrown INSUFFICIENT_POSITION");
      } catch (err) {
        expect(err).toBeInstanceOf(AppError);
        const appErr = err as AppError;
        expect(appErr.code).toBe(ERROR_CODES.INSUFFICIENT_POSITION);
        expect(appErr.statusCode).toBe(HTTP_STATUS.CONFLICT);
      }

      // Position stays 5
      const pos = await repos.simulationPortfolioRepo.findPosition(portfolio.id, assetAura.id);
      expect(pos!.quantity).toBe(5);
    });

    it("rejects SELL when position does not exist (0 shares owned)", async () => {
      const { session } = await createActiveSessionWithCash(testUser.id, "10000.0000");

      try {
        await orderService.submitMarketOrder(testUser.id, session.id, {
          side: "SELL",
          type: "MARKET",
          assetSymbol: "SOL",
          quantity: 1,
          idempotencyKey: "sell-unowned",
        });
        expect.unreachable("Should have thrown INSUFFICIENT_POSITION");
      } catch (err) {
        expect(err).toBeInstanceOf(AppError);
        const appErr = err as AppError;
        expect(appErr.code).toBe(ERROR_CODES.INSUFFICIENT_POSITION);
      }
    });
  });

  describe("AC-007, AC-008: Complete Minimum Idempotency", () => {
    it("returns identical result with isReplay: true when same key and same payload are submitted", async () => {
      const { session, portfolio } = await createActiveSessionWithCash(testUser.id, "10000.0000");

      const payload = {
        side: "BUY" as const,
        type: "MARKET" as const,
        assetSymbol: "AURA",
        quantity: 10,
        idempotencyKey: "idem-same-payload",
      };

      const first = await orderService.submitMarketOrder(testUser.id, session.id, payload);
      expect(first.isReplay).toBeFalsy();

      const second = await orderService.submitMarketOrder(testUser.id, session.id, payload);
      expect(second.isReplay).toBe(true);
      expect(second.id).toBe(first.id);
      expect(second.executionPrice).toBe(first.executionPrice);
      expect(second.executedQuantity).toBe(first.executedQuantity);

      // Verify ZERO second trade or duplicate cash deduction
      const port = await repos.simulationPortfolioRepo.findPortfolioById(portfolio.id);
      expect(port!.cashBalance.toFixed(4)).toBe("9000.0000");

      const orders = await repos.simulationOrderRepo.listOrdersBySessionId(session.id);
      expect(orders).toHaveLength(1);

      const trades = await repos.simulationTradeRepo.listTradesBySessionId(session.id);
      expect(trades).toHaveLength(1);
    });

    it("rejects with 409 IDEMPOTENCY_CONFLICT when same key is submitted with differing payload", async () => {
      const { session } = await createActiveSessionWithCash(testUser.id, "10000.0000");

      await orderService.submitMarketOrder(testUser.id, session.id, {
        side: "BUY",
        type: "MARKET",
        assetSymbol: "AURA",
        quantity: 10,
        idempotencyKey: "idem-conflict-key",
      });

      // Second submission with same key but quantity = 20
      try {
        await orderService.submitMarketOrder(testUser.id, session.id, {
          side: "BUY",
          type: "MARKET",
          assetSymbol: "AURA",
          quantity: 20,
          idempotencyKey: "idem-conflict-key",
        });
        expect.unreachable("Should have thrown IDEMPOTENCY_CONFLICT");
      } catch (err) {
        expect(err).toBeInstanceOf(AppError);
        const appErr = err as AppError;
        expect(appErr.code).toBe(ERROR_CODES.IDEMPOTENCY_CONFLICT);
        expect(appErr.statusCode).toBe(HTTP_STATUS.CONFLICT);
      }

      // Zero second execution
      const orders = await repos.simulationOrderRepo.listOrdersBySessionId(session.id);
      expect(orders).toHaveLength(1);
    });
  });

  describe("AC-018: Rollback Integrity", () => {
    it("rolls back all order, trade, and accounting mutations if failure occurs inside transaction", async () => {
      const { session, portfolio } = await createActiveSessionWithCash(testUser.id, "10000.0000");

      // Execute through txRunner with forced failure after mutations
      await expect(
        transactionRunner.run(async (ctx) => {
          await ctx.repositories.simulationPortfolioRepo.updateCashBalance(
            portfolio.id,
            new Prisma.Decimal("5000.0000"),
          );
          await ctx.repositories.simulationPortfolioRepo.upsertPosition(
            portfolio.id,
            assetAura.id,
            10,
            new Prisma.Decimal("100.000000"),
          );
          await ctx.repositories.simulationOrderRepo.createOrder({
            sessionId: session.id,
            userId: testUser.id,
            assetId: assetAura.id,
            side: "BUY",
            type: "MARKET",
            quantity: 10,
            status: "FILLED",
            idempotencyKey: "rollback-test-key",
            requestFingerprint: "fp-rollback",
          });

          throw new AppError(
            "SIMULATED_TRANSACTION_FAILURE",
            ERROR_CODES.INTERNAL_ERROR,
            HTTP_STATUS.INTERNAL_SERVER_ERROR,
          );
        }),
      ).rejects.toThrow("SIMULATED_TRANSACTION_FAILURE");

      // Verify clean rollback: cash is unchanged, position does not exist, order does not exist
      const port = await repos.simulationPortfolioRepo.findPortfolioById(portfolio.id);
      expect(port!.cashBalance.toFixed(4)).toBe("10000.0000");

      const pos = await repos.simulationPortfolioRepo.findPosition(portfolio.id, assetAura.id);
      expect(pos).toBeNull();

      const orders = await repos.simulationOrderRepo.listOrdersBySessionId(session.id);
      expect(orders).toHaveLength(0);
    });
  });

  describe("CRITICAL HARD GATES: Concurrency Safety (Live PostgreSQL)", () => {
    it("prevents overspend: 5 concurrent BUY attempts against constrained cash execute at most legal combination", async () => {
      // Cash = $100.0000
      // 5 concurrent BUYs of 80 shares @ $1.000000 = $80.0000 each.
      // Cash can only satisfy exactly 1 order ($80.0000), remaining 4 must fail with INSUFFICIENT_CASH.
      const { session, portfolio } = await createActiveSessionWithCash(testUser.id, "100.0000");

      // Update AURA snapshot price to 1.000000
      await prisma.simulationMarketSnapshot.update({
        where: {
          scenarioId_cycle_assetId: {
            scenarioId: scenario.id,
            cycle: 1,
            assetId: assetAura.id,
          },
        },
        data: { price: new Prisma.Decimal("1.000000") },
      });

      const attempts = [1, 2, 3, 4, 5].map((idx) =>
        orderService.submitMarketOrder(testUser.id, session.id, {
          side: "BUY",
          type: "MARKET",
          assetSymbol: "AURA",
          quantity: 80,
          idempotencyKey: `concurrent-overspend-${idx}`,
        }),
      );

      const results = await Promise.allSettled(attempts);

      const fulfilled = results.filter((r) => r.status === "fulfilled");
      const rejected = results.filter((r) => r.status === "rejected");

      // Exactly 1 order must succeed, 4 must fail
      expect(fulfilled).toHaveLength(1);
      expect(rejected).toHaveLength(4);

      // Verify error code on all rejected attempts
      for (const rej of rejected) {
        const err = (rej as PromiseRejectedResult).reason;
        expect(err).toBeInstanceOf(AppError);
        expect((err as AppError).code).toBe(ERROR_CODES.INSUFFICIENT_CASH);
      }

      // Verify PostgreSQL state: cash is exact 20.0000, never negative
      const finalPort = await repos.simulationPortfolioRepo.findPortfolioById(portfolio.id);
      expect(finalPort!.cashBalance.toFixed(4)).toBe("20.0000");

      const finalPos = await repos.simulationPortfolioRepo.findPosition(portfolio.id, assetAura.id);
      expect(finalPos!.quantity).toBe(80);

      const orders = await repos.simulationOrderRepo.listOrdersBySessionId(session.id);
      expect(orders).toHaveLength(1);
    });

    it("prevents oversell: 5 concurrent SELL attempts against constrained position execute at most legal combination", async () => {
      // Setup: user owns exactly 10 shares of AURA.
      // 5 concurrent SELLs of 8 shares each.
      // Position can only satisfy exactly 1 order (8 shares), remaining 4 must fail with INSUFFICIENT_POSITION.
      const { session, portfolio } = await createActiveSessionWithCash(testUser.id, "10000.0000");

      await orderService.submitMarketOrder(testUser.id, session.id, {
        side: "BUY",
        type: "MARKET",
        assetSymbol: "AURA",
        quantity: 10,
        idempotencyKey: "setup-oversell-position",
      });

      const attempts = [1, 2, 3, 4, 5].map((idx) =>
        orderService.submitMarketOrder(testUser.id, session.id, {
          side: "SELL",
          type: "MARKET",
          assetSymbol: "AURA",
          quantity: 8,
          idempotencyKey: `concurrent-oversell-${idx}`,
        }),
      );

      const results = await Promise.allSettled(attempts);

      const fulfilled = results.filter((r) => r.status === "fulfilled");
      const rejected = results.filter((r) => r.status === "rejected");

      // Exactly 1 SELL succeeds, 4 fail
      expect(fulfilled).toHaveLength(1);
      expect(rejected).toHaveLength(4);

      for (const rej of rejected) {
        const err = (rej as PromiseRejectedResult).reason;
        expect(err).toBeInstanceOf(AppError);
        expect((err as AppError).code).toBe(ERROR_CODES.INSUFFICIENT_POSITION);
      }

      // Position quantity is exact 2 (10 - 8 = 2), never negative
      const pos = await repos.simulationPortfolioRepo.findPosition(portfolio.id, assetAura.id);
      expect(pos!.quantity).toBe(2);
    });

    it("handles 5 concurrent requests with the SAME idempotency key: exactly 1 execution, 0 duplicates", async () => {
      const { session, portfolio } = await createActiveSessionWithCash(testUser.id, "10000.0000");

      const samePayload = {
        side: "BUY" as const,
        type: "MARKET" as const,
        assetSymbol: "AURA",
        quantity: 10,
        idempotencyKey: "concurrent-same-key-001",
      };

      // Fire 5 identical requests concurrently
      const promises = [1, 2, 3, 4, 5].map(() =>
        orderService.submitMarketOrder(testUser.id, session.id, samePayload),
      );

      const results = await Promise.allSettled(promises);

      const fulfilled = results.filter(
        (r): r is PromiseFulfilledResult<{ id: string }> => r.status === "fulfilled",
      );
      expect(fulfilled).toHaveLength(5);

      // All 5 return the same order id
      const orderIds = new Set(fulfilled.map((f) => f.value.id));
      expect(orderIds.size).toBe(1);

      // DB verification: exactly 1 order row, 1 trade row
      const orders = await repos.simulationOrderRepo.listOrdersBySessionId(session.id);
      expect(orders).toHaveLength(1);

      const trades = await repos.simulationTradeRepo.listTradesBySessionId(session.id);
      expect(trades).toHaveLength(1);

      // Cash deducted exactly once (10000 - 1000 = 9000)
      const port = await repos.simulationPortfolioRepo.findPortfolioById(portfolio.id);
      expect(port!.cashBalance.toFixed(4)).toBe("9000.0000");
    });
  });
});
