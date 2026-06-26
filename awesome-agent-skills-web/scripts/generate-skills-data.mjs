import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, "..");
const outputDir = path.join(projectRoot, "src", "data");
const outputPath = path.join(outputDir, "skills.generated.json");
const classificationRulesPath = path.join(projectRoot, "config", "classification-rules.json");
const skillSourcesPath = path.join(projectRoot, "config", "skill-sources.json");
const githubSkillReposPath = path.join(projectRoot, "config", "github-skill-repos.json");
const githubSkillRepoCachePath = path.join(outputDir, "github-repo-expansion.generated.json");

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, "utf8"));
}

function readClassificationRules() {
  const rules = readJson(classificationRulesPath);

  if (!Array.isArray(rules)) {
    throw new Error("Classification rules config must be an array.");
  }

  for (const [index, rule] of rules.entries()) {
    const label = `classification rule #${index + 1}`;

    if (typeof rule.tag !== "string" || !rule.tag) {
      throw new Error(`${label} must include a non-empty tag.`);
    }

    for (const key of ["sections", "publishers", "patterns"]) {
      if (!Array.isArray(rule[key]) || rule[key].some((value) => typeof value !== "string")) {
        throw new Error(`${label} must include a ${key} string array.`);
      }
    }
  }

  return rules;
}

function readSkillSources() {
  const sources = readJson(skillSourcesPath);

  if (!Array.isArray(sources)) {
    throw new Error("Skill sources config must be an array.");
  }

  for (const [index, source] of sources.entries()) {
    const label = `skill source #${index + 1}`;

    for (const key of ["id", "label", "transport", "parser"]) {
      if (typeof source[key] !== "string" || !source[key]) {
        throw new Error(`${label} must include a non-empty ${key}.`);
      }
    }

    if (typeof source.enabled !== "boolean") {
      throw new Error(`${label} must include a boolean enabled flag.`);
    }

    if (source.transport === "local" && (typeof source.path !== "string" || !source.path)) {
      throw new Error(`${label} must include path for local transport.`);
    }

    if (source.transport === "remote" && (typeof source.url !== "string" || !source.url)) {
      throw new Error(`${label} must include url for remote transport.`);
    }

    for (const key of ["sourceType", "trustLevel", "riskFlags"]) {
      if (key === "riskFlags") {
        if (!Array.isArray(source[key]) || source[key].some((value) => typeof value !== "string")) {
          throw new Error(`${label} must include a ${key} string array.`);
        }
      } else if (typeof source[key] !== "string" || !source[key]) {
        throw new Error(`${label} must include a non-empty ${key}.`);
      }
    }

    if (source.parser === "remote-html") {
      for (const key of ["linkPattern", "sectionTitle", "kind", "descriptionFallback"]) {
        if (typeof source[key] !== "string" || !source[key]) {
          throw new Error(`${label} must include a non-empty ${key} for ${source.parser}.`);
        }
      }
    }

    if (source.parser === "marketplace-api") {
      for (const key of ["sectionTitle", "kind", "descriptionFallback"]) {
        if (typeof source[key] !== "string" || !source[key]) {
          throw new Error(`${label} must include a non-empty ${key} for marketplace-api.`);
        }
      }

      if (
        typeof source.maxPages !== "number" ||
        !Number.isInteger(source.maxPages) ||
        source.maxPages < 1
      ) {
        throw new Error(`${label} must include a positive integer maxPages.`);
      }

      if (
        typeof source.pageSize !== "number" ||
        !Number.isInteger(source.pageSize) ||
        source.pageSize < 1
      ) {
        throw new Error(`${label} must include a positive integer pageSize.`);
      }
    }

    if (source.parser === "github-repo-expansion") {
      for (const key of ["sectionTitle", "kind", "descriptionFallback"]) {
        if (typeof source[key] !== "string" || !source[key]) {
          throw new Error(`${label} must include a non-empty ${key} for github-repo-expansion.`);
        }
      }

      if (
        typeof source.maxRepositories !== "number" ||
        !Number.isInteger(source.maxRepositories) ||
        source.maxRepositories < 1
      ) {
        throw new Error(`${label} must include a positive integer maxRepositories.`);
      }
    }
  }

  return sources;
}

const classificationRules = readClassificationRules();
const skillSources = readSkillSources();
const githubSkillReposSeed = readJson(githubSkillReposPath);
const sourcePriority = new Map(
  skillSources.map((source, index) => [source.id, skillSources.length - index]),
);

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

