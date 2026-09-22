import type { Request, Response, NextFunction } from "express";
import { HTTP_STATUS, ERROR_CODES } from "@aura/shared";
import { AppError } from "../../shared/errors/error-envelope.js";
import type { AuthenticatedRequest } from "../auth/auth.types.js";
import type { SubscriptionReadService } from "./subscription-read.service.js";
import {
  noQueryParamsSchema,
  rejectRequestBody,
} from "./subscription.validation.js";

/**
 * Controller handling subscription read endpoints.
 * Endpoints:
 * - GET /api/subscriptions/plans (Public safe read)
 * - GET /api/subscriptions/me (Authenticated current-user read)
 *
 * Invariants:
 * - AC-003, AC-010: Rejects unexpected query/body fields.
 * - AC-009: No client-supplied userId accepted; strictly uses server-derived req.user.id.
 * - AC-011: Pure read; zero database mutations, zero provider calls.
 */
export class SubscriptionController {
  constructor(private readonly service: SubscriptionReadService) {}

  /**
   * GET /api/subscriptions/plans
   * Public safe plan catalog read.
   */
  async getPlans(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsedQuery = noQueryParamsSchema.safeParse(req.query);
      if (!parsedQuery.success) {
        throw parsedQuery.error;
      }
      rejectRequestBody(req);

      const result = this.service.getPlans();
      res.status(HTTP_STATUS.OK).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/subscriptions/me
   * Authenticated current-user subscription and entitlement projection.
   */
  async getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsedQuery = noQueryParamsSchema.safeParse(req.query);
      if (!parsedQuery.success) {
        throw parsedQuery.error;
      }
      rejectRequestBody(req);

      const authenticatedReq = req as AuthenticatedRequest;
      const userId = authenticatedReq.user?.id;

      if (!userId || typeof userId !== "string") {
        throw new AppError(
          "Authorization header is required",
          ERROR_CODES.UNAUTHENTICATED,
          HTTP_STATUS.UNAUTHORIZED,
        );
      }

      const result = await this.service.getCurrentUserSubscription(userId);
      res.status(HTTP_STATUS.OK).json(result);
    } catch (error) {
      next(error);
    }
  }
}
