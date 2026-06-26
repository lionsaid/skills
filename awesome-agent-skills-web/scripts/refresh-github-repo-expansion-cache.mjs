import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, "..");
const sourcesPath = path.join(projectRoot, "config", "skill-sources.json");
const seedPath = path.join(projectRoot, "config", "github-skill-repos.json");
const outputDir = path.join(projectRoot, "src", "data");
const outputPath = path.join(outputDir, "github-repo-expansion.generated.json");

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

const sources = readJson(sourcesPath);
const source = sources.find((item) => item.id === "github-repo-expansion");

if (!source) {
  throw new Error("Missing github-repo-expansion source config.");
}

const repositories = readJson(seedPath).filter(
  (value) => typeof value === "string" && /^[^/]+\/[^/]+$/.test(value),
);

const items = [];

for (const repository of repositories.slice(0, source.maxRepositories)) {
  const repoUrl = `https://github.com/${repository}`;

  try {
    const response = await fetch(repoUrl, {
      headers: {
        Accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.1",
        "User-Agent": "awesome-agent-skills-web",
      },
    });

    if (!response.ok) {
      continue;
    }

    const html = await response.text();
    const matches = html.matchAll(
      /href="\/([^"/]+\/[^"/]+)\/blob\/[^"/]+\/skills\/([^"/]+)\/SKILL\.md"/gi,
    );

    for (const match of matches) {
      const [, repoFullName, skillName] = match;
      const repoOwner = repoFullName.split("/")[0];

      items.push({
        repository: repoFullName,
        skillName,
        path: `skills/${skillName}/SKILL.md`,
        url: `https://github.com/${repoFullName}/blob/main/skills/${skillName}/SKILL.md`,
        description: `${source.descriptionFallback}: ${repoFullName}`,
        slug: slugify(`${repoOwner}/${skillName}`),
      });
    }
  } catch {
    continue;
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
      repositoriesScanned: repositories.slice(0, source.maxRepositories),
      items: [...deduped.values()],
    },
    null,
    2,
  )}\n`,
);

console.log(`Cached ${deduped.size} GitHub repo expansion items at ${path.relative(projectRoot, outputPath)}`);
