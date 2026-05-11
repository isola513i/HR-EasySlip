"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useMyApprovalCount } from "@/hooks/use-my-approval-count";

interface ContextValue {
  count: number;
  isLoading: boolean;
}

const ApprovalCountsContext = createContext<ContextValue | null>(null);

export function ApprovalCountsProvider({ children }: { children: ReactNode }) {
  const value = useMyApprovalCount();
  return <ApprovalCountsContext.Provider value={value}>{children}</ApprovalCountsContext.Provider>;
}

export function useApprovalCounts(): ContextValue {
  const ctx = useContext(ApprovalCountsContext);
  if (!ctx) throw new Error("useApprovalCounts must be used inside ApprovalCountsProvider");
  return ctx;
}
