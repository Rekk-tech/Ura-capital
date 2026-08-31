import type { Request, Response, NextFunction } from "express";
import {
  type ILoginService,
  loginService,
} from "./login.service.js";
import { LoginRequestSchema, type LoginResponse } from "./login.schema.js";
import { setRefreshCookie } from "./refresh-cookie.js";
import { AppError } from "../../shared/errors/error-envelope.js";
import { ERROR_CODES, HTTP_STATUS } from "@aura/shared";

export class LoginController {
  constructor(private readonly service: ILoginService = loginService) {}

  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parseResult = LoginRequestSchema.safeParse(req.body);

      if (!parseResult.success) {
        const firstError = parseResult.error.errors[0];
        const errorMessage = firstError
          ? `${firstError.path.join(".")}: ${firstError.message}`
          : "Invalid login payload";

        throw new AppError(
          errorMessage,
          ERROR_CODES.VALIDATION_ERROR,
          HTTP_STATUS.BAD_REQUEST,
        );
      }

      const result = await this.service.login(parseResult.data, {
        userAgent: req.headers["user-agent"] ?? null,
        ipAddress: req.ip ?? req.socket.remoteAddress ?? null,
        requestId: req.id,
      });

      // Deliver refresh token through HttpOnly cookie
      if (result.rawRefreshToken) {
        setRefreshCookie(res, result.rawRefreshToken);
      }

      // Safe JSON response excluding rawRefreshToken
      const response: LoginResponse = {
        accessToken: result.accessToken,
        tokenType: result.tokenType,
        expiresIn: result.expiresIn,
        user: result.user,
      };

      res.status(HTTP_STATUS.OK).json(response);
    } catch (err: unknown) {
      next(err);
    }
  };
}

export const loginController = new LoginController();
