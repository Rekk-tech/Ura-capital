import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { PrismaClient, Prisma } from "@prisma/client";
import { assertSafeTestDatabase, sanitizeDiagnosticMessage, cleanAllTestTables } from "../helpers/test-db-guard.js";
import {
  createRepositoryContainer,
  type IRepositoryContainer,
} from "../../src/infrastructure/database/repository-factory.js";
import { SimulationAccountingService } from "../../src/modules/simulation/simulation-accounting.service.js";
import { transactionRunner } from "../../src/infrastructure/database/transaction-runner.js";
import { AppError } from "../../src/shared/errors/error-envelope.js";
import { ERROR_CODES, HTTP_STATUS } from "@aura/shared";

describe("FEAT-034: Portfolio & Position Accounting Foundation (Live PostgreSQL)", () => {
  const testDbUrl =
    process.env.TEST_DATABASE_URL ||
    process.env.DATABASE_URL ||
    "postgresql://postgres:postgrespassword@localhost:5432/aura_capital_test_feat019_rework2_fresh";

  let prisma: PrismaClient;
  let repos: IRepositoryContainer;
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
        email: `trader-${Date.now()}@test.com`,
        displayName: "Test Trader",
        status: "ACTIVE",
      },
    });

    otherUser = await prisma.user.create({
      data: {
        email: `other-${Date.now()}@test.com`,
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
  });

  async function createActiveSession(userId: string) {
    const session = await repos.simulationSessionRepo.createSession({
      userId,
      scenarioId: scenario.id,
      status: "ACTIVE",
      startingCash: "100000.0000",
      currentCycle: 1,
      startedAt: new Date(),
    });

    const portfolio = await accountingService.initializePortfolio(session.id);
    return { session, portfolio };
  }

  describe("AC-002: Portfolio Initialization & Session Uniqueness", () => {
    it("initializes portfolio with exact 100000.0000 cash and 0 initial positions", async () => {
      const { session, portfolio } = await createActiveSession(testUser.id);

      expect(portfolio.id).toBeDefined();
      expect(portfolio.sessionId).toBe(session.id);
      expect(portfolio.cashBalance.toFixed(4)).toBe("100000.0000");
      expect(portfolio.realizedPnl.toFixed(4)).toBe("0.0000");

      // Verify zero initial positions in database
      const positions = await repos.simulationPortfolioRepo.listPositions(portfolio.id);
      expect(positions).toHaveLength(0);
    });

    it("enforces one-portfolio-per-session invariant at DB level", async () => {
      const { session } = await createActiveSession(testUser.id);

      // Attempting second initialization via service must throw CONFLICT
      await expect(accountingService.initializePortfolio(session.id)).rejects.toThrow(
        expect.objectContaining({
          code: ERROR_CODES.CONFLICT,
          statusCode: HTTP_STATUS.CONFLICT,
        }),
      );

      // Direct Prisma create must fail PostgreSQL unique constraint
      await expect(
        prisma.simulationPortfolio.create({
          data: {
            sessionId: session.id,
            cashBalance: new Prisma.Decimal("50000.0000"),
          },
        }),
      ).rejects.toThrow();
    });

    it("prevents duplicate portfolios under concurrent initialization race conditions", async () => {
      const session = await repos.simulationSessionRepo.createSession({
        userId: testUser.id,
        scenarioId: scenario.id,
        status: "ACTIVE",
        startingCash: "100000.0000",
        currentCycle: 1,
      });

      // Launch 5 concurrent initialization requests
      const results = await Promise.allSettled([
        accountingService.initializePortfolio(session.id),
        accountingService.initializePortfolio(session.id),
        accountingService.initializePortfolio(session.id),
        accountingService.initializePortfolio(session.id),
        accountingService.initializePortfolio(session.id),
      ]);

      const fulfilled = results.filter((r) => r.status === "fulfilled");
      const rejected = results.filter((r) => r.status === "rejected");

      // Exactly one must succeed
      expect(fulfilled).toHaveLength(1);
      expect(rejected).toHaveLength(4);

      // Database must have exactly 1 portfolio row for this session
      const count = await prisma.simulationPortfolio.count({
        where: { sessionId: session.id },
      });
      expect(count).toBe(1);
    });
  });

  describe("AC-003: Position Uniqueness & Persistence Invariants", () => {
    it("enforces unique (portfolioId, assetId) constraint at DB level", async () => {
      const { portfolio } = await createActiveSession(testUser.id);

      await repos.simulationPortfolioRepo.createPosition({
        portfolioId: portfolio.id,
        assetId: assetAura.id,
        quantity: 10,
        averageCost: "150.000000",
      });

      // Creating a second position row for the same asset in the same portfolio must fail
      await expect(
        repos.simulationPortfolioRepo.createPosition({
          portfolioId: portfolio.id,
          assetId: assetAura.id,
          quantity: 5,
          averageCost: "160.000000",
        }),
      ).rejects.toThrow();
    });

    it("allows concurrent upsertPosition calls to update without creating duplicate rows", async () => {
      const { portfolio } = await createActiveSession(testUser.id);

      await Promise.all([
        repos.simulationPortfolioRepo.upsertPosition(portfolio.id, assetAura.id, 10, "150.000000"),
        repos.simulationPortfolioRepo.upsertPosition(portfolio.id, assetAura.id, 20, "160.000000"),
        repos.simulationPortfolioRepo.upsertPosition(portfolio.id, assetAura.id, 30, "170.000000"),
      ]);

      const positions = await prisma.simulationPosition.findMany({
        where: { portfolioId: portfolio.id, assetId: assetAura.id },
      });
      expect(positions).toHaveLength(1);
    });
  });

  describe("AC-009, AC-010, AC-020: PostgreSQL Check Constraints", () => {
    it("rejects negative cash balance via PostgreSQL check constraint", async () => {
      const { portfolio } = await createActiveSession(testUser.id);

      await expect(
        prisma.simulationPortfolio.update({
          where: { id: portfolio.id },
          data: { cashBalance: new Prisma.Decimal("-0.0001") },
        }),
      ).rejects.toThrow(/simulation_portfolios_cash_balance_check/);
    });

    it("rejects negative position quantity via PostgreSQL check constraint", async () => {
      const { portfolio } = await createActiveSession(testUser.id);

      await expect(
        prisma.simulationPosition.create({
          data: {
            portfolioId: portfolio.id,
            assetId: assetAura.id,
            quantity: -1,
            averageCost: new Prisma.Decimal("100.000000"),
          },
        }),
      ).rejects.toThrow(/simulation_positions_quantity_check/);
    });

    it("rejects negative average cost via PostgreSQL check constraint", async () => {
      const { portfolio } = await createActiveSession(testUser.id);

      await expect(
        prisma.simulationPosition.create({
          data: {
            portfolioId: portfolio.id,
            assetId: assetAura.id,
            quantity: 10,
            averageCost: new Prisma.Decimal("-0.000001"),
          },
        }),
      ).rejects.toThrow(/simulation_positions_average_cost_check/);
    });
  });

  describe("AC-017, AC-020: Atomic Transaction Rollback", () => {
    it("rolls back all cash and position mutations if a failure occurs inside transaction", async () => {
      const { portfolio } = await createActiveSession(testUser.id);

      // Force failure inside transaction runner
      await expect(
        transactionRunner.run(async (ctx) => {
          // 1. Mutate cash
          await ctx.repositories.simulationPortfolioRepo.updateCashBalance(
            portfolio.id,
            "50000.0000",
          );

          // 2. Mutate position
          await ctx.repositories.simulationPortfolioRepo.upsertPosition(
            portfolio.id,
            assetAura.id,
            100,
            "100.000000",
          );

          // 3. Throw forced error before transaction commit
          throw new AppError(
            "FORCED_SIMULATION_ABORT",
            ERROR_CODES.INTERNAL_ERROR,
            HTTP_STATUS.INTERNAL_SERVER_ERROR,
          );
        }),
      ).rejects.toThrow("FORCED_SIMULATION_ABORT");

      // Verify DB rolled back to original pristine state
      const reloadedPortfolio = await repos.simulationPortfolioRepo.findPortfolioById(portfolio.id);
      expect(reloadedPortfolio?.cashBalance.toFixed(4)).toBe("100000.0000");

      const positions = await repos.simulationPortfolioRepo.listPositions(portfolio.id);
      expect(positions).toHaveLength(0);
    });
  });

  describe("Cross-Session Safety & Boundary Isolation", () => {
    it("prevents Session A from mutating Session B's portfolio or positions", async () => {
      const sessionA = await createActiveSession(testUser.id);
      const sessionB = await createActiveSession(otherUser.id);

      // Buy for Session A
      await accountingService.applyBuyAccounting({
        sessionId: sessionA.session.id,
        assetId: assetAura.id,
        quantity: 10,
        executionPrice: "100.000000",
      });

      // Verify Session B portfolio remains completely untouched
      const portfolioB = await repos.simulationPortfolioRepo.findPortfolioById(sessionB.portfolio.id);
      expect(portfolioB?.cashBalance.toFixed(4)).toBe("100000.0000");

      const positionsB = await repos.simulationPortfolioRepo.listPositions(sessionB.portfolio.id);
      expect(positionsB).toHaveLength(0);
    });
  });

  describe("AC-004, AC-005, AC-015: Full Multi-Asset Lifecycle & Trade Reconciliation", () => {
    it("accurately executes multi-trade lifecycle and reconciles materialized DB state against reconstructed trades", async () => {
      const { session, portfolio } = await createActiveSession(testUser.id);

      // Step 1: BUY 10 AURA @ 100.000000
      const buy1 = await accountingService.applyBuyAccounting({
        sessionId: session.id,
        assetId: assetAura.id,
        quantity: 10,
        executionPrice: "100.000000",
      });
      expect(buy1.portfolio.cashBalance.toFixed(4)).toBe("99000.0000");
      expect(buy1.position.quantity).toBe(10);
      expect(buy1.position.averageCost.toFixed(6)).toBe("100.000000");

      // Step 2: BUY 10 AURA @ 120.000000
      const buy2 = await accountingService.applyBuyAccounting({
        sessionId: session.id,
        assetId: assetAura.id,
        quantity: 10,
        executionPrice: "120.000000",
      });
      // (10 * 100 + 10 * 120) / 20 = 110.000000
      expect(buy2.portfolio.cashBalance.toFixed(4)).toBe("97800.0000");
      expect(buy2.position.quantity).toBe(20);
      expect(buy2.position.averageCost.toFixed(6)).toBe("110.000000");

      // Step 3: BUY 5 SOL @ 200.000000 (multi-asset independence)
      const buySol = await accountingService.applyBuyAccounting({
        sessionId: session.id,
        assetId: assetSol.id,
        quantity: 5,
        executionPrice: "200.000000",
      });
      // 97800 - 1000 = 96800
      expect(buySol.portfolio.cashBalance.toFixed(4)).toBe("96800.0000");
      expect(buySol.position.quantity).toBe(5);
      expect(buySol.position.averageCost.toFixed(6)).toBe("200.000000");

      // Step 4: SELL 5 AURA @ 130.000000 (partial sell at profit)
      const sell1 = await accountingService.applySellAccounting({
        sessionId: session.id,
        assetId: assetAura.id,
        quantity: 5,
        executionPrice: "130.000000",
      });
      // cash = 96800 + 650 = 97450
      expect(sell1.portfolio.cashBalance.toFixed(4)).toBe("97450.0000");
      expect(sell1.position.quantity).toBe(15);
      expect(sell1.position.averageCost.toFixed(6)).toBe("110.000000"); // average cost unchanged
      expect(sell1.tradeRealizedPnl.toFixed(4)).toBe("100.0000");
      expect(sell1.portfolio.realizedPnl.toFixed(4)).toBe("100.0000");

      // Step 5: Full SELL remaining 15 AURA @ 150.000000
      const sell2 = await accountingService.applySellAccounting({
        sessionId: session.id,
        assetId: assetAura.id,
        quantity: 15,
        executionPrice: "150.000000",
      });
      // notional = 15 * 150 = 2250, cash = 97450 + 2250 = 99700
      // pnl = (150 - 110) * 15 = 600, cumulative pnl = 100 + 600 = 700
      expect(sell2.portfolio.cashBalance.toFixed(4)).toBe("99700.0000");
      expect(sell2.position.quantity).toBe(0);
      expect(sell2.position.averageCost.toFixed(6)).toBe("110.000000");
      expect(sell2.portfolio.realizedPnl.toFixed(4)).toBe("700.0000");

      // Step 6: BUY after full sell: 5 AURA @ 160.000000
      const buyAfterFullSell = await accountingService.applyBuyAccounting({
        sessionId: session.id,
        assetId: assetAura.id,
        quantity: 5,
        executionPrice: "160.000000",
      });
      // cash = 99700 - 800 = 98900
      // average cost resets to 160.000000
      expect(buyAfterFullSell.portfolio.cashBalance.toFixed(4)).toBe("98900.0000");
      expect(buyAfterFullSell.position.quantity).toBe(5);
      expect(buyAfterFullSell.position.averageCost.toFixed(6)).toBe("160.000000");

      // Verify against direct DB query
      const dbPortfolio = await prisma.simulationPortfolio.findUnique({
        where: { id: portfolio.id },
        include: { positions: true },
      });
      expect(dbPortfolio?.cashBalance.toFixed(4)).toBe("98900.0000");
      expect(dbPortfolio?.realizedPnl.toFixed(4)).toBe("700.0000");

      const auraPos = dbPortfolio?.positions.find((p) => p.assetId === assetAura.id);
      expect(auraPos?.quantity).toBe(5);
      expect(auraPos?.averageCost.toFixed(6)).toBe("160.000000");

      const solPos = dbPortfolio?.positions.find((p) => p.assetId === assetSol.id);
      expect(solPos?.quantity).toBe(5);
      expect(solPos?.averageCost.toFixed(6)).toBe("200.000000");

      // Reconcile against reconstructed trade history
      const reconciliation = await accountingService.reconcilePortfolio({
        sessionId: session.id,
        trades: [
          { side: "BUY", assetId: assetAura.id, quantity: 10, executionPrice: "100.000000" },
          { side: "BUY", assetId: assetAura.id, quantity: 10, executionPrice: "120.000000" },
          { side: "BUY", assetId: assetSol.id, quantity: 5, executionPrice: "200.000000" },
          { side: "SELL", assetId: assetAura.id, quantity: 5, executionPrice: "130.000000" },
          { side: "SELL", assetId: assetAura.id, quantity: 15, executionPrice: "150.000000" },
          { side: "BUY", assetId: assetAura.id, quantity: 5, executionPrice: "160.000000" },
        ],
      });

      expect(reconciliation.isReconciled).toBe(true);
      expect(reconciliation.discrepancies).toHaveLength(0);
      expect(reconciliation.materialized.cashBalance).toBe("98900.0000");
      expect(reconciliation.materialized.realizedPnl).toBe("700.0000");
      expect(reconciliation.materialized.positions[assetAura.id].quantity).toBe(5);
      expect(reconciliation.materialized.positions[assetAura.id].averageCost).toBe("160.000000");
      expect(reconciliation.materialized.positions[assetSol.id].quantity).toBe(5);
      expect(reconciliation.materialized.positions[assetSol.id].averageCost).toBe("200.000000");
    });
  });

  describe("Oversell and Insufficient Cash Guarding in Live Service", () => {
    it("rejects buy when cash is insufficient without mutating state", async () => {
      const { session, portfolio } = await createActiveSession(testUser.id);

      await expect(
        accountingService.applyBuyAccounting({
          sessionId: session.id,
          assetId: assetAura.id,
          quantity: 1000,
          executionPrice: "150.000000", // 150,000 > 100,000
        }),
      ).rejects.toThrow(
        expect.objectContaining({
          code: ERROR_CODES.CONFLICT,
          statusCode: HTTP_STATUS.CONFLICT,
        }),
      );

      // Verify cash was untouched
      const reloaded = await repos.simulationPortfolioRepo.findPortfolioById(portfolio.id);
      expect(reloaded?.cashBalance.toFixed(4)).toBe("100000.0000");
    });

    it("rejects sell when quantity exceeds position without mutating state", async () => {
      const { session, portfolio } = await createActiveSession(testUser.id);

      await accountingService.applyBuyAccounting({
        sessionId: session.id,
        assetId: assetAura.id,
        quantity: 5,
        executionPrice: "100.000000",
      });

      // Try selling 10 shares when holding only 5
      await expect(
        accountingService.applySellAccounting({
          sessionId: session.id,
          assetId: assetAura.id,
          quantity: 10,
          executionPrice: "120.000000",
        }),
      ).rejects.toThrow(
        expect.objectContaining({
          code: ERROR_CODES.CONFLICT,
          statusCode: HTTP_STATUS.CONFLICT,
        }),
      );

      // Position quantity must remain 5
      const pos = await repos.simulationPortfolioRepo.findPosition(portfolio.id, assetAura.id);
      expect(pos?.quantity).toBe(5);
    });
  });
});
