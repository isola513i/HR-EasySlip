import { test, expect } from "./helpers/fixtures";

test.describe("Manager Approval Inbox", () => {
  test.use({ role: "manager" });

  test("can view approval inbox", async ({ page }) => {
    await page.goto("/manager/inbox");
    await page.waitForLoadState("networkidle");

    // Should show the inbox page (either requests or empty state)
    const hasRequests = await page.getByText(/pending/i).isVisible().catch(() => false);
    const isEmpty = await page.getByText(/no pending/i).isVisible().catch(() => false);

    expect(hasRequests || isEmpty).toBeTruthy();
  });

  test("search input is visible", async ({ page }) => {
    await page.goto("/manager/inbox");
    await page.waitForLoadState("networkidle");

    await expect(page.getByPlaceholder(/search/i)).toBeVisible({ timeout: 10_000 });
  });
});
