"use client";

import { createContext, useContext } from "react";
import type { Dictionary } from "./dictionaries";
import { getDictionary } from "./dictionaries";
import { DEFAULT_LOCALE, type Locale } from "./config";

const LocaleContext = createContext<Dictionary | null>(null);

export function LocaleProvider({ children, locale }: { children: React.ReactNode; locale: Locale }) {
  const dict = getDictionary(locale);
  return <LocaleContext value={dict}>{children}</LocaleContext>;
}

export function useT(): Dictionary {
  const dict = useContext(LocaleContext);
  if (!dict) return getDictionary(DEFAULT_LOCALE);
  return dict;
}
