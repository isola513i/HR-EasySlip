import { test, expect } from "./helpers/fixtures";

test.describe("Phase 3.4 — performance reviews (HR)", () => {
  test.use({ role: "hr" });

  test("HR can view reviews page", async ({ page }) => {
    await page.goto("/hr/reviews");
    await page.waitForLoadState("networkidle");
    await expect(page).not.toHaveURL(/\/signin/);
    await expect(page.getByRole("heading", { name: /performance reviews/i })).toBeVisible({ timeout: 10_000 });
  });

  test("New cycle + new template buttons render", async ({ page }) => {
    await page.goto("/hr/reviews");
    await page.waitForLoadState("networkidle");
    await expect(page.getByRole("button", { name: /new cycle/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /new template/i })).toBeVisible();
  });
});

test.describe("Phase 3.4 — performance reviews (employee)", () => {
  test.use({ role: "employee" });

  test("employee reviews page renders without auth redirect", async ({ page }) => {
    await page.goto("/employee/reviews");
    await page.waitForLoadState("networkidle");
    await expect(page).not.toHaveURL(/\/signin/);
    // Page can show either list or empty state.
    const heading = page.getByText("My Reviews");
    await expect(heading).toBeVisible({ timeout: 10_000 });
  });
});
