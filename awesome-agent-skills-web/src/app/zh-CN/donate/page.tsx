import { DonatePageContent } from "../../donate/page";
import { buildMetadata, getLocalizedDescription } from "@/lib/seo";
import type { Metadata } from "next";

export function generateMetadata(): Metadata {
  return buildMetadata({
    title: "捐助",
    path: "/zh-CN/donate",
    description: getLocalizedDescription("zh-CN"),
    locale: "zh-CN",
  });
}

export default function ZhDonatePage() {
  return <DonatePageContent locale="zh-CN" />;
}
