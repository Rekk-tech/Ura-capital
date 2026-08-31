import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import express, { type Express } from "express";
import cookieParser from "cookie-parser";
import { requestLoggingMiddleware } from "../../src/middleware/request-logging.js";
import { errorHandlerMiddleware } from "../../src/middleware/error-handler.js";
import { authenticate } from "../../src/modules/auth/auth.middleware.js";
import { requireRole } from "../../src/modules/auth/authorization.middleware.js";
import { adminRouter } from "../../src/modules/admin/admin.route.js";
import { ROLES } from "../../src/modules/auth/authorization.constants.js";
import { AppError } from "../../src/shared/errors/error-envelope.js";
import { ERROR_CODES, HTTP_STATUS } from "@aura/shared";
import { auditRepository } from "../../src/modules/auth/audit.repository.js";
import { accessTokenService } from "../../src/modules/auth/access-token.service.js";
import {
  assignRoleToExistingUser,
  removeRoleFromExistingUser,
} from "../../src/modules/auth/role.seed.js";
import { userRepository } from "../../src/modules/users/user.repository.js";
import { roleRepository } from "../../src/modules/auth/role.repository.js";
import { AUDIT_EVENT_TYPES, AUDIT_OUTCOMES, OPERATION_SOURCES } from "../../src/modules/auth/audit-event.constants.js";
import type { CreateAuditEventInput, AuditRecord } from "../../src/modules/auth/audit-event.types.js";
import type { UserEntity } from "../../src/modules/users/user.repository.js";

function createAuditAuthTestApp(): Express {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use(requestLoggingMiddleware);

  app.use(adminRouter);

  // Test routes to verify non-auditing behavior on un-opted routes
  app.get("/test/rbac/user-only", authenticate, requireRole(ROLES.USER), (_req, res) => {
    res.status(HTTP_STATUS.OK).json({ status: "ok" });
  });

  app.get("/test/rbac/admin-only", authenticate, requireRole(ROLES.ADMIN), (_req, res) => {
    res.status(HTTP_STATUS.OK).json({ status: "ok" });
  });

  app.use((req, _res, next) => {
    next(new AppError(`Endpoint not found: ${req.method} ${req.path}`, ERROR_CODES.NOT_FOUND, HTTP_STATUS.NOT_FOUND));
  });

  app.use(errorHandlerMiddleware);
  return app;
}

