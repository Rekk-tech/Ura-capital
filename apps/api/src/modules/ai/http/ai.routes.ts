import { Router } from "express";
import { authenticate } from "../../auth/auth.middleware.js";
import { aiCoachController, AICoachController } from "./ai.controller.js";

export function createAiRouter(controller: AICoachController = aiCoachController): Router {
  const router = Router();

  // Primary authenticated AI Learning Coach endpoints (with /api and direct prefix support)
  router.post("/api/ai/coach", authenticate, controller.consultCoach);
  router.post("/ai/coach", authenticate, controller.consultCoach);
  router.post("/api/ai/chat", authenticate, controller.consultCoach);
  router.post("/ai/chat", authenticate, controller.consultCoach);

  return router;
}

export const aiRouter = createAiRouter();
