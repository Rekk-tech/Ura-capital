import { Router } from "express";
import { authenticate } from "../auth/auth.middleware.js";
import { requireAdmin } from "./admin.guard.js";
import { adminController } from "./admin.controller.js";

export const adminRouter: Router = Router();

// Canonical GET /admin/ping endpoint
adminRouter.get("/admin/ping", authenticate, requireAdmin({ auditDenied: true }), (req, res) => {
  adminController.ping(req, res);
});
