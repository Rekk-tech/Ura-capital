import { Router } from "express";
import { authenticate } from "../auth/auth.middleware.js";
import { createRepositoryContainer } from "../../infrastructure/database/repository-factory.js";
import { transactionRunner } from "../../infrastructure/database/transaction-runner.js";
import { SimulationSessionService } from "./simulation-session.service.js";
import { SimulationSessionController } from "./simulation-session.controller.js";

export function createSimulationRouter(
  controller?: SimulationSessionController,
): Router {
  const router = Router();
  const repoContainer = createRepositoryContainer();
  const sessionService = new SimulationSessionService(
    repoContainer.simulationSessionRepo,
    repoContainer.simulationScenarioRepo,
    repoContainer.simulationPortfolioRepo,
    transactionRunner,
  );
  const ctrl = controller ?? new SimulationSessionController(sessionService);

  // Simulation Session Lifecycle Routes
  router.get("/api/simulation/sessions", authenticate, (req, res, next) => {
    ctrl.listSessions(req, res, next);
  });

  router.post("/api/simulation/sessions", authenticate, (req, res, next) => {
    ctrl.createSession(req, res, next);
  });

  router.get("/api/simulation/sessions/:simulationId", authenticate, (req, res, next) => {
    ctrl.getSessionById(req, res, next);
  });

  router.post("/api/simulation/sessions/:simulationId/start", authenticate, (req, res, next) => {
    ctrl.startSession(req, res, next);
  });

  router.post("/api/simulation/sessions/:simulationId/complete", authenticate, (req, res, next) => {
    ctrl.completeSession(req, res, next);
  });

  router.post("/api/simulation/sessions/:simulationId/cancel", authenticate, (req, res, next) => {
    ctrl.cancelSession(req, res, next);
  });

  router.post("/api/simulation/sessions/:simulationId/reset", authenticate, (req, res, next) => {
    ctrl.resetSession(req, res, next);
  });

  return router;
}

export const simulationRouter = createSimulationRouter();
