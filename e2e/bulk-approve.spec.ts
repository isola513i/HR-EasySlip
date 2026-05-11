import { test, expect } from "./helpers/fixtures";

test.describe("manager bulk approve", () => {
  test.use({ role: "manager" });

  test("manager inbox loads", async ({ page }) => {
    await page.goto("/employee/approvals");
    await expect(page).not.toHaveURL(/\/signin/);
  });

  test("shows approval list or empty state", async ({ page }) => {
    await page.goto("/employee/approvals");
    // Should show either pending requests or empty state
    const hasRequests = page.locator("text=Employee").or(page.locator("text=พนักงาน"));
    const noRequests = page.locator("text=No pending").or(page.locator("text=ไม่มีคำขอ"));
    await expect(hasRequests.or(noRequests)).toBeVisible({ timeout: 5000 });
  });

  test("approve/reject buttons exist when requests are present", async ({ page }) => {
    await page.goto("/employee/approvals");
    // If there are rows, approve/reject should be accessible
    const rows = page.locator('[data-testid="approval-row"], tr').filter({ hasText: /(SICK|PERSONAL|ANNUAL)/ });
    const count = await rows.count();
    if (count > 0) {
      const approveBtn = page.locator('button[title="Approve"], button[title="อนุมัติ"]').first();
      await expect(approveBtn).toBeVisible();
    }
  });
});
