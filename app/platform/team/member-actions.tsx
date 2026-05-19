"use client";

import { useActionState, useState } from "react";
import { changePlatformUserRole, togglePlatformUserDisabled, removePlatformUser } from "./actions";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { MoreHorizontal, ShieldCheck, UserX, UserCheck, Trash2 } from "lucide-react";

const ROLES = [
  { value: "SUPER_ADMIN", label: "Super Admin" },
  { value: "SUPPORT", label: "Support" },
  { value: "BILLING", label: "Billing" },
] as const;

interface Props {
  userId: string;
  currentRole: string;
  isDisabled: boolean;
}

export function MemberActions({ userId, currentRole, isDisabled }: Props) {
  const [, dispatchRole, rolePending] = useActionState(
    changePlatformUserRole.bind(null, userId),
    null
  );
  const [, dispatchToggle, togglePending] = useActionState(
    togglePlatformUserDisabled.bind(null, userId),
    null
  );
  const [, dispatchRemove] = useActionState(
    removePlatformUser.bind(null, userId),
    null
  );
  const [confirmOpen, setConfirmOpen] = useState(false);

  const busy = rolePending || togglePending;

  return (
    <>
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove team member?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete their platform access. They will not be able to sign in.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-rose-500 hover:bg-rose-600 text-white"
              onClick={() => dispatchRemove(new FormData())}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <DropdownMenu>
        <DropdownMenuTrigger
          disabled={busy}
          className="inline-flex items-center justify-center size-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors disabled:opacity-50"
        >
          <MoreHorizontal className="size-4" />
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="gap-2">
              <ShieldCheck className="size-3.5" />
              Change role
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              {ROLES.map((r) => (
                <DropdownMenuItem
                  key={r.value}
                  className={currentRole === r.value ? "font-medium text-primary" : ""}
                  onClick={() => {
                    const fd = new FormData();
                    fd.set("role", r.value);
                    dispatchRole(fd);
                  }}
                >
                  {r.label}
                  {currentRole === r.value && " ✓"}
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>

          <DropdownMenuItem
            className="gap-2"
            onClick={() => dispatchToggle(new FormData())}
          >
            {isDisabled ? (
              <><UserCheck className="size-3.5" /> Enable access</>
            ) : (
              <><UserX className="size-3.5" /> Disable access</>
            )}
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            className="text-rose-400 focus:text-rose-400 focus:bg-rose-500/10 gap-2"
            onClick={() => setConfirmOpen(true)}
          >
            <Trash2 className="size-3.5" />
            Remove
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
