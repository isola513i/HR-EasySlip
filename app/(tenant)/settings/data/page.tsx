import { getLocale } from "@/lib/i18n/get-locale";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getTenantLifecycleStatus } from "./actions";
import { LifecyclePanel } from "./lifecycle-panel";

export default async function DataSettingsPage() {
  const locale = await getLocale();
  const t = getDictionary(locale);
  const td = t.tenantSettings.data;

  const lifecycle = await getTenantLifecycleStatus();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">{td.title}</h1>
        <p className="text-sm text-muted-foreground">{td.subtitle}</p>
      </div>

      <div className="space-y-2">
        <h2 className="text-sm font-semibold">{td.accountStatus}</h2>
        <LifecyclePanel
          lifecycle={lifecycle}
          exportUrl="/api/v1/tenant/export"
          t={{
            accountActive: td.accountActive,
            accountExpired: td.accountExpired,
            accountSuspended: td.accountSuspended,
            gracePeriodEnds: td.gracePeriodEnds,
            softDeleteScheduled: td.softDeleteScheduled,
            hardDeleteScheduled: td.hardDeleteScheduled,
            softDeleteDone: td.softDeleteDone,
            exportBtn: td.exportBtn,
            exportHint: td.exportHint,
            contactRenewal: td.contactRenewal,
            daysLeft: td.daysLeft,
          }}
        />
      </div>

      <div className="rounded-xl border border-border bg-card p-5 space-y-2">
        <h2 className="text-sm font-semibold">{td.retentionTitle}</h2>
        <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
          <li>{td.retentionAuditLog}</li>
          <li>{td.retentionPersonalData}</li>
          <li>{td.retentionPayroll}</li>
        </ul>
      </div>
    </div>
  );
}
