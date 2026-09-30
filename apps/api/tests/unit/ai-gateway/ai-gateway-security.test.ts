import { describe, it, expect } from "vitest";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  sanitizeAIGatewayMessage,
  AIGatewayError,
  DeterministicFakeLLMProvider,
} from "../../../src/modules/ai/index.js";
import { createApp } from "../../../src/server.js";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const apiRootDir = path.resolve(currentDir, "../../..");
const repoRootDir = path.resolve(apiRootDir, "../..");

describe("FEAT-058 AI Gateway Security, Secrecy & Scope Boundaries", () => {
  describe("Diagnostic Sanitization (AC-006)", () => {
    it("redacts Google API keys (AIza...)", () => {
      const raw = "Failed to connect using key AIzaSyD3x4mPlEkEy1234567890abcdefghijk";
      const sanitized = sanitizeAIGatewayMessage(raw);
      expect(sanitized).not.toContain("AIzaSyD3x4mPlEkEy1234567890abcdefghijk");
      expect(sanitized).toContain("[REDACTED_API_KEY]");
    });

    it("redacts Bearer and Basic authentication tokens", () => {
      const raw = "Authorization: Bearer secret-token-123456-abcdef";
      const sanitized = sanitizeAIGatewayMessage(raw);
      expect(sanitized).not.toContain("secret-token-123456-abcdef");
      expect(sanitized).toContain("Bearer [REDACTED_TOKEN]");

      const rawBasic = "Authorization: Basic dXNlcjpwYXNzd29yZA==";
      const sanitizedBasic = sanitizeAIGatewayMessage(rawBasic);
      expect(sanitizedBasic).not.toContain("dXNlcjpwYXNzd29yZA==");
      expect(sanitizedBasic).toContain("Basic [REDACTED_TOKEN]");
    });

    it("redacts key/secret query parameters", () => {
      const raw = "Request failed with parameters apiKey=mySecretKey123&other=val";
      const sanitized = sanitizeAIGatewayMessage(raw);
      expect(sanitized).not.toContain("mySecretKey123");
      expect(sanitized).toContain("apiKey=[REDACTED]");
    });

    it("redacts database and HTTP connection URLs", () => {
      const raw = "Failed connecting to postgresql://postgres:mypassword@db.internal:5432/aura_db";
      const sanitized = sanitizeAIGatewayMessage(raw);
      expect(sanitized).not.toContain("mypassword");
      expect(sanitized).not.toContain("db.internal");
      expect(sanitized).toContain("[REDACTED_URL]");
    });

    it("redacts sensitive Windows and Unix absolute filesystem paths", () => {
      const winPath = "Error at D:\\project\\ura-capital\\apps\\api\\src\\secrets.ts:42";
      const sanitizedWin = sanitizeAIGatewayMessage(winPath);
      expect(sanitizedWin).not.toContain("D:\\project");
      expect(sanitizedWin).toContain("[REDACTED_PATH]");

      const unixPath = "Error at /home/user/project/ura-capital/apps/api/secrets.ts:42";
      const sanitizedUnix = sanitizeAIGatewayMessage(unixPath);
      expect(sanitizedUnix).not.toContain("/home/user");
      expect(sanitizedUnix).toContain("[REDACTED_PATH]");
    });

    it("redacts hostnames and IP addresses", () => {
      const raw = "Connection timed out to 192.168.1.100:8080";
      const sanitized = sanitizeAIGatewayMessage(raw);
      expect(sanitized).not.toContain("192.168.1.100");
      expect(sanitized).toContain("[REDACTED_HOST]");
    });

    it("automatically sanitizes message passed to AIGatewayError hierarchy", () => {
      const err = new AIGatewayError(
        "Failed request with key AIzaSyD3x4mPlEkEy1234567890abcdefghijk to https://generativelanguage.googleapis.com",
      );
      expect(err.message).not.toContain("AIzaSyD3x4mPlEkEy1234567890abcdefghijk");
      expect(err.message).toContain("[REDACTED_API_KEY]");
      expect(err.message).not.toContain("googleapis.com");
      expect(err.message).toContain("[REDACTED_URL]");
    });
  });

  describe("Version Control and Secret Containment (AC-007)", () => {
    it("confirms .env and secret files are NOT tracked in git", () => {
      const trackedFiles = execSync("git ls-files", {
        cwd: repoRootDir,
        encoding: "utf-8",
      });
      const lines = trackedFiles.split("\n").map((l) => l.trim());

      expect(lines.includes(".env")).toBe(false);
      expect(lines.includes("apps/api/.env")).toBe(false);
      expect(lines.some((f) => f.endsWith(".key") || f.endsWith(".pem"))).toBe(false);
    });

    it("confirms .env.example contains ZERO hardcoded API keys or secrets", () => {
      const envExamplePath = path.resolve(repoRootDir, ".env.example");
      if (fs.existsSync(envExamplePath)) {
        const content = fs.readFileSync(envExamplePath, "utf-8");
        expect(content).not.toMatch(/GEMINI_API_KEY=\S+/);
        expect(content).toMatch(/GEMINI_API_KEY=$/m);
      }
    });
  });

  describe("Scope Boundaries and Zero Unapproved Behavior (AC-005, AC-008)", () => {
    it("confirms ZERO public AI routes are mounted on the Express server", () => {
      const app = createApp();
      const routes: string[] = [];

      // Inspect mounted routers on the Express app
      interface Layer {
        route?: { path?: string };
        name?: string;
        handle?: { stack?: Layer[] };
      }
      const stack = (app as unknown as { _router?: { stack?: Layer[] } })._router?.stack || [];
      for (const layer of stack) {
        if (layer.route?.path) {
          routes.push(layer.route.path);
        } else if (layer.name === "router" && layer.handle?.stack) {
          for (const subLayer of layer.handle.stack) {
            if (subLayer.route?.path) {
              routes.push(subLayer.route.path);
            }
          }
        }
      }

      // Must have zero AI assistant endpoints
      const aiRoutes = routes.filter((r) => r.includes("/ai") || r.includes("/assistant"));
      expect(aiRoutes).toEqual([]);
    });

    it("confirms ZERO AI database models or migrations exist in Prisma schema", () => {
      const schemaPath = path.resolve(apiRootDir, "prisma/schema.prisma");
      const content = fs.readFileSync(schemaPath, "utf-8");

      expect(content).not.toContain("model Ai");
      expect(content).not.toContain("model AI");
      expect(content).not.toContain("model Assistant");
      expect(content).not.toContain("model Prompt");
      expect(content).not.toContain("model Conversation");
      expect(content).not.toContain("model Chat");
    });

    it("confirms zero Prisma client or raw SQL in modules/ai", () => {
      const aiDir = path.resolve(apiRootDir, "src/modules/ai");
      const files = fs.readdirSync(aiDir, { recursive: true }) as string[];

      for (const relFile of files) {
        if (typeof relFile === "string" && relFile.endsWith(".ts")) {
          const fullPath = path.join(aiDir, relFile);
          const content = fs.readFileSync(fullPath, "utf-8");

          expect(content).not.toContain("@prisma/client");
          expect(content).not.toContain("getPrismaClient");
          expect(content).not.toContain("$queryRaw");
          expect(content).not.toContain("$executeRaw");
          expect(content).not.toContain("ioredis");
          expect(content).not.toContain("@google/generative-ai");
          expect(content).not.toContain("@google/genai");
        }
      }
    });

    it("prevents instantiation of DeterministicFakeLLMProvider with forged or missing proof", () => {
      expect(
        () =>
          new DeterministicFakeLLMProvider({
            activationProof: Symbol("forged-proof"),
          }),
      ).toThrow("Prohibited activation");
    });
  });
});
