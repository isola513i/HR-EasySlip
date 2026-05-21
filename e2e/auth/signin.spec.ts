/**
 * Auth flow — global signin, workspace picker, forgot-password
 *
 * Tests the path-based global auth routes (/signin, /workspaces, /no-workspace).
 * Does not depend on a specific tenant slug.
 */
import { test, expect } from "@playwright/test";
import { BASE_URL, TENANT_SLUG, TENANT_BASE, loginAs } from "../helpers/auth";

// ── Global /signin page ───────────────────────────────────────────────────────

test.describe("Global /signin", () => {
  test("renders email and password fields", async ({ page }) => {
    await page.goto(`${BASE_URL}/signin`);
    await page.waitForLoadState("networkidle");
    await expect(page.locator("#email")).toBeVisible();
    await expect(page.locator("#password")).toBeVisible();
  });

  test("shows error on invalid credentials", async ({ page }) => {
    await page.goto(`${BASE_URL}/signin`);
    await page.fill("#email", "nobody@example.com");
    await page.fill("#password", "wrongpassword");
    const done = page.waitForResponse(
      (r) => r.url().includes("/api/v1/auth/login"),
      { timeout: 10_000 },
    );
    await page.click('button[type="submit"]');
    await done;
    await expect(
      page.getByText(/Invalid email or password/i).or(page.getByText(/อีเมลหรือรหัสผ่าน/i)),
    ).toBeVisible({ timeout: 5_000 });
  });

  test("forgot password link points to /signin/forgot-password", async ({ page }) => {
    await page.goto(`${BASE_URL}/signin`);
    await expect(page.locator('a[href="/signin/forgot-password"]')).toBeVisible();
  });

  test("/signin/forgot-password page loads", async ({ page }) => {
    await page.goto(`${BASE_URL}/signin/forgot-password`);
    await expect(page.locator("#fp-email")).toBeVisible();
  });

  test("/login redirects to /signin", async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await expect(page).toHaveURL(/\/signin/, { timeout: 5_000 });
  });
});

// ── Magic link flow ───────────────────────────────────────────────────────────

test.describe("Magic link check-email page", () => {
  test("renders back to sign-in button linking to /signin", async ({ page }) => {
    await page.goto(`${BASE_URL}/signin/check-email?email=test%40example.com`);
    await page.waitForLoadState("networkidle");
    await expect(page.locator('a[href="/signin"]')).toBeVisible();
  });
});

// ── /workspaces ───────────────────────────────────────────────────────────────

test.describe("/workspaces", () => {
  test("unauthenticated redirects to /signin", async ({ page }) => {
    await page.goto(`${BASE_URL}/workspaces`);
    await expect(page).toHaveURL(/\/signin/, { timeout: 5_000 });
  });

  test("authenticated user sees workspaces page or is redirected to tenant", async ({ page }) => {
    // This test requires a seeded user in the CP DB with at least one membership.
    // Skip gracefully if test-auth endpoint is not available (no CONTROL_PLANE_DATABASE_URL).
    const checkAuth = await page.request.post(`${BASE_URL}/api/v1/system/test-auth`, {
      headers: { "x-test-secret": "test-secret-dev", "content-type": "application/json" },
      data: { email: "development.v001@gmail.com" },
    }).catch(() => null);
    if (!checkAuth?.ok()) {
      test.skip(); return;
    }
    await page.goto(`${BASE_URL}/workspaces`);
    await page.waitForLoadState("networkidle");
    // Either shows workspaces picker or auto-redirected to a tenant dashboard
    const onWorkspaces = page.url().includes("/workspaces");
    const onTenant = page.url().includes(`/${TENANT_SLUG}/`);
    expect(onWorkspaces || onTenant).toBe(true);
  });
});

// ── Tenant /signin page ───────────────────────────────────────────────────────

test.describe("Tenant /signin", () => {
  test("renders signin form with tenant context", async ({ page }) => {
    const res = await page.goto(`${TENANT_BASE}/signin`);
    // 200 if tenant exists; 404 if demo tenant not provisioned — both are valid
    expect([200, 404]).toContain(res?.status());
    if (res?.status() === 200) {
      await expect(page.locator("#email")).toBeVisible();
    }
  });

  test("tenant forgot-password link points to /{slug}/signin/forgot-password", async ({
    page,
  }) => {
    const res = await page.goto(`${TENANT_BASE}/signin`);
    if (res?.status() !== 200) { test.skip(); return; }
    await expect(
      page.locator(`a[href="/${TENANT_SLUG}/signin/forgot-password"]`),
    ).toBeVisible();
  });
});
