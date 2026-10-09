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

  async getSystemMetrics(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await this.service.getSystemMetrics();
      res.status(HTTP_STATUS.OK).json(result);
    } catch (error) {
      next(error);
    }
  }

  async listUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { search, status, role, page, limit } = req.query;
      const result = await this.service.listUsers({
        search: typeof search === "string" ? search : undefined,
        status: typeof status === "string" ? status : undefined,
        role: typeof role === "string" ? role : undefined,
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
      });
      res.status(HTTP_STATUS.OK).json(result);
    } catch (error) {
      next(error);
    }
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

  async listModerationQueue(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { status, targetType, page, limit } = req.query;
      const result = await this.service.listModerationQueue({
        status: typeof status === "string" ? status : undefined,
        targetType: typeof targetType === "string" ? targetType : undefined,
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
      });
      res.status(HTTP_STATUS.OK).json(result);
    } catch (error) {
      next(error);
    }
  }

  async resolveModerationItem(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const actorId = req.user?.id;
      if (!actorId) {
        throw new AppError("Authentication required", ERROR_CODES.UNAUTHENTICATED, HTTP_STATUS.UNAUTHORIZED);
      }
      const rawItemId = req.params.itemId;
      const itemId = Array.isArray(rawItemId) ? rawItemId[0] : rawItemId;
      const { action, notes } = req.body;
      if (!itemId || !action) {
        throw new AppError("itemId and action are required", ERROR_CODES.VALIDATION_ERROR, HTTP_STATUS.BAD_REQUEST);
      }
      if (!["DISMISS", "HIDE", "DELETE"].includes(action)) {
        throw new AppError("action must be DISMISS, HIDE, or DELETE", ERROR_CODES.VALIDATION_ERROR, HTTP_STATUS.BAD_REQUEST);
      }
      const result = await this.service.resolveModerationItem(actorId, itemId, action, notes);
      res.status(HTTP_STATUS.OK).json(result);
    } catch (error) {
      next(error);
    }
  }

  async listAuditRecords(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { eventType, actorId, page, limit } = req.query;
      const result = await this.service.listAuditRecords({
        eventType: typeof eventType === "string" ? eventType : undefined,
        actorId: typeof actorId === "string" ? actorId : undefined,
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
      });
      res.status(HTTP_STATUS.OK).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getLearnerDetails(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const rawUserId = req.params.userId;
      const userId = Array.isArray(rawUserId) ? rawUserId[0] : rawUserId;
      if (!userId) {
        throw new AppError("userId is required", ERROR_CODES.VALIDATION_ERROR, HTTP_STATUS.BAD_REQUEST);
      }
      const result = await this.service.getLearnerDetails(userId);
      res.status(HTTP_STATUS.OK).json(result);
    } catch (error) {
      next(error);
    }
  }
}

export const adminController = new AdminController();

