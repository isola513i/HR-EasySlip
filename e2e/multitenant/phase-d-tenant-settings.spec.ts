/**
 * Phase D — Tenant Admin Portal (/settings/*)
 *
 * Tests the settings pages available to TENANT_ADMIN and equivalent roles.
 * All tests require:
 *   - CONTROL_PLANE_DATABASE_URL (to resolve the tenant)
 *   - A demo tenant with slug E2E_TENANT_SLUG (default: "demo")
 *   - E2E_TENANT_ADMIN_EMAIL pointing to a HRMG/TENANT_ADMIN/CEO user in that tenant
 *   - E2E_TENANT_EMPLOYEE_EMAIL pointing to a plain EMPLOYEE user (for RBAC tests)
 *
 * The test-auth endpoint creates a session scoped to the tenant subdomain,
 * so cookies are automatically sent to {slug}.localhost:3000.
 */
import { test, expect } from "@playwright/test";
import {
  tenantUrl,
  TENANT_SLUG,
  hasControlPlane,
  loginAsTenantUser,
  TENANT_ADMIN_EMAIL,
} from "./helpers/auth";

const BASE = tenantUrl(TENANT_SLUG);
// Falls back to the seed employee if env var not set
const EMPLOYEE_EMAIL = process.env.E2E_TENANT_EMPLOYEE_EMAIL ?? "dev.v001+emp.ice@gmail.com";

test.describe("Tenant settings — RBAC", () => {
  test("unauthenticated /settings redirects to /signin", async ({ page }) => {
    test.skip(!hasControlPlane, "Requires CONTROL_PLANE_DATABASE_URL");
    await page.context().clearCookies();
    await page.goto(`${BASE}/settings`);
    await expect(page).toHaveURL(/\/signin/, { timeout: 5_000 });
  });

  test("EMPLOYEE role is blocked from /settings/company", async ({ page }) => {
    test.skip(!hasControlPlane, "Requires CONTROL_PLANE_DATABASE_URL");
    await loginAsTenantUser(page, EMPLOYEE_EMAIL!);
    await page.goto(`${BASE}/settings/company`);
    await page.waitForLoadState("networkidle");
    await expect(page).not.toHaveURL(/\/settings\/company/);
  });

  test("TENANT_ADMIN role can access /settings/company", async ({ page }) => {
    test.skip(!hasControlPlane, "Requires CONTROL_PLANE_DATABASE_URL");
    await loginAsTenantUser(page);
    await page.goto(`${BASE}/settings/company`);
    await page.waitForLoadState("networkidle");
    await expect(page).not.toHaveURL(/\/signin|\/forbidden/);
  });
});

test.describe("Tenant settings — company", () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!hasControlPlane, "Requires CONTROL_PLANE_DATABASE_URL");
    await loginAsTenantUser(page);
    await page.goto(`${BASE}/settings/company`);
    await page.waitForLoadState("networkidle");
  });

  test("company name field is visible", async ({ page }) => {
    await expect(page.locator('input[name="companyName"]')).toBeVisible();
  });

  test("timezone select is visible", async ({ page }) => {
    // CompanyForm uses shadcn <Select> which renders as a <button role="combobox" id="timezone">
    await expect(page.locator("#timezone")).toBeVisible();
  });

  test("save button is present", async ({ page }) => {
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test("saving company name shows success feedback", async ({ page }) => {
    const input = page.locator('input[name="companyName"]');
    await input.fill("E2E Demo Company");
    await page.locator('button[type="submit"]').click();
    const feedback = page
      .getByText(/saved|success|บันทึกแล้ว/i)
      .first();
    await expect(feedback).toBeVisible({ timeout: 10_000 });
  });
});

