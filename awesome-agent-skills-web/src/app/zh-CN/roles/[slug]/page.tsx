import type { Metadata } from "next";
import { getRoles } from "../../../../lib/skills";
import { RolePageContent } from "../../../roles/[slug]/page";
import { buildMetadata, getLocalizedDescription } from "@/lib/seo";

export function generateStaticParams() {
  return getRoles().map((role) => ({ slug: role.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  return buildMetadata({
    title: slug,
    path: `/zh-CN/roles/${slug}`,
    description: getLocalizedDescription("zh-CN"),
    locale: "zh-CN",
  });
}

export default function ZhRoleDetailPage(
  props: Parameters<typeof RolePageContent>[0],
) {
  return <RolePageContent {...props} locale="zh-CN" />;
}
