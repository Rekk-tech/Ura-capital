import { describe, it, expect, vi, beforeEach } from "vitest";
import { AdminService } from "../../src/modules/admin/admin.service.js";
import { AppError } from "../../src/shared/errors/error-envelope.js";
import { HTTP_STATUS } from "@aura/shared";

interface MockPrisma {
  user: {
    findUnique: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };
  role: {
    findUnique: ReturnType<typeof vi.fn>;
  };
  userRole: {
    deleteMany: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
  };
  simulationSession: {
    findUnique: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };
  $transaction: ReturnType<typeof vi.fn>;
}

describe("AdminService (FEAT-083: RBAC Self-Protection Guards)", () => {
  let mockPrisma: MockPrisma;
  let adminService: AdminService;

  beforeEach(() => {
    mockPrisma = {
      user: {
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      role: {
        findUnique: vi.fn(),
      },
      userRole: {
        deleteMany: vi.fn(),
        create: vi.fn(),
      },
      simulationSession: {
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      $transaction: vi.fn(async (cb) => cb(mockPrisma)),
    };
    adminService = new AdminService(mockPrisma as unknown as ConstructorParameters<typeof AdminService>[0]);
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

      expect(mockPrisma.user.update).not.toHaveBeenCalled();
    });

    it("allows administrator to suspend a different user account", async () => {
      const actorId = "admin-123";
      const targetUserId = "learner-456";

      mockPrisma.user.findUnique.mockResolvedValue({
        id: targetUserId,
        email: "learner@example.com",
        displayName: "Learner One",
        status: "ACTIVE",
      });

      mockPrisma.user.update.mockResolvedValue({
        id: targetUserId,
        email: "learner@example.com",
        displayName: "Learner One",
        status: "SUSPENDED",
        createdAt: new Date("2026-01-01"),
      });

      const result = await adminService.updateUserStatus(actorId, targetUserId, "SUSPENDED", "Misconduct");

      expect(result.success).toBe(true);
      expect(result.user.status).toBe("SUSPENDED");
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: targetUserId },
        data: { status: "SUSPENDED" },
      });
    });

    it("allows administrator to reactivate a user account", async () => {
      const actorId = "admin-123";
      const targetUserId = "learner-456";

      mockPrisma.user.findUnique.mockResolvedValue({
        id: targetUserId,
        email: "learner@example.com",
        displayName: "Learner One",
        status: "SUSPENDED",
      });

      mockPrisma.user.update.mockResolvedValue({
        id: targetUserId,
        email: "learner@example.com",
        displayName: "Learner One",
        status: "ACTIVE",
        createdAt: new Date("2026-01-01"),
      });

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

      mockPrisma.user.findUnique.mockResolvedValue({ id: targetUserId });
      mockPrisma.role.findUnique.mockResolvedValue({ id: "role-admin-id", name: "ADMIN" });

      const result = await adminService.updateUserRole(actorId, targetUserId, "ADMIN");

      expect(result.success).toBe(true);
      expect(result.role).toBe("ADMIN");
      expect(mockPrisma.userRole.create).toHaveBeenCalledWith({
        data: {
          userId: targetUserId,
          roleId: "role-admin-id",
        },
      });
    });
  });

  describe("resetSimulationSession", () => {
    it("resets a broken or stalled simulation session", async () => {
      const actorId = "admin-123";
      const sessionId = "session-broken-789";

      mockPrisma.simulationSession.findUnique.mockResolvedValue({
        id: sessionId,
        status: "ACTIVE",
      });

      mockPrisma.simulationSession.update.mockResolvedValue({
        id: sessionId,
        status: "CANCELLED",
      });

      const result = await adminService.resetSimulationSession(actorId, sessionId);

      expect(result.success).toBe(true);
      expect(result.sessionId).toBe(sessionId);
      expect(mockPrisma.simulationSession.update).toHaveBeenCalledWith({
        where: { id: sessionId },
        data: expect.objectContaining({ status: "CANCELLED" }),
      });
    });
  });
});
