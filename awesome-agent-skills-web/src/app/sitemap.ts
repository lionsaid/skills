import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { getRoles } from "@/lib/skills";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPaths = [
    "/",
    "/skills",
    "/roles",
    "/donate",
    "/legal/privacy",
    "/legal/terms",
    "/legal/disclaimer",
    "/zh-CN",
    "/zh-CN/skills",
    "/zh-CN/roles",
    "/zh-CN/donate",
    "/zh-CN/legal/privacy",
    "/zh-CN/legal/terms",
    "/zh-CN/legal/disclaimer",
  ];

  const entries: MetadataRoute.Sitemap = staticPaths.map((path) => ({
    url: `${SITE_URL}${path}`,
    changeFrequency: "weekly",
    priority: path === "/" || path === "/zh-CN" ? 1 : 0.8,
  }));

  for (const role of getRoles()) {
    entries.push(
      {
        url: `${SITE_URL}/roles/${role.slug}`,
        changeFrequency: "weekly",
        priority: 0.8,
      },
      {
        url: `${SITE_URL}/zh-CN/roles/${role.slug}`,
        changeFrequency: "weekly",
        priority: 0.8,
      },
    );
  }
  return entries;
}
