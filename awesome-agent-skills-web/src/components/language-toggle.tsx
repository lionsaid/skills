"use client";

import { usePathname, useRouter } from "next/navigation";
import { LOCALE_COOKIE, type Locale, getCopy, getLocaleSwitchUrl } from "@/lib/i18n";

export function LanguageToggle({ locale }: { locale: Locale }) {
  const pathname = usePathname();
  const copy = getCopy(locale);
  const nextLocale: Locale = locale === "en" ? "zh-CN" : "en";
  const nextLabel = nextLocale === "zh-CN" ? "中" : "EN";

  return (
    <button
      aria-label={nextLocale === "zh-CN" ? copy.language.chinese : copy.language.english}
      className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--border-soft)] bg-[var(--surface-strong)] p-0 text-sm font-semibold tracking-[0.04em] text-[var(--foreground)] transition hover:bg-[var(--surface)]"
      onClick={() => {
        const search = typeof window !== "undefined" ? window.location.search : "";
        const nextUrl = getLocaleSwitchUrl(pathname, search, nextLocale);
        if (typeof window !== "undefined") {
          try {
            window.localStorage.setItem(LOCALE_COOKIE, nextLocale);
            document.cookie = `${LOCALE_COOKIE}=${encodeURIComponent(nextLocale)}; path=/; max-age=31536000; samesite=lax`;
            document.documentElement.lang = nextLocale;
          } catch {}
          window.location.assign(nextUrl);
        }
      }}
      type="button"
    >
      {nextLabel}
    </button>
  );
}
