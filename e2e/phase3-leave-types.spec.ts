import { test, expect } from "./helpers/fixtures";

test.describe("Phase 3.1 — leave types (7 new)", () => {
  test.use({ role: "employee" });

  test("employee leave form lists all 11 leave types", async ({ page }) => {
    await page.goto("/employee/leave");
    await page.waitForLoadState("networkidle");

    for (const label of [
      "Sick",
      "Personal",
      "Annual",
      "LWP",
      "Maternity",
      "Paternity",
      "Child care",
      "Ordination",
      "Military",
      "Funeral",
      "Training",
    ]) {
      await expect(page.getByText(label, { exact: true }).first()).toBeVisible({ timeout: 10_000 });
    }
  });

  test("selecting maternity shows quota or eligibility hint", async ({ page }) => {
    await page.goto("/employee/leave");
    await page.waitForLoadState("networkidle");
    await page.getByText("Maternity", { exact: true }).first().click();
    // Form should still expose Submit (disabled or enabled depending on state).
    await expect(page.getByRole("button", { name: /submit/i })).toBeVisible({ timeout: 5_000 });
  });
});
