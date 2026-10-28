import { describe, it, expect, vi } from "vitest";
import type { Request, Response } from "express";
import { createAiEntitlementMiddleware } from "../../../src/modules/ai/http/ai-entitlement.middleware.js";
import { ERROR_CODES, HTTP_STATUS } from "@aura/shared";
import type { IEntitlementResolver } from "../../../src/modules/subscription/subscription-entitlement.types.js";

describe("requireAiEntitlement Middleware Unit Tests", () => {
  it("rejects unauthenticated requests with 401 UNAUTHENTICATED", async () => {
    const middleware = createAiEntitlementMiddleware(() => ({} as IEntitlementResolver));
    const req = {} as unknown as Request;
    const res = {} as unknown as Response;
    const next = vi.fn();

    await middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    const error = next.mock.calls[0][0];
    expect(error.statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
    expect(error.code).toBe(ERROR_CODES.UNAUTHENTICATED);
  });

  it("permits ADMIN users to proceed without subscription check", async () => {
    const mockResolver: IEntitlementResolver = {
      resolveUserEntitlement: vi.fn(),
    };
    const middleware = createAiEntitlementMiddleware(() => mockResolver);
    const req = { user: { id: "admin-1", role: "ADMIN" } } as unknown as Request;
    const res = {} as unknown as Response;
    const next = vi.fn();

    await middleware(req, res, next);

    expect(next).toHaveBeenCalledWith();
    expect(mockResolver.resolveUserEntitlement).not.toHaveBeenCalled();
  });

  it("permits users with roles containing ADMIN", async () => {
    const mockResolver: IEntitlementResolver = {
      resolveUserEntitlement: vi.fn(),
    };
    const middleware = createAiEntitlementMiddleware(() => mockResolver);
    const req = { user: { id: "admin-2", roles: ["ADMIN", "LEARNER"] } } as unknown as Request;
    const res = {} as unknown as Response;
    const next = vi.fn();

    await middleware(req, res, next);

    expect(next).toHaveBeenCalledWith();
    expect(mockResolver.resolveUserEntitlement).not.toHaveBeenCalled();
  });

  it("rejects free learners without active entitlement with 403 AI_MEMBERSHIP_REQUIRED", async () => {
    const mockResolver: IEntitlementResolver = {
      resolveUserEntitlement: vi.fn().mockResolvedValue({
        isEntitled: false,
        planKey: "FREE",
        status: "ACTIVE",
        entitlements: [],
      }),
    };
    const middleware = createAiEntitlementMiddleware(() => mockResolver);
    const req = { user: { id: "free-user-1", role: "LEARNER" } } as unknown as Request;
    const res = {} as unknown as Response;
    const next = vi.fn();

    await middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    const error = next.mock.calls[0][0];
    expect(error.statusCode).toBe(HTTP_STATUS.FORBIDDEN);
    expect(error.code).toBe(ERROR_CODES.AI_MEMBERSHIP_REQUIRED);
    expect(mockResolver.resolveUserEntitlement).toHaveBeenCalledWith("free-user-1");
  });

  it("permits subscribers holding PREMIUM_ACCESS entitlement", async () => {
    const mockResolver: IEntitlementResolver = {
      resolveUserEntitlement: vi.fn().mockResolvedValue({
        isEntitled: true,
        planKey: "PREMIUM",
        status: "ACTIVE",
        entitlements: ["PREMIUM_ACCESS"],
      }),
    };
    const middleware = createAiEntitlementMiddleware(() => mockResolver);
    const req = { user: { id: "premium-user-1", role: "LEARNER" } } as unknown as Request;
    const res = {} as unknown as Response;
    const next = vi.fn();

    await middleware(req, res, next);

    expect(next).toHaveBeenCalledWith();
    expect(mockResolver.resolveUserEntitlement).toHaveBeenCalledWith("premium-user-1");
  });
});
