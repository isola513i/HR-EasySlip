/**
 * Phase B — SuperAdmin Platform Portal
 *
 * Tests the platform admin UI at localhost:3000/platform:
 * - Sign-in form (UI + credential validation)
 * - Protected pages render after auth
 * - Tenants, trials, audit pages smoke-test
 */
import { test, expect } from "@playwright/test";
import { PLATFORM_URL, PLATFORM_EMAIL, hasControlPlane, loginAsPlatformUser } from "./helpers/auth";

// ── Unauthenticated UI ────────────────────────────────────────────────────────

test.describe("Platform signin page", () => {
  test("renders title and both fields", async ({ page }) => {
    await page.goto(`${PLATFORM_URL}/signin`);
    await expect(page.getByText("EasySlip Platform")).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test("wrong credentials show error message", async ({ page }) => {
    test.skip(!hasControlPlane, "Requires CONTROL_PLANE_DATABASE_URL");
    await page.goto(`${PLATFORM_URL}/signin`);
    await page.fill('input[name="email"]', "nobody@example.com");
    await page.fill('input[name="password"]', "wrongpassword");
    await page.click('button[type="submit"]');
    await expect(
      page.getByText(/invalid credentials/i).or(page.getByText(/ข้อมูลไม่ถูกต้อง/i)),
    ).toBeVisible({ timeout: 5_000 });
  });

  test("already authenticated redirects away from /signin", async ({ page }) => {
    test.skip(!hasControlPlane, "Requires CONTROL_PLANE_DATABASE_URL");
    await loginAsPlatformUser(page);
    await page.goto(`${PLATFORM_URL}/signin`);
    // PlatformSignInPage calls redirect("/overview") when session exists.
    // 10s: server-side redirect can be slow while dev server compiles under load.
    await expect(page).not.toHaveURL(/\/signin/, { timeout: 10_000 });
  });
});

// ── Authenticated pages ───────────────────────────────────────────────────────

test.describe("Platform — authenticated", () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!hasControlPlane, "Requires CONTROL_PLANE_DATABASE_URL");
    await loginAsPlatformUser(page);
  });

  test("/overview renders KPI cards", async ({ page }) => {
    await page.goto(`${PLATFORM_URL}/overview`);
    await page.waitForLoadState("networkidle");
    await expect(page).not.toHaveURL(/\/signin/);
    // StatCards render numeric values
    const card = page.locator("h3, p").filter({ hasText: /\d+/ }).first();
    await expect(card).toBeVisible({ timeout: 10_000 });
  });

  test("/tenants renders tenant table or empty state", async ({ page }) => {
    await page.goto(`${PLATFORM_URL}/tenants`);
    await page.waitForLoadState("networkidle");
    await expect(page).not.toHaveURL(/\/signin/);
    const hasTable = page.locator("table");
    const isEmpty = page.getByText(/no tenants/i);
    await expect(hasTable.or(isEmpty).first()).toBeVisible({ timeout: 10_000 });
  });

  test("/tenants/new page renders the new-tenant form", async ({ page }) => {
    await page.goto(`${PLATFORM_URL}/tenants/new`);
    await page.waitForLoadState("networkidle");
    await expect(page.locator('input[name="slug"]')).toBeVisible();
    await expect(page.locator('input[name="companyName"]')).toBeVisible();
    await expect(page.locator('input[name="databaseUrl"]')).toBeVisible();
  });

  test("/trials renders trial queue or empty state", async ({ page }) => {
    await page.goto(`${PLATFORM_URL}/trials`);
    await page.waitForLoadState("networkidle");
    await expect(page).not.toHaveURL(/\/signin/);
    const hasRows = page.locator("table, ul > li").first();
    const isEmpty = page.getByText(/no pending|ไม่มีคำขอ/i);
    await expect(hasRows.or(isEmpty).first()).toBeVisible({ timeout: 10_000 });
  });

  test("/audit renders log table or empty state", async ({ page }) => {
    await page.goto(`${PLATFORM_URL}/audit`);
    await page.waitForLoadState("networkidle");
    await expect(page).not.toHaveURL(/\/signin/);
    const hasTable = page.locator("table");
    const isEmpty = page.getByText(/no logs|ยังไม่มี/i);
    await expect(hasTable.or(isEmpty).first()).toBeVisible({ timeout: 10_000 });
  });

  test("signing out clears session and redirects to /signin", async ({ page }) => {
    await page.goto(`${PLATFORM_URL}/overview`);
    await page.waitForLoadState("networkidle");
    // Click sign-out button/link in the shell
    const signOutBtn = page.getByRole("button", { name: /sign out|logout|ออกจากระบบ/i });
    await expect(signOutBtn).toBeVisible({ timeout: 10_000 });
    // Server Action redirect requires waitForURL to start before clicking
    await Promise.all([
      page.waitForURL(/\/signin/, { timeout: 15_000 }),
      signOutBtn.click(),
    ]);
  });
});

// ── RBAC guard ────────────────────────────────────────────────────────────────

test.describe("Platform RBAC", () => {
  test("no cookie on /overview sends to /signin", async ({ page }) => {
    // Ensure no platform-session cookie
    await page.context().clearCookies();
    await page.goto(`${PLATFORM_URL}/overview`);
    await expect(page).toHaveURL(/\/signin/, { timeout: 5_000 });
  });

  test("SUPPORT role can view /tenants", async ({ page }) => {
    test.skip(!hasControlPlane, "Requires CONTROL_PLANE_DATABASE_URL");
    const supportEmail = process.env.E2E_SUPPORT_EMAIL;
    test.skip(!supportEmail, "Set E2E_SUPPORT_EMAIL for SUPPORT role RBAC test");
    await loginAsPlatformUser(page, supportEmail!);
    await page.goto(`${PLATFORM_URL}/tenants`);
    await page.waitForLoadState("networkidle");
    await expect(page).not.toHaveURL(/\/signin/);
  });
});
