import { Router, Request, Response, NextFunction } from "express";
import { authenticate } from "../auth/auth.middleware.js";
import { requireAdmin } from "./admin.guard.js";
import { adminController } from "./admin.controller.js";

export const adminRouter: Router = Router();

// Canonical GET /admin/ping endpoint
adminRouter.get("/admin/ping", authenticate, requireAdmin({ auditDenied: true }), (req, res) => {
  adminController.ping(req, res);
});

// PATCH /admin/users/:userId/status & /api/admin/users/:userId/status
const handleStatusUpdate = (req: Request, res: Response, next: NextFunction) => adminController.updateUserStatus(req, res, next);
adminRouter.patch("/admin/users/:userId/status", authenticate, requireAdmin({ auditDenied: true }), handleStatusUpdate);
adminRouter.patch("/api/admin/users/:userId/status", authenticate, requireAdmin({ auditDenied: true }), handleStatusUpdate);

// PATCH /admin/users/:userId/role & /api/admin/users/:userId/role
const handleRoleUpdate = (req: Request, res: Response, next: NextFunction) => adminController.updateUserRole(req, res, next);
adminRouter.patch("/admin/users/:userId/role", authenticate, requireAdmin({ auditDenied: true }), handleRoleUpdate);
adminRouter.patch("/api/admin/users/:userId/role", authenticate, requireAdmin({ auditDenied: true }), handleRoleUpdate);

// POST /admin/simulation/:sessionId/reset & /api/admin/simulation/:sessionId/reset
const handleSessionReset = (req: Request, res: Response, next: NextFunction) => adminController.resetSimulationSession(req, res, next);
adminRouter.post("/admin/simulation/:sessionId/reset", authenticate, requireAdmin({ auditDenied: true }), handleSessionReset);
adminRouter.post("/api/admin/simulation/:sessionId/reset", authenticate, requireAdmin({ auditDenied: true }), handleSessionReset);

