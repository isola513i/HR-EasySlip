import { test, expect } from "./helpers/fixtures";

test.describe("Phase 3.9 — expense (employee)", () => {
  test.use({ role: "employee" });

  test("employee expense page loads", async ({ page }) => {
    await page.goto("/employee/expense");
    await page.waitForLoadState("networkidle");
    await expect(page).not.toHaveURL(/\/signin/);
    await expect(page.getByRole("heading", { name: /expense claims/i })).toBeVisible({ timeout: 10_000 });
  });

  test("New claim dialog has all required fields", async ({ page }) => {
    await page.goto("/employee/expense");
    await page.waitForLoadState("networkidle");
    await page.getByRole("button", { name: /new claim/i }).click();

    await expect(page.getByText("Submit a new expense")).toBeVisible({ timeout: 5_000 });
    await expect(page.getByLabel(/amount/i)).toBeVisible();
    await expect(page.getByLabel(/category/i)).toBeVisible();
    await expect(page.getByLabel(/date of expense/i)).toBeVisible();
    await expect(page.getByLabel(/description/i)).toBeVisible();
  });

  test("submit + cancel happy path via API", async ({ page }) => {
    const create = await page.request.post("/api/v1/expense", {
      data: {
        amountTHB: 350.5,
        category: "MEAL",
        description: "E2E lunch with client (auto-test)",
        occurredOn: new Date().toISOString().slice(0, 10),
      },
    });
    expect(create.ok()).toBeTruthy();
    const claim = (await create.json()).data;
    expect(claim.status).toBe("PENDING");

    const cancel = await page.request.post(`/api/v1/expense/${claim.id}/cancel`);
    expect(cancel.ok()).toBeTruthy();
    expect((await cancel.json()).data.status).toBe("CANCELLED");
  });

  test("rejecting requires rejectReason", async ({ browser }) => {
    const empCtx = await browser.newContext();
    const hrCtx = await browser.newContext();
    const emp = await empCtx.newPage();
    const hr = await hrCtx.newPage();
    const { loginAs } = await import("./helpers/auth");
    await loginAs(emp, "employee");
    await loginAs(hr, "hr");

    const create = await emp.request.post("/api/v1/expense", {
      data: {
        amountTHB: 99,
        category: "OTHER",
        description: "Reject-flow E2E test",
        occurredOn: new Date().toISOString().slice(0, 10),
      },
    });
    const claim = (await create.json()).data;

    const noReason = await hr.request.patch(`/api/v1/expense/${claim.id}`, {
      data: { decision: "REJECTED" },
    });
    expect(noReason.status()).toBe(400);

    const ok = await hr.request.patch(`/api/v1/expense/${claim.id}`, {
      data: { decision: "REJECTED", rejectReason: "Out of policy" },
    });
    expect(ok.ok()).toBeTruthy();

    await empCtx.close();
    await hrCtx.close();
  });
});

test.describe("Phase 3.9 — expense (HR)", () => {
  test.use({ role: "hr" });

  test("HR dashboard loads", async ({ page }) => {
    await page.goto("/hr/expense");
    await page.waitForLoadState("networkidle");
    await expect(page).not.toHaveURL(/\/signin/);
    await expect(page.getByRole("heading", { name: /expense claims/i })).toBeVisible({ timeout: 10_000 });
  });

  test("HR list endpoint paginates with total", async ({ page }) => {
    const res = await page.request.get("/api/v1/hr/expense");
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.data).toHaveProperty("items");
    expect(body.data).toHaveProperty("total");
  });
});
