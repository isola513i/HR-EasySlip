import { defineConfig } from "@playwright/test";
import { config as loadDotenv } from "dotenv";

// Playwright doesn't load .env.local by default (that's a Next.js convention).
loadDotenv({ path: ".env.local", override: false });

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  retries: 1,
  workers: process.env.CI ? 2 : 3,
  use: {
    baseURL: process.env.E2E_BASE_URL ?? `http://${process.env.E2E_TENANT_SLUG ?? "demo"}.localhost:3000`,
    trace: "on-first-retry",
  },
  projects: [
    { name: "chromium", use: { browserName: "chromium" } },
  ],
  webServer: {
    command: "bun run dev",
    port: 3000,
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
