"use client";

import { useActionState, useState } from "react";
import { useT } from "@/lib/i18n/locale-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { inviteUser, toggleUserStatus } from "./actions";
import { InviteForm } from "./invite-form";
import type { UserRow } from "./page";

interface Props {
  users: UserRow[];
  currentUserId: string;
}

export function UserList({ users, currentUserId }: Props) {
  const t = useT();
  const tu = t.tenantSettings.users;
  const [open, setOpen] = useState(false);
  const [inviteState, inviteAction, invitePending] = useActionState(
    inviteUser,
    null,
  );

  const isSuccess = inviteState && "success" in inviteState;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <Button size="sm" onClick={() => setOpen(true)}>
          {tu.invite}
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{tu.inviteTitle}</DialogTitle>
          </DialogHeader>
          <InviteForm
            action={inviteAction}
            pending={invitePending}
            state={inviteState}
            onClose={() => setOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <div className="rounded-lg border">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/40">
            <tr>
              <th className="px-4 py-3 text-left font-medium">{tu.name}</th>
              <th className="px-4 py-3 text-left font-medium">{tu.email}</th>
              <th className="px-4 py-3 text-left font-medium">{tu.role}</th>
              <th className="px-4 py-3 text-left font-medium">{tu.status}</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y">
            {users.map((u) => (
              <UserTableRow
                key={u.id}
                user={u}
                currentUserId={currentUserId}
                tu={tu}
              />
            ))}
          </tbody>
        </table>
      </div>

      {isSuccess && (
        <p className="text-sm text-green-700">{tu.inviteSuccess}</p>
      )}
    </div>
  );
}

function UserTableRow({
  user,
  currentUserId,
  tu,
}: {
  user: UserRow;
  currentUserId: string;
  tu: ReturnType<typeof useT>["tenantSettings"]["users"];
}) {
  const t = useT();
  const [state, action, pending] = useActionState(toggleUserStatus, null);
  const isSelf = user.id === currentUserId;
  const name = user.employee
    ? `${user.employee.firstNameTh} ${user.employee.lastNameTh}`
    : user.email;

  return (
    <tr className="hover:bg-muted/30">
      <td className="px-4 py-3">
        {name}
        {isSelf && (
          <span className="ml-1 text-xs text-muted-foreground">{tu.you}</span>
        )}
      </td>
      <td className="px-4 py-3 text-muted-foreground">{user.email}</td>
      <td className="px-4 py-3">
        <div className="flex flex-wrap gap-1">
          {user.employee?.roles.map((r) => (
            <Badge key={r} variant="outline" className="text-xs">
              {r}
            </Badge>
          ))}
        </div>
      </td>
      <td className="px-4 py-3">
        <Badge
          variant={user.isDisabled ? "secondary" : "default"}
          className="text-xs"
        >
          {user.isDisabled ? tu.disabled : tu.active}
        </Badge>
      </td>
      <td className="px-4 py-3 text-right">
        {!isSelf && (
          <form action={action}>
            <input type="hidden" name="userId" value={user.id} />
            <Button type="submit" size="sm" variant="ghost" disabled={pending}>
              {user.isDisabled ? tu.enable : tu.disable}
            </Button>
          </form>
        )}
        {state && "error" in state && (
          <p className="text-xs text-destructive">{state.error}</p>
        )}
      </td>
    </tr>
  );
}
