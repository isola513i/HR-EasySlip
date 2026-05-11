import { test, expect } from "./helpers/fixtures";

test.describe("Employee portal — smoke suite", () => {
  test.use({ role: "employee" });

  test("home screen renders hero card and quick actions", async ({ page }) => {
    await page.goto("/employee/today");
    await page.waitForLoadState("networkidle");

    // Hero clock card is the centrepiece of the today screen
    await expect(page.getByRole("button", { name: /tap to clock|clock (in|out)|ลงเวลา/i })
      .or(page.getByText(/not started|working|day complete|ยังไม่เริ่ม|กำลังทำงาน/i)).first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test("bottom nav has exactly 5 tabs for employee", async ({ page }) => {
    await page.goto("/employee/today");
    await page.waitForLoadState("networkidle");

    const nav = page.getByRole("navigation", { name: /primary|เมนูหลัก/i });
    await expect(nav).toBeVisible({ timeout: 10_000 });

    const links = nav.getByRole("link");
    await expect(links).toHaveCount(5);
  });

  test("clock screen loads with location prompt", async ({ page, context }) => {
    await context.grantPermissions(["geolocation"]);
    await context.setGeolocation({ latitude: 13.7563, longitude: 100.5018 });

    await page.goto("/employee/clock");
    await page.waitForLoadState("networkidle");

    await expect(
      page.getByRole("button", { name: /clock|ลงเวลา/i }).first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test("leave screen shows leave type options and disabled submit", async ({ page }) => {
    await page.goto("/employee/leave");
    await page.waitForLoadState("networkidle");

    await expect(
      page.getByText(/sick|ลาป่วย/i).first()
    ).toBeVisible({ timeout: 10_000 });

    const submitBtn = page.getByRole("button", { name: /submit|ส่งคำขอ/i });
    await expect(submitBtn).toBeDisabled();
  });

  test("inbox screen loads without crash", async ({ page }) => {
    await page.goto("/employee/inbox");
    await page.waitForLoadState("networkidle");
    await expect(page).not.toHaveURL(/signin|forbidden/);
  });

  test("profile screen loads personal info", async ({ page }) => {
    await page.goto("/employee/me");
    await page.waitForLoadState("networkidle");
    await expect(page).not.toHaveURL(/signin|forbidden/);
    // Profile page always renders a sign-out button
    await expect(
      page.getByRole("button", { name: /sign out|ออกจากระบบ/i })
    ).toBeVisible({ timeout: 10_000 });
  });

  test("timesheet screen loads without crash", async ({ page }) => {
    await page.goto("/employee/timesheet");
    await page.waitForLoadState("networkidle");
    await expect(page).not.toHaveURL(/signin|forbidden/);
  });
});
