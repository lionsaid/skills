"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
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
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);

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

    const target = prefixLocalePath(getSkillDetailPath(skillSlug, locale), locale);
    setIsNavigating(true);
    timeoutRef.current = window.setTimeout(() => {
      window.location.assign(target);
    }, 650);
  }

  return (
    <>
      {isMounted && isNavigating
        ? createPortal(
            <div className="pointer-events-none fixed inset-x-0 top-0 z-[9999]">
              <div className="skill-route-progress h-1 w-full origin-left animate-[skill-route-progress_650ms_ease-out_forwards]" />
            </div>,
            document.body,
          )
        : null}
      <button
        className={`block w-full appearance-none border-0 bg-transparent p-0 text-inherit no-underline outline-none focus:outline-none focus-visible:outline-none ${className ?? ""}`}
        onClick={handleClick}
        type="button"
      >
        {children}
      </button>
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
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);

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
    timeoutRef.current = window.setTimeout(() => {
      window.location.assign(href);
    }, delayMs);
  }

  return (
    <>
      {isMounted && isNavigating
        ? createPortal(
            <div className="pointer-events-none fixed inset-x-0 top-0 z-[9999]">
              <div className="skill-route-progress h-1 w-full origin-left animate-[skill-route-progress_650ms_ease-out_forwards]" />
            </div>,
            document.body,
          )
        : null}
      <button
        className={`appearance-none border-0 bg-transparent p-0 text-inherit no-underline outline-none focus:outline-none focus-visible:outline-none ${className ?? ""}`}
        onClick={handleClick}
        type="button"
      >
        {children}
      </button>
    </>
  );
}
