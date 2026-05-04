"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useT } from "@/lib/i18n/locale-context";
import type { SystemSetting, SettingGroup, SettingValue } from "@/hooks/use-settings";
import { SettingRow } from "./setting-row";

interface Props {
  group: SettingGroup;
  items: SystemSetting[];
  drafts: Record<string, SettingValue>;
  dirtyKeys: Set<string>;
  onChange: (key: string, value: SettingValue) => void;
  onReset: (key: string) => void;
  onShowHistory: (key: string) => void;
}

export function SettingsGroupCard({ group, items, drafts, dirtyKeys, onChange, onReset, onShowHistory }: Props) {
  const t = useT();
  const settingsT = t.hr.settings;
  const groups = settingsT.groups as Record<string, string | undefined>;
  const groupsHelp = settingsT.groupsHelp as Record<string, string | undefined>;
  const title = groups[group] ?? group;
  const help = groupsHelp[group];

  if (items.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
        {help && <CardDescription className="text-[12px]">{help}</CardDescription>}
      </CardHeader>
      <CardContent className="p-0">
        {items.map((s) => (
          <SettingRow
            key={s.key}
            setting={s}
            draft={drafts[s.key] ?? s.value}
            isDirty={dirtyKeys.has(s.key)}
            onChange={(v) => onChange(s.key, v)}
            onReset={() => onReset(s.key)}
            onShowHistory={() => onShowHistory(s.key)}
          />
        ))}
      </CardContent>
    </Card>
  );
}
