"use client";
import { useEffect } from "react";

/** Adds `dark` to <html> so Portal-rendered dropdowns inherit dark CSS vars. */
export function DarkModeHtml() {
  useEffect(() => {
    document.documentElement.classList.add("dark");
    return () => document.documentElement.classList.remove("dark");
  }, []);
  return null;
}
