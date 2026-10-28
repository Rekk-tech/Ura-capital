import {
  type IUserRepository,
} from "../users/user.repository.js";
import {
  AUDIT_EVENT_TYPES,
  AUDIT_OUTCOMES,
} from "./audit-event.constants.js";
import {
  type IPasswordHashingService,
  passwordHashingService as defaultHashingService,
} from "./password-hashing.service.js";
import { validatePasswordPolicy } from "./password-policy.js";
import { AppError } from "../../shared/errors/error-envelope.js";
import { ERROR_CODES, HTTP_STATUS } from "@aura/shared";
import type { RegisterRequest, RegisterResponse, VerifyOtpRequest } from "./registration.schema.js";
import {
  type ITransactionRunner,
  transactionRunner as defaultTransactionRunner,
} from "../../infrastructure/database/transaction-runner.js";
import {
  userRepository as defaultUserRepo,
  type IRepositoryContainer,
} from "../../infrastructure/database/repository-factory.js";
import { otpService as defaultOtpService, type IOtpService } from "./otp.service.js";
import { emailService as defaultEmailService, type IEmailService } from "../../infrastructure/email/email.service.js";

export interface RegistrationContext {
  requestId?: string | null;
  userAgent?: string | null;
}

export interface RequestOtpResponse {
  success: boolean;
  message: string;
  email: string;
}

export interface IRegistrationService {
  register(request: RegisterRequest, context?: RegistrationContext): Promise<RegisterResponse>;
  requestOtp(request: RegisterRequest, context?: RegistrationContext): Promise<RequestOtpResponse>;
  verifyOtp(request: VerifyOtpRequest, context?: RegistrationContext): Promise<RegisterResponse>;
}

export class RegistrationService implements IRegistrationService {
  private readonly userRepo: IUserRepository;
  private readonly txRunner: ITransactionRunner;
  private readonly hashingService: IPasswordHashingService;
  private readonly otpService: IOtpService;
  private readonly emailService: IEmailService;

  constructor(
    userRepoOrContainer?: IUserRepository | IRepositoryContainer | unknown,
    txRunner?: ITransactionRunner,
    hashingService: IPasswordHashingService = defaultHashingService,
    otpService: IOtpService = defaultOtpService,
    emailService: IEmailService = defaultEmailService,
  ) {
    this.hashingService = hashingService;
    this.otpService = otpService;
    this.emailService = emailService;

    if (userRepoOrContainer && typeof userRepoOrContainer === "object" && "findByEmail" in userRepoOrContainer) {
      this.userRepo = userRepoOrContainer as IUserRepository;
      this.txRunner = txRunner ?? defaultTransactionRunner;
    } else if (userRepoOrContainer && typeof userRepoOrContainer === "object" && "userRepo" in userRepoOrContainer) {
      this.userRepo = (userRepoOrContainer as IRepositoryContainer).userRepo;
      this.txRunner = txRunner ?? defaultTransactionRunner;
    } else if (txRunner) {
      this.userRepo = defaultUserRepo;
      this.txRunner = txRunner;
    } else {
      this.userRepo = defaultUserRepo;
      this.txRunner = defaultTransactionRunner;
    }
  }

