import type { Response, NextFunction } from "express";
import { HTTP_STATUS, ERROR_CODES } from "@aura/shared";
import { AppError } from "../../shared/errors/error-envelope.js";
import type { AuthenticatedRequest } from "../auth/auth.types.js";
import { SimulationValuationService } from "./simulation-valuation.service.js";

export class SimulationValuationController {
  constructor(private readonly valuationService: SimulationValuationService) {}

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

  /**
   * GET /api/simulation/sessions/:simulationId/portfolio
   * Owner-only current portfolio valuation read model.
   */
  async getPortfolio(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = this.getUserId(req);
      const simulationId = req.params.simulationId as string;
      const portfolio = await this.valuationService.getPortfolioValuation(userId, simulationId);
      res.status(HTTP_STATUS.OK).json({ data: portfolio });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/simulation/sessions/:simulationId/orders
   * Owner-only session orders list.
   */
  async getOrders(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = this.getUserId(req);
      const simulationId = req.params.simulationId as string;
      const orders = await this.valuationService.getSessionOrders(userId, simulationId);
      res.status(HTTP_STATUS.OK).json({ data: orders });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/simulation/sessions/:simulationId/trades
   * Owner-only session trades list.
   */
  async getTrades(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = this.getUserId(req);
      const simulationId = req.params.simulationId as string;
      const trades = await this.valuationService.getSessionTrades(userId, simulationId);
      res.status(HTTP_STATUS.OK).json({ data: trades });
    } catch (error) {
      next(error);
    }
  }
}
