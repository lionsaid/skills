"use client";

import { COOKIE_CONSENT_OPEN_EVENT } from "@/components/cookie-consent";

export function CookieSettingsButton({ label }: { label: string }) {
  return (
    <button
      className="footer-link text-left text-sm transition"
      onClick={() => {
        window.dispatchEvent(new CustomEvent(COOKIE_CONSENT_OPEN_EVENT));
      }}
      type="button"
    >
      {label}
    </button>
  );
}
