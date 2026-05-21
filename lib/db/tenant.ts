import { PrismaClient } from "@prisma/client";
import { getControlPlane } from "./control-plane";
import { decryptUrl } from "./url-encryption";
import { withConnectionRetry } from "./retry";

interface CachedClient {
  client: PrismaClient;
  lastUsed: number;
}

// Module-level cache — survives across requests within the same Node.js instance.
// Evict entries idle for more than 30 minutes. Max 50 tenants to cap connections.
const clientCache = new Map<string, CachedClient>();
const MAX_CLIENTS = 50;
const IDLE_TTL_MS = 30 * 60 * 1_000;

function evict(): void {
  const now = Date.now();
  for (const [id, entry] of clientCache) {
    if (now - entry.lastUsed > IDLE_TTL_MS) {
      entry.client.$disconnect().catch(() => {});
      clientCache.delete(id);
    }
  }
  // Hard cap: evict oldest if still over limit
  if (clientCache.size >= MAX_CLIENTS) {
    const oldest = [...clientCache.entries()].sort((a, b) => a[1].lastUsed - b[1].lastUsed)[0];
    if (oldest) {
      oldest[1].client.$disconnect().catch(() => {});
      clientCache.delete(oldest[0]);
    }
  }
}

export interface CacheStats {
  size: number;
  maxClients: number;
  idleTtlMs: number;
  entries: { tenantId: string; idleSec: number }[];
}

export function getCacheStats(): CacheStats {
  const now = Date.now();
  return {
    size: clientCache.size,
    maxClients: MAX_CLIENTS,
    idleTtlMs: IDLE_TTL_MS,
    entries: [...clientCache.entries()].map(([id, e]) => ({
      tenantId: id,
      idleSec: Math.floor((now - e.lastUsed) / 1_000),
    })),
  };
}

/**
 * Returns a scoped PrismaClient for the given tenant ID.
 * The DB URL is fetched from the Control Plane, decrypted, and cached for 30 min.
 */
export async function getTenantPrisma(tenantId: string): Promise<PrismaClient> {
  const cached = clientCache.get(tenantId);
  if (cached) {
    cached.lastUsed = Date.now();
    return cached.client;
  }

  const tenant = await getControlPlane().tenant.findUnique({
    where: { id: tenantId },
    select: { databaseUrlEnc: true, status: true },
  });

  if (!tenant || !tenant.databaseUrlEnc) throw new Error("TENANT_NOT_PROVISIONED");
  if (tenant.status === "SUSPENDED" || tenant.status === "DELETED")
    throw new Error("TENANT_INACTIVE");

  evict();

  const url = decryptUrl(tenant.databaseUrlEnc);
  const base = new PrismaClient({
    datasources: { db: { url } },
    log: ["warn", "error"],
  });
  const client = withConnectionRetry(base, `tenant:${tenantId.slice(0, 8)}`) as PrismaClient;
  clientCache.set(tenantId, { client, lastUsed: Date.now() });
  return client;
}
