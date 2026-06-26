import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, "..");
const dataDir = path.join(projectRoot, "src", "data");
const skillsPath = path.join(dataDir, "skills.generated.json");
const logoDir = path.join(projectRoot, "public", "publisher-logos");
const publishersPath = path.join(logoDir, "publishers.json");

function getPublishers() {
  const payload = JSON.parse(readFileSync(skillsPath, "utf8"));
  const skills = Array.isArray(payload.skills) ? payload.skills : [];
  const publishers = new Map();

  for (const skill of skills) {
    if (!publishers.has(skill.publisherSlug)) {
      publishers.set(skill.publisherSlug, {
        slug: skill.publisherSlug,
        name: skill.publisher,
      });
    }
  }

  return [...publishers.values()].sort((a, b) => a.slug.localeCompare(b.slug));
}

function isLikelyGithubSlug(slug) {
  return /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?$/.test(slug);
}

async function downloadLogo(slug) {
  const response = await fetch(`https://github.com/${slug}.png?size=88`, {
    headers: {
      "User-Agent": "awesome-agent-skills-web",
      Accept: "image/png,image/*;q=0.8,*/*;q=0.5",
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length === 0) {
    throw new Error("Empty image response");
  }

  return bytes;
}

const publishers = getPublishers();
mkdirSync(logoDir, { recursive: true });
writeFileSync(publishersPath, `${JSON.stringify(publishers, null, 2)}\n`);

let downloaded = 0;
let skipped = 0;
const failed = [];

for (const publisher of publishers) {
  if (!isLikelyGithubSlug(publisher.slug)) {
    skipped += 1;
    continue;
  }

  try {
    const bytes = await downloadLogo(publisher.slug);
    writeFileSync(path.join(logoDir, `${publisher.slug}.png`), bytes);
    downloaded += 1;
  } catch (error) {
    failed.push({
      slug: publisher.slug,
      reason: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

console.log(
  `Refreshed publisher logos: ${downloaded} downloaded, ${skipped} skipped, ${failed.length} failed.`,
);

if (failed.length > 0) {
  console.log("Logo refresh failures:");
  for (const item of failed) {
    console.log(`- ${item.slug}: ${item.reason}`);
  }
}
