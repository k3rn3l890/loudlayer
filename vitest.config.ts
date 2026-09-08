import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
  test: {
    globals: true,
    environment: "node",
    setupFiles: ["./test/setup.ts"],
    include: ["server/**/*.test.ts", "test/**/*.test.ts"],
    testTimeout: 15000,
    hookTimeout: 15000,
  },
});
