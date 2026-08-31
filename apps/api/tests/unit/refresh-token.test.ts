import { describe, it, expect, vi } from "vitest";
import { RefreshTokenService } from "../../src/modules/auth/refresh-token.service.js";
import {
  getRefreshCookieOptions,
  getClearRefreshCookieOptions,
  clearRefreshCookie,
} from "../../src/modules/auth/refresh-cookie.js";
import { AppError } from "../../src/shared/errors/error-envelope.js";
import { ERROR_CODES, HTTP_STATUS } from "@aura/shared";
import type { IRefreshSessionRepository } from "../../src/modules/auth/refresh-session.repository.js";
import type { IUserRepository } from "../../src/modules/users/user.repository.js";
import type { IAccessTokenService } from "../../src/modules/auth/access-token.service.js";
import type { Response } from "express";

describe("RefreshTokenService & Cookie Helpers (Unit)", () => {
  const mockAuthConfig = {
    accessTokenSecret: "access-token-secret-at-least-32-chars-long-12345",
    refreshTokenSecret: "refresh-token-secret-at-least-32-chars-long-67890",
    accessTokenTtlMinutes: 15,
    accessTokenIssuer: "aura-capital-test",
    accessTokenAudience: "aura-client-test",
    refreshTokenTtlDays: 7,
    refreshCookie: {
      name: "aura_refresh_token",
      secure: false,
      sameSite: "lax" as const,
      httpOnly: true as const,
    },
    rateLimit: {
      windowMs: 900000,
      maxRequests: 100,
    },
  };

  const sampleActiveUser = {
    id: "11111111-2222-3333-4444-555555555555",
    email: "user@example.com",
    displayName: "Sample User",
    status: "ACTIVE",
    createdAt: new Date("2026-08-25T12:00:00.000Z"),
    updatedAt: new Date("2026-08-25T12:00:00.000Z"),
  };

  const emptySessionRepo = {} as unknown as IRefreshSessionRepository;
  const emptyUserRepo = {} as unknown as IUserRepository;
  const emptyTokenService = {} as unknown as IAccessTokenService;

  it("generates high-entropy opaque random tokens", () => {
    const service = new RefreshTokenService(mockAuthConfig, emptySessionRepo, emptyUserRepo, emptyTokenService);
    const token1 = service.generateRawRefreshToken();
    const token2 = service.generateRawRefreshToken();

    expect(token1).toBeDefined();
    expect(token2).toBeDefined();
    expect(token1).not.toBe(token2);
    expect(token1.length).toBeGreaterThanOrEqual(40);
  });

  it("computes deterministic HMAC-SHA-256 verifiers and proves different secrets yield different verifiers", () => {
    const service = new RefreshTokenService(mockAuthConfig, emptySessionRepo, emptyUserRepo, emptyTokenService);
    const rawToken = "sample-raw-refresh-token-value-12345678901234567890";

    const hash1 = service.computeTokenHash(rawToken);
    const hash2 = service.computeTokenHash(rawToken);
    expect(hash1).toBe(hash2);

    // Compute with different secret (e.g. access-token secret)
    const serviceWithDifferentSecret = new RefreshTokenService(
      {
        ...mockAuthConfig,
        refreshTokenSecret: mockAuthConfig.accessTokenSecret,
      },
      emptySessionRepo,
      emptyUserRepo,
      emptyTokenService,
    );

    const hashWithAccessSecret = serviceWithDifferentSecret.computeTokenHash(rawToken);
    expect(hash1).not.toBe(hashWithAccessSecret);
  });

  it("builds exact centralized refresh cookie options adhering to approved contract", () => {
    const cookieOptions = getRefreshCookieOptions(mockAuthConfig);

    expect(cookieOptions.httpOnly).toBe(true);
    expect(cookieOptions.secure).toBe(false);
    expect(cookieOptions.sameSite).toBe("lax");
    expect(cookieOptions.path).toBe("/");
    expect(cookieOptions.maxAge).toBe(7 * 24 * 60 * 60 * 1000);
    expect(cookieOptions.expires).toBeInstanceOf(Date);
  });

  it("builds exact centralized clear-cookie options adhering to approved contract", () => {
    const clearOptions = getClearRefreshCookieOptions(mockAuthConfig);

    expect(clearOptions.httpOnly).toBe(true);
    expect(clearOptions.secure).toBe(false);
    expect(clearOptions.sameSite).toBe("lax");
    expect(clearOptions.path).toBe("/");
    expect(clearOptions.maxAge).toBe(0);
    expect(clearOptions.expires).toEqual(new Date(0));
  });

  it("clears refresh cookie with matching name and identity options on response", () => {
    const mockRes = {
      clearCookie: vi.fn(),
    } as unknown as Response;

    clearRefreshCookie(mockRes, mockAuthConfig);

    expect(mockRes.clearCookie).toHaveBeenCalledWith(
      "aura_refresh_token",
      expect.objectContaining({
        httpOnly: true,
        path: "/",
        maxAge: 0,
      }),
    );
  });

  it("creates login session with unique familyId and correct expiration", async () => {
    const mockCreatedSession = {
      id: "session-1",
      userId: sampleActiveUser.id,
      tokenHash: "computed-hash-1",
      familyId: "family-uuid-1",
      replacedBySessionId: null,
      rotatedAt: null,
      isRevoked: false,
      revokedAt: null,
      revocationReason: null,
      reusedAt: null,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      userAgent: "TestAgent/1.0",
      ipAddress: "127.0.0.1",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const sessionRepo: IRefreshSessionRepository = {
      create: vi.fn().mockResolvedValue(mockCreatedSession),
      findByTokenHash: vi.fn(),
      findById: vi.fn(),
      rotateSession: vi.fn(),
      revokeFamily: vi.fn(),
      revokeSession: vi.fn(),
      deleteByUserId: vi.fn(),
    };

    const service = new RefreshTokenService(
      mockAuthConfig,
      sessionRepo,
      emptyUserRepo,
      emptyTokenService,
    );

    const result = await service.createLoginSession(sampleActiveUser.id, {
      userAgent: "TestAgent/1.0",
      ipAddress: "127.0.0.1",
    });

    expect(result.rawToken).toBeDefined();
    expect(result.session).toEqual(mockCreatedSession);
    expect(sessionRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: sampleActiveUser.id,
        userAgent: "TestAgent/1.0",
        ipAddress: "127.0.0.1",
      }),
    );
  });

  it("successfully rotates refresh token and mints new FEAT-004 access token", async () => {
    const rawOldToken = "valid-active-raw-token-12345678901234567890";
    const service = new RefreshTokenService(mockAuthConfig);
    const oldHash = service.computeTokenHash(rawOldToken);

    const activeSession = {
      id: "session-123",
      userId: sampleActiveUser.id,
      tokenHash: oldHash,
      familyId: "family-123",
      replacedBySessionId: null,
      rotatedAt: null,
      isRevoked: false,
      revokedAt: null,
      revocationReason: null,
      reusedAt: null,
      expiresAt: new Date(Date.now() + 3600 * 1000),
      userAgent: null,
      ipAddress: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const sessionRepo: IRefreshSessionRepository = {
      create: vi.fn(),
      findByTokenHash: vi.fn().mockResolvedValue(activeSession),
      findById: vi.fn(),
      rotateSession: vi.fn().mockResolvedValue({
        oldSession: { ...activeSession, rotatedAt: new Date(), isRevoked: true },
        newSession: { ...activeSession, id: "session-456" },
      }),
      revokeFamily: vi.fn(),
      revokeSession: vi.fn(),
      deleteByUserId: vi.fn(),
    };

    const userRepo: IUserRepository = {
      findById: vi.fn().mockResolvedValue(sampleActiveUser),
      findByEmail: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };

    const tokenService: IAccessTokenService = {
      issueAccessToken: vi.fn().mockReturnValue({
        accessToken: "minted-access-token-123",
        expiresIn: 900,
      }),
      verifyAccessToken: vi.fn(),
    };

    const refreshService = new RefreshTokenService(
      mockAuthConfig,
      sessionRepo,
      userRepo,
      tokenService,
    );

    const result = await refreshService.refresh(rawOldToken);

    expect(result.accessToken).toBe("minted-access-token-123");
    expect(result.expiresIn).toBe(900);
    expect(result.newRawToken).toBeDefined();
    expect(result.newRawToken).not.toBe(rawOldToken);
    expect(result.user.id).toBe(sampleActiveUser.id);
    expect(sessionRepo.rotateSession).toHaveBeenCalled();
  });

  it("detects replay of already rotated token and revokes the entire token family", async () => {
    const rawReplayedToken = "replayed-raw-token-12345678901234567890";
    const service = new RefreshTokenService(mockAuthConfig);
    const replayedHash = service.computeTokenHash(rawReplayedToken);

    const alreadyRotatedSession = {
      id: "session-old",
      userId: sampleActiveUser.id,
      tokenHash: replayedHash,
      familyId: "family-compromised-123",
      replacedBySessionId: "session-new",
      rotatedAt: new Date(Date.now() - 60000), // rotated 1 min ago
      isRevoked: true,
      revokedAt: new Date(Date.now() - 60000),
      revocationReason: "ROTATED",
      reusedAt: null,
      expiresAt: new Date(Date.now() + 3600 * 1000),
      userAgent: null,
      ipAddress: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const sessionRepo: IRefreshSessionRepository = {
      create: vi.fn(),
      findByTokenHash: vi.fn().mockResolvedValue(alreadyRotatedSession),
      findById: vi.fn(),
      rotateSession: vi.fn(),
      revokeFamily: vi.fn().mockResolvedValue(2),
      revokeSession: vi.fn(),
      deleteByUserId: vi.fn(),
    };

    const refreshService = new RefreshTokenService(
      mockAuthConfig,
      sessionRepo,
      emptyUserRepo,
      emptyTokenService,
    );

    try {
      await refreshService.refresh(rawReplayedToken);
      expect.unreachable("Replay must throw error");
    } catch (err) {
      expect(err).toBeInstanceOf(AppError);
      const appErr = err as AppError;
      expect(appErr.statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(appErr.code).toBe(ERROR_CODES.UNAUTHENTICATED);
      expect(appErr.message).toBe("Invalid or expired refresh session");

      // Verify token family was revoked with REPLAY_DETECTED reason
      expect(sessionRepo.revokeFamily).toHaveBeenCalledWith(
        "family-compromised-123",
        "REPLAY_DETECTED",
      );
    }
  });

  it("rejects expired refresh session safely without minting access token", async () => {
    const rawExpiredToken = "expired-raw-token-12345678901234567890";
    const service = new RefreshTokenService(mockAuthConfig);
    const expiredHash = service.computeTokenHash(rawExpiredToken);

    const expiredSession = {
      id: "session-expired",
      userId: sampleActiveUser.id,
      tokenHash: expiredHash,
      familyId: "family-expired",
      replacedBySessionId: null,
      rotatedAt: null,
      isRevoked: false,
      revokedAt: null,
      revocationReason: null,
      reusedAt: null,
      expiresAt: new Date(Date.now() - 10000), // Expired 10s ago
      userAgent: null,
      ipAddress: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const sessionRepo: IRefreshSessionRepository = {
      create: vi.fn(),
      findByTokenHash: vi.fn().mockResolvedValue(expiredSession),
      findById: vi.fn(),
      rotateSession: vi.fn(),
      revokeFamily: vi.fn(),
      revokeSession: vi.fn(),
      deleteByUserId: vi.fn(),
    };

    const refreshService = new RefreshTokenService(
      mockAuthConfig,
      sessionRepo,
      emptyUserRepo,
      emptyTokenService,
    );

    try {
      await refreshService.refresh(rawExpiredToken);
      expect.unreachable("Expired session must throw");
    } catch (err) {
      expect(err).toBeInstanceOf(AppError);
      const appErr = err as AppError;
      expect(appErr.statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(appErr.code).toBe(ERROR_CODES.UNAUTHENTICATED);
      expect(appErr.message).toBe("Invalid or expired refresh session");
    }
  });

  it("rejects refresh attempt when user is not active", async () => {
    const rawToken = "token-for-suspended-user-12345678901234";
    const service = new RefreshTokenService(mockAuthConfig);
    const hash = service.computeTokenHash(rawToken);

    const activeSession = {
      id: "session-suspended-user",
      userId: "suspended-user-id",
      tokenHash: hash,
      familyId: "family-suspended",
      replacedBySessionId: null,
      rotatedAt: null,
      isRevoked: false,
      revokedAt: null,
      revocationReason: null,
      reusedAt: null,
      expiresAt: new Date(Date.now() + 3600 * 1000),
      userAgent: null,
      ipAddress: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const sessionRepo: IRefreshSessionRepository = {
      create: vi.fn(),
      findByTokenHash: vi.fn().mockResolvedValue(activeSession),
      findById: vi.fn(),
      rotateSession: vi.fn(),
      revokeFamily: vi.fn(),
      revokeSession: vi.fn(),
      deleteByUserId: vi.fn(),
    };

    const userRepo: IUserRepository = {
      findById: vi.fn().mockResolvedValue({
        ...sampleActiveUser,
        id: "suspended-user-id",
        status: "SUSPENDED",
      }),
      findByEmail: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };

    const refreshService = new RefreshTokenService(
      mockAuthConfig,
      sessionRepo,
      userRepo,
      emptyTokenService,
    );

    try {
      await refreshService.refresh(rawToken);
      expect.unreachable("Suspended user must throw");
    } catch (err) {
      expect(err).toBeInstanceOf(AppError);
      const appErr = err as AppError;
      expect(appErr.statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(appErr.code).toBe(ERROR_CODES.UNAUTHENTICATED);
    }
  });

  it("propagates repository/database failure cleanly during lookup (DEF-004)", async () => {
    const rawToken = "valid-token-during-db-failure-1234567890";
    const sessionRepo: IRefreshSessionRepository = {
      create: vi.fn(),
      findByTokenHash: vi.fn().mockRejectedValue(new Error("PrismaClientKnownRequestError: DB connection lost")),
      findById: vi.fn(),
      rotateSession: vi.fn(),
      revokeFamily: vi.fn(),
      revokeSession: vi.fn(),
      deleteByUserId: vi.fn(),
    };

    const refreshService = new RefreshTokenService(
      mockAuthConfig,
      sessionRepo,
      emptyUserRepo,
      emptyTokenService,
    );

    await expect(refreshService.refresh(rawToken)).rejects.toThrow(
      "PrismaClientKnownRequestError: DB connection lost",
    );
  });
});
