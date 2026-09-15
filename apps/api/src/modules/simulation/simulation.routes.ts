import { Router } from "express";
import { authenticate } from "../auth/auth.middleware.js";
import { createRepositoryContainer } from "../../infrastructure/database/repository-factory.js";
import { transactionRunner } from "../../infrastructure/database/transaction-runner.js";
import { SimulationMarketReadService } from "./simulation-market-read.service.js";
import { SimulationMarketController } from "./simulation-market.controller.js";
import { SimulationSessionService } from "./simulation-session.service.js";
import { SimulationSessionController } from "./simulation-session.controller.js";

export function createSimulationRouter(
  marketController?: SimulationMarketController,
  sessionController?: SimulationSessionController,
): Router {
  const router = Router();
  const repoContainer = createRepositoryContainer();

  const marketCtrl =
    marketController ??
    new SimulationMarketController(
      new SimulationMarketReadService(
        repoContainer.simulationScenarioRepo,
        repoContainer.simulationAssetRepo,
        repoContainer.simulationMarketSnapshotRepo,
      ),
    );

  const sessionService = new SimulationSessionService(
    repoContainer.simulationSessionRepo,
    repoContainer.simulationScenarioRepo,
    repoContainer.simulationPortfolioRepo,
    transactionRunner,
  );
  const sessionCtrl =
    sessionController ?? new SimulationSessionController(sessionService);

  // FEAT-032: Market Read Routes
  router.get("/api/simulation/assets", authenticate, (req, res, next) =>
    marketCtrl.listAssets(req, res, next),
  );

  router.get(
    "/api/simulation/scenarios/:scenarioKey/snapshots/:cycle",
    authenticate,
    (req, res, next) => marketCtrl.listScenarioSnapshots(req, res, next),
  );

  // FEAT-033: Simulation Session Lifecycle Routes
  router.get("/api/simulation/sessions", authenticate, (req, res, next) => {
    sessionCtrl.listSessions(req, res, next);
  });

  router.post("/api/simulation/sessions", authenticate, (req, res, next) => {
    sessionCtrl.createSession(req, res, next);
  });

  router.get("/api/simulation/sessions/:simulationId", authenticate, (req, res, next) => {
    sessionCtrl.getSessionById(req, res, next);
  });

  router.post("/api/simulation/sessions/:simulationId/start", authenticate, (req, res, next) => {
    sessionCtrl.startSession(req, res, next);
  });

  router.post("/api/simulation/sessions/:simulationId/complete", authenticate, (req, res, next) => {
    sessionCtrl.completeSession(req, res, next);
  });

  router.post("/api/simulation/sessions/:simulationId/cancel", authenticate, (req, res, next) => {
    sessionCtrl.cancelSession(req, res, next);
  });

  router.post("/api/simulation/sessions/:simulationId/reset", authenticate, (req, res, next) => {
    sessionCtrl.resetSession(req, res, next);
  });

  return router;
}

export const simulationRouter = createSimulationRouter();
