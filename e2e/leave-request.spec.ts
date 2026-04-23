import { test, expect } from "./helpers/fixtures";

test.describe("Leave Request", () => {
  test.use({ role: "employee" });

  test("can view leave request page with quotas", async ({ page }) => {
    await page.goto("/employee/leave");
    await page.waitForLoadState("networkidle");

    // Should show leave type buttons
    await expect(page.getByText("Sick")).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText("Personal")).toBeVisible();
    await expect(page.getByText("Annual")).toBeVisible();

    // Should show submit button
    await expect(page.getByRole("button", { name: /submit/i })).toBeVisible();
  });

  test("submit button is disabled without required fields", async ({ page }) => {
    await page.goto("/employee/leave");
    await page.waitForLoadState("networkidle");

    const submitBtn = page.getByRole("button", { name: /submit/i });
    await expect(submitBtn).toBeDisabled();
  });
});
