"use client";

import { notFound, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { DelayedRouteLink, DelayedSkillLink } from "@/components/delayed-skill-link";
import { PublisherLogo } from "@/components/publisher-logo";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getPublisherDetailPath, prefixLocalePath } from "@/lib/i18n";
import { getPublishers, getSourceTypeLabel, getTrustLevelLabel } from "@/lib/skills";
import type { SkillCatalogItem } from "@/lib/skill-types";

type SkillsCatalogChunkPayload = {
  generatedAt: string;
  chunkIndex: number;
  totalSkills: number;
  skills: SkillCatalogItem[];
};

type SkillsCatalogManifest = {
  generatedAt: string;
  totalSkills: number;
  chunkSize: number;
  chunkCount: number;
};

type SkillsCatalogIndexPayload = {
  generatedAt: string;
  totalSkills: number;
  chunkSize: number;
  items: Array<
    | {
        slug: string;
        name: string;
        description: string;
        publisher: string;
        publisherSlug: string;
        kind: SkillCatalogItem["kind"];
        tags: string[];
        personas: string[];
        jobs: string[];
        sourceType: SkillCatalogItem["sourceType"];
        trustLevel: SkillCatalogItem["trustLevel"];
        chunkIndex: number;
      }
    | [
        string,
        string,
        string,
        string,
        string,
        SkillCatalogItem["kind"],
        string[],
        string[],
        string[],
        SkillCatalogItem["sourceType"],
        SkillCatalogItem["trustLevel"],
        number,
      ]
  >;
};

function decodeCatalogIndexItem(
  item: SkillsCatalogIndexPayload["items"][number],
) {
  if (!Array.isArray(item)) {
    return item;
  }

  const [
    slug,
    name,
    description,
    publisher,
    publisherSlug,
    kind,
    tags,
    personas,
    jobs,
    sourceType,
    trustLevel,
    chunkIndex,
  ] = item;

  return {
    slug,
    name,
    description,
    publisher,
    publisherSlug,
    kind,
    tags,
    personas,
    jobs,
    sourceType,
    trustLevel,
    chunkIndex,
  };
}

function getTrustBadgeClass(trustLevel: SkillCatalogItem["trustLevel"]) {
  if (trustLevel === "official") {
    return "border-[#b7ebc6] bg-[#eefcf2] text-[#246a35]";
  }

  if (trustLevel === "curated") {
    return "border-[#d9d8ff] bg-[#f4f2ff] text-[#5745c6]";
  }

  return "border-[#edd7d7] bg-[#fff5f5] text-[#9b4b4b]";
}

function getSourceBadgeClass(sourceType: SkillCatalogItem["sourceType"]) {
  if (sourceType === "official-site") {
    return "border-[#bfd9ff] bg-[#f2f7ff] text-[#2f63b4]";
  }

  if (sourceType === "marketplace") {
    return "border-[#f3ddbb] bg-[#fff7ec] text-[#9b6820]";
  }

  if (sourceType === "github-discovery") {
    return "border-[#e2d8f7] bg-[#f8f4ff] text-[#7054ae]";
  }

  return "border-[#d8e0ea] bg-[#f6f8fb] text-[#556577]";
}

