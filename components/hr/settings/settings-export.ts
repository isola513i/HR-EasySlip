import type { SystemSetting } from "@/hooks/use-settings";

export function downloadSettingsJson(settings: SystemSetting[]) {
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
}
