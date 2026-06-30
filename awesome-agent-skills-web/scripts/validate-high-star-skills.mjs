import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, "..");
const highStarPath = path.join(projectRoot, "src", "data", "github-high-star-repos.generated.json");
const githubExpansionPath = path.join(projectRoot, "src", "data", "github-repo-expansion.generated.json");
const skillsPath = path.join(projectRoot, "src", "data", "skills.generated.json");

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, "utf8"));
}

function normalizePath(filePath) {
  return typeof filePath === "string" ? filePath.replace(/\\/g, "/") : null;
}

function normalizeRepository(repository) {
  return typeof repository === "string" ? repository.toLowerCase() : null;
}

function isEligibleSkillPath(skillPath) {
  if (typeof skillPath !== "string" || !/(^|\/)SKILL\.md$/i.test(skillPath)) {
    return false;
  }

  const segments = skillPath.split("/").filter(Boolean);
  const directorySegments = segments.slice(0, -1);

  if (directorySegments.some((segment) => segment.startsWith("."))) {
    return false;
  }

  if (directorySegments.some((segment) => /^(docs?|examples?|tests?|fixtures?|external_plugins?)$/i.test(segment))) {
    return false;
  }

  return /^SKILL\.md$/i.test(skillPath) || /^skills\/[^/]+\/SKILL\.md$/i.test(skillPath);
}

function getNormalizedSkillName(repository, skillPath) {
  if (/^SKILL\.md$/i.test(skillPath)) {
    return repository.split("/")[1] ?? repository;
  }

  const match = skillPath.match(/^skills\/([^/]+)\/SKILL\.md$/i);
  return match?.[1] ?? null;
}

function shouldIncludeRepositoryCollection(repository, paths) {
  const publicPaths = [...paths].filter(isEligibleSkillPath);
  if (publicPaths.length !== 1) {
    return true;
  }

  const repoName = repository.split("/")[1] ?? repository;
  return getNormalizedSkillName(repository, publicPaths[0]) !== repoName;
}

function main() {
  const highStarPayload = readJson(highStarPath);
  const githubExpansionPayload = readJson(githubExpansionPath);
  const skillsPayload = readJson(skillsPath);
  const repositories = Array.isArray(highStarPayload.repositories)
    ? highStarPayload.repositories
    : [];
  const githubExpansionItems = Array.isArray(githubExpansionPayload.items)
    ? githubExpansionPayload.items
    : [];
  const githubExpansionRepositories =
    githubExpansionPayload && typeof githubExpansionPayload.repositories === "object" && !Array.isArray(githubExpansionPayload.repositories)
      ? githubExpansionPayload.repositories
      : {};
  const skills = Array.isArray(skillsPayload.skills) ? skillsPayload.skills : [];
  const finalSkillsByRepository = new Map();
  const finalCollectionRepositories = new Set();

  for (const skill of skills) {
    if (typeof skill?.repository !== "string" || typeof skill?.discoveryPath !== "string") {
      continue;
    }

    const key = normalizeRepository(skill.repository);
    if (!key) {
      continue;
    }

    if (skill.discoveryPath === "README.md") {
      finalCollectionRepositories.add(key);
    }

    const existing = finalSkillsByRepository.get(key) ?? new Set();
    existing.add(normalizePath(skill.discoveryPath));
    finalSkillsByRepository.set(key, existing);
  }

  const highStarRepositories = new Set(
    repositories.map((repo) => normalizeRepository(repo?.repository)).filter(Boolean),
  );
  const expectedGithubItems = githubExpansionItems.filter((item) =>
    highStarRepositories.has(normalizeRepository(item?.repository)),
  );
  const expectedGithubSkills = expectedGithubItems.filter((item) =>
    isEligibleSkillPath(item?.path),
  );
  const expectedPathsByRepository = new Map();

  for (const item of expectedGithubSkills) {
    const repositoryKey = normalizeRepository(item?.repository);
    if (!repositoryKey || typeof item?.path !== "string") {
      continue;
    }

    const existing = expectedPathsByRepository.get(repositoryKey) ?? new Set();
    existing.add(normalizePath(item.path));
    expectedPathsByRepository.set(repositoryKey, existing);
  }

  const failures = [];

  if (repositories.length > 0 && expectedGithubItems.length === 0) {
    failures.push(
      "GitHub repo expansion produced 0 items for 100+ star repositories. Refresh the expansion cache before validating.",
    );
  }

  for (const repository of highStarRepositories) {
    const snapshot =
      githubExpansionRepositories[repository] ??
      Object.entries(githubExpansionRepositories).find(
        ([snapshotRepository]) => normalizeRepository(snapshotRepository) === repository,
      )?.[1];
    const expectedPaths = expectedPathsByRepository.get(repository) ?? new Set();

    if (!snapshot || !Array.isArray(snapshot.items)) {
      failures.push(
        `${repository} is a 100+ star repository but has no repository snapshot items in github-repo-expansion.generated.json.`,
      );
      continue;
    }

    if (
      snapshot.lastStatus &&
      ![
        "scanned",
        "cached",
        "reused",
        "reused-unchanged",
        "cache-fresh",
        "recovered",
        "fresh",
        "scanned-via-git-fallback",
        "scanned-via-archive-fallback",
      ].includes(snapshot.lastStatus)
    ) {
      failures.push(
        `${repository} is a 100+ star repository but repository snapshot status is ${snapshot.lastStatus}.`,
      );
      continue;
    }

    const requiresCollection = shouldIncludeRepositoryCollection(repository, expectedPaths);

    if (expectedPaths.size === 0) {
      if (!finalCollectionRepositories.has(repository)) {
        failures.push(
          `${repository} is missing its repository collection entry in final skills.generated.json.`,
        );
      }
      continue;
    }

    const finalPaths = finalSkillsByRepository.get(repository) ?? new Set();
    if (requiresCollection && !finalPaths.has("README.md")) {
      failures.push(
        `${repository} is missing its repository collection entry in final skills.generated.json.`,
      );
    }

    for (const expectedPath of expectedPaths) {
      if (!finalPaths.has(expectedPath)) {
        failures.push(
          `${repository} is missing ${expectedPath} in final skills.generated.json.`,
        );
      }
    }
  }

  for (const item of expectedGithubSkills) {
    if (!item?.repository || !item?.slug || !item?.path) {
      continue;
    }

    const finalPaths = finalSkillsByRepository.get(normalizeRepository(item.repository)) ?? new Set();
    if (!finalPaths.has(normalizePath(item.path))) {
      failures.push(
        `${item.repository} is missing skill ${item.slug} from ${item.path} in final skills data.`,
      );
    }
  }

  if (failures.length > 0) {
    console.error("High-star skill validation failed:\n");
    for (const failure of failures) {
      console.error(`- ${failure}`);
    }
    process.exitCode = 1;
    return;
  }

  console.log(
    `High-star skill validation passed for ${repositories.length} repositories and ${expectedGithubSkills.length} public SKILL.md files against ${skills.length} skills.`,
  );
}

main();
