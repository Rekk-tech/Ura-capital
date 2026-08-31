import {
  type IUserRepository,
} from "../users/user.repository.js";
import {
  type ICredentialRepository,
} from "./credential.repository.js";
import {
  type IPasswordHashingService,
  passwordHashingService,
} from "./password-hashing.service.js";
import {
  type IAccessTokenService,
  accessTokenService,
} from "./access-token.service.js";
import {
  type IRefreshTokenService,
  refreshTokenService,
  type SessionMetadata,
} from "./refresh-token.service.js";
import {
  type AuditService,
  auditService as defaultAuditService,
} from "./audit.service.js";
import {
  userRepository as defaultUserRepository,
  credentialRepository as defaultCredentialRepository,
} from "../../infrastructure/database/repository-factory.js";
import { AUDIT_REASON_CODES } from "./audit-event.constants.js";
import { AppError } from "../../shared/errors/error-envelope.js";
import { ERROR_CODES, HTTP_STATUS } from "@aura/shared";
import type { LoginRequest, LoginResponse } from "./login.schema.js";

// Fixed dummy Argon2id encoded hash with approved parameters (19 MiB, 2 iterations, 1 thread)
// Used to execute comparable compute cycles for unknown-user paths to prevent timing enumeration
export const DUMMY_ARGON2ID_HASH =
  "$argon2id$v=19$m=19456,t=2,p=1$c29tZXNhbHQxMjM0NTY3OA$9vX9rN7mH0vH3N/3h7+9b9g2Pz8q+1+2+3+4+5+6+78";

export interface LoginServiceResult extends LoginResponse {
  rawRefreshToken?: string;
}

export interface ILoginService {
  login(request: LoginRequest, metadata?: SessionMetadata): Promise<LoginServiceResult>;
}

export class LoginService implements ILoginService {
  private readonly userRepo: IUserRepository;
  private readonly credRepo: ICredentialRepository;
  private readonly hashingService: IPasswordHashingService;
  private readonly tokenService: IAccessTokenService;
  private readonly refreshService: IRefreshTokenService;
  private readonly auditService: AuditService;

  constructor(
    arg1?: IUserRepository | unknown,
    arg2?: ICredentialRepository | unknown,
    arg3?: IPasswordHashingService | unknown,
    arg4?: IAccessTokenService | unknown,
    arg5?: IRefreshTokenService | unknown,
    arg6?: AuditService | unknown,
    arg7?: AuditService,
  ) {
    if (arg1 && typeof arg1 === "object" && "findByEmail" in arg1) {
      // Direct repository injection: (userRepo, credRepo, hashingService, tokenService, refreshService, auditService)
      this.userRepo = arg1 as IUserRepository;
      this.credRepo = (arg2 as ICredentialRepository) ?? defaultCredentialRepository;
      this.hashingService = (arg3 as IPasswordHashingService) ?? passwordHashingService;
      this.tokenService = (arg4 as IAccessTokenService) ?? accessTokenService;
      this.refreshService = (arg5 as IRefreshTokenService) ?? refreshTokenService;
      this.auditService = (arg6 as AuditService) ?? defaultAuditService;
    } else if (arg2 && typeof arg2 === "object" && "findByEmail" in arg2) {
      // Legacy signature: (mockPrisma, userRepo, credRepo, hashingService, tokenService, refreshService, auditService)
      this.userRepo = arg2 as IUserRepository;
      this.credRepo = (arg3 as ICredentialRepository) ?? defaultCredentialRepository;
      this.hashingService = (arg4 as IPasswordHashingService) ?? passwordHashingService;
      this.tokenService = (arg5 as IAccessTokenService) ?? accessTokenService;
      this.refreshService = (arg6 as IRefreshTokenService) ?? refreshTokenService;
      this.auditService = arg7 ?? defaultAuditService;
    } else {
      this.userRepo = defaultUserRepository;
      this.credRepo = (arg2 as ICredentialRepository) ?? defaultCredentialRepository;
      this.hashingService = (arg3 as IPasswordHashingService) ?? passwordHashingService;
      this.tokenService = (arg4 as IAccessTokenService) ?? accessTokenService;
      this.refreshService = (arg5 as IRefreshTokenService) ?? refreshTokenService;
      this.auditService = (arg6 as AuditService) ?? defaultAuditService;
    }
  }

