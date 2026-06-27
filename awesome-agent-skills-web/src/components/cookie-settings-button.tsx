"use client";

import { COOKIE_CONSENT_OPEN_EVENT } from "@/components/cookie-consent";

export function CookieSettingsButton({ label }: { label: string }) {
  return (
    <button
      className="footer-link inline-flex w-fit items-center rounded-full border border-[color:var(--footer-border)] px-3 py-1.5 text-left text-sm font-medium transition hover:bg-black/[0.03] dark:hover:bg-white/[0.06]"
      onClick={() => {
        window.dispatchEvent(new CustomEvent(COOKIE_CONSENT_OPEN_EVENT));
      }}
      type="button"
    >
      {label}
    </button>
  );
}
