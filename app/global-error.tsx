"use client";

import { useEffect } from "react";

const isHmrStaleModuleError = (error: Error): boolean => {
  const msg = error.message ?? "";
  return (
    msg.includes("module factory is not available") ||
    msg.includes("deleted in an HMR update") ||
    msg.includes("Cannot find module") ||
    msg.includes("Failed to fetch dynamically imported module")
  );
};

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const isHmr = isHmrStaleModuleError(error);

  useEffect(() => {
    console.error("[GlobalError]", error);
    if (isHmr) {
      const timer = setTimeout(() => window.location.reload(), 2000);
      return () => clearTimeout(timer);
    }
  }, [error, isHmr]);

  const handleClick = isHmr ? () => window.location.reload() : reset;

  return (
    <html lang="th">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif" }}>
        <main style={{ display: "grid", minHeight: "100dvh", placeItems: "center", padding: "3rem 1.5rem" }}>
          <div style={{ maxWidth: "24rem", textAlign: "center" }}>
            <p style={{ fontSize: "3.75rem", fontWeight: 700, color: "#71717a", fontFamily: "monospace" }}>500</p>
            <h1 style={{ fontSize: "1.25rem", fontWeight: 600 }}>
              {isHmr ? "Dev hot-reload glitch" : "Application Error"}
            </h1>
            <p style={{ fontSize: "0.875rem", color: "#71717a", marginTop: "0.5rem" }}>
              {isHmr
                ? "A module was swapped while the page was running. Reloading…"
                : (error.message || "A critical error occurred.")}
            </p>
            <button
              onClick={handleClick}
              style={{ marginTop: "1.5rem", padding: "0.5rem 1.5rem", border: "1px solid #e4e4e7", borderRadius: "0.375rem", cursor: "pointer", background: "white" }}
            >
              {isHmr ? "Reload page" : "Try again"}
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
