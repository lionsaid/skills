import Link from "next/link";
import type { Locale } from "@/lib/i18n";

const footerColumns = [
  {
    title: "Explore",
    items: [
      { label: "Browse Skills", href: "/skills" },
      { label: "Top picks", href: "/skills?sort=featured" },
      { label: "From official teams", href: "/skills?kind=official" },
      { label: "Community", href: "/skills?kind=community" },
    ],
  },
  {
    title: "Publishers",
    items: [
      { label: "Anthropics", href: "/skills?publisher=anthropics" },
      { label: "OpenAI", href: "/skills?publisher=openai" },
      { label: "NVIDIA", href: "/skills?publisher=nvidia" },
      { label: "All publishers", href: "/skills" },
    ],
  },
  {
    title: "Source",
    items: [
      { label: "GitHub repo", href: "https://github.com/lionsaid/skills" },
      { label: "Project README", href: "https://github.com/lionsaid/skills/blob/main/README.md" },
      { label: "skill.lionsaid.com", href: "https://skill.lionsaid.com" },
    ],
  },
];

export function SiteFooter({ locale = "en" }: { locale?: Locale }) {
  return (
    <footer className="site-footer mt-10 overflow-hidden">
      <div className="page-shell relative py-16 sm:py-20">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.7fr)] lg:items-start">
          <div>
            <p className="eyebrow text-[color:var(--footer-muted)]">
              {locale === "zh-CN" ? "开始查找" : "Skills directory"}
            </p>
            <h2 className="display mt-4 max-w-4xl text-5xl font-semibold tracking-[-0.05em] text-balance sm:text-6xl lg:text-[5.25rem]">
              {locale === "zh-CN"
                ? "想找能直接用的 skill，先从这里开始。"
                : "Find a skill here, then open the source only when you need it."}
            </h2>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-[color:var(--footer-muted)]">
              {locale === "zh-CN"
                ? "按任务、角色或公司快速筛选，先找到合适的 skill，再决定要不要打开原始来源。"
                : "Search by task, company, or role, and find the right skill before you open the original source."}
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                className="inline-flex min-w-[10rem] items-center justify-center whitespace-nowrap rounded-full border border-[var(--accent)] bg-[var(--accent)] px-5 py-3 text-sm font-medium text-white shadow-[0_12px_26px_rgba(225,6,0,0.22)] transition hover:opacity-95"
                href="/skills"
              >
                {locale === "zh-CN" ? "开始找 skill" : "Search skills"}
              </Link>
              <Link
                className="rounded-full border border-[color:var(--footer-border)] px-5 py-3 text-sm font-medium text-[color:var(--footer-fg)] transition hover:bg-black/[0.03] dark:hover:bg-white/[0.06]"
                href="/skills?sort=featured"
              >
                {locale === "zh-CN" ? "看看热门推荐" : "Start with top picks"}
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {footerColumns.map((column) => (
            <div key={column.title} className="footer-rule border-t pt-6">
              <p className="eyebrow text-[color:var(--footer-muted)]">
                {locale === "zh-CN"
                  ? column.title === "Explore"
                    ? "浏览"
                    : column.title === "Publishers"
                      ? "公司"
                      : "来源"
                  : column.title}
              </p>
              <div className="mt-4 grid gap-3">
                {column.items.map((item) =>
                  item.href.startsWith("http") ? (
                    <a
                      key={item.label}
                      className="footer-link text-sm transition"
                      href={item.href}
                      rel="noreferrer"
                      target="_blank"
                    >
                      {locale === "zh-CN"
                        ? item.label === "Browse Skills"
                          ? "浏览全部 skill"
                          : item.label === "Top picks"
                            ? "热门推荐"
                            : item.label === "From official teams"
                              ? "官方出品"
                              : item.label === "Community"
                                ? "社区"
                                : item.label === "All publishers"
                                  ? "全部公司"
                                  : item.label === "GitHub repo"
                                    ? "GitHub 仓库"
                                    : item.label === "Project README"
                                      ? "项目介绍"
                                      : item.label
                        : item.label}
                    </a>
                  ) : (
                    <Link
                      key={item.label}
                      className="footer-link text-sm transition"
                      href={item.href}
                    >
                      {locale === "zh-CN"
                        ? item.label === "Browse Skills"
                          ? "浏览全部 skill"
                          : item.label === "Top picks"
                            ? "热门推荐"
                            : item.label === "From official teams"
                              ? "官方出品"
                              : item.label === "Community"
                                ? "社区"
                                : item.label === "All publishers"
                                  ? "全部公司"
                                  : item.label
                        : item.label}
                    </Link>
                  ),
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="footer-rule mt-14 flex flex-col gap-3 border-t pt-6 text-sm sm:flex-row sm:items-center sm:justify-between">
          <p>skill.lionsaid.com</p>
          <p>
            {locale === "zh-CN"
              ? "帮你更快找到真正能用上的 skill。"
              : "A faster way to find skills you can use right away."}
          </p>
        </div>

        <div
          aria-hidden="true"
          className="footer-watermark pointer-events-none select-none pt-10 text-[clamp(4.5rem,15vw,12rem)] font-semibold leading-none tracking-[-0.08em]"
        >
          LionSaid
        </div>
      </div>
    </footer>
  );
}
