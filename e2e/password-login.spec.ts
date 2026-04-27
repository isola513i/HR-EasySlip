import { test as base, expect } from "@playwright/test";

base.describe("password login", () => {
  base("shows email and password fields on signin page", async ({ page }) => {
    await page.goto("/signin");
    await expect(page.locator("#email")).toBeVisible();
    await expect(page.locator("#password")).toBeVisible();
  });

  base("shows error on invalid credentials", async ({ page }) => {
    await page.goto("/signin");
    await page.fill("#email", "nobody@example.com");
    await page.fill("#password", "wrongpassword");
    await page.click('button[type="submit"]');
    await expect(page.locator("text=Invalid email or password").or(page.locator("text=อีเมลหรือรหัสผ่าน"))).toBeVisible({ timeout: 5000 });
  });

  base("forgot password link is visible", async ({ page }) => {
    await page.goto("/signin");
    const link = page.locator('a[href="/signin/forgot-password"]');
    await expect(link).toBeVisible();
  });

  base("forgot password page loads", async ({ page }) => {
    await page.goto("/signin/forgot-password");
    await expect(page.locator("#fp-email")).toBeVisible();
  });
});
