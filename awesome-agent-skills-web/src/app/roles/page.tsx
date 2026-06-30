import Link from "next/link";
import type { Metadata } from "next";
import { GlareCard } from "@/components/glare-card";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getRolePrioritySkills, getRoles, getSkillBySlug, getSkillsByJob, getStarterSkillsForRole } from "@/lib/skills";
import { getCopy, getSkillDetailPath, prefixLocalePath, type Locale } from "@/lib/i18n";
import { getRequestLocale } from "@/lib/request-locale";
import { buildMetadata, getLocalizedDescription } from "@/lib/seo";
import type { Skill } from "@/lib/skills";

export function generateMetadata(): Metadata {
  return buildMetadata({
    title: "Roles",
    path: "/roles",
    description: getLocalizedDescription("en"),
  });
}

type PageProps = { locale: Locale };

const rolePreviewSkillOverrides: Partial<Record<string, string[]>> = {
  engineer: [
    "microsoft-copilot-sdk",
    "anthropics-webapp-testing",
    "openai-gh-fix-ci",
  ],
};

function pickPreviewSkills(roleSlug: string) {
  const selected: Skill[] = [];
  const overridden = (rolePreviewSkillOverrides[roleSlug] ?? [])
    .map((slug) => getSkillBySlug(slug))
    .filter((skill): skill is Skill => Boolean(skill));

  for (const skill of overridden) {
    if (selected.length >= 3) {
      break;
    }

    if (selected.some((item) => item.publisherSlug === skill.publisherSlug)) {
      continue;
    }

    selected.push(skill);
  }

  for (const skill of getStarterSkillsForRole(roleSlug)) {
    if (selected.length >= 3) {
      break;
    }

    if (selected.some((item) => item.publisherSlug === skill.publisherSlug)) {
      continue;
    }

    selected.push(skill);
  }

  return selected;
}

export async function RolesPageContent({ locale }: PageProps) {
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
                className="action-primary inline-flex min-w-[10rem] items-center justify-center whitespace-nowrap rounded-full border px-5 py-3 text-sm font-semibold transition"
                href={prefixLocalePath("/skills", locale)}
              >
                {copy.roles.openCatalog}
              </Link>
              <Link
                className="action-secondary inline-flex min-w-[10rem] items-center justify-center whitespace-nowrap rounded-full border px-5 py-3 text-sm font-semibold transition"
                href={prefixLocalePath("/skills?kind=official", locale)}
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
              {locale === "zh-CN" ? "先看看不同角色最常用的 skill。" : "Start with the skills people in each role use most."}
            </h2>
          </div>
          <Link
            className="inline-flex min-w-[9.5rem] items-center justify-center whitespace-nowrap rounded-full border border-[var(--foreground)] bg-[var(--foreground)] px-4 py-2 text-sm font-semibold text-[var(--background)] shadow-[0_8px_18px_rgba(0,0,0,0.2)] transition hover:opacity-95"
            href={prefixLocalePath("/skills", locale)}
          >
            {copy.roles.viewAllSkills}
          </Link>
        </div>

        <div className="mt-8 grid gap-6 xl:grid-cols-2">
          {roles.map((role) => {
            const curatedCount = getRolePrioritySkills(role.slug, 10).length;
            const starters = pickPreviewSkills(role.slug);
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
                      className="action-chip inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] transition"
                      href={prefixLocalePath(`/skills?persona=${role.slug}&job=${job}`, locale)}
                    >
                      {copy.taskLabels[job] ?? job}
                    </Link>
                  ))}
                </div>

                <div className="mt-6 overflow-hidden rounded-[1.45rem] border border-[var(--panel-outline)] bg-[var(--surface-strong)]">
                  {starters.map((skill) => (
                    <Link
                      key={skill.slug}
                      className="role-skill-spotlight group flex min-h-[5.75rem] items-center justify-between gap-4 border-b border-[var(--panel-outline)] px-5 py-4 transition last:border-b-0"
                      href={prefixLocalePath(getSkillDetailPath(skill.slug, locale), locale)}
                      prefetch={false}
                    >
                      <div className="min-w-0">
                        <p className="eyebrow surface-muted">{skill.publisher}</p>
                        <p className="mt-2 text-base font-semibold leading-6">
                          {skill.name}
                        </p>
                      </div>
                      <span className="action-chip shrink-0 inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] transition group-hover:translate-x-0.5">
                        {locale === "zh-CN" ? "查看" : "Open"}
                      </span>
                    </Link>
                  ))}
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <Link
                    className="action-primary inline-flex min-w-[9.5rem] items-center justify-center whitespace-nowrap rounded-full border px-5 py-3 text-sm font-semibold transition"
                    href={prefixLocalePath(`/roles/${role.slug}`, locale)}
                  >
                    {locale === "zh-CN" ? `查看 ${roleLabel}推荐` : `View ${roleLabel}`}
                  </Link>
                  <Link
                    className="action-secondary inline-flex min-w-[9.5rem] items-center justify-center whitespace-nowrap rounded-full border px-5 py-3 text-sm font-semibold transition"
                    href={prefixLocalePath(`/skills?persona=${role.slug}`, locale)}
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
          <div className="mt-6 grid gap-px overflow-hidden rounded-[1.55rem] border border-[var(--panel-outline)] bg-[var(--panel-outline)] md:grid-cols-2 xl:grid-cols-4">
            {roles.flatMap((role) =>
              role.jobs.slice(0, 2).map((job) => ({
                key: `${role.slug}-${job}`,
                role: role.label,
                roleSlug: role.slug,
                job,
                count: getSkillsByJob(job).filter((skill) => skill.personas.includes(role.slug)).length,
              })),
            ).slice(0, 8).map((item) => (
              <GlareCard key={item.key} className="glare-card-flat rounded-[1.5rem]">
                <Link
                  className="block bg-[var(--panel-soft)] p-5 transition hover:bg-[var(--panel-soft-hover)]"
                  href={prefixLocalePath(`/skills?persona=${item.roleSlug}&job=${item.job}`, locale)}
                >
                  <p className="eyebrow surface-muted">{copy.roleLabels[item.roleSlug] ?? item.role}</p>
                  <h3 className="mt-3 text-xl font-semibold">{copy.taskLabels[item.job] ?? item.job}</h3>
                  <p className="muted mt-3 text-sm leading-6">
                    {locale === "zh-CN"
                      ? `${item.count} 个相关 skill`
                      : `${item.count} related skills`}
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

export default async function RolesPage() {
  return <RolesPageContent locale={await getRequestLocale()} />;
}
