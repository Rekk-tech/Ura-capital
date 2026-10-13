import { Router } from "express";
import { authenticate } from "../../auth/auth.middleware.js";
import { requireAiEntitlement } from "./ai-entitlement.middleware.js";
import { aiRateLimitMiddleware } from "./ai-rate-limit.middleware.js";
import { aiCoachController, AICoachController } from "./ai.controller.js";

export function createAiRouter(controller: AICoachController = aiCoachController): Router {
  const router = Router();

  // Defense-in-depth pipeline: Authenticate -> Membership Entitlement -> Rate Limiting -> Guardrail & Coach
  router.post(
    "/api/ai/coach",
    authenticate,
    requireAiEntitlement,
    aiRateLimitMiddleware,
    controller.consultCoach,
  );
  router.post(
    "/ai/coach",
    authenticate,
    requireAiEntitlement,
    aiRateLimitMiddleware,
    controller.consultCoach,
  );
  router.post(
    "/api/ai/chat",
    authenticate,
    requireAiEntitlement,
    aiRateLimitMiddleware,
    controller.consultCoach,
  );
  router.post(
    "/ai/chat",
    authenticate,
    requireAiEntitlement,
    aiRateLimitMiddleware,
    controller.consultCoach,
  );

  return router;
}

export const aiRouter = createAiRouter();
