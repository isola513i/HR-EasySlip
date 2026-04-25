"use client";

import Link from "next/link";
import { Shield, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useConsentAdmin } from "@/hooks/use-consent-admin";

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function actionBadgeVariant(action: string) {
  if (action.includes("grant")) return "default" as const;
  if (action.includes("withdraw")) return "destructive" as const;
  return "secondary" as const;
}

export function PdpaConsentView() {
  const { events, isLoading, error } = useConsentAdmin();

  return (
    <div className="flex flex-col gap-6">
      {/* Policy info */}
      <Card>
        <CardHeader className="flex flex-row items-center gap-3 pb-2">
          <Shield className="size-5 text-[var(--es-accent-600)]" />
          <CardTitle className="text-base">PDPA Consent Policy</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-4">
            <span>
              <span className="font-medium text-foreground">Purpose:</span>{" "}
              PDPA-EmployeeData-v1
            </span>
            <span>
              <span className="font-medium text-foreground">Version:</span>{" "}
              1.0
            </span>
          </div>
          <Link
            href="/privacy"
            className="inline-flex items-center gap-1 text-[var(--es-accent-600)] hover:underline"
          >
            View privacy policy <ExternalLink className="size-3.5" />
          </Link>
        </CardContent>
      </Card>

      {/* Consent events table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Recent Consent Events</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Entity ID</TableHead>
                <TableHead>IP</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading &&
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  </TableRow>
                ))}

              {!isLoading && error && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-sm text-destructive py-8">
                    {error}
                  </TableCell>
                </TableRow>
              )}

              {!isLoading && !error && events.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-8">
                    No consent events found
                  </TableCell>
                </TableRow>
              )}

              {!isLoading &&
                !error &&
                events.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="tabular-nums text-xs">
                      {formatDateTime(e.createdAt)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {e.actor?.email ?? e.actorId}
                    </TableCell>
                    <TableCell>
                      <Badge variant={actionBadgeVariant(e.action)}>
                        {e.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground" title={e.entityId}>
                      {e.entityId.slice(0, 8)}
                    </TableCell>
                    <TableCell className="tabular-nums text-xs text-muted-foreground">
                      {e.ipAddress ?? "—"}
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
