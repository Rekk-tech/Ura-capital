import type { SubscriptionPlan } from "./subscription.types.js";

// ============================================================================
// Phase 7 — Plan Catalog & Canonical Entitlement Types (D2 Locked)
// ============================================================================

export type EntitlementKey = "PREMIUM_ACCESS";

export const CANONICAL_ENTITLEMENT_KEYS: readonly EntitlementKey[] = Object.freeze([
  "PREMIUM_ACCESS",
]);

export interface PlanCatalogItem {
  readonly planKey: SubscriptionPlan;
  readonly name: string;
  readonly description: string;
  readonly entitlements: readonly EntitlementKey[];
}

export interface PublicPlanInfo {
  readonly planKey: SubscriptionPlan;
  readonly name: string;
  readonly description: string;
  readonly entitlements: readonly EntitlementKey[];
}

export interface InternalProviderPriceMapping {
  readonly providerKey: string;
  readonly externalPriceId: string;
  readonly currency: string;
  readonly interval: "month" | "year";
}
