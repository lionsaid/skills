import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, "..");
const expansionPath = path.join(projectRoot, "src", "data", "github-repo-expansion.generated.json");
const repoCacheDir = path.join(projectRoot, "src", "data", "github-repo-expansion-cache");
const githubToken = process.env.GITHUB_TOKEN?.trim() || null;
const timeoutMs = 10_000;
const concurrency = Number(process.env.GITHUB_SKILL_SUMMARY_CONCURRENCY ?? 8);
const onlyRepository = process.env.GITHUB_SKILL_SUMMARY_REPOSITORY?.trim() || null;
const maxItems = Number(process.env.GITHUB_SKILL_SUMMARY_MAX_ITEMS ?? 0);
const fallbackPrefix = "Discovered from a public GitHub repository:";

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, "utf8"));
}

function getRepositoryCacheFilePath(repository) {
  const [owner, repo] = repository.split("/");
  return path.join(repoCacheDir, owner ?? "_unknown", `${repo ?? "repo"}.json`);
}

function readOptionalJson(filePath) {
  if (!existsSync(filePath)) {
    return null;
  }

  return readJson(filePath);
}

function isEligibleSkillPath(skillPath) {
  return typeof skillPath === "string" && (/^SKILL\.md$/i.test(skillPath) || /^skills\/[^/]+\/SKILL\.md$/i.test(skillPath));
}

function getRawGithubUrl(repository, branch, skillPath) {
  return `https://raw.githubusercontent.com/${repository}/${branch}/${skillPath}`;
}

function githubHeaders() {
  return {
    Accept: "application/vnd.github+json",
    "User-Agent": "lionsaid-skills-web",
    ...(githubToken ? { Authorization: `Bearer ${githubToken}` } : {}),
  };
}

function stripMarkdown(value) {
  return value
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[[^\]]*]\([^)]+\)/g, " ")
    .replace(/\[([^\]]+)]\([^)]+\)/g, "$1")
    .replace(/[#>*_~|]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseFrontmatterDescription(content) {
  const match = content.match(/^---\s*\n([\s\S]*?)\n---\s*(?:\n|$)/);
  if (!match) {
    return null;
  }

  const descriptionMatch = match[1].match(/^description:\s*(.+)$/im);
  return descriptionMatch?.[1]?.trim().replace(/^['"]|['"]$/g, "") || null;
}

function extractSkillSummary(content) {
  const frontmatterDescription = parseFrontmatterDescription(content);
  if (frontmatterDescription) {
    return frontmatterDescription;
  }

  const withoutFrontmatter = content.replace(/^---\s*\n[\s\S]*?\n---\s*/, "");
  return (
    withoutFrontmatter
      .split(/\n{2,}/)
      .map((block) => stripMarkdown(block))
      .find((block) => block && !/^[-=]+$/.test(block)) ?? null
  );
}

async function fetchSummary(item) {
  const branch = item.branch || "main";
  const apiUrl = `https://api.github.com/repos/${item.repository}/contents/${encodeURIComponent(item.path).replaceAll("%2F", "/")}?ref=${encodeURIComponent(branch)}`;

  try {
    const response = await fetch(apiUrl, {
      headers: githubHeaders(),
      signal: AbortSignal.timeout(timeoutMs),
    });

    if (response.ok) {
      const payload = await response.json();
      if (typeof payload?.content === "string") {
        const content = Buffer.from(payload.content, "base64").toString("utf8");
        const summary = extractSkillSummary(content);
        return summary ? summary.slice(0, 900) : null;
      }
    }
  } catch {
    // Fall back to raw.githubusercontent below.
  }

  const response = await fetch(getRawGithubUrl(item.repository, branch, item.path), {
    headers: {
      Accept: "text/plain, text/markdown;q=0.9, */*;q=0.1",
      "User-Agent": "lionsaid-skills-web",
    },
    signal: AbortSignal.timeout(timeoutMs),
  });

  if (!response.ok) {
    return null;
  }

  const summary = extractSkillSummary(await response.text());
  return summary ? summary.slice(0, 900) : null;
}

async function mapWithConcurrency(items, mapper) {
  const results = [];
  let cursor = 0;

  async function worker() {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await mapper(items[index], index);
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, () => worker()));
  return results;
}

const payload = readJson(expansionPath);
const items = Array.isArray(payload.items) ? payload.items : [];
function hasFallbackDescription(item) {
  return typeof item.description !== "string" || item.description.startsWith(fallbackPrefix);
}

function getRepoCacheItem(item) {
  const snapshot = readOptionalJson(getRepositoryCacheFilePath(item.repository));
  return Array.isArray(snapshot?.items)
    ? snapshot.items.find((candidate) => candidate.slug === item.slug || (!candidate.isCollection && candidate.path === item.path))
    : null;
}

const candidates = items
  .filter((item) => !item?.isCollection)
  .filter((item) => isEligibleSkillPath(item?.path))
  .filter((item) => !onlyRepository || item.repository?.toLowerCase() === onlyRepository.toLowerCase())
  .filter((item) => hasFallbackDescription(item) || hasFallbackDescription(getRepoCacheItem(item)));
const selected = maxItems > 0 ? candidates.slice(0, maxItems) : candidates;
let updated = 0;
let failed = 0;

await mapWithConcurrency(selected, async (item) => {
  let summary = null;
  try {
    summary = await fetchSummary(item);
  } catch {
    summary = null;
  }

  if (!summary) {
    failed += 1;
    return;
  }

  item.description = summary;
  updated += 1;

  const snapshot = payload.repositories?.[item.repository];
  if (snapshot && Array.isArray(snapshot.items)) {
    for (const snapshotItem of snapshot.items) {
      if (snapshotItem.slug === item.slug || (!snapshotItem.isCollection && snapshotItem.path === item.path)) {
        snapshotItem.description = summary;
      }
    }
  }
});

payload.summary = {
  ...(payload.summary ?? {}),
  skillSummariesUpdated: updated,
  skillSummariesFailed: failed,
};

const changedRepositories = new Set(selected.map((item) => item.repository).filter(Boolean));
for (const repository of changedRepositories) {
  const snapshot = payload.repositories?.[repository];
  if (!snapshot) {
    continue;
  }

  const filePath = getRepositoryCacheFilePath(repository);
  const existingSnapshot = readOptionalJson(filePath) ?? snapshot;
  const descriptionsByKey = new Map(
    (snapshot.items ?? [])
      .filter((item) => typeof item?.description === "string")
      .map((item) => [`${item.slug || ""}\u0000${item.path || ""}`, item.description]),
  );

  if (Array.isArray(existingSnapshot.items)) {
    for (const item of existingSnapshot.items) {
      const description = descriptionsByKey.get(`${item.slug || ""}\u0000${item.path || ""}`);
      if (description) {
        item.description = description;
      }
    }
  }

  mkdirSync(path.dirname(filePath), { recursive: true });
  writeFileSync(filePath, `${JSON.stringify(existingSnapshot, null, 2)}\n`);
}

writeFileSync(expansionPath, `${JSON.stringify(payload, null, 2)}\n`);

console.log(
  `Enriched ${updated} GitHub skill summaries at ${path.relative(projectRoot, expansionPath)} (${failed} failed, ${candidates.length} candidates).`,
);
