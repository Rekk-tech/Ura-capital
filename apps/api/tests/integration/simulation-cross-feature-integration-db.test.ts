import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import { PrismaClient } from "@prisma/client";
import { createApp } from "../../src/server.js";
import {
  createRepositoryContainer,
  type IRepositoryContainer,
} from "../../src/infrastructure/database/repository-factory.js";
import { transactionRunner } from "../../src/infrastructure/database/transaction-runner.js";
import { SimulationMarketReadService } from "../../src/modules/simulation/simulation-market-read.service.js";
import { SimulationSessionService } from "../../src/modules/simulation/simulation-session.service.js";
import { accessTokenService } from "../../src/modules/auth/access-token.service.js";
import { assertSafeTestDatabase, cleanAllTestTables } from "../helpers/test-db-guard.js";

const testDbUrl =
  process.env.TEST_DATABASE_URL ||
  "postgresql://postgres:postgrespassword@localhost:5432/aura_capital_test_feat019_rework2_fresh";

describe("FEAT-032 + FEAT-033 Simulation Foundation Integration (PostgreSQL)", () => {
  let prisma: PrismaClient;
  let repos: IRepositoryContainer;
  const app = createApp();

  beforeAll(async () => {
    assertSafeTestDatabase(testDbUrl);
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
    await cleanAllTestTables(prisma);
  });

  async function seedScenarioWithSnapshots() {
    const scenario = await repos.simulationScenarioRepo.createScenario({
      key: "MVP_SCENARIO",
      name: "MVP Scenario",
      status: "ACTIVE",
    });

    const asset1 = await repos.simulationAssetRepo.createAsset({
      symbol: "AAPL",
      name: "Apple Inc.",
      displayOrder: 1,
    });

    const asset2 = await repos.simulationAssetRepo.createAsset({
      symbol: "MSFT",
      name: "Microsoft Corp.",
      displayOrder: 2,
    });

    await repos.simulationMarketSnapshotRepo.createSnapshot({
      scenarioId: scenario.id,
      assetId: asset1.id,
      cycle: 1,
      price: "150.250000",
      occurredAt: new Date("2026-09-15T01:00:00.000Z"),
    });

    await repos.simulationMarketSnapshotRepo.createSnapshot({
      scenarioId: scenario.id,
      assetId: asset2.id,
      cycle: 1,
      price: "310.500000",
      occurredAt: new Date("2026-09-15T01:00:00.000Z"),
    });

    return { scenario, asset1, asset2 };
  }

  it("proves scenario binding, cycle compatibility, and Decimal serialization across FEAT-032 and FEAT-033", async () => {
    await seedScenarioWithSnapshots();

    const marketService = new SimulationMarketReadService(
      repos.simulationScenarioRepo,
      repos.simulationAssetRepo,
      repos.simulationMarketSnapshotRepo,
    );
    const sessionService = new SimulationSessionService(
      repos.simulationSessionRepo,
      repos.simulationScenarioRepo,
      repos.simulationPortfolioRepo,
      transactionRunner,
    );

    // 1. Create unique test user
    const user = await prisma.user.create({
      data: {
        email: `cross.feature.${Date.now()}@auracapital.test`,
        displayName: "Simulation Cross Tester",
        status: "ACTIVE",
      },
    });

    // 2. Read market assets via FEAT-032 read model
    const assets = await marketService.listAssets();
    expect(assets.data.length).toBeGreaterThanOrEqual(2);
    expect(assets.data.every((a) => a.simulated === true)).toBe(true);

    // 3. Read MVP scenario snapshots via FEAT-032 read model for cycle 1
    const snapshots = await marketService.listScenarioSnapshots("MVP_SCENARIO", 1);
    expect(snapshots.data.length).toBeGreaterThanOrEqual(2);
    expect(snapshots.data[0].cycle).toBe(1);
    expect(snapshots.data[0].simulated).toBe(true);
    // Verify Decimal price serialization
    expect(typeof snapshots.data[0].price).toBe("string");
    expect(/^\d+\.\d{6}$/.test(snapshots.data[0].price)).toBe(true);

    // 4. Create simulation session via FEAT-033 lifecycle service
    const session = await sessionService.createSession(user.id);
    expect(session.status).toBe("CREATED");
    expect(session.currentCycle).toBe(1);
    expect(session.scenarioKey).toBe("MVP_SCENARIO");

    // 5. Verify session scenario resolves against the exact same scenario authority
    const resolvedScenario = await repos.simulationScenarioRepo.findScenarioById(session.scenarioId);
    expect(resolvedScenario).not.toBeNull();
    expect(resolvedScenario?.key).toBe("MVP_SCENARIO");

    // 6. Verify cycle field compatibility: session currentCycle matches snapshot cycle
    expect(session.currentCycle).toBe(snapshots.data[0].cycle);

    // 7. Start session via FEAT-033 lifecycle service
    const activeSession = await sessionService.startSession(user.id, session.id);
    expect(activeSession.status).toBe("ACTIVE");
    expect(activeSession.startedAt).not.toBeNull();

    // 8. Verify route coexistence via HTTP (FEAT-032 and FEAT-033 endpoints)
    const { accessToken } = accessTokenService.issueAccessToken(user.id);
    const authHeader = `Bearer ${accessToken}`;

    // FEAT-032 asset route
    const assetRes = await request(app)
      .get("/api/simulation/assets")
      .set("Authorization", authHeader)
      .expect(200);
    expect(Array.isArray(assetRes.body.data)).toBe(true);

    // FEAT-032 scenario snapshot route
    const snapshotRes = await request(app)
      .get("/api/simulation/scenarios/MVP_SCENARIO/snapshots/1")
      .set("Authorization", authHeader)
      .expect(200);
    expect(Array.isArray(snapshotRes.body.data)).toBe(true);

    // FEAT-033 session read route
    const sessionRes = await request(app)
      .get(`/api/simulation/sessions/${session.id}`)
      .set("Authorization", authHeader)
      .expect(200);
    expect(sessionRes.body.data.id).toBe(session.id);
    expect(sessionRes.body.data.status).toBe("ACTIVE");
    expect(sessionRes.body.data.scenarioKey).toBe("MVP_SCENARIO");
    expect(sessionRes.body.data.currentCycle).toBe(1);

    // 9. Complete session
    const completed = await sessionService.completeSession(user.id, session.id);
    expect(completed.status).toBe("COMPLETED");
    expect(completed.completedAt).not.toBeNull();
  });
});
