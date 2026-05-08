import { test, expect } from "./helpers/fixtures";

test.describe("Phase 3.5 — offboarding", () => {
  test.use({ role: "hr" });

  test("HR can view offboarding page", async ({ page }) => {
    await page.goto("/hr/offboarding");
    await page.waitForLoadState("networkidle");
    await expect(page).not.toHaveURL(/\/signin/);
    await expect(page.getByRole("heading", { name: /offboarding/i })).toBeVisible({ timeout: 10_000 });
  });

  test("Start dialog exposes reason select + last day input", async ({ page }) => {
    await page.goto("/hr/offboarding");
    await page.waitForLoadState("networkidle");
    await page.getByRole("button", { name: /^start$/i }).click();

    await expect(page.getByText("Start offboarding")).toBeVisible({ timeout: 5_000 });
    // Reason select trigger should default to RESIGNATION
    await expect(page.getByText("Resignation").first()).toBeVisible();
    // Last day input must accept date
    await expect(page.locator('input[type="date"]').first()).toBeVisible();
  });

  test("HR list API returns ok envelope", async ({ page }) => {
    const res = await page.request.get("/api/v1/hr/offboarding");
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
  });
});
