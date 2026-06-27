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

  for (const skill of skills) {
    if (typeof skill?.repository !== "string" || typeof skill?.discoveryPath !== "string") {
      continue;
    }

    const key = skill.repository;
    const existing = finalSkillsByRepository.get(key) ?? new Set();
    existing.add(normalizePath(skill.discoveryPath));
    finalSkillsByRepository.set(key, existing);
  }

  const highStarRepositories = new Set(
    repositories.map((repo) => repo?.repository).filter(Boolean),
  );
  const expectedGithubSkills = githubExpansionItems.filter((item) =>
    highStarRepositories.has(item?.repository),
  );
  const expectedPathsByRepository = new Map();

  for (const item of expectedGithubSkills) {
    if (typeof item?.repository !== "string" || typeof item?.path !== "string") {
      continue;
    }

    const existing = expectedPathsByRepository.get(item.repository) ?? new Set();
    existing.add(normalizePath(item.path));
    expectedPathsByRepository.set(item.repository, existing);
  }

  const failures = [];

  if (repositories.length > 0 && expectedGithubSkills.length === 0) {
    failures.push(
      "GitHub repo expansion produced 0 SKILL.md files for 100+ star repositories. Refresh the expansion cache before validating.",
    );
  }

  for (const repository of highStarRepositories) {
    const snapshot = githubExpansionRepositories[repository];
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
      ].includes(snapshot.lastStatus)
    ) {
      failures.push(
        `${repository} is a 100+ star repository but repository snapshot status is ${snapshot.lastStatus}.`,
      );
      continue;
    }

    if (expectedPaths.size === 0) {
      continue;
    }

    const finalPaths = finalSkillsByRepository.get(repository) ?? new Set();
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

    const finalPaths = finalSkillsByRepository.get(item.repository) ?? new Set();
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
    `High-star skill validation passed for ${expectedGithubSkills.length} SKILL.md files across ${repositories.length} repositories against ${skills.length} skills.`,
  );
}

main();
