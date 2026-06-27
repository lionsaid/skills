import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, "..");
const sourcesPath = path.join(projectRoot, "config", "skill-sources.json");
const seedPath = path.join(projectRoot, "config", "github-skill-repos.json");
const highStarPath = path.join(projectRoot, "src", "data", "github-high-star-repos.generated.json");
const outputDir = path.join(projectRoot, "src", "data");
const outputPath = path.join(outputDir, "github-repo-expansion.generated.json");
const repoCacheDir = path.join(outputDir, "github-repo-expansion-cache");
const githubToken = process.env.GITHUB_TOKEN?.trim() || null;
const gitFallbackTimeoutMs = 20_000;
const githubFetchTimeoutMs = 15_000;
const metadataCacheTtlMs = Number(process.env.GITHUB_REPO_EXPANSION_CACHE_TTL_HOURS ?? 12) * 60 * 60 * 1000;

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

function normalizeRepositoryList(values) {
  return values.filter((value) => typeof value === "string" && /^[^/]+\/[^/]+$/.test(value));
}

function isEligibleSkillPath(skillPath) {
  if (typeof skillPath !== "string" || !/(^|\/)SKILL\.md$/i.test(skillPath)) {
    return false;
  }

  const segments = skillPath.split("/").filter(Boolean);
  const directorySegments = segments.slice(0, -1);
  return !directorySegments.some((segment) => segment.startsWith("."));
}

function getNormalizedSkillPath(skillPath, repository = null) {
  if (typeof skillPath !== "string") {
    return null;
  }

  const match = skillPath.match(/^skills\/(.+)\/SKILL\.md$/i);
  if (match?.[1]) {
    return match[1];
  }

  const nestedMatch = skillPath.match(/^(.+)\/SKILL\.md$/i);
  if (nestedMatch?.[1]) {
    return nestedMatch[1];
  }

  if (/^SKILL\.md$/i.test(skillPath) && typeof repository === "string") {
    return repository.split("/")[1] ?? repository;
  }

  return null;
}

function getDefaultBranchUrl(repository, branch, skillPath) {
  return `https://github.com/${repository}/blob/${branch}/${skillPath}`;
}

function normalizeSkillEntryShape(entry) {
  if (!entry?.repository || !entry?.path) {
    return entry;
  }

  const normalizedSkillPath = getNormalizedSkillPath(entry.path, entry.repository);
  if (!normalizedSkillPath) {
    return entry;
  }

  const repository = entry.repository;
  const owner = repository.split("/")[0];
  const branch =
    typeof entry.branch === "string" && entry.branch
      ? entry.branch
      : typeof entry.url === "string" && entry.url.includes("/blob/")
        ? entry.url.split("/blob/")[1]?.split("/")[0] || "main"
        : "main";

  return {
    ...entry,
    repository,
    branch,
    skillName: normalizedSkillPath,
    url: getDefaultBranchUrl(repository, branch, entry.path),
    slug: slugify(`${owner}/${normalizedSkillPath}`),
  };
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
    signal: AbortSignal.timeout(githubFetchTimeoutMs),
  });

  if (!response.ok) {
    const rateLimitRemaining = response.headers.get("x-ratelimit-remaining");
    const rateLimitReset = response.headers.get("x-ratelimit-reset");
    const bodyText = await response.text();
    const error = new Error(
      `GitHub API ${response.status} for ${url}: ${bodyText.slice(0, 200) || response.statusText}`,
    );
    error.name =
      response.status === 403 && rateLimitRemaining === "0"
        ? "GitHubRateLimitError"
        : "GitHubApiError";
    error.status = response.status;
    error.rateLimitRemaining = rateLimitRemaining;
    error.rateLimitReset = rateLimitReset;
    throw error;
  }

  return await response.json();
}

function buildSkillEntry({ repository, branch, skillPath }) {
  const skillName = getNormalizedSkillPath(skillPath, repository);
  const owner = repository.split("/")[0];

  if (!skillName) {
    return null;
  }

  return {
    repository,
    branch,
    skillName,
    path: skillPath,
    url: getDefaultBranchUrl(repository, branch, skillPath),
    description: `${source.descriptionFallback}: ${repository}`,
    slug: slugify(`${owner}/${skillName}`),
  };
}

