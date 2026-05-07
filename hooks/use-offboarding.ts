"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api/client";

export type OffboardingReason = "RESIGNATION" | "TERMINATION" | "RETIREMENT" | "CONTRACT_END";
export type OffboardingStatus = "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

export interface OffboardingItem {
  key: string;
  /** Legacy field for records seeded before key-only refactor. UI resolves via i18n. */
  label?: string;
  completed: boolean;
  completedAt?: string;
  completedBy?: string;
}

export interface OffboardingRecord {
  id: string;
  employeeId: string;
  reason: OffboardingReason;
  lastDay: string;
  status: OffboardingStatus;
  items: OffboardingItem[];
  notes: string | null;
  createdAt: string;
  completedAt: string | null;
  employee: {
    id: string;
    employeeCode: string;
    firstNameTh: string;
    lastNameTh: string;
    employmentStatus: string;
  };
}

export function useOffboarding() {
  const [items, setItems] = useState<OffboardingRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await apiFetch<OffboardingRecord[]>("/api/v1/hr/offboarding");
      setItems(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "load failed");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { refetch(); }, [refetch]);

  const start = useCallback(async (input: {
    employeeId: string; reason: OffboardingReason; lastDay: string; notes?: string;
  }) => {
    await apiFetch("/api/v1/hr/offboarding", { method: "POST", body: JSON.stringify(input) });
    await refetch();
  }, [refetch]);

  const toggleItem = useCallback(async (id: string, itemKey: string, completed: boolean) => {
    await apiFetch(`/api/v1/hr/offboarding/${id}/items`, {
      method: "PATCH",
      body: JSON.stringify({ itemKey, completed }),
    });
    await refetch();
  }, [refetch]);

  const complete = useCallback(async (id: string) => {
    await apiFetch(`/api/v1/hr/offboarding/${id}/complete`, { method: "POST" });
    await refetch();
  }, [refetch]);

  return { items, isLoading, error, refetch, start, toggleItem, complete };
}
