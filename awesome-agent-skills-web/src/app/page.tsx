import { existsSync } from "node:fs";
import path from "node:path";
import Link from "next/link";
import { PublisherLogo } from "@/components/publisher-logo";
import { PublisherLogoMarquee } from "@/components/publisher-logo-marquee";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { VortexBackground } from "@/components/vortex-background";
import { getFeaturedSkills, getPublishers, getRoles, getStats, getTrustLevelLabel } from "@/lib/skills";
import { getCopy, getSkillDetailPath, prefixLocalePath, type Locale } from "@/lib/i18n";
import { getRequestLocale } from "@/lib/request-locale";
import { buildMetadata, getLocalizedDescription } from "@/lib/seo";
import type { Metadata } from "next";

export function generateMetadata(): Metadata {
  return buildMetadata({
    title: "LionSaid Skills",
    path: "/",
    description: getLocalizedDescription("en"),
  });
}

type PageProps = {
  locale: Locale;
};

export async function HomePage({ locale }: PageProps) {
  const copy = getCopy(locale);
  const stats = getStats();
  const featured = getFeaturedSkills();
  const publishers = getPublishers();
  const roles = getRoles();
  const marqueePublisherWhitelist = new Set([
    "anthropics",
    "openai",
    "googleworkspace",
    "microsoft",
    "cloudflare",
    "stripe",
    "supabase",
    "nvidia",
    "netlify",
    "firebase",
    "hashicorp",
    "coinbase",
    "brave",
    "expo",
    "flutter",
    "vercel-labs",
    "clickhouse",
    "duckdb",
    "mongodb",
    "figma",
    "redis",
    "auth0",
    "binance",
    "huggingface",
    "replicate",
    "google-gemini",
    "google-labs-code",
  ]);
  const marqueePublishers = publishers.filter(
    (publisher) =>
      marqueePublisherWhitelist.has(publisher.slug) &&
      existsSync(path.join(process.cwd(), "public", "publisher-logos", `${publisher.slug}.png`)),
  );
  const ecosystemPublishers = [
    "anthropics",
    "openai",
    "googleworkspace",
    "microsoft",
    "cloudflare",
    "clickhouse",
    "duckdb",
    "supabase",
  ]
    .map((slug) => publishers.find((publisher) => publisher.slug === slug))
    .filter((publisher): publisher is NonNullable<(typeof publishers)[number]> => Boolean(publisher));
  const taskCards = [
    {
      label: copy.taskLabels["sql-analysis"],
      href: "/skills?job=sql-analysis&persona=data-analyst",
      summary:
        locale === "zh-CN"
          ? "清洗数据、跑 SQL、生成周报。"
          : "Clean data, run SQL, and ship weekly reporting.",
    },
    {
      label: copy.taskLabels["testing-debugging"],
      href: "/skills?job=testing-debugging&persona=engineer",
      summary:
        locale === "zh-CN"
          ? "查问题、复现 bug、验证修复。"
          : "Trace issues, reproduce bugs, and verify fixes.",
    },
    {
      label: copy.taskLabels["prd-specs"],
      href: "/skills?job=prd-specs&persona=pm",
      summary:
        locale === "zh-CN"
          ? "写需求、对齐范围、输出决策。"
          : "Write specs, align scope, and capture decisions.",
    },
    {
      label: copy.taskLabels["ui-ux-design"],
      href: "/skills?job=ui-ux-design&persona=designer",
      summary:
        locale === "zh-CN"
          ? "做界面、看方案、准备提案。"
          : "Design screens, review concepts, and prep presentation-ready work.",
    },
    {
      label: copy.taskLabels["campaign-planning"],
      href: "/skills?job=campaign-planning&persona=marketer",
      summary:
        locale === "zh-CN"
          ? "策划活动、写文案、追踪效果。"
          : "Plan campaigns, draft copy, and track results.",
    },
    {
      label: copy.taskLabels["workflow-automation"],
      href: prefixLocalePath("/skills?job=workflow-automation", locale),
      summary:
        locale === "zh-CN"
          ? "把重复工作串成自动流程。"
          : "Turn repetitive work into reliable automation.",
    },
  ];

  const quickStarts = [
    { label: copy.roles.officialOnly, href: prefixLocalePath("/skills?kind=official", locale) },
    { label: copy.common.browse, href: prefixLocalePath("/skills", locale) },
    { label: "Anthropics", href: prefixLocalePath("/skills?publisher=anthropics", locale) },
    { label: "OpenAI", href: prefixLocalePath("/skills?publisher=openai", locale) },
    { label: locale === "zh-CN" ? "文档工作流" : "Docs workflows", href: prefixLocalePath("/skills?q=docs", locale) },
    { label: locale === "zh-CN" ? "演示文稿" : "Presentations", href: prefixLocalePath("/skills?q=pptx", locale) },
  ];
  return (
    <main className="grain flex flex-1 flex-col overflow-x-hidden pb-28 sm:pb-0">
      <section className="hero-vortex relative overflow-hidden py-6">
        <VortexBackground className="opacity-75 mix-blend-multiply dark:opacity-100 dark:mix-blend-screen" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_32%,rgba(255,255,255,0.2),transparent_28%)]" />
        <SiteHeader currentPath="/" locale={locale} />

        <div className="page-shell grid gap-6 py-12 lg:grid-cols-[minmax(0,1.25fr)_minmax(360px,0.75fr)] lg:items-stretch lg:py-16 2xl:gap-8">
          <div className="spotlight-card glass relative overflow-hidden rounded-[2.25rem] p-6 sm:p-8 lg:p-10">
            <p className="eyebrow text-[var(--accent)]">{copy.home.eyebrow}</p>
            <h1 className="display mt-5 max-w-3xl text-5xl leading-[0.94] font-semibold tracking-[-0.045em] text-balance sm:text-6xl lg:text-[5.6rem]">
              {copy.home.title}
            </h1>
            <p className="muted mt-6 max-w-2xl text-lg leading-8">
              {copy.home.subtitle}
            </p>

            <form action={prefixLocalePath("/skills", locale)} className="mt-8 sm:mt-10">
              <label className="sr-only" htmlFor="home-search">
                {locale === "zh-CN" ? "搜索 skill" : "Search skills"}
              </label>
              <div className="flex flex-col gap-3 rounded-[1.75rem] border border-[var(--border-soft)] bg-white/88 p-3 shadow-[0_18px_44px_rgba(20,16,10,0.08)] sm:flex-row sm:items-center">
                <div className="flex min-w-0 flex-1 items-center gap-3 rounded-[1.35rem] bg-[rgba(17,17,17,0.03)] px-4 py-3">
                  <span aria-hidden="true" className="text-black/45">
                    <svg
                      fill="none"
                      height="18"
                      viewBox="0 0 24 24"
                      width="18"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M21 21l-4.35-4.35m1.35-5.4a6.75 6.75 0 1 1-13.5 0 6.75 6.75 0 0 1 13.5 0Z"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.8"
                      />
                    </svg>
                  </span>
                  <input
                    autoComplete="off"
                    className="w-full bg-transparent text-base outline-none placeholder:text-black/35"
                    id="home-search"
                    name="q"
                    placeholder={copy.home.searchPlaceholder}
                    type="search"
                  />
                </div>
                <button
                  className="h-12 rounded-full bg-[var(--accent)] px-5 text-sm font-medium text-white transition hover:opacity-90"
                  type="submit"
                >
                  {copy.home.searchButton}
                </button>
              </div>
            </form>

            <div className="mt-6 flex flex-wrap gap-2">
              {quickStarts.map((item) => (
                <Link
                  key={item.label}
                  className="rounded-full border border-[var(--border-soft)] bg-[var(--surface-strong)] px-4 py-2 text-sm font-medium text-[var(--foreground)] transition hover:bg-[var(--surface)]"
                  href={item.href}
                >
                  {item.label}
                </Link>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-4 text-sm text-black/55">
              <span>{stats.totalSkills} {copy.home.stats.skills}</span>
              <span>{stats.totalPublishers} {copy.home.stats.publishers}</span>
              <span>{stats.officialCount} {copy.home.stats.official}</span>
              <span>{stats.communityCount} {copy.home.stats.community}</span>
            </div>

            <div className="mt-7">
              <p className="eyebrow text-[var(--accent)]">{locale === "zh-CN" ? "比如这些结果" : "For example"}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {copy.home.goalExamples.map((example) => (
                  <span
                    key={example}
                    className="rounded-full border border-[var(--border-soft)] bg-[var(--surface-strong)] px-3 py-2 text-sm text-[var(--foreground)]"
                  >
                    {example}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            <div className="surface-panel rounded-[2rem] p-6 sm:p-7 xl:col-span-2">
              <p className="eyebrow surface-muted">{locale === "zh-CN" ? "怎么找更快" : "How to start"}</p>
              <h2 className="mt-4 text-3xl font-semibold leading-tight">
                {locale === "zh-CN" ? "不知道名字也没关系，先从你要做的事开始找。" : "No exact name? Start from the work you need to do."}
              </h2>
              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {[
                  locale === "zh-CN"
                    ? "先按任务、公司或角色缩小范围"
                    : "Narrow it down by task, company, or role first",
                  locale === "zh-CN"
                    ? "先看信息更完整、维护更稳定的来源"
                    : "Start with sources that look more complete and better maintained",
                  locale === "zh-CN"
                    ? "再打开最符合你场景的 skill"
                    : "Then open the skills that best fit your situation",
                ].map((item, index) => (
                  <div
                    key={item}
                    className="surface-panel-soft rounded-[1.25rem] p-4"
                  >
                    <p className="eyebrow surface-muted">0{index + 1}</p>
                    <p className="surface-strong mt-3 text-sm leading-6">{item}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass rounded-[1.75rem] p-5 sm:p-6">
              <p className="eyebrow muted">{locale === "zh-CN" ? "已收录 skill" : "Skills"}</p>
              <p className="mt-3 text-4xl font-semibold">{stats.totalSkills}</p>
              <p className="muted mt-2 text-sm leading-6">
                {locale === "zh-CN"
                  ? "已索引，可从首页直接搜索。"
                  : "Indexed and searchable from the homepage."}
              </p>
            </div>

            <div className="glass rounded-[1.75rem] p-5 sm:p-6">
              <p className="eyebrow muted">{locale === "zh-CN" ? "发布方" : "Publishers"}</p>
              <p className="mt-3 text-4xl font-semibold">{stats.totalPublishers}</p>
              <p className="muted mt-2 text-sm leading-6">
                {locale === "zh-CN"
                  ? "如果你已经知道常用生态，可以直接从这里开始。"
                  : "If you already know the ecosystem you trust, start there."}
              </p>
            </div>

            <div className="glass rounded-[1.75rem] p-5 sm:p-6">
              <p className="eyebrow muted">{locale === "zh-CN" ? "官方出品" : "Official teams"}</p>
              <p className="mt-3 text-4xl font-semibold">{stats.officialCount}</p>
              <p className="muted mt-2 text-sm leading-6">
                {locale === "zh-CN"
                  ? "通常信息更完整，更新也更稳定。"
                  : "Usually the most complete and the most consistently maintained."}
              </p>
            </div>

            <div className="glass rounded-[1.75rem] p-5 sm:p-6">
              <p className="eyebrow muted">{locale === "zh-CN" ? "社区整理" : "Community"}</p>
              <p className="mt-3 text-4xl font-semibold">{stats.communityCount}</p>
              <p className="muted mt-2 text-sm leading-6">
                {locale === "zh-CN"
                  ? "补充更多细分场景和长尾需求。"
                  : "Covers more niche use cases and long-tail workflows."}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="page-shell py-10 pb-14">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow text-[var(--accent)]">{locale === "zh-CN" ? "推荐入口" : "Start here"}</p>
            <h2 className="display mt-3 text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
              {locale === "zh-CN" ? "先从更容易找到结果的入口开始。" : "Start from the paths that usually get you results faster."}
            </h2>
          </div>
          <Link className="text-sm font-medium text-[var(--accent)]" href={prefixLocalePath("/skills", locale)}>
            {locale === "zh-CN" ? "查看全部" : "See all skills"}
          </Link>
        </div>

            <div className="mt-8 grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
              {[
                {
                  href: prefixLocalePath("/skills?kind=official", locale),
                  title: locale === "zh-CN" ? "先看官方和企业维护的 skill" : "Start with official and enterprise-maintained skills",
              body:
                locale === "zh-CN"
                  ? "信息更完整，更新更稳定，也更容易先找到靠谱入口。"
                  : "Usually the clearest, most stable starting point.",
              meta: `${stats.officialCount} ${copy.home.stats.official}`,
              slug: "openai",
                },
                {
                  href: prefixLocalePath("/skills?q=weekly%20report", locale),
                  title: locale === "zh-CN" ? "从目标开始" : "Start from a goal",
                  body:
                    locale === "zh-CN"
                      ? "做周报、整理旅行计划、练摄影、写博客，都能先从结果倒推。"
                      : "Planning a trip, improving a report, practicing photography, or writing a blog can all start from the result you want.",
                  meta: locale === "zh-CN" ? "个人目标" : "Personal goal",
                  slug: "openai",
                },
                {
                  href: prefixLocalePath("/roles/data-analyst", locale),
                  title: locale === "zh-CN" ? "从角色入口开始" : "Begin with your role",
                  body:
                    locale === "zh-CN"
                      ? "如果你知道自己是什么角色，推荐会更贴近工作流。"
                      : "Role pages point you to skills that match your workflow better.",
                  meta: copy.skills.browseByRole,
              slug: "microsoft",
            },
            {
              href: prefixLocalePath("/skills", locale),
                  title: locale === "zh-CN" ? "直接搜索你熟悉的生态" : "Search the ecosystem you already know",
                  body:
                    locale === "zh-CN"
                      ? "Google Workspace、Microsoft、OpenAI 这类生态会更直接。"
                      : "Ecosystems like Google Workspace, Microsoft, or OpenAI are a quick way in.",
                  meta: locale === "zh-CN" ? "直接进入" : "Go straight in",
                  slug: "googleworkspace",
                },
          ].map((item) => (
            <Link
              key={item.title}
              className="homepage-entry-card group flex min-h-[260px] flex-col justify-between rounded-[1.8rem] border border-[var(--panel-outline)] bg-[var(--surface-strong)] p-6 transition hover:-translate-y-0.5 hover:border-[var(--accent-soft)] hover:shadow-[0_24px_54px_rgba(56,49,36,0.12)]"
              href={item.href}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="eyebrow text-[var(--accent)]">{item.meta}</p>
                  <h3 className="mt-4 text-[1.55rem] font-semibold leading-[1.08] tracking-[-0.035em] text-[var(--panel-fg)]">
                    {item.title}
                  </h3>
                </div>
                <div className="shrink-0">
                  <PublisherLogo name={item.title} size="sm" slug={item.slug} />
                </div>
              </div>
              <p className="mt-5 max-w-[32ch] text-sm leading-7 text-[var(--panel-muted)]">
                {item.body}
              </p>
              <div className="mt-8 flex items-center justify-between gap-3 border-t border-[var(--panel-outline)] pt-4">
                <span className="text-sm font-medium text-[var(--accent)]">
                  {locale === "zh-CN" ? "打开入口" : "Open entry"}
                </span>
                <span className="text-sm text-[var(--panel-muted)]">→</span>
              </div>
            </Link>
          ))}
        </div>

        <PublisherLogoMarquee locale={locale} publishers={marqueePublishers} />
      </section>

      <section className="page-shell py-6 pb-14">
        <div className="surface-panel rounded-[2.2rem] p-6 sm:p-7 lg:p-8">
          <div className="max-w-3xl">
            <p className="eyebrow text-[var(--accent)]">{copy.skills.browseByRole}</p>
            <h2 className="display mt-4 text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
              {locale === "zh-CN" ? "从你的工作身份开始找。" : "Begin with the role you work in."}
            </h2>
            <p className="homepage-soft-copy mt-4 max-w-2xl text-base leading-7">
              {copy.home.roleIntro}
            </p>
          </div>

          <div className="mt-7 border-t border-[var(--panel-outline)] pt-6">
            <div className="grid gap-3 md:grid-cols-2">
              {roles.slice(0, 6).map((role) => (
                <Link
                  key={role.slug}
                  className="group flex items-start gap-4 rounded-[1.2rem] border border-transparent px-4 py-4 transition hover:border-[var(--panel-outline)] hover:bg-[var(--surface-strong)]"
                  href={prefixLocalePath(`/roles/${role.slug}`, locale)}
                >
                  <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[var(--panel-outline)] text-sm font-medium text-[var(--accent)]">
                    {String(roles.findIndex((item) => item.slug === role.slug) + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-base font-semibold text-[var(--panel-fg)]">
                        {copy.roleLabels[role.slug] ?? role.label}
                      </p>
                      <span className="homepage-inline-link shrink-0">
                        {locale === "zh-CN" ? "打开" : "Open"}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-7 text-[var(--panel-muted)]">
                      {copy.roleSummaries[role.slug] ?? role.summary}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {role.jobs.slice(0, 3).map((job) => (
                        <span key={job} className="homepage-light-chip">
                          {copy.taskLabels[job] ?? job}
                        </span>
                      ))}
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            <div className="mt-5 flex justify-end">
              <Link className="text-sm font-medium text-[var(--accent)]" href={prefixLocalePath("/roles", locale)}>
                {locale === "zh-CN" ? "查看全部角色" : "See all roles"}
              </Link>
            </div>
          </div>
        </div>

        <div className="homepage-section-dark mt-8 rounded-[2.2rem] p-6 sm:p-7 lg:p-8">
              <div className="max-w-3xl">
              <p className="homepage-task-kicker eyebrow">{locale === "zh-CN" ? "按结果找" : "Find by result"}</p>
              <h2 className="display homepage-task-heading mt-4 text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
                {locale === "zh-CN" ? "你想完成什么，就从什么开始。" : "Start from what you want to finish."}
              </h2>
              <p className="homepage-task-copy mt-4 max-w-2xl text-base leading-7">
                {copy.home.taskIntro}
              </p>
            </div>

            <div className="mt-8 grid gap-3 lg:grid-cols-2">
              {taskCards.map((task, index) => (
                <Link
                  key={task.label}
                  className="homepage-task-strip group flex items-start gap-4 rounded-[1.45rem] p-4 sm:p-5"
                  href={task.href}
                >
                  <span className="homepage-task-index">{String(index + 1).padStart(2, "0")}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <p className="homepage-task-title text-lg font-semibold leading-6">{task.label}</p>
                      <span className="homepage-task-cta">{locale === "zh-CN" ? "进入" : "Open"}</span>
                    </div>
                    <p className="homepage-task-copy mt-2 text-sm leading-6">{task.summary}</p>
                  </div>
                </Link>
              ))}
            </div>

            <div className="homepage-task-footer mt-6 flex flex-col items-start justify-between gap-4 rounded-[1.5rem] px-4 py-4 sm:flex-row sm:items-center">
              <p className="homepage-task-copy max-w-md text-sm leading-6">
                {locale === "zh-CN"
                  ? "如果你已经知道目标，直接搜索会更快。"
                  : "If you already know the goal, search is still the fastest path."}
              </p>
              <Link className="homepage-dark-cta shrink-0" href={prefixLocalePath("/skills", locale)}>
                {locale === "zh-CN" ? "查看全部" : "See all skills"}
              </Link>
            </div>
          </div>
      </section>

      <section className="surface-panel py-20 2xl:py-24">
        <div className="page-shell">
          <div className="max-w-4xl">
            <p className="eyebrow surface-muted">{locale === "zh-CN" ? "精选 skill" : "Featured skills"}</p>
            <h2 className="display mt-4 text-5xl leading-tight font-semibold sm:text-6xl 2xl:text-7xl">
              {copy.home.featuredHeading}
            </h2>
            <p className="muted mt-5 max-w-2xl text-lg leading-8">
              {copy.home.featuredIntro}
            </p>
          </div>

          <div className="mt-12 grid gap-5 lg:grid-cols-12 2xl:gap-6">
            {featured.map((skill, index) => (
              <div
                key={skill.slug}
                className={`homepage-entry-card rounded-[2rem] border border-[var(--panel-outline)] bg-[var(--surface-strong)] ${
                  index === 0
                    ? "lg:col-span-6 lg:row-span-2"
                    : index < 3
                      ? "lg:col-span-3"
                      : "lg:col-span-4"
                }`}
              >
                <Link
                  className={`group relative block h-full overflow-hidden rounded-[2rem] ${
                    index === 0 ? "homepage-feature-hero p-7 lg:p-8" : "homepage-feature-card p-6"
                  } ${
                    index === 0 ? "min-h-[520px] lg:p-8" : "min-h-[240px]"
                  }`}
                  href={prefixLocalePath(getSkillDetailPath(skill.slug, locale), locale)}
                  prefetch={false}
                >
                  <div className="homepage-card-glow absolute -right-10 -top-10 h-36 w-36 rounded-full opacity-80" />
                  <div className="homepage-card-glow-secondary absolute bottom-[-3rem] left-[-1rem] h-28 w-28 rounded-full opacity-65" />
                  <div className="relative flex h-full flex-col">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="homepage-light-chip">
                            {String(index + 1).padStart(2, "0")}
                          </span>
                          <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--ink-muted)]">
                            {skill.publisher}
                          </span>
                        </div>
                        <h3
                          className={`surface-strong mt-4 font-semibold ${
                            index === 0 ? "max-w-xl text-[2.5rem] leading-[1.02]" : "text-[1.7rem] leading-tight"
                          }`}
                        >
                          {skill.name}
                        </h3>
                      </div>
                    </div>

                    <p
                      className={`muted mt-5 max-w-xl leading-7 ${
                        index === 0 ? "text-base" : "text-[15px]"
                      }`}
                    >
                      {skill.description}
                    </p>

                    <div className="mt-auto pt-8">
                      <div className="flex items-center justify-between gap-3 border-t border-[rgba(225,6,0,0.08)] pt-4">
                        <span className="text-sm font-medium text-[var(--accent)]">
                          {getTrustLevelLabel(skill.trustLevel, locale)}
                        </span>
                        <div className="surface-muted text-sm font-medium transition group-hover:surface-strong">
                          {locale === "zh-CN" ? "打开 skill →" : "Open skill →"}
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="page-shell py-20 2xl:py-24">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="eyebrow text-[var(--accent)]">{locale === "zh-CN" ? "生态入口" : "Ecosystems"}</p>
            <h2 className="display mt-3 text-5xl font-semibold tracking-[-0.04em] 2xl:text-6xl">
              {locale === "zh-CN" ? "先看你熟悉的生态，再点进去。" : "Start with the ecosystems you already know."}
            </h2>
            <p className="muted mt-4 max-w-2xl text-lg leading-8">
              {locale === "zh-CN"
                ? "很多人不是先找 skill 名，而是先看自己熟悉的公司或平台。"
                : "Many people start from the company or platform they already trust."}
            </p>
          </div>
          <Link className="text-sm font-medium text-[var(--accent)]" href={prefixLocalePath("/skills", locale)}>
            {locale === "zh-CN" ? "查看全部" : "See all skills"}
          </Link>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {ecosystemPublishers.map((publisher) => (
            <Link
              key={publisher.slug}
              className="homepage-entry-card flex min-h-[160px] flex-col justify-between rounded-[1.55rem] border border-[var(--panel-outline)] bg-[var(--surface-strong)] p-5 transition hover:-translate-y-0.5 hover:border-[var(--accent-soft)] hover:shadow-[0_24px_54px_rgba(56,49,36,0.12)]"
              href={prefixLocalePath(`/skills?publisher=${publisher.slug}`, locale)}
            >
              <div>
                <p className="homepage-mini-kicker">
                  {publisher.count} {locale === "zh-CN" ? "个 skill" : "skills"}
                </p>
                <div className="mt-4">
                  <PublisherLogo name={publisher.name} size="sm" slug={publisher.slug} />
                </div>
              </div>
              <span className="homepage-inline-link">
                {locale === "zh-CN" ? "进入生态" : "Open ecosystem"}
              </span>
            </Link>
          ))}
        </div>
      </section>

      <SiteFooter locale={locale} />
    </main>
  );
}

export default async function Home() {
  return <HomePage locale={await getRequestLocale()} />;
}
