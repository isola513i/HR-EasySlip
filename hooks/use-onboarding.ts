"use client";

import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "@/lib/api/client";

export interface ChecklistItem {
  id: string;
  title: string;
  description?: string;
  category?: string;
  sortOrder: number;
  isDone: boolean;
  doneAt?: string;
}

export interface Checklist {
  id: string;
  employeeId: string;
  completedAt: string | null;
  items: ChecklistItem[];
  progress: { total: number; done: number; percent: number };
}

export function useOnboarding() {
  const [checklist, setChecklist] = useState<Checklist | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiFetch<Checklist | null>("/api/v1/employee/onboarding");
      setChecklist(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load onboarding");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const toggleItem = useCallback(async (itemId: string, isDone: boolean) => {
    await apiFetch(`/api/v1/employee/onboarding/items/${itemId}`, {
      method: "PATCH",
      body: JSON.stringify({ isDone }),
    });
    await fetchData();
  }, [fetchData]);

  return { checklist, isLoading, error, toggleItem, refetch: fetchData };
}
