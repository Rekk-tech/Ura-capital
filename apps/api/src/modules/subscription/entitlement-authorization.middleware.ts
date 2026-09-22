import type { NextFunction, Response } from "express";
import { ERROR_CODES, HTTP_STATUS } from "@aura/shared";

import { logger } from "../../infrastructure/logging/logger.js";
import { AppError } from "../../shared/errors/error-envelope.js";
import { CANONICAL_ENTITLEMENT_KEYS, type EntitlementKey } from "./plan-catalog.types.js";
import type { EntitlementContext, IEntitlementResolver } from "./subscription-entitlement.types.js";
import type {
  EntitlementAuthorizedRequest,
  EntitlementDecisionEvent,
  EntitlementDecisionReason,
  IEntitlementDecisionObserver,
} from "./entitlement-authorization.types.js";

export interface RequireEntitlementOptions {
  resolver: IEntitlementResolver;
  observer?: IEntitlementDecisionObserver;
}

const EFFECTIVE_STATUSES = new Set(["ACTIVE", "PAST_DUE", "CANCELLED", "EXPIRED", "NONE"]);
const PLAN_KEYS = new Set(["FREE", "PREMIUM"]);
const ENTITLEMENT_KEYS = new Set<string>(CANONICAL_ENTITLEMENT_KEYS);

function isValidDate(value: unknown): value is Date {
  return value instanceof Date && !Number.isNaN(value.getTime());
}

function isCanonicalEntitlementKey(value: string): value is EntitlementKey {
  return ENTITLEMENT_KEYS.has(value);
}

function isValidEntitlementContext(
  value: unknown,
  expectedUserId: string,
): value is EntitlementContext {
  if (!value || typeof value !== "object") return false;

  const context = value as Partial<EntitlementContext>;
  if (context.userId !== expectedUserId) return false;
  if (typeof context.planKey !== "string" || !PLAN_KEYS.has(context.planKey)) return false;
  if (typeof context.status !== "string" || !EFFECTIVE_STATUSES.has(context.status)) return false;
  if (!Array.isArray(context.entitlements)) return false;
  if (!context.entitlements.every((key) => typeof key === "string" && ENTITLEMENT_KEYS.has(key))) {
    return false;
  }
  if (typeof context.isEntitled !== "boolean") return false;
  if (typeof context.cancelAtPeriodEnd !== "boolean") return false;
  if (!isValidDate(context.evaluatedAt)) return false;

  const hasPremium = context.entitlements.includes("PREMIUM_ACCESS");
  if (context.isEntitled !== hasPremium) return false;
  if (context.status !== "ACTIVE" && context.entitlements.length > 0) return false;
  if (context.planKey === "FREE" && context.entitlements.length > 0) return false;

  const startsAt = context.currentPeriodStart;
  const endsAt = context.currentPeriodEnd;
  if (startsAt === null || endsAt === null) {
    return startsAt === null && endsAt === null && context.status === "NONE";
  }
  if (!isValidDate(startsAt) || !isValidDate(endsAt)) return false;
  return startsAt.getTime() <= endsAt.getTime();
}

function configurationError(): AppError {
  return new AppError(
    "Entitlement authorization configuration is invalid",
    ERROR_CODES.INTERNAL_ERROR,
    HTTP_STATUS.INTERNAL_SERVER_ERROR,
  );
}

function resolutionError(): AppError {
  return new AppError(
    "Entitlement authorization is temporarily unavailable",
    ERROR_CODES.INTERNAL_ERROR,
    HTTP_STATUS.INTERNAL_SERVER_ERROR,
  );
}

async function observeDecision(
  observer: IEntitlementDecisionObserver | undefined,
  event: EntitlementDecisionEvent,
): Promise<void> {
  if (!observer) return;

  try {
    await observer.observe(Object.freeze({ ...event }));
  } catch {
    logger.warn("Entitlement decision observer failed", {
      entitlementKey: event.entitlementKey,
      outcome: event.outcome,
      reason: "OBSERVER_FAILURE",
    });
  }
}

function decisionEvent(
  req: EntitlementAuthorizedRequest,
  entitlementKey: string,
  outcome: EntitlementDecisionEvent["outcome"],
  reason: EntitlementDecisionReason,
): EntitlementDecisionEvent {
  return {
    entitlementKey,
    outcome,
    reason,
    ...(req.id ? { requestId: req.id } : {}),
  };
}

export function requireEntitlement(
  requiredEntitlement: EntitlementKey,
  options: RequireEntitlementOptions,
) {
  return async (
    req: EntitlementAuthorizedRequest,
    _res: Response,
    next: NextFunction,
  ): Promise<void> => {
    if (!req.user) {
      next(
        new AppError(
          "Authentication required",
          ERROR_CODES.UNAUTHENTICATED,
          HTTP_STATUS.UNAUTHORIZED,
        ),
      );
      return;
    }

    if (!isCanonicalEntitlementKey(requiredEntitlement)) {
      await observeDecision(
        options.observer,
        decisionEvent(req, "UNKNOWN", "ERROR", "INVALID_KEY"),
      );
      next(configurationError());
      return;
    }

    let context: EntitlementContext;
    try {
      context = await options.resolver.resolveUserEntitlement(req.user.id);
    } catch {
      await observeDecision(
        options.observer,
        decisionEvent(req, requiredEntitlement, "ERROR", "RESOLUTION_FAILED"),
      );
      next(resolutionError());
      return;
    }

    if (!isValidEntitlementContext(context, req.user.id)) {
      await observeDecision(
        options.observer,
        decisionEvent(req, requiredEntitlement, "ERROR", "INVALID_CONTEXT"),
      );
      next(resolutionError());
      return;
    }

    if (!context.entitlements.includes(requiredEntitlement)) {
      await observeDecision(
        options.observer,
        decisionEvent(req, requiredEntitlement, "DENY", "ENTITLEMENT_MISSING"),
      );
      next(
        new AppError(
          "Required entitlement is not available",
          ERROR_CODES.ENTITLEMENT_REQUIRED,
          HTTP_STATUS.FORBIDDEN,
        ),
      );
      return;
    }

    req.entitlement = Object.freeze({
      userId: req.user.id,
      entitlementKey: requiredEntitlement,
      evaluatedAt: context.evaluatedAt.toISOString(),
    });
    await observeDecision(
      options.observer,
      decisionEvent(req, requiredEntitlement, "ALLOW", "ENTITLEMENT_PRESENT"),
    );
    next();
  };
}
