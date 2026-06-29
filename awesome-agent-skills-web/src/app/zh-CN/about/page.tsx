import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { AboutPageContent } from "../../about/page";

export function generateMetadata(): Metadata {
  return buildMetadata({
    title: "关于我们",
    path: "/zh-CN/about",
    description: "关于 LionSaid Skills。",
    locale: "zh-CN",
  });
}

export default function ZhAboutPage() {
  return <AboutPageContent locale="zh-CN" />;
}
