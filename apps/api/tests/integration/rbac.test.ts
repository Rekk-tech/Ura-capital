import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import express, { type Express, type Response } from "express";
import cookieParser from "cookie-parser";
import { requestLoggingMiddleware } from "../../src/middleware/request-logging.js";
import { errorHandlerMiddleware } from "../../src/middleware/error-handler.js";
import { authenticate } from "../../src/modules/auth/auth.middleware.js";
import { requireRole, requireAnyRole } from "../../src/modules/auth/authorization.middleware.js";
import { ROLES } from "../../src/modules/auth/authorization.constants.js";
import { accessTokenService } from "../../src/modules/auth/access-token.service.js";
import { userRepository } from "../../src/modules/users/user.repository.js";
import { roleRepository } from "../../src/modules/auth/role.repository.js";
import { AppError } from "../../src/shared/errors/error-envelope.js";
import { ERROR_CODES, HTTP_STATUS } from "@aura/shared";
import type { AuthorizedRequest } from "../../src/modules/auth/authorization.types.js";

function createRbacTestApp(): Express {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use(requestLoggingMiddleware);

  app.get(
    "/test/rbac/user-only",
    authenticate,
    requireRole(ROLES.USER),
    (req: AuthorizedRequest, res: Response) => {
      res.status(HTTP_STATUS.OK).json({ message: "Welcome User", auth: req.auth });
    },
  );

  app.get(
    "/test/rbac/admin-only",
    authenticate,
    requireRole(ROLES.ADMIN),
    (req: AuthorizedRequest, res: Response) => {
      res.status(HTTP_STATUS.OK).json({ message: "Welcome Admin", auth: req.auth });
    },
  );

  app.get(
    "/test/rbac/any-role",
    authenticate,
    requireAnyRole([ROLES.ADMIN, ROLES.USER]),
    (req: AuthorizedRequest, res: Response) => {
      res.status(HTTP_STATUS.OK).json({ message: "Welcome Any", auth: req.auth });
    },
  );

  app.use((req, _res, next) => {
    next(new AppError(`Endpoint not found: ${req.method} ${req.path}`, ERROR_CODES.NOT_FOUND, HTTP_STATUS.NOT_FOUND));
  });

  app.use(errorHandlerMiddleware);

  return app;
}

