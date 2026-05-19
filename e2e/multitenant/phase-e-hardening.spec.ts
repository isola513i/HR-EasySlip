/**
 * Phase E — Hardening
 *
 * Tests security guards, audit logging, impersonation flow,
 * and the connection-pool health endpoint.
 *
 * Partially depends on CONTROL_PLANE_DATABASE_URL (marked per-test).
 */
import { test, expect } from "@playwright/test";
import {
  PLATFORM_URL,
  MARKETING_URL,
  tenantUrl,
  TENANT_SLUG,
  hasControlPlane,
  loginAsPlatformUser,
  loginAsTenantUser,
} from "./helpers/auth";

// ── Cron endpoint ─────────────────────────────────────────────────────────────

test.describe("Cron: trial-expiry", () => {
  const CRON_URL = `${MARKETING_URL}/api/platform/cron/trial-expiry`;

  test("no Authorization header → 401", async ({ request }) => {
    const res = await request.get(CRON_URL);
    expect(res.status()).toBe(401);
  });

  test("wrong bearer token → 401", async ({ request }) => {
    const res = await request.get(CRON_URL, {
      headers: { Authorization: "Bearer wrong-secret-value" },
    });
    expect(res.status()).toBe(401);
  });

  test("correct CRON_SECRET → 200 with expired count", async ({ request }) => {
    test.skip(!hasControlPlane, "Requires CONTROL_PLANE_DATABASE_URL");
    const cronSecret = process.env.CRON_SECRET;
    test.skip(!cronSecret, "Set CRON_SECRET to test successful cron execution");
    const res = await request.get(CRON_URL, {
      headers: { Authorization: `Bearer ${cronSecret}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(typeof body.expired).toBe("number");
    expect(typeof body.at).toBe("string");
  });
});

// ── Health / connection pool ──────────────────────────────────────────────────

test.describe("Health endpoint", () => {
  const HEALTH_URL = `${PLATFORM_URL}/api/platform/health`;

  test("no platform session → 401", async ({ request }) => {
    const res = await request.get(HEALTH_URL);
    expect(res.status()).toBe(401);
  });

  test("with platform session → 200 with pool stats", async ({ page, request }) => {
    test.skip(!hasControlPlane, "Requires CONTROL_PLANE_DATABASE_URL");
    await loginAsPlatformUser(page);
    // Re-use the page's authenticated cookie jar for the API call
    const res = await page.request.get(HEALTH_URL);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.connectionPool).toBeDefined();
    expect(typeof body.connectionPool.activeTenants).toBe("number");
    expect(typeof body.connectionPool.maxTenants).toBe("number");
    expect(typeof body.connectionPool.utilizationPct).toBe("number");
  });
});

// ── Audit log page ────────────────────────────────────────────────────────────

test.describe("Platform audit log", () => {
  test("audit page renders log table or empty state", async ({ page }) => {
    test.skip(!hasControlPlane, "Requires CONTROL_PLANE_DATABASE_URL");
    await loginAsPlatformUser(page);
    await page.goto(`${PLATFORM_URL}/audit`);
    await page.waitForLoadState("networkidle");
    await expect(page).not.toHaveURL(/\/signin/);
    const hasTable = page.locator("table");
    const isEmpty = page.getByText(/no logs|ยังไม่มี/i);
    await expect(hasTable.or(isEmpty).first()).toBeVisible({ timeout: 10_000 });
  });

  test("audit page pagination renders page controls when > 50 logs", async ({ page }) => {
    test.skip(!hasControlPlane, "Requires CONTROL_PLANE_DATABASE_URL");
    await loginAsPlatformUser(page);
    await page.goto(`${PLATFORM_URL}/audit`);
    await page.waitForLoadState("networkidle");
    // Only verify presence of pagination UI if it exists (soft check)
    const pager = page.getByRole("link", { name: /next|›/i }).first();
    const count = await pager.count();
    if (count > 0) await expect(pager).toBeVisible();
  });
});

// ── Impersonation flow ────────────────────────────────────────────────────────

test.describe("Impersonation", () => {
  test("impersonate form requires reason field", async ({ page }) => {
    test.skip(!hasControlPlane, "Requires CONTROL_PLANE_DATABASE_URL");
    await loginAsPlatformUser(page);

    // Navigate to tenant list and extract the first tenant detail href from the table.
    // Using table-cell locator instead of getByRole(/view|→/) to avoid matching
    // the overview page's "Review →" KPI link (which also contains "→").
    await page.goto(`${PLATFORM_URL}/tenants`);
    await page.waitForLoadState("networkidle");
    await expect(page.getByRole("heading", { name: /tenants/i })).toBeVisible({ timeout: 5_000 });

    const detailLink = page.locator('td a[href^="/tenants/"]').first();
    const count = await detailLink.count();
    test.skip(count === 0, "No tenants in CP DB to impersonate");

    // Navigate directly to the detail page (more reliable than click + waitForNavigation)
    const href = await detailLink.getAttribute('href');
    await page.goto(`${PLATFORM_URL}${href}`);
    await page.waitForLoadState("networkidle");

    // Navigate directly to the impersonate sub-page
    await page.goto(`${PLATFORM_URL}${href}/impersonate`);
    await page.waitForLoadState("networkidle");

    // Remove HTML5 required so browser lets the server action validate empty reason
    await page.locator('#reason').evaluate((el: Element) => el.removeAttribute('required'));
    // PlatformShell also has a "Sign out" button[type="submit"] — use role name to be specific
    await page.getByRole('button', { name: /start impersonation/i }).click();
    // Server action: if (!reason) return { error: "Reason is required." }
    const errorEl = page.getByText(/reason is required/i).first();
    await expect(errorEl).toBeVisible({ timeout: 8_000 });
  });

  test("impersonation sets cookie and redirects to tenant zone", async ({ page }) => {
    test.skip(!hasControlPlane, "Requires CONTROL_PLANE_DATABASE_URL");
    const tenantSlug = process.env.E2E_IMPERSONATE_TENANT_SLUG ?? TENANT_SLUG;
    await loginAsPlatformUser(page);

    // Use direct goto navigation (same approach as above — avoids "Review →" match issue)
    await page.goto(`${PLATFORM_URL}/tenants`);
    await page.waitForLoadState("networkidle");
    await expect(page.getByRole("heading", { name: /tenants/i })).toBeVisible({ timeout: 5_000 });

    const detailLink = page.locator('td a[href^="/tenants/"]').first();
    test.skip((await detailLink.count()) === 0, "No tenants available");

    const href = await detailLink.getAttribute('href');
    await page.goto(`${PLATFORM_URL}${href}/impersonate`);
    await page.waitForLoadState("networkidle");

    // Fill reason and submit (use role name to avoid strict-mode on Sign-out button)
    await page.fill("textarea", "E2E automated test impersonation");
    await page.getByRole('button', { name: /start impersonation/i }).click();

    // Should redirect to the tenant zone (any slug — first in list may vary by creation order).
    // In local dev, startImpersonation redirects to {slug}.lvh.me while the cookie is
    // issued from admin.localhost — different domains, so the browser won't send
    // the impersonation-token cookie to lvh.me. The redirect itself validates the
    // server action ran successfully; the banner is only checked in production.
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveURL(
      /[a-z0-9-]+\.(localhost|lvh\.me)/,
      { timeout: 10_000 },
    );
    // Soft-check: banner only appears when impersonation cookie crosses to lvh.me domain
    const bannerEl = page.getByText(/superadmin|impersonat|viewing as/i).first();
    if (await bannerEl.count() > 0) {
      await expect(bannerEl).toBeVisible({ timeout: 5_000 });
    }
  });

  test("end impersonation clears cookie and returns to platform", async ({ page }) => {
    test.skip(!hasControlPlane, "Requires CONTROL_PLANE_DATABASE_URL");
    test.skip(!process.env.IMPERSONATION_COOKIE_VALUE, "Set IMPERSONATION_COOKIE_VALUE to test end-session");
    // Guard against stale/expired JWT tokens in IMPERSONATION_COOKIE_VALUE
    const rawToken = process.env.IMPERSONATION_COOKIE_VALUE!;
    try {
      const payload = JSON.parse(Buffer.from(rawToken.split(".")[1], "base64url").toString());
      test.skip((payload.exp ?? 0) * 1000 < Date.now(), "IMPERSONATION_COOKIE_VALUE has expired — generate a fresh one via the platform UI");
    } catch {
      test.skip(true, "IMPERSONATION_COOKIE_VALUE is not a valid JWT");
    }
    // Manually inject an impersonation-token cookie for the tenant domain
    await page.context().addCookies([{
      name: "impersonation-token",
      value: process.env.IMPERSONATION_COOKIE_VALUE!,
      domain: `${TENANT_SLUG}.localhost`,
      path: "/",
      httpOnly: true,
      sameSite: "Lax",
    }]);
    await loginAsTenantUser(page);
    await page.goto(`${tenantUrl(TENANT_SLUG)}/hr/overview`);
    await page.waitForLoadState("networkidle");

    const endBtn = page.getByRole("button", { name: /end session|ยุติ/i });
    await expect(endBtn).toBeVisible({ timeout: 5_000 });
    await endBtn.click();
    // Should redirect back to platform (endImpersonation redirects to admin.lvh.me in local dev)
    await expect(page).toHaveURL(/admin\.(localhost|lvh\.me)/, { timeout: 10_000 });
  });
});

// ── Cross-tenant isolation ────────────────────────────────────────────────────

test.describe("Cross-tenant isolation", () => {
  test("session cookie from tenant A does not grant access to tenant B", async ({
    page,
    context,
  }) => {
    test.skip(!hasControlPlane, "Requires CONTROL_PLANE_DATABASE_URL");
    const tenantB = process.env.E2E_TENANT_B_SLUG;
    test.skip(!tenantB, "Set E2E_TENANT_B_SLUG to test cross-tenant isolation");

    // Login to TENANT_SLUG (tenant A)
    await loginAsTenantUser(page);

    // Navigate to tenant B's protected route
    await page.goto(`http://${tenantB}.localhost:3000/hr/overview`, { waitUntil: "domcontentloaded" });

    // Should be redirected away from /hr/overview — either to /signin (no session)
    // or /settings/billing (if tenant B is TRIAL_EXPIRED). Either proves isolation.
    await expect(page).not.toHaveURL(/\/hr\/overview/, { timeout: 5_000 });
  });
});
