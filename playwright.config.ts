import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "list",
  timeout: 30000,
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  webServer: [
    {
      command: "npm run dev:server",
      url: "http://localhost:3001/api/health",
      reuseExistingServer: true,
      timeout: 30000,
    },
    {
      command: "npm run dev:client",
      url: "http://localhost:3000",
      reuseExistingServer: true,
      timeout: 30000,
    },
  ],
});
