import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { PrismaClient } from "@prisma/client";
import { ERROR_CODES, HTTP_STATUS } from "@aura/shared";
import {
  createRepositoryContainer,
  type IRepositoryContainer,
} from "../../src/infrastructure/database/repository-factory.js";
import { SimulationMarketReadService } from "../../src/modules/simulation/simulation-market-read.service.js";
import { assertSafeTestDatabase, sanitizeDiagnosticMessage, cleanAllTestTables } from "../helpers/test-db-guard.js";

describe("FEAT-032 Simulation market read model (PostgreSQL)", () => {
  const testDbUrl =
    process.env.TEST_DATABASE_URL ||
    process.env.DATABASE_URL ||
    "postgresql://postgres:postgrespassword@localhost:5432/aura_capital_test_feat032";

  let prisma: PrismaClient;
  let repos: IRepositoryContainer;
  let service: SimulationMarketReadService;

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
      service = new SimulationMarketReadService(
        repos.simulationScenarioRepo,
        repos.simulationAssetRepo,
        repos.simulationMarketSnapshotRepo,
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
  });

  async function createScenarioWithAssetsAndSnapshots() {
    const scenario = await repos.simulationScenarioRepo.createScenario({
      key: "MVP_SCENARIO",
      name: "MVP Scenario",
      status: "ACTIVE",
    });
    const second = await repos.simulationAssetRepo.createAsset({
      symbol: "MSFT",
      name: "Microsoft Corp.",
      displayOrder: 2,
    });
    const first = await repos.simulationAssetRepo.createAsset({
      symbol: "AAPL",
      name: "Apple Inc.",
      displayOrder: 1,
    });

    await repos.simulationMarketSnapshotRepo.createSnapshot({
      scenarioId: scenario.id,
      assetId: second.id,
      cycle: 1,
      price: "310.250000",
      occurredAt: new Date("2026-09-15T01:00:00.000Z"),
    });
    await repos.simulationMarketSnapshotRepo.createSnapshot({
      scenarioId: scenario.id,
      assetId: first.id,
      cycle: 1,
      price: "189.120000",
      occurredAt: new Date("2026-09-15T01:00:00.000Z"),
    });

    return { scenario, first };
  }

  it("returns only active fixed mock equities ordered deterministically", async () => {
    await repos.simulationAssetRepo.createAsset({
      symbol: "MSFT",
      name: "Microsoft Corp.",
      displayOrder: 2,
    });
    await repos.simulationAssetRepo.createAsset({
      symbol: "AAPL",
      name: "Apple Inc.",
      displayOrder: 1,
    });
    await repos.simulationAssetRepo.createAsset({
      symbol: "ARCH",
      name: "Archived Inc.",
      status: "ARCHIVED",
      displayOrder: 0,
    });

    const result = await service.listAssets();

    expect(result.data.map((asset) => asset.symbol)).toEqual(["AAPL", "MSFT"]);
    expect(result.data.every((asset) => asset.assetType === "EQUITY")).toBe(true);
    expect(result.data.every((asset) => asset.status === "ACTIVE")).toBe(true);
    expect(result.data.every((asset) => asset.simulated === true)).toBe(true);
    expect(result.data[0]).not.toHaveProperty("id");
  });

  it("returns persisted snapshots ordered by asset display order with decimal strings", async () => {
    await createScenarioWithAssetsAndSnapshots();

    const result = await service.listScenarioSnapshots("MVP_SCENARIO", 1);

    expect(result.data).toEqual([
      {
        scenarioKey: "MVP_SCENARIO",
        cycle: 1,
        assetSymbol: "AAPL",
        price: "189.120000",
        occurredAt: "2026-09-15T01:00:00.000Z",
        simulated: true,
      },
      {
        scenarioKey: "MVP_SCENARIO",
        cycle: 1,
        assetSymbol: "MSFT",
        price: "310.250000",
        occurredAt: "2026-09-15T01:00:00.000Z",
        simulated: true,
      },
    ]);
  });

  it("does not mutate assets, snapshots, sessions, orders, or portfolio state on reads", async () => {
    await createScenarioWithAssetsAndSnapshots();
    const before = {
      assets: await prisma.simulationAsset.count(),
      snapshots: await prisma.simulationMarketSnapshot.count(),
      sessions: await prisma.simulationSession.count(),
      portfolios: await prisma.simulationPortfolio.count(),
      orders: await prisma.simulationOrder.count(),
    };

    await service.listAssets();
    await service.listScenarioSnapshots("MVP_SCENARIO", 1);

    await expect(prisma.simulationAsset.count()).resolves.toBe(before.assets);
    await expect(prisma.simulationMarketSnapshot.count()).resolves.toBe(before.snapshots);
    await expect(prisma.simulationSession.count()).resolves.toBe(before.sessions);
    await expect(prisma.simulationPortfolio.count()).resolves.toBe(before.portfolios);
    await expect(prisma.simulationOrder.count()).resolves.toBe(before.orders);
  });

  it("uses PostgreSQL uniqueness as final authority for duplicate snapshots", async () => {
    const { scenario, first } = await createScenarioWithAssetsAndSnapshots();

    await expect(
      repos.simulationMarketSnapshotRepo.createSnapshot({
        scenarioId: scenario.id,
        assetId: first.id,
        cycle: 1,
        price: "190.000000",
        occurredAt: new Date("2026-09-15T02:00:00.000Z"),
      }),
    ).rejects.toThrow();
  });

  it("returns safe errors for unknown scenario, archived scenario, and unavailable cycle", async () => {
    await createScenarioWithAssetsAndSnapshots();
    await repos.simulationScenarioRepo.createScenario({
      key: "ARCHIVED_SCENARIO",
      name: "Archived Scenario",
      status: "ARCHIVED",
    });

    await expect(service.listScenarioSnapshots("UNKNOWN_SCENARIO", 1)).rejects.toMatchObject({
      code: ERROR_CODES.NOT_FOUND,
      statusCode: HTTP_STATUS.NOT_FOUND,
      message: "Scenario not found",
    });
    await expect(service.listScenarioSnapshots("ARCHIVED_SCENARIO", 1)).rejects.toMatchObject({
      code: ERROR_CODES.NOT_FOUND,
      statusCode: HTTP_STATUS.NOT_FOUND,
      message: "Scenario not found",
    });
    await expect(service.listScenarioSnapshots("MVP_SCENARIO", 2)).rejects.toMatchObject({
      code: ERROR_CODES.NOT_FOUND,
      statusCode: HTTP_STATUS.NOT_FOUND,
      message: "Market snapshots not found",
    });
  });

  it("does not require Redis or external providers for market reads", async () => {
    await createScenarioWithAssetsAndSnapshots();

    const result = await service.listScenarioSnapshots("MVP_SCENARIO", 1);

    expect(result.data).toHaveLength(2);
    expect(result.data.every((snapshot) => snapshot.simulated)).toBe(true);
  });
});
