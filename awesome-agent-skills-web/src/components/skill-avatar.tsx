"use client";

import Image from "next/image";
import { useState } from "react";

function getFallbackLabel(name: string) {
  const value = name
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  return value || name.slice(0, 1).toUpperCase();
}

export function SkillAvatar({
  name,
  avatarUrl,
  size = "md",
}: {
  name: string;
  avatarUrl?: string;
  size?: "sm" | "md" | "lg";
}) {
  const [failed, setFailed] = useState(false);
  const dimension = size === "lg" ? 56 : size === "sm" ? 28 : 36;

  return (
    <span
      className="relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-[var(--border-soft)] bg-[var(--surface-strong)] text-[11px] font-semibold text-[var(--foreground)]"
      style={{ width: dimension, height: dimension }}
    >
      {avatarUrl && !failed ? (
        <Image
          alt={`${name} avatar`}
          fill
          onError={() => setFailed(true)}
          sizes={`${dimension}px`}
          src={avatarUrl}
          className="object-cover"
        />
      ) : (
        <span aria-hidden="true">{getFallbackLabel(name)}</span>
      )}
    </span>
  );
}
