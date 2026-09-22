import type { Request } from "express";
import { z } from "zod";
import { ERROR_CODES, HTTP_STATUS } from "@aura/shared";
import { AppError } from "../../shared/errors/error-envelope.js";

/**
 * Strict schema ensuring zero query parameters are accepted on GET subscription routes.
 * Enforces AC-003, AC-009, AC-010: rejects unexpected or authority-bearing query parameters (e.g. userId, plan, status).
 */
export const noQueryParamsSchema = z.object({}).strict();

/**
 * Rejects request bodies on GET subscription read routes.
 * Enforces FR-007, AC-003, AC-010: prevents client-forged body claims or authority overrides.
 */
export function rejectRequestBody(req: Request): void {
  const hasBody =
    req.body !== undefined &&
    req.body !== null &&
    (typeof req.body !== "object" ||
      (Array.isArray(req.body)
        ? req.body.length > 0
        : Object.keys(req.body as Record<string, unknown>).length > 0));

  if (hasBody) {
    throw new AppError(
      "GET subscription read routes do not accept request bodies",
      ERROR_CODES.VALIDATION_ERROR,
      HTTP_STATUS.BAD_REQUEST,
    );
  }
}
