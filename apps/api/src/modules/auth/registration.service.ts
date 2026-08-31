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
import type { RegisterRequest, RegisterResponse } from "./registration.schema.js";
import {
  type ITransactionRunner,
  transactionRunner as defaultTransactionRunner,
} from "../../infrastructure/database/transaction-runner.js";
import {
  userRepository as defaultUserRepo,
  type IRepositoryContainer,
} from "../../infrastructure/database/repository-factory.js";

export interface RegistrationContext {
  requestId?: string | null;
  userAgent?: string | null;
}

export interface IRegistrationService {
  register(request: RegisterRequest, context?: RegistrationContext): Promise<RegisterResponse>;
}

export class RegistrationService implements IRegistrationService {
  private readonly userRepo: IUserRepository;
  private readonly txRunner: ITransactionRunner;
  private readonly hashingService: IPasswordHashingService;

  constructor(
    userRepoOrContainer?: IUserRepository | IRepositoryContainer | unknown,
    txRunner?: ITransactionRunner,
    hashingService: IPasswordHashingService = defaultHashingService,
  ) {
    this.hashingService = hashingService;

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
