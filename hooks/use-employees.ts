"use client";

import { useState, useEffect, useCallback } from "react";
import { apiFetch, apiFetchPaginated } from "@/lib/api/client";

export interface Employee {
  id: string;
  employeeCode: string;
  firstNameTh: string;
  lastNameTh: string;
  firstNameEn?: string;
  lastNameEn?: string;
  phone?: string;
  roles: string[];
  employmentStatus: string;
  department?: { name: string };
  position?: { name: string };
  manager?: { firstNameTh: string; lastNameTh: string };
  user?: { email: string };
}

interface Filters {
  page: number;
  search: string;
  status: string;
}

interface Pagination {
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

export function useEmployees(initialFilters?: Partial<Filters>) {
  const [items, setItems] = useState<Employee[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, perPage: 20, totalPages: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>({
    page: 1, search: "", status: "", ...initialFilters,
  });

  const fetchData = useCallback(async (f: Filters) => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set("page", String(f.page));
      if (f.search) params.set("search", f.search);
      if (f.status) params.set("status", f.status);
      const res = await apiFetchPaginated<Employee>(`/api/v1/hr/employees?${params}`);
      setItems(res.data);
      setPagination(res.pagination);
    } catch (err) {
      setItems([]);
      setError(err instanceof Error ? err.message : "Failed to load employees");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(filters); }, [filters, fetchData]);

  const refetch = useCallback(() => fetchData(filters), [filters, fetchData]);

  const create = useCallback(async (input: Record<string, unknown>) => {
    const result = await apiFetch<Employee>("/api/v1/hr/employees", {
      method: "POST", body: JSON.stringify(input),
    });
    await fetchData(filters);
    return result;
  }, [filters, fetchData]);

  const setSearch = useCallback((s: string) => setFilters((p) => ({ ...p, search: s, page: 1 })), []);
  const setStatus = useCallback((s: string) => setFilters((p) => ({ ...p, status: s, page: 1 })), []);
  const setPage = useCallback((n: number) => setFilters((p) => ({ ...p, page: n })), []);

  return { items, pagination, isLoading, error, refetch, create, setSearch, setStatus, setPage };
}