  async login(request: LoginRequest, metadata: SessionMetadata = {}): Promise<LoginServiceResult> {
    // 1. Identity normalization (trim and lowercase)
    const normalizedEmail = request.email.trim().toLowerCase();

    // 2. Look up user by normalized email
    const user = await this.userRepo.findByEmail(normalizedEmail);

    // If user does not exist or is inactive, perform dummy password verification
    // to consume comparable CPU time and prevent timing-based user enumeration
    if (!user) {
      await this.hashingService.verifyPassword(DUMMY_ARGON2ID_HASH, request.password);
      await this.auditService.recordLoginFailure({
        reasonCode: AUDIT_REASON_CODES.UNKNOWN_USER,
        userId: null,
        requestId: metadata.requestId,
        userAgent: metadata.userAgent,
      });
      throw new AppError(
        "Invalid email or password",
        ERROR_CODES.UNAUTHENTICATED,
        HTTP_STATUS.UNAUTHORIZED,
      );
    }

    if (user.status !== "ACTIVE") {
      await this.hashingService.verifyPassword(DUMMY_ARGON2ID_HASH, request.password);
      await this.auditService.recordLoginFailure({
        reasonCode: AUDIT_REASON_CODES.INACTIVE_USER,
        userId: user.id,
        requestId: metadata.requestId,
        userAgent: metadata.userAgent,
      });
      throw new AppError(
        "Invalid email or password",
        ERROR_CODES.UNAUTHENTICATED,
        HTTP_STATUS.UNAUTHORIZED,
      );
    }

    // 3. Look up user credential
    const credential = await this.credRepo.findByUserId(user.id);
    if (!credential || credential.type !== "PASSWORD") {
      await this.hashingService.verifyPassword(DUMMY_ARGON2ID_HASH, request.password);
      await this.auditService.recordLoginFailure({
        reasonCode: AUDIT_REASON_CODES.BAD_PASSWORD,
        userId: user.id,
        requestId: metadata.requestId,
        userAgent: metadata.userAgent,
      });
      throw new AppError(
        "Invalid email or password",
        ERROR_CODES.UNAUTHENTICATED,
        HTTP_STATUS.UNAUTHORIZED,
      );
    }

    // 4. Verify supplied password against stored Argon2id hash using FEAT-003 primitive
    const isPasswordValid = await this.hashingService.verifyPassword(
      credential.passwordHash,
      request.password,
    );

    if (!isPasswordValid) {
      await this.auditService.recordLoginFailure({
        reasonCode: AUDIT_REASON_CODES.BAD_PASSWORD,
        userId: user.id,
        requestId: metadata.requestId,
        userAgent: metadata.userAgent,
      });
      throw new AppError(
        "Invalid email or password",
        ERROR_CODES.UNAUTHENTICATED,
        HTTP_STATUS.UNAUTHORIZED,
      );
    }

    // 5. Issue short-lived access token using FEAT-004 primitive
    const { accessToken, expiresIn } = this.tokenService.issueAccessToken(user.id);

    // 6. Establish PostgreSQL-backed refresh session (FEAT-005)
    const { rawToken, session } = await this.refreshService.createLoginSession(user.id, metadata);

    // 7. Emit best-effort LOGIN_SUCCESS audit event
    await this.auditService.recordLoginSuccess({
      userId: user.id,
      sessionId: session.id,
      requestId: metadata.requestId,
      userAgent: metadata.userAgent,
    });

    // 8. Return login result with rawRefreshToken for controller cookie attachment
    return {
      accessToken,
      tokenType: "Bearer",
      expiresIn,
      rawRefreshToken: rawToken,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        status: user.status,
        createdAt: user.createdAt.toISOString(),
      },
    };
  }
}

export const loginService = new LoginService();
