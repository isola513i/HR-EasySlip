"use client";

import { useActionState } from "react";
import { updateTenantStatus } from "./actions";
import { TENANT_STATUS_TRANSITIONS } from "@/lib/security/tenant-transitions";
import { Button } from "@/components/ui/button";

interface Props {
  tenantId: string;
  currentStatus: string;
}

export function TenantStatusActions({ tenantId, currentStatus }: Props) {
  const action = updateTenantStatus.bind(null, tenantId);
  const [state, dispatch, pending] = useActionState(action, null);
  type Opt = { label: string; variant: "default" | "destructive" | "outline"; nextStatus: string };
  const key = currentStatus as keyof typeof TENANT_STATUS_TRANSITIONS;
  const options: Opt[] = key in TENANT_STATUS_TRANSITIONS ? [...TENANT_STATUS_TRANSITIONS[key]] : [];

  if (options.length === 0) {
    return <p className="text-muted-foreground text-sm">No status transitions available.</p>;
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">Change status:</p>
      {state?.error && <p className="text-sm text-rose-400">{state.error}</p>}
      <div className="flex flex-wrap gap-2">
        {options.map(({ label, variant, nextStatus }) => (
          <form key={nextStatus} action={dispatch}>
            <input type="hidden" name="status" value={nextStatus} />
            <Button type="submit" variant={variant} size="sm" disabled={pending}>
              {label}
            </Button>
          </form>
        ))}
      </div>
    </div>
  );
}
