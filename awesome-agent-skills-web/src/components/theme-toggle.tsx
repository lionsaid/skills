"use client";

import { useState } from "react";

type Theme = "light" | "dark";

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.dataset.theme = theme;
  root.style.colorScheme = theme;
  localStorage.setItem("lionsaid-theme", theme);
}

export function ThemeToggle({
  compact = false,
}: {
  compact?: boolean;
}) {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof document === "undefined") {
      return "light";
    }

    return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
  });

  function toggleTheme() {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    applyTheme(nextTheme);
  }

  return (
    <button
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      className={`inline-flex items-center justify-center rounded-full border border-[var(--border-soft)] bg-[var(--surface-strong)] p-0 text-[var(--foreground)] transition hover:bg-[var(--surface)] ${
        compact ? "h-11 w-11" : "h-11 w-11"
      }`}
      onClick={toggleTheme}
      type="button"
      title={theme === "dark" ? "Light mode" : "Dark mode"}
    >
      {theme === "dark" ? (
        <svg aria-hidden="true" fill="none" height="18" viewBox="0 0 24 24" width="18">
          <path
            d="M12 4.5v2.25m0 10.5v2.25M5.64 5.64l1.59 1.59m9.54 9.54 1.59 1.59M4.5 12h2.25m10.5 0h2.25M5.64 18.36l1.59-1.59m9.54-9.54 1.59-1.59M12 16.5a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9Z"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.7"
          />
        </svg>
      ) : (
        <svg aria-hidden="true" fill="none" height="18" viewBox="0 0 24 24" width="18">
          <path
            d="M20 15.2A7.7 7.7 0 0 1 8.8 4a8.5 8.5 0 1 0 11.2 11.2Z"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.8"
          />
        </svg>
      )}
    </button>
  );
}
