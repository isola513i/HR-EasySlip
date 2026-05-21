import { AsyncLocalStorage } from "node:async_hooks";
import { cache } from "react";
import { headers, cookies } from "next/headers";
import { resolveTenantBySlug } from "./tenant-resolver";

export const TENANT_COOKIE = "es_tenant";

const tenantOverride = new AsyncLocalStorage<string>();

// Request-scoped registry keyed by the headers() object. Next.js returns the
// same ReadonlyHeaders instance for every headers() call within a single
// request (and a different instance for every request), so this WeakMap
// uniquely identifies a request without leaking memory across requests.
//
// Why not React.cache()? Layout and page server components can render in
// parallel in Next.js 15 — a write from the layout body is not guaranteed
// to be visible to the page before the page's own helper calls run.
type Tenant = { id: string; slug: string };
const requestTenantMap = new WeakMap<object, Tenant>();

export async function setRequestTenant(tenant: Tenant): Promise<void> {
  const key = await headers();
  requestTenantMap.set(key, tenant);
}

/**
 * Resolves a tenant from its slug and registers it for the rest of the request.
 * Call this at the top of any tenant-scoped page/server-action that does tenant
 * DB work — it makes getPrisma() / getTenantId() / etc. work even if the
 * upstream layout hasn't finished setRequestTenant() yet (Next.js can render
 * sibling segments in parallel).
 *
 * Returns the resolved tenant. Throws TENANT_NOT_FOUND if the slug is unknown.
 */
export async function ensureTenantContext(slug: string): Promise<Tenant> {
  const h = await headers();
  const existing = requestTenantMap.get(h);
  if (existing && existing.slug === slug) return existing;
  const resolved = await resolveTenantBySlug(slug);
  if (!resolved) throw new Error(`TENANT_NOT_FOUND: ${slug}`);
  const tenant = { id: resolved.id, slug: resolved.slug };
  requestTenantMap.set(h, tenant);
  return tenant;
}

async function readTenantContext(): Promise<Tenant> {
  const h = await headers();
  const registered = requestTenantMap.get(h);
  if (registered) return registered;

  const headerId = h.get("x-tenant-id");
  const headerSlug = h.get("x-tenant-slug");
  if (headerId && headerSlug) return { id: headerId, slug: headerSlug };

  const jar = await cookies();
  const cookieSlug = jar.get(TENANT_COOKIE)?.value;
  if (cookieSlug) {
    const t = await resolveTenantBySlug(cookieSlug);
    if (t) {
      const tenant = { id: t.id, slug: t.slug };
      requestTenantMap.set(h, tenant);
      return tenant;
    }
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
