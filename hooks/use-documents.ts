"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api/client";

export interface DocumentRecord {
  id: string;
  ownerEmployeeId: string;
  category: string;
  entityType: string;
  entityId: string;
  filename: string;
  mime: string;
  size: number;
  uploadedAt: string;
}

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = ["application/pdf", "image/jpeg", "image/png", "image/webp"] as const;

interface UseDocumentsOptions {
  category?: string;
}

export function useDocuments(opts?: UseDocumentsOptions) {
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const qs = opts?.category ? `?category=${encodeURIComponent(opts.category)}` : "";
      const data = await apiFetch<DocumentRecord[]>(`/api/v1/employee/me/documents${qs}`);
      setDocuments(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load documents");
    } finally {
      setIsLoading(false);
    }
  }, [opts?.category]);

  useEffect(() => { void fetchData(); }, [fetchData]);

  const upload = useCallback(async (input: {
    file: File;
    category: string;
    entityType: string;
    entityId: string;
    ownerEmployeeId?: string;
  }): Promise<DocumentRecord> => {
    if (input.file.size > MAX_BYTES) throw new Error("FILE_TOO_LARGE");
    if (!ALLOWED.includes(input.file.type as (typeof ALLOWED)[number])) {
      throw new Error("UNSUPPORTED_MEDIA_TYPE");
    }
    const fd = new FormData();
    fd.append("file", input.file);
    fd.append("category", input.category);
    fd.append("entityType", input.entityType);
    fd.append("entityId", input.entityId);
    if (input.ownerEmployeeId) fd.append("ownerEmployeeId", input.ownerEmployeeId);

    const res = await fetch("/api/v1/documents", { method: "POST", body: fd });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || !json.ok) {
      throw new Error((json as { code?: string }).code ?? "UPLOAD_FAILED");
    }
    await fetchData();
    return json.data as DocumentRecord;
  }, [fetchData]);

  const remove = useCallback(async (documentId: string): Promise<void> => {
    const res = await fetch(`/api/v1/documents/${documentId}`, { method: "DELETE" });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error((body as { code?: string }).code ?? "DELETE_FAILED");
    }
    await fetchData();
  }, [fetchData]);

  return { documents, isLoading, error, upload, remove, refetch: fetchData };
}

export function documentFileHref(documentId: string): string {
  return `/api/v1/documents/${documentId}/file`;
}
