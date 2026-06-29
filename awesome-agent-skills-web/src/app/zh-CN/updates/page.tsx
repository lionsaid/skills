import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { UpdatesPageContent } from "../../updates/page";

export function generateMetadata(): Metadata {
  return buildMetadata({
    title: "更新历史",
    path: "/zh-CN/updates",
    description: "LionSaid Skills 最近的产品、数据与体验更新。",
    locale: "zh-CN",
  });
}

export default function ZhUpdatesPage() {
  return <UpdatesPageContent locale="zh-CN" />;
}
