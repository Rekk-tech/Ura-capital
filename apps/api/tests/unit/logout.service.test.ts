import { describe, it, expect, vi } from "vitest";
import { LogoutService } from "../../src/modules/auth/logout.service.js";
import type { IRefreshSessionRepository } from "../../src/modules/auth/refresh-session.repository.js";
import type { IRefreshTokenService } from "../../src/modules/auth/refresh-token.service.js";

describe("LogoutService (Unit)", () => {
  const mockRefreshTokenService: IRefreshTokenService = {
    generateRawRefreshToken: vi.fn(),
    computeTokenHash: vi.fn().mockImplementation((token: string) => `hash-${token}`),
    createLoginSession: vi.fn(),
    refresh: vi.fn(),
    revokeFamily: vi.fn(),
    revokeSession: vi.fn(),
  };

  const sampleActiveSession = {
    id: "session-123",
    userId: "user-123",
    tokenHash: "hash-valid-raw-refresh-token-1234567890",
    familyId: "family-123",
    replacedBySessionId: null,
    rotatedAt: null,
    isRevoked: false,
    revokedAt: null,
    revocationReason: null,
    reusedAt: null,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    userAgent: null,
    ipAddress: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  it("durably revokes active refresh session with reason USER_LOGOUT", async () => {
    const rawToken = "valid-raw-refresh-token-1234567890";
    const sessionRepo: IRefreshSessionRepository = {
      create: vi.fn(),
      findByTokenHash: vi.fn().mockResolvedValue(sampleActiveSession),
      findById: vi.fn(),
      rotateSession: vi.fn(),
      revokeFamily: vi.fn(),
      revokeSession: vi.fn().mockResolvedValue({
        ...sampleActiveSession,
        isRevoked: true,
        revocationReason: "USER_LOGOUT",
      }),
      revoke: vi.fn(),
      revokeAllForUser: vi.fn(),
      deleteExpired: vi.fn(),
      deleteByUserId: vi.fn(),
    };

    const service = new LogoutService(sessionRepo, mockRefreshTokenService);
    const result = await service.logout(rawToken);

    expect(result.revoked).toBe(true);
    expect(result.sessionId).toBe("session-123");
    expect(sessionRepo.revokeSession).toHaveBeenCalledWith("session-123", "USER_LOGOUT");
  });

  it("handles missing, non-string, or malformed tokens idempotently without database access", async () => {
    const sessionRepo: IRefreshSessionRepository = {
      create: vi.fn(),
      findByTokenHash: vi.fn(),
      findById: vi.fn(),
      rotateSession: vi.fn(),
      revokeFamily: vi.fn(),
      revokeSession: vi.fn(),
      revoke: vi.fn(),
      revokeAllForUser: vi.fn(),
      deleteExpired: vi.fn(),
      deleteByUserId: vi.fn(),
    };

    const service = new LogoutService(sessionRepo, mockRefreshTokenService);

    const res1 = await service.logout(undefined);
    expect(res1).toEqual({ revoked: false });

    const res2 = await service.logout("");
    expect(res2).toEqual({ revoked: false });

    const res3 = await service.logout("short");
    expect(res3).toEqual({ revoked: false });

    expect(sessionRepo.findByTokenHash).not.toHaveBeenCalled();
    expect(sessionRepo.revokeSession).not.toHaveBeenCalled();
  });

  it("returns safe idempotent result when session does not exist in database", async () => {
    const rawToken = "non-existent-token-1234567890";
    const sessionRepo: IRefreshSessionRepository = {
      create: vi.fn(),
      findByTokenHash: vi.fn().mockResolvedValue(null),
      findById: vi.fn(),
      rotateSession: vi.fn(),
      revokeFamily: vi.fn(),
      revokeSession: vi.fn(),
      revoke: vi.fn(),
      revokeAllForUser: vi.fn(),
      deleteExpired: vi.fn(),
      deleteByUserId: vi.fn(),
    };

    const service = new LogoutService(sessionRepo, mockRefreshTokenService);
    const result = await service.logout(rawToken);

    expect(result).toEqual({ revoked: false });
    expect(sessionRepo.revokeSession).not.toHaveBeenCalled();
  });

  it("returns safe idempotent result when session is already revoked or rotated", async () => {
    const rawToken = "already-revoked-token-1234567890";
    const sessionRepo: IRefreshSessionRepository = {
      create: vi.fn(),
      findByTokenHash: vi.fn().mockResolvedValue({
        ...sampleActiveSession,
        isRevoked: true,
        revocationReason: "USER_LOGOUT",
      }),
      findById: vi.fn(),
      rotateSession: vi.fn(),
      revokeFamily: vi.fn(),
      revokeSession: vi.fn(),
      revoke: vi.fn(),
      revokeAllForUser: vi.fn(),
      deleteExpired: vi.fn(),
      deleteByUserId: vi.fn(),
    };

    const service = new LogoutService(sessionRepo, mockRefreshTokenService);
    const result = await service.logout(rawToken);

    expect(result).toEqual({ revoked: false, sessionId: "session-123" });
    expect(sessionRepo.revokeSession).not.toHaveBeenCalled();
  });

  it("returns safe idempotent result when session is expired", async () => {
    const rawToken = "expired-token-1234567890123456";
    const sessionRepo: IRefreshSessionRepository = {
      create: vi.fn(),
      findByTokenHash: vi.fn().mockResolvedValue({
        ...sampleActiveSession,
        expiresAt: new Date(Date.now() - 1000),
      }),
      findById: vi.fn(),
      rotateSession: vi.fn(),
      revokeFamily: vi.fn(),
      revokeSession: vi.fn(),
      revoke: vi.fn(),
      revokeAllForUser: vi.fn(),
      deleteExpired: vi.fn(),
      deleteByUserId: vi.fn(),
    };

    const service = new LogoutService(sessionRepo, mockRefreshTokenService);
    const result = await service.logout(rawToken);

    expect(result).toEqual({ revoked: false, sessionId: "session-123" });
    expect(sessionRepo.revokeSession).not.toHaveBeenCalled();
  });

  it("propagates repository / database errors without masking them as false success", async () => {
    const rawToken = "valid-raw-refresh-token-1234567890";
    const sessionRepo: IRefreshSessionRepository = {
      create: vi.fn(),
      findByTokenHash: vi.fn().mockRejectedValue(new Error("Database connection lost")),
      findById: vi.fn(),
      rotateSession: vi.fn(),
      revokeFamily: vi.fn(),
      revokeSession: vi.fn(),
      revoke: vi.fn(),
      revokeAllForUser: vi.fn(),
      deleteExpired: vi.fn(),
      deleteByUserId: vi.fn(),
    };

    const service = new LogoutService(sessionRepo, mockRefreshTokenService);

    await expect(service.logout(rawToken)).rejects.toThrow("Database connection lost");
  });
});
