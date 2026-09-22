import { describe, it, expect, vi } from "vitest";
import { SubscriptionReadService } from "../../src/modules/subscription/subscription-read.service.js";
import type {
  IEntitlementResolver,
  EntitlementContext,
} from "../../src/modules/subscription/subscription-entitlement.types.js";
import { AppError } from "../../src/shared/errors/error-envelope.js";
import { ERROR_CODES, HTTP_STATUS } from "@aura/shared";

describe("FEAT-050 SubscriptionReadService", () => {
  const mockResolver: IEntitlementResolver = {
    resolveUserEntitlement: vi.fn(),
  };

  const service = new SubscriptionReadService(mockResolver);

  describe("getPlans", () => {
    it("returns safe plan catalog projections with AC-004 fields", () => {
      const response = service.getPlans();

      expect(response.data).toHaveLength(2);

      const [freePlan, premiumPlan] = response.data;

      expect(freePlan).toEqual({
        planKey: "FREE",
        name: "Free Plan",
        description: "Standard access to foundational platform capabilities.",
        entitlements: [],
        available: true,
      });

      expect(premiumPlan).toEqual({
        planKey: "PREMIUM",
        name: "Premium Plan",
        description: "Full access to advanced platform capabilities and features.",
        entitlements: ["PREMIUM_ACCESS"],
        available: true,
      });

      // No sensitive fields
      for (const plan of response.data) {
        expect(plan).not.toHaveProperty("providerKey");
        expect(plan).not.toHaveProperty("providerPriceId");
        expect(plan).not.toHaveProperty("secret");
      }
    });
  });

  describe("getCurrentUserSubscription", () => {
    it("resolves current user entitlement and returns safe DTO", async () => {
      const userId = "test-user-uuid-123";
      const now = new Date("2026-09-22T12:00:00.000Z");

      const mockContext: EntitlementContext = {
        userId,
        planKey: "PREMIUM",
        status: "ACTIVE",
        entitlements: ["PREMIUM_ACCESS"],
        isEntitled: true,
        currentPeriodStart: new Date("2026-09-01T00:00:00.000Z"),
        currentPeriodEnd: new Date("2026-10-01T00:00:00.000Z"),
        cancelAtPeriodEnd: false,
        evaluatedAt: now,
      };

      vi.mocked(mockResolver.resolveUserEntitlement).mockResolvedValueOnce(mockContext);

      const response = await service.getCurrentUserSubscription(userId);

      expect(mockResolver.resolveUserEntitlement).toHaveBeenCalledWith(userId);
      expect(response.data).toEqual({
        plan: "PREMIUM",
        planKey: "PREMIUM",
        status: "ACTIVE",
        entitlements: ["PREMIUM_ACCESS"],
        isEntitled: true,
        currentPeriodStart: "2026-09-01T00:00:00.000Z",
        currentPeriodEnd: "2026-10-01T00:00:00.000Z",
        cancelAtPeriodEnd: false,
      });

      // Omits userId
      expect(response.data).not.toHaveProperty("userId");
    });

    it("handles no-record user FREE projection correctly", async () => {
      const userId = "no-sub-user-uuid";
      const mockContext: EntitlementContext = {
        userId,
        planKey: "FREE",
        status: "NONE",
        entitlements: [],
        isEntitled: false,
        currentPeriodStart: null,
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
        evaluatedAt: new Date(),
      };

      vi.mocked(mockResolver.resolveUserEntitlement).mockResolvedValueOnce(mockContext);

      const response = await service.getCurrentUserSubscription(userId);

      expect(response.data.plan).toBe("FREE");
      expect(response.data.status).toBe("NONE");
      expect(response.data.isEntitled).toBe(false);
      expect(response.data.currentPeriodStart).toBeNull();
      expect(response.data.currentPeriodEnd).toBeNull();
    });

    it("propagates resolver error faithfully (e.g. database failure)", async () => {
      const userId = "error-user";
      vi.mocked(mockResolver.resolveUserEntitlement).mockRejectedValueOnce(
        new AppError(
          "Failed to resolve subscription entitlement due to persistence error",
          ERROR_CODES.INTERNAL_ERROR,
          HTTP_STATUS.INTERNAL_SERVER_ERROR,
        ),
      );

      await expect(service.getCurrentUserSubscription(userId)).rejects.toThrow(
        "Failed to resolve subscription entitlement due to persistence error",
      );
    });
  });
});
