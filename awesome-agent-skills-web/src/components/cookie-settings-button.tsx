"use client";

import { COOKIE_CONSENT_OPEN_EVENT } from "@/components/cookie-consent";

export function CookieSettingsButton({ label }: { label: string }) {
  return (
    <button
      className="action-secondary inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition"
      onClick={() => {
        window.dispatchEvent(new CustomEvent(COOKIE_CONSENT_OPEN_EVENT));
      }}
      type="button"
    >
      {label}
    </button>
  );
}
