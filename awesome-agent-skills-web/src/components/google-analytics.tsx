"use client";

import Script from "next/script";
import { useEffect } from "react";
import {
  COOKIE_CONSENT_COOKIE,
  COOKIE_CONSENT_EVENT,
} from "@/components/cookie-consent";

const GA_ID = "G-PVLZD6F47L";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

function hasAnalyticsConsent() {
  if (typeof document === "undefined") {
    return false;
  }

  const match = document.cookie.match(
    new RegExp(`(?:^|; )${COOKIE_CONSENT_COOKIE}=([^;]+)`),
  );
  return match?.[1] === "accepted";
}

export function GoogleAnalytics() {
  useEffect(() => {
    function applyConsent() {
      if (typeof window === "undefined" || typeof window.gtag !== "function") {
        return;
      }

      const granted = hasAnalyticsConsent();
      window.gtag("consent", "update", {
        ad_personalization: granted ? "granted" : "denied",
        ad_storage: "denied",
        ad_user_data: granted ? "granted" : "denied",
        analytics_storage: granted ? "granted" : "denied",
      });
    }

    applyConsent();

    window.addEventListener(COOKIE_CONSENT_EVENT, applyConsent);
    return () => window.removeEventListener(COOKIE_CONSENT_EVENT, applyConsent);
  }, []);

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          window.gtag = function gtag(){dataLayer.push(arguments);}
          gtag('consent', 'default', {
            ad_personalization: 'denied',
            ad_storage: 'denied',
            ad_user_data: 'denied',
            analytics_storage: 'denied'
          });
          gtag('js', new Date());
          gtag('config', '${GA_ID}', {
            anonymize_ip: true
          });
        `}
      </Script>
    </>
  );
}
