import type { ReactNode } from "react";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import type { Locale } from "@/lib/i18n";

type LegalPageShellProps = {
  locale: Locale;
  eyebrow: string;
  title: string;
  intro: string;
  updatedAt: string;
  children: ReactNode;
};

export function LegalPageShell({
  locale,
  eyebrow,
  title,
  intro,
  updatedAt,
  children,
}: LegalPageShellProps) {
  return (
    <main className="grain flex flex-1 flex-col overflow-x-hidden pb-28 sm:pb-0">
      <section className="hero-grid relative overflow-hidden py-4">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="hero-orb absolute left-[12%] top-12 h-72 w-72 rounded-full bg-[rgba(225,6,0,0.14)] blur-3xl" />
          <div className="hero-orb absolute right-[6%] top-28 h-80 w-80 rounded-full bg-[rgba(88,38,28,0.14)] blur-3xl [animation-delay:1.2s]" />
        </div>
        <SiteHeader locale={locale} />

        <div className="page-shell py-8 lg:py-10">
          <div className="glass relative overflow-hidden rounded-[2.4rem] p-6 sm:p-8 lg:p-9">
            <div className="max-w-3xl">
              <p className="eyebrow text-[var(--accent)]">{eyebrow}</p>
              <h1 className="display mt-4 max-w-3xl text-4xl leading-[0.95] font-semibold tracking-[-0.045em] sm:text-[3.4rem] lg:text-[3.8rem]">
                {title}
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-8 text-[var(--ink-muted)] sm:text-lg">
                {intro}
              </p>
              <p className="mt-4 text-sm text-[var(--ink-muted)]">{updatedAt}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="page-shell pb-20">
        <article className="surface-panel rounded-[2rem] p-6 sm:p-8 lg:p-10">
          <div className="legal-doc">
            {children}
          </div>
        </article>
      </section>

      <SiteFooter locale={locale} />
    </main>
  );
}
