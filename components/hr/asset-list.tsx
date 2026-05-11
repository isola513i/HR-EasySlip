"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Boxes, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusPill } from "@/components/shared/status-pill";
import { ScrollableTable } from "@/components/shared/scrollable-table";
import { SearchInput } from "@/components/shared/search-input";
import { AssetCreateDialog } from "@/components/hr/asset-create-dialog";
import { AssetAssignDialog } from "@/components/hr/asset-assign-dialog";
import { AssetActionButtons, AssetCardMobile, STATUS_TONE, assetLabel } from "@/components/hr/asset-row";
import { useAssets, type AssetRow } from "@/hooks/use-assets";
import { useT } from "@/lib/i18n/locale-context";

const GRID = "grid-cols-[120px_1.5fr_120px_1fr_120px_140px]";

export function AssetList() {
  const t = useT();
  const { items, isLoading, error, returnAsset, retireAsset } = useAssets();
  const [createOpen, setCreateOpen] = useState(false);
  const [assignTarget, setAssignTarget] = useState<AssetRow | null>(null);
  const [query, setQuery] = useState("");

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((a) => {
      const haystack = [a.brand, a.model, a.serialNumber, a.notes, t.hr.assets.types[a.type]]
        .filter(Boolean).join(" ").toLowerCase();
      const assignee = a.assignments[0]?.employee;
      const assigneeText = assignee
        ? `${assignee.firstNameTh} ${assignee.lastNameTh} ${assignee.employeeCode}`.toLowerCase()
        : "";
      return haystack.includes(q) || assigneeText.includes(q);
    });
  }, [items, query, t.hr.assets.types]);

  const stats = useMemo(() => ({
    total: items.length,
    available: items.filter((a) => a.status === "AVAILABLE").length,
    assigned: items.filter((a) => a.status === "ASSIGNED").length,
    retired: items.filter((a) => a.status === "RETIRED").length,
  }), [items]);

  const handleReturn = async (a: AssetRow) => {
    try { await returnAsset(a.id); toast.success(t.hr.assets.returnSuccess); }
    catch { toast.error(t.hr.assets.returnFailed); }
  };
  const handleRetire = async (a: AssetRow) => {
    try { await retireAsset(a.id); toast.success(t.hr.assets.retireSuccess); }
    catch { toast.error(t.hr.assets.retireFailed); }
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-bold tracking-tight">{t.hr.assets.pageTitle}</h1>
          <p className="mt-0.5 text-[13px] text-muted-foreground">{t.hr.assets.pageSubtitle}</p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="gap-1.5">
          <Plus className="size-4" /> {t.hr.assets.addBtn}
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiCard label={t.hr.assets.kpiTotal} value={String(stats.total)} />
        <KpiCard label={t.hr.assets.kpiAvailable} value={String(stats.available)} tone="success" />
        <KpiCard label={t.hr.assets.kpiAssigned} value={String(stats.assigned)} tone="info" />
        <KpiCard label={t.hr.assets.kpiRetired} value={String(stats.retired)} tone="neutral" />
      </div>

      <div className="flex items-center gap-2.5">
        <SearchInput placeholder={t.hr.assets.searchPlaceholder} value={query} onChange={setQuery} />
        <StatusPill tone="neutral" dot={false}>{`${t.common.all} (${visible.length})`}</StatusPill>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-(--es-shadow-sm)">
        {isLoading && (
          <div className="space-y-2 p-4">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}
          </div>
        )}
        {!isLoading && error && (
          <div className="px-4 py-12 text-center text-sm text-destructive">{error}</div>
        )}
        {!isLoading && !error && visible.length === 0 && (
          <div className="flex flex-col items-center gap-2 px-4 py-16 text-muted-foreground">
            <Boxes className="size-10 opacity-40" />
            <p className="text-sm">{t.hr.assets.empty}</p>
          </div>
        )}
        {!isLoading && !error && visible.length > 0 && (
          <>
            <div className="space-y-2 p-3 md:hidden">
              {visible.map((a) => (
                <AssetCardMobile
                  key={a.id}
                  asset={a}
                  onAssign={() => setAssignTarget(a)}
                  onReturn={() => handleReturn(a)}
                  onRetire={() => handleRetire(a)}
                />
              ))}
            </div>

            <div className="hidden md:block">
              <ScrollableTable minWidth={920}>
                <div className={`grid ${GRID} border-b border-border bg-(--es-neutral-50) px-5 py-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground`}>
                  <span>{t.hr.assets.type}</span>
                  <span>{t.hr.assets.assetCol}</span>
                  <span>{t.hr.assets.colSerial}</span>
                  <span>{t.hr.assets.assignedTo}</span>
                  <span>{t.hr.assets.colStatus}</span>
                  <span className="text-right">{t.hr.assets.colActions}</span>
                </div>
                {visible.map((a) => {
                  const assignee = a.assignments[0]?.employee;
                  return (
                    <div key={a.id} className={`grid ${GRID} items-center border-b border-(--es-neutral-100) px-5 py-3.5 text-[13px] last:border-b-0`}>
                      <span className="font-medium">{t.hr.assets.types[a.type]}</span>
                      <div>
                        <div className="font-semibold">{assetLabel(a)}</div>
                        {a.notes && <div className="truncate text-[11px] text-muted-foreground">{a.notes}</div>}
                      </div>
                      <span className="font-mono text-[12px] text-muted-foreground">{a.serialNumber ?? "—"}</span>
                      <span className="text-muted-foreground">
                        {assignee ? `${assignee.firstNameTh} ${assignee.lastNameTh} (${assignee.employeeCode})` : "—"}
                      </span>
                      <StatusPill tone={STATUS_TONE[a.status]}>{t.hr.assets.statuses[a.status]}</StatusPill>
                      <div className="flex justify-end gap-1.5">
                        <AssetActionButtons asset={a} onAssign={() => setAssignTarget(a)} onReturn={() => handleReturn(a)} onRetire={() => handleRetire(a)} />
                      </div>
                    </div>
                  );
                })}
              </ScrollableTable>
            </div>
          </>
        )}
      </div>

      <AssetCreateDialog open={createOpen} onClose={() => setCreateOpen(false)} />
      <AssetAssignDialog
        open={!!assignTarget}
        assetId={assignTarget?.id ?? null}
        assetLabel={assignTarget ? `${t.hr.assets.types[assignTarget.type]} · ${assetLabel(assignTarget)}` : undefined}
        onClose={() => setAssignTarget(null)}
      />
    </div>
  );
}

function KpiCard({ label, value, tone }: { label: string; value: string; tone?: "success" | "info" | "neutral" }) {
  const ring =
    tone === "success" ? "ring-(--es-success-500)/30 bg-(--es-success-500)/5"
    : tone === "info" ? "ring-(--es-accent-600)/25 bg-(--es-accent-600)/5"
    : "ring-(--es-neutral-300)/40 bg-(--es-neutral-50)";
  return (
    <div className={`rounded-xl border border-border bg-card p-4 shadow-(--es-shadow-sm) ring-1 ${ring}`}>
      <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-bold tabular-nums">{value}</div>
    </div>
  );
}
