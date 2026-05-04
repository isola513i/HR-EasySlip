"use client";

import { Save, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n/locale-context";

interface Props {
  dirtyCount: number;
  saving: boolean;
  onDiscard: () => void;
  onSave: () => void;
}

export function SettingsSaveBar({ dirtyCount, saving, onDiscard, onSave }: Props) {
  const t = useT();
  const dict = t.hr.settings;
  if (dirtyCount === 0) return null;

  return (
    <div
      className="sticky bottom-4 z-10 mx-auto flex w-full max-w-2xl items-center justify-between gap-2 rounded-full border border-border bg-card/95 px-4 py-2 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-card/80"
      role="status"
      aria-live="polite"
    >
      <span className="text-xs font-medium text-foreground">
        {dict.saveAllCount.replace("{count}", String(dirtyCount))}
      </span>
      <div className="flex gap-2">
        <Button variant="ghost" size="sm" onClick={onDiscard} disabled={saving}>
          <Undo2 className="mr-1.5 size-3.5" />
          {dict.discardAll}
        </Button>
        <Button size="sm" onClick={onSave} disabled={saving}>
          <Save className="mr-1.5 size-3.5" />
          {saving ? t.common.saving : dict.saveAll}
        </Button>
      </div>
    </div>
  );
}
