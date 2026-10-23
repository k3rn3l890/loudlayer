import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "."),
    },
  },
  test: {
    globals: true,
    environment: "node",
    setupFiles: ["./test/setup.ts"],
    include: ["test/**/*.test.ts"],
    exclude: ["test/frontend/**", "node_modules/**"],
    testTimeout: 30000,
    hookTimeout: 30000,
    fileParallelism: false,
  },
});
