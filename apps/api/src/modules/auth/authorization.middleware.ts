import type { Response, NextFunction } from "express";
import type { RoleCode } from "./authorization.constants.js";
import type { AuthorizedRequest } from "./authorization.types.js";
import { type IAuthorizationService, authorizationService } from "./authorization.service.js";
import { type AuditService, auditService as defaultAuditService } from "./audit.service.js";
import { AppError } from "../../shared/errors/error-envelope.js";
import { ERROR_CODES, HTTP_STATUS } from "@aura/shared";

export interface RequireRoleOptions {
  service?: IAuthorizationService;
  auditSvc?: AuditService;
  auditDenied?: boolean;
}

/**
 * Reusable generic RBAC middleware enforcing that the authenticated user possesses the required canonical role.
 * Fails closed on missing authentication (401), missing role (403), or infrastructure errors (500).
 * By default, authorization denials are NOT durably audited to avoid unbounded audit volume.
 * Durable AUTHORIZATION_DENIED audit events are emitted only when explicitly opted in (e.g. GET /admin/ping).
 */
export function requireRole(
  requiredRole: RoleCode,
  serviceOrOptions?: IAuthorizationService | RequireRoleOptions,
  legacyAuditSvc?: AuditService,
) {
  let service: IAuthorizationService = authorizationService;
  let auditSvc: AuditService = defaultAuditService;
  let auditDenied = false;

  if (serviceOrOptions && "hasRole" in serviceOrOptions) {
    service = serviceOrOptions;
    if (legacyAuditSvc) {
      auditSvc = legacyAuditSvc;
    }
  } else if (serviceOrOptions && typeof serviceOrOptions === "object") {
    if (serviceOrOptions.service) service = serviceOrOptions.service;
    if (serviceOrOptions.auditSvc) auditSvc = serviceOrOptions.auditSvc;
    if (serviceOrOptions.auditDenied !== undefined) auditDenied = serviceOrOptions.auditDenied;
  }

  return async (req: AuthorizedRequest, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AppError(
          "Authentication required",
          ERROR_CODES.UNAUTHENTICATED,
          HTTP_STATUS.UNAUTHORIZED,
        );
      }

      // 1. Build server-side authorization context (fetches roles from PostgreSQL)
      const authContext = await service.buildAuthorizationContext(req.user);
      req.auth = authContext;

      // 2. Evaluate required role membership
      if (!service.hasRole(authContext, requiredRole)) {
        // Emit AUTHORIZATION_DENIED ONLY when explicitly opted in (e.g. approved /admin/ping boundary)
        if (auditDenied) {
          const route = req.baseUrl ? `${req.baseUrl}${req.path}` : req.path || "/admin/ping";
          await auditSvc.recordAuthorizationDenied({
            userId: req.user.id,
            route,
            requiredRole,
            requestId: req.id,
            userAgent: req.headers ? (req.headers["user-agent"] as string) : undefined,
          });
        }

        throw new AppError(
          "Insufficient permissions",
          ERROR_CODES.FORBIDDEN,
          HTTP_STATUS.FORBIDDEN,
        );
      }

      next();
    } catch (err: unknown) {
      next(err);
    }
  };
}

/**
 * Reusable generic RBAC middleware enforcing that the authenticated user possesses at least one of the specified canonical roles.
 */
export function requireAnyRole(
  requiredRoles: RoleCode[],
  service: IAuthorizationService = authorizationService,
) {
  return async (req: AuthorizedRequest, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AppError(
          "Authentication required",
          ERROR_CODES.UNAUTHENTICATED,
          HTTP_STATUS.UNAUTHORIZED,
        );
      }

      // 1. Build server-side authorization context
      const authContext = await service.buildAuthorizationContext(req.user);
      req.auth = authContext;

      // 2. Evaluate any-role membership
      if (!service.hasAnyRole(authContext, requiredRoles)) {
        throw new AppError(
          "Insufficient permissions",
          ERROR_CODES.FORBIDDEN,
          HTTP_STATUS.FORBIDDEN,
        );
      }

      next();
    } catch (err: unknown) {
      next(err);
    }
  };
}
