import { test as base } from "@playwright/test";
import { loginAs, TENANT_SLUG } from "./auth";

type RoleName = "employee" | "manager" | "hr" | "ceo";

// Tenant-scoped path prefixes that need /{slug} prepended in path-based routing.
const TENANT_PATH_RE = /^\/(employee|hr|manager|settings|dashboard|change-password|impersonation)\//;

export const test = base.extend<{ role: RoleName }>({
  role: ["employee", { option: true }],

  page: async ({ page, role }, use) => {
    await loginAs(page, role);

    // Transparently prepend /{slug} for tenant-scoped absolute paths so existing
    // test files don't need to be rewritten after path-based routing migration.
    const _goto = page.goto.bind(page);
    (page as any).goto = (url: string, opts?: Parameters<typeof _goto>[1]) => {
      if (typeof url === "string" && TENANT_PATH_RE.test(url)) {
        url = `/${TENANT_SLUG}${url}`;
      }
      return _goto(url, opts);
    };

    await use(page);
  },
});

export { expect } from "@playwright/test";
