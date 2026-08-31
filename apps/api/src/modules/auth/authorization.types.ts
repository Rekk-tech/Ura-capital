import type { Request } from "express";
import type { AuthenticatedUser } from "./auth.types.js";
import type { RoleCode } from "./authorization.constants.js";

/**
 * Trusted server-side authorization context.
 * Derived strictly from authenticated user identity plus PostgreSQL role lookup.
 * Excludes any password, credentials, raw token, secret, or DB internals.
 */
export interface AuthorizationContext {
  user: AuthenticatedUser;
  roles: RoleCode[];
}

/**
 * Express Request decorated with optional authenticated user context and trusted authorization context.
 */
export interface AuthorizedRequest extends Request {
  user?: AuthenticatedUser;
  auth?: AuthorizationContext;
}
