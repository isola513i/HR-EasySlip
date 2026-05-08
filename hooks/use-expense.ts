"use client";

import { useCallback, useEffect, useState } from "react";
import { ExpenseStatus, type ExpenseCategory } from "@prisma/client";
import { apiFetch } from "@/lib/api/client";

export type { ExpenseCategory, ExpenseStatus } from "@prisma/client";

export const EXPENSE_STATUS_TONE: Record<ExpenseStatus, "info" | "success" | "error" | "neutral"> = {
  [ExpenseStatus.PENDING]: "info",
  [ExpenseStatus.APPROVED]: "success",
  [ExpenseStatus.REJECTED]: "error",
  [ExpenseStatus.CANCELLED]: "neutral",
};

export interface ExpenseClaim {
  id: string;
  employeeId: string;
  amountTHB: string;
  category: ExpenseCategory;
  description: string;
  occurredOn: string;
  status: ExpenseStatus;
  approverId: string | null;
  approvedAt: string | null;
  rejectedAt: string | null;
  rejectReason: string | null;
  receiptDocumentId: string | null;
  createdAt: string;
}

interface ListResponse {
  items: ExpenseClaim[];
  total: number;
  page: number;
  perPage: number;
}

export interface ExpenseCreateInput {
  amountTHB: number;
  category: ExpenseCategory;
  description: string;
  occurredOn: string;
  receiptDocumentId?: string;
}

export function useMyExpenses() {
  const [items, setItems] = useState<ExpenseClaim[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await apiFetch<ListResponse>("/api/v1/expense/me");
      setItems(data.items);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "load failed");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const submit = useCallback(
    async (input: ExpenseCreateInput) => {
      await apiFetch("/api/v1/expense", { method: "POST", body: JSON.stringify(input) });
      await refetch();
    },
    [refetch],
  );

  const cancel = useCallback(
    async (id: string) => {
      await apiFetch(`/api/v1/expense/${id}/cancel`, { method: "POST" });
      await refetch();
    },
    [refetch],
  );

  return { items, isLoading, error, refetch, submit, cancel };
}

export interface PendingExpenseItem extends ExpenseClaim {
  employee: { id: string; employeeCode: string; firstNameTh: string; lastNameTh: string };
}

export function usePendingExpenses() {
  const [items, setItems] = useState<PendingExpenseItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await apiFetch<PendingExpenseItem[]>("/api/v1/expense/pending");
      setItems(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "load failed");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const decide = useCallback(
    async (id: string, decision: "APPROVED" | "REJECTED", rejectReason?: string) => {
      await apiFetch(`/api/v1/expense/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ decision, rejectReason }),
      });
      await refetch();
    },
    [refetch],
  );

  return { items, isLoading, error, refetch, decide };
}

export interface HRExpenseListItem extends ExpenseClaim {
  employee: { id: string; employeeCode: string; firstNameTh: string; lastNameTh: string };
  approver: { id: string; employeeCode: string; firstNameTh: string; lastNameTh: string } | null;
}

export function useHRExpenses() {
  const [items, setItems] = useState<HRExpenseListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await apiFetch<{ items: HRExpenseListItem[]; total: number }>(
        "/api/v1/hr/expense?perPage=100",
      );
      setItems(data.items);
      setTotal(data.total);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "load failed");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { items, total, isLoading, error, refetch };
}
