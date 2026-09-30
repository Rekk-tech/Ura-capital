import type { Response, NextFunction } from "express";
import type { AuthenticatedRequest } from "../../auth/auth.types.js";
import { AppError } from "../../../shared/errors/error-envelope.js";
import { ERROR_CODES, HTTP_STATUS } from "@aura/shared";
import {
  map1FomoEngineService,
  Map1FomoEngineService,
  Map1OrderInput,
} from "./map1-fomo-engine.service.js";

export class Map1GameController {
  constructor(
    private readonly map1Service: Map1FomoEngineService = map1FomoEngineService,
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
      const session = this.map1Service.startSession(user.id);
      const state = this.map1Service.getCurrentState(session.id);
      res.status(HTTP_STATUS.CREATED).json({
        data: {
          session,
          state,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  async getState(
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
      const state = this.map1Service.getCurrentState(id);
      res.status(HTTP_STATUS.OK).json({ data: state });
    } catch (err) {
      next(err);
    }
  }

  async submitOrder(
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

      const input = req.body as Map1OrderInput;
      if (!input || !input.action) {
        throw new AppError(
          "Action (BUY, SELL, HOLD) is required",
          ERROR_CODES.VALIDATION_ERROR,
          HTTP_STATUS.BAD_REQUEST,
        );
      }

      const updatedState = this.map1Service.submitOrder(id, input);
      res.status(HTTP_STATUS.OK).json({ data: updatedState });
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
      const { round, quizId, selectedOption, trapId } = req.body;

      if (!id) {
        throw new AppError(
          "Session ID is required",
          ERROR_CODES.VALIDATION_ERROR,
          HTTP_STATUS.BAD_REQUEST,
        );
      }

      // Handle trap popup submission
      if (trapId) {
        const result = this.map1Service.submitTrap(
          id,
          Number(round),
          String(trapId),
          String(selectedOption),
        );
        res.status(HTTP_STATUS.OK).json({ data: result });
        return;
      }

      // Handle standard timed mini-quiz
      if (!quizId || !selectedOption) {
        throw new AppError(
          "quizId and selectedOption are required",
          ERROR_CODES.VALIDATION_ERROR,
          HTTP_STATUS.BAD_REQUEST,
        );
      }

      const result = this.map1Service.submitQuiz(
        id,
        Number(round),
        String(quizId),
        String(selectedOption),
      );
      res.status(HTTP_STATUS.OK).json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  async finish(
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
      const debrief = this.map1Service.finishSession(id);
      res.status(HTTP_STATUS.OK).json({ data: debrief });
    } catch (err) {
      next(err);
    }
  }
}

export const map1GameController = new Map1GameController();
