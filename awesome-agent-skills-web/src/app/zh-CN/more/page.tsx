import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { MorePageContent } from "../../more/page";

export function generateMetadata(): Metadata {
  return buildMetadata({
    title: "其他站点",
    path: "/zh-CN/more",
    description: "LionSaid 的其他产品与站点入口。",
    locale: "zh-CN",
  });
}

export default function ZhMorePage() {
  return <MorePageContent locale="zh-CN" />;
}
