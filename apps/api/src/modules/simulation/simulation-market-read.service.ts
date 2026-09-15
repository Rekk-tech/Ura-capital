import { ERROR_CODES, HTTP_STATUS } from "@aura/shared";
import { AppError } from "../../shared/errors/error-envelope.js";
import type {
  ISimulationAssetRepository,
  ISimulationMarketSnapshotRepository,
  ISimulationScenarioRepository,
} from "./simulation.repository.js";
import {
  type SimulationAssetCatalogResponse,
  type SimulationMarketSnapshotResponse,
  toSimulationAssetDto,
  toSimulationMarketSnapshotDto,
} from "./simulation.dto.js";

const ACTIVE_STATUS = "ACTIVE";
const EQUITY_TYPE = "EQUITY";

export class SimulationMarketReadService {
  constructor(
    private readonly scenarioRepo: ISimulationScenarioRepository,
    private readonly assetRepo: ISimulationAssetRepository,
    private readonly snapshotRepo: ISimulationMarketSnapshotRepository,
  ) {}

  async listAssets(): Promise<SimulationAssetCatalogResponse> {
    const assets = await this.assetRepo.listAssets({
      status: ACTIVE_STATUS,
      assetType: EQUITY_TYPE,
    });

    return {
      data: assets.map(toSimulationAssetDto),
    };
  }

  async listScenarioSnapshots(
    scenarioKey: string,
    cycle: number,
  ): Promise<SimulationMarketSnapshotResponse> {
    const scenario = await this.scenarioRepo.findScenarioByKey(scenarioKey);

    if (!scenario || scenario.status !== ACTIVE_STATUS) {
      throw new AppError("Scenario not found", ERROR_CODES.NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }

    const snapshots = await this.snapshotRepo.listSnapshotsByScenarioAndCycle(
      scenario.id,
      cycle,
      {
        assetStatus: ACTIVE_STATUS,
        assetType: EQUITY_TYPE,
      },
    );

    if (snapshots.length === 0) {
      throw new AppError("Market snapshots not found", ERROR_CODES.NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }

    return {
      data: snapshots.map((snapshot) => toSimulationMarketSnapshotDto(scenario.key, snapshot)),
    };
  }
}
