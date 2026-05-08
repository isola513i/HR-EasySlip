import { test, expect } from "./helpers/fixtures";

test.describe("Phase 3.8 — geofence override flow", () => {
  test("employee submits override → HR sees pending → HR approves", async ({ browser }) => {
    // Use two contexts so each carries its own session cookie.
    const empCtx = await browser.newContext();
    const hrCtx = await browser.newContext();
    const empPage = await empCtx.newPage();
    const hrPage = await hrCtx.newPage();
    const { loginAs } = await import("./helpers/auth");
    await loginAs(empPage, "employee");
    await loginAs(hrPage, "hr");

    const submit = await empPage.request.post("/api/v1/attendance/geofence-override", {
      data: { reason: "Client visit at customer site (E2E)" },
    });
    expect(submit.ok()).toBeTruthy();
    const created = (await submit.json()).data;
    expect(created.status).toBe("PENDING");

    // Duplicate submit while one is pending → ALREADY_PROCESSED.
    const dupe = await empPage.request.post("/api/v1/attendance/geofence-override", {
      data: { reason: "Another reason that meets length" },
    });
    expect(dupe.status()).toBe(400);

    // HR sees it in pending list.
    const pending = await hrPage.request.get("/api/v1/attendance/geofence-override/pending");
    expect(pending.ok()).toBeTruthy();
    const pendingItems = (await pending.json()).data as Array<{ id: string }>;
    expect(pendingItems.some((i) => i.id === created.id)).toBe(true);

    // HR approves.
    const decide = await hrPage.request.patch(
      `/api/v1/attendance/geofence-override/${created.id}`,
      { data: { decision: "APPROVED", decisionNote: "ok" } },
    );
    expect(decide.ok()).toBeTruthy();
    const updated = (await decide.json()).data;
    expect(updated.status).toBe("APPROVED");

    // Employee history reflects the approval.
    const my = await empPage.request.get("/api/v1/attendance/geofence-override/me");
    const mine = (await my.json()).data as Array<{ id: string; status: string }>;
    expect(mine.find((i) => i.id === created.id)?.status).toBe("APPROVED");

    await empCtx.close();
    await hrCtx.close();
  });

  test("regular employee blocked from /pending list", async ({ page }) => {
    // Default fixture role = employee.
    const res = await page.request.get("/api/v1/attendance/geofence-override/pending");
    expect(res.status()).toBeGreaterThanOrEqual(401);
    expect(res.status()).toBeLessThan(500);
  });
});
