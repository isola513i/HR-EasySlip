import fs from "node:fs/promises";
import path from "node:path";
import { test, expect } from "./helpers/fixtures";

const EMPEO_FIXTURE = path.join(
  process.cwd(),
  "public",
  "Employee_Data_Report_All_Resign_Inc_08052026.xlsx",
);

test.describe("Phase 4 — Empeo XLSX importer (preview)", () => {
  test.use({ role: "hr" });

  test("dryRun returns format detection + skipped + preview info", async ({ page }) => {
    const exists = await fs.stat(EMPEO_FIXTURE).then(() => true).catch(() => false);
    test.skip(!exists, "Empeo fixture not present");

    const buf = await fs.readFile(EMPEO_FIXTURE);
    const blob = new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const fd = new FormData();
    fd.append("file", blob, "empeo.xlsx");
    fd.append("dryRun", "true");

    const res = await page.request.post("/api/v1/hr/employees/bulk", { multipart: { file: { name: "empeo.xlsx", mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", buffer: buf }, dryRun: "true" } });
    expect(res.ok()).toBeTruthy();
    const body = (await res.json()).data;
    expect(body.format).toBe("empeo-xlsx");
    expect(body).toHaveProperty("totalRows");
    expect(body).toHaveProperty("skipped");
    expect(body).toHaveProperty("newDepartments");
    expect(body).toHaveProperty("newPositions");
  });
});

test.describe("Phase 4 — Empeo importer RBAC", () => {
  test.use({ role: "employee" });

  test("non-HR caller blocked", async ({ page }) => {
    const exists = await fs.stat(EMPEO_FIXTURE).then(() => true).catch(() => false);
    test.skip(!exists, "Empeo fixture not present");

    const buf = await fs.readFile(EMPEO_FIXTURE);
    const res = await page.request.post("/api/v1/hr/employees/bulk", {
      multipart: {
        file: { name: "empeo.xlsx", mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", buffer: buf },
        dryRun: "true",
      },
    });
    expect(res.status()).toBe(403);
  });
});
