import { Router, Request, Response, NextFunction } from "express";
import { authenticate } from "../auth/auth.middleware.js";
import { requireAdmin } from "../admin/admin.guard.js";
import { brokerService } from "./broker.service.js";
import { AuthenticatedRequest } from "../auth/auth.types.js";

export const brokerRouter = Router();

// GET /api/brokers - Public Verified Broker Directory
brokerRouter.get("/api/brokers", (_req: Request, res: Response) => {
  const brokers = brokerService.getPublicBrokers();
  res.json({ success: true, data: brokers });
});

// GET /api/brokers/rooms - Public Exclusive Room Catalog
brokerRouter.get("/api/brokers/rooms", (_req: Request, res: Response) => {
  const rooms = brokerService.getPublicRooms();
  res.json({ success: true, data: rooms });
});

// GET /api/brokers/rooms/:roomId - Room Detail & Materials
brokerRouter.get("/api/brokers/rooms/:roomId", (req: Request, res: Response) => {
  const roomId = String(req.params.roomId);
  // If user is authenticated, check their enrollment
  const authHeader = req.headers.authorization;
  let userId: string | undefined;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    try {
      userId = req.query.userId as string | undefined;
    } catch {
      // Ignore optional auth failure for public read
    }
  }
  if (!userId && req.query.userId) {
    userId = req.query.userId as string;
  }

  const room = brokerService.getRoomDetail(roomId, userId);
  if (!room) {
    res.status(404).json({ success: false, error: { message: "Phòng đầu tư không tồn tại" } });
    return;
  }
  res.json({ success: true, data: room });
});

// POST /api/brokers/register - Partner Broker Application (eKYC + UBCKNN License)
brokerRouter.post(
  "/api/brokers/register",
  authenticate,
  (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const payload = req.body;
      if (!payload.fullName || !payload.licenseNumber || !payload.firmName) {
        res.status(400).json({
          success: false,
          error: { message: "Họ tên, số CCHN do UBCKNN cấp và tên CTCK là bắt buộc" },
        });
        return;
      }

      const profile = brokerService.registerBroker(userId, payload);
      res.status(201).json({ success: true, data: profile });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/brokers/rooms/:roomId/enroll - One-Time Entrance Fee Payment & Enrollment
brokerRouter.post(
  "/api/brokers/rooms/:roomId/enroll",
  authenticate,
  (req: AuthenticatedRequest, res: Response) => {
    try {
      const roomId = String(req.params.roomId);
      const user = req.user!;
      const displayName = user.displayName || (user.email ? user.email.split("@")[0] : "Learner") || "Learner";
      const result = brokerService.enrollInRoom(
        user.id,
        user.email,
        displayName,
        roomId
      );
      res.status(200).json({ success: true, data: result });
    } catch (err: any) {
      res.status(400).json({ success: false, error: { message: err?.message || "Lỗi ghi danh" } });
    }
  }
);

// POST /api/brokers/rooms/:roomId/resources - Broker Publishing with Compliance Scan
brokerRouter.post(
  "/api/brokers/rooms/:roomId/resources",
  authenticate,
  (req: AuthenticatedRequest, res: Response) => {
    try {
      const roomId = String(req.params.roomId);
      const userId = req.user!.id;
      const payload = req.body;
      if (!payload.title || !payload.content) {
        res.status(400).json({
          success: false,
          error: { message: "Tiêu đề và nội dung bài học là bắt buộc" },
        });
        return;
      }

      const result = brokerService.addRoomResource(userId, roomId, payload);
      res.status(201).json({ success: true, data: result });
    } catch (err: any) {
      res.status(400).json({ success: false, error: { message: err?.message || "Lỗi xuất bản" } });
    }
  }
);

// Admin Routes
// GET /api/admin/brokers/pending - List Pending Broker Applications
brokerRouter.get(
  "/api/admin/brokers/pending",
  authenticate,
  requireAdmin({ auditDenied: true }),
  (_req: Request, res: Response) => {
    const pending = brokerService.getPendingBrokers();
    res.json({ success: true, data: pending });
  }
);

// POST /api/admin/brokers/:brokerId/verify - Verify or Reject Broker
brokerRouter.post(
  "/api/admin/brokers/:brokerId/verify",
  authenticate,
  requireAdmin({ auditDenied: true }),
  (req: AuthenticatedRequest, res: Response) => {
    try {
      const brokerId = String(req.params.brokerId);
      const adminUserId = req.user!.id;
      const payload = req.body;
      const result = brokerService.verifyBroker(adminUserId, brokerId, payload);
      res.json({ success: true, data: result });
    } catch (err: any) {
      res.status(400).json({ success: false, error: { message: err?.message || "Lỗi thẩm định" } });
    }
  }
);

// GET /api/admin/brokers/compliance - Compliance Alerts Queue
brokerRouter.get(
  "/api/admin/brokers/compliance",
  authenticate,
  requireAdmin({ auditDenied: true }),
  (_req: Request, res: Response) => {
    const flags = brokerService.getComplianceFlags();
    res.json({ success: true, data: flags });
  }
);
