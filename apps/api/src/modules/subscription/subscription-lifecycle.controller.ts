import { type Request, type Response, type NextFunction } from "express";
import { ERROR_CODES, HTTP_STATUS } from "@aura/shared";
import { AppError } from "../../shared/errors/error-envelope.js";
import type { AuthenticatedRequest } from "../auth/auth.types.js";
import {
  CancelIntentInputSchema,
  CheckoutIntentInputSchema,
  FORBIDDEN_CLIENT_AUTHORITY_KEYS,
} from "./subscription-lifecycle.dto.js";
import { type SubscriptionLifecycleService } from "./subscription-lifecycle.service.js";

function assertNoClientAuthorityTampering(body: unknown): void {
  if (!body || typeof body !== "object") return;
  const candidate = body as Record<string, unknown>;
  for (const key of Object.keys(candidate)) {
    if (FORBIDDEN_CLIENT_AUTHORITY_KEYS.includes(key)) {
      throw new AppError(
        `Client authority tampering detected: field '${key}' is server-authoritative and prohibited in client requests`,
        ERROR_CODES.VALIDATION_ERROR,
        HTTP_STATUS.BAD_REQUEST,
      );
    }
  }
}

export class SubscriptionLifecycleController {
  constructor(private readonly service: SubscriptionLifecycleService) {}

  /**
   * POST /api/subscriptions/checkout
   * Initiates provider-neutral checkout intent.
   * Gated: fails closed in production.
   */
  handleCheckoutIntent = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      if (process.env.NODE_ENV === "production") {
        throw new AppError("Endpoint not found", ERROR_CODES.NOT_FOUND, HTTP_STATUS.NOT_FOUND);
      }

      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user?.id;
      if (!userId) {
        throw new AppError(
          "Authentication required",
          ERROR_CODES.UNAUTHENTICATED,
          HTTP_STATUS.UNAUTHORIZED,
        );
      }

      assertNoClientAuthorityTampering(req.body);

      const parseResult = CheckoutIntentInputSchema.safeParse(req.body ?? {});
      if (!parseResult.success) {
        throw new AppError(
          "Invalid checkout intent payload",
          ERROR_CODES.VALIDATION_ERROR,
          HTTP_STATUS.BAD_REQUEST,
        );
      }

      const result = await this.service.createCheckoutIntent({
        userId,
        planKey: parseResult.data.plan,
        requestId: req.id,
      });

      res.status(HTTP_STATUS.OK).json({ data: result });
    } catch (err: unknown) {
      next(err);
    }
  };

  /**
   * POST /api/subscriptions/cancel
   * Requests cancellation of caller's active subscription.
   * Gated: fails closed in production.
   */
  handleCancel = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      if (process.env.NODE_ENV === "production") {
        throw new AppError("Endpoint not found", ERROR_CODES.NOT_FOUND, HTTP_STATUS.NOT_FOUND);
      }

      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user?.id;
      if (!userId) {
        throw new AppError(
          "Authentication required",
          ERROR_CODES.UNAUTHENTICATED,
          HTTP_STATUS.UNAUTHORIZED,
        );
      }

      assertNoClientAuthorityTampering(req.body);

      const parseResult = CancelIntentInputSchema.safeParse(req.body ?? {});
      if (!parseResult.success) {
        throw new AppError(
          "Invalid cancel intent payload",
          ERROR_CODES.VALIDATION_ERROR,
          HTTP_STATUS.BAD_REQUEST,
        );
      }

      const result = await this.service.cancelSubscription({
        userId,
        reason: parseResult.data.reason,
        requestId: req.id,
      });

      res.status(HTTP_STATUS.OK).json({ data: result });
    } catch (err: unknown) {
      next(err);
    }
  };
}
