import {
  type IRefreshSessionRepository,
} from "./refresh-session.repository.js";
import {
  type IRefreshTokenService,
  refreshTokenService,
} from "./refresh-token.service.js";
import {
  type AuditService,
  auditService as defaultAuditService,
} from "./audit.service.js";
import {
  refreshSessionRepository as defaultSessionRepo,
} from "../../infrastructure/database/repository-factory.js";

export interface LogoutContext {
  requestId?: string | null;
  userAgent?: string | null;
}

export interface LogoutResult {
  revoked: boolean;
  sessionId?: string | null;
}

export interface ILogoutService {
  logout(rawToken?: string, context?: LogoutContext): Promise<LogoutResult>;
}

export class LogoutService implements ILogoutService {
  private readonly sessionRepo: IRefreshSessionRepository;

  constructor(
    sessionRepo: IRefreshSessionRepository = defaultSessionRepo,
    private readonly tokenService: IRefreshTokenService = refreshTokenService,
    private readonly auditService: AuditService = defaultAuditService,
  ) {
    this.sessionRepo = sessionRepo;
  }

  async logout(rawToken?: string, context?: LogoutContext): Promise<LogoutResult> {
    if (!rawToken || typeof rawToken !== "string" || rawToken.length < 20 || rawToken.length > 512) {
      return { revoked: false };
    }

    const tokenHash = this.tokenService.computeTokenHash(rawToken);
    const session = await this.sessionRepo.findByTokenHash(tokenHash);

    if (!session) {
      return { revoked: false };
    }

    // If session is already inactive (rotated, revoked, or expired), return safe idempotent result
    if (session.isRevoked || session.rotatedAt !== null || session.expiresAt.getTime() <= Date.now()) {
      return { revoked: false, sessionId: session.id };
    }

    // Durably revoke the current active session in PostgreSQL with reason USER_LOGOUT
    await this.sessionRepo.revokeSession(session.id, "USER_LOGOUT");

    // Emit security-state-first LOGOUT_SUCCESS audit event
    await this.auditService.recordLogoutSuccess({
      userId: session.userId,
      sessionId: session.id,
      requestId: context?.requestId,
      userAgent: context?.userAgent,
    });

    return { revoked: true, sessionId: session.id };
  }
}

export const logoutService = new LogoutService();
