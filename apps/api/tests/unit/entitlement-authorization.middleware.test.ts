import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it, vi } from "vitest";
import type { NextFunction, Response } from "express";
import { ERROR_CODES, HTTP_STATUS } from "@aura/shared";

import { AppError } from "../../src/shared/errors/error-envelope.js";
import { requireEntitlement } from "../../src/modules/subscription/entitlement-authorization.middleware.js";
import type {
  EntitlementAuthorizedRequest,
  IEntitlementDecisionObserver,
} from "../../src/modules/subscription/entitlement-authorization.types.js";
import type {
  EntitlementContext,
  IEntitlementResolver,
} from "../../src/modules/subscription/subscription-entitlement.types.js";

const USER_ID = "b14822a5-a3f6-42e1-8379-e45cf53b7370";
const NOW = new Date("2026-09-22T12:00:00.000Z");
const PERIOD_START = new Date("2026-09-01T00:00:00.000Z");
const PERIOD_END = new Date("2026-10-01T00:00:00.000Z");

function request(overrides: Record<string, unknown> = {}): EntitlementAuthorizedRequest {
  return {
    id: "request-entitlement-001",
    headers: {},
    body: {},
    user: {
      id: USER_ID,
      email: "learner@example.com",
      displayName: "Learner",
      status: "ACTIVE",
      createdAt: "2026-01-01T00:00:00.000Z",
    },
    ...overrides,
  } as EntitlementAuthorizedRequest;
}

function context(overrides: Partial<EntitlementContext> = {}): EntitlementContext {
  return {
    userId: USER_ID,
    planKey: "PREMIUM",
    status: "ACTIVE",
    entitlements: ["PREMIUM_ACCESS"],
    isEntitled: true,
    currentPeriodStart: PERIOD_START,
    currentPeriodEnd: PERIOD_END,
    cancelAtPeriodEnd: false,
    evaluatedAt: NOW,
    ...overrides,
  };
}

function resolver(result: EntitlementContext = context()): IEntitlementResolver {
  return { resolveUserEntitlement: vi.fn().mockResolvedValue(result) };
}

async function execute(
  req: EntitlementAuthorizedRequest,
  entitlementResolver: IEntitlementResolver,
  observer?: IEntitlementDecisionObserver,
  entitlementKey = "PREMIUM_ACCESS",
) {
  const next = vi.fn() as unknown as NextFunction;
  const middleware = requireEntitlement(entitlementKey as "PREMIUM_ACCESS", {
    resolver: entitlementResolver,
    observer,
  });
  await middleware(req, {} as Response, next);
  return vi.mocked(next);
}

