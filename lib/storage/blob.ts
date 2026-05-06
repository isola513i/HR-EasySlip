// ════════════════════════════════════════════════════════════════
// Blob storage wrapper around @vercel/blob
// All file storage in this app goes through this module so we can
// swap providers (or stub in tests) without touching call sites.
// We persist the full Vercel Blob URL (not pathname) — `del()` and
// `fetch()` both accept URLs directly, and the URL hostname is
// store-specific so we can't reconstruct it from a pathname.
// ════════════════════════════════════════════════════════════════

import { put, del } from "@vercel/blob";

export const DOC_MAX_BYTES = 5 * 1024 * 1024;

export const DOC_ALLOWED_MIME = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;
export type DocMime = (typeof DOC_ALLOWED_MIME)[number];

export const IMAGE_ONLY_MIME = ["image/jpeg", "image/png", "image/webp"] as const;
export type ImageMime = (typeof IMAGE_ONLY_MIME)[number];

export class StorageError extends Error {
  constructor(
    public code: "STORAGE_PUT_FAILED" | "STORAGE_DELETE_FAILED" | "STORAGE_NOT_FOUND" | "STORAGE_FETCH_FAILED",
    message: string,
  ) {
    super(message);
    this.name = "StorageError";
  }
}

interface PutBlobInput {
  pathPrefix: string;
  filename: string;
  contentType: string;
  body: Buffer;
}

/**
 * Upload bytes to Vercel Blob. Returns the persisted URL — callers store it
 * verbatim and pass it back to {@link fetchBlob} / {@link deleteBlob}.
 * Random suffix prevents collisions on re-upload.
 */
export async function putBlob({ pathPrefix, filename, contentType, body }: PutBlobInput): Promise<{ url: string; size: number }> {
  const sanitized = filename.replace(/[^\w.\-]/g, "_").slice(0, 80);
  const key = `${pathPrefix}/${sanitized}`;
  try {
    const blob = await put(key, body, {
      access: "public",
      contentType,
      addRandomSuffix: true,
    });
    return { url: blob.url, size: body.byteLength };
  } catch (err) {
    throw new StorageError("STORAGE_PUT_FAILED", err instanceof Error ? err.message : "put failed");
  }
}

/** Delete a blob by its full Vercel Blob URL. Idempotent — missing blob does not throw. */
export async function deleteBlob(url: string): Promise<void> {
  try {
    await del(url);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    if (/not.?found/i.test(msg)) return;
    throw new StorageError("STORAGE_DELETE_FAILED", msg || "delete failed");
  }
}

/**
 * Fetch a blob's bytes by its full Vercel Blob URL. Used by API proxy routes
 * that stream the file back to the client with their own RBAC + audit guards.
 */
export async function fetchBlob(url: string): Promise<{ body: ReadableStream<Uint8Array>; contentType: string; size: number }> {
  const res = await fetch(url);
  if (!res.ok) {
    if (res.status === 404) throw new StorageError("STORAGE_NOT_FOUND", `blob not found: ${url}`);
    throw new StorageError("STORAGE_FETCH_FAILED", `blob fetch ${res.status}`);
  }
  if (!res.body) throw new StorageError("STORAGE_FETCH_FAILED", "blob fetch returned empty body");
  return {
    body: res.body,
    contentType: res.headers.get("content-type") ?? "application/octet-stream",
    size: Number(res.headers.get("content-length") ?? 0),
  };
}
