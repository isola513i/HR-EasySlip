import { test, expect } from "./helpers/fixtures";

test.describe("Phase 6 — Payroll reminders cron", () => {
  test("cron route rejects unauthenticated requests", async ({ request }) => {
    const res = await request.get("/api/v1/system/cron/payroll-reminders");
    expect([401, 500]).toContain(res.status());
  });

  test("cron route accepts valid CRON_SECRET", async ({ request }) => {
    const secret = process.env.CRON_SECRET;
    test.skip(!secret, "CRON_SECRET not set in dev env");
    const res = await request.get("/api/v1/system/cron/payroll-reminders", {
      headers: { authorization: `Bearer ${secret}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.data).toHaveProperty("ranAt");
    expect(body.data).toHaveProperty("recipients");
    expect(body.data).toHaveProperty("notificationsCreated");
  });
});

test.describe("Phase 6 — Notifications API (HR)", () => {
  test.use({ role: "hr" });

  test("returns shape for logged-in user", async ({ page }) => {
    const res = await page.request.get("/api/v1/notifications?limit=5");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.data).toHaveProperty("items");
    expect(body.data).toHaveProperty("unreadCount");
    expect(Array.isArray(body.data.items)).toBe(true);
  });

  test("mark-all-read returns count", async ({ page }) => {
    const res = await page.request.post("/api/v1/notifications/mark-all-read");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(typeof body.data.updated).toBe("number");
  });
});

test.describe("Phase 6 — Notifications API (unauth)", () => {
  test("rejects requests without session", async ({ request }) => {
    const res = await request.get("/api/v1/notifications");
    expect(res.status()).toBe(401);
  });
});
