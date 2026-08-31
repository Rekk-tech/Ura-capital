import type { Request, Response } from "express";
import { HTTP_STATUS } from "@aura/shared";

export class AdminController {
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
}

export const adminController = new AdminController();
