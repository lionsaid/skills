import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, "..");
const sourcesPath = path.join(projectRoot, "config", "skill-sources.json");
const seedPath = path.join(projectRoot, "config", "github-skill-repos.json");
const highStarPath = path.join(projectRoot, "src", "data", "github-high-star-repos.generated.json");
const outputDir = path.join(projectRoot, "src", "data");
const outputPath = path.join(outputDir, "github-repo-expansion.generated.json");
const githubToken = process.env.GITHUB_TOKEN?.trim() || null;

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, "utf8"));
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function githubHeaders() {
  return {
    Accept: "application/vnd.github+json",
    "User-Agent": "lionsaid-skills-web",
    ...(githubToken ? { Authorization: `Bearer ${githubToken}` } : {}),
  };
}

async function fetchGithubJson(url) {
  const response = await fetch(url, {
    headers: githubHeaders(),
  });

  if (!response.ok) {
    return null;
  }

  return await response.json();
}

function normalizeRepositoryList(values) {
  return values.filter((value) => typeof value === "string" && /^[^/]+\/[^/]+$/.test(value));
}

function getDefaultBranchUrl(repository, branch, skillPath) {
  return `https://github.com/${repository}/blob/${branch}/${skillPath}`;
}

function buildSkillEntry({ repository, branch, skillPath }) {
  const pathParts = skillPath.split("/");
  const skillName = pathParts.at(-2);
  const owner = repository.split("/")[0];

  return {
    repository,
    skillName,
    path: skillPath,
    url: getDefaultBranchUrl(repository, branch, skillPath),
    description: `${source.descriptionFallback}: ${repository}`,
    slug: slugify(`${owner}/${skillName}`),
  };
}

async function fetchRepositoryMetadata(repository) {
  return await fetchGithubJson(`https://api.github.com/repos/${repository}`);
}

async function fetchRepositoryTree(repository, branch) {
  return await fetchGithubJson(
    `https://api.github.com/repos/${repository}/git/trees/${encodeURIComponent(branch)}?recursive=1`,
  );
}

const sources = readJson(sourcesPath);
const source = sources.find((item) => item.id === "github-repo-expansion");

if (!source) {
  throw new Error("Missing github-repo-expansion source config.");
}

const repositories = normalizeRepositoryList(readJson(seedPath));
const highStarRepositories = (() => {
  try {
    const payload = readJson(highStarPath);
    if (!Array.isArray(payload.repositories)) {
      return [];
    }

    return normalizeRepositoryList(payload.repositories.map((item) => item?.repository));
  } catch {
    return [];
  }
})();

const repositoriesToScan = [...new Set([...highStarRepositories, ...repositories])].slice(
  0,
  source.maxRepositories,
);

const items = [];
const repositoryDiagnostics = [];

for (const repository of repositoriesToScan) {
  try {
    const metadata = await fetchRepositoryMetadata(repository);
    if (!metadata?.default_branch) {
      repositoryDiagnostics.push({
        repository,
        status: "skipped",
        reason: "missing-default-branch",
      });
      continue;
    }

    const treePayload = await fetchRepositoryTree(repository, metadata.default_branch);
    const tree = Array.isArray(treePayload?.tree) ? treePayload.tree : [];
    const skillPaths = tree
      .filter((node) => node?.type === "blob" && typeof node.path === "string")
      .map((node) => node.path)
      .filter((filePath) => /^skills\/.+\/SKILL\.md$/i.test(filePath));

    if (skillPaths.length === 0) {
      repositoryDiagnostics.push({
        repository,
        status: "scanned",
        branch: metadata.default_branch,
        skillsFound: 0,
      });
      continue;
    }

    for (const skillPath of skillPaths) {
      items.push(
        buildSkillEntry({
          repository,
          branch: metadata.default_branch,
          skillPath,
        }),
      );
    }

    repositoryDiagnostics.push({
      repository,
      status: "scanned",
      branch: metadata.default_branch,
      skillsFound: skillPaths.length,
    });
  } catch (error) {
    repositoryDiagnostics.push({
      repository,
      status: "failed",
      reason: error instanceof Error ? error.message : "unknown-error",
    });
  }
}

const deduped = new Map();
for (const item of items) {
  if (!deduped.has(item.slug)) {
    deduped.set(item.slug, item);
  }
}

mkdirSync(outputDir, { recursive: true });
writeFileSync(
  outputPath,
  `${JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      totalItems: deduped.size,
      repositoriesScanned: repositoriesToScan,
      highStarRepositoriesSeeded: highStarRepositories,
      repositoryDiagnostics,
      items: [...deduped.values()],
    },
    null,
    2,
  )}\n`,
);

console.log(`Cached ${deduped.size} GitHub repo expansion items at ${path.relative(projectRoot, outputPath)}`);
