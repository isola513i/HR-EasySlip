import { test, expect } from "./helpers/fixtures";

test.describe("Clock In/Out", () => {
  test.use({ role: "employee" });

  test("can clock in with geolocation", async ({ page, context }) => {
    await context.grantPermissions(["geolocation"]);
    await context.setGeolocation({ latitude: 13.7563, longitude: 100.5018 });

    await page.goto("/employee/clock");
    await page.waitForLoadState("networkidle");

    // Should show clock button (in or out)
    const clockBtn = page.locator("button:has-text('Clock')").first();
    await expect(clockBtn).toBeVisible({ timeout: 10_000 });

    // GPS should be displayed
    await expect(page.getByText(/13\.75/)).toBeVisible({ timeout: 10_000 });
  });
});
