import { test as base, expect } from "@playwright/test";
import { test } from "./helpers/fixtures";

base.describe("unauthenticated", () => {
  base("redirects to signin page", async ({ page }) => {
    await page.goto("/employee/today");
    await expect(page).toHaveURL(/\/signin/);
  });
});

test.describe("authenticated", () => {
  test.use({ role: "employee" });

  test("employee can access dashboard after login", async ({ page }) => {
    await page.goto("/employee/today");
    await expect(page).not.toHaveURL(/\/signin/);
  });
});

test.describe("HR login", () => {
  test.use({ role: "hr" });

  test("HR can access admin overview", async ({ page }) => {
    await page.goto("/hr/overview");
    await expect(page).not.toHaveURL(/\/signin/);
  });
});
