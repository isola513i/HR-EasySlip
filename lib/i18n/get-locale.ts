import { cookies } from "next/headers";
import { DEFAULT_LOCALE, LOCALE_COOKIE, LOCALES, type Locale } from "./config";

export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  const raw = store.get(LOCALE_COOKIE)?.value;
  if (raw && LOCALES.includes(raw as Locale)) return raw as Locale;
  return DEFAULT_LOCALE;
}
