import { ERROR_CODES, HTTP_STATUS, type ErrorCode, type ErrorEnvelope } from "@aura/shared";

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly details: Record<string, unknown> | undefined;

  constructor(
    message: string,
    code: ErrorCode = ERROR_CODES.INTERNAL_ERROR,
    statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR,
    details?: Record<string, unknown> | undefined,
  ) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export function createErrorEnvelope(
  message: string,
  code: string = ERROR_CODES.INTERNAL_ERROR,
  requestId?: string | undefined,
  details?: Record<string, unknown> | undefined,
): ErrorEnvelope {
  const result: ErrorEnvelope = {
    error: {
      code,
      message,
    },
  };

  if (requestId !== undefined) {
    result.error.requestId = requestId;
  }

  if (details !== undefined) {
    result.error.details = details;
  }

  return result;
}
