import express, { type Express, type Response } from "express";
import jwt from "jsonwebtoken";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { PrismaClient } from "@prisma/client";
import { ERROR_CODES, HTTP_STATUS } from "@aura/shared";

import { createAuthenticateMiddleware } from "../../src/modules/auth/auth.middleware.js";
import { accessTokenService } from "../../src/modules/auth/access-token.service.js";
import { getAuthConfig } from "../../src/infrastructure/config/auth.config.js";
import { errorHandlerMiddleware } from "../../src/middleware/error-handler.js";
import { createRepositoryContainer } from "../../src/infrastructure/database/repository-factory.js";
import type { IRepositoryContainer } from "../../src/infrastructure/database/repository-factory.js";
import { requireEntitlement } from "../../src/modules/subscription/entitlement-authorization.middleware.js";
import type { EntitlementAuthorizedRequest } from "../../src/modules/subscription/entitlement-authorization.types.js";
import { SubscriptionEntitlementService } from "../../src/modules/subscription/subscription-entitlement.service.js";
import type {
  Clock,
  IEntitlementResolver,
} from "../../src/modules/subscription/subscription-entitlement.types.js";
import {
  assertSafeTestDatabase,
  cleanAllTestTables,
  sanitizeDiagnosticMessage,
} from "../helpers/test-db-guard.js";

const START = new Date("2026-09-01T00:00:00.000Z");
const END = new Date("2026-10-01T00:00:00.000Z");
const INITIAL_NOW = new Date("2026-09-15T00:00:00.000Z");

function controllableClock(initial = INITIAL_NOW) {
  let current = new Date(initial);
  const clock: Clock & { set(value: Date): void } = {
    now: () => new Date(current),
    set: (value) => {
      current = new Date(value);
    },
  };
  return clock;
}

function createHarness(
  repos: IRepositoryContainer,
  resolver: IEntitlementResolver,
  handlerCalls: { count: number },
): Express {
  const app = express();
  app.use(express.json());
  app.post(
    "/__internal-tests/premium-capability",
    createAuthenticateMiddleware({ userRepo: repos.userRepo }),
    requireEntitlement("PREMIUM_ACCESS", { resolver }),
    (req: EntitlementAuthorizedRequest, res: Response) => {
      handlerCalls.count += 1;
      res.status(HTTP_STATUS.OK).json({
        data: {
          entitlementKey: req.entitlement?.entitlementKey,
        },
      });
    },
  );
  app.use(errorHandlerMiddleware);
  return app;
}

