"use client";

import { useState } from "react";
import { Save } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useSettings, type SystemSetting } from "@/hooks/use-settings";

const GROUP_LABELS: Record<string, string> = { leave: "Leave", payroll: "Payroll", attendance: "Attendance", pdpa: "PDPA" };

function groupSettings(settings: SystemSetting[]): Record<string, SystemSetting[]> {
  const groups: Record<string, SystemSetting[]> = {};
  for (const s of settings) {
    const g = s.key.split(".")[0];
    if (!groups[g]) groups[g] = [];
    groups[g].push(s);
  }
  return groups;
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });
}

function SettingRow({ setting, onSave }: { setting: SystemSetting; onSave: (key: string, value: string | number | boolean) => Promise<void> }) {
  const original = setting.value;
  const [draft, setDraft] = useState<string | number | boolean>(original);
  const [saving, setSaving] = useState(false);
  const dirty = draft !== original;

  async function handleSave() {
    setSaving(true);
    try { await onSave(setting.key, draft); toast.success("บันทึกเรียบร้อย"); }
    catch (err) { toast.error(err instanceof Error ? err.message : "บันทึกไม่สำเร็จ"); }
    finally { setSaving(false); }
  }

  const isBool = typeof original === "boolean";
  const isNum = typeof original === "number";

  return (
    <div className="flex items-center gap-4 border-t border-border px-4 py-3 first:border-t-0">
      <div className="flex-1 space-y-0.5">
        <Label className="text-sm font-medium">{setting.description ?? setting.key}</Label>
        <p className="text-[11px] text-muted-foreground">
          <code>{setting.key}</code>
          {setting.updatedAt && <span className="ml-2">Updated: {formatDateTime(setting.updatedAt)}</span>}
        </p>
      </div>
      {isBool ? (
        <Checkbox checked={draft as boolean} onCheckedChange={(v) => setDraft(v === true)} />
      ) : (
        <Input type={isNum ? "number" : "text"} className="w-40" value={String(draft)}
          onChange={(e) => setDraft(isNum ? Number(e.target.value) : e.target.value)} />
      )}
      <Button size="sm" variant={dirty ? "default" : "outline"} disabled={!dirty || saving} onClick={handleSave}>
        <Save className="mr-1.5 size-3.5" />{saving ? "Saving..." : "Save"}
      </Button>
    </div>
  );
}

export function SettingsPanel() {
  const { settings, isLoading, error, update } = useSettings();
  const groups = groupSettings(settings);

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
    return <div className="flex h-[300px] items-center justify-center text-sm text-destructive">{error}</div>;
  }
  if (settings.length === 0) {
    return <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">No settings configured yet.</div>;
  }

  return (
    <div className="flex flex-col gap-6">
      {Object.entries(groups).map(([prefix, items]) => (
        <Card key={prefix}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{GROUP_LABELS[prefix] ?? prefix}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {items.map((s) => <SettingRow key={s.key} setting={s} onSave={update} />)}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
