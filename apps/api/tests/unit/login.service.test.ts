import { describe, it, expect, vi } from "vitest";
import { PrismaClient } from "@prisma/client";
import {
  LoginService,
  DUMMY_ARGON2ID_HASH,
} from "../../src/modules/auth/login.service.js";
import { AppError } from "../../src/shared/errors/error-envelope.js";
import { ERROR_CODES, HTTP_STATUS } from "@aura/shared";
import type { IUserRepository } from "../../src/modules/users/user.repository.js";
import type { ICredentialRepository } from "../../src/modules/auth/credential.repository.js";
import type { IPasswordHashingService } from "../../src/modules/auth/password-hashing.service.js";
import type { IAccessTokenService } from "../../src/modules/auth/access-token.service.js";
import type { IRefreshTokenService } from "../../src/modules/auth/refresh-token.service.js";

describe("LoginService (Unit)", () => {
  const sampleUser = {
    id: "user-123",
    email: "user@example.com",
    displayName: "Sample User",
    status: "ACTIVE",
    createdAt: new Date("2026-08-25T12:00:00.000Z"),
    updatedAt: new Date("2026-08-25T12:00:00.000Z"),
  };

  const sampleCredential = {
    id: "cred-123",
    userId: "user-123",
    type: "PASSWORD",
    passwordHash: "$argon2id$v=19$m=19456,t=2,p=1$storedhashvalue",
    version: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPrisma = {} as unknown as PrismaClient;

  it("successfully authenticates active user with matching password, creates refresh session, and issues access token", async () => {
    const userRepo: IUserRepository = {
      findById: vi.fn().mockResolvedValue(sampleUser),
      findByEmail: vi.fn().mockResolvedValue(sampleUser),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };

    const credRepo: ICredentialRepository = {
      findByUserId: vi.fn().mockResolvedValue(sampleCredential),
      create: vi.fn(),
      updatePasswordHash: vi.fn(),
      deleteByUserId: vi.fn(),
    };

    const hashingService: IPasswordHashingService = {
      hashPassword: vi.fn(),
      verifyPassword: vi.fn().mockResolvedValue(true),
    };

    const tokenService: IAccessTokenService = {
      issueAccessToken: vi.fn().mockReturnValue({
        accessToken: "signed-jwt-token-123",
        expiresIn: 900,
      }),
      verifyAccessToken: vi.fn(),
    };

    const refreshService: IRefreshTokenService = {
      generateRawRefreshToken: vi.fn(),
      computeTokenHash: vi.fn(),
      createLoginSession: vi.fn().mockResolvedValue({
        rawToken: "raw-refresh-token-login-123",
        session: {} as unknown as import("@prisma/client").RefreshSession,
      }),
      refresh: vi.fn(),
      revokeFamily: vi.fn(),
      revokeSession: vi.fn(),
    };

    const service = new LoginService(
      mockPrisma,
      userRepo,
      credRepo,
      hashingService,
      tokenService,
      refreshService,
    );

    const result = await service.login({
      email: "  User@Example.Com  ", // Tests normalization
      password: "valid-password-12345",
    });

    expect(userRepo.findByEmail).toHaveBeenCalledWith("user@example.com");
    expect(credRepo.findByUserId).toHaveBeenCalledWith("user-123");
    expect(hashingService.verifyPassword).toHaveBeenCalledWith(
      sampleCredential.passwordHash,
      "valid-password-12345",
    );
    expect(tokenService.issueAccessToken).toHaveBeenCalledWith("user-123");
    expect(refreshService.createLoginSession).toHaveBeenCalledWith("user-123", {});

    expect(result).toEqual({
      accessToken: "signed-jwt-token-123",
      tokenType: "Bearer",
      expiresIn: 900,
      rawRefreshToken: "raw-refresh-token-login-123",
      user: {
        id: "user-123",
        email: "user@example.com",
        displayName: "Sample User",
        status: "ACTIVE",
        createdAt: "2026-08-25T12:00:00.000Z",
      },
    });
  });

  it("rejects unknown user safely, executing dummy Argon2id verification to avoid timing enumeration", async () => {
    const userRepo: IUserRepository = {
      findById: vi.fn(),
      findByEmail: vi.fn().mockResolvedValue(null), // Unknown user
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };

    const credRepo: ICredentialRepository = {
      findByUserId: vi.fn(),
      create: vi.fn(),
      updatePasswordHash: vi.fn(),
      deleteByUserId: vi.fn(),
    };

    const hashingService: IPasswordHashingService = {
      hashPassword: vi.fn(),
      verifyPassword: vi.fn().mockResolvedValue(false),
    };

    const tokenService: IAccessTokenService = {
      issueAccessToken: vi.fn(),
      verifyAccessToken: vi.fn(),
    };

    const refreshService: IRefreshTokenService = {
      generateRawRefreshToken: vi.fn(),
      computeTokenHash: vi.fn(),
      createLoginSession: vi.fn(),
      refresh: vi.fn(),
      revokeFamily: vi.fn(),
      revokeSession: vi.fn(),
    };

    const service = new LoginService(
      mockPrisma,
      userRepo,
      credRepo,
      hashingService,
      tokenService,
      refreshService,
    );

    try {
      await service.login({
        email: "unknown@example.com",
        password: "attempted-password",
      });
      expect.unreachable("Should have rejected unknown user");
    } catch (err) {
      expect(err).toBeInstanceOf(AppError);
      const appErr = err as AppError;
      expect(appErr.statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(appErr.code).toBe(ERROR_CODES.UNAUTHENTICATED);
      expect(appErr.message).toBe("Invalid email or password");

      // Verify dummy hash verification was executed with the dummy hash constant
      expect(hashingService.verifyPassword).toHaveBeenCalledWith(
        DUMMY_ARGON2ID_HASH,
        "attempted-password",
      );
    }
  });

  it("rejects wrong password with identical external error as unknown user", async () => {
    const userRepo: IUserRepository = {
      findById: vi.fn(),
      findByEmail: vi.fn().mockResolvedValue(sampleUser),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };

    const credRepo: ICredentialRepository = {
      findByUserId: vi.fn().mockResolvedValue(sampleCredential),
      create: vi.fn(),
      updatePasswordHash: vi.fn(),
      deleteByUserId: vi.fn(),
    };

    const hashingService: IPasswordHashingService = {
      hashPassword: vi.fn(),
      verifyPassword: vi.fn().mockResolvedValue(false), // Password mismatch
    };

    const tokenService: IAccessTokenService = {
      issueAccessToken: vi.fn(),
      verifyAccessToken: vi.fn(),
    };

    const refreshService: IRefreshTokenService = {
      generateRawRefreshToken: vi.fn(),
      computeTokenHash: vi.fn(),
      createLoginSession: vi.fn(),
      refresh: vi.fn(),
      revokeFamily: vi.fn(),
      revokeSession: vi.fn(),
    };

    const service = new LoginService(
      mockPrisma,
      userRepo,
      credRepo,
      hashingService,
      tokenService,
      refreshService,
    );

    try {
      await service.login({
        email: "user@example.com",
        password: "wrong-password",
      });
      expect.unreachable("Should have rejected wrong password");
    } catch (err) {
      expect(err).toBeInstanceOf(AppError);
      const appErr = err as AppError;
      expect(appErr.statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(appErr.code).toBe(ERROR_CODES.UNAUTHENTICATED);
      expect(appErr.message).toBe("Invalid email or password");
    }
  });
});
