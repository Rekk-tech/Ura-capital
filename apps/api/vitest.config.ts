import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    fileParallelism: false, // Run test files sequentially to avoid database race conditions in integration tests
  },
});
