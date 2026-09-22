import express, { type Router, type Express } from "express";
import { rootRepositoryContainer } from "../../infrastructure/database/repository-factory.js";
import { errorHandlerMiddleware } from "../../middleware/error-handler.js";
import { SubscriptionEventProcessorService } from "./subscription-event-processor.service.js";
import { SubscriptionWebhookController } from "./subscription-webhook.controller.js";

export function createSubscriptionWebhookRouter(
  controller?: SubscriptionWebhookController,
): Router {
  const router = express.Router();

  const ctrl =
    controller ??
    new SubscriptionWebhookController(
      new SubscriptionEventProcessorService(
        rootRepositoryContainer.subscriptionRepo,
        rootRepositoryContainer.subscriptionProviderEventRepo,
        rootRepositoryContainer.subscriptionTransitionRepo,
      ),
    );

  // Bounded raw body middleware (64KB)
  const rawBodyParser = express.raw({ type: "*/*", limit: "64kb" });

  router.post(
    "/api/subscriptions/providers/mock/events",
    rawBodyParser,
    ctrl.handleMockWebhook,
  );

  router.post(
    "/subscriptions/providers/mock/events",
    rawBodyParser,
    ctrl.handleMockWebhook,
  );

  router.post(
    "/api/subscriptions/mock-webhook",
    rawBodyParser,
    ctrl.handleMockWebhook,
  );

  router.post(
    "/subscriptions/mock-webhook",
    rawBodyParser,
    ctrl.handleMockWebhook,
  );

  return router;
}

/**
 * Creates an isolated Express app harness for testing webhook processing.
 */
export function createMockWebhookHarnessApp(
  processorService?: SubscriptionEventProcessorService,
): Express {
  const app = express();
  const ctrl = new SubscriptionWebhookController(
    processorService ??
      new SubscriptionEventProcessorService(
        rootRepositoryContainer.subscriptionRepo,
        rootRepositoryContainer.subscriptionProviderEventRepo,
        rootRepositoryContainer.subscriptionTransitionRepo,
      ),
  );

  app.use(createSubscriptionWebhookRouter(ctrl));
  app.use(errorHandlerMiddleware);

  return app;
}

export const subscriptionWebhookRouter = createSubscriptionWebhookRouter();
