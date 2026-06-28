import type { Locale } from "@/lib/i18n";

export async function getRequestLocale(): Promise<Locale> {
  return "en";
}
