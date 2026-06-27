import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { CookieConsent } from "@/components/cookie-consent";
import { GoogleAnalytics } from "@/components/google-analytics";
import { getRequestLocale } from "@/lib/request-locale";
import "./globals.css";

export const metadata: Metadata = {
  title: "LionSaid Skills",
  description:
    "Find useful agent skills faster by searching, starting from your role, or jumping in by task.",
  metadataBase: new URL("https://skill.lionsaid.com"),
  alternates: {
    canonical: "https://skill.lionsaid.com",
  },
  icons: {
    icon: "/favicon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getRequestLocale();
  const localizedTitle = "LionSaid Skills";
  const localizedDescription =
    locale === "zh-CN"
      ? "按角色、任务或发布方更快找到真正能用的 skill。"
      : "Find useful agent skills faster by searching, starting from your role, or jumping in by task.";

  return (
    <html
      lang={locale}
      className="h-full antialiased"
      suppressHydrationWarning
    >
      <head>
        <title>{localizedTitle}</title>
        <meta content={localizedDescription} name="description" />
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function () {
                try {
                  var stored = localStorage.getItem('lionsaid-theme');
                  var theme = stored === 'dark' || stored === 'light'
                    ? stored
                    : (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
                      ? 'dark'
                      : 'light');
                  document.documentElement.dataset.theme = theme;
                  document.documentElement.style.colorScheme = theme;
                } catch (error) {}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <GoogleAnalytics />
        {children}
        <CookieConsent locale={locale} />
      </body>
    </html>
  );
}
