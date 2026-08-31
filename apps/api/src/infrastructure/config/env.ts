import dotenv from "dotenv";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { EnvConfigSchema, type EnvConfig } from "@aura/shared";
import type { z } from "zod";

const currentDir = path.dirname(fileURLToPath(import.meta.url));

// Load .env file from current working directory or monorepo root
function loadEnvFile(): void {
  const possiblePaths = [
    path.resolve(process.cwd(), ".env"),
    path.resolve(process.cwd(), "../../.env"),
    path.resolve(currentDir, "../../../.env"),
    path.resolve(currentDir, "../../../../.env"),
  ];

  for (const envPath of possiblePaths) {
    if (fs.existsSync(envPath)) {
      dotenv.config({ path: envPath });
      break;
    }
  }
}

loadEnvFile();

export function validateEnv(envInput: Record<string, unknown> = process.env): EnvConfig {
  const result = EnvConfigSchema.safeParse(envInput);

  if (!result.success) {
    const errorDetails = result.error.errors
      .map((err: z.ZodIssue) => `${err.path.join(".")}: ${err.message}`)
      .join("; ");
    throw new Error(`[CONFIG_ERROR] Invalid environment configuration: ${errorDetails}`);
  }

  return result.data;
}

let cachedEnv: EnvConfig | null = null;

export function getEnv(): EnvConfig {
  if (!cachedEnv) {
    cachedEnv = validateEnv(process.env);
  }
  return cachedEnv;
}

export function resetEnvCache(): void {
  cachedEnv = null;
}
