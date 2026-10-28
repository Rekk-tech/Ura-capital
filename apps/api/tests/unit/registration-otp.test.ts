import { describe, it, expect, vi, beforeEach } from "vitest";
import { RegistrationService } from "../../src/modules/auth/registration.service.js";
import { AppError } from "../../src/shared/errors/error-envelope.js";
import { ERROR_CODES, HTTP_STATUS } from "@aura/shared";
import type { IUserRepository, UserEntity } from "../../src/modules/users/user.repository.js";
import type { IPasswordHashingService } from "../../src/modules/auth/password-hashing.service.js";
import type { IOtpService, PendingRegistrationPayload } from "../../src/modules/auth/otp.service.js";
import type { IEmailService } from "../../src/infrastructure/email/email.service.js";
import type { ITransactionRunner, TransactionContext } from "../../src/infrastructure/database/transaction-runner.js";

describe("FEAT-090: Registration 2-Step OTP Verification Unit Tests", () => {
  let mockUserRepo: IUserRepository;
  let mockHashingService: IPasswordHashingService;
  let mockOtpService: IOtpService;
  let mockEmailService: IEmailService;
  let mockTxRunner: ITransactionRunner;
  let service: RegistrationService;

  const validEmail = "real.investor@example.com";
  const validPassword = "SecurePassword123!";
  const validDisplayName = "Real Investor";
  const mockPasswordHash = "$argon2id$v=19$m=65536,t=3,p=4$fakeHash";
  const generatedOtp = "654321";

  beforeEach(() => {
    vi.clearAllMocks();

    mockUserRepo = {
      findByEmail: vi.fn().mockResolvedValue(null),
      findById: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    } as unknown as IUserRepository;

    mockHashingService = {
      hashPassword: vi.fn().mockResolvedValue(mockPasswordHash),
      verifyPassword: vi.fn().mockResolvedValue(true),
    };

    mockOtpService = {
      generateOtp: vi.fn().mockReturnValue(generatedOtp),
      storeRegistrationOtp: vi.fn().mockResolvedValue(generatedOtp),
      verifyAndConsumeRegistrationOtp: vi.fn(),
      clearRegistrationOtp: vi.fn(),
    };

    mockEmailService = {
      sendOtpEmail: vi.fn().mockResolvedValue(true),
    };

    const mockCreatedUser: UserEntity = {
      id: "usr-uuid-12345",
      email: validEmail,
      displayName: validDisplayName,
      status: "ACTIVE",
      createdAt: new Date("2026-10-28T12:00:00Z"),
      updatedAt: new Date("2026-10-28T12:00:00Z"),
    };

    mockTxRunner = {
      run: vi.fn().mockImplementation(async (callback: (ctx: TransactionContext) => Promise<unknown>) => {
        const fakeCtx: TransactionContext = {
          tx: {} as unknown as TransactionContext["tx"],
          repositories: {
            userRepo: {
              create: vi.fn().mockResolvedValue(mockCreatedUser),
            } as unknown as TransactionContext["repositories"]["userRepo"],
            credentialRepo: {
              create: vi.fn().mockResolvedValue({ id: "cred-1", userId: mockCreatedUser.id, type: "PASSWORD" }),
            } as unknown as TransactionContext["repositories"]["credentialRepo"],
            auditRepo: {
              create: vi.fn().mockResolvedValue({ id: "audit-1" }),
            } as unknown as TransactionContext["repositories"]["auditRepo"],
          } as unknown as TransactionContext["repositories"],
        };
        return callback(fakeCtx);
      }),
    };

    service = new RegistrationService(
      mockUserRepo,
      mockTxRunner,
      mockHashingService,
      mockOtpService,
      mockEmailService,
    );
  });

  describe("Step 1: requestOtp()", () => {
    it("successfully requests OTP and DOES NOT write to PostgreSQL database", async () => {
      const result = await service.requestOtp({
        email: validEmail,
        password: validPassword,
        displayName: validDisplayName,
      });

      expect(result.success).toBe(true);
      expect(result.email).toBe(validEmail);
      expect(result.message).toContain("OTP");

      // Verifies Argon2id password hashing occurred
      expect(mockHashingService.hashPassword).toHaveBeenCalledWith(validPassword);

      // Verifies OTP was saved in Redis with payload
      expect(mockOtpService.storeRegistrationOtp).toHaveBeenCalledWith(
        validEmail,
        mockPasswordHash,
        validDisplayName,
      );

      // Verifies email was dispatched
      expect(mockEmailService.sendOtpEmail).toHaveBeenCalledWith({
        to: validEmail,
        otp: generatedOtp,
        displayName: validDisplayName,
      });

      // CRITICAL INVARIANT: Zero DB writes!
      expect(mockTxRunner.run).not.toHaveBeenCalled();
      expect(mockUserRepo.create).not.toHaveBeenCalled();
    });

    it("rejects password shorter than 12 characters", async () => {
      await expect(
        service.requestOtp({
          email: validEmail,
          password: "short",
        }),
      ).rejects.toThrow(AppError);

      expect(mockOtpService.storeRegistrationOtp).not.toHaveBeenCalled();
      expect(mockEmailService.sendOtpEmail).not.toHaveBeenCalled();
    });

    it("rejects duplicate email with 409 Conflict", async () => {
      mockUserRepo.findByEmail = vi.fn().mockResolvedValue({ id: "existing-user", email: validEmail });

      await expect(
        service.requestOtp({
          email: validEmail,
          password: validPassword,
        }),
      ).rejects.toMatchObject({
        code: ERROR_CODES.AUTH_EMAIL_ALREADY_EXISTS,
        statusCode: HTTP_STATUS.CONFLICT,
      });

      expect(mockOtpService.storeRegistrationOtp).not.toHaveBeenCalled();
    });
  });

  describe("Step 2: verifyOtp()", () => {
    it("successfully verifies OTP and atomically persists user to PostgreSQL", async () => {
      const mockPendingPayload: PendingRegistrationPayload = {
        email: validEmail,
        passwordHash: mockPasswordHash,
        displayName: validDisplayName,
        otp: generatedOtp,
        createdAt: Date.now(),
      };

      mockOtpService.verifyAndConsumeRegistrationOtp = vi.fn().mockResolvedValue(mockPendingPayload);

      const response = await service.verifyOtp({
        email: validEmail,
        otp: generatedOtp,
      });

      expect(response.user.email).toBe(validEmail);
      expect(response.user.status).toBe("ACTIVE");

      // Verifies OTP was verified and consumed
      expect(mockOtpService.verifyAndConsumeRegistrationOtp).toHaveBeenCalledWith(validEmail, generatedOtp);

      // Verifies database transaction ran
      expect(mockTxRunner.run).toHaveBeenCalledTimes(1);
    });

    it("rejects invalid or expired OTP with 400 Bad Request", async () => {
      mockOtpService.verifyAndConsumeRegistrationOtp = vi.fn().mockResolvedValue(null);

      await expect(
        service.verifyOtp({
          email: validEmail,
          otp: "000000",
        }),
      ).rejects.toMatchObject({
        code: ERROR_CODES.VALIDATION_ERROR,
        statusCode: HTTP_STATUS.BAD_REQUEST,
      });

      expect(mockTxRunner.run).not.toHaveBeenCalled();
    });
  });
});

