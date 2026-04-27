import { test, expect } from "./helpers/fixtures";

test.describe("employee onboarding", () => {
  test.use({ role: "employee" });

  test("onboarding page loads with welcome message", async ({ page }) => {
    await page.goto("/employee/onboarding");
    await expect(page.locator("text=EasySlip HR").first()).toBeVisible();
  });

  test("onboarding checklist shows progress", async ({ page }) => {
    await page.goto("/employee/onboarding");
    // Should show either checklist items or "no checklist" message
    const hasChecklist = page.locator("text=Onboarding Progress").or(page.locator("text=ความคืบหน้า"));
    const noChecklist = page.locator("text=No onboarding").or(page.locator("text=ไม่มีรายการ"));
    await expect(hasChecklist.or(noChecklist)).toBeVisible({ timeout: 5000 });
  });
});

test.describe("HR onboarding management", () => {
  test.use({ role: "hr" });

  test("HR can access onboarding page", async ({ page }) => {
    await page.goto("/hr/onboarding");
    await expect(page).not.toHaveURL(/\/signin/);
  });

  test("HR can see progress and templates tabs", async ({ page }) => {
    await page.goto("/hr/onboarding");
    const progressTab = page.locator("text=Progress").or(page.locator("text=ความคืบหน้า"));
    const templatesTab = page.locator("text=Templates");
    await expect(progressTab).toBeVisible();
    await expect(templatesTab).toBeVisible();
  });
});
