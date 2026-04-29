import { test, expect } from "./helpers/fixtures";

test.describe("HR Attendance — refactored dashboard", () => {
  test.use({ role: "hr" });

  test("page renders title, KPI cards, chart, and table", async ({ page }) => {
    await page.goto("/hr/attendance");
    await page.waitForLoadState("networkidle");

    await expect(page.getByRole("heading", { name: /Attendance|การลงเวลา/i }).first()).toBeVisible({ timeout: 10_000 });

    await expect(page.getByText(/Present Today|เข้างานวันนี้/i)).toBeVisible();
    await expect(page.getByText(/Late Arrivals|มาสาย/i)).toBeVisible();
    await expect(page.getByText(/^Absent$|^ขาดงาน$/i).first()).toBeVisible();
    await expect(page.getByText(/Avg Hours|ชั่วโมงเฉลี่ย/i)).toBeVisible();

    await expect(page.getByText(/Weekly Overview|ภาพรวมรายสัปดาห์/i)).toBeVisible();

    await expect(page.getByText(/Today's Attendance|การลงเวลาวันนี้/i)).toBeVisible();
  });

  test("weekly chart legend shows all three series", async ({ page }) => {
    await page.goto("/hr/attendance");
    await page.waitForLoadState("networkidle");

    const legend = page.locator(".recharts-legend-wrapper");
    await expect(legend).toBeVisible({ timeout: 10_000 });
    await expect(legend.getByText(/^Present$|^เข้างาน$/i)).toBeVisible();
    await expect(legend.getByText(/^Late$|^สาย$/i)).toBeVisible();
    await expect(legend.getByText(/^Absent$|^ขาด$/i)).toBeVisible();
  });

  test("search filters the today table", async ({ page }) => {
    await page.goto("/hr/attendance");
    await page.waitForLoadState("networkidle");

    const search = page.getByPlaceholder(/search by name|ค้นหาชื่อ/i);
    await expect(search).toBeVisible({ timeout: 10_000 });

    await search.fill("zzznoMatchXyz");
    await expect(page.getByText(/No employees match|ไม่มีพนักงาน/i)).toBeVisible({ timeout: 5_000 });
  });

  test("non-HR roles cannot see /hr/attendance", async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    const { loginAs } = await import("./helpers/auth");
    await loginAs(page, "employee");
    await page.goto("/hr/attendance");
    await page.waitForLoadState("networkidle");
    expect(page.url()).not.toContain("/hr/attendance");
    await ctx.close();
  });
});
