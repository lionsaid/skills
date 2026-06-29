"use client";

import Link from "next/link";
import { PublisherLogo } from "@/components/publisher-logo";
import { getCopy, getPublisherDetailPath, prefixLocalePath, type Locale } from "@/lib/i18n";
import type { PublisherSummary } from "@/lib/skills";

export function PublisherLogoMarquee({
  publishers,
  locale = "en",
}: {
  publishers: PublisherSummary[];
  locale?: Locale;
}) {
  const marqueePublishers = [...publishers, ...publishers];
  const copy = getCopy(locale);

  if (publishers.length === 0) {
    return null;
  }

  return (
    <div className="publisher-marquee-shell mt-10 overflow-hidden rounded-[2rem] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.01))] py-5 sm:py-6">
      <div className="publisher-marquee-track flex w-max items-center gap-4 sm:gap-5">
        {marqueePublishers.map((publisher, index) => (
          <Link
            key={`${publisher.slug}-${index}`}
            className="publisher-marquee-item inline-flex shrink-0 items-center gap-3.5 rounded-full border border-[var(--border-soft)] bg-[var(--surface-strong)] px-5 py-3.5 text-left transition hover:border-[var(--accent)]/22 hover:bg-[var(--surface)] sm:px-6 sm:py-4"
            href={prefixLocalePath(getPublisherDetailPath(publisher.slug, locale), locale)}
            prefetch={false}
          >
            <PublisherLogo name={publisher.name} slug={publisher.slug} size="lg" />
            <span className="min-w-0">
              <span className="block text-[1rem] font-semibold text-[var(--foreground)] sm:text-[1.05rem]">
                {publisher.name}
              </span>
              <span className="block text-[12px] uppercase tracking-[0.16em] text-[var(--ink-muted)]">
                {publisher.count} {locale === "zh-CN" ? "个 skill" : copy.home.stats.skills}
              </span>
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
