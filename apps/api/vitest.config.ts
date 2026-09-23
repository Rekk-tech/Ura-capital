import { defineConfig } from "vitest/config";
import path from "node:path";
import { fileURLToPath } from "node:url";

const currentDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@aura/shared": path.resolve(currentDir, "../../packages/shared/src/index.ts"),
    },
  },
  test: {
    globals: true,
    fileParallelism: false, // Run test files sequentially to avoid database race conditions in integration tests
  },
});

