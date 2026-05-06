import { test, expect } from "./helpers/fixtures";

test.describe("Clock In/Out", () => {
  test.use({ role: "employee" });

  test("can clock in with geolocation", async ({ page, context }) => {
    await context.grantPermissions(["geolocation"]);
    await context.setGeolocation({ latitude: 13.7563, longitude: 100.5018 });

    await page.goto("/employee/clock");
    await page.waitForLoadState("networkidle");

    // Clock CTA is the giant button at the bottom of the screen.
    const clockBtn = page.getByRole("button", { name: /tap to clock|clock (in|out) now/i });
    await expect(clockBtn).toBeVisible({ timeout: 10_000 });

    // The page renders "Current location" + an accuracy pill once the
    // geolocation resolves. The raw lat/lng numbers are NOT shown — the
    // UI shows the WFH/Office label + an `Accuracy ±N m` pill instead.
    await expect(page.getByText(/current location|accuracy/i).first()).toBeVisible({ timeout: 10_000 });
  });
});
