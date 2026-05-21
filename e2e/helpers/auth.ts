import type { Page } from "@playwright/test";

const TEST_SECRET = process.env.E2E_TEST_SECRET ?? "test-secret-dev";
export const TENANT_SLUG = process.env.E2E_TENANT_SLUG ?? "demo";
export const BASE_URL = process.env.E2E_BASE_URL ?? "http://localhost:3000";
export const TENANT_BASE = `${BASE_URL}/${TENANT_SLUG}`;

const ROLE_EMAILS: Record<string, string> = {
  employee: "dev.v001+emp.ice@gmail.com",
  manager: "dev.v001+mgr.eng@gmail.com",
  hr: "development.v001@gmail.com",
  ceo: "dev.v001+ceo@gmail.com",
};

export async function loginAs(page: Page, role: keyof typeof ROLE_EMAILS) {
  const email = ROLE_EMAILS[role];
  if (!email) throw new Error(`Unknown role: ${role}`);

  const res = await page.request.post(`${BASE_URL}/api/v1/system/test-auth`, {
    headers: { "x-test-secret": TEST_SECRET, "content-type": "application/json" },
    data: { email },
  });

  if (!res.ok()) {
    throw new Error(`Login failed for ${role}: ${res.status()} ${await res.text()}`);
  }

  // Force English UI so test selectors written against EN copy match what the server renders.
  await page.context().addCookies([
    { name: "NEXT_LOCALE", value: "en", domain: "localhost", path: "/" },
  ]);

  // Grant PDPA consent so layout-level requireConsent doesn't redirect mid-test.
  await page.request.post(`${BASE_URL}/api/v1/consent/grant`).catch(() => {});
}
