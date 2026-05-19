import type { Metadata } from "next";
import {
  AlertCircle,
  Ban,
  BookOpen,
  Clock,
  CreditCard,
  FileText,
  Gavel,
  Lock,
  RefreshCw,
  Scale,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { getDict } from "@/lib/i18n/get-dict";
import { TocSidebar } from "../privacy/_components/toc-sidebar";
import {
  ListSection,
  ProseSection,
  type SectionMeta,
} from "../privacy/_components/sections";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDict();
  return { title: t.terms.pageTitle };
}

export default async function TermsPage() {
  const { t } = await getDict();
  const terms = t.terms;
  const s = terms.sections;

  const sections: SectionMeta[] = [
    { id: "acceptance", title: s.acceptance.title, icon: FileText },
    { id: "description", title: s.description.title, icon: BookOpen },
    { id: "account", title: s.account.title, icon: UserCheck },
    { id: "data", title: s.data.title, icon: Lock },
    { id: "acceptable", title: s.acceptable.title, icon: Ban },
    { id: "trial", title: s.trial.title, icon: Clock },
    { id: "payment", title: s.payment.title, icon: CreditCard },
    { id: "termination", title: s.termination.title, icon: AlertCircle },
    { id: "liability", title: s.liability.title, icon: Scale },
    { id: "law", title: s.law.title, icon: Gavel },
    { id: "changes", title: s.changes.title, icon: RefreshCw },
  ];

  return (
    <main className="min-h-dvh bg-muted/30">
      <header className="es-brand-gradient relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 80% 30%, rgba(255,255,255,0.10), transparent 60%)",
          }}
        />
        <div className="relative mx-auto max-w-6xl px-6 py-10 text-white sm:py-14">
          <div className="flex items-start gap-4">
            <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-white/15 ring-1 ring-white/20">
              <ShieldCheck className="size-6" />
            </span>
            <div>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                {terms.heading}
              </h1>
              <p className="mt-1 text-white/80">{terms.subheading}</p>
              <span className="mt-3 inline-block rounded-full bg-white/15 px-3 py-1 text-[11px] font-medium ring-1 ring-white/20">
                {terms.effectiveDate}
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-10 lg:grid-cols-[220px_1fr] lg:gap-12">
          <TocSidebar
            sections={sections.map(({ id, title }) => ({ id, title }))}
            label={terms.onThisPage}
          />

          <div className="space-y-6">
            <ProseSection meta={sections[0]} title={s.acceptance.title}>
              <p>{s.acceptance.body}</p>
            </ProseSection>

            <ListSection
              meta={sections[1]}
              title={s.description.title}
              intro={s.description.intro}
              items={[
                s.description.item1,
                s.description.item2,
                s.description.item3,
                s.description.item4,
                s.description.item5,
              ]}
            />

            <ProseSection meta={sections[2]} title={s.account.title}>
              <p>{s.account.body}</p>
            </ProseSection>

            <ProseSection meta={sections[3]} title={s.data.title}>
              <p>{s.data.body}</p>
            </ProseSection>

            <ListSection
              meta={sections[4]}
              title={s.acceptable.title}
              intro={s.acceptable.intro}
              items={[
                s.acceptable.item1,
                s.acceptable.item2,
                s.acceptable.item3,
                s.acceptable.item4,
                s.acceptable.item5,
              ]}
            />

            <ProseSection meta={sections[5]} title={s.trial.title}>
              <p>{s.trial.body}</p>
            </ProseSection>

            <ProseSection meta={sections[6]} title={s.payment.title}>
              <p>{s.payment.body}</p>
            </ProseSection>

            <ProseSection meta={sections[7]} title={s.termination.title}>
              <p>{s.termination.body}</p>
            </ProseSection>

            <ProseSection meta={sections[8]} title={s.liability.title}>
              <p>{s.liability.body}</p>
            </ProseSection>

            <ProseSection meta={sections[9]} title={s.law.title}>
              <p>{s.law.body}</p>
            </ProseSection>

            <ProseSection meta={sections[10]} title={s.changes.title}>
              <p>{s.changes.body}</p>
            </ProseSection>

            <ContactCard heading={terms.contactHeading} cta={terms.contactCta} />
          </div>
        </div>
      </div>
    </main>
  );
}

function ContactCard({ heading, cta }: { heading: string; cta: string }) {
  return (
    <div className="rounded-2xl border bg-card p-6 ring-1 ring-black/5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
            <ShieldCheck className="size-5" />
          </span>
          <div>
            <p className="font-semibold">{heading}</p>
            <p className="text-sm text-foreground/75">EasySlip Co., Ltd.</p>
          </div>
        </div>
        <a
          href="mailto:contact@easyslip.com"
          className={buttonVariants({ className: "shrink-0" })}
        >
          {cta}
        </a>
      </div>
    </div>
  );
}
