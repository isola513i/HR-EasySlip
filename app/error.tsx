"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[ErrorBoundary]", error);
  }, [error]);

  return (
    <main className="grid min-h-dvh place-items-center bg-muted/30 px-6 py-12">
      <div className="w-full max-w-sm space-y-6 text-center">
        <div className="space-y-2">
          <p className="font-mono text-6xl font-bold text-muted-foreground">500</p>
          <h1 className="text-xl font-semibold tracking-tight">
            Something went wrong
          </h1>
          <p className="text-sm text-muted-foreground">
            {error.message || "An unexpected error occurred."}
          </p>
        </div>
        <Button variant="outline" className="w-full" onClick={reset}>
          Try again
        </Button>
      </div>
    </main>
  );
}