describe("FEAT-054 premium entitlement authorization middleware", () => {
  it("returns 401 before resolver lookup when authentication context is missing", async () => {
    const entitlementResolver = resolver();
    const next = await execute(request({ user: undefined }), entitlementResolver);

    expect(entitlementResolver.resolveUserEntitlement).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        code: ERROR_CODES.UNAUTHENTICATED,
        statusCode: HTTP_STATUS.UNAUTHORIZED,
      }),
    );
  });

  it("allows only the server-resolved capability and attaches minimal trusted context", async () => {
    const req = request();
    const entitlementResolver = resolver();
    const next = await execute(req, entitlementResolver);

    expect(next).toHaveBeenCalledWith();
    expect(entitlementResolver.resolveUserEntitlement).toHaveBeenCalledWith(USER_ID);
    expect(req.entitlement).toEqual({
      userId: USER_ID,
      entitlementKey: "PREMIUM_ACCESS",
      evaluatedAt: NOW.toISOString(),
    });
    expect(req.entitlement).not.toHaveProperty("planKey");
    expect(req.entitlement).not.toHaveProperty("providerKey");
  });

  it.each([
    [
      "missing subscription",
      context({
        planKey: "FREE",
        status: "NONE",
        entitlements: [],
        isEntitled: false,
        currentPeriodStart: null,
        currentPeriodEnd: null,
      }),
    ],
    ["free plan", context({ planKey: "FREE", entitlements: [], isEntitled: false })],
    ["past due", context({ status: "PAST_DUE", entitlements: [], isEntitled: false })],
    ["cancelled", context({ status: "CANCELLED", entitlements: [], isEntitled: false })],
    ["expired", context({ status: "EXPIRED", entitlements: [], isEntitled: false })],
    ["invalid period resolution", context({ entitlements: [], isEntitled: false })],
  ])("returns the same safe 403 for %s", async (_label, deniedContext) => {
    const next = await execute(request(), resolver(deniedContext));
    const error = next.mock.calls[0]?.[0] as AppError;

    expect(error).toBeInstanceOf(AppError);
    expect(error.code).toBe(ERROR_CODES.ENTITLEMENT_REQUIRED);
    expect(error.statusCode).toBe(HTTP_STATUS.FORBIDDEN);
    expect(error.message).toBe("Required entitlement is not available");
    expect(error.message).not.toContain("PREMIUM");
  });

  it("fails with sanitized 500 for an unknown entitlement key without resolver lookup", async () => {
    const entitlementResolver = resolver();
    const observer: IEntitlementDecisionObserver = { observe: vi.fn() };
    const next = await execute(request(), entitlementResolver, observer, "ROOT_ACCESS");
    const error = next.mock.calls[0]?.[0] as AppError;

    expect(entitlementResolver.resolveUserEntitlement).not.toHaveBeenCalled();
    expect(observer.observe).toHaveBeenCalledWith({
      entitlementKey: "UNKNOWN",
      outcome: "ERROR",
      reason: "INVALID_KEY",
      requestId: "request-entitlement-001",
    });
    expect(error.statusCode).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
    expect(error.code).toBe(ERROR_CODES.INTERNAL_ERROR);
    expect(error.message).toBe("Entitlement authorization configuration is invalid");
  });

  it("maps repository failures to a fixed sanitized 500", async () => {
    const rawFailure =
      "postgresql://billing:raw-password@db.internal:5432/aura_prod token=raw-token";
    const failingResolver: IEntitlementResolver = {
      resolveUserEntitlement: vi.fn().mockRejectedValue(new Error(rawFailure)),
    };
    const next = await execute(request(), failingResolver);
    const error = next.mock.calls[0]?.[0] as AppError;

    expect(error.statusCode).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
    expect(error.message).toBe("Entitlement authorization is temporarily unavailable");
    expect(error.message).not.toContain("db.internal");
    expect(error.message).not.toContain("raw-password");
    expect(error.message).not.toContain("raw-token");
  });

  it.each([
    context({ userId: "1d0ca26d-096f-482c-ad2f-80ed4c30600d" }),
    context({ isEntitled: false }),
    context({ status: "PAST_DUE" }),
    context({ currentPeriodEnd: new Date("2026-08-01T00:00:00.000Z") }),
    { ...context(), planKey: "ROOT" } as unknown as EntitlementContext,
    { ...context(), status: "TRIALING" } as unknown as EntitlementContext,
  ])("fails closed on malformed or inconsistent resolver context", async (badContext) => {
    const next = await execute(request(), resolver(badContext));
    const error = next.mock.calls[0]?.[0] as AppError;

    expect(error.statusCode).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
    expect(error.message).toBe("Entitlement authorization is temporarily unavailable");
  });

  it("ignores client, JWT-like, role, and frontend premium fields", async () => {
    const forgedReq = request({
      body: { isPremium: true, plan: "PREMIUM", entitlements: ["PREMIUM_ACCESS"] },
      headers: { "x-entitlements": "PREMIUM_ACCESS", "x-role": "ADMIN" },
      user: {
        ...request().user,
        role: "ADMIN",
        isPremium: true,
        entitlements: ["PREMIUM_ACCESS"],
      },
    });
    const denied = context({
      planKey: "FREE",
      status: "NONE",
      entitlements: [],
      isEntitled: false,
      currentPeriodStart: null,
      currentPeriodEnd: null,
    });
    const next = await execute(forgedReq, resolver(denied));

    expect((next.mock.calls[0]?.[0] as AppError).code).toBe(ERROR_CODES.ENTITLEMENT_REQUIRED);
  });

  it("keeps denial fail-closed when bounded observability fails", async () => {
    const observer: IEntitlementDecisionObserver = {
      observe: vi.fn().mockRejectedValue(new Error("audit sink unavailable secret=raw")),
    };
    const denied = context({
      planKey: "FREE",
      status: "NONE",
      entitlements: [],
      isEntitled: false,
      currentPeriodStart: null,
      currentPeriodEnd: null,
    });
    const next = await execute(request(), resolver(denied), observer);

    expect(observer.observe).toHaveBeenCalledWith({
      entitlementKey: "PREMIUM_ACCESS",
      outcome: "DENY",
      reason: "ENTITLEMENT_MISSING",
      requestId: "request-entitlement-001",
    });
    expect((next.mock.calls[0]?.[0] as AppError).code).toBe(ERROR_CODES.ENTITLEMENT_REQUIRED);
  });

  it("contains no production-domain or public route integration", () => {
    const testDir = path.dirname(fileURLToPath(import.meta.url));
    const sourceRoot = path.resolve(testDir, "../../src");
    const protectedDomainRoots = ["academy", "simulation", "community", "ai"];

    for (const domain of protectedDomainRoots) {
      const root = path.join(sourceRoot, "modules", domain);
      if (!fs.existsSync(root)) continue;
      const files = fs.readdirSync(root, { recursive: true, withFileTypes: true });
      for (const entry of files) {
        if (!entry.isFile() || !entry.name.endsWith(".ts")) continue;
        const filePath = path.join(entry.parentPath, entry.name);
        expect(fs.readFileSync(filePath, "utf8")).not.toContain("requireEntitlement");
      }
    }

    const routeFiles = fs
      .readdirSync(path.join(sourceRoot, "modules"), { recursive: true, withFileTypes: true })
      .filter((entry) => entry.isFile() && /\.routes?\.ts$/.test(entry.name));
    for (const entry of routeFiles) {
      expect(fs.readFileSync(path.join(entry.parentPath, entry.name), "utf8")).not.toContain(
        "requireEntitlement",
      );
    }
  });
});
