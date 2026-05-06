"use client";

import { ReadField } from "@/components/employee/me/read-field";
import { type Profile } from "@/hooks/use-profile";
import { useT } from "@/lib/i18n/locale-context";

interface JobInfoSectionProps {
  profile: Profile;
}

export function JobInfoSection({ profile }: JobInfoSectionProps) {
  const t = useT();
  const statusLabel =
    (t.profile.employmentStatus as Record<string, string>)[profile.employmentStatus] ??
    profile.employmentStatus;

  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-3">
      <ReadField label={t.profile.employeeCode} value={profile.employeeCode} />
      <ReadField label={t.profile.status} value={statusLabel} />
      <div className="col-span-2">
        <ReadField label={t.profile.department} value={profile.department?.name} />
      </div>
      <div className="col-span-2">
        <ReadField label={t.profile.position} value={profile.position?.name} />
      </div>
    </div>
  );
}
