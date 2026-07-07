import type { Metadata } from "next";
import { Suspense } from "react";
import { PageLoading } from "@/components/page-loading";
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
    <Suspense fallback={<PageLoading locale={locale} title={locale === "zh-CN" ? "正在加载 skill" : "Loading skill"} description={locale === "zh-CN" ? "正在获取技能详情和安装说明。" : "Fetching the skill details and install instructions."} />}>
      <SkillDetailClient locale={locale} />
    </Suspense>
  );
}
