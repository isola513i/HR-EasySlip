import type { PrismaClient } from "@prisma/client";
import { getTenantPrisma } from "@/lib/db/tenant";
import { getTenantId } from "@/lib/db/tenant-context";

/**
 * Resolves the current tenant's PrismaClient.
 *
 * Reads tenant ID from:
 *   1. AsyncLocalStorage override (set by `runWithTenantContext()` in cron jobs), or
 *   2. middleware-injected `x-tenant-id` request header (default in request scope).
 *
 * Per-tenant client is LRU-cached by `getTenantPrisma()` so repeated calls
 * within the same tenant are cheap.
 *
 * For cross-tenant orchestration (cron / background) that operates on a
 * specific tenant explicitly, accept `prisma: PrismaClient` as a function
 * parameter instead — that pattern is used by Bucket B/C services.
 */
export async function getPrisma(): Promise<PrismaClient> {
  const tenantId = await getTenantId();
  return getTenantPrisma(tenantId);
}
