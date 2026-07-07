import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, "..");
const dataDir = path.join(projectRoot, "src", "data");
const expansionPath = path.join(dataDir, "github-repo-expansion.generated.json");
const highStarPath = path.join(dataDir, "github-high-star-repos.generated.json");
const repoCacheDir = path.join(dataDir, "github-repo-expansion-cache");
const fallbackPrefix = "Discovered from a public GitHub repository:";

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, "utf8"));
}

function getRepositoryCacheFilePath(repository) {
  const [owner, repo] = repository.split("/");
  return path.join(repoCacheDir, owner ?? "_unknown", `${repo ?? "repo"}.json`);
}

function readOptionalJson(filePath) {
  return existsSync(filePath) ? readJson(filePath) : null;
}

const expansion = readJson(expansionPath);
const highStar = readJson(highStarPath);
const descriptionsByRepository = new Map(
  (Array.isArray(highStar.repositories) ? highStar.repositories : [])
    .filter((repo) => typeof repo?.repository === "string" && typeof repo?.description === "string" && repo.description.trim())
    .map((repo) => [repo.repository.toLowerCase(), repo.description.trim()]),
);
let updated = 0;
const changedRepositories = new Set();

for (const item of expansion.items ?? []) {
  if (!item?.isCollection || typeof item.repository !== "string") {
    continue;
  }

  if (typeof item.description === "string" && !item.description.startsWith(fallbackPrefix)) {
    continue;
  }

  const description = descriptionsByRepository.get(item.repository.toLowerCase());
  if (!description) {
    continue;
  }

  item.description = description;
  updated += 1;
  changedRepositories.add(item.repository);

  const snapshot = expansion.repositories?.[item.repository];
  if (snapshot && Array.isArray(snapshot.items)) {
    for (const snapshotItem of snapshot.items) {
      if (snapshotItem.slug === item.slug) {
        snapshotItem.description = description;
      }
    }
  }
}

for (const repository of changedRepositories) {
  const snapshot = expansion.repositories?.[repository];
  if (!snapshot) {
    continue;
  }

  const filePath = getRepositoryCacheFilePath(repository);
  const cacheSnapshot = readOptionalJson(filePath) ?? snapshot;
  const descriptionsBySlug = new Map(
    (snapshot.items ?? [])
      .filter((item) => item?.isCollection && typeof item?.description === "string")
      .map((item) => [item.slug, item.description]),
  );

  if (Array.isArray(cacheSnapshot.items)) {
    for (const item of cacheSnapshot.items) {
      const description = descriptionsBySlug.get(item.slug);
      if (description) {
        item.description = description;
      }
    }
  }

  mkdirSync(path.dirname(filePath), { recursive: true });
  writeFileSync(filePath, `${JSON.stringify(cacheSnapshot, null, 2)}\n`);
}

writeFileSync(expansionPath, `${JSON.stringify(expansion, null, 2)}\n`);
console.log(`Filled ${updated} GitHub collection descriptions from high-star repository metadata.`);
