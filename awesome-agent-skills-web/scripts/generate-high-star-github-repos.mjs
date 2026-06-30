import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, "..");
const dataDir = path.join(projectRoot, "src", "data");
const skillsPath = path.join(dataDir, "skills.generated.json");
const repoStatsPath = path.join(dataDir, "repo-stats.generated.json");
const repoStatsCacheDir = path.join(dataDir, "repo-stats-cache");
const seedReposPath = path.join(projectRoot, "config", "github-skill-repos.json");
const coverageAuditPath = path.join(dataDir, "github-skill-coverage-audit.generated.json");
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

function normalizeRepository(value) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  if (!/^[^/\s]+\/[^/\s]+$/.test(trimmed)) {
    return null;
  }

  return trimmed;
}

function readRepositoryStatsCache() {
  if (!existsSync(repoStatsCacheDir)) {
    return {};
  }

  const cache = {};
  for (const ownerDir of readdirSync(repoStatsCacheDir, { withFileTypes: true })) {
    if (!ownerDir.isDirectory()) {
      continue;
    }

    const ownerPath = path.join(repoStatsCacheDir, ownerDir.name);
    for (const file of readdirSync(ownerPath, { withFileTypes: true })) {
      if (!file.isFile() || !file.name.endsWith(".json")) {
        continue;
      }

      try {
        const payload = readJson(path.join(ownerPath, file.name));
        if (typeof payload?.repository === "string") {
          cache[payload.repository.toLowerCase()] = payload;
        }
      } catch {
        continue;
      }
    }
  }

  return cache;
}

function upsertRepository(repositories, repository, stars, extra = {}) {
  if (!repository || typeof stars !== "number" || stars < minStars) {
    return;
  }

  const key = repository.toLowerCase();
  const existing = repositories.get(key) ?? {
    repository,
    stars,
    skillSlugs: [],
    skillNames: [],
    publishers: [],
    skillPaths: [],
    description: "",
    defaultBranch: null,
    sources: [],
  };

  existing.stars = Math.max(existing.stars, stars);
  existing.skillSlugs = [...new Set([...(existing.skillSlugs ?? []), ...(extra.skillSlugs ?? [])])].sort();
  existing.skillNames = [...new Set([...(existing.skillNames ?? []), ...(extra.skillNames ?? [])])].sort();
  existing.publishers = [...new Set([...(existing.publishers ?? []), ...(extra.publishers ?? [])])].sort();
  existing.skillPaths = [...new Set([...(existing.skillPaths ?? []), ...(extra.skillPaths ?? [])])].sort();
  existing.sources = [...new Set([...(existing.sources ?? []), ...(extra.sources ?? [])])].sort();

  if (!existing.description && typeof extra.description === "string") {
    existing.description = extra.description;
  }

  if (!existing.defaultBranch && typeof extra.defaultBranch === "string") {
    existing.defaultBranch = extra.defaultBranch;
  }

  repositories.set(key, existing);
}

const skillsPayload = readJson(skillsPath);
const repoStatsPayload = readJson(repoStatsPath);
const skills = Array.isArray(skillsPayload.skills) ? skillsPayload.skills : [];
const statsBySlug =
  repoStatsPayload && typeof repoStatsPayload.statsBySlug === "object" && !Array.isArray(repoStatsPayload.statsBySlug)
    ? repoStatsPayload.statsBySlug
    : {};
const statsByRepository = readRepositoryStatsCache();

const repositories = new Map();

for (const skill of skills) {
  const repository = getGithubRepository(skill.url);
  const stars = statsBySlug[skill.slug]?.stars;

  if (!repository || typeof stars !== "number" || stars < minStars) {
    continue;
  }

  upsertRepository(repositories, repository, stars, {
    skillSlugs: [skill.slug],
    skillNames: [skill.name],
    publishers: [skill.publisher],
    sources: ["skills"],
  });
}

try {
  const seedRepos = readJson(seedReposPath);

  for (const seedRepo of Array.isArray(seedRepos) ? seedRepos : []) {
    const repository = normalizeRepository(seedRepo);
    if (!repository) {
      continue;
    }

    const stats = statsByRepository[repository.toLowerCase()];
    const stars = stats?.stars;

    if (typeof stars !== "number" || stars < minStars) {
      continue;
    }

    upsertRepository(repositories, repository, stars, {
      sources: ["seed-repos"],
    });
  }
} catch {
  // Seed repositories are optional; normal generated skill stats still drive this file.
}

try {
  const coverageAudit = readJson(coverageAuditPath);
  const auditItems = [
    ...(Array.isArray(coverageAudit.covered) ? coverageAudit.covered : []),
    ...(Array.isArray(coverageAudit.missing) ? coverageAudit.missing : []),
  ];

  for (const item of auditItems) {
    const repository = normalizeRepository(item?.repository);
    const stars = item?.stars;
    upsertRepository(repositories, repository, stars, {
      skillPaths: Array.isArray(item?.skillPaths) ? item.skillPaths : [],
      description: item?.description,
      defaultBranch: item?.defaultBranch,
      sources: ["coverage-audit"],
    });
  }
} catch {
  // Coverage audit is generated separately and may not exist in fresh checkouts.
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
