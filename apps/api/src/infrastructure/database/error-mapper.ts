import { Prisma } from "@prisma/client";
import { AppError } from "../../shared/errors/error-envelope.js";
import { ERROR_CODES, HTTP_STATUS } from "@aura/shared";

/**
 * Custom error thrown when nested transaction rules are violated.
 */
export class NestedTransactionError extends AppError {
  constructor(message = "[NESTED_TRANSACTION_VIOLATION] Accidental nested transaction runner execution detected. Operations executed inside an active transaction must reuse the existing TransactionContext.") {
    super(message, ERROR_CODES.INTERNAL_ERROR, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    this.name = "NestedTransactionError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Maps known Prisma and database infrastructure exceptions to safe application-level AppError envelopes.
 * Prevents leakage of raw SQL, database URLs, credentials, or internal stack traces.
 */
export function mapDatabaseError(err: unknown, fallbackMessage = "Database operation failed"): AppError {
  if (err instanceof AppError) {
    return err;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case "P2002": {
        // Unique constraint violation
        const target = Array.isArray(err.meta?.target) ? (err.meta.target as string[]).join(", ") : undefined;
        if (target && target.includes("email")) {
          return new AppError(
            "An account with this email address already exists.",
            ERROR_CODES.AUTH_EMAIL_ALREADY_EXISTS,
            HTTP_STATUS.CONFLICT,
          );
        }
        return new AppError(
          "A resource with these unique identifiers already exists.",
          ERROR_CODES.CONFLICT,
          HTTP_STATUS.CONFLICT,
        );
      }
      case "P2003": {
        // Foreign key constraint violation
        return new AppError(
          "Referenced parent resource does not exist.",
          ERROR_CODES.VALIDATION_ERROR,
          HTTP_STATUS.BAD_REQUEST,
        );
      }
      case "P2025": {
        // Record not found
        return new AppError(
          "Requested resource was not found.",
          ERROR_CODES.NOT_FOUND,
          HTTP_STATUS.NOT_FOUND,
        );
      }
      case "P2028": {
        // Transaction API error / timeout / expired
        return new AppError(
          "Transaction expired or timed out.",
          ERROR_CODES.INTERNAL_ERROR,
          HTTP_STATUS.INTERNAL_SERVER_ERROR,
        );
      }
      default:
        return new AppError(
          fallbackMessage,
          ERROR_CODES.INTERNAL_ERROR,
          HTTP_STATUS.INTERNAL_SERVER_ERROR,
        );
    }
  }

  if (err instanceof Prisma.PrismaClientInitializationError) {
    return new AppError(
      "Database connection could not be established.",
      ERROR_CODES.INTERNAL_ERROR,
      HTTP_STATUS.SERVICE_UNAVAILABLE,
    );
  }

  if (err instanceof Prisma.PrismaClientRustPanicError) {
    return new AppError(
      "Critical database engine failure.",
      ERROR_CODES.INTERNAL_ERROR,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
    );
  }

  return new AppError(
    fallbackMessage,
    ERROR_CODES.INTERNAL_ERROR,
    HTTP_STATUS.INTERNAL_SERVER_ERROR,
  );
}
