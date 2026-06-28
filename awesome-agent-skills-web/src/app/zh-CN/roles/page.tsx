import { RolesPageContent } from "../../roles/page";
import { buildMetadata, getLocalizedDescription } from "@/lib/seo";
import type { Metadata } from "next";

export function generateMetadata(): Metadata {
  return buildMetadata({
    title: "角色",
    path: "/zh-CN/roles",
    description: getLocalizedDescription("zh-CN"),
    locale: "zh-CN",
  });
}

export default function ZhRolesPage() {
  return <RolesPageContent locale="zh-CN" />;
}
