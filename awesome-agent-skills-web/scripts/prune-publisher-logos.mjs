import { readdirSync, readFileSync, rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, "..");
const logoDir = path.join(projectRoot, "public", "publisher-logos");
const publishersPath = path.join(logoDir, "publishers.json");
const apply = process.argv.includes("--apply");

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, "utf8"));
}

const publishers = readJson(publishersPath);
const keep = new Set(
  publishers
    .map((publisher) => publisher.slug)
    .filter((slug) => typeof slug === "string" && slug.trim())
    .map((slug) => `${slug}.png`),
);

const files = readdirSync(logoDir).filter((file) => file.endsWith(".png"));
const stale = files.filter((file) => !keep.has(file)).sort();

if (!apply) {
  console.log(`Dry run: ${stale.length} stale logo files would be removed.`);
  for (const file of stale.slice(0, 200)) {
    console.log(`- ${file}`);
  }

  if (stale.length > 200) {
    console.log(`...and ${stale.length - 200} more`);
  }

  console.log("Run with --apply to delete them.");
  process.exit(0);
}

for (const file of stale) {
  rmSync(path.join(logoDir, file), { force: true });
}

console.log(`Removed ${stale.length} stale logo files.`);
