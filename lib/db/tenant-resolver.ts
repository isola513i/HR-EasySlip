/**
 * Tenant resolver — maps a subdomain slug to a tenant record.
 * Results are cached in-process for 60 s to avoid hammering the Control Plane DB.
 */

export interface TenantInfo {
  id: string;
  slug: string;
  status: string;
}

interface CacheEntry {
  tenant: TenantInfo | null;
  expiresAt: number;
}

// Module-level cache — survives across requests within the same Node.js instance.
const tenantCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 60_000;

/**
 * Looks up a tenant by slug via the Control Plane DB (with in-process cache).
 * Returns null if CONTROL_PLANE_DATABASE_URL is not configured or the slug is unknown.
 */
export async function resolveTenantBySlug(slug: string): Promise<TenantInfo | null> {
  if (!process.env.CONTROL_PLANE_DATABASE_URL) {
    // In dev/test without a control-plane DB, treat the configured E2E tenant
    // slug as a valid active tenant so local dev and E2E tests work without
    // spinning up a full multi-tenant control plane.
    if (process.env.NODE_ENV !== "production") {
      const devSlug = process.env.E2E_TENANT_SLUG ?? "demo";
      if (slug === devSlug) return { id: `dev-${slug}`, slug, status: "ACTIVE" };
    }
    return null;
  }

  const now = Date.now();
  const cached = tenantCache.get(slug);
  if (cached && cached.expiresAt > now) return cached.tenant;

  try {
    const { getControlPlane } = await import("@/lib/db/control-plane");
    const cp = getControlPlane();
    const tenant = await cp.tenant.findUnique({
      where: { slug },
      select: { id: true, slug: true, status: true },
    });
    const result = tenant ?? null;
    tenantCache.set(slug, { tenant: result, expiresAt: now + CACHE_TTL_MS });
    return result;
  } catch {
    // CP DB unreachable — fail open (don't cache so next request retries)
    return null;
  }
}