function groupItemsByRepository(entries) {
  const itemsByRepository = new Map();

  for (const rawEntry of entries) {
    const entry = normalizeSkillEntryShape(rawEntry);
    if (!entry?.repository) {
      continue;
    }

    const existing = itemsByRepository.get(entry.repository) ?? [];
    existing.push(entry);
    itemsByRepository.set(entry.repository, existing);
  }

  return itemsByRepository;
}

function normalizeRepositorySnapshot(repository, snapshot, diagnosticsMap, itemsMap) {
  const items = Array.isArray(snapshot?.items)
    ? snapshot.items.map(normalizeSkillEntryShape)
    : itemsMap.get(repository) ?? [];
  const diagnostics = diagnosticsMap.get(repository) ?? null;

  return {
    repository,
    branch:
      typeof snapshot?.branch === "string" && snapshot.branch
        ? snapshot.branch
        : typeof diagnostics?.branch === "string" && diagnostics.branch
          ? diagnostics.branch
          : items[0]?.branch ?? null,
    defaultBranch:
      typeof snapshot?.defaultBranch === "string" && snapshot.defaultBranch
        ? snapshot.defaultBranch
        : typeof diagnostics?.branch === "string" && diagnostics.branch
          ? diagnostics.branch
          : items[0]?.branch ?? null,
    pushedAt: typeof snapshot?.pushedAt === "string" ? snapshot.pushedAt : null,
    scannedAt: typeof snapshot?.scannedAt === "string" ? snapshot.scannedAt : null,
    treeSha: typeof snapshot?.treeSha === "string" ? snapshot.treeSha : null,
    items,
    itemCount: typeof snapshot?.itemCount === "number" ? snapshot.itemCount : items.length,
    lastStatus:
      typeof snapshot?.lastStatus === "string"
        ? snapshot.lastStatus
        : typeof diagnostics?.status === "string"
          ? diagnostics.status
          : items.length > 0
            ? "cached"
            : "empty",
  };
}

function getRepositoryCacheFilePath(repository) {
  const [owner, repo] = repository.split("/");
  return path.join(repoCacheDir, owner ?? "_unknown", `${repo ?? "repo"}.json`);
}

function readRepositorySnapshotFile(filePath) {
  try {
    const payload = readJson(filePath);
    if (typeof payload?.repository !== "string") {
      return null;
    }

    return normalizeRepositorySnapshot(
      payload.repository,
      payload,
      new Map(),
      new Map(),
    );
  } catch {
    return null;
  }
}

function readRepositorySnapshotsFromDirectory() {
  if (!existsSync(repoCacheDir)) {
    return {};
  }

  const snapshots = {};
  const ownerDirs = readdirSync(repoCacheDir, { withFileTypes: true }).filter((entry) =>
    entry.isDirectory(),
  );

  for (const ownerDir of ownerDirs) {
    const ownerPath = path.join(repoCacheDir, ownerDir.name);
    const files = readdirSync(ownerPath, { withFileTypes: true }).filter((entry) =>
      entry.isFile() && entry.name.endsWith(".json"),
    );

    for (const file of files) {
      const snapshot = readRepositorySnapshotFile(path.join(ownerPath, file.name));
      if (snapshot?.repository) {
        snapshots[snapshot.repository] = snapshot;
      }
    }
  }

  return snapshots;
}

function normalizeCachePayload(payload) {
  const items = Array.isArray(payload?.items)
    ? payload.items.map(normalizeSkillEntryShape)
    : [];
  const repositoryDiagnostics = Array.isArray(payload?.repositoryDiagnostics)
    ? payload.repositoryDiagnostics
    : [];
  const diagnosticsMap = new Map(
    repositoryDiagnostics
      .filter((item) => item?.repository)
      .map((item) => [item.repository, item]),
  );
  const itemsMap = groupItemsByRepository(items);
  const repositorySnapshots = {};

  if (payload?.repositories && typeof payload.repositories === "object" && !Array.isArray(payload.repositories)) {
    for (const [repository, snapshot] of Object.entries(payload.repositories)) {
      repositorySnapshots[repository] = normalizeRepositorySnapshot(
        repository,
        snapshot,
        diagnosticsMap,
        itemsMap,
      );
    }
  }

  for (const repository of itemsMap.keys()) {
    if (!repositorySnapshots[repository]) {
      repositorySnapshots[repository] = normalizeRepositorySnapshot(
        repository,
        null,
        diagnosticsMap,
        itemsMap,
      );
    }
  }

  for (const [repository, snapshot] of Object.entries(readRepositorySnapshotsFromDirectory())) {
    repositorySnapshots[repository] = normalizeRepositorySnapshot(
      repository,
      snapshot,
      diagnosticsMap,
      itemsMap,
    );
  }

  return {
    generatedAt:
      typeof payload?.generatedAt === "string" ? payload.generatedAt : null,
    items,
    repositoryDiagnostics,
    repositories: repositorySnapshots,
  };
}

