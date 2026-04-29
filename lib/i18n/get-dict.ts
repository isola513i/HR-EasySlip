import { getLocale } from "./get-locale";
import { getDictionary, type Dictionary } from "./dictionaries";
import type { Locale } from "./config";

export async function getDict(): Promise<{ locale: Locale; t: Dictionary }> {
  const locale = await getLocale();
  return { locale, t: getDictionary(locale) };
}