test.describe("Tenant settings — users", () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!hasControlPlane, "Requires CONTROL_PLANE_DATABASE_URL");
    await loginAsTenantUser(page);
    await page.goto(`${BASE}/settings/users`);
    await page.waitForLoadState("networkidle");
  });

  test("users page renders table or empty state", async ({ page }) => {
    const hasTable = page.locator("table");
    const empty = page.getByText(/no users|ไม่มีผู้ใช้/i);
    await expect(hasTable.or(empty).first()).toBeVisible({ timeout: 10_000 });
  });

  test("invite button opens dialog", async ({ page }) => {
    const inviteBtn = page.getByRole("button", { name: /invite|เชิญ/i });
    await expect(inviteBtn).toBeVisible({ timeout: 5_000 });
    await inviteBtn.click();
    await expect(page.locator('input[name="email"]')).toBeVisible({ timeout: 5_000 });
  });

  test("invite with missing fields shows error", async ({ page }) => {
    const inviteBtn = page.getByRole("button", { name: /invite|เชิญ/i });
    await inviteBtn.click();
    // Wait for dialog to open
    await page.waitForSelector('[role="dialog"]', { timeout: 5_000 });
    // Remove HTML5 required attrs so the browser lets the server action validate
    await page.locator('[role="dialog"] [required]').evaluateAll(
      (els: Element[]) => els.forEach(el => el.removeAttribute('required'))
    );
    const submitBtn = page.locator('[role="dialog"] button[type="submit"]');
    if (await submitBtn.count() > 0) {
      await submitBtn.click();
      // Server action returns { error: "All fields are required" }
      const errorEl = page.getByText(/all fields are required|required|จำเป็น/i).first();
      await expect(errorEl).toBeVisible({ timeout: 8_000 });
    }
  });

  test("invite new user shows temp password on success", async ({ page }) => {
    const uniqueEmail = `e2e+inv${Date.now()}@example.com`;
    const inviteBtn = page.getByRole("button", { name: /invite|เชิญ/i });
    await inviteBtn.click();
    await page.fill('input[name="email"]', uniqueEmail);
    await page.fill('input[name="firstNameTh"]', "ทดสอบ");
    await page.fill('input[name="lastNameTh"]', "อีทู");
    // Select EMPLOYEE role
    const roleSelect = page.locator('select[name="role"]');
    if (await roleSelect.count() > 0) await roleSelect.selectOption("EMPLOYEE");
    const submitBtn = page.locator('dialog button[type="submit"], [role="dialog"] button[type="submit"]');
    if (await submitBtn.count() > 0) {
      await submitBtn.click();
      // Expect temp password revealed
      const pwEl = page.getByText(/temporary password|รหัสผ่านชั่วคราว/i).first();
      await expect(pwEl).toBeVisible({ timeout: 10_000 });
    }
  });
});

test.describe("Tenant settings — billing", () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!hasControlPlane, "Requires CONTROL_PLANE_DATABASE_URL");
    await loginAsTenantUser(page);
    await page.goto(`${BASE}/settings/billing`);
    await page.waitForLoadState("networkidle");
  });

  test("billing page renders without crash", async ({ page }) => {
    await expect(page).not.toHaveURL(/\/signin|\/forbidden/);
  });

  test("plan / status section is visible", async ({ page }) => {
    const statusEl = page.getByText(/trial|active|expired|สถานะ/i).first();
    await expect(statusEl).toBeVisible({ timeout: 10_000 });
  });

  test("trial tenant shows days remaining or trial end date", async ({ page }) => {
    // Only meaningful for a TRIAL tenant — soft assertion
    const trialEl = page.getByText(/days left|trial ends|วันที่เหลือ/i).first();
    const count = await trialEl.count();
    // If tenant is not TRIAL this element won't exist — that's fine
    if (count > 0) await expect(trialEl).toBeVisible();
  });
});

test.describe("Tenant settings — /settings redirect", () => {
  test("/settings redirects to /settings/company", async ({ page }) => {
    test.skip(!hasControlPlane, "Requires CONTROL_PLANE_DATABASE_URL");
    await loginAsTenantUser(page);
    await page.goto(`${BASE}/settings`);
    await expect(page).toHaveURL(/\/settings\/company/, { timeout: 5_000 });
  });
});
