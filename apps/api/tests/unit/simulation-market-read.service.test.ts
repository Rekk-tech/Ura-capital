import { describe, expect, it, vi } from "vitest";
import { Prisma } from "@prisma/client";
import { ERROR_CODES, HTTP_STATUS } from "@aura/shared";
import { SimulationMarketReadService } from "../../src/modules/simulation/simulation-market-read.service.js";
import type {
  ISimulationAssetRepository,
  ISimulationMarketSnapshotRepository,
  ISimulationScenarioRepository,
} from "../../src/modules/simulation/simulation.repository.js";
import { AppError } from "../../src/shared/errors/error-envelope.js";

function createService(overrides: {
  scenarioRepo?: Partial<ISimulationScenarioRepository>;
  assetRepo?: Partial<ISimulationAssetRepository>;
  snapshotRepo?: Partial<ISimulationMarketSnapshotRepository>;
} = {}) {
  const scenarioRepo = {
    findScenarioByKey: vi.fn(),
    ...overrides.scenarioRepo,
  } as unknown as ISimulationScenarioRepository;
  const assetRepo = {
    listAssets: vi.fn(),
    ...overrides.assetRepo,
  } as unknown as ISimulationAssetRepository;
  const snapshotRepo = {
    listSnapshotsByScenarioAndCycle: vi.fn(),
    ...overrides.snapshotRepo,
  } as unknown as ISimulationMarketSnapshotRepository;

  return {
    service: new SimulationMarketReadService(scenarioRepo, assetRepo, snapshotRepo),
    scenarioRepo,
    assetRepo,
    snapshotRepo,
  };
}

describe("FEAT-032 Simulation market read service", () => {
  it("returns safe asset DTOs with stable symbols and simulated marker", async () => {
    const { service, assetRepo } = createService({
      assetRepo: {
        listAssets: vi.fn().mockResolvedValue([
          {
            id: "asset-internal-id",
            symbol: "AAPL",
            name: "Apple Inc.",
            assetType: "EQUITY",
            status: "ACTIVE",
            displayOrder: 1,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ]),
      },
    });

    const result = await service.listAssets();

    expect(assetRepo.listAssets).toHaveBeenCalledWith({
      status: "ACTIVE",
      assetType: "EQUITY",
    });
    expect(result).toEqual({
      data: [
        {
          symbol: "AAPL",
          name: "Apple Inc.",
          assetType: "EQUITY",
          status: "ACTIVE",
          displayOrder: 1,
          simulated: true,
        },
      ],
    });
    expect(result.data[0]).not.toHaveProperty("id");
    expect(result.data[0]).not.toHaveProperty("createdAt");
    expect(result.data[0]).not.toHaveProperty("updatedAt");
  });

  it("returns persisted snapshot DTOs with decimal string price", async () => {
    const { service, scenarioRepo, snapshotRepo } = createService({
      scenarioRepo: {
        findScenarioByKey: vi.fn().mockResolvedValue({
          id: "scenario-id",
          key: "MVP_SCENARIO",
          name: "MVP Scenario",
          status: "ACTIVE",
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      },
      snapshotRepo: {
        listSnapshotsByScenarioAndCycle: vi.fn().mockResolvedValue([
          {
            id: "snapshot-id",
            scenarioId: "scenario-id",
            assetId: "asset-id",
            cycle: 1,
            price: new Prisma.Decimal("189.120000"),
            occurredAt: new Date("2026-09-15T00:00:00.000Z"),
            createdAt: new Date(),
            asset: {
              id: "asset-id",
              symbol: "AAPL",
              name: "Apple Inc.",
              assetType: "EQUITY",
              status: "ACTIVE",
              displayOrder: 1,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          },
        ]),
      },
    });

    const result = await service.listScenarioSnapshots("MVP_SCENARIO", 1);

    expect(scenarioRepo.findScenarioByKey).toHaveBeenCalledWith("MVP_SCENARIO");
    expect(snapshotRepo.listSnapshotsByScenarioAndCycle).toHaveBeenCalledWith(
      "scenario-id",
      1,
      {
        assetStatus: "ACTIVE",
        assetType: "EQUITY",
      },
    );
    expect(result).toEqual({
      data: [
        {
          scenarioKey: "MVP_SCENARIO",
          cycle: 1,
          assetSymbol: "AAPL",
          price: "189.120000",
          occurredAt: "2026-09-15T00:00:00.000Z",
          simulated: true,
        },
      ],
    });
    expect(result.data[0]).not.toHaveProperty("id");
    expect(result.data[0]).not.toHaveProperty("scenarioId");
    expect(result.data[0]).not.toHaveProperty("assetId");
  });

  it("returns safe not found for unknown or archived scenario", async () => {
    const { service } = createService({
      scenarioRepo: {
        findScenarioByKey: vi.fn().mockResolvedValue({
          id: "scenario-id",
          key: "MVP_SCENARIO",
          name: "MVP Scenario",
          status: "ARCHIVED",
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      },
    });

    await expect(service.listScenarioSnapshots("MVP_SCENARIO", 1)).rejects.toMatchObject({
      message: "Scenario not found",
      code: ERROR_CODES.NOT_FOUND,
      statusCode: HTTP_STATUS.NOT_FOUND,
    } satisfies Partial<AppError>);
  });

  it("returns safe not found when no active equity snapshots exist for the cycle", async () => {
    const { service } = createService({
      scenarioRepo: {
        findScenarioByKey: vi.fn().mockResolvedValue({
          id: "scenario-id",
          key: "MVP_SCENARIO",
          name: "MVP Scenario",
          status: "ACTIVE",
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      },
      snapshotRepo: {
        listSnapshotsByScenarioAndCycle: vi.fn().mockResolvedValue([]),
      },
    });

    await expect(service.listScenarioSnapshots("MVP_SCENARIO", 99)).rejects.toMatchObject({
      message: "Market snapshots not found",
      code: ERROR_CODES.NOT_FOUND,
      statusCode: HTTP_STATUS.NOT_FOUND,
    } satisfies Partial<AppError>);
  });
});
