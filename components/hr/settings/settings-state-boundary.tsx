"use client";

import { AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function SettingsLoadingState() {
  return (
    <div className="flex flex-col gap-6">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i}>
          <CardHeader><Skeleton className="h-5 w-28" /></CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function SettingsErrorState({ message }: { message: string }) {
  return (
    <Card>
      <CardContent className="flex h-[300px] flex-col items-center justify-center gap-2 text-sm">
        <AlertTriangle className="size-5 text-destructive" />
        <p className="text-destructive">{message}</p>
      </CardContent>
    </Card>
  );
}

export function SettingsEmptyState({ message }: { message: string }) {
  return (
    <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
      {message}
    </div>
  );
}
