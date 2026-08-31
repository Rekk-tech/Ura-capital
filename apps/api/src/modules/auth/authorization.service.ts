import type { AuthenticatedUser } from "./auth.types.js";
import { type RoleCode, isRoleCode } from "./authorization.constants.js";
import type { AuthorizationContext } from "./authorization.types.js";
import { type IRoleRepository, roleRepository } from "./role.repository.js";

export interface IAuthorizationService {
  getUserRoles(userId: string): Promise<RoleCode[]>;
  buildAuthorizationContext(user: AuthenticatedUser): Promise<AuthorizationContext>;
  hasRole(context: AuthorizationContext, requiredRole: RoleCode): boolean;
  hasAnyRole(context: AuthorizationContext, requiredRoles: RoleCode[]): boolean;
}

export class AuthorizationService implements IAuthorizationService {
  constructor(private readonly roleRepo: IRoleRepository = roleRepository) {}

  /**
   * Loads and runtime-validates canonical roles assigned to the given user in PostgreSQL.
   * Returns a unique, deterministic list sorted in lexical ascending order (e.g., ["ADMIN", "USER"]).
   * Unknown or malformed database strings are safely filtered out.
   */
  async getUserRoles(userId: string): Promise<RoleCode[]> {
    if (!userId || typeof userId !== "string") {
      return [];
    }

    const rawRoleNames = await this.roleRepo.getUserRoleCodes(userId);
    const validRoles = new Set<RoleCode>();

    for (const rawName of rawRoleNames) {
      if (isRoleCode(rawName)) {
        validRoles.add(rawName);
      }
    }

    return Array.from(validRoles).sort((a, b) => a.localeCompare(b));
  }

  /**
   * Builds the trusted server-side authorization context combining authenticated user identity
   * with server-derived canonical role assignments.
   */
  async buildAuthorizationContext(user: AuthenticatedUser): Promise<AuthorizationContext> {
    const roles = await this.getUserRoles(user.id);
    return {
      user,
      roles,
    };
  }

  /**
   * Checks if the authorization context contains the specified canonical role.
   */
  hasRole(context: AuthorizationContext, requiredRole: RoleCode): boolean {
    if (!context || !Array.isArray(context.roles) || !isRoleCode(requiredRole)) {
      return false;
    }
    return context.roles.includes(requiredRole);
  }

  /**
   * Checks if the authorization context contains any of the specified canonical roles.
   */
  hasAnyRole(context: AuthorizationContext, requiredRoles: RoleCode[]): boolean {
    if (!context || !Array.isArray(context.roles) || !Array.isArray(requiredRoles) || requiredRoles.length === 0) {
      return false;
    }
    return requiredRoles.some((reqRole) => isRoleCode(reqRole) && context.roles.includes(reqRole));
  }
}

export const authorizationService: IAuthorizationService = new AuthorizationService();
