import express, { type Router, type Express } from "express";
import { rootRepositoryContainer } from "../../infrastructure/database/repository-factory.js";
import { transactionRunner } from "../../infrastructure/database/transaction-runner.js";
import { createAuthenticateMiddleware } from "../auth/auth.middleware.js";
import { errorHandlerMiddleware } from "../../middleware/error-handler.js";
import { SubscriptionLifecycleService } from "./subscription-lifecycle.service.js";
import { SubscriptionLifecycleController } from "./subscription-lifecycle.controller.js";
import {
  createSubscriptionRateLimiter,
  type SubscriptionRateLimitOptions,
} from "./subscription-lifecycle.rate-limit.js";

export interface SubscriptionLifecycleRouterOptions {
  controller?: SubscriptionLifecycleController;
  rateLimitOverrides?: {
    checkout?: Partial<SubscriptionRateLimitOptions>;
    cancel?: Partial<SubscriptionRateLimitOptions>;
  };
}

export function createSubscriptionLifecycleRouter(
  options: SubscriptionLifecycleRouterOptions = {},
): Router {
  const router = express.Router();

  const ctrl =
    options.controller ??
    new SubscriptionLifecycleController(
      new SubscriptionLifecycleService(
        rootRepositoryContainer.subscriptionRepo,
        rootRepositoryContainer.subscriptionTransitionRepo,
        transactionRunner,
      ),
    );

  const authenticate = createAuthenticateMiddleware();

  const checkoutLimiter = createSubscriptionRateLimiter({
    operation: "checkout",
    ...options.rateLimitOverrides?.checkout,
  });

  const cancelLimiter = createSubscriptionRateLimiter({
    operation: "cancel",
    ...options.rateLimitOverrides?.cancel,
  });

  router.post(
    "/api/subscriptions/checkout",
    authenticate,
    checkoutLimiter,
    ctrl.handleCheckoutIntent,
  );

  router.post(
    "/subscriptions/checkout",
    authenticate,
    checkoutLimiter,
    ctrl.handleCheckoutIntent,
  );

  router.post(
    "/api/subscriptions/cancel",
    authenticate,
    cancelLimiter,
    ctrl.handleCancel,
  );

  router.post(
    "/subscriptions/cancel",
    authenticate,
    cancelLimiter,
    ctrl.handleCancel,
  );

  return router;
}

/**
 * Creates an isolated Express test harness for subscription lifecycle commands.
 */
export function createMockSubscriptionLifecycleHarnessApp(
  service?: SubscriptionLifecycleService,
  rateLimitOverrides?: SubscriptionLifecycleRouterOptions["rateLimitOverrides"],
): Express {
  const app = express();
  app.use(express.json());

  const ctrl = new SubscriptionLifecycleController(
    service ??
      new SubscriptionLifecycleService(
        rootRepositoryContainer.subscriptionRepo,
        rootRepositoryContainer.subscriptionTransitionRepo,
        transactionRunner,
      ),
  );

  app.use(createSubscriptionLifecycleRouter({ controller: ctrl, rateLimitOverrides }));
  app.use(errorHandlerMiddleware);

  return app;
}

export const subscriptionLifecycleRouter = createSubscriptionLifecycleRouter();