function readExistingExpansionCache() {
  try {
    return normalizeCachePayload(readJson(outputPath));
  } catch {
    return {
      generatedAt: null,
      items: [],
      repositoryDiagnostics: [],
      repositories: {},
    };
  }
}

function readCommittedExpansionCache() {
  try {
    const raw = execFileSync(
      "git",
      ["show", "HEAD~1:awesome-agent-skills-web/src/data/github-repo-expansion.generated.json"],
      {
        cwd: path.join(projectRoot, ".."),
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
        maxBuffer: 32 * 1024 * 1024,
      },
    );
    return normalizeCachePayload(JSON.parse(raw));
  } catch {
    return {
      generatedAt: null,
      items: [],
      repositoryDiagnostics: [],
      repositories: {},
    };
  }
}

function getRepositorySnapshot(cache, repository) {
  return cache.repositories?.[repository] ?? null;
}

function persistRepositorySnapshot(snapshot) {
  if (!snapshot?.repository) {
    return;
  }

  const filePath = getRepositoryCacheFilePath(snapshot.repository);
  mkdirSync(path.dirname(filePath), { recursive: true });
  writeFileSync(`${filePath}`, `${JSON.stringify(snapshot, null, 2)}\n`);
}

function hasUsableSnapshot(snapshot) {
  return Boolean(snapshot && Array.isArray(snapshot.items) && snapshot.items.length > 0);
}

function isRecentlyScanned(snapshot) {
  if (!snapshot?.scannedAt) {
    return false;
  }

  const scannedAtMs = Date.parse(snapshot.scannedAt);
  if (Number.isNaN(scannedAtMs)) {
    return false;
  }

  return Date.now() - scannedAtMs < metadataCacheTtlMs;
}

function selectFallbackRepositorySnapshot(repository, ...caches) {
  for (const cache of caches) {
    const snapshot = getRepositorySnapshot(cache, repository);
    if (hasUsableSnapshot(snapshot)) {
      return snapshot;
    }
  }
  return null;
}

async function fetchRepositoryMetadata(repository) {
  return await fetchGithubJson(`https://api.github.com/repos/${repository}`);
}

async function fetchRepositoryTree(repository, branch) {
  return await fetchGithubJson(
    `https://api.github.com/repos/${repository}/git/trees/${encodeURIComponent(branch)}?recursive=1`,
  );
}

function runGit(args, cwd = projectRoot) {
  return execFileSync("git", args, {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    maxBuffer: 32 * 1024 * 1024,
    timeout: gitFallbackTimeoutMs,
  });
}

function runCommand(command, args, cwd = projectRoot, timeout = gitFallbackTimeoutMs) {
  return execFileSync(command, args, {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    maxBuffer: 32 * 1024 * 1024,
    timeout,
  });
}

function detectDefaultBranchViaGit(repository) {
  const output = runGit(
    ["ls-remote", "--symref", `https://github.com/${repository}.git`, "HEAD"],
    projectRoot,
  );
  const match = output.match(/ref:\s+refs\/heads\/([^\s]+)\s+HEAD/);
  return match?.[1] ?? "main";
}

