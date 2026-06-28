import { existsSync } from "node:fs";
import path from "node:path";
import Link from "next/link";
import { GlareCard } from "@/components/glare-card";
import { PublisherLogo } from "@/components/publisher-logo";
import { PublisherLogoMarquee } from "@/components/publisher-logo-marquee";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { getFeaturedSkills, getPublishers, getRoles, getStats } from "@/lib/skills";
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
  const roles = getRoles();
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
      <section className="hero-grid relative overflow-hidden py-6">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="hero-orb absolute left-1/2 top-[-5rem] h-72 w-72 -translate-x-1/2 rounded-full bg-[rgba(225,6,0,0.14)] blur-3xl" />
          <div className="hero-orb absolute right-[-5rem] top-40 h-80 w-80 rounded-full bg-[rgba(13,23,38,0.12)] blur-3xl [animation-delay:1.5s]" />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.18),rgba(255,255,255,0))]" />
        </div>
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

        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <GlareCard className="rounded-[1.75rem]">
            <Link className="glass skill-card block rounded-[1.75rem] p-6" href={prefixLocalePath("/skills?publisher=googleworkspace", locale)}>
              <p className="eyebrow muted">{locale === "zh-CN" ? "常用入口" : "Common starting point"}</p>
              <div className="mt-4">
                <PublisherLogo name="Google Workspace" size="sm" slug="googleworkspace" />
              </div>
              <p className="mt-4 text-xl font-semibold">Google Workspace</p>
              <p className="muted mt-3 text-sm leading-6">
                {locale === "zh-CN"
                  ? "如果你常用 Google Workspace，可以直接从这里开始找。"
                  : "If you already work in Google Workspace, this is an easy place to start."}
              </p>
            </Link>
          </GlareCard>
          <GlareCard className="rounded-[1.75rem]">
            <Link className="glass skill-card block rounded-[1.75rem] p-6" href={prefixLocalePath("/skills?publisher=microsoft", locale)}>
              <p className="eyebrow muted">{locale === "zh-CN" ? "官方出品" : "Official teams"}</p>
              <div className="mt-4">
                <PublisherLogo name="Microsoft" size="sm" slug="microsoft" />
              </div>
              <p className="mt-4 text-xl font-semibold">Microsoft</p>
              <p className="muted mt-3 text-sm leading-6">
                {locale === "zh-CN"
                  ? "如果你平时主要用微软生态，从这里开始会更顺。"
                  : "If most of your work already lives in Microsoft tools, start here."}
              </p>
            </Link>
          </GlareCard>
          <GlareCard className="rounded-[1.75rem]">
            <Link className="glass skill-card block rounded-[1.75rem] p-6" href={prefixLocalePath("/skills?publisher=anthropics", locale)}>
              <p className="eyebrow muted">{locale === "zh-CN" ? "公司" : "Company"}</p>
              <div className="mt-4">
                <PublisherLogo name="Anthropics" size="sm" slug="anthropics" />
              </div>
              <p className="mt-4 text-xl font-semibold">Anthropics</p>
              <p className="muted mt-3 text-sm leading-6">
                {locale === "zh-CN"
                  ? "如果你就是冲着 Anthropic 来的，这里最直接。"
                  : "If you are specifically looking for Anthropic skills, start here."}
              </p>
            </Link>
          </GlareCard>
          <GlareCard className="rounded-[1.75rem]">
            <Link className="glass skill-card block rounded-[1.75rem] p-6" href={prefixLocalePath("/skills?publisher=openai", locale)}>
              <p className="eyebrow muted">{locale === "zh-CN" ? "公司" : "Company"}</p>
              <div className="mt-4">
                <PublisherLogo name="OpenAI" size="sm" slug="openai" />
              </div>
              <p className="mt-4 text-xl font-semibold">OpenAI</p>
              <p className="muted mt-3 text-sm leading-6">
                {locale === "zh-CN"
                  ? "如果你想先看 OpenAI 相关 skill，可以直接进这里。"
                  : "If you want OpenAI-related skills first, go straight here."}
              </p>
            </Link>
          </GlareCard>
        </div>

        <PublisherLogoMarquee locale={locale} publishers={marqueePublishers} />
      </section>

      <section className="page-shell py-6 pb-14">
        <div className="space-y-6">
          <div className="surface-panel rounded-[2rem] p-6 sm:p-7">
            <div className="max-w-3xl">
              <p className="eyebrow text-[var(--accent)]">{copy.skills.browseByRole}</p>
              <h2 className="display mt-4 text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
                {locale === "zh-CN" ? "先按角色来找。" : "Start with your role."}
              </h2>
              <p className="muted mt-4 max-w-2xl text-base leading-7">
                {copy.home.roleIntro}
              </p>
            </div>
            <div className="mt-6 grid gap-3 xl:grid-cols-2">
              {roles.map((role) => (
                <GlareCard key={role.slug} className="rounded-[1.5rem]">
                  <Link
                    className="surface-panel-soft block rounded-[1.5rem] p-5 transition hover:bg-[var(--panel-soft-hover)]"
                    href={prefixLocalePath(`/roles/${role.slug}`, locale)}
                  >
                    <p className="text-xl font-semibold">{copy.roleLabels[role.slug] ?? role.label}</p>
                    <p className="muted mt-2 text-sm leading-6">
                      {copy.roleSummaries[role.slug] ?? role.summary}
                    </p>
                  </Link>
                </GlareCard>
              ))}
            </div>
          </div>

          <div className="glass rounded-[2rem] p-6 sm:p-7">
            <div className="max-w-3xl">
              <p className="eyebrow muted">{locale === "zh-CN" ? "按任务找" : "Find by task"}</p>
              <h2 className="mt-4 text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
                {locale === "zh-CN" ? "或者直接按任务找。" : "Or go straight to the task."}
              </h2>
              <p className="muted mt-4 max-w-2xl text-base leading-7">
                {copy.home.taskIntro}
              </p>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {taskCards.map((task) => (
                <GlareCard key={task.label} className="rounded-[1.35rem]">
                  <Link
                    className="surface-panel-soft group block rounded-[1.35rem] p-4 transition hover:bg-[var(--panel-soft-hover)]"
                    href={task.href}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-base font-semibold leading-6">{task.label}</p>
                      <span className="text-[11px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
                        {locale === "zh-CN" ? "进入" : "Open"}
                      </span>
                    </div>
                    <p className="muted mt-3 text-sm leading-6">{task.summary}</p>
                  </Link>
                </GlareCard>
              ))}
            </div>
            <div className="mt-6 rounded-[1.4rem] border border-[var(--border-soft)] bg-[var(--surface-strong)] px-4 py-3">
              <p className="text-sm leading-6 text-[var(--ink-muted)]">
                {locale === "zh-CN"
                  ? "如果你已经知道要找什么，直接搜索最快。"
                  : "If you already know what you want, search is the fastest path."}
              </p>
              <Link className="mt-2 inline-flex text-sm font-medium text-[var(--accent)]" href={prefixLocalePath("/skills", locale)}>
                {locale === "zh-CN" ? "查看全部" : "See all skills"}
              </Link>
            </div>
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

          <div className="mt-12 grid gap-5 lg:grid-cols-2 2xl:grid-cols-4 2xl:gap-6">
            {featured.map((skill, index) => (
              <GlareCard key={skill.slug} className="rounded-[2rem]">
                <Link
                  className="group surface-panel-soft block rounded-[2rem] p-6 transition hover:bg-[var(--panel-soft-hover)]"
                  href={prefixLocalePath(getSkillDetailPath(skill.slug, locale), locale)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="eyebrow surface-muted">
                        {String(index + 1).padStart(2, "0")} · {skill.publisher}
                      </p>
                      <h3 className="surface-strong mt-4 text-2xl font-semibold">{skill.name}</h3>
                    </div>
                    <span className="surface-panel-outline surface-muted rounded-full border px-3 py-1 text-xs uppercase tracking-[0.24em]">
                      {skill.kind}
                    </span>
                  </div>
                  <p className="muted mt-5 max-w-xl leading-7">{skill.description}</p>
                  <div className="surface-muted mt-6 text-sm font-medium transition group-hover:surface-strong">
                    {locale === "zh-CN" ? "打开 skill →" : "Open skill →"}
                  </div>
                </Link>
              </GlareCard>
            ))}
          </div>
        </div>
      </section>

      <section className="page-shell py-20 2xl:py-24">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="eyebrow text-[var(--accent)]">{locale === "zh-CN" ? "发布方" : "Publishers"}</p>
            <h2 className="display mt-3 text-5xl font-semibold tracking-[-0.04em] 2xl:text-6xl">
              {locale === "zh-CN" ? "如果你信任某个生态，就直接从那里开始。" : "If you trust an ecosystem, start there."}
            </h2>
            <p className="muted mt-4 max-w-2xl text-lg leading-8">
              {locale === "zh-CN"
                ? "很多用户并不是先找 skill 名，而是先找熟悉的发布方。"
                : "Many users start from the publisher they already know, not the exact skill name."}
            </p>
          </div>
          <Link className="text-sm font-medium text-[var(--accent)]" href={prefixLocalePath("/skills", locale)}>
            {locale === "zh-CN" ? "查看全部" : "See all skills"}
          </Link>
        </div>
        <p className="muted mt-6 max-w-3xl text-base leading-7">
          {locale === "zh-CN"
            ? "先扫一眼常见发布方，再点进你熟悉或更信任的那一个。"
            : "Scan the major publishers first, then jump into the one you already know or trust most."}
        </p>
      </section>

      <section className="page-shell py-6 pb-14">
        <div className="surface-panel rounded-[2rem] p-6 sm:p-7">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="eyebrow text-[var(--accent)]">
                {locale === "zh-CN" ? "来自 LionSaid 的其他站点" : "More from LionSaid"}
              </p>
              <h2 className="display mt-3 text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
                {locale === "zh-CN" ? "如果你想换个轻松点的入口，也可以顺手看看。" : "If you want a lighter detour, these are worth a quick look."}
              </h2>
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <a
              className="glass group block rounded-[1.75rem] border border-[var(--border-soft)] p-6 transition hover:-translate-y-0.5 hover:border-[var(--accent)]"
              href="https://sudoku.lionsaid.com/"
              rel="noreferrer"
              target="_blank"
            >
              <p className="eyebrow muted">Sudoku</p>
              <h3 className="mt-3 text-2xl font-semibold">Sudoku.lionsaid.com</h3>
              <p className="muted mt-3 max-w-xl leading-7">
                {locale === "zh-CN"
                  ? "想休息一下的时候，去做一盘数独。"
                  : "Take a short break and solve a quick puzzle."}
              </p>
              <div className="mt-5 text-sm font-medium text-[var(--accent)]">
                {locale === "zh-CN" ? "打开数独 →" : "Open Sudoku →"}
              </div>
            </a>

            <a
              className="glass group block rounded-[1.75rem] border border-[var(--border-soft)] p-6 transition hover:-translate-y-0.5 hover:border-[var(--accent)]"
              href="https://copybook.lionsaid.com/"
              rel="noreferrer"
              target="_blank"
            >
              <p className="eyebrow muted">Copybook</p>
              <h3 className="mt-3 text-2xl font-semibold">Copybook.lionsaid.com</h3>
              <p className="muted mt-3 max-w-xl leading-7">
                {locale === "zh-CN"
                  ? "适合顺手收集、记录和整理内容。"
                  : "A simple place to capture and organize notes."}
              </p>
              <div className="mt-5 text-sm font-medium text-[var(--accent)]">
                {locale === "zh-CN" ? "打开 Copybook →" : "Open Copybook →"}
              </div>
            </a>
          </div>
        </div>
      </section>

      <SiteFooter locale={locale} />
    </main>
  );
}

export default async function Home() {
  return <HomePage locale={await getRequestLocale()} />;
}
