import { describe, it, expect } from "vitest";
import {
  APP_NAME,
  API_VERSION,
  HTTP_STATUS,
  ERROR_CODES,
  HealthStatusSchema,
  ErrorEnvelopeSchema,
  EnvConfigSchema,
} from "./index.js";

describe("@aura/shared package", () => {
  it("exports required application constants", () => {
    expect(APP_NAME).toBe("Aura Capital");
    expect(API_VERSION).toBe("v1");
    expect(HTTP_STATUS.OK).toBe(200);
    expect(ERROR_CODES.INTERNAL_ERROR).toBe("INTERNAL_ERROR");
  });

  it("validates HealthStatusSchema successfully", () => {
    const validHealth = {
      status: "healthy",
      service: "aura-api",
      version: "0.1.0",
      environment: "development",
      timestamp: new Date().toISOString(),
      uptime: 12.34,
    };

    const parsed = HealthStatusSchema.safeParse(validHealth);
    expect(parsed.success).toBe(true);
  });

  it("rejects invalid HealthStatusSchema", () => {
    const invalidHealth = {
      status: "degraded",
      service: "aura-api",
    };

    const parsed = HealthStatusSchema.safeParse(invalidHealth);
    expect(parsed.success).toBe(false);
  });

  it("validates ErrorEnvelopeSchema successfully", () => {
    const validError = {
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid payload",
        requestId: "req-12345",
      },
    };

    const parsed = ErrorEnvelopeSchema.safeParse(validError);
    expect(parsed.success).toBe(true);
  });

  it("validates EnvConfigSchema and rejects short JWT secret", () => {
    const invalidEnv = {
      JWT_SECRET: "short-secret",
    };

    const parsed = EnvConfigSchema.safeParse(invalidEnv);
    expect(parsed.success).toBe(false);
  });
});
