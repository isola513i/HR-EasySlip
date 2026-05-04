"use client";

import { RotateCcw, Info, History } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { useT } from "@/lib/i18n/locale-context";
import { useFormat } from "@/hooks/use-format";
import type { SystemSetting, SettingValue } from "@/hooks/use-settings";

interface Props {
  setting: SystemSetting;
  draft: SettingValue;
  isDirty: boolean;
  onChange: (value: SettingValue) => void;
  onReset: () => void;
  onShowHistory: () => void;
}

type SettingsDict = ReturnType<typeof useT>["hr"]["settings"];

function getLabel(t: SettingsDict, key: string, fallback: string | null) {
  const labels = t.labels as Record<string, string | undefined>;
  return labels[key] ?? fallback ?? key;
}

function getHint(t: SettingsDict, key: string) {
  const hints = t.hints as Record<string, string | undefined>;
  return hints[key];
}

function getUnit(t: SettingsDict, unitKey: string | null) {
  if (!unitKey) return null;
  const units = t.units as Record<string, string | undefined>;
  return units[unitKey] ?? null;
}

function ValueInput({ setting, draft, onChange }: Pick<Props, "setting" | "draft" | "onChange">) {
  if (setting.inputType === "boolean") {
    return (
      <Switch
        checked={draft as boolean}
        onCheckedChange={(checked) => onChange(checked === true)}
        aria-label={setting.key}
      />
    );
  }

  if (setting.inputType === "time") {
    return (
      <Input
        type="time"
        value={String(draft)}
        className="w-32 tabular-nums"
        onChange={(e) => onChange(e.target.value)}
      />
    );
  }

  if (setting.inputType === "number" || setting.inputType === "decimal") {
    return (
      <Input
        type="number"
        className="w-36 tabular-nums"
        value={String(draft)}
        min={setting.min ?? undefined}
        max={setting.max ?? undefined}
        step={setting.step ?? undefined}
        onChange={(e) => {
          const raw = e.target.value;
          if (raw === "") return onChange(0);
          const num = setting.inputType === "decimal" ? parseFloat(raw) : parseInt(raw, 10);
          onChange(Number.isFinite(num) ? num : (draft as number));
        }}
      />
    );
  }

  return (
    <Input
      type="text"
      className="w-40"
      value={String(draft)}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

export function SettingRow({ setting, draft, isDirty, onChange, onReset, onShowHistory }: Props) {
  const t = useT();
  const fmt = useFormat();
  const settingsT = t.hr.settings;
  const label = getLabel(settingsT, setting.key, setting.description);
  const hint = getHint(settingsT, setting.key);
  const unit = getUnit(settingsT, setting.unitKey);
  const isAtDefault = String(setting.value) === String(setting.defaultValue);

  return (
    <div className="flex items-start gap-3 border-t border-border px-4 py-3 first:border-t-0 sm:items-center sm:gap-4">
      <div className="min-w-0 flex-1 space-y-0.5">
        <div className="flex flex-wrap items-center gap-1.5">
          <Label className="text-sm font-medium">{label}</Label>
          {hint && (
            <Tooltip>
              <TooltipTrigger
                render={
                  <button type="button" className="text-muted-foreground hover:text-foreground" aria-label="Info">
                    <Info className="size-3.5" />
                  </button>
                }
              />
              <TooltipContent className="max-w-xs">{hint}</TooltipContent>
            </Tooltip>
          )}
          {isDirty && <Badge variant="outline" className="h-5 text-[10px]">{settingsT.dirtyBadge}</Badge>}
        </div>
        <p className="truncate text-[11px] text-muted-foreground">
          <code className="font-mono">{setting.key}</code>
          {setting.updatedAt && (
            <span className="ml-2">
              {t.common.updated}: {fmt.formatDateTime(setting.updatedAt)}
            </span>
          )}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <ValueInput setting={setting} draft={draft} onChange={onChange} />
        {unit && <span className="w-10 text-xs text-muted-foreground">{unit}</span>}
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="size-8"
                onClick={onShowHistory}
                aria-label={settingsT.historyBtn}
              >
                <History className="size-3.5" />
              </Button>
            }
          />
          <TooltipContent>{settingsT.historyBtn}</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="size-8"
                disabled={isAtDefault && !isDirty}
                onClick={onReset}
                aria-label={settingsT.reset}
              >
                <RotateCcw className="size-3.5" />
              </Button>
            }
          />
          <TooltipContent>
            {settingsT.reset} ({settingsT.defaultLabel}: {String(setting.defaultValue)})
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}
