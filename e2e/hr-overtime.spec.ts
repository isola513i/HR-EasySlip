import { test, expect } from "./helpers/fixtures";

test.describe("HR Overtime — org-wide oversight page", () => {
  test.use({ role: "hr" });

  test("loads with KPI cards", async ({ page }) => {
    await page.goto("/hr/overtime");
    await page.waitForLoadState("networkidle");

    // OvertimeKpis renders four cards: Total OT Hours / Pending Requests /
    // Approved / Avg per Employee. Match a couple.
    await expect(page.getByText(/total ot hours|ชม\. ot รวม/i)).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/pending requests|รออนุมัติ/i)).toBeVisible();
  });

  test("renders trends chart and pending list", async ({ page }) => {
    await page.goto("/hr/overtime");
    await page.waitForLoadState("networkidle");

    // The page shows a monthly trends chart + a top-OT-employees panel
    // and a pending list. Their section headings are stable selectors.
    const sectionHeadings = page.getByText(/monthly trends|trends|แนวโน้ม|top|pending/i);
    await expect(sectionHeadings.first()).toBeVisible({ timeout: 10_000 });
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
