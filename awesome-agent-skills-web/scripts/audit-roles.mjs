import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, "..");
const outputDir = path.join(projectRoot, "src", "data");
const roleDefinitionsPath = path.join(projectRoot, "config", "role-definitions.json");
const skillsDataPath = path.join(outputDir, "skills.generated.json");
const auditOutputPath = path.join(outputDir, "role-audit.generated.json");

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, "utf8"));
}

function scoreRoleSkill(role, skill) {
  let score = 0;
  const isStarter = role.starterSkillSlugs.includes(skill.slug);
  const personaCount = skill.personas.length;
  const jobCount = skill.jobs.length;
  const jobMatches = skill.jobs.filter((job) => role.jobs.includes(job)).length;
  const hasPersonaMatch = skill.personas.includes(role.slug);
  const queryMatches = role.featuredQueries.filter((query) => {
    const normalized = query.toLowerCase();
    return (
      skill.name.toLowerCase().includes(normalized) ||
      skill.description.toLowerCase().includes(normalized) ||
      skill.tags.some((tag) => tag.toLowerCase().includes(normalized))
    );
  }).length;

  if (isStarter) score += 1000;
  if (hasPersonaMatch) score += 320;
  score += jobMatches * 40;
  if (jobMatches >= 2) score += 30;
  if (hasPersonaMatch && jobMatches > 0) score += 60;
  score += queryMatches * 30;

  if (role.slug === "founder") {
    if (queryMatches >= 1) score += 80;
    if (
      skill.slug.includes("strategy") ||
      skill.slug.includes("launch") ||
      skill.slug.includes("pricing") ||
      skill.slug.includes("market-research") ||
      skill.slug.includes("gtm")
    ) {
      score += 120;
    }
  }

  if (role.slug === "sales") {
    if (queryMatches >= 1) score += 70;
    if (
      skill.slug.includes("battlecard") ||
      skill.slug.includes("value-prop") ||
      skill.slug.includes("sales-enablement") ||
      skill.slug.includes("email-sequence") ||
      skill.slug.includes("cold-email")
    ) {
      score += 120;
    }
  }

  if (role.slug === "support") {
    if (queryMatches >= 1) score += 60;
    if (
      skill.slug.includes("gmail") ||
      skill.slug.includes("outlook") ||
      skill.slug.includes("contact-discovery") ||
      skill.slug.includes("maintainer-triage") ||
      skill.slug.includes("guardian")
    ) {
      score += 100;
    }
  }

  if (role.slug === "designer") {
    if (
      skill.slug.includes("figma") ||
      skill.slug.includes("ui") ||
      skill.slug.includes("storyboard")
    ) {
      score += 90;
    }
  }

  if (role.slug === "pm") {
    if (
      skill.slug.includes("prd") ||
      skill.slug.includes("roadmap") ||
      skill.slug.includes("opportunity-solution-tree") ||
      skill.slug.includes("product-strategy")
    ) {
      score += 90;
    }
  }

  if (!isStarter) {
    score -= Math.max(0, personaCount - 2) * 45;
    score -= Math.max(0, jobCount - 3) * 12;
  }

  return { score, isStarter, hasPersonaMatch, jobMatches, queryMatches };
}

function isRolePriorityCandidate(role, skill) {
  const haystack = [skill.slug, skill.name, skill.description, skill.publisher, ...skill.tags]
    .join(" ")
    .toLowerCase();

  if (role.slug === "founder") {
    const blocked = [
      "tensorrt","kubernetes","slurm","megatron","deepstream","cuda","gpu","model support",
      "vision model","trading","stock","crypto","investment","optimizer","evaluation","perf-host",
    ];
    const allowed = [
      "launch","strategy","pricing","pitch","landing","research","planning","roadmap","market",
      "slides","proposal","email","gtm","market research",
    ];
    if (blocked.some((token) => haystack.includes(token)) && !skill.personas.includes("founder")) return false;
    if (!skill.personas.includes("founder") && !allowed.some((token) => haystack.includes(token))) return false;
    if (
      !skill.personas.includes("founder") &&
      !skill.slug.includes("launch") &&
      !skill.slug.includes("strategy") &&
      !skill.slug.includes("pricing") &&
      !skill.slug.includes("market-research") &&
      !skill.slug.includes("gtm") &&
      !skill.slug.includes("docs") &&
      !skill.slug.includes("build")
    ) return false;
  }

  if (role.slug === "support") {
    const blocked = [
      "docker","terraform","wrangler","workers","tensorrt","kubernetes","sdk","slurm","megatron",
      "deepstream","vision model","gpu","cuda","model support","stock","trading","crypto","finance","investment",
    ];
    const allowed = [
      "support","response","help","ticket","docs","docx","pdf","gmail","drive","extract","interact",
      "knowledge","outlook","email","contact","triage",
    ];
    if (blocked.some((token) => haystack.includes(token))) return false;
    if (!skill.personas.includes("support") && !allowed.some((token) => haystack.includes(token))) return false;
    if (
      !skill.personas.includes("support") &&
      !skill.slug.includes("gmail") &&
      !skill.slug.includes("drive") &&
      !skill.slug.includes("outlook") &&
      !skill.slug.includes("contact-discovery") &&
      !skill.slug.includes("interact") &&
      !skill.slug.includes("pdf") &&
      !skill.slug.includes("docx")
    ) return false;
  }

  return true;
}

function getRolePrioritySkills(role, allSkills, limit = 10) {
  const ranked = allSkills
    .map((skill) => ({ skill, ...scoreRoleSkill(role, skill) }))
    .filter(({ score, isStarter, hasPersonaMatch, jobMatches, queryMatches }) => {
      if (score <= 0) return false;
      if (isStarter) return true;
      if (hasPersonaMatch) return true;
      if (jobMatches >= 2) return true;
      return jobMatches >= 1 && queryMatches >= 1;
    })
    .filter(({ skill }) => isRolePriorityCandidate(role, skill))
    .sort((a, b) => b.score - a.score || a.skill.name.localeCompare(b.skill.name));

  const selected = [];
  const publisherCounts = new Map();

  for (const item of ranked) {
    if (selected.length >= limit) break;
    const publisherCount = publisherCounts.get(item.skill.publisherSlug) ?? 0;
    if (!item.isStarter && publisherCount >= 3 && !item.hasPersonaMatch && item.jobMatches < 2) continue;
    if ((role.slug === "founder" || role.slug === "support") && !item.isStarter && item.hasPersonaMatch && item.skill.publisherSlug === "nvidia") continue;
    selected.push(item.skill);
    publisherCounts.set(item.skill.publisherSlug, publisherCount + 1);
  }

  return selected;
}

function main() {
  const roles = readJson(roleDefinitionsPath);
  const allSkills = readJson(skillsDataPath).skills ?? [];

  const result = {
    generatedAt: new Date().toISOString(),
    roles: roles.map((role) => ({
      role: role.slug,
      label: role.label,
      topSkills: getRolePrioritySkills(role, allSkills, 10).map((skill) => ({
        slug: skill.slug,
        name: skill.name,
        publisher: skill.publisher,
        publisherSlug: skill.publisherSlug,
        sourceType: skill.sourceType,
        trustLevel: skill.trustLevel,
        jobs: skill.jobs,
        personas: skill.personas,
      })),
    })),
  };

  mkdirSync(outputDir, { recursive: true });
  writeFileSync(auditOutputPath, `${JSON.stringify(result, null, 2)}\n`);
  console.log(`Wrote role audit to ${path.relative(projectRoot, auditOutputPath)}`);
}

main();
