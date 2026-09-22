import type { SubscriptionPlan } from "./subscription.types.js";
import type { EntitlementKey } from "./plan-catalog.types.js";

// ============================================================================
// Pure Non-Prisma Domain Types for Entitlement Resolution (FR-011, AC-005)
// ============================================================================

/**
 * Pluggable server-controlled clock abstraction for deterministic time testing.
 */
export interface Clock {
  now(): Date;
}

export const systemClock: Clock = Object.freeze({
  now: () => new Date(),
});

/**
 * Effective domain status resolved at evaluation time.
 * "NONE" indicates the user has no subscription record in PostgreSQL.
 */
export type EffectiveSubscriptionStatus =
  | "ACTIVE"
  | "PAST_DUE"
  | "CANCELLED"
  | "EXPIRED"
  | "NONE";

/**
 * Safe immutable entitlement context returned by the entitlement resolver.
 * Free from any Prisma types, raw secrets, or provider identifiers.
 */
export interface EntitlementContext {
  readonly userId: string;
  readonly planKey: SubscriptionPlan;
  readonly status: EffectiveSubscriptionStatus;
  readonly entitlements: readonly EntitlementKey[];
  readonly isEntitled: boolean;
  readonly currentPeriodStart: Date | null;
  readonly currentPeriodEnd: Date | null;
  readonly cancelAtPeriodEnd: boolean;
  readonly evaluatedAt: Date;
}

/**
 * Reusable entitlement resolver contract.
 * Does not expose or require Prisma or database connection directly.
 */
export interface IEntitlementResolver {
  resolveUserEntitlement(userId: string): Promise<EntitlementContext>;
}
