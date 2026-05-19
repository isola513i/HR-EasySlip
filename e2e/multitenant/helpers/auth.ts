import type { Page } from "@playwright/test";

const TEST_SECRET = process.env.E2E_TEST_SECRET ?? "test-secret-dev";

export const MARKETING_URL = "http://localhost:3000";
export const PLATFORM_URL = "http://admin.localhost:3000";
export const tenantUrl = (slug: string) => `http://${slug}.localhost:3000`;

export const TENANT_SLUG = process.env.E2E_TENANT_SLUG ?? "demo";
export const PLATFORM_EMAIL = process.env.E2E_PLATFORM_EMAIL ?? "superadmin@easyslip.app";
export const TENANT_ADMIN_EMAIL = process.env.E2E_TENANT_ADMIN_EMAIL ?? "development.v001@gmail.com";

/** True when CONTROL_PLANE_DATABASE_URL is configured (required for CP-dependent tests). */
export const hasControlPlane = !!process.env.CONTROL_PLANE_DATABASE_URL;

/**
 * Sets the platform-session JWT cookie via the dev test-auth endpoint.
 * Requires CONTROL_PLANE_DATABASE_URL and the user to exist in the CP DB.
 */
export async function loginAsPlatformUser(page: Page, email = PLATFORM_EMAIL) {
  const res = await page.request.post(`${PLATFORM_URL}/api/platform/test-auth`, {
    headers: { "x-test-secret": TEST_SECRET, "content-type": "application/json" },
    data: { email },
  });
  if (!res.ok()) {
    throw new Error(`Platform login failed for ${email}: ${res.status()} ${await res.text()}`);
  }
}

/**
 * Sets authjs.session-token for a tenant-zone user via the dev test-auth endpoint.
 * The cookie is scoped to the tenant subdomain so subsequent navigations send it.
 */
export async function loginAsTenantUser(
  page: Page,
  email = TENANT_ADMIN_EMAIL,
  slug = TENANT_SLUG,
) {
  const base = tenantUrl(slug);
  const res = await page.request.post(`${base}/api/v1/system/test-auth`, {
    headers: { "x-test-secret": TEST_SECRET, "content-type": "application/json" },
    data: { email },
  });
  if (!res.ok()) {
    throw new Error(`Tenant login failed (${slug}/${email}): ${res.status()} ${await res.text()}`);
  }
  await page.context().addCookies([
    { name: "NEXT_LOCALE", value: "en", domain: `${slug}.localhost`, path: "/" },
  ]);
  await page.request.post(`${base}/api/v1/consent/grant`).catch(() => {});
}
