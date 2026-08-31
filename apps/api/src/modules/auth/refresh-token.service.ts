import crypto from "node:crypto";
import { getAuthConfig, type AuthConfig } from "../../infrastructure/config/auth.config.js";
import {
  type IRefreshSessionRepository,
  type RefreshSessionEntity,
} from "./refresh-session.repository.js";
import {
  type IUserRepository,
} from "../users/user.repository.js";
import {
  type IAccessTokenService,
  accessTokenService,
} from "./access-token.service.js";
import {
  type AuditService,
  auditService as defaultAuditService,
} from "./audit.service.js";
import {
  refreshSessionRepository as defaultSessionRepo,
  userRepository as defaultUserRepo,
} from "../../infrastructure/database/repository-factory.js";
import { AUDIT_REASON_CODES } from "./audit-event.constants.js";
import { AppError } from "../../shared/errors/error-envelope.js";
import { ERROR_CODES, HTTP_STATUS, type SafeUser } from "@aura/shared";

export type RefreshSession = RefreshSessionEntity;

export interface SessionMetadata {
  userAgent?: string | null;
  ipAddress?: string | null;
  requestId?: string | null;
}

export interface RefreshResult {
  accessToken: string;
  tokenType: "Bearer";
  expiresIn: number;
  newRawToken: string;
  user: SafeUser;
}

export interface IRefreshTokenService {
  generateRawRefreshToken(): string;
  computeTokenHash(rawToken: string): string;
  createLoginSession(
    userId: string,
    metadata?: SessionMetadata,
  ): Promise<{ rawToken: string; session: RefreshSession }>;
  refresh(rawToken: string, metadata?: SessionMetadata): Promise<RefreshResult>;
  revokeFamily(familyId: string, reason?: string): Promise<number>;
  revokeSession(sessionId: string, reason?: string): Promise<RefreshSession>;
}

export class RefreshTokenService implements IRefreshTokenService {
  private readonly sessionRepo: IRefreshSessionRepository;
  private readonly userRepo: IUserRepository;

  constructor(
    private readonly config: AuthConfig = getAuthConfig(),
    sessionRepo: IRefreshSessionRepository = defaultSessionRepo,
    userRepo: IUserRepository = defaultUserRepo,
    private readonly tokenService: IAccessTokenService = accessTokenService,
    private readonly auditService: AuditService = defaultAuditService,
  ) {
    this.sessionRepo = sessionRepo;
    this.userRepo = userRepo;
  }

  generateRawRefreshToken(): string {
    return crypto.randomBytes(32).toString("base64url");
  }

  computeTokenHash(rawToken: string): string {
    return crypto
      .createHmac("sha256", this.config.refreshTokenSecret)
      .update(rawToken)
      .digest("hex");
  }

  async createLoginSession(
    userId: string,
    metadata: SessionMetadata = {},
  ): Promise<{ rawToken: string; session: RefreshSession }> {
    const rawToken = this.generateRawRefreshToken();
    const tokenHash = this.computeTokenHash(rawToken);
    const familyId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + this.config.refreshTokenTtlDays * 24 * 60 * 60 * 1000);

    const session = await this.sessionRepo.create({
      userId,
      tokenHash,
      familyId,
      expiresAt,
      userAgent: metadata.userAgent ?? null,
      ipAddress: metadata.ipAddress ?? null,
    });

