import type { Request, Response, NextFunction } from "express";
import {
  type IRefreshTokenService,
  refreshTokenService,
} from "./refresh-token.service.js";
import { extractRefreshToken, setRefreshCookie } from "./refresh-cookie.js";
import { AppError } from "../../shared/errors/error-envelope.js";
import { ERROR_CODES, HTTP_STATUS, type RefreshResponse } from "@aura/shared";
import { auditService } from "./audit.service.js";
import { AUDIT_REASON_CODES } from "./audit-event.constants.js";

export class RefreshController {
  constructor(private readonly service: IRefreshTokenService = refreshTokenService) {}

  refresh = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const rawToken = extractRefreshToken(req);

      if (!rawToken) {
        await auditService.recordRefreshFailure({
          reasonCode: AUDIT_REASON_CODES.MISSING_REFRESH_COOKIE,
          requestId: req.id,
          userAgent: req.headers ? (req.headers["user-agent"] as string) : undefined,
        });
        throw new AppError(
          "Refresh token cookie is required",
          ERROR_CODES.UNAUTHENTICATED,
          HTTP_STATUS.UNAUTHORIZED,
        );
      }

      const result = await this.service.refresh(rawToken, {
        userAgent: req.headers["user-agent"] ?? null,
        ipAddress: req.ip ?? req.socket.remoteAddress ?? null,
        requestId: req.id,
      });

      // Deliver rotated refresh token through HttpOnly cookie
      setRefreshCookie(res, result.newRawToken);

      // Safe JSON response excluding raw refresh token
      const response: RefreshResponse = {
        accessToken: result.accessToken,
        tokenType: "Bearer",
        expiresIn: result.expiresIn,
        user: result.user,
      };

      res.status(HTTP_STATUS.OK).json(response);
    } catch (err: unknown) {
      next(err);
    }
  };
}

export const refreshController = new RefreshController();
