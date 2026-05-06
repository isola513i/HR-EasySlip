"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api/client";
import type { DocumentRecord } from "./use-documents";

interface UseEmployeeDocsInput {
  employeeId: string | null | undefined;
  category?: string;
}

/**
 * HR-side hook — list documents owned by a specific employee. RBAC is
 * enforced at /api/v1/hr/employees/[id]/documents (HR_ROLES required).
 * Upload/delete reuse the shared /api/v1/documents endpoints which the
 * service-layer canWrite() RBAC already gates per category.
 */
export function useEmployeeDocuments({ employeeId, category }: UseEmployeeDocsInput) {
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(!!employeeId);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (signal?: AbortSignal) => {
    if (!employeeId) { setDocuments([]); setIsLoading(false); return; }
    setIsLoading(true);
    setError(null);
    try {
      const qs = category ? `?category=${encodeURIComponent(category)}` : "";
      const data = await apiFetch<DocumentRecord[]>(
        `/api/v1/hr/employees/${employeeId}/documents${qs}`,
        { signal },
      );
      setDocuments(data);
    } catch (err) {
      if ((err as { name?: string })?.name === "AbortError") return;
      setError(err instanceof Error ? err.message : "Failed to load documents");
    } finally {
      if (!signal?.aborted) setIsLoading(false);
    }
  }, [employeeId, category]);

  useEffect(() => {
    const ctrl = new AbortController();
    void fetchData(ctrl.signal);
    return () => ctrl.abort();
  }, [fetchData]);

  const upload = useCallback(async (input: {
    file: File;
    category: string;
    entityType: string;
    entityId: string;
  }): Promise<DocumentRecord> => {
    if (!employeeId) throw new Error("EMPLOYEE_REQUIRED");
    const fd = new FormData();
    fd.append("file", input.file);
    fd.append("category", input.category);
    fd.append("entityType", input.entityType);
    fd.append("entityId", input.entityId);
    fd.append("ownerEmployeeId", employeeId);
    const res = await fetch("/api/v1/documents", { method: "POST", body: fd });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || !json.ok) throw new Error((json as { code?: string }).code ?? "UPLOAD_FAILED");
    await fetchData();
    return json.data as DocumentRecord;
  }, [employeeId, fetchData]);

  const remove = useCallback(async (documentId: string): Promise<void> => {
    const res = await fetch(`/api/v1/documents/${documentId}`, { method: "DELETE" });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error((body as { code?: string }).code ?? "DELETE_FAILED");
    }
    await fetchData();
  }, [fetchData]);

  return { documents, isLoading, error, upload, remove, refetch: () => fetchData() };
}
