import { NextResponse } from "next/server";
import repoStatsData from "@/data/repo-stats.generated.json";

type RepoStats = {
  stars: number | null;
  forks: number | null;
};

type RepoStatsPayload = {
  generatedAt: string;
  statsBySlug: Record<string, RepoStats>;
};

const payload = repoStatsData as RepoStatsPayload;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slugs = searchParams.getAll("slug");

  if (slugs.length === 0) {
    return NextResponse.json({});
  }

  const result: Record<string, RepoStats> = {};

  for (const slug of slugs) {
    result[slug] = payload.statsBySlug[slug] ?? { stars: null, forks: null };
  }

  return NextResponse.json(result, {
    headers: {
      "Cache-Control": "s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
