import type { Page } from "@playwright/test";

const TEST_SECRET = process.env.E2E_TEST_SECRET ?? "test-secret-dev";
const TENANT_SLUG = process.env.E2E_TENANT_SLUG ?? "demo";
// Tests must run under the tenant subdomain so the middleware sets x-tenant-id
// and the TenantLayout doesn't redirect back to the marketing home.
const BASE_URL =
  process.env.E2E_BASE_URL ?? `http://${TENANT_SLUG}.localhost:3000`;

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

  // Force English UI so test selectors written against EN copy match what
  // the server renders. lib/i18n/config.ts defaults to "th" and reads from
  // the `NEXT_LOCALE` cookie via getLocale() — setting it here means
  // downstream getDictionary() calls return en.ts. The cookie also gets
  // picked up by the client-side useT() hook on the next page load.
  await page.context().addCookies([
    { name: "NEXT_LOCALE", value: "en", domain: `${TENANT_SLUG}.localhost`, path: "/" },
  ]);

  // Grant PDPA consent so layout-level requireConsent doesn't redirect mid-test.
  await page.request.post(`${BASE_URL}/api/v1/consent/grant`).catch(() => {});
}
