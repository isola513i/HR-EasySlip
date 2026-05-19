"use client";

import { useRef, useCallback, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface FilterOption {
  value: string;
  label: string;
}

interface FilterBarProps {
  searchPlaceholder?: string;
  statusOptions?: FilterOption[];
  planOptions?: FilterOption[];
  defaultValues?: { q?: string; status?: string; plan?: string };
}

export function FilterBar({
  searchPlaceholder = "Search...",
  statusOptions,
  planOptions,
  defaultValues = {},
}: FilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [statusVal, setStatusVal] = useState(defaultValues.status || "ALL");
  const [planVal, setPlanVal] = useState(defaultValues.plan || "ALL");
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const filters = useRef({
    q: defaultValues.q ?? "",
    status: defaultValues.status ?? "",
    plan: defaultValues.plan ?? "",
  });

  const push = useCallback(() => {
    const { q, status, plan } = filters.current;
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (status && status !== "ALL") params.set("status", status);
    if (plan && plan !== "ALL") params.set("plan", plan);
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  }, [router, pathname]);

  const handleSearch = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      filters.current.q = e.target.value;
      clearTimeout(timer.current);
      timer.current = setTimeout(push, 300);
    },
    [push]
  );

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      <div className="relative min-w-[200px] flex-1 max-w-xs">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
        <Input
          defaultValue={defaultValues.q ?? ""}
          onChange={handleSearch}
          placeholder={searchPlaceholder}
          className="pl-8 h-8 text-sm bg-card border-border focus-visible:ring-primary/40"
        />
      </div>

      {statusOptions && (
        <Select
          value={statusVal}
          onValueChange={(v) => { setStatusVal(v ?? "ALL"); filters.current.status = v ?? ""; push(); }}
        >
          <SelectTrigger className="h-8 w-[150px] bg-card border-border">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL" label="All statuses">All statuses</SelectItem>
            {statusOptions.map((o) => (
              <SelectItem key={o.value} value={o.value} label={o.label}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {planOptions && (
        <Select
          value={planVal}
          onValueChange={(v) => { setPlanVal(v ?? "ALL"); filters.current.plan = v ?? ""; push(); }}
        >
          <SelectTrigger className="h-8 w-[130px] bg-card border-border">
            <SelectValue placeholder="All plans" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL" label="All plans">All plans</SelectItem>
            {planOptions.map((o) => (
              <SelectItem key={o.value} value={o.value} label={o.label}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}
