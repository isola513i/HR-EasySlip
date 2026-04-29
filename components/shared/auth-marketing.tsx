import { CheckCircle2, TrendingUp } from "lucide-react";
import { LocaleSwitcher } from "@/components/shared/locale-switcher";
import { getDict } from "@/lib/i18n/get-dict";
import type { Dictionary } from "@/lib/i18n/dictionaries";

type Showcase = Dictionary["signin"]["showcase"];

interface Props {
  heading: string;
  tagline: string;
}

export async function AuthMarketing({ heading, tagline }: Props) {
  const { t } = await getDict();
  const s = t.signin.showcase;

  return (
    <aside className="es-brand-gradient relative hidden overflow-hidden lg:flex lg:w-[55%] lg:flex-col lg:items-center lg:justify-center lg:px-14 lg:py-14">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 80% 20%, rgba(255,255,255,0.10), transparent 55%)",
        }}
      />

      <div className="absolute right-8 top-8 z-10 text-white">
        <LocaleSwitcher />
      </div>

      <div className="relative flex w-full max-w-xl flex-col items-center gap-12 text-white">
        <div className="space-y-4 text-center">
          <h2 className="text-4xl font-bold leading-tight tracking-tight">
            {heading}
          </h2>
          <p className="mx-auto max-w-md text-base leading-relaxed text-white/80">
            {tagline}
          </p>
        </div>
        <DashboardShowcase s={s} />
      </div>
    </aside>
  );
}

function DashboardShowcase({ s }: { s: Showcase }) {
  return (
    <div aria-hidden className="relative w-full">
      <div className="pointer-events-none absolute -inset-8 rounded-[40px] bg-white/5 blur-2xl" />
      <MainCard s={s} />
      <DonutCard s={s} />
      <ActivityCard s={s} />
      <MetricCallout s={s} />
    </div>
  );
}

function MainCard({ s }: { s: Showcase }) {
  return (
    <div className="relative rounded-2xl bg-white p-5 shadow-[0_30px_60px_-15px_rgba(15,23,42,0.45)] ring-1 ring-black/5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
            {s.analyticsLabel}
          </p>
          <h3 className="mt-0.5 text-sm font-semibold text-slate-900">
            {s.analyticsRange}
          </h3>
        </div>
        <div className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-600">
          <TrendingUp className="size-3" />
          {s.trendValue}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <Metric label={s.metricEmployees} value="48" />
        <Metric label={s.metricActive} value="42" />
        <Metric label={s.metricOnLeave} value="3" />
      </div>

      <div className="mt-4 rounded-xl bg-slate-50/80 p-3 ring-1 ring-slate-100">
        <LineChart />
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-50 px-3 py-2 ring-1 ring-slate-100">
      <p className="text-[10px] uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-0.5 text-base font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function LineChart() {
  return (
    <svg viewBox="0 0 200 70" className="h-20 w-full">
      <defs>
        <linearGradient id="line-area" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d="M0,55 C25,42 45,50 70,32 C95,14 120,25 150,18 L200,12 L200,70 L0,70 Z"
        fill="url(#line-area)"
      />
      <path
        d="M0,55 C25,42 45,50 70,32 C95,14 120,25 150,18 L200,12"
        stroke="#3b82f6"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}

function DonutCard({ s }: { s: Showcase }) {
  const segments = [
    { color: "bg-blue-600", label: s.departmentEngineering },
    { color: "bg-blue-400", label: s.departmentSales },
    { color: "bg-blue-300", label: s.departmentDesign },
  ];
  return (
    <div className="absolute -right-6 -top-8 w-44 rounded-2xl bg-white p-3 shadow-[0_20px_40px_-10px_rgba(15,23,42,0.4)] ring-1 ring-black/5">
      <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
        {s.departmentsLabel}
      </p>
      <div className="mt-2 flex items-center gap-3">
        <div
          className="relative size-14 shrink-0 rounded-full"
          style={{
            background:
              "conic-gradient(#2563eb 0% 45%, #60a5fa 45% 70%, #93c5fd 70% 90%, #e0e7ff 90% 100%)",
          }}
        >
          <div className="absolute inset-[6px] rounded-full bg-white" />
        </div>
        <div className="flex-1 space-y-1 text-[10px]">
          {segments.map((seg) => (
            <div key={seg.label} className="flex items-center gap-1.5">
              <span className={`size-1.5 rounded-full ${seg.color}`} />
              <span className="text-slate-700">{seg.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ActivityCard({ s }: { s: Showcase }) {
  const rows = [
    { name: s.activity1Name, role: s.activity1Role, color: "bg-emerald-500" },
    { name: s.activity2Name, role: s.activity2Role, color: "bg-amber-500" },
  ];
  return (
    <div className="absolute -bottom-8 -left-6 w-60 rounded-2xl bg-white p-3 shadow-[0_20px_40px_-10px_rgba(15,23,42,0.4)] ring-1 ring-black/5">
      <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
        {s.activityLabel}
      </p>
      <div className="mt-2 space-y-2">
        {rows.map((r) => (
          <div key={r.name} className="flex items-center gap-2.5">
            <span className="size-7 shrink-0 rounded-full bg-gradient-to-br from-slate-100 to-slate-200" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[11px] font-semibold text-slate-900">
                {r.name}
              </p>
              <p className="text-[10px] text-slate-500">{r.role}</p>
            </div>
            <span className={`size-1.5 rounded-full ${r.color}`} />
          </div>
        ))}
      </div>
    </div>
  );
}

function MetricCallout({ s }: { s: Showcase }) {
  return (
    <div className="absolute -bottom-4 -right-6 rounded-2xl bg-white px-4 py-3 shadow-[0_20px_40px_-10px_rgba(15,23,42,0.4)] ring-1 ring-black/5">
      <div className="flex items-center gap-2.5">
        <span className="grid size-9 place-items-center rounded-full bg-emerald-50">
          <CheckCircle2 className="size-4 text-emerald-500" />
        </span>
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
            {s.attendanceLabel}
          </p>
          <p className="text-lg font-bold leading-none text-slate-900">96%</p>
        </div>
      </div>
    </div>
  );
}
