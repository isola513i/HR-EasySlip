"use client";

import { useActionState } from "react";
import { useT } from "@/lib/i18n/locale-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { saveCompanySettings } from "./actions";

const TIMEZONES = [
  "Asia/Bangkok",
  "Asia/Kuala_Lumpur",
  "UTC",
  "Asia/Singapore",
  "Asia/Tokyo",
] as const;

interface Props {
  companyName: string;
  timezone: string;
}

export function CompanyForm({ companyName, timezone }: Props) {
  const t = useT();
  const ts = t.tenantSettings.company;
  const [state, action, isPending] = useActionState(saveCompanySettings, null);

  return (
    <form action={action} className="space-y-6 max-w-md">
      <div className="space-y-2">
        <Label htmlFor="companyName">{ts.companyName}</Label>
        <Input
          id="companyName"
          name="companyName"
          defaultValue={companyName}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="timezone">{ts.timezone}</Label>
        <Select name="timezone" defaultValue={timezone || "Asia/Bangkok"}>
          <SelectTrigger id="timezone">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TIMEZONES.map((tz) => (
              <SelectItem key={tz} value={tz}>
                {tz}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {"error" in (state ?? {}) && (
        <p className="text-sm text-destructive">
          {(state as { error: string }).error ?? ts.errorSave}
        </p>
      )}
      {"success" in (state ?? {}) && (
        <p className="text-sm text-green-600">{ts.saved}</p>
      )}

      <Button type="submit" disabled={isPending}>
        {isPending ? t.common.saving : ts.save}
      </Button>
    </form>
  );
}
