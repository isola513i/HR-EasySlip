import { test, expect } from "./helpers/fixtures";

test.describe("HR payroll management", () => {
  test.use({ role: "hr" });

  test("payroll page loads with cycle data", async ({ page }) => {
    await page.goto("/hr/payroll");
    await expect(page).not.toHaveURL(/\/signin/);
    // Should show payroll table or empty state
    const table = page.locator("text=Month").or(page.locator("text=เดือน"));
    const empty = page.locator("text=No payroll").or(page.locator("text=ไม่มีรอบเงินเดือน"));
    await expect(table.or(empty)).toBeVisible({ timeout: 5000 });
  });

  test("export buttons are visible", async ({ page }) => {
    await page.goto("/hr/payroll");
    const exportBtn = page.locator("text=Employee Data").or(page.locator("text=ข้อมูลพนักงาน"));
    await expect(exportBtn).toBeVisible({ timeout: 5000 });
  });
});
