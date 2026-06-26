"use client";

import Link from "next/link";
import { PublisherLogo } from "@/components/publisher-logo";
import type { PublisherSummary } from "@/lib/skills";

export function PublisherLogoMarquee({
  publishers,
}: {
  publishers: PublisherSummary[];
}) {
  const marqueePublishers = [...publishers, ...publishers];

  return (
    <div className="publisher-marquee-shell mt-10 overflow-hidden rounded-[1.9rem] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.01))] py-4 sm:py-5">
      <div className="publisher-marquee-track flex w-max items-center gap-3 sm:gap-4">
        {marqueePublishers.map((publisher, index) => (
          <Link
            key={`${publisher.slug}-${index}`}
            className="publisher-marquee-item inline-flex shrink-0 items-center gap-3 rounded-full border border-[var(--border-soft)] bg-[var(--surface-strong)] px-4 py-3 text-left transition hover:border-[var(--accent)]/22 hover:bg-[var(--surface)] sm:px-5"
            href={`/publishers/${publisher.slug}`}
          >
            <PublisherLogo name={publisher.name} slug={publisher.slug} />
            <span className="min-w-0">
              <span className="block text-[0.95rem] font-semibold text-[var(--foreground)]">
                {publisher.name}
              </span>
              <span className="block text-[11px] uppercase tracking-[0.16em] text-[var(--ink-muted)]">
                {publisher.count} skills
              </span>
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
