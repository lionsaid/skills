"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { getSkillDetailPath, prefixLocalePath, type Locale } from "@/lib/i18n";

type DelayedSkillLinkProps = {
  children: React.ReactNode;
  className?: string;
  locale: Locale;
  skillSlug: string;
};

export function DelayedSkillLink({
  children,
  className,
  locale,
  skillSlug,
}: DelayedSkillLinkProps) {
  const timeoutRef = useRef<number | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  function handleClick() {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
    }

    setIsNavigating(true);
    timeoutRef.current = window.setTimeout(() => setIsNavigating(false), 650);
  }

  return (
    <>
      {isNavigating ? (
        <div className="pointer-events-none fixed inset-x-0 top-0 z-[9999]" role="status">
          <div className="skill-route-progress h-1 w-full origin-left animate-[skill-route-progress_650ms_ease-out_forwards]" />
        </div>
      ) : null}
      <Link
        className={`block w-full appearance-none border-0 bg-transparent p-0 text-inherit no-underline ${className ?? ""}`}
        href={prefixLocalePath(getSkillDetailPath(skillSlug, locale), locale)}
        onClick={handleClick}
      >
        {children}
      </Link>
    </>
  );
}

type DelayedRouteLinkProps = {
  children: React.ReactNode;
  className?: string;
  href: string;
  delayMs?: number;
};

export function DelayedRouteLink({
  children,
  className,
  href,
  delayMs = 650,
}: DelayedRouteLinkProps) {
  const timeoutRef = useRef<number | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  function handleClick() {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
    }

    setIsNavigating(true);
    timeoutRef.current = window.setTimeout(() => setIsNavigating(false), delayMs);
  }

  return (
    <>
      {isNavigating ? (
        <div className="pointer-events-none fixed inset-x-0 top-0 z-[9999]" role="status">
          <div className="skill-route-progress h-1 w-full origin-left animate-[skill-route-progress_650ms_ease-out_forwards]" />
        </div>
      ) : null}
      <Link
        className={`appearance-none border-0 bg-transparent p-0 text-inherit no-underline ${className ?? ""}`}
        href={href}
        onClick={handleClick}
      >
        {children}
      </Link>
    </>
  );
}
