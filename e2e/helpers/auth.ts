import type { Page } from "@playwright/test";

const TEST_SECRET = process.env.E2E_TEST_SECRET ?? "test-secret-dev";
const BASE_URL = "http://localhost:3000";

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
}
