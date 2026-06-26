import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

const footerColumns = [
  {
    title: "Explore",
    items: [
      { label: "Browse Skills", href: "/skills" },
      { label: "Featured", href: "/skills?sort=featured" },
      { label: "Official only", href: "/skills?kind=official" },
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
      { label: "README", href: "https://github.com/lionsaid/skills/blob/main/README.md" },
      { label: "skill.lionsaid.com", href: "https://skill.lionsaid.com" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="site-footer mt-10 overflow-hidden">
      <div className="page-shell relative py-16 sm:py-20">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.7fr)] lg:items-start">
          <div>
            <p className="eyebrow text-[color:var(--footer-muted)]">Skills directory</p>
            <h2 className="display mt-4 max-w-4xl text-5xl font-semibold tracking-[-0.05em] text-balance sm:text-6xl lg:text-[5.25rem]">
              Find a skill here, then open the source only when you need it.
            </h2>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-[color:var(--footer-muted)]">
              This front door is for discovery. Search by use case, publisher, or
              category, and get to the right skill without scanning a repository
              first.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                className="rounded-full bg-[var(--foreground)] px-5 py-3 text-sm font-medium text-[var(--background)] transition hover:opacity-90"
                href="/skills"
              >
                Search catalog
              </Link>
              <Link
                className="rounded-full border border-[color:var(--footer-border)] px-5 py-3 text-sm font-medium text-[color:var(--footer-fg)] transition hover:bg-black/[0.03] dark:hover:bg-white/[0.06]"
                href="/skills?sort=featured"
              >
                Browse featured
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {footerColumns.map((column) => (
            <div key={column.title} className="footer-rule border-t pt-6">
              <p className="eyebrow text-[color:var(--footer-muted)]">{column.title}</p>
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
                      {item.label}
                    </a>
                  ) : (
                    <Link
                      key={item.label}
                      className="footer-link text-sm transition"
                      href={item.href}
                    >
                      {item.label}
                    </Link>
                  ),
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="footer-rule mt-14 flex flex-col gap-3 border-t pt-6 text-sm sm:flex-row sm:items-center sm:justify-between">
          <p>skill.lionsaid.com</p>
          <p>Curated discovery for skill-first workflows.</p>
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
