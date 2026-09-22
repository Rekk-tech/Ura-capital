import { describe, it, expect } from "vitest";
import {
  SERVER_PLAN_CATALOG,
  validatePlanCatalog,
  getPublicPlans,
  getPlan,
  getEntitlementsForPlan,
} from "../../src/modules/subscription/plan-catalog.js";
import {
  CANONICAL_ENTITLEMENT_KEYS,
  type PlanCatalogItem,
} from "../../src/modules/subscription/plan-catalog.types.js";
import { SUBSCRIPTION_PLANS } from "../../src/modules/subscription/subscription.types.js";

describe("FEAT-049 Server Plan Catalog & Entitlement Mapping Unit Tests", () => {
  it("AC-001/AC-002: canonical plan constants contain exactly FREE and PREMIUM", () => {
    expect(SUBSCRIPTION_PLANS).toEqual(["FREE", "PREMIUM"]);
    expect(Object.isFrozen(SUBSCRIPTION_PLANS)).toBe(true);
  });

  it("AC-001/AC-002: canonical entitlement keys contain exactly PREMIUM_ACCESS", () => {
    expect(CANONICAL_ENTITLEMENT_KEYS).toEqual(["PREMIUM_ACCESS"]);
    expect(Object.isFrozen(CANONICAL_ENTITLEMENT_KEYS)).toBe(true);
  });

  it("AC-003: default SERVER_PLAN_CATALOG passes startup validation", () => {
    expect(() => validatePlanCatalog(SERVER_PLAN_CATALOG)).not.toThrow();
  });

  it("AC-003: fails validation if required plan is missing", () => {
    const invalidCatalog = {
      FREE: SERVER_PLAN_CATALOG.FREE,
    } as unknown as Record<string, PlanCatalogItem>;

    expect(() => validatePlanCatalog(invalidCatalog)).toThrow(/Plan catalog size mismatch/);
  });

  it("AC-003: fails validation if unauthorized extra plan is present", () => {
    const invalidCatalog = {
      ...SERVER_PLAN_CATALOG,
      PRO: {
        planKey: "PRO",
        name: "Pro Plan",
        description: "Unauthorized tier",
        entitlements: ["PREMIUM_ACCESS"],
      },
    } as unknown as Record<string, PlanCatalogItem>;

    expect(() => validatePlanCatalog(invalidCatalog)).toThrow(/Plan catalog size mismatch/);
  });

  it("AC-002: fails validation if plan contains unapproved entitlement key", () => {
    const invalidCatalog = {
      FREE: SERVER_PLAN_CATALOG.FREE,
      PREMIUM: {
        planKey: "PREMIUM",
        name: "Premium",
        description: "Premium",
        entitlements: ["PREMIUM_ACCESS", "UNAPPROVED_KEY"],
      },
    } as unknown as Record<string, PlanCatalogItem>;

    expect(() => validatePlanCatalog(invalidCatalog)).toThrow(
      /contains unapproved entitlement key/,
    );
  });

  it("AC-001: fails validation if FREE plan has entitlements", () => {
    const invalidCatalog = {
      FREE: {
        planKey: "FREE",
        name: "Free",
        description: "Free",
        entitlements: ["PREMIUM_ACCESS"],
      },
      PREMIUM: SERVER_PLAN_CATALOG.PREMIUM,
    } as unknown as Record<string, PlanCatalogItem>;

    expect(() => validatePlanCatalog(invalidCatalog)).toThrow(
      /FREE plan must have exactly zero entitlements/,
    );
  });

  it("AC-001: fails validation if PREMIUM plan has empty entitlements", () => {
    const invalidCatalog = {
      FREE: SERVER_PLAN_CATALOG.FREE,
      PREMIUM: {
        planKey: "PREMIUM",
        name: "Premium",
        description: "Premium",
        entitlements: [],
      },
    } as unknown as Record<string, PlanCatalogItem>;

    expect(() => validatePlanCatalog(invalidCatalog)).toThrow(
      /PREMIUM plan must have exactly \['PREMIUM_ACCESS'\] entitlement/,
    );
  });

  it("AC-004: getPublicPlans returns safe projections omitting provider secrets or price IDs", () => {
    const publicPlans = getPublicPlans();
    expect(publicPlans).toHaveLength(2);

    for (const plan of publicPlans) {
      expect(plan).toHaveProperty("planKey");
      expect(plan).toHaveProperty("name");
      expect(plan).toHaveProperty("description");
      expect(plan).toHaveProperty("entitlements");

      // Verify absence of sensitive provider fields
      expect(plan).not.toHaveProperty("providerKey");
      expect(plan).not.toHaveProperty("providerPriceId");
      expect(plan).not.toHaveProperty("secret");
      expect(plan).not.toHaveProperty("apiKey");
    }
  });

  it("resolves entitlements correctly via getEntitlementsForPlan", () => {
    expect(getEntitlementsForPlan("FREE")).toEqual([]);
    expect(getEntitlementsForPlan("PREMIUM")).toEqual(["PREMIUM_ACCESS"]);
    expect(getEntitlementsForPlan("UNKNOWN")).toEqual([]);
  });

  it("getPlan returns null for unknown plan keys", () => {
    expect(getPlan("UNKNOWN")).toBeNull();
    expect(getPlan("FREE")?.planKey).toBe("FREE");
    expect(getPlan("PREMIUM")?.planKey).toBe("PREMIUM");
  });
});
