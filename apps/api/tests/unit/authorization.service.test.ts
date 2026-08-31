import { describe, it, expect, vi } from "vitest";
import { AuthorizationService } from "../../src/modules/auth/authorization.service.js";
import type { IRoleRepository } from "../../src/modules/auth/role.repository.js";
import { ROLES } from "../../src/modules/auth/authorization.constants.js";
import type { AuthenticatedUser } from "../../src/modules/auth/auth.types.js";

describe("AuthorizationService (Unit)", () => {
  const sampleUser: AuthenticatedUser = {
    id: "user-uuid-12345",
    email: "test.rbac@auracapital.local",
    displayName: "RBAC Test User",
    status: "ACTIVE",
    createdAt: new Date().toISOString(),
  };

  it("loads canonical roles and returns unique, lexical ascending list (e.g. ['ADMIN', 'USER'])", async () => {
    const mockRoleRepo: IRoleRepository = {
      findByName: vi.fn(),
      createRole: vi.fn(),
      ensureRoleExists: vi.fn(),
      assignRoleToUser: vi.fn(),
      getUserRoles: vi.fn(),
      getUserRoleCodes: vi.fn().mockResolvedValue(["USER", "ADMIN", "USER"]), // Duplicate returned
      removeRoleFromUser: vi.fn(),
      countRoles: vi.fn(),
      countUserRoles: vi.fn(),
    };

    const service = new AuthorizationService(mockRoleRepo);
    const roles = await service.getUserRoles(sampleUser.id);

    expect(roles).toEqual(["ADMIN", "USER"]);
    expect(mockRoleRepo.getUserRoleCodes).toHaveBeenCalledWith(sampleUser.id);
  });

  it("filters out unknown or malformed persisted role codes (e.g. SUPER_ADMIN, ROOT, arbitrary string)", async () => {
    const mockRoleRepo: IRoleRepository = {
      findByName: vi.fn(),
      createRole: vi.fn(),
      ensureRoleExists: vi.fn(),
      assignRoleToUser: vi.fn(),
      getUserRoles: vi.fn(),
      getUserRoleCodes: vi.fn().mockResolvedValue(["SUPER_ADMIN", "ROOT", "ADMIN", "INVALID_ROLE"]),
      removeRoleFromUser: vi.fn(),
      countRoles: vi.fn(),
      countUserRoles: vi.fn(),
    };

    const service = new AuthorizationService(mockRoleRepo);
    const roles = await service.getUserRoles(sampleUser.id);

    expect(roles).toEqual(["ADMIN"]); // Only valid canonical role kept
  });

  it("returns empty role array for zero-role user without failing", async () => {
    const mockRoleRepo: IRoleRepository = {
      findByName: vi.fn(),
      createRole: vi.fn(),
      ensureRoleExists: vi.fn(),
      assignRoleToUser: vi.fn(),
      getUserRoles: vi.fn(),
      getUserRoleCodes: vi.fn().mockResolvedValue([]),
      removeRoleFromUser: vi.fn(),
      countRoles: vi.fn(),
      countUserRoles: vi.fn(),
    };

    const service = new AuthorizationService(mockRoleRepo);
    const roles = await service.getUserRoles(sampleUser.id);

    expect(roles).toEqual([]);
  });

  it("builds trusted authorization context combining authenticated user with server-derived roles", async () => {
    const mockRoleRepo: IRoleRepository = {
      findByName: vi.fn(),
      createRole: vi.fn(),
      ensureRoleExists: vi.fn(),
      assignRoleToUser: vi.fn(),
      getUserRoles: vi.fn(),
      getUserRoleCodes: vi.fn().mockResolvedValue(["USER"]),
      removeRoleFromUser: vi.fn(),
      countRoles: vi.fn(),
      countUserRoles: vi.fn(),
    };

    const service = new AuthorizationService(mockRoleRepo);
    const context = await service.buildAuthorizationContext(sampleUser);

    expect(context.user).toEqual(sampleUser);
    expect(context.roles).toEqual(["USER"]);
  });

  it("correctly evaluates hasRole policy", () => {
    const service = new AuthorizationService();

    const userContext = { user: sampleUser, roles: [ROLES.USER] };
    const adminContext = { user: sampleUser, roles: [ROLES.ADMIN] };
    const zeroRoleContext = { user: sampleUser, roles: [] };

    expect(service.hasRole(userContext, ROLES.USER)).toBe(true);
    expect(service.hasRole(userContext, ROLES.ADMIN)).toBe(false);

    expect(service.hasRole(adminContext, ROLES.ADMIN)).toBe(true);
    expect(service.hasRole(adminContext, ROLES.USER)).toBe(false);

    expect(service.hasRole(zeroRoleContext, ROLES.USER)).toBe(false);
    expect(service.hasRole(zeroRoleContext, ROLES.ADMIN)).toBe(false);
  });

  it("correctly evaluates hasAnyRole policy for single and multi-role contexts", () => {
    const service = new AuthorizationService();

    const multiRoleContext = { user: sampleUser, roles: [ROLES.ADMIN, ROLES.USER] };
    const userOnlyContext = { user: sampleUser, roles: [ROLES.USER] };
    const zeroRoleContext = { user: sampleUser, roles: [] };

    expect(service.hasAnyRole(multiRoleContext, [ROLES.ADMIN, ROLES.USER])).toBe(true);
    expect(service.hasAnyRole(multiRoleContext, [ROLES.ADMIN])).toBe(true);
    expect(service.hasAnyRole(userOnlyContext, [ROLES.ADMIN, ROLES.USER])).toBe(true);
    expect(service.hasAnyRole(userOnlyContext, [ROLES.ADMIN])).toBe(false);
    expect(service.hasAnyRole(zeroRoleContext, [ROLES.USER])).toBe(false);
  });
});
