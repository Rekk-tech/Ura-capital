import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import request from "supertest";
import { PrismaClient, Prisma } from "@prisma/client";
import { createApp } from "../../src/server.js";
import {
  createRepositoryContainer,
  type IRepositoryContainer,
} from "../../src/infrastructure/database/repository-factory.js";
import { accessTokenService } from "../../src/modules/auth/access-token.service.js";
import { userRepository } from "../../src/modules/users/user.repository.js";
import { assertSafeTestDatabase, cleanAllTestTables } from "../helpers/test-db-guard.js";
import { ERROR_CODES, HTTP_STATUS } from "@aura/shared";

import type { AccessTokenPayload } from "../../src/modules/auth/auth.types.js";
import type { User } from "@prisma/client";

const testDbUrl =
  process.env.TEST_DATABASE_URL ||
  process.env.DATABASE_URL ||
  "postgresql://postgres:postgrespassword@localhost:5432/aura_capital_test_feat019_rework2_fresh";

describe("FEAT-037: Current Portfolio Valuation & PnL Read Model (Live PostgreSQL)", () => {
  let prisma: PrismaClient;
  let repos: IRepositoryContainer;
  const app = createApp();

  let userA: { id: string; email: string };
  let userB: { id: string; email: string };
  let scenario: { id: string; key: string };
  let otherScenario: { id: string; key: string };
  let assetAura: { id: string; symbol: string };
  let assetSol: { id: string; symbol: string };

  let sessionA: { id: string };
  let portfolioA: { id: string };
  let sessionB: { id: string };

  const tokenUserA = "Bearer token-user-a";
  const tokenUserB = "Bearer token-user-b";

  beforeAll(async () => {
    assertSafeTestDatabase(testDbUrl, "test");
    prisma = new PrismaClient({ datasources: { db: { url: testDbUrl } } });
    await prisma.$connect();
    repos = createRepositoryContainer(prisma);
  });

  afterAll(async () => {
    if (prisma) {
      await cleanAllTestTables(prisma);
      await prisma.$disconnect();
    }
  });

  beforeEach(async () => {
    vi.restoreAllMocks();
    await cleanAllTestTables(prisma);

    // 1. Create test users
    userA = await prisma.user.create({
      data: {
        email: "usera-feat037@test.com",
        displayName: "User A",
        status: "ACTIVE",
      },
    });

    userB = await prisma.user.create({
      data: {
        email: "userb-feat037@test.com",
        displayName: "User B",
        status: "ACTIVE",
      },
    });

    // Mock auth middleware for tokens
    vi.spyOn(accessTokenService, "verifyAccessToken").mockImplementation((token: string) => {
      if (token === "token-user-a") {
        return {
          sub: userA.id,
          type: "access",
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + 3600,
        } as unknown as AccessTokenPayload;
      }
      if (token === "token-user-b") {
        return {
          sub: userB.id,
          type: "access",
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + 3600,
        } as unknown as AccessTokenPayload;
      }
      throw new Error("Invalid token");
    });

    vi.spyOn(userRepository, "findById").mockImplementation(async (id: string) => {
      if (id === userA.id) {
        return {
          id: userA.id,
          email: userA.email,
          status: "ACTIVE",
          displayName: "User A",
          createdAt: new Date(),
          updatedAt: new Date(),
        } as unknown as User;
      }
      if (id === userB.id) {
        return {
          id: userB.id,
          email: userB.email,
          status: "ACTIVE",
          displayName: "User B",
          createdAt: new Date(),
          updatedAt: new Date(),
        } as unknown as User;
      }
      return null;
    });

    // 2. Create scenarios
    scenario = await repos.simulationScenarioRepo.createScenario({
      key: "CRYPTO_ALPHA_FEAT037",
      name: "Crypto Alpha Valuation Scenario",
      status: "ACTIVE",
    });

    otherScenario = await repos.simulationScenarioRepo.createScenario({
      key: "OTHER_SCENARIO_FEAT037",
      name: "Other Scenario",
      status: "ACTIVE",
    });

    // 3. Create assets
    assetAura = await repos.simulationAssetRepo.createAsset({
      symbol: "AURA",
      name: "Aura Capital",
      displayOrder: 1,
    });

    assetSol = await repos.simulationAssetRepo.createAsset({
      symbol: "SOL",
      name: "Solana",
      displayOrder: 2,
    });

    // 4. Create market snapshots across cycles
    // Cycle 1 snapshots
    await repos.simulationMarketSnapshotRepo.createSnapshot({
      scenarioId: scenario.id,
      assetId: assetAura.id,
      cycle: 1,
      price: "100.000000",
      occurredAt: new Date(),
    });

    await repos.simulationMarketSnapshotRepo.createSnapshot({
      scenarioId: scenario.id,
      assetId: assetSol.id,
      cycle: 1,
      price: "50.000000",
      occurredAt: new Date(),
    });

    // Cycle 2 snapshots (price changes: AURA increases to 125, SOL decreases to 40)
    await repos.simulationMarketSnapshotRepo.createSnapshot({
      scenarioId: scenario.id,
      assetId: assetAura.id,
      cycle: 2,
      price: "125.000000",
      occurredAt: new Date(),
    });

    await repos.simulationMarketSnapshotRepo.createSnapshot({
      scenarioId: scenario.id,
      assetId: assetSol.id,
      cycle: 2,
      price: "40.000000",
      occurredAt: new Date(),
    });

    // Other scenario snapshot (should be isolated)
    await repos.simulationMarketSnapshotRepo.createSnapshot({
      scenarioId: otherScenario.id,
      assetId: assetAura.id,
      cycle: 2,
      price: "999.000000",
      occurredAt: new Date(),
    });

    // 5. Create active simulation session and portfolio for User A in cycle 2
    sessionA = await repos.simulationSessionRepo.createSession({
      userId: userA.id,
      scenarioId: scenario.id,
      status: "ACTIVE",
      startingCash: "100000.0000",
      currentCycle: 2,
      startedAt: new Date(),
    });

    portfolioA = await repos.simulationPortfolioRepo.createPortfolio({
      sessionId: sessionA.id,
      cashBalance: "80000.0000",
      realizedPnl: "1500.0000", // Authoritative realized PnL booked from previous sell
    });

    // Position 1: 100 shares AURA @ avgCost 100.000000
    await repos.simulationPortfolioRepo.createPosition({
      portfolioId: portfolioA.id,
      assetId: assetAura.id,
      quantity: 100,
      averageCost: "100.000000",
    });

    // Position 2: 200 shares SOL @ avgCost 50.000000
    await repos.simulationPortfolioRepo.createPosition({
      portfolioId: portfolioA.id,
      assetId: assetSol.id,
      quantity: 200,
      averageCost: "50.000000",
    });

    // 6. Create session and portfolio for User B
    sessionB = await repos.simulationSessionRepo.createSession({
      userId: userB.id,
      scenarioId: scenario.id,
      status: "ACTIVE",
      startingCash: "100000.0000",
      currentCycle: 1,
      startedAt: new Date(),
    });

    await repos.simulationPortfolioRepo.createPortfolio({
      sessionId: sessionB.id,
      cashBalance: "100000.0000",
      realizedPnl: "0.0000",
    });
  });

  describe("1. Architectural Boundaries (AC-001, AC-002, AC-013)", () => {
    it("AC-001: No historical valuation table is introduced into database", async () => {
      const tables = await prisma.$queryRaw<Array<{ table_name: string }>>(
        Prisma.sql`
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = 'public' 
            AND table_name ILIKE '%valuation%';
        `,
      );
      expect(tables).toHaveLength(0);
    });

    it("AC-002: No historical valuation chart/history API exists (GET .../valuations returns 404)", async () => {
      const res = await request(app)
        .get(`/api/simulation/sessions/${sessionA.id}/valuations`)
        .set("Authorization", tokenUserA)
        .expect(HTTP_STATUS.NOT_FOUND);

      expect(res.body.error).toBeDefined();
    });
  });

  describe("2. Portfolio Valuation Read Endpoint (AC-003, AC-004, AC-005, AC-006, AC-007, AC-011, AC-012)", () => {
    it("AC-003..AC-007, AC-011, AC-012: Returns current server-authoritative portfolio valuation against cycle 2 snapshots", async () => {
      const res = await request(app)
        .get(`/api/simulation/sessions/${sessionA.id}/portfolio`)
        .set("Authorization", tokenUserA)
        .expect(HTTP_STATUS.OK);

      const data = res.body.data;
      expect(data).toBeDefined();
      expect(data.sessionId).toBe(sessionA.id);
      expect(data.currentCycle).toBe(2);
      expect(data.simulated).toBe(true);

      // Calculations:
      // Cash: 80000.0000
      // Realized PnL: 1500.0000
      // AURA: qty 100, avgCost 100.000000, cycle 2 price 125.000000
      //   -> marketValue = 100 * 125 = 12500.0000
      //   -> unrealizedPnl = (125 - 100) * 100 = 2500.0000
      // SOL: qty 200, avgCost 50.000000, cycle 2 price 40.000000
      //   -> marketValue = 200 * 40 = 8000.0000
      //   -> unrealizedPnl = (40 - 50) * 200 = -2000.0000
      // Total Market Value = 12500 + 8000 = 20500.0000
      // Total Unrealized PnL = 2500 - 2000 = 500.0000
      // Total Equity = Cash (80000) + Total Market Value (20500) = 100500.0000
      expect(data.cashBalance).toBe("80000.0000");
      expect(data.realizedPnl).toBe("1500.0000");
      expect(data.marketValue).toBe("20500.0000");
      expect(data.unrealizedPnl).toBe("500.0000");
      expect(data.totalEquity).toBe("100500.0000");

      expect(data.positions).toHaveLength(2);
      const posAura = data.positions.find((p: { symbol: string }) => p.symbol === "AURA");
      expect(posAura).toBeDefined();
      expect(posAura.quantity).toBe(100);
      expect(posAura.averageCost).toBe("100.000000");
      expect(posAura.currentPrice).toBe("125.000000");
      expect(posAura.marketValue).toBe("12500.0000");
      expect(posAura.unrealizedPnl).toBe("2500.0000");

      const posSol = data.positions.find((p: { symbol: string }) => p.symbol === "SOL");
      expect(posSol).toBeDefined();
      expect(posSol.quantity).toBe(200);
      expect(posSol.averageCost).toBe("50.000000");
      expect(posSol.currentPrice).toBe("40.000000");
      expect(posSol.marketValue).toBe("8000.0000");
      expect(posSol.unrealizedPnl).toBe("-2000.0000");
    });

    it("verifies zero position semantics with preserved cost basis", async () => {
      // Add a position with quantity 0
      await repos.simulationPortfolioRepo.createPosition({
        portfolioId: portfolioA.id,
        assetId: assetAura.id,
        quantity: 0,
        averageCost: "115.500000",
      }).catch(async () => {
        await repos.simulationPortfolioRepo.upsertPosition(
          portfolioA.id,
          assetAura.id,
          0,
          "115.500000",
        );
      });

      const res = await request(app)
        .get(`/api/simulation/sessions/${sessionA.id}/portfolio`)
        .set("Authorization", tokenUserA)
        .expect(HTTP_STATUS.OK);

      const posAura = res.body.data.positions.find((p: { symbol: string }) => p.symbol === "AURA");
      expect(posAura).toBeDefined();
      expect(posAura.quantity).toBe(0);
      expect(posAura.averageCost).toBe("115.500000");
      expect(posAura.marketValue).toBe("0.0000");
      expect(posAura.unrealizedPnl).toBe("0.0000");
    });

    it("rejects with 400 when market snapshot is missing for a held position", async () => {
      // Create asset without cycle 2 snapshot
      const unpricedAsset = await repos.simulationAssetRepo.createAsset({
        symbol: "UNPRICED",
        name: "Unpriced Asset",
      });

      await repos.simulationPortfolioRepo.createPosition({
        portfolioId: portfolioA.id,
        assetId: unpricedAsset.id,
        quantity: 10,
        averageCost: "10.000000",
      });

      const res = await request(app)
        .get(`/api/simulation/sessions/${sessionA.id}/portfolio`)
        .set("Authorization", tokenUserA)
        .expect(HTTP_STATUS.BAD_REQUEST);

      expect(res.body.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
      expect(res.body.error.message).toContain("Missing snapshot price");
    });
  });

  describe("3. Security, Owner-Only Scope & IDOR Protection (AC-008, AC-009)", () => {
    it("AC-009: User B cannot read User A portfolio (returns 404 NOT_FOUND)", async () => {
      const res = await request(app)
        .get(`/api/simulation/sessions/${sessionA.id}/portfolio`)
        .set("Authorization", tokenUserB)
        .expect(HTTP_STATUS.NOT_FOUND);

      expect(res.body.error.code).toBe(ERROR_CODES.NOT_FOUND);
      expect(res.body.error.message).toBe("Simulation session not found");
    });

    it("AC-008, AC-009: User B cannot read User A orders (returns 404 NOT_FOUND)", async () => {
      const res = await request(app)
        .get(`/api/simulation/sessions/${sessionA.id}/orders`)
        .set("Authorization", tokenUserB)
        .expect(HTTP_STATUS.NOT_FOUND);

      expect(res.body.error.code).toBe(ERROR_CODES.NOT_FOUND);
    });

    it("AC-008, AC-009: User B cannot read User A trades (returns 404 NOT_FOUND)", async () => {
      const res = await request(app)
        .get(`/api/simulation/sessions/${sessionA.id}/trades`)
        .set("Authorization", tokenUserB)
        .expect(HTTP_STATUS.NOT_FOUND);

      expect(res.body.error.code).toBe(ERROR_CODES.NOT_FOUND);
    });

    it("requires authentication on all valuation routes (401 UNAUTHENTICATED)", async () => {
      await request(app)
        .get(`/api/simulation/sessions/${sessionA.id}/portfolio`)
        .expect(HTTP_STATUS.UNAUTHORIZED);

      await request(app)
        .get(`/api/simulation/sessions/${sessionA.id}/orders`)
        .expect(HTTP_STATUS.UNAUTHORIZED);

      await request(app)
        .get(`/api/simulation/sessions/${sessionA.id}/trades`)
        .expect(HTTP_STATUS.UNAUTHORIZED);
    });
  });

  describe("4. Read-Only Invariant Verification (AC-010)", () => {
    it("AC-010: Executing GET calls causes ZERO mutations to database state", async () => {
      // 1. Capture exact pre-call database state
      const prePortfolios = await prisma.simulationPortfolio.findMany({ orderBy: { id: "asc" } });
      const prePositions = await prisma.simulationPosition.findMany({ orderBy: { id: "asc" } });
      const preOrders = await prisma.simulationOrder.findMany({ orderBy: { id: "asc" } });
      const preTrades = await prisma.simulationTrade.findMany({ orderBy: { id: "asc" } });
      const preSnapshots = await prisma.simulationMarketSnapshot.findMany({ orderBy: { id: "asc" } });
      const preSessions = await prisma.simulationSession.findMany({ orderBy: { id: "asc" } });

      // 2. Dispatch multiple GET calls
      for (let i = 0; i < 5; i++) {
        await request(app)
          .get(`/api/simulation/sessions/${sessionA.id}/portfolio`)
          .set("Authorization", tokenUserA)
          .expect(HTTP_STATUS.OK);

        await request(app)
          .get(`/api/simulation/sessions/${sessionA.id}/orders`)
          .set("Authorization", tokenUserA)
          .expect(HTTP_STATUS.OK);

        await request(app)
          .get(`/api/simulation/sessions/${sessionA.id}/trades`)
          .set("Authorization", tokenUserA)
          .expect(HTTP_STATUS.OK);
      }

      // 3. Capture exact post-call database state
      const postPortfolios = await prisma.simulationPortfolio.findMany({ orderBy: { id: "asc" } });
      const postPositions = await prisma.simulationPosition.findMany({ orderBy: { id: "asc" } });
      const postOrders = await prisma.simulationOrder.findMany({ orderBy: { id: "asc" } });
      const postTrades = await prisma.simulationTrade.findMany({ orderBy: { id: "asc" } });
      const postSnapshots = await prisma.simulationMarketSnapshot.findMany({ orderBy: { id: "asc" } });
      const postSessions = await prisma.simulationSession.findMany({ orderBy: { id: "asc" } });

      // 4. Assert absolute zero mutation across counts, financial values, and updatedAt timestamps
      expect(postPortfolios.length).toBe(prePortfolios.length);
      expect(postPositions.length).toBe(prePositions.length);
      expect(postOrders.length).toBe(preOrders.length);
      expect(postTrades.length).toBe(preTrades.length);
      expect(postSnapshots.length).toBe(preSnapshots.length);
      expect(postSessions.length).toBe(preSessions.length);

      for (let i = 0; i < prePortfolios.length; i++) {
        expect(postPortfolios[i].cashBalance.toFixed(4)).toBe(prePortfolios[i].cashBalance.toFixed(4));
        expect(postPortfolios[i].realizedPnl.toFixed(4)).toBe(prePortfolios[i].realizedPnl.toFixed(4));
        expect(postPortfolios[i].updatedAt.toISOString()).toBe(prePortfolios[i].updatedAt.toISOString());
      }

      for (let i = 0; i < prePositions.length; i++) {
        expect(postPositions[i].quantity).toBe(prePositions[i].quantity);
        expect(postPositions[i].averageCost.toFixed(6)).toBe(prePositions[i].averageCost.toFixed(6));
        expect(postPositions[i].updatedAt.toISOString()).toBe(prePositions[i].updatedAt.toISOString());
      }
    });
  });

  describe("5. Session Orders and Trades History Reads (AC-008, AC-011, AC-012)", () => {
    it("returns owner order and trade history with deterministic sorting and safe DTOs", async () => {
      // Create an order and trade for User A
      const order = await repos.simulationOrderRepo.createOrder({
        sessionId: sessionA.id,
        userId: userA.id,
        assetId: assetAura.id,
        side: "BUY",
        type: "MARKET",
        quantity: 10,
        status: "FILLED",
        idempotencyKey: "test-order-key-1",
        requestFingerprint: "fingerprint-test-1",
        executionPrice: "100.000000",
        executedQuantity: 10,
      });

      await repos.simulationTradeRepo.createTrade({
        orderId: order.id,
        sessionId: sessionA.id,
        assetId: assetAura.id,
        side: "BUY",
        quantity: 10,
        executionPrice: "100.000000",
        notional: "1000.0000",
        realizedPnl: "0.0000",
      });

      // 1. Read orders
      const orderRes = await request(app)
        .get(`/api/simulation/sessions/${sessionA.id}/orders`)
        .set("Authorization", tokenUserA)
        .expect(HTTP_STATUS.OK);

      expect(orderRes.body.data).toHaveLength(1);
      const o = orderRes.body.data[0];
      expect(o.id).toBe(order.id);
      expect(o.side).toBe("BUY");
      expect(o.status).toBe("FILLED");
      expect(o.executionPrice).toBe("100.000000");
      expect(o.realizedPnl).toBe("0.0000");
      expect(o.simulated).toBe(true);
      expect(o).not.toHaveProperty("requestFingerprint");
      expect(o).not.toHaveProperty("userId");

      // 2. Read trades
      const tradeRes = await request(app)
        .get(`/api/simulation/sessions/${sessionA.id}/trades`)
        .set("Authorization", tokenUserA)
        .expect(HTTP_STATUS.OK);

      expect(tradeRes.body.data).toHaveLength(1);
      const t = tradeRes.body.data[0];
      expect(t.orderId).toBe(order.id);
      expect(t.side).toBe("BUY");
      expect(t.assetSymbol).toBe("AURA");
      expect(t.executionPrice).toBe("100.000000");
      expect(t.notional).toBe("1000.0000");
      expect(t.realizedPnl).toBe("0.0000");
      expect(t.simulated).toBe(true);
      expect(t).not.toHaveProperty("sessionId");
    });
  });
});
