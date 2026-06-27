"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { LOCALE_COOKIE, type Locale, getCopy } from "@/lib/i18n";

function setLocaleCookie(locale: Locale) {
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=31536000; samesite=lax`;
  document.documentElement.lang = locale;
}

export function LanguageToggle({ locale }: { locale: Locale }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const copy = getCopy(locale);
  const nextLocale: Locale = locale === "en" ? "zh-CN" : "en";

  return (
    <button
      aria-label={`${copy.language.short}: ${copy.language.chinese}`}
      className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--border-soft)] bg-[var(--surface-strong)] p-0 text-sm font-semibold tracking-[0.04em] text-[var(--foreground)] transition hover:bg-[var(--surface)]"
      onClick={() =>
        startTransition(() => {
          setLocaleCookie(nextLocale);
          router.refresh();
        })
      }
      type="button"
    >
      {copy.language.short}
    </button>
  );
}
