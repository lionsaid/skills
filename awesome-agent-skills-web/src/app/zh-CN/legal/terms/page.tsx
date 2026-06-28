import type { Metadata } from "next";
import { TermsPageContent } from "../../../legal/terms/page";
import { buildMetadata, getLocalizedDescription } from "@/lib/seo";

export function generateMetadata(): Metadata {
  return buildMetadata({
    title: "服务条款",
    path: "/zh-CN/legal/terms",
    description: getLocalizedDescription("zh-CN"),
    locale: "zh-CN",
  });
}

export default function ZhTermsPage() {
  return <TermsPageContent locale="zh-CN" />;
}
