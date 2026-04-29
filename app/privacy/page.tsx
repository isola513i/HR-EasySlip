import type { Metadata } from "next";
import {
  AlertTriangle,
  Clock,
  Eye,
  FileText,
  ListChecks,
  Lock,
  Mail,
  Phone,
  RefreshCw,
  Shield,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { getDict } from "@/lib/i18n/get-dict";
import { TocSidebar } from "./_components/toc-sidebar";
import {
  ControllerSection,
  ListSection,
  ProsesPurposesSection,
  ProseSection,
  type SectionMeta,
} from "./_components/sections";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDict();
  return { title: t.privacy.pageTitle };
}

export default async function PrivacyPage() {
  const { t } = await getDict();
  const p = t.privacy;
  const s = p.sections;

  const sections: SectionMeta[] = [
    { id: "controller", title: s.controller.title, icon: Shield },
    { id: "collected", title: s.collected.title, icon: FileText },
    { id: "purposes", title: s.purposes.title, icon: ListChecks },
    { id: "disclosure", title: s.disclosure.title, icon: Eye },
    { id: "retention", title: s.retention.title, icon: Clock },
    { id: "rights", title: s.rights.title, icon: UserCheck },
    { id: "security", title: s.security.title, icon: Lock },
    { id: "breach", title: s.breach.title, icon: AlertTriangle },
    { id: "changes", title: s.changes.title, icon: RefreshCw },
  ];

  return (
    <main className="min-h-dvh bg-muted/30">
      {/* Hero */}
      <header className="es-brand-gradient relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 20% 30%, rgba(255,255,255,0.12), transparent 60%)",
          }}
        />
        <div className="relative mx-auto max-w-6xl px-6 py-14 text-white">
          <div className="flex items-start gap-4">
            <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-white/15 ring-1 ring-white/20">
              <ShieldCheck className="size-6" />
            </span>
            <div>
              <h1 className="text-4xl font-bold tracking-tight">{p.heading}</h1>
              <p className="mt-1 text-white/80">{p.subheading}</p>
              <span className="mt-3 inline-block rounded-full bg-white/15 px-3 py-1 text-[11px] font-medium ring-1 ring-white/20">
                {p.effectiveDate}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Body */}
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-10 lg:grid-cols-[220px_1fr] lg:gap-12">
          <TocSidebar
            sections={sections.map(({ id, title }) => ({ id, title }))}
            label={p.onThisPage}
          />

          <div className="space-y-6">
            <ControllerSection meta={sections[0]} t={s.controller} />
            <ListSection
              meta={sections[1]}
              title={s.collected.title}
              intro={s.collected.intro}
              items={[
                s.collected.item1,
                s.collected.item2,
                s.collected.item3,
                s.collected.item4,
                s.collected.item5,
                s.collected.item6,
              ]}
            />
            <ProsesPurposesSection meta={sections[2]} t={s.purposes} />
            <ListSection
              meta={sections[3]}
              title={s.disclosure.title}
              intro={s.disclosure.intro}
              items={[
                s.disclosure.item1,
                s.disclosure.item2,
                s.disclosure.item3,
                s.disclosure.item4,
              ]}
            />
            <ProseSection meta={sections[4]} title={s.retention.title}>
              <p>{s.retention.body}</p>
            </ProseSection>
            <ListSection
              meta={sections[5]}
              title={s.rights.title}
              intro={s.rights.intro}
              items={[
                s.rights.item1,
                s.rights.item2,
                s.rights.item3,
                s.rights.item4,
                s.rights.item5,
                s.rights.item6,
                s.rights.item7,
                s.rights.item8,
              ]}
              outro={s.rights.contact}
            />
            <ListSection
              meta={sections[6]}
              title={s.security.title}
              items={[
                s.security.item1,
                s.security.item2,
                s.security.item3,
                s.security.item4,
                s.security.item5,
              ]}
            />
            <ProseSection meta={sections[7]} title={s.breach.title}>
              <p>{s.breach.body}</p>
            </ProseSection>
            <ProseSection meta={sections[8]} title={s.changes.title}>
              <p>{s.changes.body}</p>
            </ProseSection>

            <ContactCard
              heading={p.contactHeading}
              cta={p.contactCta}
              dpoLabel={s.controller.dpoLabel}
              dpoName={s.controller.dpoName}
            />
          </div>
        </div>
      </div>
    </main>
  );
}

function ContactCard({
  heading,
  cta,
  dpoLabel,
  dpoName,
}: {
  heading: string;
  cta: string;
  dpoLabel: string;
  dpoName: string;
}) {
  return (
    <div className="rounded-2xl border bg-card p-6 ring-1 ring-black/5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
            <Mail className="size-5" />
          </span>
          <div>
            <p className="font-semibold">{heading}</p>
            <p className="text-sm text-foreground/75">
              {dpoLabel}: {dpoName}
            </p>
            <a
              href="tel:+66902701908"
              className="mt-1 inline-flex items-center gap-1.5 text-xs text-foreground/70 hover:text-primary"
            >
              <Phone className="size-3" /> 090-270-1908
            </a>
          </div>
        </div>
        <a
          href="mailto:nattawut@easyslip.com"
          className={buttonVariants({ className: "shrink-0" })}
        >
          {cta}
        </a>
      </div>
    </div>
  );
}
