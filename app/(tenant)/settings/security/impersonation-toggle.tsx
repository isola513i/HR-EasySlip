"use client";

import { useState, useTransition } from "react";
import { Shield, ShieldOff, ShieldCheck } from "lucide-react";
import { useT } from "@/lib/i18n/locale-context";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
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
import { toast } from "sonner";
import { setImpersonationEnabled } from "./actions";

interface Props {
  enabled: boolean;
  disabledAt: string | null;
  disabledByEmail: string | null;
}

export function ImpersonationToggle({ enabled: initialEnabled, disabledAt, disabledByEmail }: Props) {
  const dict = useT();
  const t = dict.tenantSettings.security.impersonation;
  const [enabled, setEnabled] = useState(initialEnabled);
  const [isPending, startTransition] = useTransition();

  function handleToggle() {
    startTransition(async () => {
      const result = await setImpersonationEnabled(!enabled);
      if ("error" in result) {
        toast.error(t.toggleError);
      } else {
        setEnabled((prev) => !prev);
        toast.success(t.toggleSuccess);
      }
    });
  }

  const disabledDate = disabledAt
    ? new Date(disabledAt).toLocaleDateString("th-TH", { dateStyle: "medium" })
    : null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4 rounded-lg border border-border p-4">
        <div className="flex items-center gap-3">
          {enabled ? (
            <ShieldCheck className="size-5 text-emerald-500 shrink-0" />
          ) : (
            <ShieldOff className="size-5 text-muted-foreground shrink-0" />
          )}
          <div>
            <p className="text-sm font-medium">
              {enabled ? t.enabledLabel : t.disabledLabel}
            </p>
            {!enabled && disabledDate && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {t.disabledSince} {disabledDate}
                {disabledByEmail ? ` · ${t.disabledBy} ${disabledByEmail}` : ""}
              </p>
            )}
          </div>
        </div>

        <AlertDialog>
          <AlertDialogTrigger
            disabled={isPending}
            className={cn(
              "shrink-0",
              enabled
                ? buttonVariants({ variant: "destructive", size: "sm" })
                : buttonVariants({ variant: "outline", size: "sm" }),
            )}
          >
            {enabled ? (
              <>
                <ShieldOff className="size-3.5 mr-1.5" />
                {t.toggleDisable}
              </>
            ) : (
              <>
                <Shield className="size-3.5 mr-1.5" />
                {t.toggleEnable}
              </>
            )}
          </AlertDialogTrigger>

          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {enabled ? t.confirmDisableTitle : t.confirmEnableTitle}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {enabled ? t.confirmDisableBody : t.confirmEnableBody}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isPending}>
                {dict.common.cancel}
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleToggle}
                disabled={isPending}
                variant={enabled ? "destructive" : "default"}
              >
                {enabled ? t.confirmDisable : t.confirmEnable}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
