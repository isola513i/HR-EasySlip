import { test, expect } from "./helpers/fixtures";

test.describe("Phase 3.6 — observability smoke", () => {
  test.use({ role: "employee" });

  test("home renders without unhandled JS errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });

    await page.goto("/employee/today");
    await page.waitForLoadState("networkidle");

    // Filter out expected dev-only warnings (next-themes hydration mismatch, dev refresh, etc.)
    const real = errors.filter((m) => {
      const lower = m.toLowerCase();
      if (lower.includes("hydrat")) return false;
      if (lower.includes("favicon")) return false;
      if (lower.includes("manifest")) return false;
      if (lower.includes("download the react devtools")) return false;
      return true;
    });
    expect(real, real.join("\n")).toEqual([]);
  });

  test("security headers present on /api/v1/healthz-style routes", async ({ page }) => {
    const res = await page.request.get("/employee/today");
    const headers = res.headers();
    expect(headers["x-frame-options"]).toBe("DENY");
    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
  });
});
