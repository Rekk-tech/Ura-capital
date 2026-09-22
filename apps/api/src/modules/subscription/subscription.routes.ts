import { Router } from "express";
import { authenticate } from "../auth/auth.middleware.js";
import { createRepositoryContainer } from "../../infrastructure/database/repository-factory.js";
import { SubscriptionEntitlementService } from "./subscription-entitlement.service.js";
import { systemClock } from "./subscription-entitlement.types.js";
import { SubscriptionReadService } from "./subscription-read.service.js";
import { SubscriptionController } from "./subscription.controller.js";

/**
 * Creates the Express router for subscription domain endpoints.
 * Routes:
 * - GET /api/subscriptions/plans: PUBLIC SAFE READ
 * - GET /api/subscriptions/me: AUTHENTICATED
 *
 * Enforces AC-001, AC-002: Exactly the approved canonical routes.
 * Zero checkout, cancel, webhook, or admin routes exist.
 */
export function createSubscriptionRouter(
  controller?: SubscriptionController,
  readService?: SubscriptionReadService,
): Router {
  const router = Router();
  const repoContainer = createRepositoryContainer();
  const entitlementService = new SubscriptionEntitlementService(
    repoContainer.subscriptionRepo,
    systemClock,
  );
  const service = readService ?? new SubscriptionReadService(entitlementService);
  const ctrl = controller ?? new SubscriptionController(service);

  // 1. Plan Catalog (Public Safe Read - FR-001, AC-001, AC-002)
  router.get("/api/subscriptions/plans", (req, res, next) => ctrl.getPlans(req, res, next));
  router.get("/subscriptions/plans", (req, res, next) => ctrl.getPlans(req, res, next));

  // 2. Current User Subscription (Authenticated - FR-002, AC-001, AC-002)
  router.get("/api/subscriptions/me", authenticate, (req, res, next) => ctrl.getMe(req, res, next));
  router.get("/subscriptions/me", authenticate, (req, res, next) => ctrl.getMe(req, res, next));

  return router;
}

export const subscriptionRouter = createSubscriptionRouter();
