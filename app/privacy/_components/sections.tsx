import { Mail, Phone, type LucideIcon } from "lucide-react";
import type { Dictionary } from "@/lib/i18n/dictionaries";

export interface SectionMeta {
  id: string;
  title: string;
  icon: LucideIcon;
}

function SectionShell({
  meta,
  title,
  children,
}: {
  meta: SectionMeta;
  title?: string;
  children: React.ReactNode;
}) {
  const Icon = meta.icon;
  return (
    <section
      id={meta.id}
      className="scroll-mt-24 rounded-2xl border bg-card p-6 ring-1 ring-black/5 sm:p-8"
    >
      <div className="flex items-center gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
          <Icon className="size-5" />
        </span>
        <h2 className="text-lg font-semibold tracking-tight">
          {title ?? meta.title}
        </h2>
      </div>
      <div className="mt-4 space-y-3 text-sm leading-relaxed text-foreground/80">
        {children}
      </div>
    </section>
  );
}

export function ProseSection({
  meta,
  title,
  children,
}: {
  meta: SectionMeta;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <SectionShell meta={meta} title={title}>
      {children}
    </SectionShell>
  );
}

export function ListSection({
  meta,
  title,
  intro,
  items,
  outro,
}: {
  meta: SectionMeta;
  title: string;
  intro?: string;
  items: readonly string[];
  outro?: string;
}) {
  return (
    <SectionShell meta={meta} title={title}>
      {intro ? <p>{intro}</p> : null}
      <ul className="space-y-2.5 pl-1">
        {items.map((it, i) => (
          <li key={i} className="flex gap-2.5 leading-relaxed">
            <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary/60" />
            <span>{it}</span>
          </li>
        ))}
      </ul>
      {outro ? <p className="pt-1">{outro}</p> : null}
    </SectionShell>
  );
}

export function ControllerSection({
  meta,
  t,
}: {
  meta: SectionMeta;
  t: Dictionary["privacy"]["sections"]["controller"];
}) {
  return (
    <SectionShell meta={meta}>
      <p className="font-medium text-foreground">{t.company}</p>
      <p>{t.address}</p>
      <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:items-center sm:gap-4">
        <a
          href="mailto:contact@easyslip.com"
          className="inline-flex items-center gap-1.5 text-primary underline-offset-4 hover:underline"
        >
          <Mail className="size-3.5" /> contact@easyslip.com
        </a>
        <a
          href="tel:+6621148806"
          className="inline-flex items-center gap-1.5 text-primary underline-offset-4 hover:underline"
        >
          <Phone className="size-3.5" /> 02-114-8806
        </a>
      </div>
      <div className="mt-4 rounded-lg border border-dashed bg-background p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-foreground/70">
          {t.dpoLabel}
        </p>
        <p className="mt-1 font-medium text-foreground">{t.dpoName}</p>
        <div className="mt-2 flex flex-col gap-2 text-xs sm:flex-row sm:items-center sm:gap-4">
          <a
            href="mailto:nattawut@easyslip.com"
            className="inline-flex items-center gap-1.5 text-primary underline-offset-4 hover:underline"
          >
            <Mail className="size-3" /> nattawut@easyslip.com
          </a>
          <a
            href="tel:+66902701908"
            className="inline-flex items-center gap-1.5 text-primary underline-offset-4 hover:underline"
          >
            <Phone className="size-3" /> 090-270-1908
          </a>
        </div>
      </div>
    </SectionShell>
  );
}

export function ProsesPurposesSection({
  meta,
  t,
}: {
  meta: SectionMeta;
  t: Dictionary["privacy"]["sections"]["purposes"];
}) {
  const groups = [
    {
      heading: t.contractHeading,
      items: [t.contract1, t.contract2, t.contract3],
    },
    {
      heading: t.legitimateHeading,
      items: [t.legitimate1, t.legitimate2],
    },
    {
      heading: t.complianceHeading,
      items: [t.compliance1, t.compliance2],
    },
  ];
  return (
    <SectionShell meta={meta}>
      <div className="space-y-5">
        {groups.map((g) => (
          <div key={g.heading}>
            <p className="font-medium text-foreground">{g.heading}</p>
            <ul className="mt-2 space-y-2.5 pl-1">
              {g.items.map((it, i) => (
                <li key={i} className="flex gap-2.5 leading-relaxed">
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary/60" />
                  <span>{it}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </SectionShell>
  );
}
