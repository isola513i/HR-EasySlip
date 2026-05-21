import { AsyncLocalStorage } from "node:async_hooks";
import { cache } from "react";
import { headers, cookies } from "next/headers";
import { resolveTenantBySlug } from "./tenant-resolver";

export const TENANT_COOKIE = "es_tenant";

const tenantOverride = new AsyncLocalStorage<string>();

// Request-scoped mutable registry. React.cache() returns the same object reference
// for every call within a single request render, so writes from an upstream layout
// are visible to descendant components, server actions, and any helper called
// during that render — without depending on middleware request headers (which
// Turbopack dev does not always forward) or a cookie (which the first response
// hasn't yet delivered to the browser).
const requestRegistry = cache((): { tenant: { id: string; slug: string } | null } => ({
  tenant: null,
}));

export function setRequestTenant(tenant: { id: string; slug: string }): void {
  requestRegistry().tenant = tenant;
}

async function readTenantContext(): Promise<{ id: string; slug: string }> {
  const registered = requestRegistry().tenant;
  if (registered) return registered;

  const [h, jar] = await Promise.all([headers(), cookies()]);

  const headerId = h.get("x-tenant-id");
  const headerSlug = h.get("x-tenant-slug");
  if (headerId && headerSlug) return { id: headerId, slug: headerSlug };

  const cookieSlug = jar.get(TENANT_COOKIE)?.value;
  if (cookieSlug) {
    const t = await resolveTenantBySlug(cookieSlug);
    if (t) return { id: t.id, slug: t.slug };
  }

  throw new Error("TENANT_CONTEXT_MISSING: no tenant header or cookie");
}

const cachedRead = cache(readTenantContext);

export async function getTenantId(): Promise<string> {
  const override = tenantOverride.getStore();
  if (override) return override;
  return (await cachedRead()).id;
}

export const getTenantSlug = cache(async (): Promise<string> => {
  try {
    return (await cachedRead()).slug;
  } catch {
    return "";
  }
});

/**
 * Run `fn` with the given tenant ID set as the current tenant context.
 * Used by cron routes to iterate tenants and call request-scoped helpers
 * (`getPrisma`, `getSettingValue`, `writeAuditLog`, ...) without a request header.
 *
 * @example
 *   for (const tenant of tenants) {
 *     await runWithTenantContext(tenant.id, async () => {
 *       await dailyQuotaTick(); // internal getPrisma() resolves to tenant.id
 *     });
 *   }
 */
export function runWithTenantContext<T>(tenantId: string, fn: () => Promise<T>): Promise<T> {
  return tenantOverride.run(tenantId, fn);
}
