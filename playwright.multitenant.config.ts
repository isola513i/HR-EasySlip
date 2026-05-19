import { defineConfig } from "@playwright/test";
import { config } from "dotenv";

// Load .env.local so test runner process sees the same env vars as Next.js dev server
config({ path: ".env.local", override: false });

/**
 * Playwright config for multi-tenant Phases A–E.
 * Uses *.localhost:3000 subdomains (Chromium resolves *.localhost → 127.0.0.1).
 * Run with: bunx playwright test --config playwright.multitenant.config.ts
 *
 * Required env vars:
 *   E2E_TEST_SECRET          — must match server-side E2E_TEST_SECRET
 *   CONTROL_PLANE_DATABASE_URL — if missing, CP-dependent tests are skipped
 *   E2E_PLATFORM_EMAIL       — email of a seeded SuperAdmin platform user
 *   E2E_TENANT_SLUG          — slug of the demo tenant (default: "demo")
 *   E2E_TENANT_ADMIN_EMAIL   — email of a TENANT_ADMIN user in that tenant
 */
export default defineConfig({
  testDir: "./e2e/multitenant",
  timeout: 30_000,
  retries: 1,
  workers: 1,
  use: {
    // No global baseURL — each test uses full subdomain URLs.
    trace: "on-first-retry",
  },
  projects: [
    { name: "chromium", use: { browserName: "chromium" } },
  ],
  webServer: {
    command: "bun run dev",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
