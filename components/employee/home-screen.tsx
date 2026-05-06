"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import { InstallPrompt } from "@/components/shared/install-prompt";
import { useAttendancePolicy } from "@/hooks/use-attendance-policy";
import { HeroClockCard } from "@/components/employee/home/hero-clock-card";
import { QuickActions } from "@/components/employee/home/quick-actions";
import { LeaveQuotaCard } from "@/components/employee/home/leave-quota-card";
import { RecentActivityCard } from "@/components/employee/home/recent-activity-card";
import type { Dictionary } from "@/lib/i18n/dictionaries";

interface Props {
  user: { name: string; code: string; role: string };
  dict: Dictionary;
}

export function EmployeeHome({ user, dict }: Props) {
  const { policy } = useAttendancePolicy();
  const shiftStartLabel = dict.employee.shiftStarts.replace(
    "{time}",
    policy.halfday.morningStart,
  );

  return (
    <>
      <header className="flex items-start justify-between gap-3 px-4 pt-5 pb-3">
        <div className="min-w-0">
          <div className="truncate text-lg font-bold leading-tight text-foreground">
            {dict.common.greeting} {user.name || "User"}
          </div>
          <div className="mt-0.5 text-[11px] text-muted-foreground">
            {process.env.NEXT_PUBLIC_APP_NAME ?? "EasySlip"} · {user.code} · {user.role}
          </div>
        </div>
        <Link
          href="/employee/inbox"
          className="grid size-11 place-items-center rounded-full text-foreground transition-colors hover:bg-muted"
          aria-label={dict.common.notifications}
        >
          <Bell className="size-[20px]" strokeWidth={1.75} />
        </Link>
      </header>

      <div className="flex flex-col gap-4 px-4 pb-4">
        <InstallPrompt />
        <HeroClockCard dict={dict} shiftStartLabel={shiftStartLabel} />
        <QuickActions dict={dict} />
        <LeaveQuotaCard dict={dict} />
        <RecentActivityCard dict={dict} />
      </div>
    </>
  );
}
