import type { Response, NextFunction } from "express";
import type { AuthenticatedRequest } from "../../auth/auth.types.js";
import { AppError } from "../../../shared/errors/error-envelope.js";
import { ERROR_CODES, HTTP_STATUS } from "@aura/shared";
import {
  map2MacroEngineService,
  Map2MacroEngineService,
  Map2Allocation,
} from "./map2-macro-engine.service.js";

export class Map2GameController {
  constructor(
    private readonly map2Service: Map2MacroEngineService = map2MacroEngineService,
  ) {}

  private requireUser(req: AuthenticatedRequest) {
    if (!req.user) {
      throw new AppError(
        "Authentication required",
        ERROR_CODES.UNAUTHENTICATED,
        HTTP_STATUS.UNAUTHORIZED,
      );
    }
    return req.user;
  }

  async start(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const user = this.requireUser(req);
      const session = this.map2Service.startSession(user.id);
      res.status(HTTP_STATUS.CREATED).json({ data: session });
    } catch (err) {
      next(err);
    }
  }

  async getSession(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      this.requireUser(req);
      const id = String(req.params.id);
      if (!id) {
        throw new AppError(
          "Session ID is required",
          ERROR_CODES.VALIDATION_ERROR,
          HTTP_STATUS.BAD_REQUEST,
        );
      }
      const session = this.map2Service.getSession(id);
      if (!session) {
        throw new AppError(
          "Session not found",
          ERROR_CODES.NOT_FOUND,
          HTTP_STATUS.NOT_FOUND,
        );
      }
      res.status(HTTP_STATUS.OK).json({ data: session });
    } catch (err) {
      next(err);
    }
  }

  async allocate(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      this.requireUser(req);
      const id = String(req.params.id);
      if (!id) {
        throw new AppError(
          "Session ID is required",
          ERROR_CODES.VALIDATION_ERROR,
          HTTP_STATUS.BAD_REQUEST,
        );
      }
      const allocation = req.body as Map2Allocation;
      if (!allocation) {
        throw new AppError(
          "Allocation object is required",
          ERROR_CODES.VALIDATION_ERROR,
          HTTP_STATUS.BAD_REQUEST,
        );
      }

      const result = this.map2Service.setAllocation(id, allocation);
      res.status(HTTP_STATUS.OK).json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  async submitQuiz(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      this.requireUser(req);
      const id = String(req.params.id);
      const { quarter, quizId, selectedOption } = req.body;

      if (!id || !quarter || !quizId || !selectedOption) {
        throw new AppError(
          "quarter, quizId, and selectedOption are required",
          ERROR_CODES.VALIDATION_ERROR,
          HTTP_STATUS.BAD_REQUEST,
        );
      }

      const result = this.map2Service.submitQuiz(
        id,
        Number(quarter),
        String(quizId),
        String(selectedOption),
      );
      res.status(HTTP_STATUS.OK).json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  async commitQuarter(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      this.requireUser(req);
      const id = String(req.params.id);
      if (!id) {
        throw new AppError(
          "Session ID is required",
          ERROR_CODES.VALIDATION_ERROR,
          HTTP_STATUS.BAD_REQUEST,
        );
      }

      const { allocation, quiz } = req.body ?? {};
      const result = await this.map2Service.commitQuarter(id, allocation, quiz);
      res.status(HTTP_STATUS.OK).json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  async getReport(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      this.requireUser(req);
      const id = String(req.params.id);
      if (!id) {
        throw new AppError(
          "Session ID is required",
          ERROR_CODES.VALIDATION_ERROR,
          HTTP_STATUS.BAD_REQUEST,
        );
      }

      const report = this.map2Service.generateFinalReport(id);
      res.status(HTTP_STATUS.OK).json({ data: report });
    } catch (err) {
      next(err);
    }
  }
}

export const map2GameController = new Map2GameController();
