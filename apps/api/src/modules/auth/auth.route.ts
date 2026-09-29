import { Router, type Response } from "express";
import { registrationController } from "./registration.controller.js";
import { loginController } from "./login.controller.js";
import { refreshController } from "./refresh.controller.js";
import { logoutController } from "./logout.controller.js";
import { profileController } from "./profile.controller.js";
import { authenticate } from "./auth.middleware.js";
import type { AuthenticatedRequest } from "./auth.types.js";
import { HTTP_STATUS } from "@aura/shared";
import {
  createLoginRateLimiter,
  createRegisterRateLimiter,
  createRefreshRateLimiter,
} from "./rate-limit/index.js";

const router = Router();

// FEAT-010A Rate-limit middleware instances
const loginRateLimiter = createLoginRateLimiter();
const registerRateLimiter = createRegisterRateLimiter();
const refreshRateLimiter = createRefreshRateLimiter();

// FEAT-003 Registration Endpoints (with FEAT-010A rate limiting)
router.post("/auth/register", registerRateLimiter, (req, res, next) => registrationController.register(req, res, next));
router.post("/api/auth/register", registerRateLimiter, (req, res, next) => registrationController.register(req, res, next));

// FEAT-004 Login Endpoints (with FEAT-010A rate limiting)
router.post("/auth/login", loginRateLimiter, (req, res, next) => loginController.login(req, res, next));
router.post("/api/auth/login", loginRateLimiter, (req, res, next) => loginController.login(req, res, next));

// FEAT-005 Refresh Endpoints (with FEAT-010A rate limiting)
router.post("/auth/refresh", refreshRateLimiter, (req, res, next) => refreshController.refresh(req, res, next));
router.post("/api/auth/refresh", refreshRateLimiter, (req, res, next) => refreshController.refresh(req, res, next));

// FEAT-006 Logout Endpoints
router.post("/auth/logout", (req, res, next) => logoutController.logout(req, res, next));
router.post("/api/auth/logout", (req, res, next) => logoutController.logout(req, res, next));

// FEAT-004 Representative Protected Verification Endpoint
const meHandler = (req: AuthenticatedRequest, res: Response): void => {
  res.status(HTTP_STATUS.OK).json({ user: req.user });
};

router.get("/auth/me", authenticate, (req, res) => meHandler(req as AuthenticatedRequest, res));
router.get("/api/auth/me", authenticate, (req, res) => meHandler(req as AuthenticatedRequest, res));

// FEAT-078 User Profile & Account Settings Endpoints
router.get("/auth/profile", authenticate, (req, res, next) => profileController.getProfile(req as AuthenticatedRequest, res, next));
router.get("/api/auth/profile", authenticate, (req, res, next) => profileController.getProfile(req as AuthenticatedRequest, res, next));
router.patch("/auth/profile", authenticate, (req, res, next) => profileController.updateProfile(req as AuthenticatedRequest, res, next));
router.patch("/api/auth/profile", authenticate, (req, res, next) => profileController.updateProfile(req as AuthenticatedRequest, res, next));
router.post("/auth/change-password", authenticate, (req, res, next) => profileController.changePassword(req as AuthenticatedRequest, res, next));
router.post("/api/auth/change-password", authenticate, (req, res, next) => profileController.changePassword(req as AuthenticatedRequest, res, next));
router.get("/auth/sessions", authenticate, (req, res, next) => profileController.listSessions(req as AuthenticatedRequest, res, next));
router.get("/api/auth/sessions", authenticate, (req, res, next) => profileController.listSessions(req as AuthenticatedRequest, res, next));

export const authRouter = router;


