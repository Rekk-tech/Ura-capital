import { Router } from "express";
import { healthController } from "./health.controller.js";

const router = Router();

router.get("/health", (req, res) => healthController.getHealth(req, res));
router.get("/api/health", (req, res) => healthController.getHealth(req, res));

router.get("/health/liveness", (req, res) => healthController.getLiveness(req, res));
router.get("/api/health/liveness", (req, res) => healthController.getLiveness(req, res));

router.get("/health/readiness", (req, res) => healthController.getReadiness(req, res));
router.get("/api/health/readiness", (req, res) => healthController.getReadiness(req, res));

export const healthRouter = router;
