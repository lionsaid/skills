import { execSync } from "node:child_process";
import path from "node:path";
import Link from "next/link";
import type { Metadata } from "next";
import { InfoPageShell } from "@/components/info-page-shell";
import { buildMetadata } from "@/lib/seo";
import { getRequestLocale } from "@/lib/request-locale";
import { prefixLocalePath, type Locale } from "@/lib/i18n";

type TimelineEntry = {
  hash: string;
  date: string;
  subject: string;
  body: string[];
};

const UPDATE_TRANSLATIONS: Record<
  string,
  {
    enSubject: string;
    enBody: string[];
  }
> = {
  "10940c7": {
    enSubject: "feat(data): added multi-source skill ingestion and dark theme support",
    enBody: [
      "Added data collection from multiple sources, including local files, remote HTML pages, marketplace APIs, and GitHub repo expansion.",
      "Introduced deduping and merge logic for skill records, with trust levels and risk markers.",
      "Integrated GitHub repo expansion so the pipeline can discover and parse skill repos automatically.",
      "Added dark theme support with a full set of CSS variables and component-level styling updates.",
      "Added repo stats generation for GitHub stars and forks.",
      "Refactored the data generation scripts to use configurable source management and parsing rules.",
      "Polished panels, cards, footers, and other UI surfaces for better theme consistency.",
      "Added source failure monitoring and stronger error handling.",
    ],
  },
  "41a742f": {
    enSubject: "feat(homepage): rebuilt the homepage layout and improved the browsing experience",
    enBody: [
      "Updated the page shell width logic to use min(1520px, calc(100vw - 1rem)).",
      "Adjusted shell sizing for smaller screens.",
      "Added hero orb and page reveal motion to improve the visual experience.",
      "Added support for reduced motion preferences.",
      "Rewrote the site description to focus on search-first discovery.",
      "Added base site URL and canonical metadata.",
      "Reduced the visible publisher count from 10 to 8.",
      "Added quick-start navigation links.",
      "Restructured the homepage to add search and stats sections.",
      "Added a simple explainer section for the three main ways to browse.",
      "Improved featured skill cards with better hover feedback and action cues.",
      "Redesigned the site header for responsive navigation.",
      "Added the mobile bottom navigation bar.",
      "Added the shrinking header behavior on scroll.",
      "Added a startup script to generate repository stats.",
      "Improved how the skills catalog loads data.",
      "Added a local filter selector component.",
      "Built the mobile filter panel.",
      "Integrated GitHub stars and fork stats into the catalog.",
      "Added a reset-all-filters action.",
    ],
  },
  e83020d: {
    enSubject: "feat(web): initialized the agent skills website",
    enBody: [
      "Added the project gitignore configuration.",
      "Created the initial Next.js app structure.",
      "Set up ESLint and Tailwind CSS.",
      "Added the category rules JSON configuration.",
      "Built the initial skill data generation script.",
      "Created the global styles and layout components.",
      "Built the site header component.",
      "Implemented the copy button interaction.",
      "Added SVG icons and manifest assets.",
      "Created the homepage and publisher routes.",
      "Implemented skill fetching and filtering logic.",
    ],
  },
};

function cleanTimelineNotes(body: string[]) {
  return body
    .map((line) => line.replace(/^[-*]\s*/, "").trim())
    .filter(Boolean);
}

function localizeTimelineEntry(entry: TimelineEntry, locale: Locale): TimelineEntry {
  if (locale === "zh-CN") {
    return entry;
  }

  const translation = UPDATE_TRANSLATIONS[entry.hash];
  if (!translation) {
    return entry;
  }

  return {
    ...entry,
    subject: translation.enSubject,
    body: translation.enBody,
  };
}

