import { describe, it, expect } from "vitest";
import {
  toSubscriptionPlanDto,
  toSubscriptionMeDto,
} from "../../src/modules/subscription/subscription.dto.js";
import { SERVER_PLAN_CATALOG } from "../../src/modules/subscription/plan-catalog.js";
import type { EntitlementContext } from "../../src/modules/subscription/subscription-entitlement.types.js";
import {
  SubscriptionPlanDtoSchema,
  SubscriptionMeDtoSchema,
} from "@aura/shared";

describe("FEAT-050 Subscription DTO Mappings", () => {
  describe("toSubscriptionPlanDto", () => {
    it("maps FREE plan to safe allowlisted SubscriptionPlanDto", () => {
      const freeItem = SERVER_PLAN_CATALOG.FREE;
      const dto = toSubscriptionPlanDto(freeItem);

      expect(dto).toEqual({
        planKey: "FREE",
        name: "Free Plan",
        description: "Standard access to foundational platform capabilities.",
        entitlements: [],
        available: true,
      });

      // Strict schema validation (AC-004)
      const parseResult = SubscriptionPlanDtoSchema.safeParse(dto);
      expect(parseResult.success).toBe(true);

      // Sensitive fields must not exist
      expect(dto).not.toHaveProperty("providerKey");
      expect(dto).not.toHaveProperty("providerPriceId");
      expect(dto).not.toHaveProperty("secret");
      expect(dto).not.toHaveProperty("id");
    });

    it("maps PREMIUM plan to safe allowlisted SubscriptionPlanDto", () => {
      const premiumItem = SERVER_PLAN_CATALOG.PREMIUM;
      const dto = toSubscriptionPlanDto(premiumItem);

      expect(dto).toEqual({
        planKey: "PREMIUM",
        name: "Premium Plan",
        description: "Full access to advanced platform capabilities and features.",
        entitlements: ["PREMIUM_ACCESS"],
        available: true,
      });

      const parseResult = SubscriptionPlanDtoSchema.safeParse(dto);
      expect(parseResult.success).toBe(true);
    });
  });

  describe("toSubscriptionMeDto", () => {
    const now = new Date("2026-09-22T12:00:00.000Z");
    const periodStart = new Date("2026-09-01T00:00:00.000Z");
    const periodEnd = new Date("2026-10-01T00:00:00.000Z");

    it("maps missing subscription (NONE status) to canonical FREE projection", () => {
      const context: EntitlementContext = {
        userId: "99999999-9999-4999-8999-999999999999",
        planKey: "FREE",
        status: "NONE",
        entitlements: [],
        isEntitled: false,
        currentPeriodStart: null,
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
        evaluatedAt: now,
      };

      const dto = toSubscriptionMeDto(context);

      expect(dto).toEqual({
        plan: "FREE",
        planKey: "FREE",
        status: "NONE",
        entitlements: [],
        isEntitled: false,
        currentPeriodStart: null,
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
      });

      // Strict schema validation (AC-005)
      const parseResult = SubscriptionMeDtoSchema.safeParse(dto);
      expect(parseResult.success).toBe(true);

      // Strict omission of internal identifiers and provider secrets (Section 9)
      expect(dto).not.toHaveProperty("userId");
      expect(dto).not.toHaveProperty("evaluatedAt");
      expect(dto).not.toHaveProperty("providerKey");
      expect(dto).not.toHaveProperty("externalSubscriptionId");
      expect(dto).not.toHaveProperty("providerEventId");
    });

    it("maps ACTIVE PREMIUM subscription with ISO dates", () => {
      const context: EntitlementContext = {
        userId: "11111111-1111-4111-8111-111111111111",
        planKey: "PREMIUM",
        status: "ACTIVE",
        entitlements: ["PREMIUM_ACCESS"],
        isEntitled: true,
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
        cancelAtPeriodEnd: false,
        evaluatedAt: now,
      };

      const dto = toSubscriptionMeDto(context);

      expect(dto).toEqual({
        plan: "PREMIUM",
        planKey: "PREMIUM",
        status: "ACTIVE",
        entitlements: ["PREMIUM_ACCESS"],
        isEntitled: true,
        currentPeriodStart: periodStart.toISOString(),
        currentPeriodEnd: periodEnd.toISOString(),
        cancelAtPeriodEnd: false,
      });

      const parseResult = SubscriptionMeDtoSchema.safeParse(dto);
      expect(parseResult.success).toBe(true);
      expect(dto).not.toHaveProperty("userId");
    });

    it("maps PAST_DUE subscription accurately with isEntitled=false", () => {
      const context: EntitlementContext = {
        userId: "22222222-2222-4222-8222-222222222222",
        planKey: "PREMIUM",
        status: "PAST_DUE",
        entitlements: [],
        isEntitled: false,
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
        cancelAtPeriodEnd: false,
        evaluatedAt: now,
      };

      const dto = toSubscriptionMeDto(context);

      expect(dto.status).toBe("PAST_DUE");
      expect(dto.isEntitled).toBe(false);
      expect(dto.entitlements).toEqual([]);
      expect(dto).not.toHaveProperty("userId");
    });

    it("maps CANCELLED and EXPIRED states accurately", () => {
      const cancelledContext: EntitlementContext = {
        userId: "33333333-3333-4333-8333-333333333333",
        planKey: "PREMIUM",
        status: "CANCELLED",
        entitlements: [],
        isEntitled: false,
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
        cancelAtPeriodEnd: false,
        evaluatedAt: now,
      };

      const expiredContext: EntitlementContext = {
        userId: "44444444-4444-4444-8444-444444444444",
        planKey: "PREMIUM",
        status: "EXPIRED",
        entitlements: [],
        isEntitled: false,
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
        cancelAtPeriodEnd: true,
        evaluatedAt: now,
      };

      const cancelledDto = toSubscriptionMeDto(cancelledContext);
      const expiredDto = toSubscriptionMeDto(expiredContext);

      expect(cancelledDto.status).toBe("CANCELLED");
      expect(cancelledDto.isEntitled).toBe(false);

      expect(expiredDto.status).toBe("EXPIRED");
      expect(expiredDto.isEntitled).toBe(false);
      expect(expiredDto.cancelAtPeriodEnd).toBe(true);
    });
  });
});
