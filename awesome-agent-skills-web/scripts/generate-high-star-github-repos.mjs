import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, "..");
const dataDir = path.join(projectRoot, "src", "data");
const skillsPath = path.join(dataDir, "skills.generated.json");
const repoStatsPath = path.join(dataDir, "repo-stats.generated.json");
const outputPath = path.join(dataDir, "github-high-star-repos.generated.json");
const minStars = 100;

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, "utf8"));
}

function getGithubRepository(url) {
  try {
    const parsed = new URL(url);
    if (parsed.hostname !== "github.com") {
      return null;
    }

    const [owner, repo] = parsed.pathname.split("/").filter(Boolean);
    if (!owner || !repo) {
      return null;
    }

    return `${owner}/${repo}`;
  } catch {
    return null;
  }
}

const skillsPayload = readJson(skillsPath);
const repoStatsPayload = readJson(repoStatsPath);
const skills = Array.isArray(skillsPayload.skills) ? skillsPayload.skills : [];
const statsBySlug =
  repoStatsPayload && typeof repoStatsPayload.statsBySlug === "object" && !Array.isArray(repoStatsPayload.statsBySlug)
    ? repoStatsPayload.statsBySlug
    : {};

const repositories = new Map();

for (const skill of skills) {
  const repository = getGithubRepository(skill.url);
  const stars = statsBySlug[skill.slug]?.stars;

  if (!repository || typeof stars !== "number" || stars < minStars) {
    continue;
  }

  const existing = repositories.get(repository) ?? {
    repository,
    stars,
    skillSlugs: [],
    skillNames: [],
    publishers: [],
  };

  existing.stars = Math.max(existing.stars, stars);
  existing.skillSlugs = [...new Set([...existing.skillSlugs, skill.slug])].sort();
  existing.skillNames = [...new Set([...existing.skillNames, skill.name])].sort();
  existing.publishers = [...new Set([...existing.publishers, skill.publisher])].sort();
  repositories.set(repository, existing);
}

const items = [...repositories.values()].sort((a, b) => {
  if (b.stars !== a.stars) {
    return b.stars - a.stars;
  }

  return a.repository.localeCompare(b.repository);
});

mkdirSync(dataDir, { recursive: true });
writeFileSync(
  outputPath,
  `${JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      minStars,
      totalRepositories: items.length,
      repositories: items,
    },
    null,
    2,
  )}\n`,
);

console.log(
  `Generated ${items.length} GitHub repositories with ${minStars}+ stars at ${path.relative(projectRoot, outputPath)}`,
);
