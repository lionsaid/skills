import type { Metadata } from "next";
import type { Locale } from "@/lib/i18n";
import {
  SITE_DESCRIPTION_EN,
  SITE_DESCRIPTION_ZH,
  SITE_NAME,
  SITE_URL,
} from "@/lib/site";

export function getLocalizedDescription(locale: Locale) {
  return locale === "zh-CN" ? SITE_DESCRIPTION_ZH : SITE_DESCRIPTION_EN;
}

export function buildMetadata({
  locale,
  title,
  path,
  description,
}: {
  locale?: Locale;
  title?: string;
  path?: string;
  description?: string;
} = {}): Metadata {
  const baseDescription = description ?? SITE_DESCRIPTION_EN;
  const metadata: Metadata = {
    title: title ? `${title}` : SITE_NAME,
    description: baseDescription,
    alternates: path
      ? {
          canonical: `${SITE_URL}${path}`,
        }
      : undefined,
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      title: title ?? SITE_NAME,
      description: baseDescription,
      url: path ? `${SITE_URL}${path}` : SITE_URL,
    },
    twitter: {
      card: "summary_large_image",
      title: title ?? SITE_NAME,
      description: baseDescription,
    },
  };

  if (locale) {
    metadata.alternates = {
      canonical: path ? `${SITE_URL}${path}` : SITE_URL,
      languages: {
        en: path?.startsWith("/zh-CN") ? `${SITE_URL}${path.slice(7) || "/"}` : `${SITE_URL}${path ?? "/"}`,
        "zh-CN": path?.startsWith("/zh-CN")
          ? `${SITE_URL}${path}`
          : `${SITE_URL}/zh-CN${path === "/" || !path ? "" : path}`,
      },
    };
  }

  return metadata;
}
