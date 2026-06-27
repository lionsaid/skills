"use client";

import Script from "next/script";
import { useEffect, useState } from "react";
import {
  COOKIE_CONSENT_COOKIE,
  COOKIE_CONSENT_EVENT,
} from "@/components/cookie-consent";

const GA_ID = "G-PVLZD6F47L";

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
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    setEnabled(hasAnalyticsConsent());

    function handleChange() {
      setEnabled(hasAnalyticsConsent());
    }

    window.addEventListener(COOKIE_CONSENT_EVENT, handleChange);
    return () => window.removeEventListener(COOKIE_CONSENT_EVENT, handleChange);
  }, []);

  if (!enabled) {
    return null;
  }

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}');
        `}
      </Script>
    </>
  );
}
