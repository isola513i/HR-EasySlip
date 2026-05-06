import { test, expect } from "./helpers/fixtures";

test.describe("Manager Inbox — 3-tab approval surface", () => {
  test.use({ role: "manager" });

  test("renders all three tabs (Leave / Time Adjustment / Overtime)", async ({ page }) => {
    await page.goto("/manager/inbox");
    await page.waitForLoadState("networkidle");

    await expect(page.getByRole("tab", { name: /leave|ลางาน/i })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole("tab", { name: /time adjustment|ขอแก้ไขเวลา/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: /^overtime$|^OT$/i })).toBeVisible();
  });

  test("can switch to Time Adjustment tab", async ({ page }) => {
    await page.goto("/manager/inbox");
    await page.waitForLoadState("networkidle");

    await page.getByRole("tab", { name: /time adjustment|ขอแก้ไขเวลา/i }).click();

    // Either pending requests appear, or the empty-state copy is shown
    const empty = page.getByText(/no pending|ไม่มีคำขอ/i);
    const cards = page.locator("[role='tabpanel']").filter({ hasText: /clock|เข้างาน|ออกงาน/i });
    await expect(empty.or(cards).first()).toBeVisible({ timeout: 10_000 });
  });

  test("can switch to Overtime tab", async ({ page }) => {
    await page.goto("/manager/inbox");
    await page.waitForLoadState("networkidle");

    const overtimeTab = page.getByRole("tab", { name: /^overtime$|^OT$/i });
    await overtimeTab.click();

    // Verify the click actually selected the tab (Radix sets aria-selected
    // on the active tab). This is a stable assertion regardless of whether
    // the panel has pending content or empty state.
    await expect(overtimeTab).toHaveAttribute("aria-selected", "true", { timeout: 10_000 });
  });
});
