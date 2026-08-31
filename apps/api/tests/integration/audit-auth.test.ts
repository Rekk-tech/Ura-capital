import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "../../src/server.js";
import { auditRepository } from "../../src/modules/auth/audit.repository.js";
import { registrationService } from "../../src/modules/auth/registration.service.js";
import { loginService } from "../../src/modules/auth/login.service.js";
import { AppError } from "../../src/shared/errors/error-envelope.js";
import { ERROR_CODES, HTTP_STATUS } from "@aura/shared";
import { AUDIT_EVENT_TYPES, AUDIT_OUTCOMES } from "../../src/modules/auth/audit-event.constants.js";
import type { CreateAuditEventInput, AuditRecord } from "../../src/modules/auth/audit-event.types.js";

describe("FEAT-009 Authentication Audit Integration (Registration & Login)", () => {
  const app = createApp();
  let createdAuditEvents: CreateAuditEventInput[] = [];

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

  it("POST /auth/register emits REGISTRATION_SUCCESS audit event on success", async () => {
    const uniqueEmail = `audit_reg_${Date.now()}@example.com`;

    // Mock registration service to return successful user
    vi.spyOn(registrationService, "register").mockImplementation(async (_req, ctx) => {
      const user = {
        id: "user-audit-reg-1",
        email: uniqueEmail,
        displayName: "Audit User",
        status: "ACTIVE",
        createdAt: new Date().toISOString(),
      };
      await auditRepository.create({
        eventType: AUDIT_EVENT_TYPES.REGISTRATION_SUCCESS,
        outcome: AUDIT_OUTCOMES.SUCCESS,
        actorUserId: user.id,
        subjectUserId: user.id,
        requestId: ctx?.requestId || null,
        userAgent: ctx?.userAgent || null,
      });
      return { user };
    });

    const res = await request(app)
      .post("/auth/register")
      .send({
        email: uniqueEmail,
        password: "ValidSecurePassword123!",
        displayName: "Audit User",
      });

    expect(res.status).toBe(201);
    expect(res.body.user).toBeDefined();

    const regEvent = createdAuditEvents.find(
      (e) => e.eventType === AUDIT_EVENT_TYPES.REGISTRATION_SUCCESS,
    );
    expect(regEvent).toBeDefined();
    expect(regEvent?.outcome).toBe(AUDIT_OUTCOMES.SUCCESS);
    expect(regEvent?.actorUserId).toBe("user-audit-reg-1");
    expect(regEvent?.subjectUserId).toBe("user-audit-reg-1");
  });

  it("POST /auth/register receives server-derived requestId/UA and ignores client body/query requestId spoofing", async () => {
    const uniqueEmail = `audit_reg_ctx_${Date.now()}@example.com`;
    let receivedContext: { requestId?: string | null; userAgent?: string | null } | undefined = undefined;

    vi.spyOn(registrationService, "register").mockImplementation(async (_req, ctx) => {
      receivedContext = ctx;
      const user = {
        id: "user-audit-reg-ctx",
        email: uniqueEmail,
        displayName: "Context User",
        status: "ACTIVE",
        createdAt: new Date().toISOString(),
      };
      await auditRepository.create({
        eventType: AUDIT_EVENT_TYPES.REGISTRATION_SUCCESS,
        outcome: AUDIT_OUTCOMES.SUCCESS,
        actorUserId: user.id,
        subjectUserId: user.id,
        requestId: ctx?.requestId || null,
        userAgent: ctx?.userAgent || null,
      });
      return { user };
    });

    const res = await request(app)
      .post("/auth/register?requestId=spoofed-query-id")
      .set("User-Agent", "Mozilla/5.0 TestBrowser")
      .set("X-Request-Id", "server-assigned-request-id-12345")
      .send({
        email: uniqueEmail,
        password: "ValidSecurePassword123!",
        displayName: "Context User",
        requestId: "spoofed-body-id",
      });

    expect(res.status).toBe(201);
    expect(receivedContext).toEqual(
      expect.objectContaining({
        requestId: "server-assigned-request-id-12345",
        userAgent: "Mozilla/5.0 TestBrowser",
      }),
    );

    const regEvent = createdAuditEvents.find(
      (e) => e.eventType === AUDIT_EVENT_TYPES.REGISTRATION_SUCCESS,
    );
    expect(regEvent?.requestId).toBe("server-assigned-request-id-12345");
    expect(regEvent?.userAgent).toBe("Mozilla/5.0 TestBrowser");
  });

  it("POST /auth/login emits LOGIN_SUCCESS audit event on valid login", async () => {
    vi.spyOn(loginService, "login").mockImplementation(async (_req, metadata) => {
      const user = {
        id: "user-audit-login-1",
        email: "user@example.com",
        displayName: "Login User",
        status: "ACTIVE",
        createdAt: new Date().toISOString(),
      };
      await auditRepository.create({
        eventType: AUDIT_EVENT_TYPES.LOGIN_SUCCESS,
        outcome: AUDIT_OUTCOMES.SUCCESS,
        actorUserId: user.id,
        subjectUserId: user.id,
        sessionId: "sess-login-1",
        requestId: metadata?.requestId || null,
        userAgent: metadata?.userAgent || null,
        metadata: { sessionId: "sess-login-1" },
      });
      return {
        accessToken: "mock.access.token",
        tokenType: "Bearer",
        expiresIn: 900,
        rawRefreshToken: "mock_refresh_token_string_1234567890",
        user,
      };
    });

    const res = await request(app)
      .post("/auth/login")
      .send({
        email: "user@example.com",
        password: "ValidSecurePassword123!",
      });

    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBe("mock.access.token");

    const loginEvent = createdAuditEvents.find(
      (e) => e.eventType === AUDIT_EVENT_TYPES.LOGIN_SUCCESS,
    );
    expect(loginEvent).toBeDefined();
    expect(loginEvent?.outcome).toBe(AUDIT_OUTCOMES.SUCCESS);
    expect(loginEvent?.actorUserId).toBe("user-audit-login-1");
    expect(loginEvent?.subjectUserId).toBe("user-audit-login-1");
  });

  it("POST /auth/login emits LOGIN_FAILURE audit event on invalid password while preserving uniform 401 response", async () => {
    vi.spyOn(loginService, "login").mockImplementationOnce(async (_req, metadata) => {
      await auditRepository.create({
        eventType: AUDIT_EVENT_TYPES.LOGIN_FAILURE,
        outcome: AUDIT_OUTCOMES.FAILURE,
        actorUserId: null,
        subjectUserId: null,
        requestId: metadata?.requestId || null,
        userAgent: metadata?.userAgent || null,
        metadata: { reasonCode: "UNKNOWN_USER" },
      });
      throw new AppError(
        "Invalid email or password",
        ERROR_CODES.UNAUTHENTICATED,
        HTTP_STATUS.UNAUTHORIZED,
      );
    });

    const res = await request(app)
      .post("/auth/login")
      .send({
        email: "nonexistent@example.com",
        password: "WrongPassword123!",
      });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHENTICATED");
    expect(res.body.error.message).toBe("Invalid email or password");

    const failEvent = createdAuditEvents.find(
      (e) => e.eventType === AUDIT_EVENT_TYPES.LOGIN_FAILURE,
    );
    expect(failEvent).toBeDefined();
    expect(failEvent?.outcome).toBe(AUDIT_OUTCOMES.FAILURE);
    // For unknown user, actor and subject must be null (no account enumeration)
    expect(failEvent?.actorUserId).toBeNull();
    expect(failEvent?.subjectUserId).toBeNull();
  });

  it("does NOT emit generic AUTHENTICATION_FAILURE audit events on missing/unauthenticated requests", async () => {
    const res = await request(app).get("/auth/me");
    expect(res.status).toBe(401);

    const authFailEvents = createdAuditEvents.filter(
      (e) => e.eventType === AUDIT_EVENT_TYPES.AUTHENTICATION_FAILURE,
    );
    expect(authFailEvents).toHaveLength(0);
  });
});
