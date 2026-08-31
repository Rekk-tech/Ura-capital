import { Router } from "express";
import { healthController } from "./health.controller.js";

const router = Router();

router.get("/health", (req, res) => healthController.getHealth(req, res));
router.get("/api/health", (req, res) => healthController.getHealth(req, res));

export const healthRouter = router;
