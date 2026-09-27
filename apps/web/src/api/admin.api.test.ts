import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AdminApiClient, adminApi } from "./admin.api";

describe("AdminApiClient (FEAT-077 / AC-007)", () => {
  const originalFetch = globalThis.fetch;
  let client: AdminApiClient;

  beforeEach(() => {
    client = new AdminApiClient();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("exports the canonical singleton instance", () => {
    expect(adminApi).toBeInstanceOf(AdminApiClient);
  });

  describe("verifyAdminAccess", () => {
    it("calls /admin/ping with Bearer token and AbortSignal", async () => {
      const mockResponse = { status: "ok", scope: "admin" };
      globalThis.fetch = vi.fn().mockResolvedValue(
        new Response(JSON.stringify(mockResponse), { status: 200 }),
      );

      const controller = new AbortController();
      const res = await client.verifyAdminAccess("test-token", { signal: controller.signal });

      expect(res).toEqual(mockResponse);
      expect(globalThis.fetch).toHaveBeenCalledWith("/admin/ping", {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: "Bearer test-token",
        },
        body: undefined,
        signal: controller.signal,
      });
    });

    it("throws AdminApiError with 401 when unauthenticated", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ code: "UNAUTHORIZED" }), { status: 401 }),
      );

      await expect(client.verifyAdminAccess("invalid-token")).rejects.toMatchObject({
        name: "AdminApiError",
        status: 401,
        code: "UNAUTHORIZED",
      });
    });

    it("throws AdminApiError with 403 when non-admin user requests access", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ code: "FORBIDDEN" }), { status: 403 }),
      );

      await expect(client.verifyAdminAccess("learner-token")).rejects.toMatchObject({
        name: "AdminApiError",
        status: 403,
        code: "FORBIDDEN",
      });
    });
  });

  describe("getSystemMetrics", () => {
    it("fetches metrics from /api/admin/metrics with authorization", async () => {
      const metricsData = {
        data: {
          totalUsers: 150,
          activeUsers24h: 42,
          activeSimulationSessions: 18,
          flaggedContentCount: 3,
          pendingReviewCount: 3,
          systemHealth: "HEALTHY",
          uptimeSeconds: 86400,
          databaseStatus: "CONNECTED",
          lastAuditTimestamp: "2026-09-27T10:00:00.000Z",
        },
      };

      globalThis.fetch = vi.fn().mockResolvedValue(
        new Response(JSON.stringify(metricsData), { status: 200 }),
      );

      const res = await client.getSystemMetrics("admin-token");
      expect(res).toEqual(metricsData);
      expect(globalThis.fetch).toHaveBeenCalledWith("/api/admin/metrics", {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: "Bearer admin-token",
        },
        body: undefined,
        signal: undefined,
      });
    });
  });

  describe("listUsers & updateUserStatus", () => {
    it("queries /api/admin/users with formatted search and filter parameters", async () => {
      const usersData = {
        data: [
          {
            id: "usr-1",
            email: "admin@aura.io",
            displayName: "Super Admin",
            role: "ADMIN",
            status: "ACTIVE",
            createdAt: "2026-01-01T00:00:00Z",
          },
        ],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      };

      globalThis.fetch = vi.fn().mockResolvedValue(
        new Response(JSON.stringify(usersData), { status: 200 }),
      );

      const res = await client.listUsers(
        { search: "admin", status: "ACTIVE", role: "ADMIN", page: 1, limit: 10 },
        "admin-token",
      );

      expect(res).toEqual(usersData);
      expect(globalThis.fetch).toHaveBeenCalledWith(
        "/api/admin/users?search=admin&status=ACTIVE&role=ADMIN&page=1&limit=10",
        expect.objectContaining({
          method: "GET",
          headers: expect.objectContaining({ Authorization: "Bearer admin-token" }),
        }),
      );
    });

    it("updates user status via PATCH /api/admin/users/:userId/status", async () => {
      const updateResult = {
        success: true,
        user: {
          id: "usr-2",
          email: "spammer@aura.io",
          displayName: "Spammer",
          role: "LEARNER",
          status: "SUSPENDED",
          createdAt: "2026-02-01T00:00:00Z",
        },
      };

      globalThis.fetch = vi.fn().mockResolvedValue(
        new Response(JSON.stringify(updateResult), { status: 200 }),
      );

      const res = await client.updateUserStatus(
        "usr-2",
        { status: "SUSPENDED", reason: "Policy violation" },
        "admin-token",
      );

      expect(res).toEqual(updateResult);
      expect(globalThis.fetch).toHaveBeenCalledWith(
        "/api/admin/users/usr-2/status",
        expect.objectContaining({
          method: "PATCH",
          body: JSON.stringify({ status: "SUSPENDED", reason: "Policy violation" }),
        }),
      );
    });
  });

  describe("listModerationQueue & resolveModerationItem", () => {
    it("queries /api/admin/moderation with filters and pagination", async () => {
      const modData = {
        data: [
          {
            id: "mod-1",
            targetType: "POST",
            targetId: "post-99",
            authorId: "usr-3",
            authorName: "Flagged User",
            snippet: "Suspicious message...",
            reason: "SPAM",
            reportCount: 4,
            status: "PENDING",
            reportedAt: "2026-09-27T08:00:00Z",
          },
        ],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      };

      globalThis.fetch = vi.fn().mockResolvedValue(
        new Response(JSON.stringify(modData), { status: 200 }),
      );

      const res = await client.listModerationQueue({ status: "PENDING" }, "admin-token");
      expect(res).toEqual(modData);
      expect(globalThis.fetch).toHaveBeenCalledWith(
        "/api/admin/moderation?status=PENDING",
        expect.any(Object),
      );
    });

    it("resolves moderation item via POST /api/admin/moderation/:itemId/resolve", async () => {
      const resolveResult = { success: true, itemId: "mod-1", status: "DISMISSED" };
      globalThis.fetch = vi.fn().mockResolvedValue(
        new Response(JSON.stringify(resolveResult), { status: 200 }),
      );

      const res = await client.resolveModerationItem("mod-1", "DISMISS", "admin-token");
      expect(res).toEqual(resolveResult);
      expect(globalThis.fetch).toHaveBeenCalledWith(
        "/api/admin/moderation/mod-1/resolve",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ action: "DISMISS" }),
        }),
      );
    });
  });

  describe("listAuditRecords", () => {
    it("queries /api/admin/audit with event filter and pagination", async () => {
      const auditData = {
        data: [
          {
            id: "aud-1",
            eventType: "USER_STATUS_CHANGE",
            actorId: "usr-admin",
            targetEntity: "USER",
            targetId: "usr-2",
            status: "SUCCESS",
            timestamp: "2026-09-27T09:00:00Z",
          },
        ],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      };

      globalThis.fetch = vi.fn().mockResolvedValue(
        new Response(JSON.stringify(auditData), { status: 200 }),
      );

      const res = await client.listAuditRecords({ eventType: "USER_STATUS_CHANGE" }, "admin-token");
      expect(res).toEqual(auditData);
      expect(globalThis.fetch).toHaveBeenCalledWith(
        "/api/admin/audit?eventType=USER_STATUS_CHANGE",
        expect.any(Object),
      );
    });
  });

  describe("Error handling and status codes (401, 403, 404, 500)", () => {
    it("handles 404 Not Found cleanly with AdminApiError", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ code: "NOT_FOUND", message: "Resource not found" }), {
          status: 404,
        }),
      );

      await expect(client.getSystemMetrics("admin-token")).rejects.toMatchObject({
        name: "AdminApiError",
        status: 404,
        code: "NOT_FOUND",
      });
    });

    it("handles 500 Service Error cleanly with AdminApiError", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue(
        new Response("Internal Server Error", { status: 500 }),
      );

      await expect(client.getSystemMetrics("admin-token")).rejects.toMatchObject({
        name: "AdminApiError",
        status: 500,
        code: "SERVICE_ERROR",
      });
    });
  });
});
