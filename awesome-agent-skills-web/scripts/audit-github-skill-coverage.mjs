import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, "..");
const dataDir = path.join(projectRoot, "src", "data");
const outputPath = path.join(dataDir, "github-skill-coverage-audit.generated.json");
const minStars = Number(process.env.GITHUB_SKILL_AUDIT_MIN_STARS ?? 100);
const perPage = Number(process.env.GITHUB_SKILL_AUDIT_PER_PAGE ?? 100);
const maxPages = Number(process.env.GITHUB_SKILL_AUDIT_MAX_PAGES ?? 2);
const maxCandidates = Number(process.env.GITHUB_SKILL_AUDIT_MAX_CANDIDATES ?? 240);
const treeConcurrency = Number(process.env.GITHUB_SKILL_AUDIT_TREE_CONCURRENCY ?? 12);
const githubToken = process.env.GITHUB_TOKEN?.trim() || null;

const queries = [
  "skill agent",
  "claude skill",
  "claude skills",
  "agent skill",
  "agent skills",
  "ai skill",
  "ai skills",
  "codex skill",
  "codex skills",
  "SKILL.md",
  "filename:SKILL.md",
];

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

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getSkillNameFromPath(repository, skillPath) {
  const normalizedPath = skillPath.replace(/\\/g, "/");
  if (/^SKILL\.md$/i.test(normalizedPath)) {
    return repository.split("/")[1] ?? repository;
  }

  const withoutFile = normalizedPath.replace(/\/SKILL\.md$/i, "");
  const parts = withoutFile.split("/").filter(Boolean);
  const skillsIndex = parts.findIndex((part) => part.toLowerCase() === "skills");

  if (skillsIndex >= 0 && parts[skillsIndex + 1]) {
    return parts[skillsIndex + 1];
  }

  return parts.at(-1) ?? withoutFile;
}

function getExpectedSlug(repository, skillPath) {
  const owner = repository.split("/")[0];
  return slugify(`${owner}/${getSkillNameFromPath(repository, skillPath)}`);
}

function githubHeaders() {
  return {
    Accept: "application/vnd.github+json",
    "User-Agent": "lionsaid-skills-web",
    ...(githubToken ? { Authorization: `Bearer ${githubToken}` } : {}),
  };
}

async function fetchGithubJson(url) {
  const response = await fetch(url, { headers: githubHeaders() });
  if (!response.ok) {
    throw new Error(`GitHub API ${response.status}: ${url}`);
  }
  return await response.json();
}

async function searchRepositories(query) {
  const repositories = [];
  for (let page = 1; page <= maxPages; page += 1) {
    const url = new URL("https://api.github.com/search/repositories");
    url.searchParams.set("q", `${query} stars:>=${minStars}`);
    url.searchParams.set("sort", "stars");
    url.searchParams.set("order", "desc");
    url.searchParams.set("per_page", String(perPage));
    url.searchParams.set("page", String(page));

    const payload = await fetchGithubJson(url);
    repositories.push(...(Array.isArray(payload.items) ? payload.items : []));

    if (!Array.isArray(payload.items) || payload.items.length < perPage) {
      break;
    }
  }
  return repositories;
}

async function getSkillPaths(repository, defaultBranch) {
  try {
    const tree = await fetchGithubJson(
      `https://api.github.com/repos/${repository}/git/trees/${encodeURIComponent(defaultBranch)}?recursive=1`,
    );
    return (Array.isArray(tree.tree) ? tree.tree : [])
      .filter((item) => item?.type === "blob" && /(^|\/)SKILL\.md$/i.test(item.path))
      .map((item) => item.path)
      .sort((a, b) => a.localeCompare(b));
  } catch {
    return [];
  }
}

async function mapWithConcurrency(items, concurrency, mapper) {
  const results = [];
  let cursor = 0;

  async function worker() {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await mapper(items[index], index);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, () => worker()),
  );
  return results;
}

const skillsPayload = readJson(path.join(dataDir, "skills.generated.json"));
const highStarPayload = readJson(path.join(dataDir, "github-high-star-repos.generated.json"));
const skills = Array.isArray(skillsPayload.skills) ? skillsPayload.skills : [];
const knownRepositories = new Set();
const knownSkillSlugs = new Set(skills.map((skill) => skill.slug).filter(Boolean));
for (const skill of skills) {
  if (typeof skill.repository === "string") {
    knownRepositories.add(skill.repository);
  }

  const repositoryFromUrl = getGithubRepository(skill.url);
  if (repositoryFromUrl) {
    knownRepositories.add(repositoryFromUrl);
  }
}
const highStarRepositories = new Set(
  (Array.isArray(highStarPayload.repositories) ? highStarPayload.repositories : [])
    .map((item) => item?.repository)
    .filter((repository) => typeof repository === "string"),
);

const candidates = new Map();
const queryDiagnostics = [];

for (const query of queries) {
  const repositories = await searchRepositories(query);
  queryDiagnostics.push({ query, repositories: repositories.length });
  for (const repository of repositories) {
    if (typeof repository?.full_name !== "string") {
      continue;
    }
    const existing = candidates.get(repository.full_name);
    if (!existing || repository.stargazers_count > existing.stargazers_count) {
      candidates.set(repository.full_name, repository);
    }
  }
}

const missing = [];
const covered = [];
const scanned = [];
const candidatesToScan = [...candidates.values()]
  .sort((a, b) => b.stargazers_count - a.stargazers_count)
  .slice(0, maxCandidates);

const auditedItems = await mapWithConcurrency(candidatesToScan, treeConcurrency, async (repository) => {
  const fullName = repository.full_name;
  const skillPaths = await getSkillPaths(fullName, repository.default_branch ?? "main");
  if (skillPaths.length === 0) {
    return null;
  }

  return {
    repository: fullName,
    stars: repository.stargazers_count,
    defaultBranch: repository.default_branch,
    description: repository.description ?? "",
    skillPaths,
    missingSkillPaths: skillPaths.filter((skillPath) => !knownSkillSlugs.has(getExpectedSlug(fullName, skillPath))),
    inFinalSkills:
      knownRepositories.has(fullName) ||
      skillPaths.every((skillPath) => knownSkillSlugs.has(getExpectedSlug(fullName, skillPath))),
    inHighStarList: highStarRepositories.has(fullName),
  };
});

for (const item of auditedItems.filter(Boolean)) {
  scanned.push(item);

  if (item.inFinalSkills && item.inHighStarList) {
    covered.push(item);
  } else {
    missing.push(item);
  }
}

mkdirSync(dataDir, { recursive: true });
writeFileSync(
  outputPath,
  `${JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      minStars,
      queryDiagnostics,
      totalCandidates: candidates.size,
      maxCandidates,
      treeConcurrency,
      totalWithSkillMd: scanned.length,
      coveredCount: covered.length,
      missingCount: missing.length,
      missing,
      covered,
    },
    null,
    2,
  )}\n`,
);

console.log(
  `Audited ${scanned.length} GitHub repositories with SKILL.md and ${minStars}+ stars. Missing: ${missing.length}.`,
);
for (const item of missing.slice(0, 30)) {
  console.log(`- ${item.repository} (${item.stars} stars): ${item.skillPaths.join(", ")}`);
}
