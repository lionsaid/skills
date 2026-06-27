"use client";

import Image from "next/image";
import { useState } from "react";
import { canFallbackToPublisherInitials } from "@/lib/skills";

function getPublisherBrand(slug: string) {
  const map: Record<string, { bg: string; border: string; fg: string }> = {
    anthropics: { bg: "#f3efe8", border: "#d7cfbf", fg: "#171717" },
    openai: { bg: "#e9fff7", border: "#85d8ba", fg: "#0f5132" },
    "google-gemini": { bg: "#e8f0ff", border: "#9cbcf9", fg: "#2457d6" },
    "google-labs-code": { bg: "#e8f0ff", border: "#9cbcf9", fg: "#2457d6" },
    googleworkspace: { bg: "#e8f0ff", border: "#9cbcf9", fg: "#2457d6" },
    nvidia: { bg: "#effad7", border: "#b8df55", fg: "#5d8e00" },
    cloudflare: { bg: "#fff1df", border: "#ffbe79", fg: "#d96904" },
    "vercel-labs": { bg: "#eceef3", border: "#aab0bc", fg: "#171717" },
    netlify: { bg: "#defaf7", border: "#7fe3d8", fg: "#0b7f73" },
    stripe: { bg: "#ece8ff", border: "#b4a3ff", fg: "#5b44d6" },
    supabase: { bg: "#e7fff1", border: "#8ce1ac", fg: "#17803d" },
    clickhouse: { bg: "#fff4c9", border: "#f0d85a", fg: "#8a6c00" },
  };

  return map[slug] ?? { bg: "#eef2fb", border: "#95a3c7", fg: "#20345f" };
}

export function PublisherLogo({
  name,
  slug,
  size = "md",
  allowInitialsFallback,
}: {
  name: string;
  slug: string;
  size?: "sm" | "md" | "lg";
  allowInitialsFallback?: boolean;
}) {
  const initials = name
    .split(/[\s/-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  const brand = getPublisherBrand(slug);
  const localLogoPath = `/publisher-logos/${slug}.png`;
  const [imageFailed, setImageFailed] = useState(false);
  const canUseInitials = allowInitialsFallback ?? canFallbackToPublisherInitials(slug);

  const sizeClass =
    size === "sm"
      ? "h-10 w-10 text-[12px]"
      : size === "lg"
        ? "h-16 w-16 text-[18px]"
        : "h-11 w-11 text-[13px]";

  return (
    <span
      className={`relative inline-flex shrink-0 overflow-hidden rounded-full shadow-[0_10px_30px_rgba(0,0,0,0.12)] ${sizeClass}`}
      style={{ backgroundColor: brand.bg, border: `1px solid ${brand.border}` }}
    >
      {!imageFailed ? (
        <Image
          alt={`${name} logo`}
          className="object-cover"
          fill
          onError={() => setImageFailed(true)}
          sizes={size === "lg" ? "64px" : size === "sm" ? "40px" : "44px"}
          src={localLogoPath}
        />
      ) : null}
      {canUseInitials ? (
        <span
          aria-hidden="true"
          className={`absolute inset-0 items-center justify-center font-semibold tracking-[-0.04em] ${
            imageFailed ? "inline-flex" : "hidden"
          }`}
          style={{ color: brand.fg }}
        >
          {initials || name.slice(0, 1).toUpperCase()}
        </span>
      ) : null}
    </span>
  );
}
