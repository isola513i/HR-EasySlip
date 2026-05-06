import { test, expect } from "./helpers/fixtures";

test.describe("HR Holiday Management", () => {
  test.use({ role: "hr" });

  test("can view holiday calendar", async ({ page }) => {
    await page.goto("/hr/holidays");
    await page.waitForLoadState("networkidle");

    // Should show year buttons
    await expect(page.getByRole("button", { name: "2026" })).toBeVisible({ timeout: 10_000 });

    // Should show Add Holiday button
    await expect(page.getByRole("button", { name: /add holiday/i })).toBeVisible();
  });

  test("can open add holiday dialog", async ({ page }) => {
    await page.goto("/hr/holidays");
    await page.waitForLoadState("networkidle");

    await page.getByRole("button", { name: /add holiday/i }).click();

    // Dialog title is "Add Public Holiday".
    await expect(page.getByRole("heading", { name: /add public holiday/i })).toBeVisible({ timeout: 5_000 });
    // Field labels in the dialog use a plain <Label> without htmlFor binding,
    // so getByLabel doesn't resolve. Match by visible text instead.
    await expect(page.getByText(/name \(th\)/i).first()).toBeVisible();
  });
});
