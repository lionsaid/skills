"use client";

import { useMemo } from "react";
import { notFound, useSearchParams } from "next/navigation";
import { PublisherLogo } from "@/components/publisher-logo";
import { SkillAvatar } from "@/components/skill-avatar";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { CopyButton } from "@/components/copy-button";
import { DelayedRouteLink, DelayedSkillLink } from "@/components/delayed-skill-link";
import { SkillSourcePreview } from "@/components/skill-source-preview";
import {
  getRelatedSkills,
  getSkillBySlug,
  getSourceTypeLabel,
  getTrustLevelLabel,
} from "@/lib/skills";
import { getPublisherDetailPath, prefixLocalePath } from "@/lib/i18n";

const officialSkillRepos: Record<string, string> = {
  anthropics: "https://github.com/anthropics/skills",
  microsoft: "https://github.com/microsoft/skills",
  "testmu-ai": "https://github.com/LambdaTest/agent-skills",
};

function getTrustBadgeClass(trustLevel: "official" | "curated" | "untrusted") {
  if (trustLevel === "official") {
    return "border-[#b7ebc6] bg-[#eefcf2] text-[#246a35]";
  }

  if (trustLevel === "curated") {
    return "border-[#d9d8ff] bg-[#f4f2ff] text-[#5745c6]";
  }

  return "border-[#edd7d7] bg-[#fff5f5] text-[#9b4b4b]";
}

