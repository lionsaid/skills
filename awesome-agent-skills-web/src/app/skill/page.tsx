import type { Metadata } from "next";
import { Suspense } from "react";
import { SkillDetailClient } from "@/components/skill-detail-client";
import { getRequestLocale } from "@/lib/request-locale";
import { buildMetadata, getLocalizedDescription } from "@/lib/seo";

export function generateMetadata(): Metadata {
  return buildMetadata({
    title: "Skill",
    path: "/skill",
    description: getLocalizedDescription("en"),
  });
}

export default async function SkillPage() {
  const locale = await getRequestLocale();

  return (
    <Suspense fallback={null}>
      <SkillDetailClient locale={locale} />
    </Suspense>
  );
}
