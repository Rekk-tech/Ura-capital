import { Router } from "express";
import { authenticate } from "../auth/auth.middleware.js";
import { createRepositoryContainer } from "../../infrastructure/database/repository-factory.js";
import { SimulationMarketReadService } from "./simulation-market-read.service.js";
import { SimulationMarketController } from "./simulation-market.controller.js";

export function createSimulationRouter(controller?: SimulationMarketController): Router {
  const router = Router();
  const repoContainer = createRepositoryContainer();
  const ctrl =
    controller ??
    new SimulationMarketController(
      new SimulationMarketReadService(
        repoContainer.simulationScenarioRepo,
        repoContainer.simulationAssetRepo,
        repoContainer.simulationMarketSnapshotRepo,
      ),
    );

  router.get("/api/simulation/assets", authenticate, (req, res, next) =>
    ctrl.listAssets(req, res, next),
  );

  router.get(
    "/api/simulation/scenarios/:scenarioKey/snapshots/:cycle",
    authenticate,
    (req, res, next) => ctrl.listScenarioSnapshots(req, res, next),
  );

  return router;
}

export const simulationRouter = createSimulationRouter();
