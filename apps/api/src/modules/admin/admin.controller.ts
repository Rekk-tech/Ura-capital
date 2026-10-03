import type { Request, Response, NextFunction } from "express";
import { HTTP_STATUS, ERROR_CODES } from "@aura/shared";
import { AppError } from "../../shared/errors/error-envelope.js";
import type { AuthenticatedRequest } from "../auth/auth.types.js";
import { adminService, AdminService } from "./admin.service.js";

export class AdminController {
  constructor(private readonly service: AdminService = adminService) {}

  /**
   * Minimal representative admin ping endpoint.
   * Returns strictly minimal safe response without exposing user, role, token, DB, or internal state.
   */
  ping(_req: Request, res: Response): void {
    res.status(HTTP_STATUS.OK).json({
      status: "ok",
      scope: "admin",
    });
  }

  async updateUserStatus(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const actorId = req.user?.id;
      if (!actorId) {
        throw new AppError("Authentication required", ERROR_CODES.UNAUTHENTICATED, HTTP_STATUS.UNAUTHORIZED);
      }
      const rawUserId = req.params.userId;
      const userId = Array.isArray(rawUserId) ? rawUserId[0] : rawUserId;
      const { status, reason } = req.body;
      if (!userId || !status) {
        throw new AppError("userId and status are required", ERROR_CODES.VALIDATION_ERROR, HTTP_STATUS.BAD_REQUEST);
      }
      const result = await this.service.updateUserStatus(actorId, userId, status, reason);
      res.status(HTTP_STATUS.OK).json(result);
    } catch (error) {
      next(error);
    }
  }

  async updateUserRole(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const actorId = req.user?.id;
      if (!actorId) {
        throw new AppError("Authentication required", ERROR_CODES.UNAUTHENTICATED, HTTP_STATUS.UNAUTHORIZED);
      }
      const rawUserId = req.params.userId;
      const userId = Array.isArray(rawUserId) ? rawUserId[0] : rawUserId;
      const { role } = req.body;
      if (!userId || !role) {
        throw new AppError("userId and role are required", ERROR_CODES.VALIDATION_ERROR, HTTP_STATUS.BAD_REQUEST);
      }
      const result = await this.service.updateUserRole(actorId, userId, role);
      res.status(HTTP_STATUS.OK).json(result);
    } catch (error) {
      next(error);
    }
  }

  async resetSimulationSession(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const actorId = req.user?.id;
      if (!actorId) {
        throw new AppError("Authentication required", ERROR_CODES.UNAUTHENTICATED, HTTP_STATUS.UNAUTHORIZED);
      }
      const rawSessionId = req.params.sessionId;
      const sessionId = Array.isArray(rawSessionId) ? rawSessionId[0] : rawSessionId;
      if (!sessionId) {
        throw new AppError("sessionId is required", ERROR_CODES.VALIDATION_ERROR, HTTP_STATUS.BAD_REQUEST);
      }
      const result = await this.service.resetSimulationSession(actorId, sessionId);
      res.status(HTTP_STATUS.OK).json(result);
    } catch (error) {
      next(error);
    }
  }
}

export const adminController = new AdminController();
