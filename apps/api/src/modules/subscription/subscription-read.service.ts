import { getPublicPlans } from "./plan-catalog.js";
import type { IEntitlementResolver } from "./subscription-entitlement.types.js";
import {
  toSubscriptionPlanDto,
  toSubscriptionMeDto,
  type SubscriptionPlansResponse,
  type SubscriptionMeResponse,
} from "./subscription.dto.js";

/**
 * Service orchestrating subscription read operations.
 * Layering: Controller -> SubscriptionReadService -> IEntitlementResolver -> PostgreSQL.
 *
 * Invariants:
 * - FR-008, AC-011: Zero database writes, zero Redis calls, zero provider calls, zero audit events.
 * - FR-003, AC-006: Plans are sourced directly from the server-owned catalog.
 * - FR-004, AC-007: Current-user subscription is resolved via server-derived identity and FEAT-049 resolver.
 * - FR-005, AC-008: Users without a subscription record receive a canonical FREE projection.
 */
export class SubscriptionReadService {
  constructor(private readonly entitlementResolver: IEntitlementResolver) {}

  /**
   * Retrieves safe, public plan catalog definitions.
   * Public safe read: contains only approved catalog plans with zero sensitive data.
   */
  getPlans(): SubscriptionPlansResponse {
    const catalogPlans = getPublicPlans();
    return {
      data: catalogPlans.map(toSubscriptionPlanDto),
    };
  }

  /**
   * Resolves the current authenticated user's subscription and entitlement state.
   * Derives authority exclusively from PostgreSQL subscription state and FEAT-049 resolver.
   */
  async getCurrentUserSubscription(userId: string): Promise<SubscriptionMeResponse> {
    const context = await this.entitlementResolver.resolveUserEntitlement(userId);
    return {
      data: toSubscriptionMeDto(context),
    };
  }
}
