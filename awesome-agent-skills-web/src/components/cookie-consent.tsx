"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { prefixLocalePath } from "@/lib/i18n";

export const COOKIE_CONSENT_COOKIE = "lionsaid-cookie-consent";
export const COOKIE_CONSENT_EVENT = "lionsaid:cookie-consent-changed";
export const COOKIE_CONSENT_OPEN_EVENT = "lionsaid:cookie-consent-open";

type ConsentState = "accepted" | "rejected" | null;

function readConsent(): ConsentState {
  if (typeof document === "undefined") {
    return null;
  }

  const match = document.cookie.match(
    new RegExp(`(?:^|; )${COOKIE_CONSENT_COOKIE}=([^;]+)`),
  );
  const value = match?.[1];
  if (value === "accepted" || value === "rejected") {
    return value;
  }
  return null;
}

function writeConsent(value: Exclude<ConsentState, null>) {
  document.cookie = `${COOKIE_CONSENT_COOKIE}=${value}; path=/; max-age=31536000; samesite=lax`;
  window.dispatchEvent(new CustomEvent(COOKIE_CONSENT_EVENT, { detail: value }));
}

export function CookieConsent() {
  const [consent, setConsent] = useState<ConsentState>(null);
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const locale = pathname.startsWith("/zh-CN") ? "zh-CN" : "en";
  const normalizedPathname = pathname.endsWith("/") && pathname !== "/" ? pathname.slice(0, -1) : pathname;
  const isCatalogPage = normalizedPathname === "/skills" || normalizedPathname === "/zh-CN/skills";

  useEffect(() => {
    const current = readConsent();
    setConsent(current);
    setOpen(!current);
    setReady(true);

    function handleOpen() {
      setConsent(readConsent());
      setOpen(true);
    }

    window.addEventListener(COOKIE_CONSENT_OPEN_EVENT, handleOpen);
    return () => window.removeEventListener(COOKIE_CONSENT_OPEN_EVENT, handleOpen);
  }, []);

  if (!ready || !open) {
    return null;
  }

  const zh = locale === "zh-CN";
  const statusLabel =
    consent === "accepted"
      ? zh
        ? "当前：已同意统计"
        : "Current: analytics allowed"
      : consent === "rejected"
        ? zh
          ? "当前：已拒绝统计"
          : "Current: analytics rejected"
        : zh
          ? "当前：尚未选择"
          : "Current: not set";

  return (
    <div
      data-testid="cookie-consent-shell"
      className={
        isCatalogPage
          ? "pointer-events-none fixed inset-x-4 bottom-[6.75rem] z-30 sm:bottom-6 sm:left-6 sm:right-auto sm:w-[min(24rem,calc(100vw-3rem))]"
          : "fixed inset-x-0 bottom-4 z-30 px-4 sm:bottom-6"
      }
    >
      <div
        data-testid="cookie-consent-card"
        className={`pointer-events-auto rounded-[1.8rem] border border-[var(--border-soft)] bg-[color:var(--background)]/96 p-4 shadow-[0_24px_80px_rgba(56,49,36,0.18)] backdrop-blur ${
          isCatalogPage ? "mx-0" : "mx-auto max-w-4xl"
        }`}
      >
        <div className={`flex flex-col gap-4 ${isCatalogPage ? "" : "sm:flex-row sm:items-end sm:justify-between"}`}>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[var(--foreground)]">
              {zh ? "Cookie 与访问统计" : "Cookies and analytics"}
            </p>
            <p className="mt-1 text-xs font-medium tracking-[0.08em] text-[var(--accent)] uppercase">
              {statusLabel}
            </p>
            <p className="mt-2 text-sm leading-7 text-[var(--ink-muted)]">
              {zh
                ? "我们会使用必要 cookie 记住语言和主题。只有在你同意后，才会加载 Google Analytics 做访问统计。"
                : "We use essential cookies to remember language and theme. Google Analytics is loaded only if you allow analytics cookies."}{" "}
              <Link className="font-medium text-[var(--accent)]" href={prefixLocalePath("/legal/privacy", locale)}>
                {zh ? "查看隐私政策" : "Read privacy policy"}
              </Link>
            </p>
          </div>

          <div className={`flex shrink-0 flex-wrap gap-3 ${isCatalogPage ? "" : ""}`}>
            {consent ? (
              <button
                className="rounded-full border border-transparent px-4 py-2.5 text-sm font-medium text-[var(--ink-muted)] transition hover:text-[var(--foreground)]"
                onClick={() => setOpen(false)}
                type="button"
              >
                {zh ? "仅关闭" : "Close"}
              </button>
            ) : null}
            <button
              className="rounded-full border border-[var(--border-soft)] bg-[var(--surface-strong)] px-4 py-2.5 text-sm font-medium text-[var(--foreground)] transition hover:bg-[var(--surface)]"
              onClick={() => {
                writeConsent("rejected");
                setConsent("rejected");
                setOpen(false);
              }}
              type="button"
            >
              {zh ? "拒绝统计" : "Reject analytics"}
            </button>
            <button
              className="rounded-full border border-[var(--accent)] bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-white shadow-[0_12px_26px_rgba(225,6,0,0.22)] transition hover:opacity-95"
              onClick={() => {
                writeConsent("accepted");
                setConsent("accepted");
                setOpen(false);
              }}
              type="button"
            >
              {zh ? "同意统计" : "Allow analytics"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
