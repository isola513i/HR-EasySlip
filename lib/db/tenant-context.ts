import { cache } from "react";
import { headers } from "next/headers";

/**
 * Reads the tenant ID injected by middleware as the `x-tenant-id` header.
 * Wrapped in React `cache()` so it's called at most once per server render.
 */
export const getTenantId = cache(async (): Promise<string> => {
  const h = await headers();
  const tenantId = h.get("x-tenant-id");
  if (!tenantId) throw new Error("TENANT_CONTEXT_MISSING: x-tenant-id header not set by middleware");
  return tenantId;
});

export const getTenantSlug = cache(async (): Promise<string> => {
  const h = await headers();
  return h.get("x-tenant-slug") ?? "";
});