describe("RBAC Authorization Foundation & Error Safety (Integration)", () => {
  const sampleUser = {
    id: "22222222-3333-4444-5555-666666666666",
    email: "test.rbac.integration@auracapital.local",
    displayName: "RBAC User",
    status: "ACTIVE",
    createdAt: new Date("2026-08-26T12:00:00.000Z"),
    updatedAt: new Date("2026-08-26T12:00:00.000Z"),
  };

  let app: Express;

  beforeEach(() => {
    vi.restoreAllMocks();
    app = createRbacTestApp();
  });

  it("returns 401 UNAUTHENTICATED when authorization header is missing on role-protected route", async () => {
    const res = await request(app)
      .get("/test/rbac/user-only")
      .expect(HTTP_STATUS.UNAUTHORIZED);

    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe(ERROR_CODES.UNAUTHENTICATED);
  });

  it("denies authenticated zero-role user on requireRole(USER) with 403 FORBIDDEN", async () => {
    vi.spyOn(userRepository, "findById").mockResolvedValue(sampleUser);
    vi.spyOn(roleRepository, "getUserRoleCodes").mockResolvedValue([]); // Zero roles

    const { accessToken } = accessTokenService.issueAccessToken(sampleUser.id);

    const res = await request(app)
      .get("/test/rbac/user-only")
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(HTTP_STATUS.FORBIDDEN);

    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe(ERROR_CODES.FORBIDDEN);
    expect(res.body.error.message).toBe("Insufficient permissions");
  });

  it("allows authenticated user possessing the required USER role", async () => {
    vi.spyOn(userRepository, "findById").mockResolvedValue(sampleUser);
    vi.spyOn(roleRepository, "getUserRoleCodes").mockResolvedValue(["USER"]);

    const { accessToken } = accessTokenService.issueAccessToken(sampleUser.id);

    const res = await request(app)
      .get("/test/rbac/user-only")
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(HTTP_STATUS.OK);

    expect(res.body.message).toBe("Welcome User");
    expect(res.body.auth.roles).toEqual(["USER"]);
    expect(res.body.auth.user.id).toBe(sampleUser.id);
  });

  it("denies authenticated user with USER role when requesting ADMIN route with 403 FORBIDDEN", async () => {
    vi.spyOn(userRepository, "findById").mockResolvedValue(sampleUser);
    vi.spyOn(roleRepository, "getUserRoleCodes").mockResolvedValue(["USER"]);

    const { accessToken } = accessTokenService.issueAccessToken(sampleUser.id);

    const res = await request(app)
      .get("/test/rbac/admin-only")
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(HTTP_STATUS.FORBIDDEN);

    expect(res.body.error.code).toBe(ERROR_CODES.FORBIDDEN);
  });

  it("allows authenticated user possessing the required ADMIN role", async () => {
    vi.spyOn(userRepository, "findById").mockResolvedValue(sampleUser);
    vi.spyOn(roleRepository, "getUserRoleCodes").mockResolvedValue(["ADMIN"]);

    const { accessToken } = accessTokenService.issueAccessToken(sampleUser.id);

    const res = await request(app)
      .get("/test/rbac/admin-only")
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(HTTP_STATUS.OK);

    expect(res.body.message).toBe("Welcome Admin");
    expect(res.body.auth.roles).toEqual(["ADMIN"]);
  });

  it("allows multi-role user possessing any of the required roles", async () => {
    vi.spyOn(userRepository, "findById").mockResolvedValue(sampleUser);
    vi.spyOn(roleRepository, "getUserRoleCodes").mockResolvedValue(["USER", "ADMIN"]);

    const { accessToken } = accessTokenService.issueAccessToken(sampleUser.id);

    const res = await request(app)
      .get("/test/rbac/any-role")
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(HTTP_STATUS.OK);

    expect(res.body.message).toBe("Welcome Any");
    expect(res.body.auth.roles).toEqual(["ADMIN", "USER"]); // Deterministic lexical ascending
  });

  it("strictly ignores client-supplied body, query, and header role/admin claims", async () => {
    vi.spyOn(userRepository, "findById").mockResolvedValue(sampleUser);
    vi.spyOn(roleRepository, "getUserRoleCodes").mockResolvedValue(["USER"]); // Server-side has only USER

    const { accessToken } = accessTokenService.issueAccessToken(sampleUser.id);

    // Attacker tries to spoof ADMIN role via headers and query
    const res = await request(app)
      .get("/test/rbac/admin-only?role=ADMIN&isAdmin=true")
      .set("Authorization", `Bearer ${accessToken}`)
      .set("X-Role", "ADMIN")
      .set("X-Admin", "true")
      .expect(HTTP_STATUS.FORBIDDEN);

    expect(res.body.error.code).toBe(ERROR_CODES.FORBIDDEN);
  });

  it("verifies FEAT-004 access token payload remains strictly role-free", () => {
    const { accessToken } = accessTokenService.issueAccessToken(sampleUser.id);
    const decoded = accessTokenService.verifyAccessToken(accessToken);

    expect(decoded.sub).toBe(sampleUser.id);
    expect(decoded).not.toHaveProperty("role");
    expect(decoded).not.toHaveProperty("roles");
    expect(decoded).not.toHaveProperty("admin");
    expect(decoded).not.toHaveProperty("isAdmin");
    expect(decoded).not.toHaveProperty("permissions");
  });

  it("handles unexpected database failure during role lookup safely without reporting normal 403", async () => {
    vi.spyOn(userRepository, "findById").mockResolvedValue(sampleUser);
    vi.spyOn(roleRepository, "getUserRoleCodes").mockRejectedValue(
      new Error("PrismaClientInitializationError: Connection to postgresql failed"),
    );

    const { accessToken } = accessTokenService.issueAccessToken(sampleUser.id);

    const res = await request(app)
      .get("/test/rbac/user-only")
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(HTTP_STATUS.INTERNAL_SERVER_ERROR);

    expect(res.body.error.code).toBe(ERROR_CODES.INTERNAL_ERROR);
    expect(res.body.error.message).toBe("An unexpected internal server error occurred");

    // No leakage of database error internals
    const resText = JSON.stringify(res.body);
    expect(resText).not.toContain("PrismaClientInitializationError");
    expect(resText).not.toContain("postgresql");
  });
});
