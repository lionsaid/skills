import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getRolePrioritySkills, getStarterSkillsForRole, getRoleBySlug, getSkillsForRole } from "@/lib/skills";
import { getCopy } from "@/lib/i18n";
import { getRequestLocale } from "@/lib/request-locale";

type RolePageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function RolePage({ params }: RolePageProps) {
  const locale = await getRequestLocale();
  const copy = getCopy(locale);
  const { slug } = await params;
  const role = getRoleBySlug(slug);

  if (!role) {
    notFound();
  }

  const skills = getSkillsForRole(role.slug);
  const prioritySkills = getRolePrioritySkills(role.slug, 10);
  const starterSkills = getStarterSkillsForRole(role.slug);
  const roleLabel = copy.roleLabels[role.slug] ?? role.label;
  const roleHero = copy.roleHeroes[role.slug] ?? role.hero;
  const grouped = role.jobs
    .map((job) => ({
      job,
      label: copy.taskLabels[job] ?? job,
      skills: skills
        .filter((skill) => skill.jobs.includes(job))
        .filter((skill) => prioritySkills.some((match) => match.slug === skill.slug))
        .filter((skill) => !starterSkills.some((starter) => starter.slug === skill.slug))
        .slice(0, 8),
    }))
    .filter((group) => group.skills.length > 0);

  return (
    <main className="grain flex flex-1 flex-col overflow-x-hidden pb-28 sm:pb-0">
      <section className="hero-grid relative overflow-hidden py-6">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="hero-orb absolute left-[12%] top-16 h-72 w-72 rounded-full bg-[rgba(225,6,0,0.16)] blur-3xl" />
          <div className="hero-orb absolute right-[8%] top-24 h-80 w-80 rounded-full bg-[rgba(88,38,28,0.12)] blur-3xl [animation-delay:1.4s]" />
        </div>
        <SiteHeader currentPath="/roles" locale={locale} />

        <div className="page-shell py-12 lg:py-16">
          <div className="glass relative overflow-hidden rounded-[2.4rem] p-7 sm:p-9 lg:p-12">
            <p className="eyebrow text-[var(--accent)]">{locale === "zh-CN" ? "按角色找" : "Find by role"}</p>
            <h1 className="display mt-5 max-w-4xl text-5xl leading-[0.95] font-semibold tracking-[-0.045em] sm:text-6xl lg:text-[5.2rem]">
              {roleLabel}
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-[var(--ink-muted)]">
              {roleHero}
            </p>
            <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--ink-muted)]">
              {locale === "zh-CN"
                ? `先从这 ${prioritySkills.length} 个推荐 skill 开始，再按任务继续缩小范围。`
                : `Start with these ${prioritySkills.length} recommended skills, then narrow further by task if you need to.`}
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                className="inline-flex min-w-[11rem] items-center justify-center whitespace-nowrap rounded-full border border-[var(--accent)] bg-[var(--accent)] px-5 py-3 text-sm font-medium text-white shadow-[0_12px_26px_rgba(225,6,0,0.22)] transition hover:opacity-95"
                href={`/skills?persona=${role.slug}&enterprise=1&trust=official`}
              >
                {copy.roles.startWithOfficial}
              </Link>
              <Link
                  className="rounded-full border border-[var(--border-soft)] bg-white/75 px-5 py-3 text-sm font-medium transition hover:bg-white"
                  href={`/skills?persona=${role.slug}`}
              >
                {locale === "zh-CN"
                  ? `查看全部 ${roleLabel} 相关 skill`
                  : `See all ${roleLabel} skills`}
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap gap-2">
              {role.featuredQueries.map((query) => (
                <Link
                  key={query}
                  className="rounded-full border border-[var(--border-soft)] bg-[var(--surface-strong)] px-4 py-2 text-sm font-medium transition hover:bg-white"
                  href={`/skills?persona=${role.slug}&q=${encodeURIComponent(query)}`}
                >
                  {copy.queryLabels[query] ?? query}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="page-shell py-8 pb-16">
        <section className="surface-panel mb-8 rounded-[2rem] p-6 sm:p-7">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="eyebrow text-[var(--accent)]">{locale === "zh-CN" ? "入门包" : "Starter pack"}</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
                {locale === "zh-CN" ? "建议先看这几个推荐" : "Start with these skills first"}
              </h2>
              <p className="muted mt-3 max-w-2xl text-sm leading-7">
                {locale === "zh-CN"
                  ? "如果你不想自己从头筛，这里可以先打开。"
                  : "If you do not want to sort through everything yourself, start here."}
              </p>
            </div>
              <Link className="text-sm font-medium text-[var(--accent)]" href={`/skills?persona=${role.slug}`}>
              {copy.roles.viewAllSkills}
            </Link>
          </div>

              <div className="mt-6 grid gap-4 lg:grid-cols-2 xl:grid-cols-5">
            {prioritySkills.map((skill, index) => (
                <Link
                  key={skill.slug}
                  className="surface-panel-soft rounded-[1.5rem] p-5 transition hover:bg-[var(--panel-soft-hover)]"
                  href={`/skills/${skill.slug}`}
                >
                  <p className="eyebrow surface-muted">{String(index + 1).padStart(2, "0")} · {skill.publisher}</p>
                  <h3 className="mt-3 text-lg font-semibold leading-6">{skill.name}</h3>
                  <p className="muted mt-3 text-sm leading-6">{skill.description}</p>
                </Link>
              ))}
          </div>
        </section>

        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow text-[var(--accent)]">{copy.skills.browseByTask}</p>
            <h2 className="display mt-3 text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
              {locale === "zh-CN" ? "再按任务继续往下找。" : "Keep going by task."}
            </h2>
          </div>
          <Link className="text-sm font-medium text-[var(--accent)]" href={`/skills?persona=${role.slug}`}>
            {copy.roles.viewAllSkills}
          </Link>
        </div>

        <div className="mt-8 grid gap-6">
          {grouped.map((group) => (
            <section key={group.job} className="surface-panel rounded-[2rem] p-6 sm:p-7">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="eyebrow surface-muted">{locale === "zh-CN" ? "任务" : "Task"}</p>
                  <h3 className="mt-3 text-3xl font-semibold tracking-[-0.03em]">
                    {locale === "zh-CN" ? (copy.taskLabels[group.job] ?? group.label) : group.label}
                  </h3>
                </div>
                <Link
                  className="text-sm font-medium text-[var(--accent)]"
                  href={`/skills?persona=${role.slug}&job=${group.job}`}
                >
                  {locale === "zh-CN"
                    ? `查看全部 ${copy.taskLabels[group.job] ?? group.label}`
                    : `View all in ${group.label}`}
                </Link>
              </div>

              <div className="mt-6 grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
                {group.skills.map((skill) => (
                  <Link
                    key={skill.slug}
                    className="surface-panel-soft rounded-[1.5rem] p-5 transition hover:bg-[var(--panel-soft-hover)]"
                    href={`/skills/${skill.slug}`}
                  >
                    <p className="eyebrow surface-muted">{skill.publisher}</p>
                    <h4 className="mt-3 text-xl font-semibold">{skill.name}</h4>
                    <p className="muted mt-3 text-sm leading-6">{skill.description}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {skill.jobs.slice(0, 2).map((job) => (
                        <span
                          key={job}
                          className="rounded-full border border-[var(--border-soft)] bg-white/70 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em]"
                        >
                          {copy.taskLabels[job] ?? job}
                        </span>
                      ))}
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      </section>

      <SiteFooter locale={locale} />
    </main>
  );
}
