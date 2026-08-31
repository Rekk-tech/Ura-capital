import express, { type Express } from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { getEnv } from "./infrastructure/config/env.js";
import { logger } from "./infrastructure/logging/logger.js";
import { requestLoggingMiddleware } from "./middleware/request-logging.js";
import { errorHandlerMiddleware } from "./middleware/error-handler.js";
import { healthRouter } from "./modules/health/health.route.js";
import { authRouter } from "./modules/auth/auth.route.js";
import { adminRouter } from "./modules/admin/admin.route.js";
import { AppError } from "./shared/errors/error-envelope.js";
import { ERROR_CODES, HTTP_STATUS } from "@aura/shared";

export function createApp(): Express {
  // Validate required environment settings at startup
  const env = getEnv();

  const app = express();

  // Core Security & Utilities Middleware
  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      credentials: true,
    }),
  );
  app.use(express.json());
  app.use(cookieParser());
  app.use(requestLoggingMiddleware);

  // Routes
  app.use(healthRouter);
  app.use(authRouter);
  app.use(adminRouter);

  // 404 Fallback
  app.use((req, _res, next) => {
    next(new AppError(`Endpoint not found: ${req.method} ${req.path}`, ERROR_CODES.NOT_FOUND, HTTP_STATUS.NOT_FOUND));
  });

  // Global Error Handler Middleware
  app.use(errorHandlerMiddleware);

  return app;
}

export function startServer(): void {
  try {
    const env = getEnv();
    const app = createApp();

    const server = app.listen(env.PORT, () => {
      logger.info(`Aura Capital API server listening on http://${env.HOST}:${env.PORT}`, {
        port: env.PORT,
        environment: env.NODE_ENV,
      });
    });

    const shutdown = (signal: string) => {
      logger.info(`Received ${signal}, gracefully shutting down...`);
      server.close(() => {
        logger.info("Server closed successfully.");
        process.exit(0);
      });
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));
  } catch (error) {
    logger.error("Failed to start API server due to configuration or initialization error", {
      error: error instanceof Error ? error.message : String(error),
    });
    process.exit(1);
  }
}

// Start server if executed directly
if (process.env.NODE_ENV !== "test" && !process.env.VITEST) {
  startServer();
}
