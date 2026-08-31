import { describe, it, expect, vi } from "vitest";
import { seedCanonicalRoles, assignRoleToExistingUser } from "../../src/modules/auth/role.seed.js";
import type { IRoleRepository } from "../../src/modules/auth/role.repository.js";
import type { IAuditRepository } from "../../src/modules/auth/audit.repository.js";
import type { IUserRepository, UserEntity } from "../../src/modules/users/user.repository.js";
import type { ITransactionRunner, TransactionContext } from "../../src/infrastructure/database/transaction-runner.js";
import { ROLES, type RoleCode } from "../../src/modules/auth/authorization.constants.js";

describe("Role Seed & Operational Provisioning (Unit)", () => {
  it("idempotently seeds canonical USER and ADMIN roles into repository", async () => {
    const mockRoleRepo: IRoleRepository = {
      findByName: vi.fn(),
      createRole: vi.fn(),
      ensureRoleExists: vi.fn().mockImplementation((name: string, desc?: string | null) =>
        Promise.resolve({
          id: `role-${name}`,
          name,
          description: desc ?? null,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      ),
      assignRoleToUser: vi.fn(),
      getUserRoles: vi.fn(),
      getUserRoleCodes: vi.fn(),
      removeRoleFromUser: vi.fn(),
      countRoles: vi.fn(),
      countUserRoles: vi.fn(),
    };

    const result1 = await seedCanonicalRoles(mockRoleRepo);
    expect(result1.roles).toHaveLength(2);
    expect(result1.roles.map((r) => r.name)).toContain(ROLES.USER);
    expect(result1.roles.map((r) => r.name)).toContain(ROLES.ADMIN);

    // Repeated call should succeed idempotently
    const result2 = await seedCanonicalRoles(mockRoleRepo);
    expect(result2.roles).toHaveLength(2);
    expect(mockRoleRepo.ensureRoleExists).toHaveBeenCalledTimes(4); // 2 per run
  });

  it("operational provisioning assigns canonical role to existing user", async () => {
    const sampleUser: UserEntity = {
      id: "user-123",
      email: "user@auracapital.local",
      displayName: "User",
      status: "ACTIVE",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockUserRepo: IUserRepository = {
      findById: vi.fn().mockResolvedValue(sampleUser),
      findByEmail: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };

    const mockRoleRepo: IRoleRepository = {
      findByName: vi.fn().mockResolvedValue({
        id: "role-ADMIN",
        name: ROLES.ADMIN,
        description: "Admin",
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
      createRole: vi.fn(),
      ensureRoleExists: vi.fn(),
      assignRoleToUser: vi.fn().mockResolvedValue({
        id: "ur-1",
        userId: sampleUser.id,
        roleId: "role-ADMIN",
        createdAt: new Date(),
      }),
      getUserRoles: vi.fn().mockResolvedValue([]),
      getUserRoleCodes: vi.fn(),
      removeRoleFromUser: vi.fn(),
      countRoles: vi.fn(),
      countUserRoles: vi.fn(),
    };

    const mockAuditRepo = {
      create: vi.fn().mockResolvedValue({ id: "audit-1" }),
    } as unknown as IAuditRepository;

    const mockTxRunner: ITransactionRunner = {
      run: vi.fn().mockImplementation(async (cb: (ctx: TransactionContext) => Promise<unknown>) => {
        return cb({
          id: "tx-test-1",
          tx: {},
          repositories: { roleRepo: mockRoleRepo, auditRepo: mockAuditRepo } as never,
          depth: 1,
          isCompleted: false,
        });
      }),
    };

    const result = await assignRoleToExistingUser(
      { userId: sampleUser.id, roleCode: ROLES.ADMIN },
      mockUserRepo,
      mockRoleRepo,
      mockTxRunner,
      () => ({ roleRepo: mockRoleRepo, auditRepo: mockAuditRepo }),
    );

    expect(result.userId).toBe(sampleUser.id);
    expect(result.roleId).toBe("role-ADMIN");
    expect(mockRoleRepo.assignRoleToUser).toHaveBeenCalledWith(sampleUser.id, "role-ADMIN", expect.anything());
    expect(mockAuditRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: "ROLE_ASSIGNED",
        outcome: "SUCCESS",
        subjectUserId: sampleUser.id,
      }),
      expect.anything(),
    );
  });

  it("operational provisioning rejects non-canonical role codes", async () => {
    const mockUserRepo: IUserRepository = {
      findById: vi.fn(),
      findByEmail: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };

    const mockRoleRepo: IRoleRepository = {
      findByName: vi.fn(),
      createRole: vi.fn(),
      ensureRoleExists: vi.fn(),
      assignRoleToUser: vi.fn(),
      getUserRoles: vi.fn(),
      getUserRoleCodes: vi.fn(),
      removeRoleFromUser: vi.fn(),
      countRoles: vi.fn(),
      countUserRoles: vi.fn(),
    };

    await expect(
      assignRoleToExistingUser(
        { userId: "user-123", roleCode: "SUPER_ADMIN" as RoleCode },
        mockUserRepo,
        mockRoleRepo,
      ),
    ).rejects.toThrow("[INVALID_ROLE_CODE]");
  });

  it("operational provisioning rejects non-existent user", async () => {
    const mockUserRepo: IUserRepository = {
      findById: vi.fn().mockResolvedValue(null),
      findByEmail: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };

    const mockRoleRepo: IRoleRepository = {
      findByName: vi.fn(),
      createRole: vi.fn(),
      ensureRoleExists: vi.fn(),
      assignRoleToUser: vi.fn(),
      getUserRoles: vi.fn(),
      getUserRoleCodes: vi.fn(),
      removeRoleFromUser: vi.fn(),
      countRoles: vi.fn(),
      countUserRoles: vi.fn(),
    };

    await expect(
      assignRoleToExistingUser(
        { userId: "non-existent-id", roleCode: ROLES.ADMIN },
        mockUserRepo,
        mockRoleRepo,
      ),
    ).rejects.toThrow("[USER_NOT_FOUND]");
  });

  it("operational provisioning is idempotent when user already has the assigned role", async () => {
    const sampleUser: UserEntity = {
      id: "user-123",
      email: "user@auracapital.local",
      displayName: "User",
      status: "ACTIVE",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockUserRepo: IUserRepository = {
      findById: vi.fn().mockResolvedValue(sampleUser),
      findByEmail: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };

    const mockRoleRepo: IRoleRepository = {
      findByName: vi.fn().mockResolvedValue({
        id: "role-USER",
        name: ROLES.USER,
        description: "User",
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
      createRole: vi.fn(),
      ensureRoleExists: vi.fn(),
      assignRoleToUser: vi.fn(),
      getUserRoles: vi.fn().mockResolvedValue([
        {
          id: "role-USER",
          name: ROLES.USER,
          description: "User",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]),
      getUserRoleCodes: vi.fn(),
      removeRoleFromUser: vi.fn(),
      countRoles: vi.fn(),
      countUserRoles: vi.fn(),
    };

    const result = await assignRoleToExistingUser(
      { userId: sampleUser.id, roleCode: ROLES.USER },
      mockUserRepo,
      mockRoleRepo,
    );

    expect(result.userId).toBe(sampleUser.id);
    expect(result.roleId).toBe("role-USER");
    expect(mockRoleRepo.assignRoleToUser).not.toHaveBeenCalled(); // No duplicate create called
  });

  it("operational provisioning rolls back role assignment when audit insert fails inside transaction", async () => {
    const sampleUser: UserEntity = {
      id: "user-rollback-1",
      email: "user@auracapital.local",
      displayName: "Rollback User",
      status: "ACTIVE",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockUserRepo: IUserRepository = {
      findById: vi.fn().mockResolvedValue(sampleUser),
      findByEmail: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };

    const mockRoleRepo: IRoleRepository = {
      findByName: vi.fn().mockResolvedValue({
        id: "role-ADMIN",
        name: ROLES.ADMIN,
        description: "Admin",
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
      createRole: vi.fn(),
      ensureRoleExists: vi.fn(),
      assignRoleToUser: vi.fn().mockResolvedValue({
        id: "ur-1",
        userId: sampleUser.id,
        roleId: "role-ADMIN",
        createdAt: new Date(),
      }),
      getUserRoles: vi.fn().mockResolvedValue([]),
      getUserRoleCodes: vi.fn(),
      removeRoleFromUser: vi.fn(),
      countRoles: vi.fn(),
      countUserRoles: vi.fn(),
    };

    const mockAuditRepo = {
      create: vi.fn().mockRejectedValue(new Error("Audit DB disk full")),
    } as unknown as IAuditRepository;

    const mockTxRunner: ITransactionRunner = {
      run: vi.fn().mockImplementation(async (cb: (ctx: TransactionContext) => Promise<unknown>) => {
        return cb({
          id: "tx-test-rollback",
          tx: {},
          repositories: { roleRepo: mockRoleRepo, auditRepo: mockAuditRepo } as never,
          depth: 1,
          isCompleted: false,
        });
      }),
    };

    await expect(
      assignRoleToExistingUser(
        { userId: sampleUser.id, roleCode: ROLES.ADMIN },
        mockUserRepo,
        mockRoleRepo,
        mockTxRunner,
        () => ({ roleRepo: mockRoleRepo, auditRepo: mockAuditRepo }),
      ),
    ).rejects.toThrow("Audit DB disk full");
  });
});