function getUpdateTimeline(locale: Locale): TimelineEntry[] {
  try {
    const repoRoot = path.resolve(process.cwd(), "..");
    const output = execSync(
      'git log --no-merges --date=short --format="%H%n%h%n%cs%n%s%n%b%n---" -- awesome-agent-skills-web',
      {
        cwd: repoRoot,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      },
    );

    const entries = output
      .split("\n---\n")
      .map((chunk) => chunk.trim())
      .filter(Boolean)
      .map((chunk) => {
        const [, shortHash, date, subject, ...bodyLines] = chunk.split("\n");
        return {
          hash: shortHash,
          date,
          subject,
          body: bodyLines.map((line) => line.trim()).filter(Boolean),
        };
      })
      .filter((entry) => entry.subject && !/^update$/i.test(entry.subject));

    const deduped = [];
    const seenSubjects = new Set<string>();

    for (const entry of entries) {
      if (seenSubjects.has(entry.subject)) {
        continue;
      }
      seenSubjects.add(entry.subject);
      deduped.push(entry);
      if (deduped.length >= 8) {
        break;
      }
    }

    if (deduped.length > 0) {
      return deduped;
    }
  } catch {
    // Fall through to fallback content if git metadata is unavailable.
  }

  return [
    {
      hash: "latest",
      date: locale === "zh-CN" ? "最近" : "Recently",
      subject:
        locale === "zh-CN"
          ? "搜索、筛选和移动端体验持续收口"
          : "Search, filters, and mobile UX kept getting tighter",
      body:
        locale === "zh-CN"
          ? ["修正误匹配", "减少状态残留", "让技能目录更稳定"]
          : ["Reduced false positives", "Tightened state sync", "Made the catalog more stable"],
    },
  ];
}

export function generateMetadata(): Metadata {
  return buildMetadata({
    title: "Updates",
    path: "/updates",
    description: "Recent product, data, and UX updates for LionSaid Skills.",
  });
}