function decodeHtmlEntities(value) {
  return value
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&#x27;/gi, "'");
}

function stripHtml(value) {
  return decodeHtmlEntities(value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
}

function decodeEscapedString(value) {
  return value
    .replace(/\\"/g, '"')
    .replace(/\\n/g, " ")
    .replace(/\\r/g, " ")
    .replace(/\\t/g, " ")
    .replace(/\\\\/g, "\\")
    .trim();
}

function normalizeUrl(rawUrl, baseUrl) {
  const url = new URL(rawUrl, baseUrl);
  url.hash = "";
  url.search = "";

  if (url.pathname !== "/" && url.pathname.endsWith("/")) {
    url.pathname = url.pathname.replace(/\/+$/, "");
  }

  return url.toString();
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

  if (name.includes("/") && normalizedPublisher !== "community") {
    tags.add("publisher-namespaced");
  }

  tags.add("namespaced");

  return [...tags].filter(Boolean).sort();
}

function buildSourceMetadata(source) {
  return {
    sourceType: source.sourceType,
    trustLevel: source.trustLevel,
    riskFlags: [...source.riskFlags].sort(),
  };
}

function parseAwesomeMarkdown(content, source) {
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
    const normalizedUrl = normalizeUrl(url);

    skills.push({
      slug: slugify(name),
      name,
      url: normalizedUrl,
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
      sourceId: source.id,
      sourceIds: [source.id],
      ...buildSourceMetadata(source),
    });
  }

  return skills;
}

function parseRemoteHtml(content, source) {
  const baseUrl = source.url;
  const skillAnchors = new Map();
  const linkPattern = new RegExp(source.linkPattern, "i");
  const anchorRegex =
    /<a\b[^>]*href=(["'])([^"'#>]+)\1[^>]*>([\s\S]*?)<\/a>/gi;
  const descriptionPattern = source.descriptionPattern
    ? new RegExp(source.descriptionPattern, "i")
    : null;

  for (const match of content.matchAll(anchorRegex)) {
    const [, , href, innerHtml] = match;
    let normalizedUrl;

    try {
      normalizedUrl = normalizeUrl(href, baseUrl);
    } catch {
      continue;
    }

    const url = new URL(normalizedUrl);
    const pathMatch = url.pathname.match(linkPattern);

    if (!pathMatch) continue;

    const [, publisherSegment, skillSegment] = pathMatch;
    const name = `${publisherSegment}/${skillSegment}`;
    const publisher = publisherSegment;
    const publisherSlug = slugify(publisher);
    const sectionTitle = source.sectionTitle;
    const sectionSlug = slugify(sectionTitle);
    const descriptionMatch = descriptionPattern ? innerHtml.match(descriptionPattern) : null;
    const text = descriptionMatch ? decodeEscapedString(stripHtml(descriptionMatch[1])) : stripHtml(innerHtml);
    const fallbackDescription = source.descriptionFallback;
    const description = text && text !== name ? text : fallbackDescription;

    const existing = skillAnchors.get(normalizedUrl);
    if (existing && existing.description !== fallbackDescription) {
      continue;
    }

    skillAnchors.set(normalizedUrl, {
      slug: slugify(name),
      name,
      url: normalizedUrl,
      description,
      publisher,
      publisherSlug,
      sectionTitle,
      sectionSlug,
      kind: source.kind,
      tags: inferTags({
        name,
        description,
        publisher,
        publisherSlug,
        sectionTitle,
        sectionSlug,
      }),
      sourceId: source.id,
      sourceIds: [source.id],
      ...buildSourceMetadata(source),
    });
  }

  return [...skillAnchors.values()];
}

function parseMarketplaceApi(items, source) {
  const skills = [];
  const seen = new Set();

  for (const item of items) {
    const publisher = item.ownerHandle || item.owner?.handle || "clawhub";
    const slug = item.skill?.slug || item.slug;
    const summary =
      item.latestVersion?.parsed?.description ||
      item.skill?.summary ||
      item.description ||
      item.summary ||
      source.descriptionFallback;
    if (!slug) continue;

    const publisherSlug = slugify(publisher);
    const name = `${publisher}/${slug}`;
    const url = normalizeUrl(`/${publisher}/${slug}`, "https://clawhub.ai");
    if (seen.has(url)) continue;
    seen.add(url);

    const sectionTitle = source.sectionTitle;
    const sectionSlug = slugify(sectionTitle);
    const description = decodeEscapedString(summary) || source.descriptionFallback;

    skills.push({
      slug: slugify(name),
      name,
      url,
      description,
      publisher,
      publisherSlug,
      sectionTitle,
      sectionSlug,
      kind: source.kind,
      tags: inferTags({
        name,
        description,
        publisher,
        publisherSlug,
        sectionTitle,
        sectionSlug,
      }),
      sourceId: source.id,
      sourceIds: [source.id],
      ...buildSourceMetadata(source),
    });
  }

  return skills;
}

async function collectMarketplaceApiItems(source) {
  const items = [];
  let nextCursor = null;
  let warning = null;

  for (let page = 0; page < source.maxPages; page += 1) {
    const payload = {
      path: "skills:listPublicPageV4",
      format: "convex_encoded_json",
      args: [
        {
          dir: "desc",
          numItems: source.pageSize,
          sort: "downloads",
          ...(nextCursor ? { cursor: nextCursor } : {}),
        },
      ],
    };

    const response = await fetch(source.url, {
      method: "POST",
      headers: {
        Accept: "*/*",
        "accept-language": "zh-CN,zh;q=0.9,en-US;q=0.8,en;q=0.7",
        "content-type": "application/json",
        "convex-client": "npm-1.41.0",
        Origin: "https://clawhub.ai",
        Referer: "https://clawhub.ai/",
        "User-Agent": "awesome-agent-skills-web",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      if (items.length > 0 && response.status >= 500) {
        warning = `Stopped after partial ClawHub fetch at page ${page + 1}: HTTP ${response.status}`;
        break;
      }

      throw new Error(`Failed to fetch ${source.url}: HTTP ${response.status}`);
    }

    const responsePayload = await response.json();
    const value = responsePayload?.value;
    if (!Array.isArray(value?.page)) {
      break;
    }

    items.push(...value.page);

    if (!value.nextCursor) {
      break;
    }

    nextCursor = value.nextCursor;
  }

  return { items, warning };
}

function parseGithubRepoExpansion(items, source) {
  const skills = [];

  for (const item of items) {
    if (!item?.repository || !item?.url || !item?.path || !item?.skillName) continue;

    const repository = item.repository;
    const repoOwner = repository.split("/")[0];
    const name = `${repoOwner}/${item.skillName}`;
    const publisher = repoOwner;
    const publisherSlug = slugify(publisher);
    const sectionTitle = source.sectionTitle;
    const sectionSlug = slugify(sectionTitle);
    const description = item.description || `${source.descriptionFallback}: ${repository}`;

    skills.push({
      slug: slugify(name),
      name,
      url: normalizeUrl(item.url),
      description,
      publisher,
      publisherSlug,
      sectionTitle,
      sectionSlug,
      kind: source.kind,
      tags: inferTags({
        name,
        description,
        publisher,
        publisherSlug,
        sectionTitle,
        sectionSlug,
      }),
      sourceId: source.id,
      sourceIds: [source.id],
      repository,
      discoveryPath: item.path,
      ...buildSourceMetadata(source),
    });
  }

  return skills;
}

function extractGithubRepositories(skills) {
  return [
    ...new Set(
      skills
        .map((skill) => {
          const match = skill.url.match(/^https:\/\/github\.com\/([^/]+\/[^/]+)/i);
          return match ? match[1] : null;
        })
        .filter(Boolean),
    ),
  ].sort();
}

function readGithubSkillRepoSeed() {
  if (!Array.isArray(githubSkillReposSeed)) {
    throw new Error("GitHub skill repo seed config must be an array.");
  }

  return githubSkillReposSeed.filter(
    (value) => typeof value === "string" && /^[^/]+\/[^/]+$/.test(value),
  );
}

function readGithubRepoExpansionCache() {
  try {
    const payload = readJson(githubSkillRepoCachePath);
    return Array.isArray(payload.items) ? payload.items : [];
  } catch {
    return [];
  }
}

function writeGithubRepoExpansionCache(items) {
  mkdirSync(outputDir, { recursive: true });
  writeFileSync(
    githubSkillRepoCachePath,
    `${JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        totalItems: items.length,
        items,
      },
      null,
      2,
    )}\n`,
  );
}

async function collectGithubRepoExpansionEntries(existingEntries, source) {
  const seeded = readGithubSkillRepoSeed();
  const autoDiscovered = extractGithubRepositories(existingEntries).slice(
    0,
    Math.max(0, source.maxRepositories - seeded.length),
  );
  const repositories = [...new Set([...seeded, ...autoDiscovered])].slice(0, source.maxRepositories);
  const discoveredEntries = [];

  for (const repository of repositories) {
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

        discoveredEntries.push({
          repository: repoFullName,
          skillName,
          path: `skills/${skillName}/SKILL.md`,
          url: `https://github.com/${repoFullName}/blob/main/skills/${skillName}/SKILL.md`,
          description: `${source.descriptionFallback}: ${repoFullName}`,
        });
      }
    } catch {
      continue;
    }
  }

  return discoveredEntries;
}

function mergeSkillRecords(existing, incoming) {
  const existingDescription =
    existing.description && existing.description !== "Skill listed on officialskills.sh";
  const incomingDescription =
    incoming.description && incoming.description !== "Skill listed on officialskills.sh";
  const existingPriority = sourcePriority.get(existing.sourceId) ?? 0;
  const incomingPriority = sourcePriority.get(incoming.sourceId) ?? 0;
  const preferred = incomingPriority > existingPriority ? incoming : existing;
  const secondary = preferred === existing ? incoming : existing;

  return {
    ...secondary,
    ...preferred,
    description:
      incomingDescription && !existingDescription
        ? incoming.description
        : existing.description,
    tags: [...new Set([...existing.tags, ...incoming.tags])].sort(),
    sourceIds: [...new Set([...(existing.sourceIds ?? [existing.sourceId]), ...(incoming.sourceIds ?? [incoming.sourceId])])].sort(),
    riskFlags: [...new Set([...(existing.riskFlags ?? []), ...(incoming.riskFlags ?? [])])].sort(),
    trustLevel:
      existing.trustLevel === "official" || incoming.trustLevel === "official"
        ? "official"
        : existing.trustLevel === "curated" || incoming.trustLevel === "curated"
          ? "curated"
          : incoming.trustLevel ?? existing.trustLevel,
  };
}

async function readSourceContent(source) {
  if (source.transport === "local") {
    const sourcePath = path.resolve(projectRoot, source.path);
    return readFileSync(sourcePath, "utf8");
  }

  if (source.transport === "remote") {
    const response = await fetch(source.url, {
      headers: {
        Accept: "text/plain, text/markdown;q=0.9, */*;q=0.1",
        "User-Agent": "awesome-agent-skills-web",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch ${source.url}: HTTP ${response.status}`);
    }

    return await response.text();
  }

  throw new Error(`Unsupported source transport: ${source.transport}`);
}

async function collectSkills() {
  const allEntries = [];
  const failures = [];

  for (const source of skillSources.filter((item) => item.enabled)) {
    try {
      let skills = [];

      if (source.parser === "awesome-markdown") {
        const content = await readSourceContent(source);
        skills = parseAwesomeMarkdown(content, source);
      } else if (source.parser === "remote-html") {
        const content = await readSourceContent(source);
        skills = parseRemoteHtml(content, source);
      } else if (source.parser === "marketplace-api") {
        const result = await collectMarketplaceApiItems(source);
        skills = parseMarketplaceApi(result.items, source);
        if (result.warning) {
          failures.push({
            sourceId: source.id,
            label: source.label,
            reason: result.warning,
          });
        }
      } else if (source.parser === "github-repo-expansion") {
        const entries = readGithubRepoExpansionCache();
        skills = parseGithubRepoExpansion(entries, source);
      } else {
        throw new Error(`Unsupported source parser: ${source.parser}`);
      }

      allEntries.push(...skills);
    } catch (error) {
      failures.push({
        sourceId: source.id,
        label: source.label,
        reason: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  const deduped = new Map();

  for (const skill of allEntries) {
    const key = skill.slug;
    const existing = deduped.get(key);

    if (!existing) {
      deduped.set(key, skill);
      continue;
    }

    deduped.set(key, mergeSkillRecords(existing, skill));
  }

  return {
    skills: [...deduped.values()],
    failures,
  };
}

const { skills, failures } = await collectSkills();

mkdirSync(outputDir, { recursive: true });
writeFileSync(
  outputPath,
  `${JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      totalSkills: skills.length,
      sourceCount: skillSources.filter((source) => source.enabled).length,
      failures,
      skills,
    },
    null,
    2,
  )}\n`,
);

console.log(`Generated ${skills.length} skills at ${path.relative(projectRoot, outputPath)}`);

if (failures.length > 0) {
  console.log("Source failures:");
  for (const failure of failures) {
    console.log(`- ${failure.sourceId}: ${failure.reason}`);
  }
}
