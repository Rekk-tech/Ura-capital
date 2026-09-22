import { describe, it, expect, vi } from "vitest";
import type { Request, Response, NextFunction } from "express";
import { SubscriptionController } from "../../src/modules/subscription/subscription.controller.js";
import type { SubscriptionReadService } from "../../src/modules/subscription/subscription-read.service.js";
import { AppError } from "../../src/shared/errors/error-envelope.js";
import { HTTP_STATUS, ERROR_CODES } from "@aura/shared";
import { ZodError } from "zod";
import type { AuthenticatedUser } from "../../src/modules/auth/auth.types.js";

describe("FEAT-050 SubscriptionController", () => {
  const mockService = {
    getPlans: vi.fn(),
    getCurrentUserSubscription: vi.fn(),
  } as unknown as SubscriptionReadService;

  const controller = new SubscriptionController(mockService);

  function createMockReq(
    overrides: Partial<Request & { user?: AuthenticatedUser }> = {},
  ): Request {
    return {
      query: {},
      body: undefined,
      headers: {},
      ...overrides,
    } as unknown as Request;
  }

  function createMockRes(): {
    res: Response;
    statusSpy: ReturnType<typeof vi.fn>;
    jsonSpy: ReturnType<typeof vi.fn>;
  } {
    const jsonSpy = vi.fn();
    const statusSpy = vi.fn().mockReturnValue({ json: jsonSpy });
    const res = {
      status: statusSpy,
      json: jsonSpy,
    } as unknown as Response;
    return { res, statusSpy, jsonSpy };
  }


  const next: NextFunction = vi.fn();

  describe("getPlans", () => {
    it("returns 200 OK with plans when query is empty and body is undefined", async () => {
      const mockResult = {
        data: [
          {
            planKey: "FREE" as const,
            name: "Free Plan",
            description: "Standard access.",
            entitlements: [],
            available: true,
          },
        ],
      };
      vi.mocked(mockService.getPlans).mockReturnValueOnce(mockResult);

      const req = createMockReq();
      const { res, statusSpy, jsonSpy } = createMockRes();

      await controller.getPlans(req, res, next);

      expect(statusSpy).toHaveBeenCalledWith(HTTP_STATUS.OK);
      expect(jsonSpy).toHaveBeenCalledWith(mockResult);
      expect(next).not.toHaveBeenCalled();
    });

    it("rejects unexpected query parameters (AC-003, AC-010)", async () => {
      const req = createMockReq({ query: { userId: "malicious-user" } });
      const { res } = createMockRes();
      const nextFn = vi.fn();

      await controller.getPlans(req, res, nextFn);

      expect(nextFn).toHaveBeenCalled();
      const error = nextFn.mock.calls[0][0];
      expect(error).toBeInstanceOf(ZodError);
    });

    it("rejects non-empty request body on GET (AC-003, AC-011)", async () => {
      const req = createMockReq({ body: { extraField: "test" } });
      const { res } = createMockRes();
      const nextFn = vi.fn();

      await controller.getPlans(req, res, nextFn);

      expect(nextFn).toHaveBeenCalled();
      const error = nextFn.mock.calls[0][0];
      expect(error).toBeInstanceOf(AppError);
      expect((error as AppError).statusCode).toBe(HTTP_STATUS.BAD_REQUEST);
      expect((error as AppError).code).toBe(ERROR_CODES.VALIDATION_ERROR);
    });
  });

  describe("getMe", () => {
    it("returns 200 OK with current user projection for authenticated user", async () => {
      const userId = "authenticated-user-uuid";
      const mockResult = {
        data: {
          plan: "FREE" as const,
          planKey: "FREE" as const,
          status: "NONE" as const,
          entitlements: [],
          isEntitled: false,
          currentPeriodStart: null,
          currentPeriodEnd: null,
          cancelAtPeriodEnd: false,
        },
      };

      vi.mocked(mockService.getCurrentUserSubscription).mockResolvedValueOnce(mockResult);

      const req = createMockReq({
        user: { id: userId, email: "user@test.com", displayName: "User", status: "ACTIVE", createdAt: "" },
      });
      const { res, statusSpy, jsonSpy } = createMockRes();
      const nextFn = vi.fn();

      await controller.getMe(req, res, nextFn);

      expect(statusSpy).toHaveBeenCalledWith(HTTP_STATUS.OK);
      expect(jsonSpy).toHaveBeenCalledWith(mockResult);
      expect(mockService.getCurrentUserSubscription).toHaveBeenCalledWith(userId);
      expect(nextFn).not.toHaveBeenCalled();
    });

    it("throws 401 UNAUTHENTICATED if req.user is absent or invalid (AC-002, AC-012)", async () => {
      const req = createMockReq({ user: undefined });
      const { res } = createMockRes();
      const nextFn = vi.fn();

      await controller.getMe(req, res, nextFn);

      expect(nextFn).toHaveBeenCalled();
      const error = nextFn.mock.calls[0][0];
      expect(error).toBeInstanceOf(AppError);
      expect((error as AppError).statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect((error as AppError).code).toBe(ERROR_CODES.UNAUTHENTICATED);
    });

    it("rejects unexpected query parameters on /me (AC-003, AC-009)", async () => {
      const req = createMockReq({
        query: { userId: "other-user-uuid" },
        user: { id: "user-1", email: "u@t.com", displayName: "U", status: "ACTIVE", createdAt: "" },
      });
      const { res } = createMockRes();
      const nextFn = vi.fn();

      await controller.getMe(req, res, nextFn);

      expect(nextFn).toHaveBeenCalled();
      const error = nextFn.mock.calls[0][0];
      expect(error).toBeInstanceOf(ZodError);
    });

    it("rejects non-empty body payload on /me (AC-003, AC-010)", async () => {
      const req = createMockReq({
        body: { userId: "forged-id", plan: "PREMIUM" },
        user: { id: "user-1", email: "u@t.com", displayName: "U", status: "ACTIVE", createdAt: "" },
      });
      const { res } = createMockRes();
      const nextFn = vi.fn();

      await controller.getMe(req, res, nextFn);

      expect(nextFn).toHaveBeenCalled();
      const error = nextFn.mock.calls[0][0];
      expect(error).toBeInstanceOf(AppError);
      expect((error as AppError).statusCode).toBe(HTTP_STATUS.BAD_REQUEST);
    });

    it("forwards service errors to next()", async () => {
      const userId = "user-1";
      vi.mocked(mockService.getCurrentUserSubscription).mockRejectedValueOnce(
        new Error("Database connection lost"),
      );

      const req = createMockReq({
        user: { id: userId, email: "u@t.com", displayName: "U", status: "ACTIVE", createdAt: "" },
      });
      const { res } = createMockRes();
      const nextFn = vi.fn();

      await controller.getMe(req, res, nextFn);


      expect(nextFn).toHaveBeenCalled();
      const error = nextFn.mock.calls[0][0];
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toBe("Database connection lost");
    });
  });
});
