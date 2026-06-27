import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, "..");
const dataDir = path.join(projectRoot, "src", "data");
const skillsPath = path.join(dataDir, "skills.generated.json");
const outputPath = path.join(dataDir, "repo-stats.generated.json");
const repoCacheDir = path.join(dataDir, "repo-stats-cache");
const githubToken = process.env.GITHUB_TOKEN?.trim() || null;
const repoStatsCacheTtlMs = Number(process.env.GITHUB_REPO_STATS_CACHE_TTL_HOURS ?? 12) * 60 * 60 * 1000;

function readStatsPayload(filePath) {
  try {
    const payload = JSON.parse(readFileSync(filePath, "utf8"));
    return payload && typeof payload.statsBySlug === "object" && !Array.isArray(payload.statsBySlug)
      ? payload
      : { statsBySlug: {} };
  } catch {
    return { statsBySlug: {} };
  }
}

function readCommittedStatsPayload() {
  try {
    const raw = execFileSync(
      "git",
      ["show", "HEAD~1:awesome-agent-skills-web/src/data/repo-stats.generated.json"],
      {
        cwd: path.join(projectRoot, ".."),
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
        maxBuffer: 32 * 1024 * 1024,
      },
    );

    const payload = JSON.parse(raw);
    return payload && typeof payload.statsBySlug === "object" && !Array.isArray(payload.statsBySlug)
      ? payload
      : { statsBySlug: {} };
  } catch {
    return { statsBySlug: {} };
  }
}

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, "utf8"));
}

function getRepositoryKey(url) {
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

function getRepositoryCacheFilePath(repository) {
  const [owner, repo] = repository.split("/");
  return path.join(repoCacheDir, owner ?? "_unknown", `${repo ?? "repo"}.json`);
}

function isFreshTimestamp(value) {
  if (typeof value !== "string" || !value) {
    return false;
  }

  const ts = Date.parse(value);
  if (Number.isNaN(ts)) {
    return false;
  }

  return Date.now() - ts < repoStatsCacheTtlMs;
}

function readRepositoryStatsCache() {
  if (!existsSync(repoCacheDir)) {
    return {};
  }

  const cache = {};
  for (const ownerDir of readdirSync(repoCacheDir, { withFileTypes: true })) {
    if (!ownerDir.isDirectory()) {
      continue;
    }

    const ownerPath = path.join(repoCacheDir, ownerDir.name);
    for (const file of readdirSync(ownerPath, { withFileTypes: true })) {
      if (!file.isFile() || !file.name.endsWith(".json")) {
        continue;
      }

      try {
        const payload = readJson(path.join(ownerPath, file.name));
        if (typeof payload?.repository === "string") {
          cache[payload.repository] = payload;
        }
      } catch {
        continue;
      }
    }
  }

  return cache;
}

function persistRepositoryStats(repository, payload) {
  const filePath = getRepositoryCacheFilePath(repository);
  mkdirSync(path.dirname(filePath), { recursive: true });
  writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`);
}

function githubHeaders() {
  return {
    Accept: "application/vnd.github+json",
    "User-Agent": "lionsaid-skills-web",
    ...(githubToken ? { Authorization: `Bearer ${githubToken}` } : {}),
  };
}

async function fetchGithubRepoStats(repository) {
  const response = await fetch(`https://api.github.com/repos/${repository}`, {
    headers: githubHeaders(),
  });

  if (!response.ok) {
    const error = new Error(`GitHub API ${response.status} for ${repository}`);
    error.status = response.status;
    error.rateLimited =
      response.status === 403 && response.headers.get("x-ratelimit-remaining") === "0";
    throw error;
  }

  const payload = await response.json();
  return {
    repository,
    stars:
      typeof payload.stargazers_count === "number" ? payload.stargazers_count : null,
    forks:
      typeof payload.forks_count === "number" ? payload.forks_count : null,
    pushedAt: typeof payload.pushed_at === "string" ? payload.pushed_at : null,
    fetchedAt: new Date().toISOString(),
  };
}

