import type { RequestHandler } from "express";
import { requireRole } from "../auth/authorization.middleware.js";
import { ROLES } from "../auth/authorization.constants.js";
import type { IAuthorizationService } from "../auth/authorization.service.js";

export interface RequireAdminOptions {
  service?: IAuthorizationService;
  auditDenied?: boolean;
}

/**
 * Canonical reusable admin authorization guard.
 * Implemented as a thin semantic wrapper delegating directly to FEAT-007 requireRole(ROLES.ADMIN).
 * Does NOT duplicate role lookup, query Prisma directly, or redefine role constants.
 */
export function requireAdmin(options?: RequireAdminOptions | IAuthorizationService): RequestHandler {
  if (options && "hasRole" in options) {
    return requireRole(ROLES.ADMIN, { service: options, auditDenied: false });
  }
  return requireRole(ROLES.ADMIN, {
    service: options?.service,
    auditDenied: options?.auditDenied ?? false,
  });
}
