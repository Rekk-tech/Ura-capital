import { describe, it, expect } from "vitest";
import { AppError, createErrorEnvelope } from "../../src/shared/errors/error-envelope.js";
import { ERROR_CODES, HTTP_STATUS } from "@aura/shared";

describe("API Error Envelope (Unit)", () => {
  it("creates an AppError instance with specified properties", () => {
    const error = new AppError(
      "Unauthorized access",
      ERROR_CODES.UNAUTHENTICATED,
      HTTP_STATUS.UNAUTHORIZED,
      { reason: "Token expired" },
    );

    expect(error.message).toBe("Unauthorized access");
    expect(error.code).toBe(ERROR_CODES.UNAUTHENTICATED);
    expect(error.statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
    expect(error.details).toEqual({ reason: "Token expired" });
  });

  it("creates standard error envelope without leaking secrets", () => {
    const envelope = createErrorEnvelope(
      "Resource not found",
      ERROR_CODES.NOT_FOUND,
      "req-abc-123",
      { itemId: "123" },
    );

    expect(envelope).toEqual({
      error: {
        code: "NOT_FOUND",
        message: "Resource not found",
        requestId: "req-abc-123",
        details: { itemId: "123" },
      },
    });
  });
});
