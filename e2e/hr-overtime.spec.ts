import { test, expect } from "./helpers/fixtures";

test.describe("HR Overtime — org-wide oversight page", () => {
  test.use({ role: "hr" });

  test("loads with summary cards", async ({ page }) => {
    await page.goto("/hr/overtime");
    await page.waitForLoadState("networkidle");

    // Two summary cards: OT records + Approved hours
    await expect(page.getByText(/OT records|จำนวนรายการ/i)).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/approved hours|ชั่วโมงที่อนุมัติ/i)).toBeVisible();
  });

  test("status filter buttons render and are clickable", async ({ page }) => {
    await page.goto("/hr/overtime");
    await page.waitForLoadState("networkidle");

    const pendingBtn = page.getByRole("button", { name: /^pending$|^รออนุมัติ$/i });
    const approvedBtn = page.getByRole("button", { name: /^approved$|^อนุมัติแล้ว$/i });

    await expect(pendingBtn).toBeVisible({ timeout: 10_000 });
    await expect(approvedBtn).toBeVisible();

    // Toggle to APPROVED — page should not error
    await approvedBtn.click();
    await page.waitForLoadState("networkidle");
  });

  test("redirects non-HR roles", async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();

    // Login as employee, then try the HR page directly
    const { loginAs } = await import("./helpers/auth");
    await loginAs(page, "employee");
    await page.goto("/hr/overtime");
    await page.waitForLoadState("networkidle");

    // Layout-level requireRoles redirects out of /hr/* — should NOT be on /hr/overtime
    expect(page.url()).not.toContain("/hr/overtime");

    await ctx.close();
  });
});
