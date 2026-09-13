import type { Response, NextFunction } from "express";
import { HTTP_STATUS, ERROR_CODES } from "@aura/shared";
import { AppError } from "../../shared/errors/error-envelope.js";
import type { AuthenticatedRequest } from "../auth/auth.types.js";
import type { AcademyRewardService } from "./academy-reward.service.js";

export class AcademyRewardController {
  constructor(private readonly service: AcademyRewardService) {}

  /**
   * GET /api/academy/me/xp
   * Authenticated current-user XP read endpoint.
   * Derives user strictly from authenticated principal claims.
   * Returns minimal safe learner DTO containing totalXp only.
   * AC-013, AC-016, AC-026.
   */
  async getMyXp(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError(
          "Authentication required",
          ERROR_CODES.UNAUTHENTICATED,
          HTTP_STATUS.UNAUTHORIZED,
        );
      }

      const result = await this.service.getMyXp(userId);
      res.status(HTTP_STATUS.OK).json({ data: result });
    } catch (error) {
      next(error);
    }
  }
}
