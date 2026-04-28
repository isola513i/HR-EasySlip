"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * SPA View Transitions: intercept internal `<a>` clicks and wrap navigation
 * with `document.startViewTransition` for cross-fade between routes.
 *
 * Progressive enhancement — no-op on browsers without the API (Safari < 18.2).
 */
export function ViewTransitions() {
  const router = useRouter();

  useEffect(() => {
    if (typeof document === "undefined") return;
    const startViewTransition = (
      document as Document & { startViewTransition?: (cb: () => void) => unknown }
    ).startViewTransition;
    if (typeof startViewTransition !== "function") return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented) return;
      if (e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      const link = (e.target as HTMLElement | null)?.closest?.("a");
      if (!link) return;
      const href = link.getAttribute("href");
      if (!href) return;
      if (link.target && link.target !== "_self") return;
      if (link.hasAttribute("download")) return;
      if (link.dataset.noViewTransition === "true") return;

      let url: URL;
      try { url = new URL(href, location.href); } catch { return; }
      if (url.origin !== location.origin) return;
      if (url.pathname === location.pathname && url.search === location.search) return;

      e.preventDefault();
      startViewTransition.call(document, () => {
        router.push(url.pathname + url.search + url.hash);
      });
    };

    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [router]);

  return null;
}
