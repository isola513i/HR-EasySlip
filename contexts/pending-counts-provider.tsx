"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useMyPendingCounts, type PendingCounts } from "@/hooks/use-my-pending-counts";

interface ContextValue {
  counts: PendingCounts | null;
  isLoading: boolean;
}

const PendingCountsContext = createContext<ContextValue | null>(null);

export function PendingCountsProvider({ children }: { children: ReactNode }) {
  const value = useMyPendingCounts();
  return <PendingCountsContext.Provider value={value}>{children}</PendingCountsContext.Provider>;
}

export function usePendingCounts(): ContextValue {
  const ctx = useContext(PendingCountsContext);
  if (!ctx) throw new Error("usePendingCounts must be used inside PendingCountsProvider");
  return ctx;
}
