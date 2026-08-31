import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "../../src/server.js";
import { auditRepository } from "../../src/modules/auth/audit.repository.js";
import { refreshTokenService } from "../../src/modules/auth/refresh-token.service.js";
import { logoutService } from "../../src/modules/auth/logout.service.js";
import { AUDIT_EVENT_TYPES, AUDIT_OUTCOMES } from "../../src/modules/auth/audit-event.constants.js";
import type { CreateAuditEventInput, AuditRecord } from "../../src/modules/auth/audit-event.types.js";

describe("FEAT-009 Session Audit Integration (Refresh & Logout)", () => {
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

  it("POST /auth/refresh emits REFRESH_SUCCESS on valid token rotation", async () => {
    vi.spyOn(refreshTokenService, "refresh").mockImplementation(async (_raw, metadata) => {
      await auditRepository.create({
        eventType: AUDIT_EVENT_TYPES.REFRESH_SUCCESS,
        outcome: AUDIT_OUTCOMES.SUCCESS,
        actorUserId: "user-ref-1",
        subjectUserId: "user-ref-1",
        sessionId: "sess-ref-1",
        requestId: metadata?.requestId || null,
        userAgent: metadata?.userAgent || null,
        metadata: { sessionId: "sess-ref-1", familyId: "fam-ref-1" },
      });
      return {
        accessToken: "new.access.token",
        tokenType: "Bearer",
        expiresIn: 900,
        newRawToken: "new_rotated_raw_refresh_token_12345678",
        user: {
          id: "user-ref-1",
          email: "ref@example.com",
          displayName: "Refresh User",
          status: "ACTIVE",
          createdAt: new Date().toISOString(),
        },
      };
    });

    const res = await request(app)
      .post("/auth/refresh")
      .set("Cookie", ["aura_refresh_token=valid_raw_token_12345678901234567890"]);

    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBe("new.access.token");

    const refreshEvent = createdAuditEvents.find(
      (e) => e.eventType === AUDIT_EVENT_TYPES.REFRESH_SUCCESS,
    );
    expect(refreshEvent).toBeDefined();
    expect(refreshEvent?.outcome).toBe(AUDIT_OUTCOMES.SUCCESS);
    expect(refreshEvent?.actorUserId).toBe("user-ref-1");
  });

  it("POST /auth/refresh without cookie emits REFRESH_FAILURE", async () => {
    const res = await request(app).post("/auth/refresh");
    expect(res.status).toBe(401);

    const failEvent = createdAuditEvents.find(
      (e) => e.eventType === AUDIT_EVENT_TYPES.REFRESH_FAILURE,
    );
    expect(failEvent).toBeDefined();
    expect(failEvent?.outcome).toBe(AUDIT_OUTCOMES.FAILURE);
  });

  it("POST /auth/logout emits LOGOUT_SUCCESS when an active session is revoked", async () => {
    vi.spyOn(logoutService, "logout").mockImplementation(async (_raw, ctx) => {
      await auditRepository.create({
        eventType: AUDIT_EVENT_TYPES.LOGOUT_SUCCESS,
        outcome: AUDIT_OUTCOMES.SUCCESS,
        actorUserId: "user-logout-1",
        subjectUserId: "user-logout-1",
        sessionId: "sess-logout-1",
        requestId: ctx?.requestId || null,
        userAgent: ctx?.userAgent || null,
        metadata: { sessionId: "sess-logout-1" },
      });
      return { revoked: true, sessionId: "sess-logout-1" };
    });

    const res = await request(app)
      .post("/auth/logout")
      .set("Cookie", ["aura_refresh_token=active_raw_token_12345678901234567890"]);

    expect(res.status).toBe(204);

    const logoutEvent = createdAuditEvents.find(
      (e) => e.eventType === AUDIT_EVENT_TYPES.LOGOUT_SUCCESS,
    );
    expect(logoutEvent).toBeDefined();
    expect(logoutEvent?.outcome).toBe(AUDIT_OUTCOMES.SUCCESS);
    expect(logoutEvent?.actorUserId).toBe("user-logout-1");
  });

  it("POST /auth/logout passes server-derived requestId and UA, ignoring client body/query spoofing", async () => {
    let receivedContext: { requestId?: string | null; userAgent?: string | null } | undefined = undefined;

    vi.spyOn(logoutService, "logout").mockImplementation(async (_raw, ctx) => {
      receivedContext = ctx;
      await auditRepository.create({
        eventType: AUDIT_EVENT_TYPES.LOGOUT_SUCCESS,
        outcome: AUDIT_OUTCOMES.SUCCESS,
        actorUserId: "user-logout-ctx",
        subjectUserId: "user-logout-ctx",
        sessionId: "sess-logout-ctx",
        requestId: ctx?.requestId || null,
        userAgent: ctx?.userAgent || null,
        metadata: { sessionId: "sess-logout-ctx" },
      });
      return { revoked: true, sessionId: "sess-logout-ctx" };
    });

    const res = await request(app)
      .post("/auth/logout?requestId=spoofed-query-req-id")
      .set("User-Agent", "Mozilla/5.0 SecureBrowser")
      .set("X-Request-Id", "server-assigned-logout-id-67890")
      .set("Cookie", ["aura_refresh_token=active_raw_token_12345678901234567890"])
      .send({ requestId: "spoofed-body-req-id" });

    expect(res.status).toBe(204);
    expect(receivedContext).toEqual(
      expect.objectContaining({
        requestId: "server-assigned-logout-id-67890",
        userAgent: "Mozilla/5.0 SecureBrowser",
      }),
    );

    const logoutEvent = createdAuditEvents.find(
      (e) => e.eventType === AUDIT_EVENT_TYPES.LOGOUT_SUCCESS,
    );
    expect(logoutEvent?.requestId).toBe("server-assigned-logout-id-67890");
    expect(logoutEvent?.userAgent).toBe("Mozilla/5.0 SecureBrowser");
  });

  it("POST /auth/logout does NOT emit LOGOUT_SUCCESS for missing/already-inactive logout", async () => {
    // Normal missing cookie call returns 204 idempotently without emitting LOGOUT_SUCCESS
    const res = await request(app).post("/auth/logout");
    expect(res.status).toBe(204);

    const logoutEvents = createdAuditEvents.filter(
      (e) => e.eventType === AUDIT_EVENT_TYPES.LOGOUT_SUCCESS,
    );
    expect(logoutEvents).toHaveLength(0);
  });
});
