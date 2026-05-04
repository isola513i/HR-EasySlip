"use client";

import { useMemo, useState } from "react";
import { Save, Undo2, AlertTriangle, Download } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useSettings, type SystemSetting, type SettingGroup, type SettingValue } from "@/hooks/use-settings";
import { useT } from "@/lib/i18n/locale-context";
import { SearchInput } from "@/components/shared/search-input";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { SettingsGroupCard } from "./settings-group-card";
import { SettingHistoryDialog } from "./setting-history-dialog";
import { GeofenceLocationHelper } from "./geofence-location-helper";
import { ApiClientError } from "@/lib/api/client";

const GROUP_ORDER: SettingGroup[] = ["leave", "payroll", "attendance", "geofence", "pdpa"];

function matchesSearch(s: SystemSetting, label: string, query: string) {
  if (!query) return true;
  const q = query.toLowerCase();
  return s.key.toLowerCase().includes(q) || label.toLowerCase().includes(q);
}

function groupSettings(settings: SystemSetting[]): Record<SettingGroup, SystemSetting[]> {
  const groups: Record<SettingGroup, SystemSetting[]> = {
    leave: [], payroll: [], attendance: [], geofence: [], pdpa: [],
  };
  for (const s of settings) {
    if (s.group in groups) groups[s.group].push(s);
  }
  for (const g of GROUP_ORDER) groups[g].sort((a, b) => a.order - b.order);
  return groups;
}

export function SettingsPanel() {
  const t = useT();
  const settingsT = t.hr.settings;
  const { settings, isLoading, error, updateBatch, reset } = useSettings();

  const [drafts, setDrafts] = useState<Record<string, SettingValue>>({});
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [resetTarget, setResetTarget] = useState<string | null>(null);
  const [historyKey, setHistoryKey] = useState<string | null>(null);

  const dirtyKeys = useMemo(() => {
    const set = new Set<string>();
    for (const s of settings) {
      const draft = drafts[s.key];
      if (draft !== undefined && String(draft) !== String(s.value)) set.add(s.key);
    }
    return set;
  }, [drafts, settings]);

  const filtered = useMemo(() => {
    const labels = settingsT.labels as Record<string, string | undefined>;
    return settings.filter((s) => matchesSearch(s, labels[s.key] ?? s.description ?? "", search));
  }, [settings, search, settingsT.labels]);

  const grouped = useMemo(() => groupSettings(filtered), [filtered]);

  function handleChange(key: string, value: SettingValue) {
    setDrafts((d) => ({ ...d, [key]: value }));
  }

  function handleDiscard() {
    setDrafts({});
  }

  function formatSaveError(err: unknown): string {
    if (err instanceof ApiClientError && err.code === "CROSS_FIELD_VIOLATION") {
      const rule = (err.details as { rule?: string } | undefined)?.rule;
      const messages = settingsT.crossFieldErrors as Record<string, string>;
      if (rule && messages[rule]) return messages[rule];
    }
    return err instanceof Error ? err.message : t.common.saveFailed;
  }

  async function handleSaveAll() {
    if (dirtyKeys.size === 0) return;
    setSaving(true);
    try {
      const updates = Array.from(dirtyKeys).map((key) => ({ key, value: drafts[key] }));
      await updateBatch(updates);
      setDrafts({});
      toast.success(t.common.savedSuccess);
    } catch (err) {
      toast.error(formatSaveError(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleResetConfirmed() {
    if (!resetTarget) return;
    try {
      await reset(resetTarget);
      setDrafts((d) => {
        const next = { ...d };
        delete next[resetTarget];
        return next;
      });
      toast.success(t.common.savedSuccess);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t.common.saveFailed);
    } finally {
      setResetTarget(null);
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardHeader><Skeleton className="h-5 w-28" /></CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex h-[300px] flex-col items-center justify-center gap-2 text-sm">
          <AlertTriangle className="size-5 text-destructive" />
          <p className="text-destructive">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (settings.length === 0) {
    return <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">{settingsT.empty}</div>;
  }

  const dirtyCount = dirtyKeys.size;

  function handleExportJson() {
    const payload = {
      exportedAt: new Date().toISOString(),
      version: 1,
      settings: settings.map((s) => ({
        key: s.key,
        value: s.value,
        defaultValue: s.defaultValue,
        group: s.group,
        updatedBy: s.updatedBy,
        updatedAt: s.updatedAt,
      })),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `easyslip-settings-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(settingsT.exportSuccess);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold">{settingsT.title}</h1>
          <p className="text-[12px] text-muted-foreground">{settingsT.subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <SearchInput
            placeholder={settingsT.searchPlaceholder}
            value={search}
            onChange={setSearch}
            className="sm:max-w-xs"
          />
          <Button type="button" variant="outline" size="sm" onClick={handleExportJson}>
            <Download className="mr-1.5 size-3.5" />
            {settingsT.exportJson}
          </Button>
        </div>
      </div>

      {GROUP_ORDER.map((g) => (
        <div key={g} className="flex flex-col gap-2">
          {g === "geofence" && (grouped[g]?.length ?? 0) > 0 && (
            <GeofenceLocationHelper
              currentLat={Number(
                drafts["attendance.geofence.center_lat"]
                ?? settings.find((s) => s.key === "attendance.geofence.center_lat")?.value
                ?? 0,
              )}
              currentLng={Number(
                drafts["attendance.geofence.center_lng"]
                ?? settings.find((s) => s.key === "attendance.geofence.center_lng")?.value
                ?? 0,
              )}
              onPick={(picks) => {
                for (const p of picks) handleChange(p.key, p.value);
              }}
            />
          )}
          <SettingsGroupCard
            group={g}
            items={grouped[g] ?? []}
            drafts={drafts}
            dirtyKeys={dirtyKeys}
            onChange={handleChange}
            onReset={(key) => setResetTarget(key)}
            onShowHistory={(key) => setHistoryKey(key)}
          />
        </div>
      ))}

      {filtered.length === 0 && (
        <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">
          {settingsT.noResults}
        </div>
      )}

      {dirtyCount > 0 && (
        <div
          className="sticky bottom-4 z-10 mx-auto flex w-full max-w-2xl items-center justify-between gap-2 rounded-full border border-border bg-card/95 px-4 py-2 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-card/80"
          role="status"
          aria-live="polite"
        >
          <span className="text-xs font-medium text-foreground">
            {settingsT.saveAllCount.replace("{count}", String(dirtyCount))}
          </span>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={handleDiscard} disabled={saving}>
              <Undo2 className="mr-1.5 size-3.5" />
              {settingsT.discardAll}
            </Button>
            <Button size="sm" onClick={handleSaveAll} disabled={saving}>
              <Save className="mr-1.5 size-3.5" />
              {saving ? t.common.saving : settingsT.saveAll}
            </Button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!resetTarget}
        onClose={() => setResetTarget(null)}
        onConfirm={handleResetConfirmed}
        title={settingsT.resetConfirmTitle}
        description={settingsT.resetConfirmDesc}
        confirmLabel={settingsT.resetConfirm}
        variant="destructive"
      />

      <SettingHistoryDialog
        settingKey={historyKey}
        onClose={() => setHistoryKey(null)}
      />
    </div>
  );
}
