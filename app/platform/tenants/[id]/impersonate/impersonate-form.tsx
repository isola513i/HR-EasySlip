"use client";

import { useActionState, useEffect } from "react";
import { startImpersonation } from "./actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface Props {
  tenantId: string;
  companyName: string;
}

export function ImpersonateForm({ tenantId, companyName }: Props) {
  const action = startImpersonation.bind(null, tenantId);
  const [state, dispatch, pending] = useActionState(action, null);

  useEffect(() => {
    if (state && "redirectUrl" in state) {
      // setTimeout escapes React's transition context to avoid AbortError.
      setTimeout(() => {
        window.location.href = state.redirectUrl;
      }, 0);
    }
  }, [state]);

  return (
    <form action={dispatch} className="space-y-4">
      <div>
        <p className="text-sm text-gray-300 mb-3">
          Target: <span className="font-semibold text-white">{companyName}</span>
        </p>
        <Label htmlFor="reason" className="text-gray-300">
          Reason for impersonation
        </Label>
        <Textarea
          id="reason"
          name="reason"
          placeholder="e.g. Customer reported login issue — investigating session data"
          className="mt-1.5 bg-gray-800 border-gray-700 text-white placeholder-gray-500"
          rows={3}
          required
        />
      </div>
      {state && "error" in state && (
        <p className="text-sm text-red-400">{state.error}</p>
      )}
      <Button
        type="submit"
        disabled={pending}
        className="w-full bg-yellow-600 hover:bg-yellow-500 text-black font-semibold"
      >
        {pending ? "Starting session…" : "Start Impersonation"}
      </Button>
    </form>
  );
}
