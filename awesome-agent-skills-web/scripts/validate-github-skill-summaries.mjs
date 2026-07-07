import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, "..");
const skillsPath = path.join(projectRoot, "src", "data", "skills.generated.json");
const fallbackPrefix = "Discovered from a public GitHub repository:";
const maxSkillFallbacks = Number(process.env.GITHUB_SKILL_SUMMARY_MAX_FALLBACKS ?? 100);

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, "utf8"));
}

const payload = readJson(skillsPath);
const skills = Array.isArray(payload.skills) ? payload.skills : [];
const githubDiscovery = skills.filter((skill) => skill.sourceType === "github-discovery");
const fallback = githubDiscovery.filter((skill) => skill.description?.startsWith(fallbackPrefix));
const skillFallback = fallback.filter((skill) => skill.discoveryPath !== "README.md");
const collectionFallback = fallback.filter((skill) => skill.discoveryPath === "README.md");

if (skillFallback.length > maxSkillFallbacks) {
  console.error(
    `GitHub skill summary validation failed: ${skillFallback.length} public SKILL.md entries still use fallback descriptions. Limit is ${maxSkillFallbacks}.`,
  );
  for (const skill of skillFallback.slice(0, 40)) {
    console.error(`- ${skill.slug} (${skill.repository ?? "unknown"} ${skill.discoveryPath ?? ""})`);
  }
  process.exitCode = 1;
} else {
  console.log(
    `GitHub skill summary validation passed: ${skillFallback.length} public SKILL.md fallback descriptions, ${collectionFallback.length} collection fallback descriptions, ${githubDiscovery.length} GitHub discovery entries.`,
  );
}
