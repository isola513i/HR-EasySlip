import { AsyncLocalStorage } from "node:async_hooks";
import { cache } from "react";
import { headers } from "next/headers";

/**
 * AsyncLocalStorage override for the current tenant.
 *
 * Set by `runWithTenantContext()` — used in cron / background jobs that
 * iterate multiple tenants and have no `x-tenant-id` request header.
 * Within the callback, `getTenantId()` returns this value instead of
 * reading the header.
 */
const tenantOverride = new AsyncLocalStorage<string>();

async function readTenantFromHeaders(): Promise<string> {
  const h = await headers();
  const tenantId = h.get("x-tenant-id");
  if (!tenantId) throw new Error("TENANT_CONTEXT_MISSING: x-tenant-id header not set by middleware");
  return tenantId;
}

const cachedHeaderRead = cache(readTenantFromHeaders);

/**
 * Returns the current tenant ID.
 *
 * - In request context: reads middleware-injected `x-tenant-id` header (cached per-render).
 * - In cron / background context: reads the AsyncLocalStorage override set by `runWithTenantContext()`.
 * - Throws TENANT_CONTEXT_MISSING if neither is set.
 */
export async function getTenantId(): Promise<string> {
  const override = tenantOverride.getStore();
  if (override) return override;
  return cachedHeaderRead();
}

export const getTenantSlug = cache(async (): Promise<string> => {
  const h = await headers();
  return h.get("x-tenant-slug") ?? "";
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
