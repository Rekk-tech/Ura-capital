import type { Response, NextFunction } from "express";
import { HTTP_STATUS, ERROR_CODES } from "@aura/shared";
import { AppError } from "../../shared/errors/error-envelope.js";
import type { AuthenticatedRequest } from "../auth/auth.types.js";
import { SimulationOrderService } from "./simulation-order.service.js";

export class SimulationOrderController {
  constructor(private readonly orderService: SimulationOrderService) {}

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

  async submitOrder(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = this.getUserId(req);
      const simulationId = req.params.simulationId as string;
      const order = await this.orderService.submitMarketOrder(userId, simulationId, req.body);
      const statusCode = order.isReplay ? HTTP_STATUS.OK : HTTP_STATUS.CREATED;
      res.status(statusCode).json({ data: order });
    } catch (error) {
      next(error);
    }
  }
}
