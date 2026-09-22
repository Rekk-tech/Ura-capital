import type { AuthenticatedRequest } from "../auth/auth.types.js";
import type { EntitlementKey } from "./plan-catalog.types.js";

export const ENTITLEMENT_DECISION_OUTCOMES = ["ALLOW", "DENY", "ERROR"] as const;
export type EntitlementDecisionOutcome = (typeof ENTITLEMENT_DECISION_OUTCOMES)[number];

export const ENTITLEMENT_DECISION_REASONS = [
  "ENTITLEMENT_PRESENT",
  "ENTITLEMENT_MISSING",
  "INVALID_KEY",
  "RESOLUTION_FAILED",
  "INVALID_CONTEXT",
] as const;
export type EntitlementDecisionReason = (typeof ENTITLEMENT_DECISION_REASONS)[number];

export interface TrustedEntitlementAuthorizationContext {
  readonly userId: string;
  readonly entitlementKey: EntitlementKey;
  readonly evaluatedAt: string;
}

export interface EntitlementAuthorizedRequest extends AuthenticatedRequest {
  entitlement?: TrustedEntitlementAuthorizationContext;
}

export interface EntitlementDecisionEvent {
  readonly entitlementKey: string;
  readonly outcome: EntitlementDecisionOutcome;
  readonly reason: EntitlementDecisionReason;
  readonly requestId?: string;
}

export interface IEntitlementDecisionObserver {
  observe(event: EntitlementDecisionEvent): void | Promise<void>;
}
