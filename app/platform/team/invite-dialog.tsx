"use client";

import { useActionState, useState } from "react";
import { createPlatformUser } from "./actions";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormRoot, FormField, FormFieldError } from "@/components/ui/form-field";
import { CopyButton } from "@/components/platform/copy-button";
import { UserPlus, CheckCircle2 } from "lucide-react";

export function InviteDialog() {
  const [open, setOpen] = useState(false);
  const [state, dispatch, pending] = useActionState(createPlatformUser, null);
  const created = state && "tempPassword" in state;

  function handleOpenChange(v: boolean) {
    if (!v && created) {
      setOpen(false);
    } else if (!v) {
      setOpen(false);
    } else {
      setOpen(true);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger className={buttonVariants({ size: "sm" })}>
        <UserPlus className="size-4 mr-1.5" /> Invite member
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite team member</DialogTitle>
          <DialogDescription>
            Create a platform staff account. The initial password is shown once.
          </DialogDescription>
        </DialogHeader>

        {created ? (
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-2 text-emerald-400">
              <CheckCircle2 className="size-4 shrink-0" />
              <span className="text-sm font-medium">Member created</span>
            </div>
            <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4 space-y-2">
              <p className="text-xs text-amber-300 font-medium">Initial password (shown once)</p>
              <div className="flex items-center gap-2">
                <code className="font-mono text-sm text-foreground flex-1 select-all">
                  {(state as { tempPassword: string }).tempPassword}
                </code>
                <CopyButton value={(state as { tempPassword: string }).tempPassword} />
              </div>
              <p className="text-xs text-muted-foreground">
                Share this securely. The user will be required to change it on first login.
              </p>
            </div>
            <Button variant="outline" className="w-full" onClick={() => setOpen(false)}>
              Done
            </Button>
          </div>
        ) : (
          <FormRoot action={dispatch} className="space-y-4 pt-2">
            <FormField name="email">
              <Label htmlFor="invite-email">Email address</Label>
              <Input
                id="invite-email"
                name="email"
                type="email"
                placeholder="staff@easyslip.app"
                required
                className="text-sm"
              />
              <FormFieldError inputType="email" />
            </FormField>
            <div className="space-y-2">
              <Label htmlFor="invite-role">Role</Label>
              <Select name="role" defaultValue="SUPPORT">
                <SelectTrigger id="invite-role" className="w-full text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="min-w-[var(--anchor-width)]">
                  <SelectItem value="SUPER_ADMIN">
                    <span className="font-medium">Super Admin</span>
                    <span className="text-muted-foreground text-xs ml-1.5">full access</span>
                  </SelectItem>
                  <SelectItem value="SUPPORT">
                    <span className="font-medium">Support</span>
                    <span className="text-muted-foreground text-xs ml-1.5">trials, impersonation</span>
                  </SelectItem>
                  <SelectItem value="BILLING">
                    <span className="font-medium">Billing</span>
                    <span className="text-muted-foreground text-xs ml-1.5">read-only</span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            {state && "error" in state && (
              <p className="text-sm text-rose-400">{state.error}</p>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={pending}>
                {pending ? "Creating…" : "Create member"}
              </Button>
            </div>
          </FormRoot>
        )}
      </DialogContent>
    </Dialog>
  );
}
