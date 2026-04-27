"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { OnboardingTemplateList } from "@/components/hr/onboarding-template-list";
import { OnboardingProgressTable } from "@/components/hr/onboarding-progress-table";

const tabs = [
  { key: "progress", label: "Progress" },
  { key: "templates", label: "Templates" },
] as const;

export default function HROnboardingPage() {
  const [active, setActive] = useState<"progress" | "templates">("progress");

  return (
    <div className="flex flex-col gap-5">
      <div className="flex gap-1 rounded-lg border border-border bg-[var(--es-neutral-50)] p-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActive(t.key)}
            className={cn(
              "rounded-md px-4 py-1.5 text-sm font-medium transition-colors",
              active === t.key ? "bg-card shadow-sm" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {active === "progress" && <OnboardingProgressTable />}
      {active === "templates" && <OnboardingTemplateList />}
    </div>
  );
}
