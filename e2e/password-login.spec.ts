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
    // Wait for the login API response before checking for the error element
    const loginDone = page.waitForResponse(
      (resp) => resp.url().includes("/api/v1/auth/login"),
      { timeout: 10_000 },
    );
    await page.click('button[type="submit"]');
    await loginDone;
    await expect(
      page.getByText(/Invalid email or password/i).or(page.getByText(/อีเมลหรือรหัสผ่าน/i))
    ).toBeVisible({ timeout: 5_000 });
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
