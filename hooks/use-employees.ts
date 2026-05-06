"use client";

import { useState, useEffect, useCallback } from "react";
import { apiFetch, apiFetchPaginated } from "@/lib/api/client";
import type { EmploymentStatus } from "@/lib/employee/status-tones";

export interface Employee {
  id: string;
  employeeCode: string;
  firstNameTh: string;
  lastNameTh: string;
  firstNameEn?: string;
  lastNameEn?: string;
  phone?: string;
  roles: string[];
  employmentStatus: EmploymentStatus;
  employmentType?: string | null;
  hireDate: string;
  department?: { id?: string; name: string } | null;
  position?: { name: string } | null;
  manager?: { firstNameTh: string; lastNameTh: string } | null;
  user?: { email: string } | null;
  hasProfilePicture?: boolean;
  profilePictureUploadedAt?: string | null;
}

interface Filters {
  page: number;
  perPage: number;
  search: string;
  status: string;
  departmentId: string;
}

interface Pagination {
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

export function useEmployees(initialFilters?: Partial<Filters>) {
  const [items, setItems] = useState<Employee[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, perPage: 100, totalPages: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>({
    page: 1, perPage: 100, search: "", status: "", departmentId: "", ...initialFilters,
  });

  const fetchData = useCallback(async (f: Filters) => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set("page", String(f.page));
      params.set("perPage", String(f.perPage));
      if (f.search) params.set("search", f.search);
      if (f.status) params.set("status", f.status);
      if (f.departmentId) params.set("departmentId", f.departmentId);
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

  const anonymize = useCallback(async (ids: string[]) => {
    const results = await Promise.allSettled(
      ids.map((id) =>
        apiFetch(`/api/v1/hr/employees/${id}/anonymize`, {
          method: "POST",
          body: JSON.stringify({ confirm: true }),
        }),
      ),
    );
    const failed = results.filter((r) => r.status === "rejected").length;
    await fetchData(filters);
    return { ok: ids.length - failed, failed };
  }, [filters, fetchData]);

  const setSearch = useCallback((s: string) => setFilters((p) => ({ ...p, search: s, page: 1 })), []);
  const setStatus = useCallback((s: string) => setFilters((p) => ({ ...p, status: s, page: 1 })), []);
  const setDepartmentId = useCallback((id: string) => setFilters((p) => ({ ...p, departmentId: id, page: 1 })), []);
  const setPage = useCallback((n: number) => setFilters((p) => ({ ...p, page: n })), []);

  return { items, pagination, filters, isLoading, error, refetch, create, anonymize, setSearch, setStatus, setDepartmentId, setPage };
}
