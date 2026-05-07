"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api/client";

export type AssetType = "LAPTOP" | "PHONE" | "MONITOR" | "HEADSET" | "TABLET" | "OTHER";
export type AssetStatus = "AVAILABLE" | "ASSIGNED" | "RETIRED" | "REPAIR";

export interface AssetAssignmentRow {
  id: string;
  assignedAt: string;
  returnedAt: string | null;
  employee: {
    id: string;
    employeeCode: string;
    firstNameTh: string;
    lastNameTh: string;
  };
}

export interface AssetRow {
  id: string;
  type: AssetType;
  brand: string | null;
  model: string | null;
  serialNumber: string | null;
  purchaseDate: string | null;
  status: AssetStatus;
  notes: string | null;
  assignments: AssetAssignmentRow[];
}

export interface AssetCreateInput {
  type: AssetType;
  brand?: string;
  model?: string;
  serialNumber?: string;
  purchaseDate?: string;
  notes?: string;
}

export function useAssets() {
  const [items, setItems] = useState<AssetRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiFetch<AssetRow[]>("/api/v1/hr/assets");
      setItems(data);
    } catch (err) {
      setItems([]);
      setError(err instanceof Error ? err.message : "Failed to load assets");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { refetch(); }, [refetch]);

  const createAsset = useCallback(async (input: AssetCreateInput) => {
    await apiFetch("/api/v1/hr/assets", { method: "POST", body: JSON.stringify(input) });
    await refetch();
  }, [refetch]);

  const assignAsset = useCallback(async (assetId: string, employeeId: string) => {
    await apiFetch(`/api/v1/hr/assets/${assetId}/assign`, {
      method: "POST",
      body: JSON.stringify({ employeeId }),
    });
    await refetch();
  }, [refetch]);

  const returnAsset = useCallback(async (assetId: string, returnCondition?: string) => {
    await apiFetch(`/api/v1/hr/assets/${assetId}/return`, {
      method: "POST",
      body: JSON.stringify({ returnCondition }),
    });
    await refetch();
  }, [refetch]);

  const retireAsset = useCallback(async (assetId: string) => {
    await apiFetch(`/api/v1/hr/assets/${assetId}`, {
      method: "PATCH",
      body: JSON.stringify({ status: "RETIRED" }),
    });
    await refetch();
  }, [refetch]);

  return { items, isLoading, error, refetch, createAsset, assignAsset, returnAsset, retireAsset };
}