const skillsPayload = readJson(skillsPath);
const skills = Array.isArray(skillsPayload.skills) ? skillsPayload.skills : [];
const existingPayload = readStatsPayload(outputPath);
const committedPayload = readCommittedStatsPayload();
const existingStatsBySlug = existingPayload.statsBySlug ?? {};
const committedStatsBySlug = committedPayload.statsBySlug ?? {};
const repositoryCache = readRepositoryStatsCache();
const diagnostics = {
  totalSkills: skills.length,
  repositoriesConsidered: 0,
  fetchedFromApi: 0,
  reusedFreshCache: 0,
  fallbackFromCache: 0,
  rateLimited: 0,
  failed: 0,
  cacheTtlHours: repoStatsCacheTtlMs / (60 * 60 * 1000),
};

const slugToRepo = {};
const repos = new Set();

for (const skill of skills) {
  const repoKey = getRepositoryKey(skill.url);
  slugToRepo[skill.slug] = repoKey;
  if (repoKey) {
    repos.add(repoKey);
  }
}

diagnostics.repositoriesConsidered = repos.size;

const repoStatsEntries = await Promise.all(
  [...repos].map(async (repoKey) => {
    const fallbackStats =
      Object.entries(slugToRepo)
        .filter(([, value]) => value === repoKey)
        .map(([slug]) => existingStatsBySlug[slug] ?? committedStatsBySlug[slug])
        .find(
          (value) =>
            value &&
            (typeof value.stars === "number" || typeof value.forks === "number"),
        ) ?? { stars: null, forks: null };
    const cachedRepositoryStats = repositoryCache[repoKey];

    if (cachedRepositoryStats && isFreshTimestamp(cachedRepositoryStats.fetchedAt)) {
      diagnostics.reusedFreshCache += 1;
      return [
        repoKey,
        {
          stars:
            typeof cachedRepositoryStats.stars === "number" ? cachedRepositoryStats.stars : null,
          forks:
            typeof cachedRepositoryStats.forks === "number" ? cachedRepositoryStats.forks : null,
        },
      ];
    }

    try {
      const payload = await fetchGithubRepoStats(repoKey);
      persistRepositoryStats(repoKey, payload);
      diagnostics.fetchedFromApi += 1;

      return [
        repoKey,
        {
          stars: payload.stars,
          forks: payload.forks,
        },
      ];
    } catch (error) {
      if (cachedRepositoryStats) {
        diagnostics.fallbackFromCache += 1;
        if (error?.rateLimited) {
          diagnostics.rateLimited += 1;
        } else {
          diagnostics.failed += 1;
        }
        return [
          repoKey,
          {
            stars:
              typeof cachedRepositoryStats.stars === "number" ? cachedRepositoryStats.stars : fallbackStats.stars,
            forks:
              typeof cachedRepositoryStats.forks === "number" ? cachedRepositoryStats.forks : fallbackStats.forks,
          },
        ];
      }

      diagnostics.fallbackFromCache += 1;
      if (error?.rateLimited) {
        diagnostics.rateLimited += 1;
      } else {
        diagnostics.failed += 1;
      }
      return [repoKey, fallbackStats];
    }
  }),
);

const repoStats = Object.fromEntries(repoStatsEntries);
const statsBySlug = {};

for (const [slug, repoKey] of Object.entries(slugToRepo)) {
  statsBySlug[slug] = repoKey
    ? repoStats[repoKey] ??
      existingStatsBySlug[slug] ??
      committedStatsBySlug[slug] ??
      { stars: null, forks: null }
    : existingStatsBySlug[slug] ?? committedStatsBySlug[slug] ?? { stars: null, forks: null };
}

mkdirSync(dataDir, { recursive: true });
mkdirSync(repoCacheDir, { recursive: true });
writeFileSync(
  outputPath,
  `${JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      statsBySlug,
      diagnostics,
    },
    null,
    2,
  )}\n`,
);

console.log(
  `Generated repo stats for ${Object.keys(statsBySlug).length} skills at ${path.relative(projectRoot, outputPath)} ` +
    `(repos=${diagnostics.repositoriesConsidered}, api=${diagnostics.fetchedFromApi}, freshCache=${diagnostics.reusedFreshCache}, fallback=${diagnostics.fallbackFromCache}, rateLimited=${diagnostics.rateLimited}, failed=${diagnostics.failed})`,
);
