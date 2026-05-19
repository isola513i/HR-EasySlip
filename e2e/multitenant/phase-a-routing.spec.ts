/**
 * Phase A — Subdomain Routing & Middleware
 *
 * Verifies that middleware correctly identifies each zone and applies
 * auth guards / tenant resolution without false positives.
 *
 * URL scheme (ROOT_DOMAIN=localhost:3000):
 *   Marketing : http://localhost:3000
 *   Platform  : http://admin.localhost:3000
 *   Tenant    : http://{slug}.localhost:3000
 */
import { test, expect } from "@playwright/test";
import {
  MARKETING_URL,
  PLATFORM_URL,
  tenantUrl,
  TENANT_SLUG,
  hasControlPlane,
  loginAsPlatformUser,
  loginAsTenantUser,
} from "./helpers/auth";

// ── Marketing zone ────────────────────────────────────────────────────────────

test.describe("Marketing zone (apex)", () => {
  test("landing page returns 200", async ({ page }) => {
    const res = await page.goto(MARKETING_URL);
    expect(res?.status()).toBe(200);
  });

  test("landing page renders hero headline", async ({ page }) => {
    await page.goto(MARKETING_URL);
    await page.waitForLoadState("networkidle");
    // HeroSection renders an <h1> with the main headline
    const h1 = page.locator("h1").first();
    await expect(h1).toBeVisible({ timeout: 10_000 });
    await expect(h1).not.toBeEmpty();
  });

  test("/signup page renders free trial form", async ({ page }) => {
    await page.goto(`${MARKETING_URL}/signup`);
    await page.waitForLoadState("networkidle");
    await expect(page.locator("#companyName")).toBeVisible();
    await expect(page.locator("#slug")).toBeVisible();
    await expect(page.locator("#email")).toBeVisible();
  });

  test("/pricing page renders without crash", async ({ page }) => {
    const res = await page.goto(`${MARKETING_URL}/pricing`);
    await page.waitForLoadState("networkidle");
    expect(res?.status()).toBe(200);
  });

  test("/privacy page renders without crash", async ({ page }) => {
    const res = await page.goto(`${MARKETING_URL}/privacy`);
    await page.waitForLoadState("networkidle");
    expect(res?.status()).toBe(200);
  });
});

// ── Platform zone ─────────────────────────────────────────────────────────────

test.describe("Platform zone (admin.*)", () => {
  test("unauthenticated / redirects to /signin", async ({ page }) => {
    await page.goto(`${PLATFORM_URL}/`);
    await expect(page).toHaveURL(/\/signin/, { timeout: 5_000 });
  });

  test("unauthenticated /overview redirects to /signin", async ({ page }) => {
    await page.goto(`${PLATFORM_URL}/overview`);
    await expect(page).toHaveURL(/\/signin/, { timeout: 5_000 });
  });

  test("/signin page is publicly accessible", async ({ page }) => {
    const res = await page.goto(`${PLATFORM_URL}/signin`);
    expect(res?.status()).toBe(200);
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
  });

  test("authenticated request reaches /overview (no redirect)", async ({ page }) => {
    test.skip(!hasControlPlane, "Requires CONTROL_PLANE_DATABASE_URL");
    await loginAsPlatformUser(page);
    await page.goto(`${PLATFORM_URL}/overview`);
    await page.waitForLoadState("networkidle");
    await expect(page).not.toHaveURL(/\/signin/);
  });
});

// ── Tenant zone ───────────────────────────────────────────────────────────────

test.describe("Tenant zone ({slug}.*)", () => {
  test("unknown subdomain returns 404", async ({ request }) => {
    const res = await request.get("http://no-such-tenant-xyz.localhost:3000/signin");
    expect(res.status()).toBe(404);
  });

  test("known tenant /signin page is publicly accessible", async ({ page }) => {
    test.skip(!hasControlPlane, "Requires CONTROL_PLANE_DATABASE_URL");
    const res = await page.goto(`${tenantUrl(TENANT_SLUG)}/signin`);
    expect(res?.status()).toBe(200);
  });

  test("unauthenticated /hr/* redirects to /signin", async ({ page }) => {
    test.skip(!hasControlPlane, "Requires CONTROL_PLANE_DATABASE_URL");
    await page.goto(`${tenantUrl(TENANT_SLUG)}/hr/overview`);
    await expect(page).toHaveURL(/\/signin/, { timeout: 5_000 });
  });

  test("authenticated user reaches /hr/overview without redirect", async ({ page }) => {
    test.skip(!hasControlPlane, "Requires CONTROL_PLANE_DATABASE_URL");
    await loginAsTenantUser(page);
    await page.goto(`${tenantUrl(TENANT_SLUG)}/hr/overview`);
    await page.waitForLoadState("networkidle");
    await expect(page).not.toHaveURL(/\/signin/);
  });

  test("TRIAL_EXPIRED tenant non-billing path redirects to /settings/billing", async ({
    request,
  }) => {
    test.skip(!hasControlPlane, "Requires CONTROL_PLANE_DATABASE_URL + expired tenant");
    // This test requires a tenant with status=TRIAL_EXPIRED to exist (slug from E2E_EXPIRED_TENANT_SLUG env).
    const expiredSlug = process.env.E2E_EXPIRED_TENANT_SLUG;
    test.skip(!expiredSlug, "Set E2E_EXPIRED_TENANT_SLUG to test expiry redirect");
    const res = await request.get(`http://${expiredSlug}.localhost:3000/hr/overview`, {
      maxRedirects: 0,
    });
    expect(res.status()).toBe(307);
    expect(res.headers()["location"]).toContain("/settings/billing");
  });
});
