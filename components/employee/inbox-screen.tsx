"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Bell,
  Check,
  Clock,
  FileText,
  ShieldCheck,
  Shield,
  AlertTriangle,
  User,
  KeyRound,
  type LucideIcon,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { apiFetchPaginated, ApiClientError } from "@/lib/api/client";
import { markEmployeeInboxRead } from "@/hooks/use-employee-inbox-unread";
import { formatRelativeTime } from "@/lib/format";
import { getActionLabel } from "@/lib/audit/action-labels";
import { getEntityLabel } from "@/lib/audit/entity-labels";
import { useT } from "@/lib/i18n/locale-context";
import { useLocale } from "@/hooks/use-locale";
import type { Locale } from "@/lib/i18n/config";

interface AuditLogEntry {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
  actor?: { id: string; email: string };
}

type Tone = "info" | "success" | "warn" | "neutral";

interface Notification {
  tone: Tone;
  Icon: LucideIcon;
  title: string;
  sub: string;
  time: string;
}

const ACTION_MAP: Record<string, { tone: Tone; Icon: LucideIcon }> = {
  "leave.submit": { tone: "info", Icon: FileText },
  "leave.approve": { tone: "success", Icon: Check },
  "leave.reject": { tone: "warn", Icon: AlertTriangle },
  "leave.withdraw": { tone: "neutral", Icon: Bell },
  "attendance.clock_in": { tone: "success", Icon: Clock },
  "attendance.clock_in.out_of_geofence": { tone: "warn", Icon: Clock },
  "attendance.clock_out": { tone: "info", Icon: Clock },
  "attendance.clock_out.out_of_geofence": { tone: "warn", Icon: Clock },
  "overtime.submit": { tone: "info", Icon: FileText },
  "consent.grant": { tone: "neutral", Icon: ShieldCheck },
  "consent.withdraw": { tone: "neutral", Icon: Shield },
  "auth.signin": { tone: "neutral", Icon: User },
  "auth.signout": { tone: "neutral", Icon: User },
  "auth.blocked": { tone: "neutral", Icon: Bell },
  "employee.profile_updated": { tone: "neutral", Icon: User },
  "user.change_password": { tone: "neutral", Icon: KeyRound },
  "user.reset_password": { tone: "neutral", Icon: KeyRound },
  "user.reset_password_self": { tone: "neutral", Icon: KeyRound },
};

const TONE_CLASSES: Record<Tone, { bg: string; fg: string }> = {
  info: { bg: "bg-[var(--es-accent-50)]", fg: "text-[var(--es-accent-600)]" },
  success: { bg: "bg-[var(--es-success-50)]", fg: "text-[var(--es-success-600)]" },
  warn: { bg: "bg-[var(--es-warn-50)]", fg: "text-[var(--es-warn-600)]" },
  neutral: { bg: "bg-[var(--es-neutral-100)]", fg: "text-[var(--es-neutral-600)]" },
};

function mapAuditToNotification(entry: AuditLogEntry, locale: Locale): Notification {
  const m = ACTION_MAP[entry.action] ?? { tone: "neutral" as const, Icon: Bell };
  const title = getActionLabel(entry.action, locale);
  const sub = getEntityLabel(entry.entityType, locale);
  const time = formatRelativeTime(entry.createdAt);
  return { tone: m.tone, Icon: m.Icon, title, sub, time };
}

export function InboxScreen() {
  const t = useT();
  const { locale } = useLocale();
  const [entries, setEntries] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await apiFetchPaginated<AuditLogEntry>(
          "/api/v1/employee/me/activity?perPage=10",
        );
        if (!cancelled) {
          setEntries(data);
          markEmployeeInboxRead();
        }
      } catch (err) {
        if (err instanceof ApiClientError && err.status === 403) {
          if (!cancelled) setEntries([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const notifications = useMemo(
    () => entries.map((e) => mapAuditToNotification(e, locale)),
    [entries, locale],
  );

  return (
    <>
      <header className="flex h-14 items-center border-b border-[var(--es-neutral-100)] px-4">
        <span className="text-base font-semibold">{t.employee.inbox}</span>
      </header>

      <div className="flex flex-col gap-3 p-4">
        {loading && <InboxSkeleton />}
        {!loading && notifications.length === 0 && <InboxEmpty />}
        {!loading &&
          notifications.map((n, i) => {
            const tc = TONE_CLASSES[n.tone];
            return (
              <article
                key={i}
                className="flex items-start gap-4 rounded-2xl border border-border bg-card p-4"
              >
                <div className={`grid size-10 shrink-0 place-items-center rounded-full ${tc.bg} ${tc.fg}`}>
                  <n.Icon className="size-5" strokeWidth={2} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-base font-bold leading-tight text-foreground">{n.title}</div>
                  <div className="mt-1 truncate text-sm text-muted-foreground">{n.sub}</div>
                  <div className="mt-1 text-xs text-muted-foreground/80">{n.time}</div>
                </div>
              </article>
            );
          })}
      </div>
    </>
  );
}

function InboxSkeleton() {
  return (
    <>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-start gap-4 rounded-2xl border border-border bg-card p-4">
          <Skeleton className="size-10 shrink-0 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-56" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
      ))}
    </>
  );
}

function InboxEmpty() {
  const t = useT();
  return (
    <div className="flex flex-col items-center gap-2 py-16 text-muted-foreground">
      <Bell className="size-10 opacity-40" strokeWidth={1.5} />
      <span className="text-sm">{t.employee.noNotifications}</span>
    </div>
  );
}
