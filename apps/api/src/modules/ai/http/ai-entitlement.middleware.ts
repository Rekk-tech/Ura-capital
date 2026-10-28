import type { Request, Response, NextFunction } from "express";
import { AppError } from "../../../shared/errors/error-envelope.js";
import { ERROR_CODES, HTTP_STATUS } from "@aura/shared";
import { type IEntitlementResolver, systemClock } from "../../subscription/subscription-entitlement.types.js";
import { SubscriptionEntitlementService } from "../../subscription/subscription-entitlement.service.js";
import { createRepositoryContainer } from "../../../infrastructure/database/repository-factory.js";

let defaultEntitlementResolver: IEntitlementResolver | null = null;

function getDefaultResolver(): IEntitlementResolver {
  if (!defaultEntitlementResolver) {
    const repos = createRepositoryContainer();
    defaultEntitlementResolver = new SubscriptionEntitlementService(
      repos.subscriptionRepo,
      systemClock,
    );
  }
  return defaultEntitlementResolver;
}

export function createAiEntitlementMiddleware(
  resolverGetter: () => IEntitlementResolver = getDefaultResolver,
) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as unknown as { user?: { id?: string; role?: string; roles?: string[] } }).user;
      if (!user || !user.id) {
        throw new AppError(
          "Yêu cầu xác thực tài khoản để truy cập Cố vấn AI",
          ERROR_CODES.UNAUTHENTICATED,
          HTTP_STATUS.UNAUTHORIZED,
        );
      }

      // 1. Administrators possess elevated system authority (bypass subscription paywall)
      if (user.role === "ADMIN" || (Array.isArray(user.roles) && user.roles.includes("ADMIN"))) {
        return next();
      }

      // 2. Resolve subscription entitlement for learners
      const resolver = resolverGetter();
      const entitlementContext = await resolver.resolveUserEntitlement(user.id);

      if (
        entitlementContext.isEntitled &&
        entitlementContext.entitlements.includes("PREMIUM_ACCESS")
      ) {
        return next();
      }

      // 3. User is on FREE tier or lacks active membership
      throw new AppError(
        "Tính năng Cố vấn AI Aura Intelligence chỉ dành riêng cho Hội viên đăng ký gói dịch vụ (PREMIUM) hoặc Quản trị viên hệ thống. Vui lòng nâng cấp gói hội viên để tiếp tục.",
        ERROR_CODES.AI_MEMBERSHIP_REQUIRED,
        HTTP_STATUS.FORBIDDEN,
      );
    } catch (err: unknown) {
      next(err);
    }
  };
}

export const requireAiEntitlement = createAiEntitlementMiddleware();
