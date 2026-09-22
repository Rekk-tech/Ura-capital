import {
  SUBSCRIPTION_PLANS,
  type SubscriptionPlan,
} from "./subscription.types.js";
import {
  CANONICAL_ENTITLEMENT_KEYS,
  type EntitlementKey,
  type PlanCatalogItem,
  type PublicPlanInfo,
} from "./plan-catalog.types.js";

// ============================================================================
// Server-Owned Plan Catalog (Configuration-Backed, D2 Locked)
// ============================================================================

export const SERVER_PLAN_CATALOG: Readonly<Record<SubscriptionPlan, PlanCatalogItem>> = Object.freeze({
  FREE: Object.freeze({
    planKey: "FREE",
    name: "Free Plan",
    description: "Standard access to foundational platform capabilities.",
    entitlements: Object.freeze([]) as readonly EntitlementKey[],
  }),
  PREMIUM: Object.freeze({
    planKey: "PREMIUM",
    name: "Premium Plan",
    description: "Full access to advanced platform capabilities and features.",
    entitlements: Object.freeze(["PREMIUM_ACCESS"]) as readonly EntitlementKey[],
  }),
});

/**
 * Validates plan catalog structure at startup.
 * Enforces FR-001, FR-002, FR-003, AC-001, AC-002, AC-003.
 * Throws Error on any schema or taxonomy violation.
 */
export function validatePlanCatalog(
  catalog: Record<string, PlanCatalogItem> = SERVER_PLAN_CATALOG,
): void {
  const catalogKeys = Object.keys(catalog);

  // Must contain only approved plans
  if (catalogKeys.length !== SUBSCRIPTION_PLANS.length) {
    throw new Error(
      `Plan catalog size mismatch: expected ${SUBSCRIPTION_PLANS.length} plans, received ${catalogKeys.length}`,
    );
  }

  for (const approvedPlan of SUBSCRIPTION_PLANS) {
    const item = catalog[approvedPlan];
    if (!item) {
      throw new Error(`Plan catalog missing required plan: ${approvedPlan}`);
    }

    if (item.planKey !== approvedPlan) {
      throw new Error(
        `Plan catalog planKey mismatch: expected ${approvedPlan}, got ${item.planKey}`,
      );
    }

    if (!item.name || typeof item.name !== "string") {
      throw new Error(`Plan catalog item ${approvedPlan} missing valid name`);
    }

    if (!item.description || typeof item.description !== "string") {
      throw new Error(`Plan catalog item ${approvedPlan} missing valid description`);
    }

    if (!Array.isArray(item.entitlements)) {
      throw new Error(`Plan catalog item ${approvedPlan} entitlements must be an array`);
    }

    for (const ent of item.entitlements) {
      if (!CANONICAL_ENTITLEMENT_KEYS.includes(ent)) {
        throw new Error(
          `Plan catalog item ${approvedPlan} contains unapproved entitlement key: ${ent}`,
        );
      }
    }

    // Specific D2 invariant checks
    if (approvedPlan === "FREE" && item.entitlements.length !== 0) {
      throw new Error("FREE plan must have exactly zero entitlements");
    }

    if (
      approvedPlan === "PREMIUM" &&
      (item.entitlements.length !== 1 || item.entitlements[0] !== "PREMIUM_ACCESS")
    ) {
      throw new Error("PREMIUM plan must have exactly ['PREMIUM_ACCESS'] entitlement");
    }
  }

  // Ensure no foreign keys exist in the object
  for (const key of catalogKeys) {
    if (!SUBSCRIPTION_PLANS.includes(key as SubscriptionPlan)) {
      throw new Error(`Plan catalog contains unauthorized plan key: ${key}`);
    }
  }
}

// Startup self-validation on module load
validatePlanCatalog(SERVER_PLAN_CATALOG);

/**
 * Returns safe public plan projections.
 * Strictly guarantees AC-004: provider price IDs, secrets, and internal mappings are never present.
 */
export function getPublicPlans(): PublicPlanInfo[] {
  return SUBSCRIPTION_PLANS.map((planKey) => {
    const item = SERVER_PLAN_CATALOG[planKey];
    return {
      planKey: item.planKey,
      name: item.name,
      description: item.description,
      entitlements: item.entitlements,
    };
  });
}

/**
 * Retrieves a plan catalog item by planKey.
 * Returns null if the planKey is unknown.
 */
export function getPlan(planKey: string): PlanCatalogItem | null {
  if (planKey in SERVER_PLAN_CATALOG) {
    return SERVER_PLAN_CATALOG[planKey as SubscriptionPlan];
  }
  return null;
}

/**
 * Resolves mapped entitlements for an approved plan key.
 * Returns empty array if plan has no entitlements or is unknown.
 */
export function getEntitlementsForPlan(planKey: string): readonly EntitlementKey[] {
  const plan = getPlan(planKey);
  return plan ? plan.entitlements : [];
}
