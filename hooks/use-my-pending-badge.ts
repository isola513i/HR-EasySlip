"use client";

import { usePendingCounts } from "@/contexts/pending-counts-provider";

export function useMyPendingBadge(): boolean {
  const { counts } = usePendingCounts();
  return counts !== null && counts.leave + counts.ot + counts.expense > 0;
}