describe("FEAT-009 Authorization & Role Audit Integration", () => {
  const app = createAuditAuthTestApp();
  let createdAuditEvents: CreateAuditEventInput[] = [];

  const sampleUser: UserEntity = {
    id: "44444444-5555-6666-7777-888888888888",
    email: "nonadmin@example.com",
    displayName: "Non Admin User",
    status: "ACTIVE",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    createdAuditEvents = [];
    vi.spyOn(auditRepository, "create").mockImplementation(
      async (data: CreateAuditEventInput): Promise<AuditRecord> => {
        createdAuditEvents.push(data);
        return {
          id: `audit-${createdAuditEvents.length}`,
          userId: data.subjectUserId || data.actorUserId || null,
          eventType: data.eventType,
          outcome: data.outcome,
          actorUserId: data.actorUserId || null,
          subjectUserId: data.subjectUserId || null,
          requestId: data.requestId || null,
          sessionId: data.sessionId || null,
          identityHash: data.identityHash || null,
          ipAddress: null,
          userAgent: data.userAgent || null,
          metadata: data.metadata || null,
          occurredAt: new Date(),
          createdAt: new Date(),
        };
      },
    );
  });

  it("GET /admin/ping emits AUTHORIZATION_DENIED when authenticated non-admin is denied", async () => {
    vi.spyOn(userRepository, "findById").mockResolvedValue(sampleUser);
    vi.spyOn(roleRepository, "getUserRoleCodes").mockResolvedValue(["USER"]);
    const { accessToken } = accessTokenService.issueAccessToken(sampleUser.id);

    const res = await request(app)
      .get("/admin/ping")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("FORBIDDEN");

    const deniedEvent = createdAuditEvents.find(
      (e) => e.eventType === AUDIT_EVENT_TYPES.AUTHORIZATION_DENIED,
    );
    expect(deniedEvent).toBeDefined();
    expect(deniedEvent?.outcome).toBe(AUDIT_OUTCOMES.DENIED);
    expect(deniedEvent?.actorUserId).toBe(sampleUser.id);
    expect(deniedEvent?.subjectUserId).toBe(sampleUser.id);
  });

  it("GET /admin/ping does NOT emit any audit event on successful ADMIN access", async () => {
    vi.spyOn(userRepository, "findById").mockResolvedValue(sampleUser);
    vi.spyOn(roleRepository, "getUserRoleCodes").mockResolvedValue(["ADMIN"]);
    const { accessToken } = accessTokenService.issueAccessToken(sampleUser.id);

    const res = await request(app)
      .get("/admin/ping")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok", scope: "admin" });

    const adminEvents = createdAuditEvents.filter(
      (e) => e.eventType === AUDIT_EVENT_TYPES.AUTHORIZATION_DENIED,
    );
    expect(adminEvents).toHaveLength(0);
  });

  it("generic requireRole(USER) denial on user route does NOT emit AUTHORIZATION_DENIED", async () => {
    vi.spyOn(userRepository, "findById").mockResolvedValue(sampleUser);
    vi.spyOn(roleRepository, "getUserRoleCodes").mockResolvedValue([]); // Zero roles
    const { accessToken } = accessTokenService.issueAccessToken(sampleUser.id);

    // /test/rbac/user-only uses requireRole(ROLES.USER) without auditDenied
    const res = await request(app)
      .get("/test/rbac/user-only")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("FORBIDDEN");

    const deniedEvents = createdAuditEvents.filter(
      (e) => e.eventType === AUDIT_EVENT_TYPES.AUTHORIZATION_DENIED,
    );
    expect(deniedEvents).toHaveLength(0);
  });

  it("generic ADMIN route without explicit auditDenied opt-in does NOT emit AUTHORIZATION_DENIED", async () => {
    vi.spyOn(userRepository, "findById").mockResolvedValue(sampleUser);
    vi.spyOn(roleRepository, "getUserRoleCodes").mockResolvedValue(["USER"]);
    const { accessToken } = accessTokenService.issueAccessToken(sampleUser.id);

    // /test/rbac/admin-only uses requireRole(ROLES.ADMIN) without auditDenied
    const res = await request(app)
      .get("/test/rbac/admin-only")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("FORBIDDEN");

    const deniedEvents = createdAuditEvents.filter(
      (e) => e.eventType === AUDIT_EVENT_TYPES.AUTHORIZATION_DENIED,
    );
    expect(deniedEvents).toHaveLength(0);
  });

  it("server-side assignRoleToExistingUser emits ROLE_ASSIGNED audit event", async () => {
    const mockUser: UserEntity = {
      id: "user-target-1",
      email: "target@example.com",
      displayName: "Target User",
      status: "ACTIVE",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.spyOn(userRepository, "findById").mockResolvedValueOnce(mockUser);
    vi.spyOn(roleRepository, "findByName").mockResolvedValueOnce({
      id: "role-admin-id",
      name: "ADMIN",
      description: "Admin",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    vi.spyOn(roleRepository, "getUserRoles").mockResolvedValueOnce([]);
    vi.spyOn(roleRepository, "assignRoleToUser").mockResolvedValueOnce({
      id: "ur-1",
      userId: "user-target-1",
      roleId: "role-admin-id",
      createdAt: new Date(),
    });

    const mockTxRunner = {
      run: vi.fn().mockImplementation(async (cb: (ctx: { tx: unknown; repositories: { roleRepo: typeof roleRepository; auditRepo: typeof auditRepository } }) => Promise<unknown>) => {
        return cb({
          tx: {},
          repositories: { roleRepo: roleRepository, auditRepo: auditRepository },
        });
      }),
    };

    await assignRoleToExistingUser(
      {
        userId: "user-target-1",
        roleCode: "ADMIN",
        operatorUserId: "operator-1",
        operationSource: OPERATION_SOURCES.OPERATOR,
        requestId: "req-role-1",
      },
      userRepository,
      roleRepository,
      mockTxRunner as never,
      () => ({ roleRepo: roleRepository, auditRepo: auditRepository }),
    );

    const roleAssignedEvent = createdAuditEvents.find(
      (e) => e.eventType === AUDIT_EVENT_TYPES.ROLE_ASSIGNED,
    );
    expect(roleAssignedEvent).toBeDefined();
    expect(roleAssignedEvent?.outcome).toBe(AUDIT_OUTCOMES.SUCCESS);
    expect(roleAssignedEvent?.actorUserId).toBe("operator-1");
    expect(roleAssignedEvent?.subjectUserId).toBe("user-target-1");
  });

  it("server-side removeRoleFromExistingUser emits ROLE_REMOVED audit event", async () => {
    const mockUser: UserEntity = {
      id: "user-target-2",
      email: "target2@example.com",
      displayName: "Target 2",
      status: "ACTIVE",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.spyOn(userRepository, "findById").mockResolvedValueOnce(mockUser);
    vi.spyOn(roleRepository, "findByName").mockResolvedValueOnce({
      id: "role-admin-id-2",
      name: "ADMIN",
      description: "Admin",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    vi.spyOn(roleRepository, "removeRoleFromUser").mockResolvedValueOnce();

    await removeRoleFromExistingUser(
      {
        userId: "user-target-2",
        roleCode: "ADMIN",
        operatorUserId: "operator-2",
        operationSource: OPERATION_SOURCES.OPERATOR,
        requestId: "req-role-rem-1",
      },
      userRepository,
      roleRepository,
    );

    const roleRemovedEvent = createdAuditEvents.find(
      (e) => e.eventType === AUDIT_EVENT_TYPES.ROLE_REMOVED,
    );
    expect(roleRemovedEvent).toBeDefined();
    expect(roleRemovedEvent?.outcome).toBe(AUDIT_OUTCOMES.SUCCESS);
    expect(roleRemovedEvent?.actorUserId).toBe("operator-2");
    expect(roleRemovedEvent?.subjectUserId).toBe("user-target-2");
  });

  it("confirms NO public role-management or audit read/write endpoints exist", async () => {
    // Prohibited endpoints must return 404
    const postGrant = await request(app).post("/admin/roles/grant").send({});
    expect(postGrant.status).toBe(404);

    const postRemove = await request(app).post("/admin/roles/remove").send({});
    expect(postRemove.status).toBe(404);

    const getAudit = await request(app).get("/admin/audit-logs");
    expect(getAudit.status).toBe(404);

    const deleteAudit = await request(app).delete("/admin/audit-logs/1");
    expect(deleteAudit.status).toBe(404);
  });
});
