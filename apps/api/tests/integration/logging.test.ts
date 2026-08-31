import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { createApp } from "../../src/server.js";

describe("API Request Logging (Integration)", () => {
  beforeAll(() => {
    process.env.NODE_ENV = "test";
    process.env.JWT_SECRET = "test-jwt-secret-with-at-least-32-characters-length";
  });

  it("injects X-Request-ID and preserves custom request ID", async () => {
    const app = createApp();
    const customId = "custom-test-req-id-12345";
    const response = await request(app)
      .get("/health")
      .set("x-request-id", customId);

    expect(response.status).toBe(200);
    expect(response.headers["x-request-id"]).toBe(customId);
  });
});
