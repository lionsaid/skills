import Link from "next/link";
import { GlareCard } from "@/components/glare-card";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getRolePrioritySkills, getRoles, getSkillsByJob, getStarterSkillsForRole } from "@/lib/skills";
import { getCopy } from "@/lib/i18n";
import { getRequestLocale } from "@/lib/request-locale";

export default async function RolesPage() {
  const locale = await getRequestLocale();
  const copy = getCopy(locale);
  const roles = getRoles();

  return (
    <main className="grain flex flex-1 flex-col overflow-x-hidden pb-28 sm:pb-0">
      <section className="hero-grid relative overflow-hidden py-6">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="hero-orb absolute left-[12%] top-12 h-72 w-72 rounded-full bg-[rgba(225,6,0,0.14)] blur-3xl" />
          <div className="hero-orb absolute right-[6%] top-28 h-80 w-80 rounded-full bg-[rgba(88,38,28,0.14)] blur-3xl [animation-delay:1.2s]" />
        </div>
        <SiteHeader currentPath="/roles" locale={locale} />

        <div className="page-shell py-12 lg:py-16">
          <div className="glass relative overflow-hidden rounded-[2.4rem] p-7 sm:p-9 lg:p-12">
            <p className="eyebrow text-[var(--accent)]">{copy.roles.eyebrow}</p>
            <h1 className="display mt-5 max-w-4xl text-5xl leading-[0.95] font-semibold tracking-[-0.045em] sm:text-6xl lg:text-[5.2rem]">
              {copy.roles.title}
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-[var(--ink-muted)]">
              {copy.roles.subtitle}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                className="inline-flex min-w-[10rem] items-center justify-center whitespace-nowrap rounded-full border border-[var(--accent)] bg-[var(--accent)] px-5 py-3 text-sm font-medium text-white shadow-[0_12px_26px_rgba(225,6,0,0.22)] transition hover:opacity-95"
                href="/skills"
              >
                {copy.roles.openCatalog}
              </Link>
              <Link
                className="rounded-full border border-[var(--border-soft)] bg-[var(--surface-strong)] px-5 py-3 text-sm font-medium text-[var(--foreground)] transition hover:bg-[var(--surface)]"
                href="/skills?kind=official"
              >
                {copy.roles.officialOnly}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="page-shell py-8 pb-16">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow text-[var(--accent)]">{copy.roles.allRoles}</p>
            <h2 className="display mt-3 text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
              {locale === "zh-CN" ? "每个角色都先给你一组更值得先看的推荐。" : "Each role starts with a set of skills worth opening first."}
            </h2>
          </div>
          <Link className="text-sm font-medium text-[var(--accent)]" href="/skills">
            {copy.roles.viewAllSkills}
          </Link>
        </div>

        <div className="mt-8 grid gap-6 xl:grid-cols-2">
          {roles.map((role) => {
            const curatedCount = getRolePrioritySkills(role.slug, 10).length;
            const starters = getStarterSkillsForRole(role.slug).slice(0, 3);
            const roleLabel = copy.roleLabels[role.slug] ?? role.label;
            const roleSummary = copy.roleSummaries[role.slug] ?? role.summary;

            return (
              <section key={role.slug} className="surface-panel rounded-[2rem] p-6 sm:p-7">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="eyebrow surface-muted">{locale === "zh-CN" ? "适合这类工作" : "Best for"}</p>
                    <h3 className="mt-3 text-3xl font-semibold tracking-[-0.03em]">
                      {roleLabel}
                    </h3>
                    <p className="muted mt-3 max-w-2xl text-sm leading-7">{roleSummary}</p>
                  </div>
                  <div className="rounded-[1.25rem] border border-[var(--border-soft)] bg-[var(--surface-strong)] px-4 py-3 text-right">
                    <p className="text-3xl font-semibold leading-none text-[var(--foreground)]">{curatedCount}</p>
                    <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
                      {copy.roles.curatedSkills}
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap gap-2">
                  {role.jobs.map((job) => (
                    <Link
                      key={job}
                      className="rounded-full border border-[var(--border-soft)] bg-[var(--surface-strong)] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--foreground)] transition hover:bg-[var(--surface)]"
                      href={`/skills?persona=${role.slug}&job=${job}`}
                    >
                      {copy.taskLabels[job] ?? job}
                    </Link>
                  ))}
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  {starters.map((skill) => (
                    <GlareCard key={skill.slug} className="rounded-[1.4rem]">
                      <Link
                        className="surface-panel-soft block rounded-[1.4rem] p-4 transition hover:bg-[var(--panel-soft-hover)]"
                        href={`/skills/${skill.slug}`}
                      >
                        <p className="eyebrow surface-muted">{skill.publisher}</p>
                        <p className="mt-3 text-base font-semibold leading-6">{skill.name}</p>
                      </Link>
                    </GlareCard>
                  ))}
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <Link
                    className="inline-flex min-w-[9.5rem] items-center justify-center whitespace-nowrap rounded-full border border-[var(--accent)] bg-[var(--accent)] px-5 py-3 text-sm font-medium text-white shadow-[0_12px_26px_rgba(225,6,0,0.22)] transition hover:opacity-95"
                    href={`/roles/${role.slug}`}
                  >
                    {locale === "zh-CN" ? `查看 ${roleLabel}推荐` : `View ${roleLabel}`}
                  </Link>
                  <Link
                    className="rounded-full border border-[var(--border-soft)] bg-[var(--surface-strong)] px-5 py-3 text-sm font-medium text-[var(--foreground)] transition hover:bg-[var(--surface)]"
                    href={`/skills?persona=${role.slug}`}
                  >
                    {copy.roles.viewAllSkills}
                  </Link>
                </div>
              </section>
            );
          })}
        </div>
      </section>

      <section className="page-shell pb-20">
          <div className="surface-panel rounded-[2rem] p-6 sm:p-7">
            <p className="eyebrow text-[var(--accent)]">{copy.roles.taskHeading}</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
              {copy.roles.openAllRoleCatalog}
            </h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {roles.flatMap((role) =>
              role.jobs.slice(0, 2).map((job) => ({
                key: `${role.slug}-${job}`,
                role: role.label,
                roleSlug: role.slug,
                job,
                count: getSkillsByJob(job).filter((skill) => skill.personas.includes(role.slug)).length,
              })),
            ).slice(0, 8).map((item) => (
              <GlareCard key={item.key} className="rounded-[1.5rem]">
                <Link
                  className="surface-panel-soft block rounded-[1.5rem] p-5 transition hover:bg-[var(--panel-soft-hover)]"
                  href={`/skills?persona=${item.roleSlug}&job=${item.job}`}
                >
                  <p className="eyebrow surface-muted">{copy.roleLabels[item.roleSlug] ?? item.role}</p>
                  <h3 className="mt-3 text-xl font-semibold">{copy.taskLabels[item.job] ?? item.job}</h3>
                  <p className="muted mt-3 text-sm leading-6">
                    {locale === "zh-CN"
                      ? `这里有 ${item.count} 个相关 skill。`
                      : `${item.count} related skills here.`}
                  </p>
                </Link>
              </GlareCard>
            ))}
          </div>
        </div>
      </section>

      <SiteFooter locale={locale} />
    </main>
  );
}
