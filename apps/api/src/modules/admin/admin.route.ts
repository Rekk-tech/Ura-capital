import { Router, Request, Response, NextFunction } from "express";
import { authenticate } from "../auth/auth.middleware.js";
import { requireAdmin } from "./admin.guard.js";
import { adminController } from "./admin.controller.js";

export const adminRouter: Router = Router();

// Canonical GET /admin/ping & /api/admin/ping endpoint
adminRouter.get("/admin/ping", authenticate, requireAdmin({ auditDenied: true }), (req, res) => {
  adminController.ping(req, res);
});
adminRouter.get("/api/admin/ping", authenticate, requireAdmin({ auditDenied: true }), (req, res) => {
  adminController.ping(req, res);
});

// GET /admin/metrics & /api/admin/metrics
const handleGetMetrics = (req: Request, res: Response, next: NextFunction) => adminController.getSystemMetrics(req, res, next);
adminRouter.get("/admin/metrics", authenticate, requireAdmin({ auditDenied: true }), handleGetMetrics);
adminRouter.get("/api/admin/metrics", authenticate, requireAdmin({ auditDenied: true }), handleGetMetrics);

// GET /admin/users & /api/admin/users
const handleListUsers = (req: Request, res: Response, next: NextFunction) => adminController.listUsers(req, res, next);
adminRouter.get("/admin/users", authenticate, requireAdmin({ auditDenied: true }), handleListUsers);
adminRouter.get("/api/admin/users", authenticate, requireAdmin({ auditDenied: true }), handleListUsers);

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

// GET /admin/users/:userId/learner-details & /api/admin/users/:userId/learner-details
const handleGetLearnerDetails = (req: Request, res: Response, next: NextFunction) => adminController.getLearnerDetails(req, res, next);
adminRouter.get("/admin/users/:userId/learner-details", authenticate, requireAdmin({ auditDenied: true }), handleGetLearnerDetails);
adminRouter.get("/api/admin/users/:userId/learner-details", authenticate, requireAdmin({ auditDenied: true }), handleGetLearnerDetails);

// GET /admin/moderation & /api/admin/moderation
const handleListModeration = (req: Request, res: Response, next: NextFunction) => adminController.listModerationQueue(req, res, next);
adminRouter.get("/admin/moderation", authenticate, requireAdmin({ auditDenied: true }), handleListModeration);
adminRouter.get("/api/admin/moderation", authenticate, requireAdmin({ auditDenied: true }), handleListModeration);

// POST /admin/moderation/:itemId/resolve & /api/admin/moderation/:itemId/resolve
const handleResolveModeration = (req: Request, res: Response, next: NextFunction) => adminController.resolveModerationItem(req, res, next);
adminRouter.post("/admin/moderation/:itemId/resolve", authenticate, requireAdmin({ auditDenied: true }), handleResolveModeration);
adminRouter.post("/api/admin/moderation/:itemId/resolve", authenticate, requireAdmin({ auditDenied: true }), handleResolveModeration);

// GET /admin/audit & /api/admin/audit
const handleListAudit = (req: Request, res: Response, next: NextFunction) => adminController.listAuditRecords(req, res, next);
adminRouter.get("/admin/audit", authenticate, requireAdmin({ auditDenied: true }), handleListAudit);
adminRouter.get("/api/admin/audit", authenticate, requireAdmin({ auditDenied: true }), handleListAudit);


