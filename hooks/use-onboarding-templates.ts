"use client";

import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "@/lib/api/client";

export interface TemplateItem {
  id: string;
  title: string;
  description?: string;
  category?: string;
  sortOrder: number;
}

export interface Template {
  id: string;
  name: string;
  isDefault: boolean;
  isActive: boolean;
  items?: TemplateItem[];
  _count?: { items: number };
  createdAt: string;
}

export function useOnboardingTemplates() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiFetch<Template[]>("/api/v1/hr/onboarding/templates");
      setTemplates(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load templates");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const create = useCallback(async (input: Record<string, unknown>) => {
    const result = await apiFetch<Template>("/api/v1/hr/onboarding/templates", {
      method: "POST", body: JSON.stringify(input),
    });
    await fetchData();
    return result;
  }, [fetchData]);

  const update = useCallback(async (id: string, input: Record<string, unknown>) => {
    const result = await apiFetch<Template>(`/api/v1/hr/onboarding/templates/${id}`, {
      method: "PUT", body: JSON.stringify(input),
    });
    await fetchData();
    return result;
  }, [fetchData]);

  const remove = useCallback(async (id: string) => {
    await apiFetch(`/api/v1/hr/onboarding/templates/${id}`, { method: "DELETE" });
    await fetchData();
  }, [fetchData]);

  return { templates, isLoading, error, refetch: fetchData, create, update, remove };
}
