import { Router } from "express";
import { authenticate } from "../auth/auth.middleware.js";
import { createRepositoryContainer } from "../../infrastructure/database/repository-factory.js";
import { transactionRunner } from "../../infrastructure/database/transaction-runner.js";
import { SimulationMarketReadService } from "./simulation-market-read.service.js";
import { SimulationMarketController } from "./simulation-market.controller.js";
import { SimulationSessionService } from "./simulation-session.service.js";
import { SimulationSessionController } from "./simulation-session.controller.js";

import { SimulationOrderService } from "./simulation-order.service.js";
import { SimulationOrderController } from "./simulation-order.controller.js";
import { SimulationValuationService } from "./simulation-valuation.service.js";
import { SimulationValuationController } from "./simulation-valuation.controller.js";
import { createSimulationOrderRateLimiter } from "./simulation-order.rate-limit.js";
import { map1GameController } from "./game/map1-game.controller.js";
import { map2GameController } from "./game/map2-game.controller.js";
import type { RequestHandler } from "express";

export function createSimulationRouter(
  marketController?: SimulationMarketController,
  sessionController?: SimulationSessionController,
  orderController?: SimulationOrderController,
  valuationController?: SimulationValuationController,
  orderRateLimiter?: RequestHandler,
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

  const orderService = new SimulationOrderService(
    repoContainer.simulationOrderRepo,
    repoContainer.simulationTradeRepo,
    repoContainer.simulationPortfolioRepo,
    repoContainer.simulationSessionRepo,
    repoContainer.simulationAssetRepo,
    repoContainer.simulationMarketSnapshotRepo,
    transactionRunner,
  );
  const orderCtrl =
    orderController ?? new SimulationOrderController(orderService);

  const valuationService = new SimulationValuationService(
    repoContainer.simulationSessionRepo,
    repoContainer.simulationPortfolioRepo,
    repoContainer.simulationMarketSnapshotRepo,
    repoContainer.simulationOrderRepo,
    repoContainer.simulationTradeRepo,
  );
  const valuationCtrl =
    valuationController ?? new SimulationValuationController(valuationService);

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

  const orderRateLimiterMiddleware =
    orderRateLimiter ?? createSimulationOrderRateLimiter();

  // FEAT-035 + FEAT-039: Market Order Submission & Execution (Rate-Limited)
  router.post(
    "/api/simulation/sessions/:simulationId/orders",
    authenticate,
    orderRateLimiterMiddleware,
    (req, res, next) => {
      orderCtrl.submitOrder(req, res, next);
    },
  );

  // FEAT-037: Portfolio Valuation, Orders & Trades Read Routes
  router.get(
    "/api/simulation/sessions/:simulationId/portfolio",
    authenticate,
    (req, res, next) => valuationCtrl.getPortfolio(req, res, next),
  );

  router.get(
    "/api/simulation/sessions/:simulationId/orders",
    authenticate,
    (req, res, next) => valuationCtrl.getOrders(req, res, next),
  );

  router.get(
    "/api/simulation/sessions/:simulationId/trades",
    authenticate,
    (req, res, next) => valuationCtrl.getTrades(req, res, next),
  );

  // ========================================================================
  // FEAT-082: Map 1 — FOMO Arena Dedicated Routes (AURA_MAP1_MAP2_GAME_SPEC)
  // ========================================================================
  router.post("/api/sim/map1/start", authenticate, (req, res, next) => {
    map1GameController.start(req, res, next);
  });

  router.get("/api/sim/map1/:id/state", authenticate, (req, res, next) => {
    map1GameController.getState(req, res, next);
  });

  router.post("/api/sim/map1/:id/order", authenticate, (req, res, next) => {
    map1GameController.submitOrder(req, res, next);
  });

  router.post("/api/sim/map1/:id/quiz", authenticate, (req, res, next) => {
    map1GameController.submitQuiz(req, res, next);
  });

  router.post("/api/sim/map1/:id/finish", authenticate, (req, res, next) => {
    map1GameController.finish(req, res, next);
  });

  // ========================================================================
  // FEAT-082: Map 2 — Pro Room Dedicated Routes (AURA_MAP1_MAP2_GAME_SPEC)
  // ========================================================================
  router.post("/api/sim/map2/start", authenticate, (req, res, next) => {
    map2GameController.start(req, res, next);
  });

  router.get("/api/sim/map2/:id/session", authenticate, (req, res, next) => {
    map2GameController.getSession(req, res, next);
  });

  router.post("/api/sim/map2/:id/allocate", authenticate, (req, res, next) => {
    map2GameController.allocate(req, res, next);
  });

  router.post("/api/sim/map2/:id/quiz", authenticate, (req, res, next) => {
    map2GameController.submitQuiz(req, res, next);
  });

  router.post("/api/sim/map2/:id/commit-quarter", authenticate, (req, res, next) => {
    map2GameController.commitQuarter(req, res, next);
  });

  router.get("/api/sim/map2/:id/report", authenticate, (req, res, next) => {
    map2GameController.getReport(req, res, next);
  });

  return router;
}

export const simulationRouter = createSimulationRouter();

