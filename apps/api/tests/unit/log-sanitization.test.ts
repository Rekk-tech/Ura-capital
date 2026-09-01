import { describe, it, expect, vi } from "vitest";
import {
  sanitizeLogString,
  classifyAndSanitizeError,
  isDatabaseError,
} from "../../src/infrastructure/logging/error-sanitizer.js";
import { logger, sanitizeLogData } from "../../src/infrastructure/logging/logger.js";
import { AppError } from "../../src/shared/errors/error-envelope.js";
import { errorHandlerMiddleware } from "../../src/middleware/error-handler.js";
import type { Request, Response } from "express";

describe("Log Sanitization & Database Error Safety (Unit / Logging)", () => {
  it("redacts sensitive key-value pairs separated by equals or colons without leaking values (DEF-004)", () => {
    const input = "password=supersecret token=rawtoken123 secret=hunter2 hash=abcdef";
    const sanitized = sanitizeLogString(input);

    // 1. Assert raw secret values are strictly absent
    expect(sanitized).not.toContain("supersecret");
    expect(sanitized).not.toContain("rawtoken123");
    expect(sanitized).not.toContain("hunter2");
    expect(sanitized).not.toContain("abcdef");

    // 2. Assert sanitized key-value output structure
    expect(sanitized).toBe("password=[REDACTED] token=[REDACTED] secret=[REDACTED] hash=[REDACTED]");
  });

  it("redacts diverse sensitive key names, casings, and separators", () => {
    const cases = [
      { input: "PASSWORD=SecretPass123", expected: "PASSWORD=[REDACTED]" },
      { input: "passwd=Pass1234", expected: "passwd=[REDACTED]" },
      { input: "pwd=MySecret", expected: "pwd=[REDACTED]" },
      { input: "access_token=jwt.token.val", expected: "access_token=[REDACTED]" },
      { input: "refresh_token=opaque_token_val", expected: "refresh_token=[REDACTED]" },
      { input: "rawToken=raw1234567890", expected: "rawToken=[REDACTED]" },
      { input: "tokenHash=hashabcdef123", expected: "tokenHash=[REDACTED]" },
      { input: "token_hash=hash987654", expected: "token_hash=[REDACTED]" },
      { input: "client_secret=secret-abc", expected: "client_secret=[REDACTED]" },
      { input: "apiKey=AIzaSySecret", expected: "apiKey=[REDACTED]" },
      { input: "api_key=AIzaSySecret2", expected: "api_key=[REDACTED]" },
      { input: "authorization: Bearer token123", expected: "authorization: Bearer [REDACTED]" },
      { input: "cookie: aura_refresh_token=raw-val", expected: "cookie: [REDACTED]" },
      { input: 'password: "quoted_secret"', expected: 'password: "[REDACTED]"' },
      { input: "secret: 'single_quoted_secret'", expected: "secret: '[REDACTED]'" },
      { input: '{"password": "json_secret", "token": "json_token"}', expected: '{"password": "[REDACTED]", "token": "[REDACTED]"}' },
    ];

    for (const { input, expected } of cases) {
      const sanitized = sanitizeLogString(input);
      expect(sanitized).toBe(expected);
    }
  });

  it("does not over-redact normal safe operational metadata", () => {
    const safeInput = "requestId=req-12345 method=POST path=/auth/refresh category=DATABASE_ERROR status=500 userCount=2";
    const sanitized = sanitizeLogString(safeInput);

    expect(sanitized).toBe(safeInput);
    expect(sanitized).toContain("requestId=req-12345");
    expect(sanitized).toContain("method=POST");
    expect(sanitized).toContain("path=/auth/refresh");
    expect(sanitized).toContain("category=DATABASE_ERROR");
    expect(sanitized).toContain("status=500");
    expect(sanitized).toContain("userCount=2");
  });

  it("sanitizes nested objects and arrays in structured metadata", () => {
    const nestedData = {
      requestId: "req-999",
      metadata: {
        detail: "password=supersecret token=rawtoken123",
        items: [
          { secret: "hunter2", query: "token=abc456" },
          "authorization: Bearer topsecretjwt",
        ],
      },
    };

    const sanitized = sanitizeLogData(nestedData) as {
      requestId: string;
      metadata: {
        detail: string;
        items: [Record<string, unknown>, string];
      };
    };

    expect(sanitized.requestId).toBe("req-999");
    expect(sanitized.metadata.detail).toBe("password=[REDACTED] token=[REDACTED]");
    expect(sanitized.metadata.items[0].secret).toBe("[REDACTED]");
    expect(sanitized.metadata.items[0].query).toBe("token=[REDACTED]");
    expect(sanitized.metadata.items[1]).toBe("authorization: Bearer [REDACTED]");

    const serialized = JSON.stringify(sanitized);
    expect(serialized).not.toContain("supersecret");
    expect(serialized).not.toContain("rawtoken123");
    expect(serialized).not.toContain("hunter2");
    expect(serialized).not.toContain("abc456");
    expect(serialized).not.toContain("topsecretjwt");
  });

  it("redacts raw database connection URLs, credentials, host:port pairs, and Prisma class names", () => {
    const rawConnectionString =
      "Error in connection postgresql://postgres:supersecretpassword@localhost:5432/aura_capital_test";
    const sanitizedUrl = sanitizeLogString(rawConnectionString);

    expect(sanitizedUrl).not.toContain("postgresql://");
    expect(sanitizedUrl).not.toContain("supersecretpassword");
    expect(sanitizedUrl).not.toContain("localhost:5432");
    expect(sanitizedUrl).toContain("[DATABASE_URL_REDACTED]");

    const rawPrismaError =
      "PrismaClientInitializationError: Can't reach database server at localhost:5432";
    const sanitizedPrisma = sanitizeLogString(rawPrismaError);

    expect(sanitizedPrisma).not.toContain("PrismaClientInitializationError");
    expect(sanitizedPrisma).not.toContain("localhost:5432");
    expect(sanitizedPrisma).toContain("[PRISMA_ERROR]");
    expect(sanitizedPrisma).toContain("[HOST:PORT_REDACTED]");
  });

  it("accurately identifies database and Prisma errors", () => {
    expect(isDatabaseError(new Error("PrismaClientInitializationError: Can't reach database"))).toBe(true);
    expect(isDatabaseError(new Error("Error: Can't connect to postgresql database server at 127.0.0.1"))).toBe(true);
    expect(isDatabaseError({ name: "PrismaClientKnownRequestError", code: "P2002" })).toBe(true);
    expect(isDatabaseError(new Error("Generic business validation error"))).toBe(false);
    expect(isDatabaseError(null)).toBe(false);
  });

  it("classifies database failures into safe categories without leaking driver messages", () => {
    const rawDbError = new Error(
      "PrismaClientInitializationError: Can't reach database server at localhost:5432 with connection string postgresql://postgres:pass@localhost:5432/db",
    );

    const classified = classifyAndSanitizeError(rawDbError);

    expect(classified.category).toBe("DATABASE_ERROR");
    expect(classified.code).toBe("DATABASE_ERROR");
    expect(classified.message).toBe("Database operation failed");
    expect(classified.isOperational).toBe(false);

    // Verify raw error text is not in message
    expect(classified.message).not.toContain("PrismaClientInitializationError");
    expect(classified.message).not.toContain("5432");
    expect(classified.message).not.toContain("localhost");
    expect(classified.message).not.toContain("postgresql");
  });

  it("preserves safe application errors (AppError) with sanitized messages", () => {
    const appErr = new AppError("Invalid email or password", "UNAUTHENTICATED", 401);
    const classified = classifyAndSanitizeError(appErr);

    expect(classified.category).toBe("APPLICATION_ERROR");
    expect(classified.code).toBe("UNAUTHENTICATED");
    expect(classified.message).toBe("Invalid email or password");
    expect(classified.isOperational).toBe(true);
  });

  it("executes full logger path with sentinel values and proves zero leaks in structured output (DEF-004)", () => {
    const logs: string[] = [];
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation((msg: string) => {
      logs.push(msg);
    });

    const sentinels = {
      password: "TEST_SECRET_PASSWORD_123",
      refreshToken: "TEST_REFRESH_TOKEN_456",
      apiSecret: "TEST_API_SECRET_789",
      tokenHash: "TEST_HASH_ABC",
    };

    logger.error("Processing authentication request", {
      requestId: "req-sentinel-test-1",
      path: "/auth/refresh",
      method: "POST",
      category: "DATABASE_ERROR",
      code: "DATABASE_ERROR",
      rawDetails: `password=${sentinels.password} token=${sentinels.refreshToken} secret=${sentinels.apiSecret} hash=${sentinels.tokenHash}`,
      nested: {
        extra: `apiKey=${sentinels.apiSecret}`,
      },
    });

    expect(consoleErrorSpy).toHaveBeenCalled();
    expect(logs.length).toBe(1);

    const logOutput = logs[0];

    // Assert NO sentinel values exist anywhere in output
    expect(logOutput).not.toContain(sentinels.password);
    expect(logOutput).not.toContain(sentinels.refreshToken);
    expect(logOutput).not.toContain(sentinels.apiSecret);
    expect(logOutput).not.toContain(sentinels.tokenHash);

    // Assert safe metadata remains present
    const parsed = JSON.parse(logOutput);
    expect(parsed.service).toBe("aura-api");
    expect(parsed.level).toBe("error");
    expect(parsed.requestId).toBe("req-sentinel-test-1");
    expect(parsed.path).toBe("/auth/refresh");
    expect(parsed.method).toBe("POST");
    expect(parsed.category).toBe("DATABASE_ERROR");
    expect(parsed.code).toBe("DATABASE_ERROR");
    expect(parsed.rawDetails).toBe("password=[REDACTED] token=[REDACTED] secret=[REDACTED] hash=[REDACTED]");
    expect(parsed.nested.extra).toBe("apiKey=[REDACTED]");

    consoleErrorSpy.mockRestore();
  });

  it("captures and verifies structured error logs contain safe metadata and no raw database internals in middleware", () => {
    const errorLogs: string[] = [];
    const consoleSpy = vi.spyOn(console, "error").mockImplementation((msg: string) => {
      errorLogs.push(msg);
    });

    const mockReq = {
      id: "test-req-id-12345",
      path: "/auth/refresh",
      method: "POST",
    } as Request;

    const mockJson = vi.fn();
    const mockStatus = vi.fn().mockReturnValue({ json: mockJson });
    const mockRes = {
      status: mockStatus,
    } as unknown as Response;

    const rawDbError = new Error(
      "PrismaClientInitializationError: Can't reach database server at `localhost:5432` with postgresql://postgres:postgrespassword@localhost:5432/aura_capital_test",
    );

    errorHandlerMiddleware(rawDbError, mockReq, mockRes, vi.fn());

    expect(consoleSpy).toHaveBeenCalled();
    expect(errorLogs.length).toBeGreaterThanOrEqual(1);

    const logEntry = errorLogs[0];
    const parsed = JSON.parse(logEntry);

    // 1. Assert safe operational metadata exists
    expect(parsed.service).toBe("aura-api");
    expect(parsed.level).toBe("error");
    expect(parsed.requestId).toBe("test-req-id-12345");
    expect(parsed.path).toBe("/auth/refresh");
    expect(parsed.method).toBe("POST");
    expect(parsed.category).toBe("DATABASE_ERROR");
    expect(parsed.code).toBe("DATABASE_ERROR");
    expect(parsed.error).toBe("Database operation failed");

    // 2. Critical assertion: Assert raw Prisma and DB details are STRICTLY ABSENT from log
    expect(logEntry).not.toContain("PrismaClientInitializationError");
    expect(logEntry).not.toContain("localhost:5432");
    expect(logEntry).not.toContain("5432");
    expect(logEntry).not.toContain("localhost");
    expect(logEntry).not.toContain("postgresql://");
    expect(logEntry).not.toContain("postgrespassword");
    expect(logEntry).not.toContain("stack");

    // 3. Response assertion: verify safe generic envelope returned to client
    expect(mockStatus).toHaveBeenCalledWith(500);
    expect(mockJson).toHaveBeenCalledWith({
      error: {
        code: "INTERNAL_ERROR",
        message: "An unexpected internal server error occurred",
        requestId: "test-req-id-12345",
      },
    });

    consoleSpy.mockRestore();
  });

  it("verifies seed error diagnostics sanitize DATABASE_URL, REDIS_URL, passwords, and tokens (FEAT-017 / DEF-007)", () => {
    const rawError = "Failed to connect to postgresql://postgres:SecretDevPass123!@localhost:5432/aura_capital_dev with redis://:RedisSecret123@localhost:6379/0 token=rawSecretToken123";
    const sanitized = sanitizeLogString(rawError);

    expect(sanitized).not.toContain("SecretDevPass123!");
    expect(sanitized).not.toContain("RedisSecret123");
    expect(sanitized).not.toContain("rawSecretToken123");
    expect(sanitized).not.toContain("postgresql://");
    expect(sanitized).not.toContain("redis://");
  });
});
