"use client";

import { useActionState, useState } from "react";
import { expireTenant, reactivateTenant } from "./actions";
import { buttonVariants } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { Clock, RotateCcw } from "lucide-react";

interface Props {
  tenantId: string;
  companyName: string;
  status: string;
  gracePeriodEndsAt: string | null;
  hardDeleteAt: string | null;
  softDeletedAt: string | null;
}

export function ExpireZone({ tenantId, companyName, status, gracePeriodEndsAt, hardDeleteAt, softDeletedAt }: Props) {
  const canExpire = ["ACTIVE", "TRIAL", "TRIAL_EXPIRED"].includes(status);
  const canReactivate = ["SUSPENDED", "EXPIRED"].includes(status) && !softDeletedAt;

  const expireAction = expireTenant.bind(null, tenantId);
  const reactivateAction = reactivateTenant.bind(null, tenantId);

  const [expireState, expireDispatch, expirePending] = useActionState(expireAction, null);
  const [reactivateState, reactivateDispatch, reactivatePending] = useActionState(reactivateAction, null);
  const [expireReason, setExpireReason] = useState("");
  const [reactivateReason, setReactivateReason] = useState("");

  const fmt = (d: string | null) => d ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—";

  return (
    <div className="rounded-xl border border-amber-500/20 divide-y divide-border overflow-hidden">
      {status === "EXPIRED" && (
        <div className="p-5 bg-amber-500/5">
          <p className="text-xs font-medium text-amber-400 mb-2">Data lifecycle timeline</p>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-muted-foreground">Grace ends</span>
              <p className="font-mono text-foreground">{fmt(gracePeriodEndsAt)}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Hard delete</span>
              <p className="font-mono text-foreground">{fmt(hardDeleteAt)}</p>
            </div>
          </div>
        </div>
      )}

      {canExpire && (
        <div className="flex items-start justify-between gap-4 p-5">
          <div className="flex items-start gap-3">
            <Clock className="size-4 text-amber-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">Expire tenant</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Starts 30-day grace → 90-day soft-delete → 180-day hard-delete. Tenant can export data during grace.
              </p>
              {expireState?.error && <p className="text-xs text-rose-400 mt-1">{expireState.error}</p>}
            </div>
          </div>
          <AlertDialog>
            <AlertDialogTrigger className={cn(buttonVariants({ variant: "outline", size: "sm" }), "shrink-0 border-amber-500/30 text-amber-400 hover:bg-amber-500/10 hover:text-amber-300")}>
              Expire
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Expire {companyName}?</AlertDialogTitle>
                <AlertDialogDescription>
                  This starts the PDPA data lifecycle: 30-day grace (read-only) → 90-day soft-delete (PII anonymised) → 180-day hard-delete. The tenant can export their data during the grace period.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <form action={expireDispatch} id="expire-form" className="mt-2 space-y-3">
                <input type="hidden" name="reason" value={expireReason} />
                <div>
                  <Label htmlFor="expire-reason" className="text-sm">Reason (required)</Label>
                  <Textarea
                    id="expire-reason"
                    value={expireReason}
                    onChange={(e) => setExpireReason(e.target.value)}
                    placeholder="e.g. Subscription not renewed after 2026-06-01"
                    className="mt-1.5 text-sm"
                    rows={2}
                  />
                </div>
              </form>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  form="expire-form"
                  type="submit"
                  disabled={expirePending || !expireReason.trim()}
                  className="bg-amber-600 hover:bg-amber-700 text-white"
                >
                  {expirePending ? "Expiring…" : "Confirm expire"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}

      {canReactivate && (
        <div className="flex items-start justify-between gap-4 p-5">
          <div className="flex items-start gap-3">
            <RotateCcw className="size-4 text-emerald-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">Reactivate tenant</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Restore access and clear the lifecycle schedule.
              </p>
              {reactivateState?.error && <p className="text-xs text-rose-400 mt-1">{reactivateState.error}</p>}
            </div>
          </div>
          <AlertDialog>
            <AlertDialogTrigger className={cn(buttonVariants({ variant: "outline", size: "sm" }), "shrink-0 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10")}>
              Reactivate
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Reactivate {companyName}?</AlertDialogTitle>
                <AlertDialogDescription>
                  Access will be restored immediately and the lifecycle schedule will be cleared.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <form action={reactivateDispatch} id="reactivate-exp-form" className="mt-2 space-y-3">
                <input type="hidden" name="reason" value={reactivateReason} />
                <div>
                  <Label htmlFor="reactivate-reason-exp" className="text-sm">Reason (required)</Label>
                  <Textarea
                    id="reactivate-reason-exp"
                    value={reactivateReason}
                    onChange={(e) => setReactivateReason(e.target.value)}
                    placeholder="e.g. Subscription renewed"
                    className="mt-1.5 text-sm"
                    rows={2}
                  />
                </div>
              </form>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  form="reactivate-exp-form"
                  type="submit"
                  disabled={reactivatePending || !reactivateReason.trim()}
                >
                  {reactivatePending ? "Reactivating…" : "Confirm reactivate"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}
    </div>
  );
}
