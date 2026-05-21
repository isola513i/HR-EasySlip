import type { Metadata } from "next";
import Link from "next/link";
import { Users } from "lucide-react";
import { InboxTabs } from "@/components/manager/inbox-tabs";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getLocale } from "@/lib/i18n/get-locale";

export async function generateMetadata(): Promise<Metadata> {
  const t = getDictionary(await getLocale());
  return { title: t.employee.approvalsTitle };
}

export default async function ApprovalsPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const [{ slug }, locale] = await Promise.all([params, getLocale()]);
  const t = getDictionary(locale);
  const te = t.employee;

  return (
    <div className="flex min-h-full flex-col">
      <div className="flex items-center justify-between px-4 pb-2 pt-6">
        <h1 className="text-xl font-bold">{te.approvalsTitle}</h1>
        <Link
          href={`/${slug}/employee/approvals/team`}
          className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-[13px] font-medium text-foreground transition-colors hover:bg-muted/80"
          aria-label={te.approvalsTeamAriaLabel}
        >
          <Users className="size-4" aria-hidden="true" />
          {te.bottomNav.team}
        </Link>
      </div>
      <div className="flex-1 px-4 pb-4">
        <InboxTabs />
      </div>
    </div>
  );
}
