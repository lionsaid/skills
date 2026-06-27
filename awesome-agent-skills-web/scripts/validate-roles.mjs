import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, "..");

const roleDefinitionsPath = path.join(projectRoot, "config", "role-definitions.json");
const skillsDataPath = path.join(projectRoot, "src", "data", "skills.generated.json");

const MIN_STARTER_SKILLS = 3;
const MIN_MATCHED_SKILLS = 3;
const MIN_STARTER_PUBLISHERS = 2;
const MIN_FIRST_FIVE_PUBLISHERS = 2;

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, "utf8"));
}

function fail(message) {
  throw new Error(message);
}

function validateRoleShape(role, index) {
  const label = `role #${index + 1}`;

  for (const key of ["slug", "label", "summary", "hero"]) {
    if (typeof role[key] !== "string" || !role[key].trim()) {
      fail(`${label} must include a non-empty ${key}.`);
    }
  }

  for (const key of ["starterSkillSlugs", "jobs", "featuredQueries"]) {
    if (!Array.isArray(role[key]) || role[key].some((value) => typeof value !== "string" || !value.trim())) {
      fail(`${label} must include a ${key} array of non-empty strings.`);
    }
  }
}

function countDistinct(values) {
  return new Set(values.filter(Boolean)).size;
}

function main() {
  const roles = readJson(roleDefinitionsPath);
  const payload = readJson(skillsDataPath);
  const skills = payload.skills ?? [];

  if (!Array.isArray(roles) || roles.length === 0) {
    fail("Role definitions config must be a non-empty array.");
  }

  if (!Array.isArray(skills) || skills.length === 0) {
    fail("Generated skills data must include a non-empty skills array.");
  }

  const roleSlugSet = new Set();
  const skillSlugSet = new Set(skills.map((skill) => skill.slug));
  const failures = [];

  for (const [index, role] of roles.entries()) {
    try {
      validateRoleShape(role, index);
    } catch (error) {
      failures.push(error.message);
      continue;
    }

    if (roleSlugSet.has(role.slug)) {
      failures.push(`Duplicate role slug: ${role.slug}`);
      continue;
    }
    roleSlugSet.add(role.slug);

    const missingStarterSlugs = role.starterSkillSlugs.filter((slug) => !skillSlugSet.has(slug));
    if (missingStarterSlugs.length > 0) {
      failures.push(
        `${role.slug} references missing starter skills: ${missingStarterSlugs.join(", ")}`,
      );
    }

    if (role.starterSkillSlugs.length < MIN_STARTER_SKILLS) {
      failures.push(
        `${role.slug} must declare at least ${MIN_STARTER_SKILLS} starter skills.`,
      );
    }

    const starterPublishers = role.starterSkillSlugs
      .map((slug) => skills.find((skill) => skill.slug === slug)?.publisherSlug)
      .filter(Boolean);
    const firstFivePublishers = starterPublishers.slice(0, 5);

    if (countDistinct(starterPublishers) < MIN_STARTER_PUBLISHERS) {
      failures.push(
        `${role.slug} starter pack must span at least ${MIN_STARTER_PUBLISHERS} publishers.`,
      );
    }

    if (countDistinct(firstFivePublishers) < MIN_FIRST_FIVE_PUBLISHERS) {
      failures.push(
        `${role.slug} first five starter skills must span at least ${MIN_FIRST_FIVE_PUBLISHERS} publishers.`,
      );
    }

    const matchedSkills = skills.filter((skill) => {
      if ((skill.personas ?? []).includes(role.slug)) {
        return true;
      }

      if (role.starterSkillSlugs.includes(skill.slug)) {
        return true;
      }

      return role.jobs.some((job) => (skill.jobs ?? []).includes(job));
    });

    if (matchedSkills.length < MIN_MATCHED_SKILLS) {
      failures.push(
        `${role.slug} only matches ${matchedSkills.length} skills; expected at least ${MIN_MATCHED_SKILLS}.`,
      );
    }

    for (const job of role.jobs) {
      const count = matchedSkills.filter((skill) => (skill.jobs ?? []).includes(job)).length;
      if (count === 0) {
        failures.push(`${role.slug} has no skills for job "${job}".`);
      }
    }
  }

  if (failures.length > 0) {
    console.error("Role validation failed:\n");
    for (const failure of failures) {
      console.error(`- ${failure}`);
    }
    process.exitCode = 1;
    return;
  }

  console.log(
    `Role validation passed for ${roles.length} roles against ${skills.length} skills.`,
  );
}

main();