function fetchRepositoryTreeViaGit(repository) {
  const cloneRoot = mkdtempSync(path.join(os.tmpdir(), "lionsaid-github-scan-"));

  try {
    runGit(
      [
        "clone",
        "--depth",
        "1",
        "--single-branch",
        "--no-tags",
        "--filter=blob:none",
        "--sparse",
        `https://github.com/${repository}.git`,
        cloneRoot,
      ],
      projectRoot,
    );

    runGit(["sparse-checkout", "set", "--no-cone", "SKILL.md", "skills"], cloneRoot);

    const headCommit = runGit(["rev-parse", "HEAD"], cloneRoot).trim();
    const defaultBranchRef = runGit(["symbolic-ref", "refs/remotes/origin/HEAD"], cloneRoot).trim();
    const defaultBranch = defaultBranchRef.split("/").pop() || "main";
    const paths = runGit(["ls-tree", "-r", "--name-only", "HEAD"], cloneRoot)
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .filter(isEligibleSkillPath)
      .sort((a, b) => a.localeCompare(b));

    return {
      defaultBranch,
      pushedAt: null,
      treeSha: headCommit,
      skillPaths: paths,
    };
  } finally {
    rmSync(cloneRoot, { recursive: true, force: true });
  }
}

function buildRepositorySnapshotFromGitFallback(repository) {
  const gitTree = fetchRepositoryTreeViaGit(repository);
  const items = gitTree.skillPaths
    .map((skillPath) =>
      buildSkillEntry({
        repository,
        branch: gitTree.defaultBranch,
        skillPath,
      }),
    )
    .filter(Boolean);

  return {
    repository,
    branch: gitTree.defaultBranch,
    defaultBranch: gitTree.defaultBranch,
    pushedAt: gitTree.pushedAt,
    scannedAt: new Date().toISOString(),
    treeSha: gitTree.treeSha,
    items,
    itemCount: items.length,
    lastStatus: "scanned-via-git-fallback",
  };
}

