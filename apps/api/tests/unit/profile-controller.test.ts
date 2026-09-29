import { describe, it, expect, vi, beforeEach } from "vitest";
import { ProfileController } from "../../src/modules/auth/profile.controller.js";
import type { IUserRepository, UserEntity } from "../../src/modules/users/user.repository.js";
import type { IAuthorizationService } from "../../src/modules/auth/authorization.service.js";
import type { ICredentialRepository, CredentialEntity } from "../../src/modules/auth/credential.repository.js";
import type { IPasswordHashingService } from "../../src/modules/auth/password-hashing.service.js";
import type { AuthenticatedRequest, AuthenticatedUser } from "../../src/modules/auth/auth.types.js";
import type { Response, NextFunction } from "express";

describe("ProfileController Unit Tests (FEAT-078)", () => {
  let mockUserRepo: IUserRepository;
  let mockAuthzService: IAuthorizationService;
  let mockCredRepo: ICredentialRepository;
  let mockHashService: IPasswordHashingService;
  let controller: ProfileController;

  const sampleUser: UserEntity = {
    id: "usr-test-1",
    email: "learner@auracapital.io",
    displayName: "Original Name",
    status: "ACTIVE",
    createdAt: new Date("2026-01-01T00:00:00Z"),
    updatedAt: new Date("2026-01-01T00:00:00Z"),
  };

  const sampleAuthUser: AuthenticatedUser = {
    id: "usr-test-1",
    email: "learner@auracapital.io",
    displayName: "Original Name",
    status: "ACTIVE",
    createdAt: "2026-01-01T00:00:00.000Z",
  };

  beforeEach(() => {
    mockUserRepo = {
      findById: vi.fn().mockResolvedValue(sampleUser),
      findByEmail: vi.fn(),
      create: vi.fn(),
      update: vi.fn().mockImplementation((id, data) =>
        Promise.resolve({
          ...sampleUser,
          displayName: data.displayName !== undefined ? data.displayName : sampleUser.displayName,
        })
      ),
      delete: vi.fn(),
    };

    mockAuthzService = {
      getUserRoles: vi.fn().mockResolvedValue(["USER"]),
      buildAuthorizationContext: vi.fn(),
      hasRole: vi.fn(),
      hasAnyRole: vi.fn(),
    };

    mockCredRepo = {
      findByUserId: vi.fn().mockResolvedValue({
        id: "cred-1",
        userId: "usr-test-1",
        type: "PASSWORD",
        passwordHash: "$argon2id$mockhash",
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as CredentialEntity),
      create: vi.fn(),
      updatePasswordHash: vi.fn().mockResolvedValue({} as CredentialEntity),
      deleteByUserId: vi.fn(),
    };

    mockHashService = {
      hashPassword: vi.fn().mockResolvedValue("$argon2id$newhash"),
      verifyPassword: vi.fn().mockResolvedValue(true),
    };

    controller = new ProfileController(mockUserRepo, mockAuthzService, mockCredRepo, mockHashService);
  });

  const createMockReqRes = (user: AuthenticatedUser | undefined, body: Record<string, unknown> = {}) => {
    const req = {
      user,
      body,
      headers: { "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0" },
      ip: "127.0.0.1",
      socket: { remoteAddress: "127.0.0.1" },
    } as unknown as AuthenticatedRequest;

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    } as unknown as Response;

    const next: NextFunction = vi.fn();

    return { req, res, next };
  };

  it("getProfile returns user profile with server-verified roles", async () => {
    const { req, res, next } = createMockReqRes(sampleAuthUser);

    await controller.getProfile(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      profile: {
        id: "usr-test-1",
        email: "learner@auracapital.io",
        displayName: "Original Name",
        status: "ACTIVE",
        roles: ["USER"],
        createdAt: "2026-01-01T00:00:00.000Z",
      },
    });
  });

  it("updateProfile updates display name and returns updated profile", async () => {
    const { req, res, next } = createMockReqRes(sampleAuthUser, { displayName: "Updated Trader" });

    await controller.updateProfile(req, res, next);

    expect(mockUserRepo.update).toHaveBeenCalledWith("usr-test-1", { displayName: "Updated Trader" });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        profile: expect.objectContaining({
          displayName: "Updated Trader",
        }),
      })
    );
  });

  it("updateProfile rejects non-string displayName", async () => {
    const { req, res, next } = createMockReqRes(sampleAuthUser, { displayName: 12345 });

    await controller.updateProfile(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }));
  });

  it("changePassword succeeds with valid current password and compliant new password", async () => {
    const { req, res, next } = createMockReqRes(sampleAuthUser, {
      currentPassword: "OldValidPassword123!",
      newPassword: "NewValidPassword123!",
    });

    await controller.changePassword(req, res, next);

    expect(mockHashService.verifyPassword).toHaveBeenCalledWith("OldValidPassword123!", "$argon2id$mockhash");
    expect(mockHashService.hashPassword).toHaveBeenCalledWith("NewValidPassword123!");
    expect(mockCredRepo.updatePasswordHash).toHaveBeenCalledWith("usr-test-1", "$argon2id$newhash", 2);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: "Password changed successfully",
    });
  });

  it("changePassword rejects short password failing policy (<12 chars)", async () => {
    const { req, res, next } = createMockReqRes(sampleAuthUser, {
      currentPassword: "OldValidPassword123!",
      newPassword: "short",
    });

    await controller.changePassword(req, res, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 400,
        message: expect.stringContaining("at least 12 characters"),
      })
    );
  });

  it("changePassword rejects incorrect current password", async () => {
    (mockHashService.verifyPassword as ReturnType<typeof vi.fn>).mockResolvedValue(false);

    const { req, res, next } = createMockReqRes(sampleAuthUser, {
      currentPassword: "WrongPassword123!",
      newPassword: "NewValidPassword123!",
    });

    await controller.changePassword(req, res, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 400,
        message: "Current password is incorrect",
      })
    );
  });

  it("listSessions returns browser session tagged with isCurrent: true", async () => {
    const { req, res, next } = createMockReqRes(sampleAuthUser);

    await controller.listSessions(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      sessions: [
        expect.objectContaining({
          isCurrent: true,
          device: "Desktop Workstation",
          browser: "Chrome",
        }),
      ],
    });
  });
});