function getSourceBadgeClass(
  sourceType: "curated-readme" | "github-readme" | "official-site" | "marketplace" | "github-discovery",
) {
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

function getRepositoryUrl(repository?: string) {
  return repository ? `https://github.com/${repository}` : null;
}

function getCreatorLabel(skill: NonNullable<ReturnType<typeof getSkillBySlug>>) {
  return skill.creatorHandle ? `@${skill.creatorHandle}` : skill.publisher;
}

function getLicenseStatusLabel(pageLocale: "en" | "zh-CN") {
  return pageLocale === "zh-CN"
    ? "未在本站索引中单独记录；请以上游仓库 LICENSE / README 为准。"
    : "Not separately recorded in this index; please verify the upstream repository LICENSE / README.";
}

function getInstallInfo(skill: NonNullable<ReturnType<typeof getSkillBySlug>>) {
  const skillName = skill.name.split("/").slice(1).join("/") || skill.slug;

  try {
    const parsed = new URL(skill.url);

    if (parsed.hostname === "github.com") {
      const parts = parsed.pathname.split("/").filter(Boolean);

      if (parts.length < 2) {
        return null;
      }

      const repoRoot = `https://github.com/${parts[0]}/${parts[1]}`;

      return {
        command: `npx skills add ${repoRoot} --skill ${skillName}`,
        repoRoot,
        sourcePath: skill.url,
        sourceUrl: `${repoRoot}/tree/main/skills/${skillName}`,
      };
    }

    const repoRoot =
      officialSkillRepos[skill.publisherSlug] ??
      `https://github.com/${skill.publisherSlug}/skills`;

    return {
      command: `npx skills add ${repoRoot} --skill ${skillName}`,
      repoRoot,
      sourcePath: skill.url,
      sourceUrl: `${repoRoot}/tree/main/skills/${skillName}`,
    };
  } catch {
    return null;
  }
}

export function SkillDetailClient({ locale }: { locale: "en" | "zh-CN" }) {
  const searchParams = useSearchParams();
  const slug = searchParams.get("slug")?.trim() ?? "";
  const pageLocale = searchParams.get("locale") === "zh-CN" ? "zh-CN" : locale;
  const skill = useMemo(() => (slug ? getSkillBySlug(slug) : null), [slug]);
  const relatedSkills = useMemo(() => (slug ? getRelatedSkills(slug, 6, pageLocale) : []), [slug, pageLocale]);
  const installInfo = useMemo(() => (skill ? getInstallInfo(skill) : null), [skill]);
  const repositoryUrl = useMemo(() => (skill ? getRepositoryUrl(skill.repository) : null), [skill]);

  if (!slug || !skill) {
    notFound();
  }

  return (
    <main className="pb-28 sm:pb-20">
      <SiteHeader currentPath={null} locale={pageLocale} />
      <div className="page-shell" style={{ paddingTop: "2rem", paddingBottom: "3.5rem" }}>
        <section
          className="detail-shell overflow-hidden border shadow-[0_28px_90px_rgba(56,49,36,0.08)]"
          style={{ borderRadius: "2.5rem" }}
        >
          <div
            className="grid min-w-0 gap-10 p-6 sm:p-7 lg:grid-cols-[minmax(0,1.02fr)_minmax(0,0.98fr)] lg:items-start lg:p-8"
            style={{ borderRadius: "2.5rem" }}
          >
            <div className="min-w-0 space-y-10 pt-3 lg:pt-6">
              <div className="flex items-center gap-3">
                {skill.creatorAvatarUrl ? (
                  <SkillAvatar avatarUrl={skill.creatorAvatarUrl} name={skill.creatorHandle ?? skill.publisher} size="sm" />
                ) : (
                  <PublisherLogo name={skill.publisher} size="sm" slug={skill.publisherSlug} />
                )}
                <p className="eyebrow muted">{skill.publisher}</p>
              </div>
              <h1 className="display max-w-4xl text-4xl leading-[1.06] font-bold tracking-[-0.03em] sm:text-5xl lg:text-6xl">
                {skill.name}
              </h1>
              <p className="max-w-2xl text-[1.02rem] font-medium leading-8 sm:text-lg">
                {skill.description}
              </p>

              <div className="flex max-w-4xl flex-wrap gap-2">
                {skill.tags.map((tag) => (
                  <DelayedRouteLink
                    key={tag}
                    className="detail-chip inline-flex min-h-8 max-w-full min-w-0 items-center justify-start rounded-full border px-3 py-1 text-left text-[10px] font-semibold uppercase leading-[1.15] tracking-[0.06em] whitespace-normal break-words transition sm:min-h-10 sm:px-4 sm:py-2 sm:text-xs sm:tracking-[0.12em]"
                    href={prefixLocalePath(`/skills?q=${encodeURIComponent(tag)}`, pageLocale)}
                  >
                    {tag}
                  </DelayedRouteLink>
                ))}
              </div>

              <div className="mt-5 border-t border-[var(--border-soft)] pt-4 sm:mt-6 sm:pt-5">
                <div className="flex flex-wrap items-center gap-2.5 text-sm">
                  <span className="action-chip inline-flex min-h-8 items-center rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] sm:min-h-10 sm:px-4 sm:py-2 sm:text-sm sm:tracking-[0.18em]">
                    {skill.kind}
                  </span>
                  <span className={`inline-flex min-h-8 items-center rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] sm:min-h-10 sm:px-4 sm:py-2 sm:text-sm sm:tracking-[0.18em] ${getTrustBadgeClass(skill.trustLevel)}`}>
                    {getTrustLevelLabel(skill.trustLevel, pageLocale)}
                  </span>
                  <span className={`inline-flex min-h-8 items-center rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] sm:min-h-10 sm:px-4 sm:py-2 sm:text-sm sm:tracking-[0.18em] ${getSourceBadgeClass(skill.sourceType)}`}>
                    {getSourceTypeLabel(skill.sourceType, pageLocale)}
                  </span>
                  {skill.riskFlags.map((flag) => (
                    <span
                      key={flag}
                      className="inline-flex min-h-8 items-center rounded-full border border-[#edd7d7] bg-[#fff5f5] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#9b4b4b] sm:min-h-10 sm:px-4 sm:py-2 sm:text-sm sm:tracking-[0.18em]"
                    >
                      {flag.replaceAll("-", " ")}
                    </span>
                  ))}
                </div>
                <div className="mt-4 flex flex-col items-start gap-3 sm:mt-5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
                  <DelayedRouteLink
                    className="detail-chip inline-flex min-h-11 min-w-0 items-center rounded-full border px-4 py-2.5 text-[13px] font-semibold leading-5 transition sm:text-sm sm:leading-6"
                    href={prefixLocalePath(getPublisherDetailPath(skill.publisherSlug, pageLocale), pageLocale)}
                  >
                    {pageLocale === "zh-CN" ? `更多来自 ${skill.publisher}` : `More from ${skill.publisher}`}
                  </DelayedRouteLink>
                  <DelayedRouteLink
                    className="detail-chip inline-flex min-h-11 min-w-0 items-center rounded-full border px-4 py-2.5 text-[13px] font-semibold leading-5 transition sm:text-sm sm:leading-6"
                    href={prefixLocalePath(`/skills?publisher=${skill.publisherSlug}`, pageLocale)}
                  >
                    {pageLocale === "zh-CN" ? "查看同一发布方的更多 skill" : "See more from this publisher"}
                  </DelayedRouteLink>
                  <a
                    className="detail-chip inline-flex min-h-11 min-w-0 items-center gap-1.5 rounded-full border px-4 py-2.5 text-[13px] font-semibold leading-5 transition sm:text-sm sm:leading-6"
                    href={installInfo?.sourceUrl ?? skill.url}
                    rel="noreferrer"
                    target="_blank"
                  >
                    <span className="min-w-0">{pageLocale === "zh-CN" ? "查看源站" : "View source"}</span>
                    <span aria-hidden="true">↗</span>
                  </a>
                </div>
              </div>
            </div>

            <aside className="detail-shell min-w-0 rounded-[2rem] border p-6 shadow-[0_24px_70px_rgba(56,49,36,0.08)] sm:p-8 sm:pt-9 lg:mt-2 lg:p-10">
              <p className="eyebrow muted">{pageLocale === "zh-CN" ? "安装与配置" : "Setup & Installation"}</p>
              <h2 className="mt-4 text-[1.55rem] font-semibold leading-tight tracking-[-0.03em] sm:text-2xl">
                {pageLocale === "zh-CN" ? "把这个 skill 接入你的工作流" : "Get this skill into your workflow"}
              </h2>
              <p className="muted mt-3 text-sm leading-6 sm:leading-7">
                {installInfo
                  ? pageLocale === "zh-CN"
                    ? "从上游 GitHub 仓库安装，然后让你的 assistant 指向这个 skill。"
                    : "Install from the upstream GitHub repo, then point your assistant at this skill."
                  : pageLocale === "zh-CN"
                    ? "这个 skill 只链接到源站，这里没有直接安装命令。"
                    : "This skill links to source, but no direct install command is available here."}
              </p>

              {installInfo ? (
                <div className="mt-6 min-w-0 max-w-full space-y-6 overflow-hidden sm:mt-7 sm:space-y-8">
                  <div className="detail-code min-w-0 max-w-full overflow-hidden rounded-[1.5rem] p-4 shadow-[0_20px_50px_rgba(13,23,38,0.18)] ring-1 ring-black/5 sm:p-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-xs uppercase tracking-[0.18em] text-white/82">
                        {pageLocale === "zh-CN" ? "安装" : "Install"}
                      </p>
                      <div className="sm:ml-auto">
                        <CopyButton text={installInfo.command} />
                      </div>
                    </div>
                    <pre className="mt-3 min-w-0 max-w-full overflow-hidden whitespace-pre-wrap break-all [overflow-wrap:anywhere] pr-1 text-[12px] leading-6 text-white sm:overflow-x-auto sm:whitespace-pre sm:break-normal sm:[overflow-wrap:normal] sm:text-sm sm:leading-7">
                      <code className="block max-w-full">
                        {installInfo.command}
                      </code>
                    </pre>
                  </div>

                  <p className="px-1 text-sm leading-6 text-[var(--ink-muted)] sm:leading-7">
                    {pageLocale === "zh-CN"
                      ? "也可以直接粘贴链接，让 coding assistant 帮你安装。"
                      : "Or paste the link and ask your coding assistant to install it."}
                  </p>

                  <div className="grid min-w-0 max-w-full gap-3 overflow-hidden text-sm sm:grid-cols-2 sm:gap-4">
                    <div className="min-w-0 w-full max-w-full overflow-hidden rounded-[1.1rem] border border-white/8 bg-white/[0.03] px-4 py-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-[var(--ink-muted)]">
                        {pageLocale === "zh-CN" ? "源仓库" : "Source repo"}
                      </p>
                      <a
                        className="mt-2 block max-w-full overflow-hidden break-all [overflow-wrap:anywhere] font-medium leading-6"
                        href={installInfo.repoRoot}
                        rel="noreferrer"
                        target="_blank"
                      >
                        {installInfo.repoRoot}
                      </a>
                    </div>
                    <div className="min-w-0 w-full max-w-full overflow-hidden rounded-[1.1rem] border border-white/8 bg-white/[0.03] px-4 py-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-[var(--ink-muted)]">
                        {pageLocale === "zh-CN" ? "源路径" : "Skill path"}
                      </p>
                      <p className="mt-2 block max-w-full overflow-hidden break-all [overflow-wrap:anywhere] font-medium leading-6">
                        {installInfo.sourcePath}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 min-w-0 max-w-full pl-1 sm:mt-6 sm:pl-4">
                    <a
                      className="detail-chip inline-flex max-w-full items-center justify-center gap-2 rounded-full border px-4 py-2 font-semibold transition sm:w-fit sm:justify-start"
                      href={installInfo.sourceUrl}
                      rel="noreferrer"
                      target="_blank"
                    >
                      {pageLocale === "zh-CN" ? "在 GitHub 查看" : "View on GitHub"}
                      <span aria-hidden="true">↗</span>
                    </a>
                  </div>
                </div>
              ) : null}
            </aside>
          </div>
        </section>

        <section className="mt-8 detail-shell overflow-hidden rounded-[2rem] border p-6 sm:p-8">
          <p className="eyebrow muted">{pageLocale === "zh-CN" ? "关于这个 skill" : "About this skill"}</p>
          <h2 className="mt-4 text-2xl font-semibold tracking-[-0.03em]">
            {pageLocale === "zh-CN" ? "这个 skill 能做什么" : "What this skill does"}
          </h2>
          <p className="mt-4 max-w-4xl text-[1rem] leading-8 sm:text-[1.02rem]">
            {skill.description}
          </p>
          <div className="mt-5 rounded-[1.25rem] border border-[var(--border-soft)] bg-[var(--surface-strong)] px-4 py-4 sm:px-5">
            <p className="text-sm leading-7 text-[var(--ink-muted)]">
              {pageLocale === "zh-CN"
                ? "这里的 skill 名称、描述和源内容保持原文展示；我们只翻译站点本身的导航、按钮、筛选和说明。"
                : "Skill titles, descriptions, and source content stay in their original language. Only the site navigation, buttons, filters, and helper UI are localized."}
            </p>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-[1.25rem] border border-[var(--border-soft)] bg-[var(--surface-strong)] p-5">
              <h3 className="eyebrow muted">{pageLocale === "zh-CN" ? "来源信息" : "Source details"}</h3>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className={`inline-flex min-h-8 items-center rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] sm:min-h-10 sm:px-4 sm:py-2 sm:text-sm sm:tracking-[0.18em] ${getTrustBadgeClass(skill.trustLevel)}`}>
                  {getTrustLevelLabel(skill.trustLevel, pageLocale)}
                </span>
                <span className={`inline-flex min-h-8 items-center rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] sm:min-h-10 sm:px-4 sm:py-2 sm:text-sm sm:tracking-[0.18em] ${getSourceBadgeClass(skill.sourceType)}`}>
                  {getSourceTypeLabel(skill.sourceType, pageLocale)}
                </span>
              </div>
              <p className="muted mt-4 text-sm leading-7">
                {pageLocale === "zh-CN"
                  ? "优先把这里当成发现与筛选入口，具体实现和用法以源仓库或源站内容为准。"
                  : "Use this page to discover and compare. For exact implementation details and usage, rely on the upstream repository or source page."}
              </p>
            </div>

            <div className="rounded-[1.25rem] border border-[var(--border-soft)] bg-[var(--surface-strong)] p-5">
              <h3 className="eyebrow muted">{pageLocale === "zh-CN" ? "相关标签" : "Tags"}</h3>
              <div className="mt-4 flex flex-wrap gap-2">
                {skill.tags.length > 0 ? (
                  skill.tags.map((tag) => (
                    <DelayedRouteLink
                      key={tag}
                      className="detail-chip inline-flex min-h-8 max-w-full items-center rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] sm:min-h-9"
                      href={prefixLocalePath(`/skills?q=${encodeURIComponent(tag)}`, pageLocale)}
                    >
                      {tag}
                    </DelayedRouteLink>
                  ))
                ) : (
                  <p className="muted text-sm leading-7">
                    {pageLocale === "zh-CN" ? "这个 skill 目前还没有标签。" : "No tags yet for this skill."}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-[1.25rem] border border-[var(--border-soft)] bg-[var(--surface-strong)] p-5">
            <h3 className="eyebrow muted">{pageLocale === "zh-CN" ? "来源与合规说明" : "Source and policy notes"}</h3>
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <div className="rounded-[1rem] border border-white/8 bg-white/[0.03] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-[var(--ink-muted)]">
                  {pageLocale === "zh-CN" ? "作者 / 维护者" : "Author / maintainer"}
                </p>
                <p className="mt-2 text-sm font-medium leading-6">{getCreatorLabel(skill)}</p>
              </div>
              <div className="rounded-[1rem] border border-white/8 bg-white/[0.03] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-[var(--ink-muted)]">
                  {pageLocale === "zh-CN" ? "仓库" : "Repository"}
                </p>
                {repositoryUrl ? (
                  <a
                    className="mt-2 block break-all text-sm font-medium leading-6 underline decoration-[color:var(--accent)] decoration-from-font underline-offset-4"
                    href={repositoryUrl}
                    rel="noreferrer"
                    target="_blank"
                  >
                    {repositoryUrl}
                  </a>
                ) : (
                  <p className="mt-2 text-sm font-medium leading-6">-</p>
                )}
              </div>
              <div className="rounded-[1rem] border border-white/8 bg-white/[0.03] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-[var(--ink-muted)]">
                  {pageLocale === "zh-CN" ? "来源" : "Source"}
                </p>
                <p className="mt-2 break-all text-sm font-medium leading-6">{skill.url}</p>
              </div>
              <div className="rounded-[1rem] border border-white/8 bg-white/[0.03] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-[var(--ink-muted)]">
                  {pageLocale === "zh-CN" ? "许可状态" : "License status"}
                </p>
                <p className="mt-2 text-sm font-medium leading-6">{getLicenseStatusLabel(pageLocale)}</p>
              </div>
            </div>
            <div className="mt-4 rounded-[1rem] border border-[#d9d8ff] bg-[#f7f7ff] px-4 py-4 text-sm leading-7 text-[#4a4480] dark:border-[#5f5cb0] dark:bg-[rgba(91,88,155,0.18)] dark:text-[#d8d6ff]">
              {pageLocale === "zh-CN" ? (
                <>
                  如需下架、纠错或权利说明，请联系{" "}
                  <a className="underline" href="mailto:lionsaid@aliyun.com">
                    lionsaid@aliyun.com
                  </a>
                </>
              ) : (
                <>
                  For takedown, correction, or rights requests, contact{" "}
                  <a className="underline" href="mailto:lionsaid@aliyun.com">
                    lionsaid@aliyun.com
                  </a>{" "}
                </>
              )}
            </div>
          </div>
        </section>

        <SkillSourcePreview
          locale={pageLocale}
          skillName={skill.name}
          discoveryPath={skill.discoveryPath}
          repository={skill.repository}
          sourceUrl={skill.url}
        />

        <section className="mt-14">
          <div className="mb-7 flex items-end justify-between gap-4">
            <div>
              <p className="eyebrow text-[var(--accent)]">{pageLocale === "zh-CN" ? "相关" : "Related"}</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-[-0.03em]">
                {pageLocale === "zh-CN" ? "相似 skill" : "Similar skills"}
              </h2>
              <p className="muted mt-2 max-w-2xl text-sm leading-6">
                {pageLocale === "zh-CN"
                  ? "如果当前这个 skill 还不够合适，可以先从这些相近选项继续看。"
                  : "If this skill is not quite the right fit, these are the closest options to check next."}
              </p>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            {relatedSkills.map(({ skill: relatedSkill, reason }) => (
              <DelayedSkillLink
                key={relatedSkill.slug}
                className="skill-card detail-card rounded-[1.75rem] border p-6 shadow-[0_18px_50px_rgba(56,49,36,0.06)]"
                locale={pageLocale}
                skillSlug={relatedSkill.slug}
              >
                <p className="eyebrow muted">{relatedSkill.publisher}</p>
                <h3 className="mt-3 text-[1.35rem] font-semibold tracking-[-0.03em]">
                  {relatedSkill.name}
                </h3>
                <p className="mt-4 text-sm font-semibold leading-6">
                  {pageLocale === "zh-CN" ? "原因：" : "Why:"} {reason}
                </p>
                <p className="muted mt-4 leading-7">{relatedSkill.description}</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {relatedSkill.tags.slice(0, 4).map((tag) => (
                    <span
                      key={tag}
                      className="detail-chip rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </DelayedSkillLink>
            ))}
          </div>
        </section>
      </div>
      <SiteFooter locale={pageLocale} />
    </main>
  );
}
