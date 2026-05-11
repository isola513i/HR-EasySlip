import { test, expect } from "./helpers/fixtures";

test.describe("HR portal — smoke suite", () => {
  test.use({ role: "hr" });

  test("overview page renders KPI grid", async ({ page }) => {
    await page.goto("/hr/overview");
    await page.waitForLoadState("networkidle");
    await expect(page).not.toHaveURL(/signin|forbidden/);
    // At least one KPI card number is visible
    await expect(
      page.locator("div.tabular-nums, span.tabular-nums").first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test("employees directory loads table or empty state", async ({ page }) => {
    await page.goto("/hr/employees");
    await page.waitForLoadState("networkidle");
    await expect(page).not.toHaveURL(/signin|forbidden/);

    const hasRows = page.getByRole("row").nth(1); // skip header row
    const empty = page.getByText(/no employees|ไม่มีพนักงาน/i);
    await expect(hasRows.or(empty).first()).toBeVisible({ timeout: 10_000 });
  });

  test("leave management page loads without crash", async ({ page }) => {
    await page.goto("/hr/leave");
    await page.waitForLoadState("networkidle");
    await expect(page).not.toHaveURL(/signin|forbidden/);
  });

  test("overtime page loads without crash", async ({ page }) => {
    await page.goto("/hr/overtime");
    await page.waitForLoadState("networkidle");
    await expect(page).not.toHaveURL(/signin|forbidden/);
  });

  test("attendance page loads without crash", async ({ page }) => {
    await page.goto("/hr/attendance");
    await page.waitForLoadState("networkidle");
    await expect(page).not.toHaveURL(/signin|forbidden/);
  });

  test("holidays page loads and shows create button", async ({ page }) => {
    await page.goto("/hr/holidays");
    await page.waitForLoadState("networkidle");
    await expect(page).not.toHaveURL(/signin|forbidden/);

    await expect(
      page.getByRole("button", { name: /add|create|เพิ่ม/i }).first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test("audit log page loads without crash", async ({ page }) => {
    await page.goto("/hr/audit");
    await page.waitForLoadState("networkidle");
    await expect(page).not.toHaveURL(/signin|forbidden/);
  });

  test("plain employee is blocked from HR portal", async ({ page, context }) => {
    // Override role mid-test by clearing session and logging in as employee
    await context.clearCookies();
    const { loginAs } = await import("./helpers/auth");
    await loginAs(page, "employee");

    await page.goto("/hr/overview");
    await page.waitForLoadState("networkidle");
    await expect(page).not.toHaveURL(/\/hr\/overview/);
  });
});
