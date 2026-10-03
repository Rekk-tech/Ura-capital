import { describe, it, expect, vi, beforeEach } from "vitest";
import { AdminService } from "../../src/modules/admin/admin.service.js";
import type { IAdminRepository, AdminUserRecord } from "../../src/modules/admin/admin.repository.js";
import { AppError } from "../../src/shared/errors/error-envelope.js";
import { HTTP_STATUS } from "@aura/shared";

describe("AdminService (FEAT-083: RBAC Self-Protection Guards & Boundaries)", () => {
  let mockRepo: {
    findUserById: ReturnType<typeof vi.fn>;
    updateUserStatus: ReturnType<typeof vi.fn>;
    findRoleByName: ReturnType<typeof vi.fn>;
    setUserRole: ReturnType<typeof vi.fn>;
    findSimulationSessionById: ReturnType<typeof vi.fn>;
    cancelSimulationSession: ReturnType<typeof vi.fn>;
    getOperationalMetrics: ReturnType<typeof vi.fn>;
    listUsers: ReturnType<typeof vi.fn>;
  };
  let adminService: AdminService;

  beforeEach(() => {
    mockRepo = {
      findUserById: vi.fn(),
      updateUserStatus: vi.fn(),
      findRoleByName: vi.fn(),
      setUserRole: vi.fn(),
      findSimulationSessionById: vi.fn(),
      cancelSimulationSession: vi.fn(),
      getOperationalMetrics: vi.fn(),
      listUsers: vi.fn(),
    };
    adminService = new AdminService(mockRepo as unknown as IAdminRepository);
  });

  describe("updateUserStatus - Self-Protection Guard", () => {
    it("CRUCIAL: throws CANNOT_SUSPEND_SELF when administrator tries to suspend their own account", async () => {
      const actorId = "admin-123";
      const targetUserId = "admin-123";

      await expect(
        adminService.updateUserStatus(actorId, targetUserId, "SUSPENDED", "Test reason"),
      ).rejects.toThrow(AppError);

      try {
        await adminService.updateUserStatus(actorId, targetUserId, "SUSPENDED");
      } catch (err: unknown) {
        expect((err as AppError).code).toBe("CANNOT_SUSPEND_SELF");
        expect((err as AppError).statusCode).toBe(HTTP_STATUS.BAD_REQUEST);
        expect((err as AppError).message).toContain("cannot suspend their own account");
      }

      expect(mockRepo.updateUserStatus).not.toHaveBeenCalled();
    });

    it("allows administrator to suspend a different user account", async () => {
      const actorId = "admin-123";
      const targetUserId = "learner-456";

      mockRepo.findUserById.mockResolvedValue({
        id: targetUserId,
        email: "learner@example.com",
        displayName: "Learner One",
        status: "ACTIVE",
        role: "LEARNER",
        createdAt: new Date("2026-01-01"),
        updatedAt: new Date("2026-01-01"),
      } as AdminUserRecord);

      mockRepo.updateUserStatus.mockResolvedValue({
        id: targetUserId,
        email: "learner@example.com",
        displayName: "Learner One",
        status: "SUSPENDED",
        role: "LEARNER",
        createdAt: new Date("2026-01-01"),
        updatedAt: new Date("2026-01-01"),
      } as AdminUserRecord);

      const result = await adminService.updateUserStatus(actorId, targetUserId, "SUSPENDED", "Misconduct");

      expect(result.success).toBe(true);
      expect(result.user.status).toBe("SUSPENDED");
      expect(mockRepo.updateUserStatus).toHaveBeenCalledWith(targetUserId, "SUSPENDED");
    });

    it("allows administrator to reactivate a user account", async () => {
      const actorId = "admin-123";
      const targetUserId = "learner-456";

      mockRepo.findUserById.mockResolvedValue({
        id: targetUserId,
        email: "learner@example.com",
        displayName: "Learner One",
        status: "SUSPENDED",
        role: "LEARNER",
        createdAt: new Date("2026-01-01"),
        updatedAt: new Date("2026-01-01"),
      } as AdminUserRecord);

      mockRepo.updateUserStatus.mockResolvedValue({
        id: targetUserId,
        email: "learner@example.com",
        displayName: "Learner One",
        status: "ACTIVE",
        role: "LEARNER",
        createdAt: new Date("2026-01-01"),
        updatedAt: new Date("2026-01-01"),
      } as AdminUserRecord);

      const result = await adminService.updateUserStatus(actorId, targetUserId, "ACTIVE");

      expect(result.success).toBe(true);
      expect(result.user.status).toBe("ACTIVE");
    });
  });

  describe("updateUserRole - Self-Demotion Guard", () => {
    it("CRUCIAL: throws CANNOT_DEMOTE_SELF when administrator tries to remove their own ADMIN role", async () => {
      const actorId = "admin-123";
      const targetUserId = "admin-123";

      await expect(
        adminService.updateUserRole(actorId, targetUserId, "LEARNER"),
      ).rejects.toThrow(AppError);

      try {
        await adminService.updateUserRole(actorId, targetUserId, "LEARNER");
      } catch (err: unknown) {
        expect((err as AppError).code).toBe("CANNOT_DEMOTE_SELF");
        expect((err as AppError).statusCode).toBe(HTTP_STATUS.BAD_REQUEST);
        expect((err as AppError).message).toContain("cannot revoke their own administrator role");
      }
    });

    it("allows administrator to promote a learner to ADMIN", async () => {
      const actorId = "admin-123";
      const targetUserId = "learner-456";

      mockRepo.findUserById.mockResolvedValue({
        id: targetUserId,
        email: "learner@example.com",
        displayName: "Learner One",
        status: "ACTIVE",
        role: "LEARNER",
        createdAt: new Date(),
        updatedAt: new Date(),
      } as AdminUserRecord);
      mockRepo.findRoleByName.mockResolvedValue({ id: "role-admin-id", name: "ADMIN" });

      const result = await adminService.updateUserRole(actorId, targetUserId, "ADMIN");

      expect(result.success).toBe(true);
      expect(result.role).toBe("ADMIN");
      expect(mockRepo.setUserRole).toHaveBeenCalledWith(targetUserId, "role-admin-id");
    });
  });

  describe("resetSimulationSession", () => {
    it("resets a broken or stalled simulation session", async () => {
      const actorId = "admin-123";
      const sessionId = "session-broken-789";

      mockRepo.findSimulationSessionById.mockResolvedValue({
        id: sessionId,
        status: "ACTIVE",
      });

      mockRepo.cancelSimulationSession.mockResolvedValue({
        id: sessionId,
      });

      const result = await adminService.resetSimulationSession(actorId, sessionId);

      expect(result.success).toBe(true);
      expect(result.sessionId).toBe(sessionId);
      expect(mockRepo.cancelSimulationSession).toHaveBeenCalledWith(sessionId);
    });
  });

  describe("getSystemMetrics and listUsers", () => {
    it("returns operational metrics from repository", async () => {
      mockRepo.getOperationalMetrics.mockResolvedValue({
        totalUsers: 1500,
        activeSimulationSessions: 50,
      });

      const res = await adminService.getSystemMetrics();
      expect(res.data.totalUsers).toBe(1500);
      expect(res.data.activeSimulationSessions).toBe(50);
      expect(res.data.systemHealth).toBe("HEALTHY");
    });

    it("returns users list from repository", async () => {
      mockRepo.listUsers.mockResolvedValue({
        users: [
          {
            id: "u-1",
            email: "test@aura.test",
            displayName: "Test User",
            status: "ACTIVE",
            role: "ADMIN",
            createdAt: new Date("2026-01-01"),
            updatedAt: new Date("2026-01-02"),
          },
        ],
        total: 1,
      });

      const res = await adminService.listUsers({ page: 1, limit: 10 });
      expect(res.data.length).toBe(1);
      expect(res.data[0].role).toBe("ADMIN");
      expect(res.total).toBe(1);
    });
  });
});
