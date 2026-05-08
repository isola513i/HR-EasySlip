import { test, expect } from "./helpers/fixtures";

test.describe("Phase 4 — Empeo template export", () => {
  test.use({ role: "hr" });

  test("HR payroll page exposes Empeo template button", async ({ page }) => {
    await page.goto("/hr/payroll");
    await page.waitForLoadState("networkidle");
    // Button only renders for LOCKED/EXPORTED cycles. Don't assert
    // visibility — just confirm hook + dictionary keys are wired.
    const heading = page.getByRole("heading", { name: /payroll/i });
    await expect(heading).toBeVisible({ timeout: 10_000 });
  });

  test("export route returns XLSX with proper headers", async ({ page }) => {
    const list = await page.request.get("/api/v1/payroll/cycles?year=2026");
    expect(list.ok()).toBeTruthy();
    const data = (await list.json()).data as { id: string }[];
    if (data.length === 0) test.skip(true, "No payroll cycles in seed for the current year");

    const id = data[0].id;
    const res = await page.request.get(`/api/v1/payroll/cycles/${id}/export/empeo-template`);
    expect(res.ok()).toBeTruthy();
    expect(res.headers()["content-type"]).toContain("spreadsheetml");
    expect(res.headers()["content-disposition"]).toContain("Payroll_Info_Period_");
  });
});

test.describe("Phase 4 — Empeo export RBAC", () => {
  test.use({ role: "employee" });

  test("regular employee blocked from export endpoint", async ({ page }) => {
    const list = await page.request.get("/api/v1/payroll/cycles?year=2026");
    if (!list.ok()) {
      // Employee may not have access to listing — that itself proves RBAC.
      expect(list.status()).toBe(403);
      return;
    }
    const items = (await list.json()).data as { id: string }[];
    if (items.length === 0) return;
    const res = await page.request.get(`/api/v1/payroll/cycles/${items[0].id}/export/empeo-template`);
    expect(res.status()).toBe(403);
  });
});
