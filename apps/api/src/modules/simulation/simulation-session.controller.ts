import type { Response, NextFunction } from "express";
import { HTTP_STATUS, ERROR_CODES } from "@aura/shared";
import { AppError } from "../../shared/errors/error-envelope.js";
import type { AuthenticatedRequest } from "../auth/auth.types.js";
import { SimulationSessionService } from "./simulation-session.service.js";
import {
  simulationIdParamSchema,
  listSessionsQuerySchema,
} from "./simulation-session.validation.js";

export class SimulationSessionController {
  constructor(private readonly sessionService: SimulationSessionService) {}

  private getUserId(req: AuthenticatedRequest): string {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError(
        "Authentication required",
        ERROR_CODES.UNAUTHENTICATED,
        HTTP_STATUS.UNAUTHORIZED,
      );
    }
    return userId;
  }

  async listSessions(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = this.getUserId(req);
      const queryParsed = listSessionsQuerySchema.safeParse(req.query);
      if (!queryParsed.success) {
        throw new AppError(
          "Invalid query parameters",
          ERROR_CODES.VALIDATION_ERROR,
          HTTP_STATUS.BAD_REQUEST,
        );
      }

      const sessions = await this.sessionService.listSessions(userId, queryParsed.data);
      res.status(HTTP_STATUS.OK).json({ data: sessions });
    } catch (error) {
      next(error);
    }
  }

  async createSession(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = this.getUserId(req);
      const session = await this.sessionService.createSession(userId, req.body);
      res.status(HTTP_STATUS.CREATED).json({ data: session });
    } catch (error) {
      next(error);
    }
  }

  async getSessionById(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = this.getUserId(req);
      const paramsParsed = simulationIdParamSchema.safeParse(req.params);
      if (!paramsParsed.success) {
        throw new AppError(
          "Validation failed",
          ERROR_CODES.VALIDATION_ERROR,
          HTTP_STATUS.BAD_REQUEST,
        );
      }

      const session = await this.sessionService.getSessionById(
        userId,
        paramsParsed.data.simulationId,
      );
      res.status(HTTP_STATUS.OK).json({ data: session });
    } catch (error) {
      next(error);
    }
  }

  async startSession(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = this.getUserId(req);
      const paramsParsed = simulationIdParamSchema.safeParse(req.params);
      if (!paramsParsed.success) {
        throw new AppError(
          "Validation failed",
          ERROR_CODES.VALIDATION_ERROR,
          HTTP_STATUS.BAD_REQUEST,
        );
      }

      const session = await this.sessionService.startSession(
        userId,
        paramsParsed.data.simulationId,
      );
      res.status(HTTP_STATUS.OK).json({ data: session });
    } catch (error) {
      next(error);
    }
  }

  async completeSession(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = this.getUserId(req);
      const paramsParsed = simulationIdParamSchema.safeParse(req.params);
      if (!paramsParsed.success) {
        throw new AppError(
          "Validation failed",
          ERROR_CODES.VALIDATION_ERROR,
          HTTP_STATUS.BAD_REQUEST,
        );
      }

      const session = await this.sessionService.completeSession(
        userId,
        paramsParsed.data.simulationId,
      );
      res.status(HTTP_STATUS.OK).json({ data: session });
    } catch (error) {
      next(error);
    }
  }

  async cancelSession(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = this.getUserId(req);
      const paramsParsed = simulationIdParamSchema.safeParse(req.params);
      if (!paramsParsed.success) {
        throw new AppError(
          "Validation failed",
          ERROR_CODES.VALIDATION_ERROR,
          HTTP_STATUS.BAD_REQUEST,
        );
      }

      const session = await this.sessionService.cancelSession(
        userId,
        paramsParsed.data.simulationId,
      );
      res.status(HTTP_STATUS.OK).json({ data: session });
    } catch (error) {
      next(error);
    }
  }

  async resetSession(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = this.getUserId(req);
      const paramsParsed = simulationIdParamSchema.safeParse(req.params);
      if (!paramsParsed.success) {
        throw new AppError(
          "Validation failed",
          ERROR_CODES.VALIDATION_ERROR,
          HTTP_STATUS.BAD_REQUEST,
        );
      }

      const result = await this.sessionService.resetSession(
        userId,
        paramsParsed.data.simulationId,
      );
      res.status(HTTP_STATUS.CREATED).json({
        data: result.newSession,
        meta: {
          previousSessionId: result.previousSession.id,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}
