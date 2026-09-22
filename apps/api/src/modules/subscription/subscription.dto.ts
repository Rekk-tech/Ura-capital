import type {
  SubscriptionPlanDto,
  SubscriptionMeDto,
  SubscriptionPlansResponse,
  SubscriptionMeResponse,
} from "@aura/shared";
import type { PlanCatalogItem, PublicPlanInfo } from "./plan-catalog.types.js";
import type { EntitlementContext } from "./subscription-entitlement.types.js";

export type {
  SubscriptionPlanDto,
  SubscriptionMeDto,
  SubscriptionPlansResponse,
  SubscriptionMeResponse,
};

/**
 * Maps a server-owned PlanCatalogItem into the safe, public SubscriptionPlanDto.
 * Strictly guarantees AC-004: contains only plan key, safe display name, safe benefit copy, and availability.
 * Omits all provider price IDs, secrets, and internal mappings.
 */
export function toSubscriptionPlanDto(
  item: PlanCatalogItem | PublicPlanInfo,
): SubscriptionPlanDto {
  return {
    planKey: item.planKey,
    name: item.name,
    description: item.description,
    entitlements: [...item.entitlements],
    available: true,
  };
}

/**
 * Maps an authoritative EntitlementContext into the safe, allowlisted SubscriptionMeDto.
 * Strictly guarantees AC-005 and Section 9 whitelist:
 * - Omits internal database userId
 * - Omits all provider customer/subscription/event identifiers
 * - Omits raw audit records and internal database timestamps
 * - Omits security/role/credential metadata
 * - Accurately reflects PostgreSQL-backed plan, status, period facts, and FEAT-049 entitlements
 */
export function toSubscriptionMeDto(context: EntitlementContext): SubscriptionMeDto {
  return {
    plan: context.planKey,
    planKey: context.planKey,
    status: context.status,
    entitlements: [...context.entitlements],
    isEntitled: context.isEntitled,
    currentPeriodStart: context.currentPeriodStart
      ? context.currentPeriodStart.toISOString()
      : null,
    currentPeriodEnd: context.currentPeriodEnd
      ? context.currentPeriodEnd.toISOString()
      : null,
    cancelAtPeriodEnd: context.cancelAtPeriodEnd,
  };
}

