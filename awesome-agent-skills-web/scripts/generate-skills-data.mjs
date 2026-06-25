import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, "..");
const readmePath = path.join(projectRoot, "..", "README.md");
const outputDir = path.join(projectRoot, "src", "data");
const outputPath = path.join(outputDir, "skills.generated.json");
const classificationRulesPath = path.join(projectRoot, "config", "classification-rules.json");

function readClassificationRules() {
  const rules = JSON.parse(readFileSync(classificationRulesPath, "utf8"));

  if (!Array.isArray(rules)) {
    throw new Error("Classification rules config must be an array.");
  }

  for (const [index, rule] of rules.entries()) {
    const label = `classification rule #${index + 1}`;

    if (typeof rule.tag !== "string" || !rule.tag) {
      throw new Error(`${label} must include a non-empty tag.`);
    }

    for (const key of ["sections", "publishers", "patterns"]) {
      if (
        !Array.isArray(rule[key]) ||
        rule[key].some((value) => typeof value !== "string")
      ) {
        throw new Error(`${label} must include a ${key} string array.`);
      }
    }
  }

  return rules;
}

const classificationRules = readClassificationRules();

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizePublisher(raw) {
  return raw
    .replace(/^official\s+/i, "")
    .replace(/^skills by\s+/i, "")
    .replace(/^marketing skills by\s+/i, "")
    .replace(/^advertising skills by\s+/i, "")
    .replace(/^security skills by\s+/i, "")
    .replace(/\s+team(?:\s+for.*)?$/i, "")
    .trim();
}

function extractHeading(line) {
  const markdownHeading = line.match(/^###\s+(.+)$/);
  if (markdownHeading) return markdownHeading[1].trim();

  const summaryHeading = line.match(/<summary><h3[^>]*>(.+?)<\/h3><\/summary>/i);
  if (summaryHeading) return summaryHeading[1].trim();

  return null;
}

function parseKind(sectionTitle) {
  return /community/i.test(sectionTitle) ? "community" : "official";
}

function inferTags({ name, description, publisher, publisherSlug, sectionTitle, sectionSlug }) {
  const haystack = `${name} ${description} ${publisher} ${sectionTitle}`.toLowerCase();
  const tags = new Set([publisherSlug, sectionSlug]);

  const normalizedSection = sectionTitle.toLowerCase();
  const normalizedPublisher = publisherSlug.toLowerCase();

  for (const rule of classificationRules) {
    const matchesSection = rule.sections.some(
      (section) => normalizedSection === section.toLowerCase(),
    );
    const matchesPublisher = rule.publishers.some(
      (publisherRule) => normalizedPublisher === publisherRule.toLowerCase(),
    );
    const matchesPattern = rule.patterns.some((pattern) =>
      haystack.includes(pattern.toLowerCase()),
    );

    if (
      (matchesSection && (matchesPublisher || matchesPattern)) ||
      (matchesPublisher && matchesPattern)
    ) {
      tags.add(rule.tag);
    }
  }

  if (name.includes("/")) {
    if (normalizedPublisher !== "community") {
      tags.add("publisher-namespaced");
    }
  }

  tags.add("namespaced");

  return [...tags].filter(Boolean).sort();
}

function parseSkills(content) {
  const lines = content.split(/\r?\n/);
  const skills = [];

  let currentSection = "";
  let currentPublisher = "";
  let currentKind = "official";

  for (const line of lines) {
    const heading = extractHeading(line);
    if (heading) {
      currentSection = heading;
      currentKind = parseKind(heading);
      currentPublisher = normalizePublisher(heading);
      continue;
    }

    const skillMatch = line.match(/^- \*\*\[(.+?)\]\((.+?)\)\*\* - (.+)$/);
    if (!skillMatch || !currentSection) continue;

    const [, name, url, description] = skillMatch;
    const publisher = name.includes("/") ? name.split("/")[0] : currentPublisher;
    const publisherSlug = slugify(publisher);
    const sectionSlug = slugify(currentSection);

    skills.push({
      slug: slugify(name),
      name,
      url,
      description: description.trim(),
      publisher,
      publisherSlug,
      sectionTitle: currentSection,
      sectionSlug,
      kind: currentKind,
      tags: inferTags({
        name,
        description,
        publisher,
        publisherSlug,
        sectionTitle: currentSection,
        sectionSlug,
      }),
    });
  }

  return skills;
}

const content = readFileSync(readmePath, "utf8");
const skills = parseSkills(content);

mkdirSync(outputDir, { recursive: true });
writeFileSync(
  outputPath,
  `${JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      totalSkills: skills.length,
      skills,
    },
    null,
    2,
  )}\n`,
);

console.log(`Generated ${skills.length} skills at ${path.relative(projectRoot, outputPath)}`);
