import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import { HealthStatusSchema } from "@aura/shared";

describe("API Production Artifact Smoke Test (Integration)", () => {
  const distServerPath = path.resolve(__dirname, "../../dist/server.js");

  beforeAll(() => {
    process.env.NODE_ENV = "test";
    process.env.JWT_SECRET = "test-jwt-secret-with-at-least-32-characters-length";

    // Ensure production build artifact exists even if tests are run from a clean checkout
    if (!fs.existsSync(distServerPath)) {
      const apiRoot = path.resolve(__dirname, "../..");
      execSync("npx tsc -b", { cwd: apiRoot, stdio: "pipe" });
    }
  }, 20000);

  it("verifies dist/server.js exists and is loadable as the production entrypoint", async () => {
    expect(
      fs.existsSync(distServerPath),
      `Expected ${distServerPath} to exist after build.`,
    ).toBe(true);

    const distModule = await import(pathToFileURL(distServerPath).href);
    expect(typeof distModule.createApp).toBe("function");

    const app = distModule.createApp();
    const response = await request(app).get("/health");

    expect(response.status).toBe(200);
    expect(response.body.status).toBe("healthy");
    expect(response.body.service).toBe("aura-api");

    const parseResult = HealthStatusSchema.safeParse(response.body);
    expect(parseResult.success).toBe(true);
  }, 20000);
});