export function PublisherDetailClient({ locale }: { locale: "en" | "zh-CN" }) {
  const searchParams = useSearchParams();
  const slug = searchParams.get("slug")?.trim() ?? "";
  const pageLocale = searchParams.get("locale") === "zh-CN" ? "zh-CN" : locale;
  const publishers = useMemo(() => getPublishers(), []);
  const publisher = useMemo(
    () => (slug ? publishers.find((item) => item.slug === slug) ?? null : null),
    [publishers, slug],
  );
  const [skills, setSkills] = useState<SkillCatalogItem[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!publisher) {
      return;
    }

    const publisherSlug = publisher.slug;
    const controller = new AbortController();

    async function loadSkills() {
      try {
        const manifestResponse = await fetch("/data/skills-catalog/manifest.json", {
          cache: "no-store",
          signal: controller.signal,
        });

        if (!manifestResponse.ok) {
          throw new Error(`Failed to load manifest: ${manifestResponse.status}`);
        }

        const manifest = (await manifestResponse.json()) as SkillsCatalogManifest;
        const version = manifest.generatedAt;
        const indexResponse = await fetch(
          `/data/skills-catalog/index.json?v=${encodeURIComponent(version)}`,
          {
            cache: "force-cache",
            signal: controller.signal,
          },
        );

        if (!indexResponse.ok) {
          throw new Error(`Failed to load index: ${indexResponse.status}`);
        }

        const indexPayload = (await indexResponse.json()) as SkillsCatalogIndexPayload;
        const matches = indexPayload.items
          .map((item) => decodeCatalogIndexItem(item))
          .filter((item) => item.publisherSlug === publisherSlug);
        const chunkIndexes = [...new Set(matches.map((item) => item.chunkIndex))].sort((a, b) => a - b);

        const chunkPayloads = await Promise.all(
          chunkIndexes.map(async (chunkIndex) => {
            const response = await fetch(
              `/data/skills-catalog/chunk-${chunkIndex}.json?v=${encodeURIComponent(version)}`,
              {
                cache: "force-cache",
                signal: controller.signal,
              },
            );

            if (!response.ok) {
              throw new Error(`Failed to load chunk ${chunkIndex}: ${response.status}`);
            }

            return (await response.json()) as SkillsCatalogChunkPayload;
          }),
        );

        if (controller.signal.aborted) {
          return;
        }

        const skillsBySlug = new Map<string, SkillCatalogItem>();
        for (const chunk of chunkPayloads) {
          for (const skill of chunk.skills) {
            if (skill.publisherSlug === publisherSlug) {
              skillsBySlug.set(skill.slug, skill);
            }
          }
        }

        setSkills(
          matches
            .map((item) => skillsBySlug.get(item.slug))
            .filter((item): item is SkillCatalogItem => Boolean(item)),
        );
      } catch {
        if (!controller.signal.aborted) {
          setError(true);
        }
      }
    }

    void loadSkills();

    return () => controller.abort();
  }, [publisher]);

  if (!slug || !publisher) {
    notFound();
  }

  return (
    <main className="pb-16">
      <SiteHeader currentPath="/skills" locale={pageLocale} />
      <div className="page-shell py-8">
        <section className="surface-panel rounded-[2rem] p-6 sm:p-8">
          <p className="eyebrow surface-muted">
            {publisher.kind === "official"
              ? pageLocale === "zh-CN"
                ? "官方出品"
                : "Official team"
              : pageLocale === "zh-CN"
                ? "社区整理"
                : "Community"}
          </p>
          <div className="mt-5">
            <PublisherLogo name={publisher.name} size="lg" slug={publisher.slug} />
          </div>
          <h1 className="display mt-4 text-5xl font-semibold tracking-[-0.04em] sm:text-6xl">
            {publisher.name}
          </h1>
          <p className="muted mt-5 max-w-2xl text-lg leading-8">
            {pageLocale === "zh-CN"
              ? "按发布方集中查看，更适合你已经知道想信任谁、想优先看哪家官方团队的时候。"
              : "Browse everything from this publisher when you already know which team you want to trust first."}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <p className="text-sm muted">
              {pageLocale === "zh-CN" ? `${publisher.count} 个相关 skill` : `${publisher.count} skills to explore`}
            </p>
            <DelayedRouteLink
              className="rounded-full border border-[var(--panel-outline)] px-4 py-2 text-sm transition hover:bg-[var(--panel-soft-hover)]"
              href={prefixLocalePath(`/skills?publisher=${publisher.slug}`, pageLocale)}
            >
              {pageLocale === "zh-CN" ? "查看全部" : "See all skills"}
            </DelayedRouteLink>
          </div>
        </section>

        <section className="mt-8 grid gap-4">
          {error ? (
            <div className="surface-panel rounded-[1.75rem] p-5 text-sm text-[var(--ink-muted)]">
              {pageLocale === "zh-CN" ? "加载这个发布方的 skill 失败了，请稍后重试。" : "Failed to load this publisher’s skills. Please try again."}
            </div>
          ) : null}

          {!error && skills === null ? (
            <div className="surface-panel rounded-[1.75rem] p-5 text-sm text-[var(--ink-muted)]">
              {pageLocale === "zh-CN" ? "正在加载相关 skill…" : "Loading matching skills..."}
            </div>
          ) : null}

          {skills?.map((skill) => (
            <DelayedSkillLink
              key={skill.slug}
              className="glass skill-card rounded-[1.75rem] p-5"
              locale={pageLocale}
              skillSlug={skill.slug}
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="eyebrow muted">
                  {skill.kind === "official"
                    ? pageLocale === "zh-CN"
                      ? "官方"
                      : "Official"
                    : pageLocale === "zh-CN"
                      ? "社区"
                      : "Community"}
                </span>
                <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${getTrustBadgeClass(skill.trustLevel)}`}>
                  {getTrustLevelLabel(skill.trustLevel, pageLocale)}
                </span>
                <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${getSourceBadgeClass(skill.sourceType)}`}>
                  {getSourceTypeLabel(skill.sourceType, pageLocale)}
                </span>
              </div>
              <h2 className="mt-3 text-2xl font-semibold">{skill.name}</h2>
              <p className="muted mt-3 leading-7">{skill.description}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {skill.tags.slice(0, 4).map((tag) => (
                  <span
                    key={tag}
                    className="catalog-chip rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] sm:text-[11px] sm:tracking-[0.16em]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </DelayedSkillLink>
          ))}
        </section>

        <section className="mt-6">
          <DelayedRouteLink
            className="inline-flex items-center rounded-full border border-[var(--panel-outline)] px-4 py-2 text-sm transition hover:bg-[var(--panel-soft-hover)]"
            href={prefixLocalePath(getPublisherDetailPath(publisher.slug, pageLocale), pageLocale)}
          >
            {pageLocale === "zh-CN" ? "刷新当前发布方页面" : "Reload this publisher page"}
          </DelayedRouteLink>
        </section>
      </div>
      <SiteFooter locale={pageLocale} />
    </main>
  );
}