describe("FEAT-054 premium entitlement guard live PostgreSQL harness", () => {
  const testDbUrl =
    process.env.TEST_DATABASE_URL ||
    process.env.DATABASE_URL ||
    "postgresql://postgres:postgrespassword@localhost:5432/aura_capital_test_feat054";

  let prisma: PrismaClient;
  let repos: IRepositoryContainer;

  beforeAll(async () => {
    assertSafeTestDatabase(testDbUrl, "test");
    prisma = new PrismaClient({ datasources: { db: { url: testDbUrl } } });
    try {
      await prisma.$connect();
      repos = createRepositoryContainer(prisma);
    } catch (error) {
      const safe = sanitizeDiagnosticMessage(
        error instanceof Error ? error.message : String(error),
      );
      throw new Error(`[DB_CONNECTION_FAILED] Required test database unreachable: ${safe}`);
    }
  });

  afterAll(async () => {
    if (prisma) {
      await cleanAllTestTables(prisma);
      await prisma.$disconnect();
    }
  });

  beforeEach(async () => {
    await cleanAllTestTables(prisma);
  });

  async function createUser(prefix: string) {
    return prisma.user.create({
      data: {
        email: `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2)}@example.com`,
        displayName: "Entitlement Guard Learner",
        status: "ACTIVE",
      },
    });
  }

  function bearer(userId: string): string {
    return `Bearer ${accessTokenService.issueAccessToken(userId).accessToken}`;
  }

  it("returns 401 before entitlement lookup for an unauthenticated request", async () => {
    const resolver: IEntitlementResolver = {
      resolveUserEntitlement: vi.fn(),
    };
    const calls = { count: 0 };
    const app = createHarness(repos, resolver, calls);

    const response = await request(app)
      .post("/__internal-tests/premium-capability")
      .send({ isPremium: true })
      .expect(HTTP_STATUS.UNAUTHORIZED);

    expect(response.body.error.code).toBe(ERROR_CODES.UNAUTHENTICATED);
    expect(resolver.resolveUserEntitlement).not.toHaveBeenCalled();
    expect(calls.count).toBe(0);
  });

  it("denies no-subscription ADMIN and ignores all client premium assertions", async () => {
    const user = await createUser("admin_without_subscription");
    const admin = await prisma.role.create({ data: { name: "ADMIN" } });
    await prisma.userRole.create({ data: { userId: user.id, roleId: admin.id } });
    const clock = controllableClock();
    const calls = { count: 0 };
    const app = createHarness(
      repos,
      new SubscriptionEntitlementService(repos.subscriptionRepo, clock),
      calls,
    );
    const auditBefore = await prisma.authSecurityAuditRecord.count();
    const transitionBefore = await prisma.subscriptionTransitionRecord.count();

    const response = await request(app)
      .post("/__internal-tests/premium-capability?plan=PREMIUM&isPremium=true")
      .set("Authorization", bearer(user.id))
      .set("X-Role", "ADMIN")
      .set("X-Entitlements", "PREMIUM_ACCESS")
      .send({
        userId: user.id,
        role: "ADMIN",
        isPremium: true,
        plan: "PREMIUM",
        entitlements: ["PREMIUM_ACCESS"],
      })
      .expect(HTTP_STATUS.FORBIDDEN);

    expect(response.body.error).toMatchObject({
      code: ERROR_CODES.ENTITLEMENT_REQUIRED,
      message: "Required entitlement is not available",
    });
    expect(response.body.error).not.toHaveProperty("details");
    expect(calls.count).toBe(0);
    expect(await prisma.authSecurityAuditRecord.count()).toBe(auditBefore);
    expect(await prisma.subscriptionTransitionRecord.count()).toBe(transitionBefore);
  });

  it("reflects PostgreSQL grant and revocation immediately with the same access token", async () => {
    const user = await createUser("same_token_immediacy");
    const token = bearer(user.id);
    const clock = controllableClock();
    const calls = { count: 0 };
    const app = createHarness(
      repos,
      new SubscriptionEntitlementService(repos.subscriptionRepo, clock),
      calls,
    );

    await request(app)
      .post("/__internal-tests/premium-capability")
      .set("Authorization", token)
      .expect(HTTP_STATUS.FORBIDDEN);

    const subscription = await repos.subscriptionRepo.create({
      userId: user.id,
      planKey: "PREMIUM",
      status: "ACTIVE",
      providerKey: "MOCK",
      externalSubscriptionId: "sub_feat054_immediacy",
      currentPeriodStart: START,
      currentPeriodEnd: END,
      cancelAtPeriodEnd: false,
    });

    const allowed = await request(app)
      .post("/__internal-tests/premium-capability")
      .set("Authorization", token)
      .expect(HTTP_STATUS.OK);
    expect(allowed.body.data).toEqual({ entitlementKey: "PREMIUM_ACCESS" });

    await repos.subscriptionRepo.update(subscription.id, { status: "PAST_DUE" });

    await request(app)
      .post("/__internal-tests/premium-capability")
      .set("Authorization", token)
      .expect(HTTP_STATUS.FORBIDDEN);
    expect(calls.count).toBe(1);
  });

  it("allows pending cancellation before period end and denies at the boundary", async () => {
    const user = await createUser("cancel_pending");
    await repos.subscriptionRepo.create({
      userId: user.id,
      planKey: "PREMIUM",
      status: "ACTIVE",
      providerKey: "MOCK",
      externalSubscriptionId: "sub_feat054_cancel_pending",
      currentPeriodStart: START,
      currentPeriodEnd: END,
      cancelAtPeriodEnd: true,
    });
    const clock = controllableClock(new Date(END.getTime() - 1));
    const calls = { count: 0 };
    const app = createHarness(
      repos,
      new SubscriptionEntitlementService(repos.subscriptionRepo, clock),
      calls,
    );
    const token = bearer(user.id);

    await request(app)
      .post("/__internal-tests/premium-capability")
      .set("Authorization", token)
      .expect(HTTP_STATUS.OK);

    clock.set(END);
    await request(app)
      .post("/__internal-tests/premium-capability")
      .set("Authorization", token)
      .expect(HTTP_STATUS.FORBIDDEN);
    expect(calls.count).toBe(1);
  });

  it.each(["PAST_DUE", "CANCELLED", "EXPIRED"] as const)(
    "denies durable %s subscription state",
    async (status) => {
      const user = await createUser(`status_${status.toLowerCase()}`);
      await repos.subscriptionRepo.create({
        userId: user.id,
        planKey: "PREMIUM",
        status,
        providerKey: "MOCK",
        externalSubscriptionId: `sub_feat054_${status.toLowerCase()}`,
        currentPeriodStart: START,
        currentPeriodEnd: END,
        cancelAtPeriodEnd: false,
      });
      const calls = { count: 0 };
      const app = createHarness(
        repos,
        new SubscriptionEntitlementService(repos.subscriptionRepo, controllableClock()),
        calls,
      );

      await request(app)
        .post("/__internal-tests/premium-capability")
        .set("Authorization", bearer(user.id))
        .expect(HTTP_STATUS.FORBIDDEN);
      expect(calls.count).toBe(0);
    },
  );

  it("rejects a correctly signed JWT containing unapproved premium claims", async () => {
    const user = await createUser("forged_claims");
    const authConfig = getAuthConfig();
    const now = Math.floor(Date.now() / 1000);
    const forged = jwt.sign(
      {
        sub: user.id,
        iat: now,
        exp: now + 300,
        iss: authConfig.accessTokenIssuer,
        aud: authConfig.accessTokenAudience,
        typ: "access",
        isPremium: true,
        plan: "PREMIUM",
        entitlements: ["PREMIUM_ACCESS"],
        role: "ADMIN",
      },
      authConfig.accessTokenSecret,
      { algorithm: "HS256" },
    );
    const resolver: IEntitlementResolver = { resolveUserEntitlement: vi.fn() };
    const calls = { count: 0 };
    const app = createHarness(repos, resolver, calls);

    await request(app)
      .post("/__internal-tests/premium-capability")
      .set("Authorization", `Bearer ${forged}`)
      .expect(HTTP_STATUS.UNAUTHORIZED);
    expect(resolver.resolveUserEntitlement).not.toHaveBeenCalled();
    expect(calls.count).toBe(0);
  });

  it("returns a sanitized 500 and never reaches the handler when resolution fails", async () => {
    const user = await createUser("resolver_failure");
    const rawFailure =
      "postgresql://billing:raw-password@db.internal:5432/aura_prod token=raw-token";
    const resolver: IEntitlementResolver = {
      resolveUserEntitlement: vi.fn().mockRejectedValue(new Error(rawFailure)),
    };
    const calls = { count: 0 };
    const app = createHarness(repos, resolver, calls);

    const response = await request(app)
      .post("/__internal-tests/premium-capability")
      .set("Authorization", bearer(user.id))
      .expect(HTTP_STATUS.INTERNAL_SERVER_ERROR);

    const serialized = JSON.stringify(response.body);
    expect(response.body.error).toMatchObject({
      code: ERROR_CODES.INTERNAL_ERROR,
      message: "Entitlement authorization is temporarily unavailable",
    });
    expect(serialized).not.toContain("db.internal");
    expect(serialized).not.toContain("raw-password");
    expect(serialized).not.toContain("raw-token");
    expect(calls.count).toBe(0);
  });
});
