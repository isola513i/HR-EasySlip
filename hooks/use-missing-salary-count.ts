"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api/client";

export function useMissingSalaryCount() {
  const [count, setCount] = useState<number | null>(null);
  const [hasAccess, setHasAccess] = useState(true);

  const refetch = useCallback(async () => {
    try {
      const data = await apiFetch<{ count: number }>("/api/v1/hr/employees/missing-salary-count");
      setCount(data.count);
    } catch {
      setHasAccess(false);
      setCount(null);
    }
  }, []);

  useEffect(() => { refetch(); }, [refetch]);

  return { count, hasAccess, refetch };
}