async function fetchRepositoryTreeViaArchive(repository) {
  const archiveRoot = mkdtempSync(path.join(os.tmpdir(), "lionsaid-github-archive-"));

  try {
    const defaultBranch = detectDefaultBranchViaGit(repository);
    const zipPath = path.join(archiveRoot, "repo.zip");
    const archiveUrl = `https://codeload.github.com/${repository}/zip/refs/heads/${defaultBranch}`;
    const response = await fetch(archiveUrl, {
      headers: {
        "User-Agent": "lionsaid-skills-web",
      },
      signal: AbortSignal.timeout(githubFetchTimeoutMs),
    });

    if (!response.ok) {
      throw new Error(`Archive download failed for ${repository}: HTTP ${response.status}`);
    }

    writeFileSync(zipPath, Buffer.from(await response.arrayBuffer()));
    const entries = runCommand("unzip", ["-Z1", zipPath], archiveRoot, 30_000)
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    const topLevelPrefix = entries[0]?.split("/")[0] ?? null;
    const skillPaths = entries
      .map((entry) =>
        topLevelPrefix && entry.startsWith(`${topLevelPrefix}/`)
          ? entry.slice(topLevelPrefix.length + 1)
          : entry,
      )
      .filter(isEligibleSkillPath)
      .sort((a, b) => a.localeCompare(b));

    return {
      defaultBranch,
      pushedAt: null,
      treeSha: null,
      skillPaths,
    };
  } finally {
    rmSync(archiveRoot, { recursive: true, force: true });
  }
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

const highPriorityRepositories = [...new Set(highStarRepositories)];
const seedRepositories = repositories.filter((repository) => !highPriorityRepositories.includes(repository));
const repositoriesToScan = [...highPriorityRepositories, ...seedRepositories].slice(
  0,
  Math.max(source.maxRepositories, highPriorityRepositories.length),
);
const highStarRepositorySet = new Set(highStarRepositories);

const existingCache = readExistingExpansionCache();
const committedCache = readCommittedExpansionCache();
const fallbackCache =
  Object.keys(existingCache.repositories).length > 0 ||
  existingCache.items.length > 0
    ? existingCache
    : committedCache;

const repositorySnapshots = {};
const repositoryDiagnostics = [];
let scanInterruptedByRateLimit = false;
const summary = {
  totalRepositoriesRequested: repositoriesToScan.length,
  repositoriesScannedFresh: 0,
  repositoriesReusedUnchanged: 0,
  repositoriesSkippedByFreshCache: 0,
  repositoriesRecoveredFromCache: 0,
  repositoriesMissingCache: 0,
  repositoriesRateLimited: 0,
  repositoriesScannedViaGitFallback: 0,
};

for (const repository of repositoriesToScan) {
  const existingSnapshot = getRepositorySnapshot(existingCache, repository);
  const committedSnapshot = getRepositorySnapshot(committedCache, repository);
  const fallbackSnapshot = selectFallbackRepositorySnapshot(
    repository,
    existingCache,
    committedCache,
  );
  const freshSnapshot =
    existingSnapshot && hasUsableSnapshot(existingSnapshot) && isRecentlyScanned(existingSnapshot)
      ? existingSnapshot
      : committedSnapshot && hasUsableSnapshot(committedSnapshot) && isRecentlyScanned(committedSnapshot)
        ? committedSnapshot
        : null;

  if (freshSnapshot) {
    repositorySnapshots[repository] = {
      ...freshSnapshot,
      lastStatus: "cache-fresh",
    };
    repositoryDiagnostics.push({
      repository,
      status: "cache-fresh",
      branch: freshSnapshot.branch ?? freshSnapshot.defaultBranch ?? null,
      pushedAt: freshSnapshot.pushedAt ?? null,
      cachedSkillsFound: freshSnapshot.items.length,
    });
    summary.repositoriesSkippedByFreshCache += 1;
    continue;
  }

  if (scanInterruptedByRateLimit) {
    if (!fallbackSnapshot && highStarRepositorySet.has(repository)) {
      try {
        const snapshot = buildRepositorySnapshotFromGitFallback(repository);
        repositorySnapshots[repository] = snapshot;
        repositoryDiagnostics.push({
          repository,
          status: "scanned-via-git-fallback",
          branch: snapshot.branch,
          skillsFound: snapshot.items.length,
          reason: "api-rate-limited-no-cache",
        });
        summary.repositoriesScannedViaGitFallback += 1;
        continue;
      } catch (gitError) {
        try {
          const archiveTree = await fetchRepositoryTreeViaArchive(repository);
          const items = archiveTree.skillPaths
            .map((skillPath) =>
              buildSkillEntry({
                repository,
                branch: archiveTree.defaultBranch,
                skillPath,
              }),
            )
            .filter(Boolean);

          repositorySnapshots[repository] = {
            repository,
            branch: archiveTree.defaultBranch,
            defaultBranch: archiveTree.defaultBranch,
            pushedAt: archiveTree.pushedAt,
            scannedAt: new Date().toISOString(),
            treeSha: archiveTree.treeSha,
            items,
            itemCount: items.length,
            lastStatus: "scanned-via-archive-fallback",
          };
          repositoryDiagnostics.push({
            repository,
            status: "scanned-via-archive-fallback",
            branch: archiveTree.defaultBranch,
            skillsFound: items.length,
            reason: gitError instanceof Error ? gitError.message : "git-fallback-failed-after-rate-limit",
          });
          summary.repositoriesScannedViaGitFallback += 1;
          continue;
        } catch (archiveError) {
          repositorySnapshots[repository] = {
            repository,
            defaultBranch: null,
            branch: null,
            pushedAt: null,
            scannedAt: null,
            treeSha: null,
            items: [],
            itemCount: 0,
            lastStatus: "git-fallback-failed-after-rate-limit",
          };
          repositoryDiagnostics.push({
            repository,
            status: "failed",
            reason: archiveError instanceof Error ? archiveError.message : "git-fallback-failed-after-rate-limit",
            cachedSkillsFound: 0,
          });
          summary.repositoriesMissingCache += 1;
          continue;
        }
      }
    }

    const snapshot = fallbackSnapshot ?? {
      repository,
      defaultBranch: null,
      branch: null,
      pushedAt: null,
      scannedAt: null,
      treeSha: null,
      items: [],
      itemCount: 0,
      lastStatus: "skipped-after-rate-limit",
    };
    repositorySnapshots[repository] = snapshot;
    repositoryDiagnostics.push({
      repository,
      status: snapshot.items.length > 0 ? "preserved-cache" : "skipped",
      reason: snapshot.items.length > 0 ? "scan-skipped-after-rate-limit" : "scan-skipped-after-rate-limit-no-cache",
      cachedSkillsFound: snapshot.items.length,
    });
    if (snapshot.items.length > 0) {
      summary.repositoriesRecoveredFromCache += 1;
    } else {
      summary.repositoriesMissingCache += 1;
    }
    continue;
  }

  try {
    const metadata = await fetchRepositoryMetadata(repository);
    const defaultBranch =
      typeof metadata?.default_branch === "string" && metadata.default_branch
        ? metadata.default_branch
        : null;
    const pushedAt =
      typeof metadata?.pushed_at === "string" && metadata.pushed_at
        ? metadata.pushed_at
        : null;
    const treeSha =
      typeof metadata?.default_branch === "string" &&
      metadata.default_branch &&
      typeof metadata?.pushed_at === "string"
        ? null
        : null;

    if (!defaultBranch) {
      const snapshot = fallbackSnapshot ?? {
        repository,
        defaultBranch: null,
        branch: null,
        pushedAt: null,
        scannedAt: null,
        treeSha: null,
        items: [],
        itemCount: 0,
        lastStatus: "missing-default-branch",
      };
      repositorySnapshots[repository] = snapshot;
      repositoryDiagnostics.push({
        repository,
        status: snapshot.items.length > 0 ? "preserved-cache" : "skipped",
        reason: snapshot.items.length > 0 ? "missing-default-branch-used-cache" : "missing-default-branch",
        cachedSkillsFound: snapshot.items.length,
      });
      if (snapshot.items.length > 0) {
        summary.repositoriesRecoveredFromCache += 1;
      } else {
        summary.repositoriesMissingCache += 1;
      }
      continue;
    }

    const reusableSnapshot =
      existingSnapshot &&
      existingSnapshot.defaultBranch === defaultBranch &&
      existingSnapshot.pushedAt &&
      pushedAt &&
      existingSnapshot.pushedAt === pushedAt &&
      Array.isArray(existingSnapshot.items) &&
      existingSnapshot.items.length > 0
        ? existingSnapshot
        : committedSnapshot &&
            committedSnapshot.defaultBranch === defaultBranch &&
            committedSnapshot.pushedAt &&
            pushedAt &&
            committedSnapshot.pushedAt === pushedAt &&
            Array.isArray(committedSnapshot.items) &&
            committedSnapshot.items.length > 0
          ? committedSnapshot
          : null;

    if (reusableSnapshot) {
      repositorySnapshots[repository] = {
        ...reusableSnapshot,
        branch: defaultBranch,
        defaultBranch,
        pushedAt,
        scannedAt: new Date().toISOString(),
        lastStatus: "reused-unchanged",
      };
      repositoryDiagnostics.push({
        repository,
        status: "reused-unchanged",
        branch: defaultBranch,
        pushedAt,
        cachedSkillsFound: reusableSnapshot.items.length,
      });
      summary.repositoriesReusedUnchanged += 1;
      continue;
    }

    const treePayload = await fetchRepositoryTree(repository, defaultBranch);
    const tree = Array.isArray(treePayload?.tree) ? treePayload.tree : [];
    const skillPaths = tree
      .filter((node) => node?.type === "blob" && typeof node.path === "string")
      .map((node) => node.path)
      .filter(isEligibleSkillPath)
      .sort((a, b) => a.localeCompare(b));

    const items = skillPaths
      .map((skillPath) =>
        buildSkillEntry({
          repository,
          branch: defaultBranch,
          skillPath,
        }),
      )
      .filter(Boolean);

    repositorySnapshots[repository] = {
      repository,
      branch: defaultBranch,
      defaultBranch,
      pushedAt,
      scannedAt: new Date().toISOString(),
      treeSha:
        typeof treePayload?.sha === "string" && treePayload.sha ? treePayload.sha : treeSha,
      items,
      itemCount: items.length,
      lastStatus: "scanned",
    };
    repositoryDiagnostics.push({
      repository,
      status: "scanned",
      branch: defaultBranch,
      pushedAt,
      skillsFound: items.length,
    });
    summary.repositoriesScannedFresh += 1;
  } catch (error) {
    const canTryGitFallback =
      !fallbackSnapshot &&
      highStarRepositorySet.has(repository) &&
      error instanceof Error &&
      (error.name === "GitHubRateLimitError" || error.name === "GitHubApiError");

    if (canTryGitFallback) {
      try {
        const snapshot = buildRepositorySnapshotFromGitFallback(repository);
        repositorySnapshots[repository] = snapshot;
        repositoryDiagnostics.push({
          repository,
          status: "scanned-via-git-fallback",
          branch: snapshot.branch,
          skillsFound: snapshot.items.length,
          reason: error.message,
        });
        summary.repositoriesScannedViaGitFallback += 1;
        continue;
      } catch (gitError) {
        try {
          const archiveTree = await fetchRepositoryTreeViaArchive(repository);
          const items = archiveTree.skillPaths
            .map((skillPath) =>
              buildSkillEntry({
                repository,
                branch: archiveTree.defaultBranch,
                skillPath,
              }),
            )
            .filter(Boolean);

          repositorySnapshots[repository] = {
            repository,
            branch: archiveTree.defaultBranch,
            defaultBranch: archiveTree.defaultBranch,
            pushedAt: archiveTree.pushedAt,
            scannedAt: new Date().toISOString(),
            treeSha: archiveTree.treeSha,
            items,
            itemCount: items.length,
            lastStatus: "scanned-via-archive-fallback",
          };
          repositoryDiagnostics.push({
            repository,
            status: "scanned-via-archive-fallback",
            branch: archiveTree.defaultBranch,
            skillsFound: items.length,
            reason: gitError instanceof Error ? gitError.message : "git-fallback-failed",
          });
          summary.repositoriesScannedViaGitFallback += 1;
          continue;
        } catch (archiveError) {
          error = archiveError;
        }
      }
    }

    const snapshot = fallbackSnapshot ?? {
      repository,
      defaultBranch: null,
      branch: null,
      pushedAt: null,
      scannedAt: null,
      treeSha: null,
      items: [],
      itemCount: 0,
      lastStatus: "failed",
    };

    if (error instanceof Error && error.name === "GitHubRateLimitError") {
      scanInterruptedByRateLimit = true;
      summary.repositoriesRateLimited += 1;
    }

    repositorySnapshots[repository] = snapshot;
    repositoryDiagnostics.push({
      repository,
      status: snapshot.items.length > 0 ? "preserved-cache" : "failed",
      reason: error instanceof Error ? error.message : "unknown-error",
      cachedSkillsFound: snapshot.items.length,
      previousStatus: snapshot.lastStatus ?? null,
    });
    if (snapshot.items.length > 0) {
      summary.repositoriesRecoveredFromCache += 1;
    } else {
      summary.repositoriesMissingCache += 1;
    }
  }
}

const deduped = new Map();
for (const repository of repositoriesToScan) {
  const snapshot = repositorySnapshots[repository];
  for (const item of snapshot?.items ?? []) {
    if (!deduped.has(item.slug)) {
      deduped.set(item.slug, item);
    }
  }
}

mkdirSync(outputDir, { recursive: true });
mkdirSync(repoCacheDir, { recursive: true });
for (const repository of repositoriesToScan) {
  const snapshot = repositorySnapshots[repository];
  if (snapshot) {
    persistRepositorySnapshot(snapshot);
  }
}
writeFileSync(
  outputPath,
  `${JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      totalItems: deduped.size,
      repositoriesScanned: repositoriesToScan,
      highStarRepositoriesSeeded: highStarRepositories,
      githubTokenConfigured: Boolean(githubToken),
      fallbackCacheGeneratedAt: fallbackCache.generatedAt,
      scanInterruptedByRateLimit,
      summary,
      metadataCacheTtlHours: metadataCacheTtlMs / (60 * 60 * 1000),
      repositoryDiagnostics,
      repositories: repositorySnapshots,
      items: [...deduped.values()],
    },
    null,
    2,
  )}\n`,
);

console.log(
  `Cached ${deduped.size} GitHub repo expansion items at ${path.relative(projectRoot, outputPath)} ` +
    `(fresh=${summary.repositoriesScannedFresh}, freshCache=${summary.repositoriesSkippedByFreshCache}, gitFallback=${summary.repositoriesScannedViaGitFallback}, reused=${summary.repositoriesReusedUnchanged}, recovered=${summary.repositoriesRecoveredFromCache}, missingCache=${summary.repositoriesMissingCache}, rateLimited=${summary.repositoriesRateLimited})`,
);
