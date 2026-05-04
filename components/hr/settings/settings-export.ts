import type { SystemSetting } from "@/hooks/use-settings";
import { downloadJson } from "@/lib/download";

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
  downloadJson(payload, `easyslip-settings-${new Date().toISOString().slice(0, 10)}.json`);
}