export async function UpdatesPageContent({ locale }: { locale: Locale }) {
  const timelineEntries = getUpdateTimeline(locale);

  return (
    <InfoPageShell
      locale={locale}
      eyebrow={locale === "zh-CN" ? "更新历史" : "Updates"}
      title={locale === "zh-CN" ? "最近有哪些新变化，一眼就能看明白。" : "A clear look at what is new."}
      intro={
        locale === "zh-CN"
          ? "这里会持续记录最近的改动和优化，让你知道这个站点正在变得更好用。"
          : "A simple place to keep up with the latest improvements."
      }
    >
      <section className="page-shell py-8 pb-18">
        <div className="surface-panel relative overflow-hidden rounded-[2rem] p-6 sm:p-7 lg:p-9">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-[-3rem] top-10 h-40 w-40 rounded-full bg-[rgba(225,6,0,0.08)] blur-3xl" />
            <div className="absolute right-[-2rem] top-1/3 h-44 w-44 rounded-full bg-[rgba(24,24,24,0.05)] blur-3xl dark:bg-[rgba(255,255,255,0.04)]" />
          </div>

          <div className="relative space-y-8">
            {timelineEntries.map((rawEntry) => {
              const entry = localizeTimelineEntry(rawEntry, locale);
              const notes = cleanTimelineNotes(entry.body);
              const lead =
                notes[0] ??
                (locale === "zh-CN"
                  ? "这个版本主要完成了一轮内部整理与体验修正。"
                  : "This update focused on a round of internal cleanup and experience improvements.");
              const details = notes.slice(1);

              return (
                <article
                  key={`${entry.hash}-${entry.subject}`}
                  className="grid gap-5 border-t border-[rgba(225,6,0,0.08)] pt-8 first:border-t-0 first:pt-0 lg:grid-cols-[220px_minmax(0,1fr)]"
                >
                  <div className="relative">
                    <div className="sticky top-28">
                      <div className="inline-flex items-center gap-3 rounded-full border border-[rgba(225,6,0,0.14)] bg-[rgba(255,255,255,0.78)] px-3 py-2 shadow-[0_8px_24px_rgba(56,49,36,0.06)] dark:bg-[rgba(18,18,18,0.78)]">
                        <span className="inline-flex h-3 w-3 rounded-full bg-[var(--accent)] shadow-[0_0_0_5px_rgba(225,6,0,0.12)]" />
                        <span className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--ink-muted)]">
                          {entry.date}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="relative pl-6 sm:pl-8">
                    <div className="absolute left-0 top-1 h-full w-px bg-[linear-gradient(180deg,rgba(225,6,0,0.42),rgba(225,6,0,0.1)_70%,transparent)]" />
                    <div className="absolute left-[-0.34rem] top-1 h-3 w-3 rounded-full border border-[rgba(225,6,0,0.24)] bg-[var(--surface)] shadow-[0_0_0_6px_rgba(225,6,0,0.08)]" />

                    <div className="glass rounded-[1.7rem] border border-[rgba(225,6,0,0.08)] p-5 sm:p-6 lg:p-7">
                      <div className="min-w-0">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-3">
                            <span className="rounded-full border border-[rgba(225,6,0,0.14)] bg-[rgba(225,6,0,0.06)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
                              {locale === "zh-CN" ? "最近更新" : "Latest"}
                            </span>
                            <span className="rounded-full border border-[var(--border-soft)] bg-[var(--surface-strong)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
                              #{entry.hash}
                            </span>
                            <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
                              {locale === "zh-CN" ? "日期" : "Date"} {entry.date}
                            </span>
                          </div>

                          <h2 className="mt-4 max-w-3xl text-2xl font-semibold tracking-[-0.03em] sm:text-[2rem]">
                            {entry.subject}
                          </h2>

                          <p className="mt-4 max-w-3xl text-base leading-7 text-[var(--foreground)] sm:text-[1.05rem]">
                            {lead}
                          </p>
                        </div>
                      </div>

                      <div className="mt-6 rounded-[1.45rem] border border-[var(--border-soft)] bg-[rgba(255,255,255,0.58)] p-4 dark:bg-[rgba(18,18,18,0.5)] sm:p-5">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex h-2.5 w-2.5 rounded-full bg-[var(--accent)]" />
                          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--ink-muted)]">
                            {locale === "zh-CN" ? "这次有什么变化" : "What changed"}
                          </p>
                        </div>

                        {details.length > 0 ? (
                          <ul className="mt-4 space-y-3">
                            {details.map((bullet, index) => (
                              <li
                                key={`${entry.hash}-${index}`}
                                className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-3 rounded-[1rem] border border-[rgba(225,6,0,0.08)] bg-[var(--surface)] px-4 py-3"
                              >
                                <span className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-[rgba(225,6,0,0.08)] text-[11px] font-semibold text-[var(--accent)]">
                                  {String(index + 1).padStart(2, "0")}
                                </span>
                                <span className="text-sm leading-6 text-[var(--foreground)]">
                                  {bullet}
                                </span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="mt-4 text-sm leading-6 text-[var(--ink-muted)]">
                            {locale === "zh-CN"
                              ? "这一条提交没有更多拆分说明。"
                              : "This entry did not include a longer breakdown."}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>
      <section className="page-shell pb-20">
        <div className="grid gap-4 md:grid-cols-2">
          <Link
            className="surface-panel rounded-[1.65rem] p-6 transition hover:border-[var(--accent)]"
            href={prefixLocalePath("/about", locale)}
          >
            <p className="eyebrow text-[var(--accent)]">{locale === "zh-CN" ? "关于我们" : "About us"}</p>
            <h2 className="mt-3 text-2xl font-semibold">{locale === "zh-CN" ? "了解这个站点为什么值得用。" : "See what makes this site useful."}</h2>
          </Link>
          <Link
            className="surface-panel rounded-[1.65rem] p-6 transition hover:border-[var(--accent)]"
            href={prefixLocalePath("/more", locale)}
          >
            <p className="eyebrow text-[var(--accent)]">{locale === "zh-CN" ? "其他产品" : "Other products"}</p>
            <h2 className="mt-3 text-2xl font-semibold">{locale === "zh-CN" ? "看看 LionSaid 的更多产品。" : "Explore more from LionSaid."}</h2>
          </Link>
        </div>
      </section>
    </InfoPageShell>
  );
}

export default async function UpdatesPage() {
  return <UpdatesPageContent locale={await getRequestLocale()} />;
}
