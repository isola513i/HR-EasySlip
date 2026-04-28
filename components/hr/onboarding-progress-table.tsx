"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { StatusPill } from "@/components/shared/status-pill";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { apiFetch } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n/locale-context";
import { ScrollableTable } from "@/components/shared/scrollable-table";

interface ChecklistProgress {
  id: string;
  employeeId: string;
  employee: { id: string; employeeCode: string; firstNameTh: string; lastNameTh: string; hireDate: string };
  completedAt: string | null;
  progress: { total: number; done: number; percent: number };
}

interface ChecklistItem {
  id: string;
  title: string;
  description?: string;
  category?: string;
  isDone: boolean;
  doneAt?: string;
}

interface ChecklistDetail {
  id: string;
  items: ChecklistItem[];
  progress: { total: number; done: number; percent: number };
}

export function OnboardingProgressTable() {
  const t = useT();
  const filters = [
    { label: t.common.all, value: "" },
    { label: t.onboarding.inProgress, value: "incomplete" },
    { label: t.onboarding.completed, value: "completed" },
  ] as const;
  const [checklists, setChecklists] = useState<ChecklistProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState(0);
  const [detailEmployeeId, setDetailEmployeeId] = useState<string | null>(null);
  const [detail, setDetail] = useState<ChecklistDetail | null>(null);

  const fetchList = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = filters[activeFilter].value ? `?completed=${filters[activeFilter].value === "completed"}` : "";
      const data = await apiFetch<ChecklistProgress[]>(`/api/v1/hr/onboarding/checklists${params}`);
      setChecklists(data);
    } catch { /* empty */ } finally { setIsLoading(false); }
  }, [activeFilter]);

  useEffect(() => { fetchList(); }, [fetchList]);

  const openDetail = async (employeeId: string) => {
    setDetailEmployeeId(employeeId);
    try {
      const data = await apiFetch<ChecklistDetail>(`/api/v1/hr/onboarding/checklists/${employeeId}`);
      setDetail(data);
    } catch { toast.error(t.common.loadFailed); }
  };

  const toggleItem = async (itemId: string, isDone: boolean) => {
    if (!detailEmployeeId) return;
    try {
      await apiFetch(`/api/v1/hr/onboarding/checklists/${detailEmployeeId}/items/${itemId}`, {
        method: "PATCH", body: JSON.stringify({ isDone }),
      });
      await Promise.all([openDetail(detailEmployeeId), fetchList()]);
    } catch { toast.error(t.common.updateFailed); }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-1.5">
        {filters.map((f, i) => (
          <button key={f.label} onClick={() => setActiveFilter(i)} className={cn(
            "rounded-lg border px-3 py-[7px] text-xs font-medium transition-colors",
            i === activeFilter ? "border-transparent bg-[var(--es-neutral-900)] text-white" : "border-[var(--es-neutral-300)] bg-card text-muted-foreground hover:bg-muted",
          )}>{f.label}</button>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-[var(--es-shadow-sm)]">
        <ScrollableTable minWidth={560}>
        <div className="grid grid-cols-[100px_1fr_120px_100px_80px] border-b border-border bg-[var(--es-neutral-50)] px-4 py-2.5 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          <span>{t.onboarding.code}</span><span>{t.onboarding.employeeName}</span><span>{t.onboarding.hireDate}</span><span>{t.onboarding.progress}</span><span>{t.profile.status}</span>
        </div>

        {isLoading && Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="grid grid-cols-[100px_1fr_120px_100px_80px] items-center border-t border-[var(--es-neutral-100)] px-4 py-3">
            <Skeleton className="h-4 w-16" /><Skeleton className="h-4 w-32" /><Skeleton className="h-4 w-20" /><Skeleton className="h-5 w-12" /><Skeleton className="h-5 w-16" />
          </div>
        ))}

        {!isLoading && checklists.map((c) => (
          <button key={c.id} onClick={() => openDetail(c.employeeId)}
            className="grid w-full grid-cols-[100px_1fr_120px_100px_80px] items-center border-t border-[var(--es-neutral-100)] px-4 py-3 text-left text-sm hover:bg-muted transition-colors">
            <span className="tabular-nums text-xs text-muted-foreground">{c.employee.employeeCode}</span>
            <span className="font-medium">{c.employee.firstNameTh} {c.employee.lastNameTh}</span>
            <span className="tabular-nums text-xs text-muted-foreground">
              {new Date(c.employee.hireDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "2-digit" })}
            </span>
            <Badge variant="secondary">{c.progress.done}/{c.progress.total}</Badge>
            <StatusPill tone={c.completedAt ? "success" : "warn"}>
              {c.completedAt ? t.onboarding.done : t.onboarding.pending}
            </StatusPill>
          </button>
        ))}

        {!isLoading && checklists.length === 0 && (
          <div className="py-12 text-center text-sm text-muted-foreground">{t.onboarding.noOnboarding}</div>
        )}
        </ScrollableTable>
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!detailEmployeeId} onOpenChange={() => { setDetailEmployeeId(null); setDetail(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t.onboarding.checklistTitle}</DialogTitle>
          </DialogHeader>
          {detail && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="h-2 flex-1 rounded-full bg-muted">
                  <div className="h-2 rounded-full bg-[var(--es-accent-600)] transition-all" style={{ width: `${detail.progress.percent}%` }} />
                </div>
                <span className="text-xs font-medium tabular-nums">{detail.progress.done}/{detail.progress.total}</span>
              </div>
              {detail.items.map((item) => (
                <label key={item.id} className="flex items-start gap-3 rounded-lg border p-3 cursor-pointer hover:bg-muted/50 transition-colors">
                  <Checkbox checked={item.isDone} onCheckedChange={(v) => toggleItem(item.id, v === true)} className="mt-0.5" />
                  <div>
                    <div className={cn("text-sm font-medium", item.isDone && "line-through text-muted-foreground")}>{item.title}</div>
                    {item.description && <div className="text-xs text-muted-foreground">{item.description}</div>}
                  </div>
                </label>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
