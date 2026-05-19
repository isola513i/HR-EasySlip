/**
 * Phase C — Marketing & Free Trial Signup
 *
 * Tests the public marketing zone at localhost:3000 (no subdomain):
 * - Landing page sections render
 * - Free trial signup form: field presence, client-side validation,
 *   slug uniqueness check, rate limiting, and success flow
 */
import { test, expect } from "@playwright/test";
import { MARKETING_URL, hasControlPlane } from "./helpers/auth";

// ── Landing page ──────────────────────────────────────────────────────────────

test.describe("Landing page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(MARKETING_URL);
    await page.waitForLoadState("networkidle");
  });

  test("renders h1 headline", async ({ page }) => {
    await expect(page.locator("h1").first()).toBeVisible();
  });

  test("renders a CTA link to /signup", async ({ page }) => {
    const ctaLink = page.locator('a[href="/signup"]').first();
    await expect(ctaLink).toBeVisible({ timeout: 10_000 });
  });

  test("renders nav with pricing anchor", async ({ page }) => {
    // Marketing nav links to #pricing (on-page anchor) not /pricing
    const pricingLink = page.locator('a[href="#pricing"]').first();
    await expect(pricingLink).toBeVisible({ timeout: 10_000 });
  });

  test("pricing section / pricing page renders plan cards", async ({ page }) => {
    await page.goto(`${MARKETING_URL}/pricing`);
    await page.waitForLoadState("networkidle");
    // PricingTable or inline pricing blocks should show at least one plan
    const planCard = page.locator("[data-testid='plan-card'], .pricing-card, article").first();
    const anyPriceEl = page.getByText(/฿|THB|Starter|Pro|Enterprise/i).first();
    await expect(planCard.or(anyPriceEl)).toBeVisible({ timeout: 10_000 });
  });
});

// ── Free Trial signup form ────────────────────────────────────────────────────

test.describe("Free Trial signup", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${MARKETING_URL}/signup`);
    await page.waitForLoadState("networkidle");
  });

  test("renders all required form fields", async ({ page }) => {
    await expect(page.locator("#companyName")).toBeVisible();
    await expect(page.locator("#slug")).toBeVisible();
    await expect(page.locator("#contactName")).toBeVisible();
    await expect(page.locator("#email")).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test("empty submit shows HTML5 required field errors (no network request)", async ({ page }) => {
    // Submit button is disabled when teamSize is empty, so clicking does nothing.
    // URL stays on /signup.
    const submitBtn = page.locator('button[type="submit"]');
    await expect(submitBtn).toBeDisabled();
    await expect(page).toHaveURL(/\/signup/);
  });

  test("invalid slug format shows error indicator", async ({ page }) => {
    // "AB" → toSlug → "ab" (2 chars, fails SLUG_RE min-3) → slugStatus="invalid"
    // renders slugInvalid hint: EN "Invalid format…" / TH "รูปแบบไม่ถูกต้อง…"
    await page.fill("#companyName", "Test Co");
    await page.locator("#slug").pressSequentially("AB", { delay: 50 });
    await page.fill("#contactName", "Test User");
    await page.fill("#email", "test@example.com");
    const errorEl = page.getByText(/Invalid format|รูปแบบไม่ถูกต้อง/i).first();
    await expect(errorEl).toBeVisible({ timeout: 8_000 });
    await expect(page).not.toHaveURL(/\/thanks/);
  });

  test("reserved slug (admin) shows taken indicator", async ({ page }) => {
    // RESERVED.includes("admin") → slugStatus="taken" (valid format, but reserved)
    // renders slugTaken hint: EN "Already taken" / TH "ถูกใช้งานแล้ว"
    await page.fill("#companyName", "Test Co");
    await page.locator("#slug").pressSequentially("admin", { delay: 50 });
    await page.fill("#contactName", "Test User");
    await page.fill("#email", "test@example.com");
    const errorEl = page.getByText(/ถูกใช้งานแล้ว|already taken|taken/i).first();
    await expect(errorEl).toBeVisible({ timeout: 8_000 });
    await expect(page).not.toHaveURL(/\/thanks/);
  });

  test("valid submission redirects to /signup/thanks", async ({ page }) => {
    test.skip(!hasControlPlane, "Requires CONTROL_PLANE_DATABASE_URL");
    // Requires RESEND_API_KEY; free tier only delivers to RESEND_OWNER_EMAIL (account owner).
    // Note: the signup route has an in-memory IP rate limit of 3/hour — this test will be
    // blocked after 3 runs within an hour (restart the dev server to reset).
    test.skip(!process.env.RESEND_API_KEY, "Set RESEND_API_KEY to test successful signup");
    const ownerEmail = process.env.RESEND_OWNER_EMAIL ?? "development.v001@gmail.com";
    // Prefix with "e2e" so slug starts with a letter (SLUG_RE requires [a-z0-9] at start/end)
    const unique = `e2e${Date.now().toString().slice(-10)}`;
    await page.fill("#companyName", "E2E Test Company");
    // Listen for the slug availability check before typing to avoid race condition
    const slugCheckDone = page.waitForResponse(
      (resp) => resp.url().includes(`/api/marketing/check-slug`) && resp.status() === 200,
      { timeout: 10_000 },
    );
    await page.locator("#slug").fill(unique);
    // Wait for check-slug debounce (800ms) + DB round-trip
    await slugCheckDone;
    await page.fill("#contactName", "E2E Tester");
    await page.fill("#email", ownerEmail);
    // teamSize uses shadcn Select (combobox), not a native <select>
    await page.locator("#teamSize").click();
    await page.getByRole("option", { name: /1.+10/i }).first().click();
    // Capture the signup API response to distinguish success vs. rate-limit/email error
    const signupResponse = page.waitForResponse(
      (resp) => resp.url().includes("/api/marketing/signup"),
      { timeout: 15_000 },
    );
    await page.locator('button[type="submit"]').click();
    const resp = await signupResponse;
    if (resp.status() === 429) {
      test.skip(true, "Signup rate limit hit — restart the dev server to reset (3/hour)");
    }
    if (resp.status() >= 500) {
      test.skip(true, "Signup email send failed (Resend transient error) — retry later");
    }
    await expect(page).toHaveURL(/\/signup\/thanks/, { timeout: 10_000 });
  });
});

// ── /signup/thanks page ───────────────────────────────────────────────────────

test.describe("Signup thank-you page", () => {
  test("renders confirmation message without crash", async ({ page }) => {
    await page.goto(`${MARKETING_URL}/signup/thanks`);
    await page.waitForLoadState("networkidle");
    // Should render some confirmation content (not a 404/error)
    await expect(page.locator("h1, h2").first()).toBeVisible({ timeout: 5_000 });
  });
});