  /**
   * FEAT-090 Step 1: Request Registration OTP
   * Validates policy, checks uniqueness, stores pending registration in Redis (300s TTL),
   * and dispatches email (dual-mode). ZERO writes to PostgreSQL database!
   */
  async requestOtp(request: RegisterRequest, _context?: RegistrationContext): Promise<RequestOtpResponse> {
    const normalizedEmail = request.email.trim().toLowerCase();

    // 1. Enforce password policy before hashing
    const policyResult = validatePasswordPolicy(request.password);
    if (!policyResult.isValid) {
      throw new AppError(
        policyResult.reason ?? "Password does not meet security requirements",
        ERROR_CODES.VALIDATION_ERROR,
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    // 2. Pre-check for duplicate identity
    const existingUser = await this.userRepo.findByEmail(normalizedEmail);
    if (existingUser) {
      throw new AppError(
        "An account with this email address already exists.",
        ERROR_CODES.AUTH_EMAIL_ALREADY_EXISTS,
        HTTP_STATUS.CONFLICT,
      );
    }

    // 3. Hash password with Argon2id
    const passwordHash = await this.hashingService.hashPassword(request.password);

    // 4. Store in Redis with 5-minute TTL (Zero DB writes!)
    const otp = await this.otpService.storeRegistrationOtp(
      normalizedEmail,
      passwordHash,
      request.displayName,
    );

    // 5. Send OTP email (SMTP if configured, Console log fallback in Dev)
    await this.emailService.sendOtpEmail({
      to: normalizedEmail,
      otp,
      displayName: request.displayName,
    });

    return {
      success: true,
      message: "Mã OTP 6 chữ số đã được gửi đến email của bạn. Vui lòng kiểm tra hộp thư (hoặc thư rác).",
      email: normalizedEmail,
    };
  }

  /**
   * FEAT-090 Step 2: Verify Registration OTP & Commit Account to Database
   * Verifies OTP in Redis. Only if valid, commits User + Credential + AuditRecord inside DB transaction runner.
   */
  async verifyOtp(request: VerifyOtpRequest, context?: RegistrationContext): Promise<RegisterResponse> {
    const normalizedEmail = request.email.trim().toLowerCase();

    // 1. Verify and consume OTP from Redis
    const pendingData = await this.otpService.verifyAndConsumeRegistrationOtp(
      normalizedEmail,
      request.otp,
    );

    if (!pendingData) {
      throw new AppError(
        "Mã xác thực OTP không chính xác hoặc đã hết hiệu lực (quá 5 phút). Vui lòng yêu cầu mã mới.",
        ERROR_CODES.VALIDATION_ERROR,
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    // 2. Final safety check against race conditions
    const existingUser = await this.userRepo.findByEmail(normalizedEmail);
    if (existingUser) {
      throw new AppError(
        "An account with this email address already exists.",
        ERROR_CODES.AUTH_EMAIL_ALREADY_EXISTS,
        HTTP_STATUS.CONFLICT,
      );
    }

    // 3. Atomic persistence of User + Credential + Audit records
    try {
      const createdUser = await this.txRunner.run(async (ctx) => {
        const user = await ctx.repositories.userRepo.create({
          email: normalizedEmail,
          displayName: pendingData.displayName ?? null,
        });

        await ctx.repositories.credentialRepo.create({
          userId: user.id,
          passwordHash: pendingData.passwordHash,
          type: "PASSWORD",
        });

        await ctx.repositories.auditRepo.create(
          {
            eventType: AUDIT_EVENT_TYPES.REGISTRATION_SUCCESS,
            outcome: AUDIT_OUTCOMES.SUCCESS,
            actorUserId: user.id,
            subjectUserId: user.id,
            requestId: context?.requestId ?? null,
            userAgent: context?.userAgent ?? null,
          },
          ctx.tx,
        );

        return user;
      });

      return {
        user: {
          id: createdUser.id,
          email: createdUser.email,
          displayName: createdUser.displayName,
          status: createdUser.status,
          createdAt: createdUser.createdAt.toISOString(),
        },
      };
    } catch (err: unknown) {
      if (err instanceof AppError) {
        throw err;
      }

      throw new AppError(
        "Failed to register account due to an unexpected error",
        ERROR_CODES.INTERNAL_ERROR,
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async register(request: RegisterRequest, context?: RegistrationContext): Promise<RegisterResponse> {
    // 1. Identity normalization (trim and lowercase)
    const normalizedEmail = request.email.trim().toLowerCase();

    // 2. Enforce password policy before hashing
    const policyResult = validatePasswordPolicy(request.password);
    if (!policyResult.isValid) {
      throw new AppError(
        policyResult.reason ?? "Password does not meet security requirements",
        ERROR_CODES.VALIDATION_ERROR,
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    // 3. Pre-check for duplicate identity
    const existingUser = await this.userRepo.findByEmail(normalizedEmail);
    if (existingUser) {
      throw new AppError(
        "An account with this email address already exists.",
        ERROR_CODES.AUTH_EMAIL_ALREADY_EXISTS,
        HTTP_STATUS.CONFLICT,
      );
    }

    // 4. Hash password with Argon2id using approved parameters
    const passwordHash = await this.hashingService.hashPassword(request.password);

    // 5. Atomic persistence of User + Credential + Audit records inside database transaction runner
    try {
      const createdUser = await this.txRunner.run(async (ctx) => {
        const user = await ctx.repositories.userRepo.create({
          email: normalizedEmail,
          displayName: request.displayName ?? null,
        });

        await ctx.repositories.credentialRepo.create({
          userId: user.id,
          passwordHash,
          type: "PASSWORD",
        });

        await ctx.repositories.auditRepo.create(
          {
            eventType: AUDIT_EVENT_TYPES.REGISTRATION_SUCCESS,
            outcome: AUDIT_OUTCOMES.SUCCESS,
            actorUserId: user.id,
            subjectUserId: user.id,
            requestId: context?.requestId ?? null,
            userAgent: context?.userAgent ?? null,
          },
          ctx.tx,
        );

        return user;
      });

      // 6. Return safe response shape without sensitive internals
      return {
        user: {
          id: createdUser.id,
          email: createdUser.email,
          displayName: createdUser.displayName,
          status: createdUser.status,
          createdAt: createdUser.createdAt.toISOString(),
        },
      };
    } catch (err: unknown) {
      if (err instanceof AppError) {
        if (
          err.code === ERROR_CODES.AUTH_EMAIL_ALREADY_EXISTS ||
          err.code === ERROR_CODES.VALIDATION_ERROR ||
          err.code === ERROR_CODES.UNAUTHENTICATED ||
          err.code === ERROR_CODES.FORBIDDEN
        ) {
          throw err;
        }
      }

      throw new AppError(
        "Failed to register account due to an unexpected error",
        ERROR_CODES.INTERNAL_ERROR,
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
      );
    }
  }
}

export const registrationService = new RegistrationService();
