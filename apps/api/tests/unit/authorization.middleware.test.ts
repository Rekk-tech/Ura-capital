import { describe, it, expect, vi } from "vitest";
import { requireRole, requireAnyRole } from "../../src/modules/auth/authorization.middleware.js";
import type { IAuthorizationService } from "../../src/modules/auth/authorization.service.js";
import { ROLES } from "../../src/modules/auth/authorization.constants.js";
import type { AuthorizedRequest } from "../../src/modules/auth/authorization.types.js";
import type { Response } from "express";
import { AppError } from "../../src/shared/errors/error-envelope.js";
import { ERROR_CODES, HTTP_STATUS } from "@aura/shared";

describe("Authorization Middleware Primitives (Unit)", () => {
  const sampleUser = {
    id: "user-123",
    email: "test.authz@auracapital.local",
    displayName: "Authz Test",
    status: "ACTIVE",
    createdAt: new Date().toISOString(),
  };

  const mockRes = {} as Response;

  it("fails closed with 401 UNAUTHENTICATED when req.user is missing", async () => {
    const middleware = requireRole(ROLES.USER);
    const req: AuthorizedRequest = {} as AuthorizedRequest;
    const next = vi.fn();

    await middleware(req, mockRes, next);

    expect(next).toHaveBeenCalledTimes(1);
    const err = next.mock.calls[0][0];
    expect(err).toBeInstanceOf(AppError);
    expect((err as AppError).statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
    expect((err as AppError).code).toBe(ERROR_CODES.UNAUTHENTICATED);
  });

  it("allows request when authenticated user possesses the required role", async () => {
    const mockAuthService: IAuthorizationService = {
      getUserRoles: vi.fn().mockResolvedValue([ROLES.USER]),
      buildAuthorizationContext: vi.fn().mockResolvedValue({
        user: sampleUser,
        roles: [ROLES.USER],
      }),
      hasRole: vi.fn().mockReturnValue(true),
      hasAnyRole: vi.fn(),
    };

    const middleware = requireRole(ROLES.USER, mockAuthService);
    const req: AuthorizedRequest = { user: sampleUser } as AuthorizedRequest;
    const next = vi.fn();

    await middleware(req, mockRes, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(); // No error passed
    expect(req.auth).toBeDefined();
    expect(req.auth?.roles).toEqual([ROLES.USER]);
  });

  it("denies authenticated user without required role with 403 FORBIDDEN", async () => {
    const mockAuthService: IAuthorizationService = {
      getUserRoles: vi.fn().mockResolvedValue([ROLES.USER]),
      buildAuthorizationContext: vi.fn().mockResolvedValue({
        user: sampleUser,
        roles: [ROLES.USER],
      }),
      hasRole: vi.fn().mockReturnValue(false),
      hasAnyRole: vi.fn(),
    };

    const middleware = requireRole(ROLES.ADMIN, mockAuthService);
    const req: AuthorizedRequest = { user: sampleUser } as AuthorizedRequest;
    const next = vi.fn();

    await middleware(req, mockRes, next);

    expect(next).toHaveBeenCalledTimes(1);
    const err = next.mock.calls[0][0];
    expect(err).toBeInstanceOf(AppError);
    expect((err as AppError).statusCode).toBe(HTTP_STATUS.FORBIDDEN);
    expect((err as AppError).code).toBe(ERROR_CODES.FORBIDDEN);
    expect((err as AppError).message).toBe("Insufficient permissions");
  });

  it("propagates database/repository lookup errors to next(err) so error handler maps to 500 (NOT mislabeled as 403)", async () => {
    const mockAuthService: IAuthorizationService = {
      getUserRoles: vi.fn().mockRejectedValue(new Error("PrismaClientInitializationError: DB unreachable")),
      buildAuthorizationContext: vi.fn().mockRejectedValue(new Error("PrismaClientInitializationError: DB unreachable")),
      hasRole: vi.fn(),
      hasAnyRole: vi.fn(),
    };

    const middleware = requireRole(ROLES.USER, mockAuthService);
    const req: AuthorizedRequest = { user: sampleUser } as AuthorizedRequest;
    const next = vi.fn();

    await middleware(req, mockRes, next);

    expect(next).toHaveBeenCalledTimes(1);
    const err = next.mock.calls[0][0];
    expect(err).toBeInstanceOf(Error);
    expect((err as Error).message).toContain("PrismaClientInitializationError");
  });

  it("allows requireAnyRole when at least one required role matches", async () => {
    const mockAuthService: IAuthorizationService = {
      getUserRoles: vi.fn().mockResolvedValue([ROLES.USER]),
      buildAuthorizationContext: vi.fn().mockResolvedValue({
        user: sampleUser,
        roles: [ROLES.USER],
      }),
      hasRole: vi.fn(),
      hasAnyRole: vi.fn().mockReturnValue(true),
    };

    const middleware = requireAnyRole([ROLES.ADMIN, ROLES.USER], mockAuthService);
    const req: AuthorizedRequest = { user: sampleUser } as AuthorizedRequest;
    const next = vi.fn();

    await middleware(req, mockRes, next);

    expect(next).toHaveBeenCalledWith();
    expect(mockAuthService.hasAnyRole).toHaveBeenCalledWith(
      expect.objectContaining({ roles: [ROLES.USER] }),
      [ROLES.ADMIN, ROLES.USER],
    );
  });
});
