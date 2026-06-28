import type { Metadata } from "next";
import { Suspense } from "react";
import { PublisherDetailClient } from "@/components/publisher-detail-client";
import { getRequestLocale } from "@/lib/request-locale";
import { buildMetadata, getLocalizedDescription } from "@/lib/seo";

export function generateMetadata(): Metadata {
  return buildMetadata({
    title: "Publisher",
    path: "/publisher",
    description: getLocalizedDescription("en"),
  });
}

export default async function PublisherPage() {
  const locale = await getRequestLocale();

  return (
    <Suspense fallback={null}>
      <PublisherDetailClient locale={locale} />
    </Suspense>
  );
}
