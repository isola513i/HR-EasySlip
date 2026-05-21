import { getLocale } from "@/lib/i18n/get-locale";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getImpersonationStatus } from "./actions";
import { ImpersonationToggle } from "./impersonation-toggle";

export default async function SecuritySettingsPage() {
  const locale = await getLocale();
  const t = getDictionary(locale);
  const ts = t.tenantSettings.security;

  const status = await getImpersonationStatus();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">{ts.title}</h1>
        <p className="text-sm text-muted-foreground">{ts.subtitle}</p>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <h2 className="text-sm font-semibold">{ts.impersonation.sectionTitle}</h2>
        <p className="text-sm text-muted-foreground">{ts.impersonation.description}</p>
        <ImpersonationToggle
          enabled={status.enabled}
          disabledAt={status.disabledAt?.toISOString() ?? null}
          disabledByEmail={status.disabledByEmail}
        />
      </div>
    </div>
  );
}
