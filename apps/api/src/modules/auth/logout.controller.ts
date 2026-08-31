import type { Request, Response, NextFunction } from "express";
import { type ILogoutService, logoutService } from "./logout.service.js";
import { extractRefreshToken, clearRefreshCookie } from "./refresh-cookie.js";
import { HTTP_STATUS } from "@aura/shared";

export class LogoutController {
  constructor(private readonly service: ILogoutService = logoutService) {}

  logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // 1. Extract raw token strictly from cookie authority (client body identity is ignored)
      const rawToken = extractRefreshToken(req);

      // 2. Perform durable revocation / safe evaluation with server-derived request context
      await this.service.logout(rawToken, {
        requestId: req.id,
        userAgent: (req.headers["user-agent"] as string) || null,
      });

      // 3. Clear refresh cookie on client
      clearRefreshCookie(res);

      // 4. Return 204 No Content with no JSON body
      res.status(HTTP_STATUS.NO_CONTENT).send();
    } catch (err: unknown) {
      next(err);
    }
  };
}

export const logoutController = new LogoutController();
