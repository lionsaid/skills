import type { Metadata } from "next";
import { DisclaimerPageContent } from "../../../legal/disclaimer/page";
import { buildMetadata, getLocalizedDescription } from "@/lib/seo";

export function generateMetadata(): Metadata {
  return buildMetadata({
    title: "免责声明",
    path: "/zh-CN/legal/disclaimer",
    description: getLocalizedDescription("zh-CN"),
    locale: "zh-CN",
  });
}

export default function ZhDisclaimerPage() {
  return <DisclaimerPageContent locale="zh-CN" />;
}
