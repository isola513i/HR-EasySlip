"use client";

import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { buttonVariants } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

interface TenantRow {
  id: string;
  status: string;
}

export function TenantActionsMenu({ tenant }: { tenant: TenantRow }) {
  const router = useRouter();
  const canSuspend = ["ACTIVE", "TRIAL", "TRIAL_EXPIRED"].includes(tenant.status);
  const canReactivate = tenant.status === "SUSPENDED";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "size-7 text-muted-foreground hover:text-foreground")}>
        <MoreHorizontal className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem onClick={() => router.push(`/tenants/${tenant.id}`)}>
          View details
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push(`/tenants/${tenant.id}/impersonate`)}>
          Impersonate
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push(`/tenants/${tenant.id}?tab=overview#plan`)}>
          Change plan
        </DropdownMenuItem>
        {canSuspend && (
          <DropdownMenuItem
            variant="destructive"
            onClick={() => router.push(`/tenants/${tenant.id}?tab=danger`)}
          >
            Suspend
          </DropdownMenuItem>
        )}
        {canReactivate && (
          <DropdownMenuItem onClick={() => router.push(`/tenants/${tenant.id}?tab=danger`)}>
            Reactivate
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
