"use client";

import { useActionState, useState } from "react";
import { updateTenantPlan } from "./actions";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
interface PlanOption {
  code: string;
  name: string;
}

interface Props {
  tenantId: string;
  currentPlan: string | null;
  plans: PlanOption[];
}

export function ChangePlanForm({ tenantId, currentPlan, plans }: Props) {
  const action = updateTenantPlan.bind(null, tenantId);
  const [state, dispatch, pending] = useActionState(action, null);
  const [planVal, setPlanVal] = useState(currentPlan ?? "none");

  return (
    <form action={dispatch} className="flex items-center gap-2">
      <Select name="planCode" value={planVal} onValueChange={(v) => setPlanVal(v ?? "none")}>
        <SelectTrigger className="h-8 w-[140px] text-sm bg-card border-border">
          <SelectValue placeholder="No plan" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">No plan</SelectItem>
          {plans.map((p) => (
            <SelectItem key={p.code} value={p.code}>{p.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button type="submit" size="sm" variant="outline" disabled={pending} className="h-8">
        {pending ? "Saving…" : "Save"}
      </Button>
      {state?.error && (
        <p className="text-xs text-rose-400">{state.error}</p>
      )}
    </form>
  );
}
