import type { Metadata } from "next";
import { PrivacyPageContent } from "../../../legal/privacy/page";
import { buildMetadata, getLocalizedDescription } from "@/lib/seo";

export function generateMetadata(): Metadata {
  return buildMetadata({
    title: "隐私政策",
    path: "/zh-CN/legal/privacy",
    description: getLocalizedDescription("zh-CN"),
    locale: "zh-CN",
  });
}

export default function ZhPrivacyPage() {
  return <PrivacyPageContent locale="zh-CN" />;
}
