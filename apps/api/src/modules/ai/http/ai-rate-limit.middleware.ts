import type { Request, Response, NextFunction } from "express";
import { AppError } from "../../../shared/errors/error-envelope.js";
import { ERROR_CODES, HTTP_STATUS } from "@aura/shared";
import { aiRateLimiter, AIRateLimiter } from "./ai-rate-limiter.js";

export function createAiRateLimitMiddleware(limiter: AIRateLimiter = aiRateLimiter) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const user = (req as unknown as { user?: { id?: string; role?: string } }).user;
      const userId = user?.id || req.ip || "anonymous";
      const role = user?.role || "LEARNER";

      const status = limiter.checkLimit(userId, role);

      // Attach standard rate-limit headers
      res.setHeader("X-RateLimit-Limit", String(status.limit));
      res.setHeader("X-RateLimit-Remaining", String(status.remaining));

      if (!status.allowed) {
        res.setHeader("Retry-After", String(status.retryAfterSeconds));
        throw new AppError(
          `Bạn đã vượt quá giới hạn yêu cầu Cố vấn AI (${status.limit} lượt/phút). Vui lòng thử lại sau ${status.retryAfterSeconds} giây để đảm bảo tài nguyên hệ thống.`,
          ERROR_CODES.AI_RATE_LIMIT_EXCEEDED,
          HTTP_STATUS.TOO_MANY_REQUESTS,
        );
      }

      next();
    } catch (err: unknown) {
      next(err);
    }
  };
}

export const aiRateLimitMiddleware = createAiRateLimitMiddleware();
