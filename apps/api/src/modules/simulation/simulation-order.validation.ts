import crypto from "node:crypto";
import { z } from "zod";
import { ERROR_CODES, HTTP_STATUS } from "@aura/shared";
import { AppError } from "../../shared/errors/error-envelope.js";

const MAX_POSTGRES_INT = 2147483647;

export const FORBIDDEN_ORDER_AUTHORITY_FIELDS = new Set([
  "executionprice",
  "execution_price",
  "price",
  "cashafter",
  "cash_after",
  "positionafter",
  "position_after",
  "realizedpnl",
  "realized_pnl",
  "unrealizedpnl",
  "unrealized_pnl",
  "status",
  "filledat",
  "filled_at",
  "userid",
  "user_id",
  "scenario",
  "scenarioid",
  "scenario_id",
  "cycle",
  "currentcycle",
  "current_cycle",
  "tradeid",
  "trade_id",
  "trade",
  "trades",
  "orderid",
  "order_id",
  "submittedat",
  "submitted_at",
  "executedquantity",
  "executed_quantity",
  "rejectioncode",
  "rejection_code",
  "balance",
  "balances",
  "cash",
  "cashbalance",
  "cash_balance",
  "portfolioid",
  "portfolio_id",
  "averagecost",
  "average_cost",
  "fee",
  "fees",
  "slippage",
]);

/**
 * FR-003, AC-017:
 * Checks incoming order request payload and rejects any client-supplied authoritative fields.
 * Throws 400 VALIDATION_ERROR if any forbidden field is detected.
 */
export function assertNoOrderAuthorityFields(body: unknown): void {
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
    if (FORBIDDEN_ORDER_AUTHORITY_FIELDS.has(normalizedKey)) {
      throw new AppError(
        `Authoritative field '${key}' cannot be provided by client`,
        ERROR_CODES.VALIDATION_ERROR,
        HTTP_STATUS.BAD_REQUEST,
      );
    }
  }
}

/**
 * FR-002, FR-004, AC-002, AC-003, AC-004:
 * Strict validation schema for market order submission.
 * Enforces whole-share integer quantity >= 1 and MARKET order type only.
 */
export const submitOrderRequestSchema = z
  .object({
    side: z.enum(["BUY", "SELL"], {
      errorMap: () => ({ message: "side must be either BUY or SELL" }),
    }),
    type: z.literal("MARKET", {
      errorMap: () => ({ message: "type must be MARKET" }),
    }),
    assetSymbol: z
      .string({ required_error: "assetSymbol is required" })
      .trim()
      .min(1, "assetSymbol must not be empty")
      .max(32, "assetSymbol exceeds maximum allowable length"),
    quantity: z
      .number({ required_error: "quantity is required" })
      .int("quantity must be an integer (whole shares only)")
      .positive("quantity must be strictly positive")
      .max(MAX_POSTGRES_INT, `quantity exceeds maximum allowable bounds (${MAX_POSTGRES_INT})`),
    idempotencyKey: z
      .string({ required_error: "idempotencyKey is required" })
      .trim()
      .min(1, "idempotencyKey must not be empty")
      .max(128, "idempotencyKey exceeds maximum length of 128 characters"),
  })
  .strict({
    message: "Request contains unexpected or unapproved fields",
  });

export type ValidatedSubmitOrderInput = z.infer<typeof submitOrderRequestSchema>;

/**
 * FR-009, FR-010, FR-011, AC-005:
 * Deterministically generates SHA-256 fingerprint from approved canonical intent fields.
 * Excludes server timestamps, DB IDs, and response fields.
 */
export function generateOrderFingerprint(params: {
  side: string;
  type: string;
  assetSymbol: string;
  quantity: number;
}): string {
  const canonicalString = `${params.side.toUpperCase()}:${params.type.toUpperCase()}:${params.assetSymbol.trim().toUpperCase()}:${params.quantity}`;
  return crypto.createHash("sha256").update(canonicalString).digest("hex");
}
