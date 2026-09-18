import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import { PrismaClient, Prisma } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { createApp } from "../../src/server.js";
import { assertSafeTestDatabase, cleanAllTestTables, sanitizeDiagnosticMessage } from "../helpers/test-db-guard.js";
import { HTTP_STATUS, ERROR_CODES } from "@aura/shared";

const testDbUrl =
  process.env.TEST_DATABASE_URL ||
  process.env.DATABASE_URL ||
  "postgresql://postgres:postgrespassword@localhost:5432/aura_capital_test_feat019_rework2_fresh";

describe("DEF-003 / DEF-004: Full Authenticated Learner Simulation Journey (Live PostgreSQL + API)", () => {
  let prisma: PrismaClient;
  const app = createApp();

  let learnerEmail: string;
  let learnerPassword: string;
  let learnerToken: string;
  let scenario: { id: string; key: string };
  let assetAura: { id: string; symbol: string };

  beforeAll(async () => {
    assertSafeTestDatabase(testDbUrl, "test");
    prisma = new PrismaClient({ datasources: { db: { url: testDbUrl } } });
    try {
      await prisma.$connect();
    } catch (err: unknown) {
      const safeError = sanitizeDiagnosticMessage(err instanceof Error ? err.message : String(err));
      throw new Error(`[DB_CONNECT_FAILED] PostgreSQL test database unreachable: ${safeError}`);
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

    // 1. Register a real learner through the canonical Auth API
    learnerEmail = `learner_${randomUUID().slice(0, 8)}@example.com`;
    learnerPassword = "Password123!Secure";

    const registerRes = await request(app)
      .post("/api/auth/register")
      .send({
        email: learnerEmail,
        password: learnerPassword,
      });

    expect(registerRes.status).toBe(HTTP_STATUS.CREATED);

    // 2. Login to receive server-issued Bearer access token
    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({
        email: learnerEmail,
        password: learnerPassword,
      });

    expect(loginRes.status).toBe(HTTP_STATUS.OK);
    expect(loginRes.body.accessToken).toBeDefined();
    learnerToken = `Bearer ${loginRes.body.accessToken}`;

    // 3. Seed authoritative Scenario, Asset, and Cycle Snapshot
    scenario = await prisma.simulationScenario.create({
      data: {
        id: randomUUID(),
        key: "MVP_SCENARIO",
        name: "MVP Market Scenario",
      },
    });

    assetAura = await prisma.simulationAsset.create({
      data: {
        id: randomUUID(),
        symbol: "AURA",
        name: "Aura Capital",
        assetType: "EQUITY",
        status: "ACTIVE",
      },
    });

    await prisma.simulationMarketSnapshot.create({
      data: {
        id: randomUUID(),
        scenarioId: scenario.id,
        assetId: assetAura.id,
        cycle: 1,
        price: new Prisma.Decimal("100.000000"),
        occurredAt: new Date(),
      },
    });
  });

  it("1. Unauthenticated requests to simulation routes strictly return 401 UNAUTHORIZED (AC-004, DEF-003)", async () => {
    // Attempting to list sessions without Bearer token
    const listRes = await request(app).get("/api/simulation/sessions");
    expect(listRes.status).toBe(HTTP_STATUS.UNAUTHORIZED);

    // Attempting to create session without Bearer token
    const createRes = await request(app).post("/api/simulation/sessions").send({});
    expect(createRes.status).toBe(HTTP_STATUS.UNAUTHORIZED);

    // Attempting to read assets without Bearer token
    const assetsRes = await request(app).get("/api/simulation/assets");
    expect(assetsRes.status).toBe(HTTP_STATUS.UNAUTHORIZED);
  });

  it("2. DEF-004: Create session rejects startingCash authority field and accepts canonical empty payload", async () => {
    // Sending startingCash must be rejected with 400 VALIDATION_ERROR
    const forbiddenRes = await request(app)
      .post("/api/simulation/sessions")
      .set("Authorization", learnerToken)
      .send({ startingCash: "100000.0000" });

    expect(forbiddenRes.status).toBe(HTTP_STATUS.BAD_REQUEST);
    expect(forbiddenRes.body.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);

    // Sending empty body {} succeeds and initializes session with server-authoritative starting cash
    const validRes = await request(app)
      .post("/api/simulation/sessions")
      .set("Authorization", learnerToken)
      .send({});

    expect(validRes.status).toBe(HTTP_STATUS.CREATED);
    expect(validRes.body.data.id).toBeDefined();
    expect(validRes.body.data.status).toBe("CREATED");
    expect(validRes.body.data.startingCash).toBe("100000.0000");
  });

  it("3. Executes full authenticated learner journey: create -> start -> read -> BUY -> SELL -> complete", async () => {
    // Step A: Create session
    const createRes = await request(app)
      .post("/api/simulation/sessions")
      .set("Authorization", learnerToken)
      .send({});
    expect(createRes.status).toBe(HTTP_STATUS.CREATED);
    const sessionId = createRes.body.data.id;

    // Step B: Start session
    const startRes = await request(app)
      .post(`/api/simulation/sessions/${sessionId}/start`)
      .set("Authorization", learnerToken);
    expect(startRes.status).toBe(HTTP_STATUS.OK);
    expect(startRes.body.data.status).toBe("ACTIVE");

    // Step C: Read assets universe
    const assetsRes = await request(app)
      .get("/api/simulation/assets")
      .set("Authorization", learnerToken);
    expect(assetsRes.status).toBe(HTTP_STATUS.OK);
    expect(assetsRes.body.data).toHaveLength(1);
    expect(assetsRes.body.data[0].symbol).toBe("AURA");

    // Step D: Read market snapshots for current cycle
    const snapRes = await request(app)
      .get(`/api/simulation/scenarios/${scenario.key}/snapshots/1`)
      .set("Authorization", learnerToken);
    expect(snapRes.status).toBe(HTTP_STATUS.OK);
    expect(snapRes.body.data).toHaveLength(1);
    expect(snapRes.body.data[0].price).toBe("100.000000");

    // Step E: Read initial portfolio valuation
    const initialPortRes = await request(app)
      .get(`/api/simulation/sessions/${sessionId}/portfolio`)
      .set("Authorization", learnerToken);
    expect(initialPortRes.status).toBe(HTTP_STATUS.OK);
    expect(initialPortRes.body.data.cashBalance).toBe("100000.0000");
    expect(initialPortRes.body.data.totalEquity).toBe("100000.0000");
    expect(initialPortRes.body.data.positions).toHaveLength(0);

    // Step F: Submit MARKET BUY order for 10 shares of AURA
    const buyRes = await request(app)
      .post(`/api/simulation/sessions/${sessionId}/orders`)
      .set("Authorization", learnerToken)
      .send({
        side: "BUY",
        type: "MARKET",
        assetSymbol: "AURA",
        quantity: 10,
        idempotencyKey: randomUUID(),
      });
    expect(buyRes.status).toBe(HTTP_STATUS.CREATED);
    expect(buyRes.body.data.status).toBe("FILLED");
    expect(buyRes.body.data.executionPrice).toBe("100.000000");
    expect(buyRes.body.data.executedQuantity).toBe(10);
    expect(buyRes.body.data.realizedPnl).toBe("0.0000");

    // Step G: Verify updated portfolio after BUY
    const postBuyPort = await request(app)
      .get(`/api/simulation/sessions/${sessionId}/portfolio`)
      .set("Authorization", learnerToken);
    expect(postBuyPort.status).toBe(HTTP_STATUS.OK);
    expect(postBuyPort.body.data.cashBalance).toBe("99000.0000");
    expect(postBuyPort.body.data.totalEquity).toBe("100000.0000");
    expect(postBuyPort.body.data.positions).toHaveLength(1);
    expect(postBuyPort.body.data.positions[0].symbol).toBe("AURA");
    expect(postBuyPort.body.data.positions[0].quantity).toBe(10);
    expect(postBuyPort.body.data.positions[0].averageCost).toBe("100.000000");

    // Step H: Verify order and trade history
    const ordersRes = await request(app)
      .get(`/api/simulation/sessions/${sessionId}/orders`)
      .set("Authorization", learnerToken);
    expect(ordersRes.status).toBe(HTTP_STATUS.OK);
    expect(ordersRes.body.data).toHaveLength(1);
    expect(ordersRes.body.data[0].status).toBe("FILLED");

    const tradesRes = await request(app)
      .get(`/api/simulation/sessions/${sessionId}/trades`)
      .set("Authorization", learnerToken);
    expect(tradesRes.status).toBe(HTTP_STATUS.OK);
    expect(tradesRes.body.data).toHaveLength(1);
    expect(tradesRes.body.data[0].side).toBe("BUY");
    expect(tradesRes.body.data[0].quantity).toBe(10);
    expect(tradesRes.body.data[0].notional).toBe("1000.0000");

    // Step I: Submit MARKET SELL order for 4 shares of AURA
    const sellRes = await request(app)
      .post(`/api/simulation/sessions/${sessionId}/orders`)
      .set("Authorization", learnerToken)
      .send({
        side: "SELL",
        type: "MARKET",
        assetSymbol: "AURA",
        quantity: 4,
        idempotencyKey: randomUUID(),
      });
    expect(sellRes.status).toBe(HTTP_STATUS.CREATED);
    expect(sellRes.body.data.status).toBe("FILLED");
    expect(sellRes.body.data.executionPrice).toBe("100.000000");
    expect(sellRes.body.data.executedQuantity).toBe(4);
    expect(sellRes.body.data.realizedPnl).toBe("0.0000");

    // Step J: Verify portfolio after SELL
    const postSellPort = await request(app)
      .get(`/api/simulation/sessions/${sessionId}/portfolio`)
      .set("Authorization", learnerToken);
    expect(postSellPort.status).toBe(HTTP_STATUS.OK);
    expect(postSellPort.body.data.cashBalance).toBe("99400.0000");
    expect(postSellPort.body.data.positions[0].quantity).toBe(6);

    // Step K: Complete session
    const completeRes = await request(app)
      .post(`/api/simulation/sessions/${sessionId}/complete`)
      .set("Authorization", learnerToken);
    expect(completeRes.status).toBe(HTTP_STATUS.OK);
    expect(completeRes.body.data.status).toBe("COMPLETED");

    // Step L: Verify order rejection on COMPLETED session
    const postCompleteOrderRes = await request(app)
      .post(`/api/simulation/sessions/${sessionId}/orders`)
      .set("Authorization", learnerToken)
      .send({
        side: "BUY",
        type: "MARKET",
        assetSymbol: "AURA",
        quantity: 1,
        idempotencyKey: randomUUID(),
      });
    expect([HTTP_STATUS.BAD_REQUEST, HTTP_STATUS.CONFLICT]).toContain(postCompleteOrderRes.status);
  });
});
