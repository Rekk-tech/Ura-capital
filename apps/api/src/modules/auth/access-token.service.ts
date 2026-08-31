import jwt from "jsonwebtoken";
import { getAuthConfig, type AuthConfig } from "../../infrastructure/config/auth.config.js";
import {
  AccessTokenClaimsSchema,
  type AccessTokenClaims,
} from "./login.schema.js";
import { AppError } from "../../shared/errors/error-envelope.js";
import { ERROR_CODES, HTTP_STATUS } from "@aura/shared";

export interface IAccessTokenService {
  issueAccessToken(userId: string): { accessToken: string; expiresIn: number };
  verifyAccessToken(token: string): AccessTokenClaims;
}

export class AccessTokenService implements IAccessTokenService {
  constructor(private readonly config: AuthConfig = getAuthConfig()) {}

  /**
   * Issues a short-lived HS256 access token with approved claims and configured TTL.
   */
  issueAccessToken(userId: string): { accessToken: string; expiresIn: number } {
    const expiresInSeconds = this.config.accessTokenTtlMinutes * 60;
    const now = Math.floor(Date.now() / 1000);
    const exp = now + expiresInSeconds;

    const payload: AccessTokenClaims = {
      sub: userId,
      iat: now,
      exp,
      iss: this.config.accessTokenIssuer,
      aud: this.config.accessTokenAudience,
      typ: "access",
    };

    const token = jwt.sign(payload, this.config.accessTokenSecret, {
      algorithm: "HS256",
    });

    return {
      accessToken: token,
      expiresIn: expiresInSeconds,
    };
  }

  /**
   * Verifies an access token enforcing HS256-only allowlist, required issuer/audience,
   * expiration, and exact claim structure.
   */
  verifyAccessToken(token: string): AccessTokenClaims {
    try {
      const decoded = jwt.verify(token, this.config.accessTokenSecret, {
        algorithms: ["HS256"],
        issuer: this.config.accessTokenIssuer,
        audience: this.config.accessTokenAudience,
      });

      const parsed = AccessTokenClaimsSchema.safeParse(decoded);
      if (!parsed.success || parsed.data.typ !== "access") {
        throw new AppError(
          "Invalid or malformed access token",
          ERROR_CODES.UNAUTHENTICATED,
          HTTP_STATUS.UNAUTHORIZED,
        );
      }

      return parsed.data;
    } catch (err: unknown) {
      if (err instanceof AppError) {
        throw err;
      }

      if (err instanceof jwt.TokenExpiredError) {
        throw new AppError(
          "Access token has expired",
          ERROR_CODES.UNAUTHENTICATED,
          HTTP_STATUS.UNAUTHORIZED,
        );
      }

      throw new AppError(
        "Invalid or malformed access token",
        ERROR_CODES.UNAUTHENTICATED,
        HTTP_STATUS.UNAUTHORIZED,
      );
    }
  }
}

export const accessTokenService = new AccessTokenService();
