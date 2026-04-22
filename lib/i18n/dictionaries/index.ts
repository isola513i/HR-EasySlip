import type { Locale } from "../config";
import type { Dictionary } from "./en";
import en from "./en";
import th from "./th";

const dictionaries: Record<Locale, Dictionary> = { en, th };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}

export type { Dictionary };
