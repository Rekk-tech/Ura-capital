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

describe("FEAT-036: Order Idempotency & Concurrency Adversarial Hardening (Live PostgreSQL)", () => {
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
        email: `trader-adv-${Date.now()}-${Math.random()}@test.com`,
        displayName: "Adversarial Trader",
        status: "ACTIVE",
      },
    });

    otherUser = await prisma.user.create({
      data: {
        email: `other-adv-${Date.now()}-${Math.random()}@test.com`,
        displayName: "Other Adversarial Trader",
        status: "ACTIVE",
      },
    });

    scenario = await repos.simulationScenarioRepo.createScenario({
      key: `SCENARIO-${Date.now()}`,
      name: "Adversarial Hardening Scenario",
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

    // Authoritative market snapshots for Cycle 1: AURA = 100.000000, SOL = 50.000000
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

  // =========================================================================
  // AC-002 / T002: Same-Key High-Contention Concurrent Identical Requests
  // =========================================================================
  describe("AC-002 / T002: Same-Key Concurrent Identical Requests", () => {
    it("runs 10 concurrent identical submissions with same key: exactly 1 DB execution, all callers get 200 OK, zero duplicate mutation", async () => {
      const { session, portfolio } = await createActiveSessionWithCash(testUser.id, "100000.0000");
      const sharedKey = `idemp-same-key-10x-${Date.now()}`;

      // 10 concurrent identical BUY requests
      const requests = Array.from({ length: 10 }, () =>
        orderService.submitMarketOrder(testUser.id, session.id, {
          side: "BUY",
          type: "MARKET",
          assetSymbol: "AURA",
          quantity: 10,
          idempotencyKey: sharedKey,
        }),
      );

      const results = await Promise.all(requests);

      // All 10 callers receive successful responses
      expect(results).toHaveLength(10);
      const firstResult = results[0];
      expect(firstResult).toBeDefined();

      for (const res of results) {
        expect(res.id).toBe(firstResult.id);
        expect(res.side).toBe("BUY");
        expect(res.type).toBe("MARKET");
        expect(res.status).toBe("FILLED");
        expect(res.executionPrice).toBe("100.000000");
        expect(res.executedQuantity).toBe(10);
        expect(res.simulated).toBe(true);
      }

      // Exactly 1 order record in PostgreSQL
      const ordersInDb = await prisma.simulationOrder.findMany({
        where: {
          sessionId: session.id,
          idempotencyKey: sharedKey,
        },
      });
      expect(ordersInDb).toHaveLength(1);
      expect(ordersInDb[0].id).toBe(firstResult.id);

      // Exactly 1 trade record in PostgreSQL
      const tradesInDb = await prisma.simulationTrade.findMany({
        where: {
          orderId: firstResult.id,
        },
      });
      expect(tradesInDb).toHaveLength(1);
      expect(Number(tradesInDb[0].notional).toFixed(4)).toBe("1000.0000");

      // Portfolio mutated exactly once: cash = 100000 - 1000 = 99000
      const updatedPortfolio = await repos.simulationPortfolioRepo.findPortfolioById(portfolio.id);
      expect(updatedPortfolio!.cashBalance.toFixed(4)).toBe("99000.0000");

      // Position mutated exactly once: 10 shares @ 100.000000
      const position = await repos.simulationPortfolioRepo.findPosition(portfolio.id, assetAura.id);
      expect(position!.quantity).toBe(10);
      expect(position!.averageCost.toFixed(6)).toBe("100.000000");
    });
  });

  // =========================================================================
  // AC-003 / T003: Same-Key Concurrent Conflicting Requests Race
  // =========================================================================
  describe("AC-003 / T003: Same-Key Concurrent Conflicting Requests Race", () => {
    it("rejects conflicting payload under same key with 409 IDEMPOTENCY_CONFLICT and zero second mutation (different quantity)", async () => {
      const { session, portfolio } = await createActiveSessionWithCash(testUser.id, "50000.0000");
      const conflictKey = `conflict-qty-${Date.now()}`;

      // Race BUY 10 AURA vs BUY 20 AURA under identical idempotencyKey
      const [resA, resB] = await Promise.allSettled([
        orderService.submitMarketOrder(testUser.id, session.id, {
          side: "BUY",
          type: "MARKET",
          assetSymbol: "AURA",
          quantity: 10,
          idempotencyKey: conflictKey,
        }),
        orderService.submitMarketOrder(testUser.id, session.id, {
          side: "BUY",
          type: "MARKET",
          assetSymbol: "AURA",
          quantity: 20,
          idempotencyKey: conflictKey,
        }),
      ]);

      const fulfilled = [resA, resB].filter((r) => r.status === "fulfilled");
      const rejected = [resA, resB].filter((r) => r.status === "rejected");

      expect(fulfilled).toHaveLength(1);
      expect(rejected).toHaveLength(1);

      const err = (rejected[0] as PromiseRejectedResult).reason as AppError;
      expect(err).toBeInstanceOf(AppError);
      expect(err.statusCode).toBe(HTTP_STATUS.CONFLICT);
      expect(err.code).toBe(ERROR_CODES.IDEMPOTENCY_CONFLICT);
      expect(err.message).toContain("Idempotency key has already been used with a different request payload");

      // DB verification: exactly 1 order row exists
      const ordersInDb = await prisma.simulationOrder.findMany({
        where: {
          sessionId: session.id,
          idempotencyKey: conflictKey,
        },
      });
      expect(ordersInDb).toHaveLength(1);

      // Verify cash reflects ONLY the winner
      const winningQty = ordersInDb[0].quantity;
      const expectedCash = 50000 - winningQty * 100;
      const updatedPortfolio = await repos.simulationPortfolioRepo.findPortfolioById(portfolio.id);
      expect(updatedPortfolio!.cashBalance.toFixed(4)).toBe(expectedCash.toFixed(4));
    });

    it("rejects conflicting payload under same key with 409 IDEMPOTENCY_CONFLICT (BUY vs SELL)", async () => {
      const { session } = await createActiveSessionWithCash(testUser.id, "50000.0000");

      // Seed 10 shares of AURA so both BUY and SELL are valid actions
      await orderService.submitMarketOrder(testUser.id, session.id, {
        side: "BUY",
        type: "MARKET",
        assetSymbol: "AURA",
        quantity: 10,
        idempotencyKey: `seed-side-pos-${Date.now()}`,
      });

      const conflictKey = `conflict-side-${Date.now()}`;

      const [resA, resB] = await Promise.allSettled([
        orderService.submitMarketOrder(testUser.id, session.id, {
          side: "BUY",
          type: "MARKET",
          assetSymbol: "AURA",
          quantity: 5,
          idempotencyKey: conflictKey,
        }),
        orderService.submitMarketOrder(testUser.id, session.id, {
          side: "SELL",
          type: "MARKET",
          assetSymbol: "AURA",
          quantity: 5,
          idempotencyKey: conflictKey,
        }),
      ]);

      const fulfilled = [resA, resB].filter((r) => r.status === "fulfilled");
      const rejected = [resA, resB].filter((r) => r.status === "rejected");

      expect(fulfilled).toHaveLength(1);
      expect(rejected).toHaveLength(1);

      const err = (rejected[0] as PromiseRejectedResult).reason as AppError;
      expect(err.statusCode).toBe(HTTP_STATUS.CONFLICT);
      expect(err.code).toBe(ERROR_CODES.IDEMPOTENCY_CONFLICT);
    });

    it("rejects conflicting payload under same key with 409 IDEMPOTENCY_CONFLICT (Asset A vs Asset B)", async () => {
      const { session } = await createActiveSessionWithCash(testUser.id, "50000.0000");
      const conflictKey = `conflict-asset-${Date.now()}`;

      const [resA, resB] = await Promise.allSettled([
        orderService.submitMarketOrder(testUser.id, session.id, {
          side: "BUY",
          type: "MARKET",
          assetSymbol: "AURA",
          quantity: 5,
          idempotencyKey: conflictKey,
        }),
        orderService.submitMarketOrder(testUser.id, session.id, {
          side: "BUY",
          type: "MARKET",
          assetSymbol: "SOL",
          quantity: 5,
          idempotencyKey: conflictKey,
        }),
      ]);

      const fulfilled = [resA, resB].filter((r) => r.status === "fulfilled");
      const rejected = [resA, resB].filter((r) => r.status === "rejected");

      expect(fulfilled).toHaveLength(1);
      expect(rejected).toHaveLength(1);

      const err = (rejected[0] as PromiseRejectedResult).reason as AppError;
      expect(err.statusCode).toBe(HTTP_STATUS.CONFLICT);
      expect(err.code).toBe(ERROR_CODES.IDEMPOTENCY_CONFLICT);
    });
  });

  // =========================================================================
  // AC-004 / T004: Transport Failure Replay & Ambiguous Retry
  // =========================================================================
  describe("AC-004 / T004: Transport Failure Replay & Ambiguous Retry", () => {
    it("simulates client transport timeout after commit and subsequent retry returning original deterministic result", async () => {
      const { session, portfolio } = await createActiveSessionWithCash(testUser.id, "25000.0000");
      const replayKey = `transport-replay-${Date.now()}`;

      // 1. Initial submission succeeds and commits to PostgreSQL
      const initialResponse = await orderService.submitMarketOrder(testUser.id, session.id, {
        side: "BUY",
        type: "MARKET",
        assetSymbol: "AURA",
        quantity: 15,
        idempotencyKey: replayKey,
      });

      expect(initialResponse.status).toBe("FILLED");
      expect(initialResponse.isReplay).toBeFalsy();

      // 2. Simulate client timeout / network drop: caller resubmits exact same payload
      const retryResponse1 = await orderService.submitMarketOrder(testUser.id, session.id, {
        side: "BUY",
        type: "MARKET",
        assetSymbol: "AURA",
        quantity: 15,
        idempotencyKey: replayKey,
      });

      expect(retryResponse1.id).toBe(initialResponse.id);
      expect(retryResponse1.isReplay).toBe(true);
      expect(retryResponse1.executionPrice).toBe(initialResponse.executionPrice);
      expect(retryResponse1.executedQuantity).toBe(15);

      // 3. Second retry also returns deterministic replay
      const retryResponse2 = await orderService.submitMarketOrder(testUser.id, session.id, {
        side: "BUY",
        type: "MARKET",
        assetSymbol: "AURA",
        quantity: 15,
        idempotencyKey: replayKey,
      });

      expect(retryResponse2.id).toBe(initialResponse.id);
      expect(retryResponse2.isReplay).toBe(true);

      // 4. Verify DB mutations: EXACTLY ONE execution
      const orders = await prisma.simulationOrder.findMany({
        where: { sessionId: session.id, idempotencyKey: replayKey },
      });
      expect(orders).toHaveLength(1);

      const trades = await prisma.simulationTrade.findMany({
        where: { orderId: initialResponse.id },
      });
      expect(trades).toHaveLength(1);

      const updatedPortfolio = await repos.simulationPortfolioRepo.findPortfolioById(portfolio.id);
      // 25000 - (15 * 100) = 23500
      expect(updatedPortfolio!.cashBalance.toFixed(4)).toBe("23500.0000");
    });
  });

  // =========================================================================
  // AC-005 / T005: High-Contention BUY Overspend Stress (Cash Balance Defense)
  // =========================================================================
  describe("AC-005 / T005: High-Contention Concurrent BUY Overspend Defense", () => {
    it("executes 10 concurrent distinct BUYs competing for finite cash: cash never becomes negative, rejected orders leave zero mutation", async () => {
      // Cash = 1000.0000. Price = 100.000000.
      // Each BUY requests 4 shares = notional 400.0000.
      // Total attempted notional = 10 * 400 = 4000.0000.
      // Only 2 orders can succeed (2 * 400 = 800 <= 1000; remaining 200 < 400).
      const { session, portfolio } = await createActiveSessionWithCash(testUser.id, "1000.0000");

      const distinctBuyRequests = Array.from({ length: 10 }, (_, i) =>
        orderService.submitMarketOrder(testUser.id, session.id, {
          side: "BUY",
          type: "MARKET",
          assetSymbol: "AURA",
          quantity: 4,
          idempotencyKey: `buy-stress-distinct-${i}-${Date.now()}`,
        }),
      );

      const outcomes = await Promise.allSettled(distinctBuyRequests);

      const fulfilled = outcomes.filter((o) => o.status === "fulfilled");
      const rejected = outcomes.filter((o) => o.status === "rejected");

      // Exactly 2 succeed, exactly 8 fail
      expect(fulfilled).toHaveLength(2);
      expect(rejected).toHaveLength(8);

      // All rejections are INSUFFICIENT_CASH
      for (const r of rejected) {
        const err = (r as PromiseRejectedResult).reason as AppError;
        expect(err).toBeInstanceOf(AppError);
        expect(err.statusCode).toBe(HTTP_STATUS.CONFLICT);
        expect(err.code).toBe(ERROR_CODES.INSUFFICIENT_CASH);
      }

      // Check PostgreSQL state
      const updatedPortfolio = await repos.simulationPortfolioRepo.findPortfolioById(portfolio.id);
      expect(updatedPortfolio).not.toBeNull();
      // Cash balance: 1000 - 800 = 200.0000 (NEVER negative!)
      expect(updatedPortfolio!.cashBalance.toFixed(4)).toBe("200.0000");
      expect(Number(updatedPortfolio!.cashBalance)).toBeGreaterThanOrEqual(0);

      // Position: exactly 2 * 4 = 8 shares
      const position = await repos.simulationPortfolioRepo.findPosition(portfolio.id, assetAura.id);
      expect(position).not.toBeNull();
      expect(position!.quantity).toBe(8);
      expect(position!.averageCost.toFixed(6)).toBe("100.000000");

      // Exactly 2 orders and 2 trades in DB
      const committedOrders = await prisma.simulationOrder.findMany({
        where: { sessionId: session.id },
      });
      expect(committedOrders).toHaveLength(2);

      const committedTrades = await prisma.simulationTrade.findMany({
        where: { sessionId: session.id },
      });
      expect(committedTrades).toHaveLength(2);
    });
  });

  // =========================================================================
  // AC-006 / T006: High-Contention SELL Oversell Stress (Position Defense)
  // =========================================================================
  describe("AC-006 / T006: High-Contention Concurrent SELL Oversell Defense", () => {
    it("executes 10 concurrent distinct SELLs competing for finite position: position never becomes negative, rejected orders leave zero mutation", async () => {
      // 1. Setup session with 15 shares of AURA
      const { session, portfolio } = await createActiveSessionWithCash(testUser.id, "10000.0000");

      // Seed 15 shares via initial BUY
      await orderService.submitMarketOrder(testUser.id, session.id, {
        side: "BUY",
        type: "MARKET",
        assetSymbol: "AURA",
        quantity: 15,
        idempotencyKey: `seed-position-buy-${Date.now()}`,
      });

      // Reset cash to 0 to strictly isolate SELL cash credits
      await prisma.simulationPortfolio.update({
        where: { id: portfolio.id },
        data: { cashBalance: new Prisma.Decimal("0.0000") },
      });

      // 10 concurrent distinct SELL requests, each requesting 6 shares
      // Total attempted shares = 60. Available = 15.
      // Exactly 2 can succeed (2 * 6 = 12 shares sold, 3 remain; 3 < 6).
      const distinctSellRequests = Array.from({ length: 10 }, (_, i) =>
        orderService.submitMarketOrder(testUser.id, session.id, {
          side: "SELL",
          type: "MARKET",
          assetSymbol: "AURA",
          quantity: 6,
          idempotencyKey: `sell-stress-distinct-${i}-${Date.now()}`,
        }),
      );

      const outcomes = await Promise.allSettled(distinctSellRequests);

      const fulfilled = outcomes.filter((o) => o.status === "fulfilled");
      const rejected = outcomes.filter((o) => o.status === "rejected");

      expect(fulfilled).toHaveLength(2);
      expect(rejected).toHaveLength(8);

      for (const r of rejected) {
        const err = (r as PromiseRejectedResult).reason as AppError;
        expect(err).toBeInstanceOf(AppError);
        expect(err.statusCode).toBe(HTTP_STATUS.CONFLICT);
        expect(err.code).toBe(ERROR_CODES.INSUFFICIENT_POSITION);
      }

      // Check PostgreSQL state
      const finalPosition = await repos.simulationPortfolioRepo.findPosition(portfolio.id, assetAura.id);
      expect(finalPosition).not.toBeNull();
      // Remaining shares: 15 - 12 = 3 shares (NEVER negative!)
      expect(finalPosition!.quantity).toBe(3);

      const finalPortfolio = await repos.simulationPortfolioRepo.findPortfolioById(portfolio.id);
      // Cash credited: 2 * 6 * 100 = 1200.0000
      expect(finalPortfolio!.cashBalance.toFixed(4)).toBe("1200.0000");

      // Total orders in session = 1 seed BUY + 2 successful SELLs = 3
      const totalOrders = await prisma.simulationOrder.findMany({
        where: { sessionId: session.id },
      });
      expect(totalOrders).toHaveLength(3);
    });
  });

  // =========================================================================
  // AC-007 / T007: Database Unique Conflict Recovery
  // =========================================================================
  describe("AC-007 / T007: Database Unique Conflict Recovery Path", () => {
    it("safely resolves concurrent racing inserts hitting P2002 unique constraint without leaking raw DB error", async () => {
      const { session } = await createActiveSessionWithCash(testUser.id, "50000.0000");
      const raceKey = `p2002-race-${Date.now()}`;

      // Run 5 simultaneous submissions with exact same key
      const results = await Promise.all(
        Array.from({ length: 5 }, () =>
          orderService.submitMarketOrder(testUser.id, session.id, {
            side: "BUY",
            type: "MARKET",
            assetSymbol: "AURA",
            quantity: 5,
            idempotencyKey: raceKey,
          }),
        ),
      );

      expect(results).toHaveLength(5);
      const winnerId = results[0].id;
      for (const res of results) {
        expect(res.id).toBe(winnerId);
        expect(res.status).toBe("FILLED");
      }

      // Exactly 1 order in DB
      const orderCount = await prisma.simulationOrder.count({
        where: { sessionId: session.id, idempotencyKey: raceKey },
      });
      expect(orderCount).toBe(1);
    });
  });

  // =========================================================================
  // AC-008 / T008: Deterministic Lock Ordering & Deadlock Resilience
  // =========================================================================
  describe("AC-008 / T008: Deterministic Lock Ordering & Deadlock Resilience", () => {
    it("executes concurrent interleaved BUY and SELL orders across multiple assets without deadlocks", async () => {
      const { session } = await createActiveSessionWithCash(testUser.id, "100000.0000");

      // Seed initial positions: 50 AURA and 50 SOL
      await orderService.submitMarketOrder(testUser.id, session.id, {
        side: "BUY",
        type: "MARKET",
        assetSymbol: "AURA",
        quantity: 50,
        idempotencyKey: `seed-deadlock-aura-${Date.now()}`,
      });

      await orderService.submitMarketOrder(testUser.id, session.id, {
        side: "BUY",
        type: "MARKET",
        assetSymbol: "SOL",
        quantity: 50,
        idempotencyKey: `seed-deadlock-sol-${Date.now()}`,
      });

      // Interleaved concurrent operations on same portfolio:
      // Lock ordering strictly enforces: 1. portfolio FOR UPDATE, 2. position FOR UPDATE
      const operations = [
        orderService.submitMarketOrder(testUser.id, session.id, {
          side: "BUY",
          type: "MARKET",
          assetSymbol: "AURA",
          quantity: 2,
          idempotencyKey: `interleaved-1-${Date.now()}`,
        }),
        orderService.submitMarketOrder(testUser.id, session.id, {
          side: "SELL",
          type: "MARKET",
          assetSymbol: "SOL",
          quantity: 2,
          idempotencyKey: `interleaved-2-${Date.now()}`,
        }),
        orderService.submitMarketOrder(testUser.id, session.id, {
          side: "BUY",
          type: "MARKET",
          assetSymbol: "SOL",
          quantity: 2,
          idempotencyKey: `interleaved-3-${Date.now()}`,
        }),
        orderService.submitMarketOrder(testUser.id, session.id, {
          side: "SELL",
          type: "MARKET",
          assetSymbol: "AURA",
          quantity: 2,
          idempotencyKey: `interleaved-4-${Date.now()}`,
        }),
        orderService.submitMarketOrder(testUser.id, session.id, {
          side: "BUY",
          type: "MARKET",
          assetSymbol: "AURA",
          quantity: 3,
          idempotencyKey: `interleaved-5-${Date.now()}`,
        }),
        orderService.submitMarketOrder(testUser.id, session.id, {
          side: "SELL",
          type: "MARKET",
          assetSymbol: "SOL",
          quantity: 3,
          idempotencyKey: `interleaved-6-${Date.now()}`,
        }),
      ];

      const results = await Promise.all(operations);
      expect(results).toHaveLength(6);
      for (const res of results) {
        expect(res.status).toBe("FILLED");
      }

      // Reconcile portfolio accounting from all committed trades in DB
      const dbTrades = await prisma.simulationTrade.findMany({
        where: { sessionId: session.id },
        orderBy: { executedAt: "asc" },
      });

      const reconciliation = await accountingService.reconcilePortfolio({
        sessionId: session.id,
        trades: dbTrades.map((t) => ({
          side: t.side as "BUY" | "SELL",
          assetId: t.assetId,
          quantity: t.quantity,
          executionPrice: t.executionPrice,
        })),
        startingCash: "100000.0000",
      });

      expect(reconciliation.isReconciled).toBe(true);
      expect(reconciliation.discrepancies).toHaveLength(0);
    });
  });

  // =========================================================================
  // AC-009, AC-010: Error Diagnostics Sanitization
  // =========================================================================
  describe("AC-009, AC-010: Error Diagnostics Sanitization", () => {
    it("ensures thrown AppErrors leak no raw SQL, table names, constraint names, or DB connection details", async () => {
      const { session } = await createActiveSessionWithCash(testUser.id, "100.0000");

      // Trigger insufficient cash conflict
      try {
        await orderService.submitMarketOrder(testUser.id, session.id, {
          side: "BUY",
          type: "MARKET",
          assetSymbol: "AURA",
          quantity: 50, // requires 5000, cash is 100
          idempotencyKey: `err-leak-test-${Date.now()}`,
        });
        expect.fail("Expected order to fail");
      } catch (err: unknown) {
        expect(err).toBeInstanceOf(AppError);
        const appErr = err as AppError;
        const serialized = JSON.stringify({
          message: appErr.message,
          details: appErr.details,
        });

        // Ensure zero DB internals leak
        expect(serialized).not.toContain("SELECT");
        expect(serialized).not.toContain("INSERT");
        expect(serialized).not.toContain("simulation_portfolios");
        expect(serialized).not.toContain("simulation_orders");
        expect(serialized).not.toContain("P2002");
        expect(serialized).not.toContain("P2034");
        expect(serialized).not.toContain("5432");
        expect(serialized).not.toContain("localhost");
      }
    });
  });

  // =========================================================================
  // AC-011: Cross-User and Cross-Simulation Key Isolation
  // =========================================================================
  describe("AC-011: Cross-User & Cross-Simulation Key Isolation", () => {
    it("allows different users to use the exact same idempotency key without collision or result leakage", async () => {
      const { session: sessionUserA } = await createActiveSessionWithCash(testUser.id, "50000.0000");
      const { session: sessionUserB } = await createActiveSessionWithCash(otherUser.id, "50000.0000");

      const sharedKey = `shared-cross-user-key-${Date.now()}`;

      // Both users execute with identical key
      const [resA, resB] = await Promise.all([
        orderService.submitMarketOrder(testUser.id, sessionUserA.id, {
          side: "BUY",
          type: "MARKET",
          assetSymbol: "AURA",
          quantity: 10,
          idempotencyKey: sharedKey,
        }),
        orderService.submitMarketOrder(otherUser.id, sessionUserB.id, {
          side: "BUY",
          type: "MARKET",
          assetSymbol: "AURA",
          quantity: 10,
          idempotencyKey: sharedKey,
        }),
      ]);

      expect(resA.id).toBeDefined();
      expect(resB.id).toBeDefined();
      expect(resA.id).not.toBe(resB.id); // Completely distinct orders!

      // User A retry gets User A order
      const replayA = await orderService.submitMarketOrder(testUser.id, sessionUserA.id, {
        side: "BUY",
        type: "MARKET",
        assetSymbol: "AURA",
        quantity: 10,
        idempotencyKey: sharedKey,
      });
      expect(replayA.id).toBe(resA.id);

      // User B retry gets User B order
      const replayB = await orderService.submitMarketOrder(otherUser.id, sessionUserB.id, {
        side: "BUY",
        type: "MARKET",
        assetSymbol: "AURA",
        quantity: 10,
        idempotencyKey: sharedKey,
      });
      expect(replayB.id).toBe(resB.id);
    });

    it("allows same user across different simulations to use the exact same idempotency key without collision", async () => {
      const { session: session1 } = await createActiveSessionWithCash(testUser.id, "50000.0000");
      const sharedKey = `shared-cross-session-key-${Date.now()}`;

      const res1 = await orderService.submitMarketOrder(testUser.id, session1.id, {
        side: "BUY",
        type: "MARKET",
        assetSymbol: "AURA",
        quantity: 5,
        idempotencyKey: sharedKey,
      });

      // Complete session 1 so user can create session 2 (enforcing one ACTIVE session per user constraint)
      await repos.simulationSessionRepo.updateSessionStatus(session1.id, "COMPLETED");

      const { session: session2 } = await createActiveSessionWithCash(testUser.id, "50000.0000");

      const res2 = await orderService.submitMarketOrder(testUser.id, session2.id, {
        side: "BUY",
        type: "MARKET",
        assetSymbol: "AURA",
        quantity: 5,
        idempotencyKey: sharedKey,
      });

      expect(res1.id).toBeDefined();
      expect(res2.id).toBeDefined();
      expect(res1.id).not.toBe(res2.id);

      const order1 = await repos.simulationOrderRepo.findOrderById(res1.id);
      const order2 = await repos.simulationOrderRepo.findOrderById(res2.id);
      expect(order1!.sessionId).toBe(session1.id);
      expect(order2!.sessionId).toBe(session2.id);
      expect(order1!.idempotencyKey).toBe(sharedKey);
      expect(order2!.idempotencyKey).toBe(sharedKey);
    });
  });

  // =========================================================================
  // AC-014: Full Accounting Reconciliation After Adversarial Stress
  // =========================================================================
  describe("AC-014: Post-Stress Accounting Reconciliation", () => {
    it("reconstructs portfolio from committed trades after multiple concurrent operations with zero discrepancies", async () => {
      const { session, portfolio } = await createActiveSessionWithCash(testUser.id, "100000.0000");

      // Execute a sequence of concurrent distinct operations
      const batch1 = await Promise.all([
        orderService.submitMarketOrder(testUser.id, session.id, {
          side: "BUY",
          type: "MARKET",
          assetSymbol: "AURA",
          quantity: 20,
          idempotencyKey: `recon-buy-1-${Date.now()}`,
        }),
        orderService.submitMarketOrder(testUser.id, session.id, {
          side: "BUY",
          type: "MARKET",
          assetSymbol: "SOL",
          quantity: 40,
          idempotencyKey: `recon-buy-2-${Date.now()}`,
        }),
      ]);
      expect(batch1).toHaveLength(2);

      const batch2 = await Promise.all([
        orderService.submitMarketOrder(testUser.id, session.id, {
          side: "SELL",
          type: "MARKET",
          assetSymbol: "AURA",
          quantity: 10,
          idempotencyKey: `recon-sell-1-${Date.now()}`,
        }),
        orderService.submitMarketOrder(testUser.id, session.id, {
          side: "BUY",
          type: "MARKET",
          assetSymbol: "AURA",
          quantity: 15,
          idempotencyKey: `recon-buy-3-${Date.now()}`,
        }),
      ]);
      expect(batch2).toHaveLength(2);

      // Perform deep reconciliation against DB trades
      const dbTrades = await prisma.simulationTrade.findMany({
        where: { sessionId: session.id },
        orderBy: { executedAt: "asc" },
      });

      const reconciliation = await accountingService.reconcilePortfolio({
        sessionId: session.id,
        trades: dbTrades.map((t) => ({
          side: t.side as "BUY" | "SELL",
          assetId: t.assetId,
          quantity: t.quantity,
          executionPrice: t.executionPrice,
        })),
        startingCash: "100000.0000",
      });
      expect(reconciliation.isReconciled).toBe(true);
      expect(reconciliation.discrepancies).toHaveLength(0);

      const currentPortfolio = await repos.simulationPortfolioRepo.findPortfolioById(portfolio.id);
      expect(currentPortfolio!.cashBalance.toFixed(4)).toBe(reconciliation.reconstructed.cashBalance);
      expect(currentPortfolio!.realizedPnl.toFixed(4)).toBe(reconciliation.reconstructed.realizedPnl);
      expect(currentPortfolio!.cashBalance.toFixed(4)).toBe(reconciliation.materialized.cashBalance);
      expect(currentPortfolio!.realizedPnl.toFixed(4)).toBe(reconciliation.materialized.realizedPnl);
    });
  });
});
