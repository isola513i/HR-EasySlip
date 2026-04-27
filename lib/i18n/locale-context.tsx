"use client";

import { createContext, useContext } from "react";
import type { Dictionary } from "./dictionaries";
import { getDictionary } from "./dictionaries";
import { DEFAULT_LOCALE, LOCALE_COOKIE, LOCALES, type Locale } from "./config";

const LocaleContext = createContext<Dictionary | null>(null);

function getClientLocale(): Locale {
  if (typeof document === "undefined") return DEFAULT_LOCALE;
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${LOCALE_COOKIE}=([^;]*)`));
  const raw = match?.[1];
  if (raw && LOCALES.includes(raw as Locale)) return raw as Locale;
  return DEFAULT_LOCALE;
}

export function LocaleProvider({ children, locale }: { children: React.ReactNode; locale?: Locale }) {
  const dict = getDictionary(locale ?? getClientLocale());
  return <LocaleContext value={dict}>{children}</LocaleContext>;
}

export function useT(): Dictionary {
  const dict = useContext(LocaleContext);
  if (!dict) return getDictionary(getClientLocale());
  return dict;
}
