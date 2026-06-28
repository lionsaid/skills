import { HomePage } from "../page";
import { buildMetadata, getLocalizedDescription } from "@/lib/seo";
import type { Metadata } from "next";

export function generateMetadata(): Metadata {
  return buildMetadata({
    title: "LionSaid Skills",
    path: "/zh-CN",
    description: getLocalizedDescription("zh-CN"),
    locale: "zh-CN",
  });
}

export default function ZhHomePage() {
  return <HomePage locale="zh-CN" />;
}
