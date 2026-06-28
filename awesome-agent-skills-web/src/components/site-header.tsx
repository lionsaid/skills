"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { LanguageToggle } from "@/components/language-toggle";
import { ThemeToggle } from "@/components/theme-toggle";
import { getCopy, prefixLocalePath, type Locale } from "@/lib/i18n";

type SiteHeaderProps = {
  currentPath?: "/" | "/skills" | "/roles";
  locale: Locale;
};

function BrandMark() {
  return (
    <svg
      aria-label="LionSaid"
      className="h-8 w-auto"
      role="img"
      viewBox="0 0 320 84"
    >
      <title>LionSaid</title>
      <text
        x="16"
        y="52"
        fill="var(--brand-ink)"
        fontFamily="Georgia, 'Times New Roman', serif"
        fontSize="42"
        fontWeight="700"
        letterSpacing="1.8"
      >
        <tspan>Lion</tspan>
        <tspan fill="var(--brand-accent)">S</tspan>
        <tspan>aid</tspan>
      </text>
    </svg>
  );
}

function HomeIcon() {
  return (
    <svg aria-hidden="true" fill="none" height="18" viewBox="0 0 24 24" width="18">
      <path
        d="M4.5 11.2 12 4l7.5 7.2V20a.75.75 0 0 1-.75.75h-4.5v-5.25h-4.5v5.25h-4.5A.75.75 0 0 1 4.5 20v-8.8Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </svg>
  );
}

function GridIcon() {
  return (
    <svg aria-hidden="true" fill="none" height="18" viewBox="0 0 24 24" width="18">
      <path
        d="M4.5 5.25h6v6h-6v-6Zm9 0h6v6h-6v-6Zm-9 9h6v6h-6v-6Zm9 0h6v6h-6v-6Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </svg>
  );
}

function RoleIcon() {
  return (
    <svg aria-hidden="true" fill="none" height="18" viewBox="0 0 24 24" width="18">
      <path
        d="M12 12a3.25 3.25 0 1 0 0-6.5 3.25 3.25 0 0 0 0 6.5Zm-6 8c0-3.02 2.69-5.5 6-5.5s6 2.48 6 5.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg aria-hidden="true" fill="currentColor" height="18" viewBox="0 0 16 16" width="18">
      <path d="M8 0C3.58 0 0 3.58 0 8a8 8 0 0 0 5.47 7.59c.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.65 7.65 0 0 1 4 0c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
    </svg>
  );
}

function NavButton({
  active,
  children,
  href,
  iconOnly = false,
}: {
  active?: boolean;
  children: ReactNode;
  href: string;
  iconOnly?: boolean;
}) {
  return (
    <Link
      aria-label={iconOnly ? "Home" : undefined}
      className={`inline-flex h-11 justify-self-center items-center justify-center whitespace-nowrap rounded-full text-sm font-medium transition ${
        iconOnly ? "w-11 p-0" : "w-fit gap-2 px-4"
      } ${
        active
          ? "header-pill-active shadow-sm ring-1 ring-[var(--border-soft)]"
          : "header-pill hover:bg-[var(--surface-strong)]"
      }`}
      href={href}
    >
      {children}
    </Link>
  );
}

export function SiteHeader({ currentPath = "/", locale }: SiteHeaderProps) {
  const [compact, setCompact] = useState(false);
  const copy = getCopy(locale);

  useEffect(() => {
    function onScroll() {
      setCompact(window.scrollY > 18);
    }

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <div className="hidden h-[104px] sm:block" aria-hidden="true" />

      <div className="page-shell hidden sm:block">
        <nav
          className={`header-shell glass fixed left-1/2 top-4 z-40 -translate-x-1/2 rounded-full border px-4 text-sm transition-all duration-300 ease-out ${
            compact
              ? "w-[min(1020px,calc(100vw-2rem))] py-2.5 shadow-[0_16px_40px_rgba(56,49,36,0.08)]"
              : "w-[min(1160px,calc(100vw-2rem))] py-3.5 shadow-[0_24px_80px_rgba(56,49,36,0.08)]"
          }`}
        >
          <div className="flex items-center gap-4">
            <Link aria-label="Go to home page" className="flex min-w-0 shrink-0 items-center gap-3" href={prefixLocalePath("/", locale)}>
              <BrandMark />
              <div className={`min-w-0 transition-all duration-300 ${compact ? "max-w-[11rem]" : "max-w-[16rem]"}`}>
                <p className="truncate font-medium">LionSaid Skills</p>
                <p className={`muted truncate text-xs transition-all duration-300 ${compact ? "opacity-0" : "opacity-100"}`}>
                  {locale === "zh-CN" ? "更快找到合适的 skill" : "Find useful skills faster"}
                </p>
              </div>
            </Link>

            <div className="flex min-w-0 flex-1 items-center justify-center gap-2">
              <NavButton active={currentPath === "/"} href={prefixLocalePath("/", locale)}>
                <HomeIcon />
                <span>{copy.nav.home}</span>
              </NavButton>
              <NavButton active={currentPath === "/skills"} href={prefixLocalePath("/skills", locale)}>
                <GridIcon />
                <span>{copy.nav.browseSkills}</span>
              </NavButton>
              <NavButton active={currentPath === "/roles"} href={prefixLocalePath("/roles", locale)}>
                <RoleIcon />
                <span>{copy.nav.roles}</span>
              </NavButton>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <a
                aria-label="Open GitHub repository"
                className="header-action inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border p-0 transition hover:bg-[var(--background)]"
                href="https://github.com/lionsaid/skills"
                rel="noreferrer"
                target="_blank"
                >
                  <GitHubIcon />
                </a>
              <LanguageToggle locale={locale} />
              <ThemeToggle />
            </div>
          </div>
        </nav>
      </div>

      <div className="fixed inset-x-0 bottom-4 z-40 sm:hidden">
        <div className="page-shell">
          <nav
            className="header-shell glass mx-auto flex max-w-[28rem] items-center gap-2 rounded-[1.6rem] px-3 py-3 shadow-[0_16px_40px_rgba(56,49,36,0.14)]"
            data-testid="mobile-bottom-nav"
          >
              <div className="shrink-0">
              <NavButton active={currentPath === "/"} href={prefixLocalePath("/", locale)} iconOnly>
                <HomeIcon />
              </NavButton>
            </div>
            <div className="-mr-1 flex min-w-0 flex-1 items-center gap-2 overflow-x-auto pb-1 pr-1">
              <NavButton active={currentPath === "/skills"} href={prefixLocalePath("/skills", locale)}>
                <GridIcon />
                <span className="text-xs">{copy.nav.browseSkills}</span>
              </NavButton>
              <NavButton active={currentPath === "/roles"} href={prefixLocalePath("/roles", locale)}>
                <RoleIcon />
                <span className="text-xs">{copy.nav.roles}</span>
              </NavButton>
              <div className="shrink-0">
                <LanguageToggle locale={locale} />
              </div>
              <div className="shrink-0">
                <ThemeToggle compact />
              </div>
            </div>
          </nav>
        </div>
      </div>
    </>
  );
}
