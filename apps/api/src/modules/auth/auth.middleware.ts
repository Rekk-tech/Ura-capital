import type { Response, NextFunction } from "express";
import {
  type IAccessTokenService,
  accessTokenService,
} from "./access-token.service.js";
import {
  type IUserRepository,
  userRepository,
} from "../users/user.repository.js";
import { AppError } from "../../shared/errors/error-envelope.js";
import { ERROR_CODES, HTTP_STATUS } from "@aura/shared";
import type { AuthenticatedRequest } from "./auth.types.js";

export interface IAuthMiddlewareDependencies {
  tokenService?: IAccessTokenService;
  userRepo?: IUserRepository;
}

export function createAuthenticateMiddleware(deps: IAuthMiddlewareDependencies = {}) {
  const tokenService = deps.tokenService ?? accessTokenService;
  const userRepo = deps.userRepo ?? userRepository;

  return async (req: AuthenticatedRequest, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader) {
        throw new AppError(
          "Authorization header is required",
          ERROR_CODES.UNAUTHENTICATED,
          HTTP_STATUS.UNAUTHORIZED,
        );
      }

      const parts = authHeader.trim().split(/\s+/);
      if (parts.length !== 2 || parts[0] !== "Bearer") {
        throw new AppError(
          "Invalid authorization header format. Expected 'Bearer <token>'",
          ERROR_CODES.UNAUTHENTICATED,
          HTTP_STATUS.UNAUTHORIZED,
        );
      }

      const token = parts[1];
      if (!token) {
        throw new AppError(
          "Bearer token must not be empty",
          ERROR_CODES.UNAUTHENTICATED,
          HTTP_STATUS.UNAUTHORIZED,
        );
      }

      // 1. Verify token signature, algorithm (HS256), issuer, audience, and expiry
      const claims = tokenService.verifyAccessToken(token);

      // 2. Perform server-side user lookup to ensure subject exists and is active
      const user = await userRepo.findById(claims.sub);
      if (!user || user.status !== "ACTIVE") {
        throw new AppError(
          "User associated with this token is not active or no longer exists",
          ERROR_CODES.UNAUTHENTICATED,
          HTTP_STATUS.UNAUTHORIZED,
        );
      }

      // 3. Attach verified, server-derived user context (ignoring any client-supplied role/admin claims)
      req.user = {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        status: user.status,
        createdAt: user.createdAt.toISOString(),
      };

      next();
    } catch (err: unknown) {
      next(err);
    }
  };
}

export const authenticate = createAuthenticateMiddleware();
