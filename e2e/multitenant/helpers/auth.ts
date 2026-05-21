import type { Page } from "@playwright/test";

const TEST_SECRET = process.env.E2E_TEST_SECRET ?? "test-secret-dev";

/** Marketing zone — root */
export const MARKETING_URL = "http://localhost:3000";
/** Platform admin UI — path-based (was admin.localhost:3000) */
export const PLATFORM_URL = "http://localhost:3000/platform";
/** Resolve a tenant URL from its slug — path-based (was {slug}.localhost:3000) */
export const tenantUrl = (slug: string) => `http://localhost:3000/${slug}`;

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
  const res = await page.request.post(`${MARKETING_URL}/api/platform/test-auth`, {
    headers: { "x-test-secret": TEST_SECRET, "content-type": "application/json" },
    data: { email },
  });
  if (!res.ok()) {
    throw new Error(`Platform login failed for ${email}: ${res.status()} ${await res.text()}`);
  }
}

/**
 * Sets authjs.session-token for a tenant-zone user via the dev test-auth endpoint.
 * Same-origin (path-based routing) — cookie is on localhost, no subdomain needed.
 */
export async function loginAsTenantUser(
  page: Page,
  email = TENANT_ADMIN_EMAIL,
  slug = TENANT_SLUG,
) {
  void slug; // slug no longer used for domain scoping — kept for call-site compat
  const res = await page.request.post(`${MARKETING_URL}/api/v1/system/test-auth`, {
    headers: { "x-test-secret": TEST_SECRET, "content-type": "application/json" },
    data: { email },
  });
  if (!res.ok()) {
    throw new Error(`Tenant login failed (${email}): ${res.status()} ${await res.text()}`);
  }
  await page.context().addCookies([
    { name: "NEXT_LOCALE", value: "en", domain: "localhost", path: "/" },
  ]);
  await page.request.post(`${MARKETING_URL}/api/v1/consent/grant`).catch(() => {});
}
