import type { Request } from "express";
import type { SafeUser } from "@aura/shared";

export type AuthenticatedUser = SafeUser;

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}
