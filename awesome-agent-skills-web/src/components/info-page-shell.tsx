import type { ReactNode } from "react";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import type { Locale } from "@/lib/i18n";

type InfoPageShellProps = {
  locale: Locale;
  eyebrow: string;
  title: string;
  intro: string;
  children: ReactNode;
};

export function InfoPageShell({
  locale,
  eyebrow,
  title,
  intro,
  children,
}: InfoPageShellProps) {
  return (
    <main className="grain flex flex-1 flex-col overflow-x-hidden pb-28 sm:pb-0">
      <section className="hero-grid relative overflow-hidden py-6">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="hero-orb absolute left-[12%] top-12 h-72 w-72 rounded-full bg-[rgba(225,6,0,0.14)] blur-3xl" />
          <div className="hero-orb absolute right-[6%] top-28 h-80 w-80 rounded-full bg-[rgba(88,38,28,0.14)] blur-3xl [animation-delay:1.2s]" />
        </div>
        <SiteHeader locale={locale} />

        <div className="page-shell py-12 lg:py-16">
          <div className="glass relative overflow-hidden rounded-[2.4rem] p-7 sm:p-9 lg:p-12">
            <div className="max-w-4xl">
              <p className="eyebrow text-[var(--accent)]">{eyebrow}</p>
              <h1 className="display mt-5 max-w-4xl text-5xl leading-[0.95] font-semibold tracking-[-0.045em] sm:text-6xl lg:text-[5.2rem]">
                {title}
              </h1>
              <p className="mt-6 max-w-3xl text-lg leading-8 text-[var(--ink-muted)]">
                {intro}
              </p>
            </div>
          </div>
        </div>
      </section>

      {children}

      <SiteFooter locale={locale} />
    </main>
  );
}
