import type { Request, Response, NextFunction } from "express";
import crypto from "node:crypto";
import { logger } from "../infrastructure/logging/logger.js";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      id?: string;
      startTime?: number;
    }
  }
}

export function requestLoggingMiddleware(req: Request, res: Response, next: NextFunction): void {
  const requestId = (req.headers["x-request-id"] as string) || crypto.randomUUID();
  const startTime = Date.now();

  req.id = requestId;
  req.startTime = startTime;
  res.setHeader("X-Request-ID", requestId);

  res.on("finish", () => {
    const durationMs = Date.now() - startTime;
    logger.info("Request completed", {
      requestId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      durationMs,
    });
  });

  next();
}
