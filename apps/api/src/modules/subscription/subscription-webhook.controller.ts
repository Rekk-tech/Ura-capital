import { type Request, type Response, type NextFunction } from "express";
import { HTTP_STATUS, ERROR_CODES } from "@aura/shared";
import { AppError } from "../../shared/errors/error-envelope.js";
import { type SubscriptionEventProcessorService } from "./subscription-event-processor.service.js";

export class SubscriptionWebhookController {
  constructor(private readonly processorService: SubscriptionEventProcessorService) {}

  /**
   * Handles incoming mock provider webhook events in isolated dev/test environments.
   * Prohibited and fails closed in production.
   */
  handleMockWebhook = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Production defense: Reject immediately if in production
      if (process.env.NODE_ENV === "production") {
        throw new AppError("Endpoint not found", ERROR_CODES.NOT_FOUND, HTTP_STATUS.NOT_FOUND);
      }

      const signatureHeader =
        (req.headers["x-mock-signature"] as string | undefined) ??
        (req.headers["x-subscription-signature"] as string | undefined) ??
        (req.headers["signature"] as string | undefined) ??
        "";

      const rawBody: Buffer | string =
        Buffer.isBuffer(req.body)
          ? req.body
          : typeof req.body === "string"
            ? req.body
            : JSON.stringify(req.body ?? {});

      const result = await this.processorService.processWebhook({
        providerKey: "MOCK",
        signature: signatureHeader,
        rawBody,
      });

      res.status(HTTP_STATUS.OK).json({
        data: {
          outcome: result.outcome,
          duplicate: result.duplicate,
          providerEventId: result.providerEventId,
          subscriptionId: result.subscriptionId,
          status: result.status,
          planKey: result.planKey,
          reason: result.reason,
        },
      });
    } catch (err: unknown) {
      next(err);
    }
  };
}
