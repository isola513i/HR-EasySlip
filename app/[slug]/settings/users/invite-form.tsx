"use client";

import { useT } from "@/lib/i18n/locale-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormRoot, FormField, FormFieldError } from "@/components/ui/form-field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { inviteUser } from "./actions";

const INVITE_ROLES = [
  "EMPLOYEE",
  "MANAGER",
  "TENANT_ADMIN",
  "HR_AUTHORIZED",
  "HRMG",
] as const;

interface Props {
  action: (payload: FormData) => void;
  pending: boolean;
  state: Awaited<ReturnType<typeof inviteUser>> | null;
  onClose: () => void;
}

export function InviteForm({ action, pending, state, onClose }: Props) {
  const t = useT();
  const tu = t.tenantSettings.users;

  const isSuccess = state && "success" in state;
  const tempPassword = isSuccess
    ? (state as { success: true; tempPassword: string }).tempPassword
    : null;

  if (isSuccess && tempPassword) {
    return (
      <div className="space-y-4">
        <p className="text-sm font-medium text-green-700">{tu.inviteSuccess}</p>
        <div className="rounded-md bg-green-50 p-3">
          <p className="mb-1 text-xs text-muted-foreground">
            {tu.tempPasswordLabel}
          </p>
          <code className="break-all font-mono text-sm font-semibold">
            {tempPassword}
          </code>
        </div>
        <Button onClick={onClose} className="w-full">
          {t.common.close}
        </Button>
      </div>
    );
  }

  return (
    <FormRoot action={action} className="space-y-4">
      <FormField name="email" className="space-y-1">
        <Label htmlFor="invite-email">{tu.inviteEmail}</Label>
        <Input id="invite-email" name="email" type="email" required />
        <FormFieldError inputType="email" />
      </FormField>
      <FormField name="firstNameTh" className="space-y-1">
        <Label htmlFor="invite-first">{tu.inviteFirstName}</Label>
        <Input id="invite-first" name="firstNameTh" required />
        <FormFieldError />
      </FormField>
      <FormField name="lastNameTh" className="space-y-1">
        <Label htmlFor="invite-last">{tu.inviteLastName}</Label>
        <Input id="invite-last" name="lastNameTh" required />
        <FormFieldError />
      </FormField>
      <div className="space-y-1">
        <Label htmlFor="invite-role">{tu.inviteRole}</Label>
        <Select name="role" defaultValue="EMPLOYEE">
          <SelectTrigger id="invite-role">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {INVITE_ROLES.map((r) => (
              <SelectItem key={r} value={r}>
                {r}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {state && "error" in state && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? t.common.saving : tu.inviteSubmit}
      </Button>
    </FormRoot>
  );
}
