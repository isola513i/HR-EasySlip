import { test, expect } from "./helpers/fixtures";

test.describe("Phase 3.3 — assets (HR)", () => {
  test.use({ role: "hr" });

  test("HR can view assets page", async ({ page }) => {
    await page.goto("/hr/assets");
    await page.waitForLoadState("networkidle");
    await expect(page).not.toHaveURL(/\/signin/);
    await expect(page.getByRole("heading", { name: /asset management/i })).toBeVisible({ timeout: 10_000 });
  });

  test("Add asset button is visible", async ({ page }) => {
    await page.goto("/hr/assets");
    await page.waitForLoadState("networkidle");
    await expect(page.getByRole("button", { name: /add asset/i })).toBeVisible();
  });

  test("HR API list returns ok envelope", async ({ page }) => {
    const res = await page.request.get("/api/v1/hr/assets");
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
  });

  test("update PATCH does not accept status field", async ({ page }) => {
    // First create one so we have a target id.
    const created = await page.request.post("/api/v1/hr/assets", {
      data: { type: "LAPTOP", brand: "E2E", model: "Patch-test" },
    });
    expect(created.ok()).toBeTruthy();
    const { data: asset } = await created.json();

    const bad = await page.request.patch(`/api/v1/hr/assets/${asset.id}`, {
      data: { status: "ASSIGNED" },
    });
    // Schema strips status; the request should still succeed but status stays AVAILABLE.
    expect(bad.ok()).toBeTruthy();
    const get = await page.request.get("/api/v1/hr/assets");
    const list = (await get.json()).data;
    const after = list.find((a: { id: string }) => a.id === asset.id);
    expect(after.status).toBe("AVAILABLE");
  });
});

test.describe("Phase 3.3 — assets (employee)", () => {
  test.use({ role: "employee" });

  test("My Assets section appears on profile", async ({ page }) => {
    await page.goto("/employee/me");
    await page.waitForLoadState("networkidle");
    await expect(page.getByText("My Assets")).toBeVisible({ timeout: 10_000 });
  });
});
