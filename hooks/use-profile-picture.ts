"use client";

import { useCallback, useState } from "react";

interface UploadOptions {
  maxBytes?: number;
  allowed?: readonly string[];
}

const DEFAULT_MAX = 3 * 1024 * 1024;
const DEFAULT_ALLOWED = ["image/jpeg", "image/png", "image/webp"] as const;

export function useProfilePicture(opts?: UploadOptions) {
  const [isUploading, setIsUploading] = useState(false);

  const maxBytes = opts?.maxBytes ?? DEFAULT_MAX;
  const allowed = opts?.allowed ?? DEFAULT_ALLOWED;

  const upload = useCallback(async (file: File): Promise<void> => {
    if (file.size > maxBytes) throw new Error("FILE_TOO_LARGE");
    if (!allowed.includes(file.type)) throw new Error("UNSUPPORTED_MEDIA_TYPE");

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const res = await fetch("/api/v1/employee/me/profile-picture", {
        method: "PUT",
        body: formData,
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { code?: string }).code ?? "UPLOAD_FAILED");
      }
    } finally {
      setIsUploading(false);
    }
  }, [maxBytes, allowed]);

  const remove = useCallback(async (): Promise<void> => {
    setIsUploading(true);
    try {
      const res = await fetch("/api/v1/employee/me/profile-picture", { method: "DELETE" });
      if (!res.ok) throw new Error("DELETE_FAILED");
    } finally {
      setIsUploading(false);
    }
  }, []);

  return { isUploading, upload, remove };
}

/**
 * Build a URL for a given employee's avatar.
 *
 * Cache busting:
 *  - `uploadedAt` (from server) — primary version key, updates after `refetch()` returns
 *  - `tick` (local) — increments synchronously on upload/remove so the avatar
 *    swaps immediately, before the refetch round-trip completes (~200ms window)
 */
export function profilePictureSrc(
  employeeId: string,
  uploadedAt?: string | null,
  tick: number = 0,
): string {
  const params = new URLSearchParams();
  if (uploadedAt) params.set("v", uploadedAt);
  if (tick > 0) params.set("t", String(tick));
  const qs = params.toString();
  return `/api/v1/employee/${employeeId}/profile-picture${qs ? `?${qs}` : ""}`;
}
