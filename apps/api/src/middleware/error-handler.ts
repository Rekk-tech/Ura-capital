import type { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { ERROR_CODES, HTTP_STATUS } from "@aura/shared";
import { AppError, createErrorEnvelope } from "../shared/errors/error-envelope.js";
import { logger } from "../infrastructure/logging/logger.js";
import { classifyAndSanitizeError } from "../infrastructure/logging/error-sanitizer.js";

export function errorHandlerMiddleware(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const requestId = req.id;
  const sanitized = classifyAndSanitizeError(err);

  logger.error("Unhandled error caught in middleware", {
    requestId,
    path: req.path,
    method: req.method,
    category: sanitized.category,
    code: sanitized.code,
    error: sanitized.message,
  });

  if (err instanceof AppError) {
    res.status(err.statusCode).json(createErrorEnvelope(err.message, err.code, requestId, err.details));
    return;
  }

  if (err instanceof ZodError) {
    const details = err.errors.reduce(
      (acc, curr) => {
        acc[curr.path.join(".")] = curr.message;
        return acc;
      },
      {} as Record<string, unknown>,
    );

    res
      .status(HTTP_STATUS.BAD_REQUEST)
      .json(
        createErrorEnvelope(
          "Validation failed for request",
          ERROR_CODES.VALIDATION_ERROR,
          requestId,
          details,
        ),
      );
    return;
  }

  // Always return a stable generic message to prevent leaking internal database / system error details
  res
    .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
    .json(
      createErrorEnvelope(
        "An unexpected internal server error occurred",
        ERROR_CODES.INTERNAL_ERROR,
        requestId,
      ),
    );
}
