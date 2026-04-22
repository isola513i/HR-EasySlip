"use client";

import { useCallback, useSyncExternalStore } from "react";
import {
  LOCALE_COOKIE,
  DEFAULT_LOCALE,
  LOCALES,
  type Locale,
} from "@/lib/i18n/config";

function getCookie(): Locale {
  if (typeof document === "undefined") return DEFAULT_LOCALE;
  const match = document.cookie.match(
    new RegExp(`${LOCALE_COOKIE}=([^;]+)`),
  );
  const val = match?.[1];
  return val && LOCALES.includes(val as Locale)
    ? (val as Locale)
    : DEFAULT_LOCALE;
}

const subscribe = () => () => {};

export function useLocale() {
  const locale = useSyncExternalStore(subscribe, getCookie, () => DEFAULT_LOCALE);

  const setLocale = useCallback((next: Locale) => {
    document.cookie = `${LOCALE_COOKIE}=${next};path=/;max-age=${60 * 60 * 24 * 365};samesite=lax`;
    window.location.reload();
  }, []);

  return { locale, setLocale } as const;
}