    return { rawToken, session };
  }

  async refresh(rawToken: string, metadata: SessionMetadata = {}): Promise<RefreshResult> {
    if (!rawToken || typeof rawToken !== "string" || rawToken.length < 20 || rawToken.length > 512) {
      await this.auditService.recordRefreshFailure({
        reasonCode: AUDIT_REASON_CODES.MISSING_REFRESH_COOKIE,
        userId: null,
        requestId: metadata.requestId,
        userAgent: metadata.userAgent,
      });
      throw new AppError(
        "Invalid or expired refresh session",
        ERROR_CODES.UNAUTHENTICATED,
        HTTP_STATUS.UNAUTHORIZED,
      );
    }

    const tokenHash = this.computeTokenHash(rawToken);
    const session = await this.sessionRepo.findByTokenHash(tokenHash);

    if (!session) {
      await this.auditService.recordRefreshFailure({
        reasonCode: AUDIT_REASON_CODES.UNKNOWN_REFRESH_SESSION,
        userId: null,
        requestId: metadata.requestId,
        userAgent: metadata.userAgent,
      });
      throw new AppError(
        "Invalid or expired refresh session",
        ERROR_CODES.UNAUTHENTICATED,
        HTTP_STATUS.UNAUTHORIZED,
      );
    }

    // 1. Confirmed Replay / Reuse detection on lookup:
    // If the session record was already rotated or revoked prior to this request,
    // this is a confirmed replay/compromise event. Invalidate the entire token family.
    if (session.rotatedAt !== null || session.isRevoked) {
      await this.sessionRepo.revokeFamily(session.familyId, "REPLAY_DETECTED");
      await this.auditService.recordRefreshReplayDetected({
        userId: session.userId,
        sessionId: session.id,
        familyId: session.familyId,
        requestId: metadata.requestId,
        userAgent: metadata.userAgent,
      });
      throw new AppError(
        "Invalid or expired refresh session",
        ERROR_CODES.UNAUTHENTICATED,
        HTTP_STATUS.UNAUTHORIZED,
      );
    }

    // 2. Expiration check
    if (session.expiresAt.getTime() <= Date.now()) {
      await this.auditService.recordRefreshFailure({
        reasonCode: AUDIT_REASON_CODES.EXPIRED_REFRESH_SESSION,
        userId: session.userId,
        sessionId: session.id,
        requestId: metadata.requestId,
        userAgent: metadata.userAgent,
      });
      throw new AppError(
        "Invalid or expired refresh session",
        ERROR_CODES.UNAUTHENTICATED,
        HTTP_STATUS.UNAUTHORIZED,
      );
    }

    // 3. User active check
    const user = await this.userRepo.findById(session.userId);
    if (!user || user.status !== "ACTIVE") {
      await this.auditService.recordRefreshFailure({
        reasonCode: AUDIT_REASON_CODES.INACTIVE_USER,
        userId: session.userId,
        sessionId: session.id,
        requestId: metadata.requestId,
        userAgent: metadata.userAgent,
      });
      throw new AppError(
        "Invalid or expired refresh session",
        ERROR_CODES.UNAUTHENTICATED,
        HTTP_STATUS.UNAUTHORIZED,
      );
    }

    // 4. Token rotation inside atomic transaction
    const newRawToken = this.generateRawRefreshToken();
    const newTokenHash = this.computeTokenHash(newRawToken);
    const newExpiresAt = new Date(Date.now() + this.config.refreshTokenTtlDays * 24 * 60 * 60 * 1000);

    try {
      await this.sessionRepo.rotateSession(session.id, {
        userId: user.id,
        tokenHash: newTokenHash,
        familyId: session.familyId,
        expiresAt: newExpiresAt,
        userAgent: metadata.userAgent ?? null,
        ipAddress: metadata.ipAddress ?? null,
      });
    } catch (err: unknown) {
      // Concurrency collision during simultaneous rotation:
      // Another concurrent request with the same token won the race and created a valid replacement.
      // Do NOT revoke the token family here (which would invalidate the winner's new token).
      // Simply reject this losing request safely with 401 UNAUTHENTICATED.
      if (err instanceof Error && err.message === "CONCURRENT_OR_INVALID_ROTATION") {
        await this.auditService.recordRefreshFailure({
          reasonCode: AUDIT_REASON_CODES.UNKNOWN_REFRESH_SESSION,
          userId: session.userId,
          sessionId: session.id,
          requestId: metadata.requestId,
          userAgent: metadata.userAgent,
        });
        throw new AppError(
          "Invalid or expired refresh session",
          ERROR_CODES.UNAUTHENTICATED,
          HTTP_STATUS.UNAUTHORIZED,
        );
      }
      throw err;
    }

    // 5. Mint new access token using FEAT-004 service
    const { accessToken, expiresIn } = this.tokenService.issueAccessToken(user.id);

    // 6. Record best-effort REFRESH_SUCCESS audit event
    await this.auditService.recordRefreshSuccess({
      userId: user.id,
      sessionId: session.id,
      familyId: session.familyId,
      requestId: metadata.requestId,
      userAgent: metadata.userAgent,
    });

    return {
      accessToken,
      tokenType: "Bearer",
      expiresIn,
      newRawToken,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        status: user.status,
        createdAt: user.createdAt.toISOString(),
      },
    };
  }

  async revokeFamily(familyId: string, reason = "MANUAL"): Promise<number> {
    return this.sessionRepo.revokeFamily(familyId, reason);
  }

  async revokeSession(sessionId: string, reason = "MANUAL"): Promise<RefreshSession> {
    return this.sessionRepo.revokeSession(sessionId, reason);
  }
}

export const refreshTokenService = new RefreshTokenService();

