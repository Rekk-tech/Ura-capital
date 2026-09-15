import { z } from "zod";
import { ERROR_CODES, HTTP_STATUS } from "@aura/shared";
import { AppError } from "../../shared/errors/error-envelope.js";

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const simulationIdParamSchema = z.object({
  simulationId: z
    .string()
    .min(1, "simulationId must not be empty")
    .regex(uuidRegex, "simulationId must be a valid UUID"),
});

export const listSessionsQuerySchema = z.object({
  status: z.enum(["CREATED", "ACTIVE", "COMPLETED", "CANCELLED"]).optional(),
}).strict();

export const FORBIDDEN_AUTHORITY_FIELDS = new Set([
  "userid",
  "user_id",
  "status",
  "startingcash",
  "starting_cash",
  "cash",
  "cashbalance",
  "cash_balance",
  "portfoliocash",
  "currentcycle",
  "current_cycle",
  "cycle",
  "scenarioid",
  "scenario_id",
  "scenariokey",
  "scenario_key",
  "scenario",
  "portfolioid",
  "portfolio_id",
  "portfolio",
  "startedat",
  "started_at",
  "completedat",
  "completed_at",
  "cancelledat",
  "cancelled_at",
  "createdat",
  "created_at",
  "updatedat",
  "updated_at",
  "realizedpnl",
  "realized_pnl",
  "equity",
  "balance",
  "balances",
  "positions",
  "orders",
  "trades",
]);

/**
 * AC-001: Strict schema rejects userId/status/cash/currentCycle/scenario/timestamp/portfolio authority fields.
 * Any client-owned authority field returns 400 VALIDATION_ERROR.
 */
export function assertNoAuthorityFields(body: unknown): void {
  if (body === null || body === undefined) {
    return;
  }

  if (typeof body !== "object" || Array.isArray(body)) {
    throw new AppError(
      "Request body must be an object",
      ERROR_CODES.VALIDATION_ERROR,
      HTTP_STATUS.BAD_REQUEST,
    );
  }

  const keys = Object.keys(body as Record<string, unknown>);
  for (const key of keys) {
    const normalizedKey = key.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (FORBIDDEN_AUTHORITY_FIELDS.has(normalizedKey)) {
      throw new AppError(
        `Authoritative field '${key}' cannot be provided by client`,
        ERROR_CODES.VALIDATION_ERROR,
        HTTP_STATUS.BAD_REQUEST,
      );
    }
  }

  // Furthermore, in Phase 5 MVP, session creation takes no client parameters
  if (keys.length > 0) {
    throw new AppError(
      `Unexpected field '${keys[0]}' in session creation payload`,
      ERROR_CODES.VALIDATION_ERROR,
      HTTP_STATUS.BAD_REQUEST,
    );
  }
}
