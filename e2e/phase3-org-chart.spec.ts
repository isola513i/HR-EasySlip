import { test, expect } from "./helpers/fixtures";

test.describe("Phase 3.2 — org chart", () => {
  test.use({ role: "hr" });

  test("HR can view org chart page", async ({ page }) => {
    await page.goto("/hr/org-chart");
    await page.waitForLoadState("networkidle");
    await expect(page).not.toHaveURL(/\/signin/);
    await expect(page.getByRole("heading", { name: /organisation chart/i })).toBeVisible({ timeout: 10_000 });
  });

  test("search input + expand/collapse controls render", async ({ page }) => {
    await page.goto("/hr/org-chart");
    await page.waitForLoadState("networkidle");
    await expect(page.getByPlaceholder(/search name/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /expand all/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /collapse all/i })).toBeVisible();
  });

  test("API returns a non-empty tree", async ({ page }) => {
    const res = await page.request.get("/api/v1/hr/org-chart");
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBeGreaterThan(0);
  });
});

test.describe("Phase 3.2 — org chart RBAC", () => {
  test.use({ role: "employee" });

  test("regular employee blocked from /api/v1/hr/org-chart", async ({ page }) => {
    const res = await page.request.get("/api/v1/hr/org-chart");
    expect(res.status()).toBe(403);
  });
});
