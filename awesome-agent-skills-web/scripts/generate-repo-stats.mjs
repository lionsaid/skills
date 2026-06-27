import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, "..");
const dataDir = path.join(projectRoot, "src", "data");
const skillsPath = path.join(dataDir, "skills.generated.json");
const outputPath = path.join(dataDir, "repo-stats.generated.json");

function readExistingStats() {
  try {
    const payload = JSON.parse(readFileSync(outputPath, "utf8"));
    return payload && typeof payload.statsBySlug === "object" && !Array.isArray(payload.statsBySlug)
      ? payload.statsBySlug
      : {};
  } catch {
    return {};
  }
}

function getRepositoryKey(url, publisher) {
  try {
    const parsed = new URL(url);

    if (parsed.hostname === "github.com") {
      const [owner, repo] = parsed.pathname.split("/").filter(Boolean);
      if (!owner || !repo) {
        return null;
      }

      return `${owner}/${repo}`;
    }

    if (parsed.hostname === "officialskills.sh") {
      return `${publisher}/skills`;
    }
  } catch {
    return null;
  }

  return null;
}

const skillsPayload = JSON.parse(readFileSync(skillsPath, "utf8"));
const skills = Array.isArray(skillsPayload.skills) ? skillsPayload.skills : [];
const existingStatsBySlug = readExistingStats();

const slugToRepo = {};
const repos = new Set();

for (const skill of skills) {
  const repoKey = getRepositoryKey(skill.url, skill.publisher);
  slugToRepo[skill.slug] = repoKey;
  if (repoKey) {
    repos.add(repoKey);
  }
}

const repoStatsEntries = await Promise.all(
  [...repos].map(async (repoKey) => {
    const fallbackStats = Object.entries(slugToRepo)
      .filter(([, value]) => value === repoKey)
      .map(([slug]) => existingStatsBySlug[slug])
      .find(
        (value) =>
          value &&
          (typeof value.stars === "number" || typeof value.forks === "number"),
      ) ?? { stars: null, forks: null };

    try {
      const response = await fetch(`https://api.github.com/repos/${repoKey}`, {
        headers: {
          Accept: "application/vnd.github+json",
        },
      });

      if (!response.ok) {
        return [repoKey, fallbackStats];
      }

      const payload = await response.json();

      return [
        repoKey,
        {
          stars:
            typeof payload.stargazers_count === "number"
              ? payload.stargazers_count
              : null,
          forks:
            typeof payload.forks_count === "number" ? payload.forks_count : null,
        },
      ];
    } catch {
      return [repoKey, fallbackStats];
    }
  }),
);

const repoStats = Object.fromEntries(repoStatsEntries);
const statsBySlug = {};

for (const [slug, repoKey] of Object.entries(slugToRepo)) {
  statsBySlug[slug] = repoKey
    ? repoStats[repoKey] ?? existingStatsBySlug[slug] ?? { stars: null, forks: null }
    : existingStatsBySlug[slug] ?? { stars: null, forks: null };
}

mkdirSync(dataDir, { recursive: true });
writeFileSync(
  outputPath,
  `${JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      statsBySlug,
    },
    null,
    2,
  )}\n`,
);

console.log(`Generated repo stats for ${Object.keys(statsBySlug).length} skills at ${path.relative(projectRoot, outputPath)}`);
