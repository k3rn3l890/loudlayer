import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./test/setup-frontend.ts"],
    include: ["src/**/*.test.{ts,tsx}", "test/frontend/**/*.test.{ts,tsx}"],
    testTimeout: 15000,
  },
});
