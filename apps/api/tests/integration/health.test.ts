import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { createApp } from "../../src/server.js";
import { HealthStatusSchema } from "@aura/shared";

describe("API Health Endpoint (Integration)", () => {
  beforeAll(() => {
    process.env.NODE_ENV = "test";
    process.env.JWT_SECRET = "test-jwt-secret-with-at-least-32-characters-length";
  });

  it("returns 200 and healthy status on GET /health", async () => {
    const app = createApp();
    const response = await request(app).get("/health");

    expect(response.status).toBe(200);
    expect(response.body.status).toBe("healthy");
    expect(response.body.service).toBe("aura-api");
    expect(response.headers["x-request-id"]).toBeDefined();

    const parseResult = HealthStatusSchema.safeParse(response.body);
    expect(parseResult.success).toBe(true);
  });

  it("returns 200 on GET /api/health as an alternative route", async () => {
    const app = createApp();
    const response = await request(app).get("/api/health");

    expect(response.status).toBe(200);
    expect(response.body.status).toBe("healthy");
  });

  it("returns 404 with standard error envelope for unknown routes", async () => {
    const app = createApp();
    const response = await request(app).get("/non-existent-route");

    expect(response.status).toBe(404);
    expect(response.body.error).toBeDefined();
    expect(response.body.error.code).toBe("NOT_FOUND");
    expect(response.body.error.requestId).toBeDefined();
  });
});
