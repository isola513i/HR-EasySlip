"use client";

import { useActionState, useState } from "react";
import { suspendTenant, reactivateTenant } from "./actions";
import { buttonVariants } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ShieldAlert, UserCheck, AlertTriangle } from "lucide-react";

interface Props {
  tenantId: string;
  companyName: string;
  status: string;
}

export function DangerZone({ tenantId, companyName, status }: Props) {
  const canSuspend = ["ACTIVE", "TRIAL", "TRIAL_EXPIRED"].includes(status);
  const canReactivate = status === "SUSPENDED";

  const suspendAction = suspendTenant.bind(null, tenantId);
  const reactivateAction = reactivateTenant.bind(null, tenantId);

  const [suspendState, suspendDispatch, suspendPending] = useActionState(suspendAction, null);
  const [reactivateState, reactivateDispatch, reactivatePending] = useActionState(reactivateAction, null);

  const [suspendReason, setSuspendReason] = useState("");
  const [reactivateReason, setReactivateReason] = useState("");

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-rose-400 mb-2">
        <AlertTriangle className="size-4 shrink-0" />
        <span className="text-sm font-medium">Danger zone</span>
      </div>

      <div className="rounded-xl border border-border divide-y divide-border overflow-hidden">
        <div className="flex items-start justify-between gap-4 p-5">
          <div className="flex items-start gap-3">
            <ShieldAlert className="size-4 text-amber-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">Impersonate tenant</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Start a session as a user of <span className="font-medium">{companyName}</span>. This action is fully audited.
              </p>
            </div>
          </div>
          <Link
            href={`/platform/tenants/${tenantId}/impersonate`}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "shrink-0 border-amber-500/30 text-amber-400 hover:bg-amber-500/10 hover:text-amber-300")}
          >
            Impersonate
          </Link>
        </div>

        {canSuspend && (
          <div className="flex items-start justify-between gap-4 p-5">
            <div>
              <p className="text-sm font-medium text-foreground">Suspend tenant</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Prevents all users of <span className="font-medium">{companyName}</span> from accessing the system.
              </p>
              {suspendState?.error && (
                <p className="text-xs text-rose-400 mt-1">{suspendState.error}</p>
              )}
            </div>
            <AlertDialog>
              <AlertDialogTrigger className={cn(buttonVariants({ variant: "outline", size: "sm" }), "shrink-0 border-rose-500/30 text-rose-400 hover:bg-rose-500/10 hover:text-rose-300")}>
                Suspend
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Suspend {companyName}?</AlertDialogTitle>
                  <AlertDialogDescription>
                    All users will lose access immediately. You can reactivate the tenant at any time.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <form action={suspendDispatch} id="suspend-form" className="mt-2 space-y-3">
                  <input type="hidden" name="reason" value={suspendReason} />
                  <div>
                    <Label htmlFor="suspend-reason" className="text-sm">Reason (required)</Label>
                    <Textarea
                      id="suspend-reason"
                      value={suspendReason}
                      onChange={(e) => setSuspendReason(e.target.value)}
                      placeholder="Describe why you are suspending this tenant..."
                      className="mt-1.5 text-sm"
                      rows={3}
                    />
                  </div>
                </form>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    form="suspend-form"
                    type="submit"
                    disabled={suspendPending || !suspendReason.trim()}
                    className="bg-rose-600 hover:bg-rose-700 text-white"
                  >
                    {suspendPending ? "Suspending…" : "Confirm suspend"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}

        {canReactivate && (
          <div className="flex items-start justify-between gap-4 p-5">
            <div className="flex items-start gap-3">
              <UserCheck className="size-4 text-emerald-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">Reactivate tenant</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Restore access for <span className="font-medium">{companyName}</span>.
                </p>
                {reactivateState?.error && (
                  <p className="text-xs text-rose-400 mt-1">{reactivateState.error}</p>
                )}
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
                    All users will regain access immediately.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <form action={reactivateDispatch} id="reactivate-form" className="mt-2 space-y-3">
                  <input type="hidden" name="reason" value={reactivateReason} />
                  <div>
                    <Label htmlFor="reactivate-reason" className="text-sm">Reason (required)</Label>
                    <Textarea
                      id="reactivate-reason"
                      value={reactivateReason}
                      onChange={(e) => setReactivateReason(e.target.value)}
                      placeholder="Describe why you are reactivating this tenant..."
                      className="mt-1.5 text-sm"
                      rows={2}
                    />
                  </div>
                </form>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    form="reactivate-form"
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
    </div>
  );
}
