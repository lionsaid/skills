import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Awesome Agent Skills",
  description:
    "Search-first discovery experience for a curated directory of agent skills.",
  metadataBase: new URL("https://skill.lionsaid.com"),
  alternates: {
    canonical: "https://skill.lionsaid.com",
  },
  icons: {
    icon: "/favicon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
