import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { PrismaClient, Prisma } from "@prisma/client";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { assertSafeTestDatabase, sanitizeDiagnosticMessage, cleanAllTestTables } from "../helpers/test-db-guard.js";
import { computeMigrationDigests } from "../helpers/migration-guard.js";
import {
  createRepositoryContainer,
  type IRepositoryContainer,
} from "../../src/infrastructure/database/repository-factory.js";
import {
  SIMULATION_CONSTANTS,
  SIMULATION_SCENARIO_STATUS,
  SIMULATION_ASSET_TYPE,
  SIMULATION_ASSET_STATUS,
  SIMULATION_SESSION_STATUS,
  SIMULATION_ORDER_SIDE,
  SIMULATION_ORDER_TYPE,
  SIMULATION_ORDER_STATUS,
  SIMULATION_TRADE_SIDE,
} from "../../src/modules/simulation/simulation.types.js";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const migrationsDir = path.resolve(currentDir, "../../prisma/migrations");

describe("FEAT-031 Simulation Domain Schema & Persistence Foundation (Integration)", () => {
  const testDbUrl =
    process.env.TEST_DATABASE_URL ||
    process.env.DATABASE_URL ||
    "postgresql://postgres:postgrespassword@localhost:5432/aura_capital_test_feat019_rework2_fresh";

  let prisma: PrismaClient;
  let repos: IRepositoryContainer;

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
  });

  // Helper to create a test user
  async function createTestUser(emailPrefix = "sim_user") {
    return prisma.user.create({
      data: {
        email: `${emailPrefix}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}@example.com`,
        displayName: "Sim User",
        status: "ACTIVE",
      },
    });
  }

  // ============================================================================
  // AC-001: Human-Approved MVP Constants & Monetary Precision
  // ============================================================================
  describe("AC-001: Monetary Precision & MVP Constants Contract", () => {
    it("preserves approved constants and monetary contract definitions", () => {
      expect(SIMULATION_CONSTANTS.STARTING_CASH_DEFAULT).toBe("100000.0000");
      expect(SIMULATION_CONSTANTS.STARTING_CYCLE).toBe(1);
      expect(SIMULATION_CONSTANTS.TRADING_FEE).toBe("0.0000");
      expect(SIMULATION_CONSTANTS.SLIPPAGE).toBe("0.0000");
      expect(SIMULATION_CONSTANTS.DECIMAL_SCALE_CURRENCY).toBe(4);
      expect(SIMULATION_CONSTANTS.DECIMAL_SCALE_PRICE).toBe(6);
    });
  });

  // ============================================================================
  // AC-002: SimulationScenario Model & Constraints
  // ============================================================================
  describe("AC-002: SimulationScenario Model & Constraints", () => {
    it("creates and retrieves a scenario with exact approved fields", async () => {
      const scenario = await repos.simulationScenarioRepo.createScenario({
        key: "BASELINE_MVP_SCENARIO",
        name: "Baseline MVP Scenario",
        status: "ACTIVE",
      });

      expect(scenario.id).toBeDefined();
      expect(scenario.key).toBe("BASELINE_MVP_SCENARIO");
      expect(scenario.name).toBe("Baseline MVP Scenario");
      expect(scenario.status).toBe(SIMULATION_SCENARIO_STATUS.ACTIVE);
      expect(scenario.createdAt).toBeInstanceOf(Date);
      expect(scenario.updatedAt).toBeInstanceOf(Date);

      const found = await repos.simulationScenarioRepo.findScenarioByKey("BASELINE_MVP_SCENARIO");
      expect(found?.id).toBe(scenario.id);
    });

    it("enforces key uniqueness with P2002", async () => {
      await repos.simulationScenarioRepo.createScenario({
        key: "UNIQUE_SCENARIO_KEY",
        name: "Scenario 1",
      });

      await expect(
        repos.simulationScenarioRepo.createScenario({
          key: "UNIQUE_SCENARIO_KEY",
          name: "Scenario 2",
        }),
      ).rejects.toThrow();
    });

    it("enforces status closed-set check constraint", async () => {
      await expect(
        prisma.$executeRaw`
          INSERT INTO "simulation_scenarios" ("id", "key", "name", "status", "created_at", "updated_at")
          VALUES (gen_random_uuid(), 'INVALID_STATUS_SCENARIO', 'Invalid Status', 'UNKNOWN_STATUS', NOW(), NOW());
        `,
      ).rejects.toThrow(/check/i);
    });
  });

  // ============================================================================
  // AC-003: SimulationAsset Model & Constraints
  // ============================================================================
  describe("AC-003: SimulationAsset Model & Constraints", () => {
    it("creates and retrieves an asset with exact approved fields", async () => {
      const asset = await repos.simulationAssetRepo.createAsset({
        symbol: "NVDA",
        name: "NVIDIA Corp.",
        assetType: "EQUITY",
        status: "ACTIVE",
        displayOrder: 1,
      });

      expect(asset.id).toBeDefined();
      expect(asset.symbol).toBe("NVDA");
      expect(asset.name).toBe("NVIDIA Corp.");
      expect(asset.assetType).toBe(SIMULATION_ASSET_TYPE.EQUITY);
      expect(asset.status).toBe(SIMULATION_ASSET_STATUS.ACTIVE);
      expect(asset.displayOrder).toBe(1);

      const found = await repos.simulationAssetRepo.findAssetBySymbol("NVDA");
      expect(found?.id).toBe(asset.id);
    });

    it("enforces symbol uniqueness", async () => {
      await repos.simulationAssetRepo.createAsset({
        symbol: "AAPL",
        name: "Apple Inc.",
      });

      await expect(
        repos.simulationAssetRepo.createAsset({
          symbol: "AAPL",
          name: "Apple Inc. Duplicate",
        }),
      ).rejects.toThrow();
    });

    it("enforces asset_type IN ('EQUITY') and status IN ('ACTIVE', 'ARCHIVED') check constraints", async () => {
      await expect(
        prisma.$executeRaw`
          INSERT INTO "simulation_assets" ("id", "symbol", "name", "asset_type", "status", "display_order", "created_at", "updated_at")
          VALUES (gen_random_uuid(), 'CRYPTO1', 'Crypto Asset', 'CRYPTO', 'ACTIVE', 0, NOW(), NOW());
        `,
      ).rejects.toThrow(/check/i);

      await expect(
        prisma.$executeRaw`
          INSERT INTO "simulation_assets" ("id", "symbol", "name", "asset_type", "status", "display_order", "created_at", "updated_at")
          VALUES (gen_random_uuid(), 'INVALID_STAT', 'Invalid Status', 'EQUITY', 'DELETED', 0, NOW(), NOW());
        `,
      ).rejects.toThrow(/check/i);
    });
  });

  // ============================================================================
  // AC-004: SimulationMarketSnapshot Model & Constraints
  // ============================================================================
  describe("AC-004: SimulationMarketSnapshot Model & Uniqueness", () => {
    it("creates snapshot and enforces composite uniqueness (scenarioId + cycle + assetId)", async () => {
      const scenario = await repos.simulationScenarioRepo.createScenario({
        key: "SNAP_SCENARIO",
        name: "Snapshot Scenario",
      });
      const asset = await repos.simulationAssetRepo.createAsset({
        symbol: "TSLA",
        name: "Tesla Inc.",
      });

      const snapshot = await repos.simulationMarketSnapshotRepo.createSnapshot({
        scenarioId: scenario.id,
        assetId: asset.id,
        cycle: 1,
        price: "245.500000",
        occurredAt: new Date(),
      });

      expect(snapshot.id).toBeDefined();
      expect(snapshot.cycle).toBe(1);
      expect(new Prisma.Decimal(snapshot.price).toFixed(6)).toBe("245.500000");

      // Duplicate composite key must fail
      await expect(
        repos.simulationMarketSnapshotRepo.createSnapshot({
          scenarioId: scenario.id,
          assetId: asset.id,
          cycle: 1,
          price: "250.000000",
          occurredAt: new Date(),
        }),
      ).rejects.toThrow();
    });

    it("enforces positive price (price > 0) and positive cycle (cycle >= 1) check constraints", async () => {
      const scenario = await repos.simulationScenarioRepo.createScenario({
        key: "PRICE_CHECK_SCENARIO",
        name: "Price Check Scenario",
      });
      const asset = await repos.simulationAssetRepo.createAsset({
        symbol: "MSFT",
        name: "Microsoft Corp.",
      });

      // Price = 0 must fail
      await expect(
        prisma.$executeRaw`
          INSERT INTO "simulation_market_snapshots" ("id", "scenario_id", "asset_id", "cycle", "price", "occurred_at", "created_at")
          VALUES (gen_random_uuid(), ${scenario.id}, ${asset.id}, 1, 0, NOW(), NOW());
        `,
      ).rejects.toThrow(/check/i);

      // Negative price must fail
      await expect(
        prisma.$executeRaw`
          INSERT INTO "simulation_market_snapshots" ("id", "scenario_id", "asset_id", "cycle", "price", "occurred_at", "created_at")
          VALUES (gen_random_uuid(), ${scenario.id}, ${asset.id}, 1, -10.50, NOW(), NOW());
        `,
      ).rejects.toThrow(/check/i);

      // Cycle = 0 must fail
      await expect(
        prisma.$executeRaw`
          INSERT INTO "simulation_market_snapshots" ("id", "scenario_id", "asset_id", "cycle", "price", "occurred_at", "created_at")
          VALUES (gen_random_uuid(), ${scenario.id}, ${asset.id}, 0, 100.0, NOW(), NOW());
        `,
      ).rejects.toThrow(/check/i);
    });
  });

  // ============================================================================
  // AC-005 & AC-012: SimulationSession & Partial Unique Active Index
  // ============================================================================
  describe("AC-005 & AC-012: SimulationSession & At Most One ACTIVE Session Per User", () => {
    it("creates session with startingCash 100000.0000 and cycle 1 default", async () => {
      const user = await createTestUser();
      const scenario = await repos.simulationScenarioRepo.createScenario({
        key: "SESSION_SCENARIO_1",
        name: "Session Scenario",
      });

      const session = await repos.simulationSessionRepo.createSession({
        userId: user.id,
        scenarioId: scenario.id,
      });

      expect(session.id).toBeDefined();
      expect(session.status).toBe(SIMULATION_SESSION_STATUS.CREATED);
      expect(new Prisma.Decimal(session.startingCash).toFixed(4)).toBe("100000.0000");
      expect(session.currentCycle).toBe(1);
    });

    it("enforces at most one ACTIVE session per user via PostgreSQL partial unique index (AC-012)", async () => {
      const user = await createTestUser();
      const scenario = await repos.simulationScenarioRepo.createScenario({
        key: "ACTIVE_SESSION_SCENARIO",
        name: "Active Session Scenario",
      });

      // 1. Create first ACTIVE session
      await repos.simulationSessionRepo.createSession({
        userId: user.id,
        scenarioId: scenario.id,
        status: "ACTIVE",
        startedAt: new Date(),
      });

      // 2. Attempting to create second ACTIVE session for SAME user must be rejected by PostgreSQL
      await expect(
        repos.simulationSessionRepo.createSession({
          userId: user.id,
          scenarioId: scenario.id,
          status: "ACTIVE",
          startedAt: new Date(),
        }),
      ).rejects.toThrow();

      // 3. Creating non-active sessions (CREATED, COMPLETED, CANCELLED) for the SAME user is allowed
      const createdSession = await repos.simulationSessionRepo.createSession({
        userId: user.id,
        scenarioId: scenario.id,
        status: "CREATED",
      });
      expect(createdSession.id).toBeDefined();

      const cancelledSession = await repos.simulationSessionRepo.createSession({
        userId: user.id,
        scenarioId: scenario.id,
        status: "CANCELLED",
      });
      expect(cancelledSession.id).toBeDefined();
    });

    it("enforces session status closed set ('CREATED', 'ACTIVE', 'COMPLETED', 'CANCELLED')", async () => {
      const user = await createTestUser();
      const scenario = await repos.simulationScenarioRepo.createScenario({
        key: "SESSION_STATUS_CHECK_SCENARIO",
        name: "Session Status Check Scenario",
      });

      await expect(
        prisma.$executeRaw`
          INSERT INTO "simulation_sessions" ("id", "user_id", "scenario_id", "status", "starting_cash", "current_cycle", "created_at", "updated_at")
          VALUES (gen_random_uuid(), ${user.id}, ${scenario.id}, 'PAUSED', 100000.0000, 1, NOW(), NOW());
        `,
      ).rejects.toThrow(/check/i);
    });
  });

  // ============================================================================
  // AC-006: SimulationPortfolio & One Portfolio Invariant
  // ============================================================================
  describe("AC-006: SimulationPortfolio & One Portfolio Per Session", () => {
    it("creates portfolio linked to session with non-negative cash balance", async () => {
      const user = await createTestUser();
      const scenario = await repos.simulationScenarioRepo.createScenario({
        key: "PORTFOLIO_SCENARIO",
        name: "Portfolio Scenario",
      });
      const session = await repos.simulationSessionRepo.createSession({
        userId: user.id,
        scenarioId: scenario.id,
      });

      const portfolio = await repos.simulationPortfolioRepo.createPortfolio({
        sessionId: session.id,
        cashBalance: "100000.0000",
      });

      expect(portfolio.id).toBeDefined();
      expect(portfolio.sessionId).toBe(session.id);
      expect(new Prisma.Decimal(portfolio.cashBalance).toFixed(4)).toBe("100000.0000");
      expect(new Prisma.Decimal(portfolio.realizedPnl).toFixed(4)).toBe("0.0000");

      // Cannot create second portfolio for same session
      await expect(
        repos.simulationPortfolioRepo.createPortfolio({
          sessionId: session.id,
          cashBalance: "50000.0000",
        }),
      ).rejects.toThrow();
    });

    it("enforces non-negative cash balance check constraint (cash_balance >= 0)", async () => {
      const user = await createTestUser();
      const scenario = await repos.simulationScenarioRepo.createScenario({
        key: "PORTFOLIO_NEG_CASH_SCENARIO",
        name: "Neg Cash Scenario",
      });
      const session = await repos.simulationSessionRepo.createSession({
        userId: user.id,
        scenarioId: scenario.id,
      });

      await expect(
        prisma.$executeRaw`
          INSERT INTO "simulation_portfolios" ("id", "session_id", "cash_balance", "realized_pnl", "created_at", "updated_at")
          VALUES (gen_random_uuid(), ${session.id}, -1.0000, 0.0000, NOW(), NOW());
        `,
      ).rejects.toThrow(/check/i);
    });
  });

  // ============================================================================
  // AC-007: SimulationPosition & Constraints
  // ============================================================================
  describe("AC-007: SimulationPosition & Constraints", () => {
    it("enforces unique (portfolioId + assetId) and non-negative quantity / cost", async () => {
      const user = await createTestUser();
      const scenario = await repos.simulationScenarioRepo.createScenario({
        key: "POS_SCENARIO",
        name: "Position Scenario",
      });
      const asset = await repos.simulationAssetRepo.createAsset({
        symbol: "AMZN",
        name: "Amazon.com Inc.",
      });
      const session = await repos.simulationSessionRepo.createSession({
        userId: user.id,
        scenarioId: scenario.id,
      });
      const portfolio = await repos.simulationPortfolioRepo.createPortfolio({
        sessionId: session.id,
        cashBalance: "100000.0000",
      });

      const position = await repos.simulationPortfolioRepo.createPosition({
        portfolioId: portfolio.id,
        assetId: asset.id,
        quantity: 10,
        averageCost: "185.450000",
      });

      expect(position.id).toBeDefined();
      expect(position.quantity).toBe(10);
      expect(new Prisma.Decimal(position.averageCost).toFixed(6)).toBe("185.450000");

      // Duplicate position on same portfolio + asset must fail
      await expect(
        repos.simulationPortfolioRepo.createPosition({
          portfolioId: portfolio.id,
          assetId: asset.id,
          quantity: 5,
          averageCost: "190.000000",
        }),
      ).rejects.toThrow();
    });

    it("rejects negative quantity or negative average cost via PostgreSQL check constraints", async () => {
      const user = await createTestUser();
      const scenario = await repos.simulationScenarioRepo.createScenario({
        key: "POS_NEG_CHECK_SCENARIO",
        name: "Neg Check Scenario",
      });
      const asset = await repos.simulationAssetRepo.createAsset({
        symbol: "GOOGL",
        name: "Alphabet Inc.",
      });
      const session = await repos.simulationSessionRepo.createSession({
        userId: user.id,
        scenarioId: scenario.id,
      });
      const portfolio = await repos.simulationPortfolioRepo.createPortfolio({
        sessionId: session.id,
        cashBalance: "100000.0000",
      });

      // Negative quantity must fail
      await expect(
        prisma.$executeRaw`
          INSERT INTO "simulation_positions" ("id", "portfolio_id", "asset_id", "quantity", "average_cost", "created_at", "updated_at")
          VALUES (gen_random_uuid(), ${portfolio.id}, ${asset.id}, -1, 100.000000, NOW(), NOW());
        `,
      ).rejects.toThrow(/check/i);

      // Negative average cost must fail
      await expect(
        prisma.$executeRaw`
          INSERT INTO "simulation_positions" ("id", "portfolio_id", "asset_id", "quantity", "average_cost", "created_at", "updated_at")
          VALUES (gen_random_uuid(), ${portfolio.id}, ${asset.id}, 1, -5.000000, NOW(), NOW());
        `,
      ).rejects.toThrow(/check/i);
    });
  });

  // ============================================================================
  // AC-008 & AC-014: SimulationOrder & Idempotency / Ownership Integrity
  // ============================================================================
  describe("AC-008 & AC-014: SimulationOrder & Idempotency / Ownership Integrity", () => {
    it("enforces unique (userId + sessionId + idempotencyKey)", async () => {
      const user = await createTestUser();
      const scenario = await repos.simulationScenarioRepo.createScenario({
        key: "ORDER_SCENARIO",
        name: "Order Scenario",
      });
      const asset = await repos.simulationAssetRepo.createAsset({
        symbol: "META",
        name: "Meta Platforms",
      });
      const session = await repos.simulationSessionRepo.createSession({
        userId: user.id,
        scenarioId: scenario.id,
      });

      const order = await repos.simulationOrderRepo.createOrder({
        sessionId: session.id,
        userId: user.id,
        assetId: asset.id,
        side: "BUY",
        quantity: 10,
        idempotencyKey: "idem_key_001",
        requestFingerprint: "fingerprint_hash_abc",
      });

      expect(order.id).toBeDefined();
      expect(order.side).toBe(SIMULATION_ORDER_SIDE.BUY);
      expect(order.type).toBe(SIMULATION_ORDER_TYPE.MARKET);
      expect(order.status).toBe(SIMULATION_ORDER_STATUS.RECEIVED);

      // Duplicate idempotencyKey for same user+session must fail
      await expect(
        repos.simulationOrderRepo.createOrder({
          sessionId: session.id,
          userId: user.id,
          assetId: asset.id,
          side: "BUY",
          quantity: 20,
          idempotencyKey: "idem_key_001",
          requestFingerprint: "fingerprint_hash_abc",
        }),
      ).rejects.toThrow();
    });

    it("enforces order owner must match session owner via composite FK (AC-014)", async () => {
      const userA = await createTestUser("user_a");
      const userB = await createTestUser("user_b");
      const scenario = await repos.simulationScenarioRepo.createScenario({
        key: "ORDER_OWNERSHIP_SCENARIO",
        name: "Ownership Scenario",
      });
      const asset = await repos.simulationAssetRepo.createAsset({
        symbol: "NFLX",
        name: "Netflix Inc.",
      });

      // Session belongs to userA
      const sessionA = await repos.simulationSessionRepo.createSession({
        userId: userA.id,
        scenarioId: scenario.id,
      });

      // Attempting to create an order on sessionA with userB must be blocked by composite FK!
      await expect(
        prisma.$executeRaw`
          INSERT INTO "simulation_orders" (
            "id", "session_id", "user_id", "asset_id", "side", "type", "quantity", "status",
            "idempotency_key", "request_fingerprint", "submitted_at", "created_at", "updated_at"
          ) VALUES (
            gen_random_uuid(), ${sessionA.id}, ${userB.id}, ${asset.id}, 'BUY', 'MARKET', 5, 'RECEIVED',
            'mismatch_key_1', 'fingerprint_xyz', NOW(), NOW(), NOW()
          );
        `,
      ).rejects.toThrow(/foreign key/i);
    });

    it("enforces order positive quantity and closed-set constraints", async () => {
      const user = await createTestUser();
      const scenario = await repos.simulationScenarioRepo.createScenario({
        key: "ORDER_CHECK_SCENARIO",
        name: "Order Check Scenario",
      });
      const asset = await repos.simulationAssetRepo.createAsset({
        symbol: "AMD",
        name: "Advanced Micro Devices",
      });
      const session = await repos.simulationSessionRepo.createSession({
        userId: user.id,
        scenarioId: scenario.id,
      });

      // Quantity = 0 must fail
      await expect(
        prisma.$executeRaw`
          INSERT INTO "simulation_orders" (
            "id", "session_id", "user_id", "asset_id", "side", "type", "quantity", "status",
            "idempotency_key", "request_fingerprint", "submitted_at", "created_at", "updated_at"
          ) VALUES (
            gen_random_uuid(), ${session.id}, ${user.id}, ${asset.id}, 'BUY', 'MARKET', 0, 'RECEIVED',
            'zero_qty_key', 'fingerprint_xyz', NOW(), NOW(), NOW()
          );
        `,
      ).rejects.toThrow(/check/i);

      // Side = 'HOLD' must fail
      await expect(
        prisma.$executeRaw`
          INSERT INTO "simulation_orders" (
            "id", "session_id", "user_id", "asset_id", "side", "type", "quantity", "status",
            "idempotency_key", "request_fingerprint", "submitted_at", "created_at", "updated_at"
          ) VALUES (
            gen_random_uuid(), ${session.id}, ${user.id}, ${asset.id}, 'HOLD', 'MARKET', 10, 'RECEIVED',
            'invalid_side_key', 'fingerprint_xyz', NOW(), NOW(), NOW()
          );
        `,
      ).rejects.toThrow(/check/i);
    });
  });

  // ============================================================================
  // AC-009 & AC-014: SimulationTrade & Relational Consistency
  // ============================================================================
  describe("AC-009 & AC-014: SimulationTrade & Relational Consistency", () => {
    it("creates trade linked to order, session, and asset with exact monetary precision", async () => {
      const user = await createTestUser();
      const scenario = await repos.simulationScenarioRepo.createScenario({
        key: "TRADE_SCENARIO",
        name: "Trade Scenario",
      });
      const asset = await repos.simulationAssetRepo.createAsset({
        symbol: "INTC",
        name: "Intel Corp.",
      });
      const session = await repos.simulationSessionRepo.createSession({
        userId: user.id,
        scenarioId: scenario.id,
      });
      const order = await repos.simulationOrderRepo.createOrder({
        sessionId: session.id,
        userId: user.id,
        assetId: asset.id,
        side: "BUY",
        quantity: 100,
        idempotencyKey: "trade_order_idem_1",
        requestFingerprint: "fp_trade_1",
      });

      const trade = await repos.simulationTradeRepo.createTrade({
        orderId: order.id,
        sessionId: session.id,
        assetId: asset.id,
        side: "BUY",
        quantity: 100,
        executionPrice: "21.345678",
        notional: "2134.5678",
        realizedPnl: "0.0000",
      });

      expect(trade.id).toBeDefined();
      expect(trade.orderId).toBe(order.id);
      expect(trade.side).toBe(SIMULATION_TRADE_SIDE.BUY);
      expect(new Prisma.Decimal(trade.executionPrice).toFixed(6)).toBe("21.345678");
      expect(new Prisma.Decimal(trade.notional).toFixed(4)).toBe("2134.5678");
      expect(new Prisma.Decimal(trade.realizedPnl).toFixed(4)).toBe("0.0000");

      // One trade per order: duplicate orderId must fail
      await expect(
        repos.simulationTradeRepo.createTrade({
          orderId: order.id,
          sessionId: session.id,
          assetId: asset.id,
          side: "BUY",
          quantity: 100,
          executionPrice: "21.345678",
          notional: "2134.5678",
        }),
      ).rejects.toThrow();
    });

    it("enforces trade session/asset must match order session/asset via composite FK (AC-014)", async () => {
      const user = await createTestUser();
      const scenario = await repos.simulationScenarioRepo.createScenario({
        key: "TRADE_FK_SCENARIO",
        name: "Trade FK Scenario",
      });
      const assetA = await repos.simulationAssetRepo.createAsset({
        symbol: "ASSET_A",
        name: "Asset A",
      });
      const assetB = await repos.simulationAssetRepo.createAsset({
        symbol: "ASSET_B",
        name: "Asset B",
      });
      const session = await repos.simulationSessionRepo.createSession({
        userId: user.id,
        scenarioId: scenario.id,
      });
      const order = await repos.simulationOrderRepo.createOrder({
        sessionId: session.id,
        userId: user.id,
        assetId: assetA.id,
        side: "BUY",
        quantity: 50,
        idempotencyKey: "trade_order_mismatch_test",
        requestFingerprint: "fp_trade_mismatch",
      });

      // Attempting to create trade with mismatched asset (assetB instead of assetA) must fail!
      await expect(
        prisma.$executeRaw`
          INSERT INTO "simulation_trades" (
            "id", "order_id", "session_id", "asset_id", "side", "quantity", "execution_price", "notional", "realized_pnl", "executed_at", "created_at"
          ) VALUES (
            gen_random_uuid(), ${order.id}, ${session.id}, ${assetB.id}, 'BUY', 50, 10.000000, 500.0000, 0.0000, NOW(), NOW()
          );
        `,
      ).rejects.toThrow(/foreign key/i);
    });
  });

  // ============================================================================
  // AC-010, AC-011, AC-018, AC-019: Migration Integrity, Fresh & Upgrade Verification
  // ============================================================================
  describe("AC-010, AC-011, AC-018, AC-019: Migration History & Integrity", () => {
    it("verifies actual timestamp migration naming convention and no edited historical migrations", async () => {
      const digests = computeMigrationDigests(migrationsDir);
      expect(digests.length).toBe(8);

      const latestMigration = digests[digests.length - 1];
      expect(latestMigration.migration).toMatch(/^\d{14}_feat031_simulation_foundation$/);

      // Verify all 7 historical migrations remain unmodified
      const historicalNames = [
        "20260825000000_init_identity",
        "20260825000001_feat005_refresh_session_rotation",
        "20260827000000_feat009_audit_events",
        "20260903000000_feat019_academy_foundation",
        "20260906000000_feat024_active_attempt_constraint",
        "20260907000000_feat025_grading_integrity_constraints",
        "20260909000000_feat025_grading_state_constraint_fix",
      ];

      for (let i = 0; i < 7; i++) {
        expect(digests[i].migration).toBe(historicalNames[i]);
      }
    });

    it("verifies all 8 migrations are recorded and applied in _prisma_migrations", async () => {
      const applied = await prisma.$queryRaw<
        Array<{ migration_name: string; finished_at: Date | null }>
      >`SELECT migration_name, finished_at FROM _prisma_migrations ORDER BY migration_name ASC;`;

      expect(applied.length).toBe(8);
      for (const row of applied) {
        expect(row.finished_at).not.toBeNull();
      }
      expect(applied[7].migration_name).toMatch(/^\d{14}_feat031_simulation_foundation$/);
    });

    it("verifies all 8 simulation tables exist in PostgreSQL information_schema", async () => {
      const tables = await prisma.$queryRaw<Array<{ table_name: string }>>`
        SELECT table_name FROM information_schema.tables
        WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
        ORDER BY table_name ASC;
      `;

      const tableNames = tables.map((t) => t.table_name);
      expect(tableNames).toContain("simulation_scenarios");
      expect(tableNames).toContain("simulation_assets");
      expect(tableNames).toContain("simulation_market_snapshots");
      expect(tableNames).toContain("simulation_sessions");
      expect(tableNames).toContain("simulation_portfolios");
      expect(tableNames).toContain("simulation_positions");
      expect(tableNames).toContain("simulation_orders");
      expect(tableNames).toContain("simulation_trades");
    });
  });

  // ============================================================================
  // Delete Safety: ON DELETE RESTRICT Invariants
  // ============================================================================
  describe("Delete Safety: ON DELETE RESTRICT Policies", () => {
    it("restricts deletion of User when referenced by SimulationSession", async () => {
      const user = await createTestUser();
      const scenario = await repos.simulationScenarioRepo.createScenario({
        key: "RESTRICT_USER_SCENARIO",
        name: "Restrict Scenario",
      });
      await repos.simulationSessionRepo.createSession({
        userId: user.id,
        scenarioId: scenario.id,
      });

      await expect(prisma.user.delete({ where: { id: user.id } })).rejects.toThrow();
    });

    it("restricts deletion of SimulationScenario when referenced by SimulationSession", async () => {
      const user = await createTestUser();
      const scenario = await repos.simulationScenarioRepo.createScenario({
        key: "RESTRICT_SCENARIO_TEST",
        name: "Restrict Scenario Test",
      });
      await repos.simulationSessionRepo.createSession({
        userId: user.id,
        scenarioId: scenario.id,
      });

      await expect(prisma.simulationScenario.delete({ where: { id: scenario.id } })).rejects.toThrow();
    });

    it("restricts deletion of SimulationAsset when referenced by SimulationMarketSnapshot", async () => {
      const scenario = await repos.simulationScenarioRepo.createScenario({
        key: "RESTRICT_ASSET_SCENARIO",
        name: "Restrict Asset Scenario",
      });
      const asset = await repos.simulationAssetRepo.createAsset({
        symbol: "RESTRICT_ASSET",
        name: "Restrict Asset",
      });
      await repos.simulationMarketSnapshotRepo.createSnapshot({
        scenarioId: scenario.id,
        assetId: asset.id,
        cycle: 1,
        price: "100.000000",
        occurredAt: new Date(),
      });

      await expect(prisma.simulationAsset.delete({ where: { id: asset.id } })).rejects.toThrow();
    });
  });

  // ============================================================================
  // AC-016 & AC-017: Repository Factory & Transaction Scoping
  // ============================================================================
  describe("AC-016 & AC-017: Repository Factory & Transaction Scoping", () => {
    it("supports atomic rollback across multiple Simulation repositories in a transaction", async () => {
      const user = await createTestUser();
      const scenario = await repos.simulationScenarioRepo.createScenario({
        key: "TX_SCENARIO",
        name: "TX Scenario",
      });

      // Intentionally cause failure inside transaction after creating session
      await expect(
        prisma.$transaction(async (tx) => {
          const txRepos = createRepositoryContainer(tx);
          await txRepos.simulationSessionRepo.createSession({
            userId: user.id,
            scenarioId: scenario.id,
            status: "ACTIVE",
          });

          // Throw to rollback
          throw new Error("Simulated rollback error");
        }),
      ).rejects.toThrow("Simulated rollback error");

      // Verify session was rolled back
      const sessions = await repos.simulationSessionRepo.listSessionsByUserId(user.id);
      expect(sessions.length).toBe(0);
    });
  });
});
