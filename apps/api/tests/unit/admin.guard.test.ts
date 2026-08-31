import { describe, it, expect, vi } from "vitest";
import { requireAdmin } from "../../src/modules/admin/admin.guard.js";
import { ROLES } from "../../src/modules/auth/authorization.constants.js";
import type { IAuthorizationService } from "../../src/modules/auth/authorization.service.js";
import type { AuthorizedRequest } from "../../src/modules/auth/authorization.types.js";
import type { Response } from "express";
import { AppError } from "../../src/shared/errors/error-envelope.js";
import { ERROR_CODES, HTTP_STATUS } from "@aura/shared";

describe("Admin Authorization Guard (Unit)", () => {
  const sampleUser = {
    id: "admin-user-uuid-12345",
    email: "admin.unit@auracapital.local",
    displayName: "Admin Unit User",
    status: "ACTIVE",
    createdAt: new Date().toISOString(),
  };

  const mockRes = {} as Response;

  it("fails closed with 401 UNAUTHENTICATED when req.user is missing", async () => {
    const guard = requireAdmin();
    const req = {} as AuthorizedRequest;
    const next = vi.fn();

    await guard(req, mockRes, next);

    expect(next).toHaveBeenCalledTimes(1);
    const err = next.mock.calls[0][0];
    expect(err).toBeInstanceOf(AppError);
    expect((err as AppError).statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
    expect((err as AppError).code).toBe(ERROR_CODES.UNAUTHENTICATED);
  });

  it("denies authenticated zero-role user with 403 FORBIDDEN", async () => {
    const mockAuthService: IAuthorizationService = {
      getUserRoles: vi.fn().mockResolvedValue([]),
      buildAuthorizationContext: vi.fn().mockResolvedValue({
        user: sampleUser,
        roles: [],
      }),
      hasRole: vi.fn().mockReturnValue(false),
      hasAnyRole: vi.fn().mockReturnValue(false),
    };

    const guard = requireAdmin(mockAuthService);
    const req = { user: sampleUser } as AuthorizedRequest;
    const next = vi.fn();

    await guard(req, mockRes, next);

    expect(next).toHaveBeenCalledTimes(1);
    const err = next.mock.calls[0][0];
    expect(err).toBeInstanceOf(AppError);
    expect((err as AppError).statusCode).toBe(HTTP_STATUS.FORBIDDEN);
    expect((err as AppError).code).toBe(ERROR_CODES.FORBIDDEN);
    expect(mockAuthService.hasRole).toHaveBeenCalledWith(
      expect.objectContaining({ roles: [] }),
      ROLES.ADMIN,
    );
  });

  it("denies authenticated USER-only user with 403 FORBIDDEN", async () => {
    const mockAuthService: IAuthorizationService = {
      getUserRoles: vi.fn().mockResolvedValue([ROLES.USER]),
      buildAuthorizationContext: vi.fn().mockResolvedValue({
        user: sampleUser,
        roles: [ROLES.USER],
      }),
      hasRole: vi.fn().mockReturnValue(false),
      hasAnyRole: vi.fn().mockReturnValue(false),
    };

    const guard = requireAdmin(mockAuthService);
    const req = { user: sampleUser } as AuthorizedRequest;
    const next = vi.fn();

    await guard(req, mockRes, next);

    expect(next).toHaveBeenCalledTimes(1);
    const err = next.mock.calls[0][0];
    expect(err).toBeInstanceOf(AppError);
    expect((err as AppError).statusCode).toBe(HTTP_STATUS.FORBIDDEN);
    expect((err as AppError).code).toBe(ERROR_CODES.FORBIDDEN);
    expect(mockAuthService.hasRole).toHaveBeenCalledWith(
      expect.objectContaining({ roles: [ROLES.USER] }),
      ROLES.ADMIN,
    );
  });

  it("allows authenticated user possessing the canonical ADMIN role", async () => {
    const mockAuthService: IAuthorizationService = {
      getUserRoles: vi.fn().mockResolvedValue([ROLES.ADMIN]),
      buildAuthorizationContext: vi.fn().mockResolvedValue({
        user: sampleUser,
        roles: [ROLES.ADMIN],
      }),
      hasRole: vi.fn().mockReturnValue(true),
      hasAnyRole: vi.fn().mockReturnValue(true),
    };

    const guard = requireAdmin(mockAuthService);
    const req = { user: sampleUser } as AuthorizedRequest;
    const next = vi.fn();

    await guard(req, mockRes, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(); // No error
    expect(req.auth?.roles).toEqual([ROLES.ADMIN]);
    expect(mockAuthService.hasRole).toHaveBeenCalledWith(
      expect.objectContaining({ roles: [ROLES.ADMIN] }),
      ROLES.ADMIN,
    );
  });

  it("allows authenticated multi-role USER+ADMIN user", async () => {
    const mockAuthService: IAuthorizationService = {
      getUserRoles: vi.fn().mockResolvedValue([ROLES.ADMIN, ROLES.USER]),
      buildAuthorizationContext: vi.fn().mockResolvedValue({
        user: sampleUser,
        roles: [ROLES.ADMIN, ROLES.USER],
      }),
      hasRole: vi.fn().mockReturnValue(true),
      hasAnyRole: vi.fn().mockReturnValue(true),
    };

    const guard = requireAdmin(mockAuthService);
    const req = { user: sampleUser } as AuthorizedRequest;
    const next = vi.fn();

    await guard(req, mockRes, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(); // Allowed
    expect(req.auth?.roles).toEqual([ROLES.ADMIN, ROLES.USER]);
  });

  it("propagates database/repository lookup failure to next(err) so error handler maps to 500 (NOT 403)", async () => {
    const mockAuthService: IAuthorizationService = {
      getUserRoles: vi.fn().mockRejectedValue(new Error("PrismaClientInitializationError: DB connection timed out")),
      buildAuthorizationContext: vi.fn().mockRejectedValue(new Error("PrismaClientInitializationError: DB connection timed out")),
      hasRole: vi.fn(),
      hasAnyRole: vi.fn(),
    };

    const guard = requireAdmin(mockAuthService);
    const req = { user: sampleUser } as AuthorizedRequest;
    const next = vi.fn();

    await guard(req, mockRes, next);

    expect(next).toHaveBeenCalledTimes(1);
    const err = next.mock.calls[0][0];
    expect(err).toBeInstanceOf(Error);
    expect((err as Error).message).toContain("PrismaClientInitializationError");
  });
});
