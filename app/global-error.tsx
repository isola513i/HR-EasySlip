"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[GlobalError]", error);
  }, [error]);

  return (
    <html lang="th">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif" }}>
        <main style={{ display: "grid", minHeight: "100dvh", placeItems: "center", padding: "3rem 1.5rem" }}>
          <div style={{ maxWidth: "24rem", textAlign: "center" }}>
            <p style={{ fontSize: "3.75rem", fontWeight: 700, color: "#71717a", fontFamily: "monospace" }}>500</p>
            <h1 style={{ fontSize: "1.25rem", fontWeight: 600 }}>Application Error</h1>
            <p style={{ fontSize: "0.875rem", color: "#71717a", marginTop: "0.5rem" }}>
              {error.message || "A critical error occurred."}
            </p>
            <button
              onClick={reset}
              style={{ marginTop: "1.5rem", padding: "0.5rem 1.5rem", border: "1px solid #e4e4e7", borderRadius: "0.375rem", cursor: "pointer", background: "white" }}
            >
              Try again
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
