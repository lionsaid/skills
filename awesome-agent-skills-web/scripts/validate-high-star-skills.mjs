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
  const skills = Array.isArray(skillsPayload.skills) ? skillsPayload.skills : [];
  const finalSkillSlugs = new Set(skills.map((skill) => skill.slug));
  const highStarRepositories = new Set(
    repositories.map((repo) => repo?.repository).filter(Boolean),
  );
  const expectedGithubSkills = githubExpansionItems.filter((item) =>
    highStarRepositories.has(item?.repository),
  );

  const failures = [];

  for (const item of expectedGithubSkills) {
    if (!item?.repository || !item?.slug) {
      continue;
    }

    if (!finalSkillSlugs.has(item.slug)) {
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
