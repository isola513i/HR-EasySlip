import { getTenantId } from "@/lib/db/tenant-context";
import { getTenantPrisma } from "@/lib/db/tenant";
import { getLocale } from "@/lib/i18n/get-locale";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { CompanyForm } from "./company-form";

export default async function CompanySettingsPage() {
  const locale = await getLocale();
  const t = getDictionary(locale);
  const ts = t.tenantSettings.company;

  const tenantId = await getTenantId();
  const prisma = await getTenantPrisma(tenantId);

  const configs = await prisma.systemConfig.findMany({
    where: { key: { in: ["tenant.companyName", "tenant.timezone"] } },
  });

  const get = (key: string): string => {
    const cfg = configs.find((c) => c.key === key);
    if (!cfg) return "";
    return typeof cfg.value === "string" ? cfg.value : String(cfg.value);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">{ts.title}</h1>
        <p className="text-sm text-muted-foreground">{ts.subtitle}</p>
      </div>
      <CompanyForm
        companyName={get("tenant.companyName")}
        timezone={get("tenant.timezone")}
      />
    </div>
  );
}
