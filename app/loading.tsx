import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <main className="grid min-h-dvh place-items-center bg-muted/30">
      <div className="flex flex-col items-center gap-4">
        <Skeleton className="h-10 w-10 rounded-full" />
        <Skeleton className="h-3 w-32" />
      </div>
    </main>
  );
}
