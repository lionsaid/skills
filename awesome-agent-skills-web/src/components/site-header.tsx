import Link from "next/link";
import Image from "next/image";

type SiteHeaderProps = {
  currentPath?: "/" | "/skills";
};

export function SiteHeader({ currentPath = "/" }: SiteHeaderProps) {
  const navItems = [
    { href: "/", label: "Home" },
    { href: "/skills", label: "Browse Skills" },
  ] as const;

  return (
    <div className="page-shell pt-6">
      <nav className="glass flex flex-col gap-4 rounded-[1.75rem] px-5 py-4 text-sm sm:flex-row sm:items-center sm:justify-between sm:rounded-full sm:py-3">
        <Link aria-label="Go to home page" className="flex items-center gap-3" href="/">
          <Image
            alt="LionSaid"
            className="h-8 w-auto"
            height={84}
            src="/lionsaid-logo.svg"
            width={320}
          />
          <div>
            <p className="font-medium">Awesome Agent Skills</p>
            <p className="muted text-xs">Curated skill discovery</p>
          </div>
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          {navItems.map((item) => {
            const isActive = currentPath === item.href;

            return (
              <Link
                key={item.href}
                className={`rounded-full px-4 py-2 transition ${
                  isActive
                    ? "bg-white text-[var(--foreground)] shadow-sm ring-1 ring-[var(--border-soft)]"
                    : "hover:bg-white/50"
                }`}
                href={item.href}
              >
                {item.label}
              </Link>
            );
          })}

          <a
            className="rounded-full border border-[var(--border-soft)] px-4 py-2 transition hover:bg-white/50"
            href="https://github.com/VoltAgent/awesome-agent-skills"
            rel="noreferrer"
            target="_blank"
          >
            GitHub
          </a>

          <button
            className="rounded-full border border-[var(--border-soft)] bg-white px-4 py-2 text-sm transition hover:bg-white/70"
            type="button"
          >
            Lang
          </button>

          <button
            className="rounded-full border border-[var(--border-soft)] bg-white px-4 py-2 text-sm transition hover:bg-white/70"
            type="button"
          >
            Mode
          </button>
        </div>
      </nav>
    </div>
  );
}
