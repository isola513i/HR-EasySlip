"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useSettings, type SystemSetting, type SettingGroup, type SettingValue } from "@/hooks/use-settings";
import { useT } from "@/lib/i18n/locale-context";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { SettingsGroupCard } from "./settings-group-card";
import { SettingHistoryDialog } from "./setting-history-dialog";
import { GeofenceLocationHelper } from "./geofence-location-helper";
import { SettingsHeader } from "./settings-header";
import { SettingsSaveBar } from "./settings-save-bar";
import { downloadSettingsJson } from "./settings-export";
import {
  SettingsLoadingState,
  SettingsErrorState,
  SettingsEmptyState,
} from "./settings-state-boundary";
import { ApiClientError } from "@/lib/api/client";

const GROUP_ORDER: SettingGroup[] = ["leave", "payroll", "attendance", "geofence", "overtime", "pdpa"];

function matchesSearch(s: SystemSetting, label: string, query: string) {
  if (!query) return true;
  const q = query.toLowerCase();
  return s.key.toLowerCase().includes(q) || label.toLowerCase().includes(q);
}

function groupSettings(settings: SystemSetting[]): Record<SettingGroup, SystemSetting[]> {
  const groups: Record<SettingGroup, SystemSetting[]> = {
    leave: [], payroll: [], attendance: [], geofence: [], overtime: [], pdpa: [],
  };
  for (const s of settings) {
    if (s.group in groups) groups[s.group].push(s);
  }
  for (const g of GROUP_ORDER) groups[g].sort((a, b) => a.order - b.order);
  return groups;
}

function geofenceCoord(
  drafts: Record<string, SettingValue>,
  settings: SystemSetting[],
  key: string,
): number {
  const draft = drafts[key];
  if (draft !== undefined) return Number(draft);
  const row = settings.find((s) => s.key === key)?.value;
  return Number(row ?? 0);
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

  function handleExport() {
    downloadSettingsJson(settings);
    toast.success(settingsT.exportSuccess);
  }

  if (isLoading) return <SettingsLoadingState />;
  if (error) return <SettingsErrorState message={error} />;
  if (settings.length === 0) return <SettingsEmptyState message={settingsT.empty} />;

  return (
    <div className="flex flex-col gap-4">
      <SettingsHeader search={search} onSearchChange={setSearch} onExport={handleExport} />

      {GROUP_ORDER.map((g) => (
        <div key={g} className="flex flex-col gap-2">
          {g === "geofence" && (grouped[g]?.length ?? 0) > 0 && (
            <GeofenceLocationHelper
              currentLat={geofenceCoord(drafts, settings, "attendance.geofence.center_lat")}
              currentLng={geofenceCoord(drafts, settings, "attendance.geofence.center_lng")}
              onPick={(picks) => { for (const p of picks) handleChange(p.key, p.value); }}
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

      <SettingsSaveBar
        dirtyCount={dirtyKeys.size}
        saving={saving}
        onDiscard={() => setDrafts({})}
        onSave={handleSaveAll}
      />

      <ConfirmDialog
        open={!!resetTarget}
        onClose={() => setResetTarget(null)}
        onConfirm={handleResetConfirmed}
        title={settingsT.resetConfirmTitle}
        description={settingsT.resetConfirmDesc}
        confirmLabel={settingsT.resetConfirm}
        variant="destructive"
      />

      <SettingHistoryDialog settingKey={historyKey} onClose={() => setHistoryKey(null)} />
    </div>
  );
}
