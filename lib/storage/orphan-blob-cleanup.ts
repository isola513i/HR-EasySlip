// ════════════════════════════════════════════════════════════════
// Orphan blob cleanup
// Walks every blob in the Vercel Blob store and deletes any that no
// active DB row references — Document.blobPath OR
// Employee.profilePicturePath. Anonymized employees have already been
// nulled by anonymization-service, so their pictures fall through here
// and become reclaimable.
//
// A 24h grace window protects in-flight uploads: a freshly-put blob
// might briefly exist in storage before its DB row is committed (race
// inside the upload tx). We never delete anything younger than that.
// ════════════════════════════════════════════════════════════════

import { list } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import { deleteBlob } from "@/lib/storage/blob";
import { writeAuditLog } from "@/lib/audit/logger";
import { logger } from "@/lib/observability/logger";

const GRACE_MS = 24 * 60 * 60 * 1000;
const PAGE_LIMIT = 1000;

interface CleanupResult {
  scanned: number;
  referenced: number;
  candidates: number;
  deleted: number;
  failed: number;
  graceSkipped: number;
  dryRun: boolean;
  partial: boolean;
}

interface CleanupOptions {
  /**
   * When true, candidates are reported but not actually deleted. Use for
   * the first production run to verify the candidate set before the
   * weekly schedule starts reclaiming blobs.
   */
  dryRun?: boolean;
}

/**
 * Build the set of all blob URLs currently referenced by the DB.
 * Both `Document.blobPath` and `Employee.profilePicturePath` store the
 * full Vercel Blob URL (see lib/storage/blob.ts header).
 */
async function loadReferencedUrls(): Promise<Set<string>> {
  const [docs, employees] = await Promise.all([
    prisma.document.findMany({ select: { blobPath: true } }),
    prisma.employee.findMany({
      where: { profilePicturePath: { not: null } },
      select: { profilePicturePath: true },
    }),
  ]);
  const refs = new Set<string>();
  for (const d of docs) refs.add(d.blobPath);
  for (const e of employees) if (e.profilePicturePath) refs.add(e.profilePicturePath);
  return refs;
}

export async function cleanupOrphanBlobs(opts: CleanupOptions = {}): Promise<CleanupResult> {
  const dryRun = !!opts.dryRun;
  const referenced = await loadReferencedUrls();
  const now = Date.now();
  const result: CleanupResult = {
    scanned: 0,
    referenced: referenced.size,
    candidates: 0,
    deleted: 0,
    failed: 0,
    graceSkipped: 0,
    dryRun,
    partial: false,
  };

  try {
    let cursor: string | undefined;
    do {
      const page = await list({ limit: PAGE_LIMIT, cursor });
      for (const blob of page.blobs) {
        result.scanned += 1;
        if (referenced.has(blob.url)) continue;
        if (now - blob.uploadedAt.getTime() < GRACE_MS) {
          result.graceSkipped += 1;
          continue;
        }
        result.candidates += 1;
        if (dryRun) {
          logger.info("orphan blob candidate (dry-run)", { url: blob.url, uploadedAt: blob.uploadedAt.toISOString() });
          continue;
        }
        try {
          await deleteBlob(blob.url);
          result.deleted += 1;
        } catch (err) {
          result.failed += 1;
          logger.error("orphan blob delete failed", {
            url: blob.url,
            error: err instanceof Error ? err.message : String(err),
          });
        }
      }
      cursor = page.hasMore ? page.cursor : undefined;
    } while (cursor);
  } catch (err) {
    // List/network error mid-walk — record partial counters in the
    // audit row instead of leaving the run un-logged.
    result.partial = true;
    logger.error("orphan blob cleanup partial", {
      error: err instanceof Error ? err.message : String(err),
      ...result,
    });
  }

  await writeAuditLog({
    actorId: null,
    action: "blob.orphan_cleanup",
    entityType: "Blob",
    entityId: `cleanup-${new Date().toISOString().slice(0, 10)}`,
    after: result,
  });

  return result;
}
